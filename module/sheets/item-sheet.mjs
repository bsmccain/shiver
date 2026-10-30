const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * The Item sheet for every SHIVER item type.
 * @extends {ItemSheetV2}
 */
export class shiverItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["shiver", "sheet", "item", "themed", "theme-light"],
    position: { width: 560, height: 600 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      use: shiverItemSheet.#onUse
    }
  };

  /** @override */
  static PARTS = {
    sheet: { template: "systems/shiver/templates/item/item-sheet.hbs", scrollable: [".sheet-body"] }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [{ id: "description" }, { id: "details" }, { id: "rules" }],
      initial: "details",
      labelPrefix: "shiver.Tab"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.item;
    const sys = item.system;
    context.item = item;
    context.system = sys;
    context.flags = item.flags;
    context.systemFields = sys.schema.fields;
    context.rollData = item.getRollData();
    context.isGM = game.user.isGM;
    context.type = item.type;
    context[`is_${item.type}`] = true;
    context.enrichDescription = await TextEditor.enrichHTML(sys.description, { rollData: context.rollData, relativeTo: item, secrets: item.isOwner });
    if ( item.type === "background" ) {
      context.enrichAbility = await TextEditor.enrichHTML(sys.abilityDescription, { relativeTo: item });
      context.enrichFlaw = await TextEditor.enrichHTML(sys.flawDescription, { relativeTo: item });
    }
    const opt = (obj, selected) => Object.entries(obj).map(([k, v]) => ({ key: k, label: game.i18n.localize(typeof v === "string" ? v : v.label), selected: k === selected }));
    context.skillOptions = opt(CONFIG.shiver.skills, sys.skill ?? sys.attack?.skill);
    context.attackSkillOptions = [{ key: "", label: "—", selected: !sys.attack?.skill }, ...opt(CONFIG.shiver.skills, sys.attack?.skill)];
    context.damageOptions = opt(CONFIG.shiver.damageTypes, sys.damageType ?? sys.attack?.damageType);
    context.rangeOptions = opt(CONFIG.shiver.ranges, sys.range ?? sys.attack?.range);
    context.actionOptions = opt(CONFIG.shiver.actionCosts, sys.action);
    context.usesOptions = opt({ always: "shiver.Frequency.always", ...Object.fromEntries(Object.entries(CONFIG.shiver.frequencies).filter(([k]) => k !== "always")) }, sys.uses?.per);
    context.altSkills = Object.entries(CONFIG.shiver.skills).map(([k, v]) => ({ key: k, label: game.i18n.localize(v.label), checked: sys.altSkills?.has?.(k) }));
    context.altDamage = Object.entries(CONFIG.shiver.damageTypes).map(([k, v]) => ({ key: k, label: game.i18n.localize(v.label), checked: sys.altDamageTypes?.has?.(k) }));
    context.properties = [...(sys.properties ?? [])].join(", ");
    context.automationJSON = JSON.stringify(sys.automation ?? [], null, 1);
    context.flawAutomationJSON = sys.flawAutomation ? JSON.stringify(sys.flawAutomation, null, 1) : null;
    context.ruleSummaries = (sys.automation ?? []).map(r => describeRule(r));
    context.flawRuleSummaries = (sys.flawAutomation ?? []).map(r => describeRule(r));
    context.archetypeName = CONFIG.shiver.archetypes?.[sys.archetype]?.name ?? sys.archetype;
    return context;
  }

  /** @inheritDoc */
  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);
    const sys = data.system ?? {};
    for ( const key of ["automation", "flawAutomation"] ) {
      const raw = sys[`${key}JSON`];
      if ( typeof raw === "string" ) {
        try {
          const parsed = JSON.parse(raw || "[]");
          if ( Array.isArray(parsed) ) sys[key] = parsed;
        } catch(err) {
          ui.notifications.error(game.i18n.format("shiver.Item.badJSON", { error: err.message }));
        }
        delete sys[`${key}JSON`];
      }
    }
    if ( typeof sys.propertiesText === "string" ) {
      sys.properties = sys.propertiesText.split(",").map(s => s.trim()).filter(Boolean);
      delete sys.propertiesText;
    }
    for ( const [key, field] of [["altSkillSet", "altSkills"], ["altDamageSet", "altDamageTypes"]] ) {
      if ( sys[key] ) {
        sys[field] = Object.entries(sys[key]).filter(([, v]) => v).map(([k]) => k);
        delete sys[key];
      }
    }
    return data;
  }

  /** @this {shiverItemSheet} */
  static #onUse() {
    return this.item.roll();
  }
}

/**
 * A short readable description of an automation rule.
 * @param {object} r
 * @returns {string}
 */
export function describeRule(r) {
  const when = r.when ? ` (${typeof r.when === "string" ? r.when : (r.when.label ?? JSON.stringify(r.when))})` : "";
  const skill = s => s && s !== "any" ? game.i18n.localize(CONFIG.shiver.skills[s]?.label ?? s) : game.i18n.localize("shiver.Rule.anySkill");
  switch ( r.kind ) {
    case "poolDice": return `+${r.d6 ? `${r.d6}d6` : ""}${r.d8 ? ` ${r.d8}d8` : ""} ${skill(r.skill)}${when}`;
    case "extraSuccessFaces": return `${(r.countsAs ?? []).map(skill).join(", ")} → ${skill(r.rollSkill)}${when}`;
    case "skillPoints": return `+${r.amount} ${skill(r.skill)} ${game.i18n.localize("shiver.Sheet.skill")}`;
    case "talentPoints": return `+${r.amount} ${skill(r.skill)} ${game.i18n.localize("shiver.Sheet.talent")}`;
    case "damageReductionRoll": return `${game.i18n.localize("shiver.Rule.soak")}: ${r.set ? `=${r.set}` : `+${r.dice}`}d6 (${skill(r.face)})${when}`;
    case "custom": return r.note;
    default: return `${r.kind}${r.status ? `: ${r.status}` : ""}${r.amount !== undefined ? ` ${r.amount}` : ""}${r.types ? `: ${r.types.join(", ")}` : ""}${when}`;
  }
}
