import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { ArchetypeTree, chooseArchetype } from "../apps/archetype-tree.mjs";
import { usesRemaining } from "../documents/actor-actions.mjs";
import { actionAllowance, actionsUsed, combatantFor, markAction, setCombatantFlag } from "../combat/actions.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * The tabs shown on each type of Actor sheet.
 * @type {Record<string, ApplicationTabsConfiguration>}
 */
const ACTOR_TABS = {
  character: {
    tabs: [{ id: "skills" }, { id: "combat" }, { id: "abilities" }, { id: "items" }, { id: "description" }, { id: "effects" }],
    initial: "skills",
    labelPrefix: "shiver.Tab"
  },
  npc: {
    tabs: [{ id: "description" }, { id: "attacks" }, { id: "abilities" }, { id: "reactions" }, { id: "effects" }],
    initial: "description",
    labelPrefix: "shiver.Tab"
  }
};

/**
 * Wrap a sheet action so that it does nothing unless the sheet is editable.
 * @param {Function} handler
 * @returns {Function}
 */
function editableOnly(handler) {
  return function(event, target) {
    if ( !this.isEditable ) return;
    return handler.call(this, event, target);
  };
}

/**
 * The Actor sheet used for both characters and NPCs.
 * @extends {ActorSheetV2}
 */
export class shiverActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["shiver", "sheet", "actor", "themed", "theme-light"],
    position: { width: 760, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      editItem: shiverActorSheet.#onEditItem,
      toggleDescription: shiverActorSheet.#onToggleDescription,
      createItem: editableOnly(shiverActorSheet.#onCreateItem),
      deleteItem: editableOnly(shiverActorSheet.#onDeleteItem),
      itemToChat: shiverActorSheet.#onItemToChat,
      useItem: editableOnly(shiverActorSheet.#onUseItem),
      roll: editableOnly(shiverActorSheet.#onRoll),
      setFear: editableOnly(shiverActorSheet.#onSetFear),
      fearCheck: editableOnly(shiverActorSheet.#onFearCheck),
      setLuck: editableOnly(shiverActorSheet.#onSetLuck),
      setWounds: editableOnly(shiverActorSheet.#onSetWounds),
      setArmourHp: editableOnly(shiverActorSheet.#onSetArmourHp),
      toggleEquipped: editableOnly(shiverActorSheet.#onToggleEquipped),
      reload: editableOnly(shiverActorSheet.#onReload),
      takeAim: editableOnly(shiverActorSheet.#onTakeAim),
      removeStatus: editableOnly(shiverActorSheet.#onRemoveStatus),
      statusValue: editableOnly(shiverActorSheet.#onStatusValue),
      infectionType: editableOnly(shiverActorSheet.#onInfectionType),
      toggleStatus: editableOnly(shiverActorSheet.#onToggleStatus),
      standUp: editableOnly(shiverActorSheet.#onStandUp),
      deathsDoor: editableOnly(shiverActorSheet.#onDeathsDoor),
      stabilise: editableOnly(shiverActorSheet.#onStabilise),
      combatAction: editableOnly(shiverActorSheet.#onCombatAction),
      escape: editableOnly(shiverActorSheet.#onEscape),
      grapple: editableOnly(shiverActorSheet.#onGrapple),
      openTree: shiverActorSheet.#onOpenTree,
      chooseArchetype: editableOnly(shiverActorSheet.#onChooseArchetype),
      resetUses: editableOnly(shiverActorSheet.#onResetUses),
      clearNightmare: editableOnly(shiverActorSheet.#onClearNightmare),
      rollReaction: shiverActorSheet.#onRollReaction,
      manageEffect: editableOnly(shiverActorSheet.#onManageEffect)
    }
  };

  /** @override */
  static PARTS = {
    character: {
      template: "systems/shiver/templates/actor/actor-character-sheet.html",
      scrollable: [".sheet-body"]
    },
    npc: {
      template: "systems/shiver/templates/actor/actor-npc-sheet.html",
      scrollable: [".sheet-body"]
    }
  };

  /** @override */
  static TABS = { primary: {} };

  /**
   * The IDs of items whose descriptions are currently expanded on the sheet.
   * @type {Set<string>}
   */
  #expanded = new Set();

  /* -------------------------------------------- */

  /** @override */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    return { [this.actor.type]: parts[this.actor.type] };
  }

  /** @override */
  _getTabsConfig(group) {
    if ( group === "primary" ) return ACTOR_TABS[this.actor.type];
    return super._getTabsConfig(group);
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const rollData = actor.getRollData();
    context.actor = actor;
    context.system = actor.system;
    context.flags = actor.flags;
    context.rollData = rollData;
    context.config = CONFIG.shiver;
    context.isGM = game.user.isGM;

    await this._prepareItems(context);
    this._prepareStatuses(context);
    if ( actor.type === "character" ) this._prepareCharacterData(context);
    else this._prepareNpcData(context);
    this._prepareCombat(context);

    context.effects = prepareActiveEffectCategories(actor.effects.filter(e => !e.statuses.size || e.statuses.size > 1));
    const enrichOptions = { rollData, relativeTo: actor, secrets: actor.isOwner };
    context.systemFields = actor.system.schema.fields;
    context.enrichBio = await TextEditor.enrichHTML(actor.system.biography, enrichOptions);
    context.enrichNotes = await TextEditor.enrichHTML(actor.system.notes ?? "", enrichOptions);
    context.description = await TextEditor.enrichHTML(actor.system.description ?? "", enrichOptions);
    context.speedOptions = Object.entries(CONFIG.shiver.speeds).map(([k, v]) => ({ key: k, label: game.i18n.localize(v.label), selected: actor.system.speed.base === k }));
    context.sizeOptions = Object.entries(CONFIG.shiver.sizes).map(([k, v]) => ({ key: k, label: game.i18n.localize(v.label), selected: actor.system.size === k }));
    context.damageTypes = Object.entries(CONFIG.shiver.damageTypes).map(([k, v]) => ({ key: k, label: game.i18n.localize(v.label) }));
    return context;
  }

  /**
   * Character skills, Luck Bank, Fear Status and Lifeline.
   * @param {object} context
   */
  _prepareCharacterData(context) {
    const actor = this.actor;
    const system = actor.system;
    const archetype = CONFIG.shiver.archetypes?.[system.attributes.archetype];
    context.archetype = archetype;
    context.hybrids = system.attributes.hybrids.map(id => CONFIG.shiver.archetypes?.[id]?.name ?? id);
    context.abilities = Object.entries(CONFIG.shiver.skills).map(([key, skill]) => {
      const a = system.abilities[key];
      return {
        key,
        label: game.i18n.localize(skill.label),
        img: skill.img,
        skill: a.skill,
        talent: a.talent,
        modified: (a.skill.total !== a.skill.base) || (a.talent.total !== a.talent.base),
        deficiency: system.attributes.deficiency === key,
        weakened: system.penalties?.weakened && (system.nightmare.weakened === key),
        trauma: system.penalties?.trauma && (system.nightmare.traumaSkill === key)
      };
    });

    // Fear Status (p.96).
    const fear = actor.fearLevel;
    context.fearLevels = CONFIG.shiver.fearLevels.map((key, value) => ({
      key, value, label: game.i18n.localize(`shiver.Fear.${key}`), active: fear === value
    }));
    context.fearLevel = fear;

    // Luck Bank pips (p.20).
    const bank = actor.luckBank;
    context.luckPips = Array.from({ length: Math.max(bank.max, 1) }, (_, i) => ({ index: i + 1, filled: i < bank.value }));

    // The Lifeline: wounds are marked from the left (p.14). Quarter marks show the Nightmare penalties (p.15).
    const max = system.hp.max;
    const wounds = system.hp.max - system.hp.value;
    const quarters = system.lifelineQuarters;
    context.lifeline = Array.from({ length: max }, (_, i) => ({
      index: i + 1,
      wounded: i < wounds,
      quarter: quarters.indexOf(i + 1) >= 0 ? CONFIG.shiver.lifelineQuarters[quarters.indexOf(i + 1)] : null
    }));
    context.wounds = wounds;
    context.nightmare = game.settings.get("shiver", "modeOfPlay") === "nightmare";
    context.modeLabel = game.i18n.localize(`shiver.Settings.modeOfPlay.${game.settings.get("shiver", "modeOfPlay")}`);
    context.penalties = Object.entries(system.penalties ?? {}).filter(([, v]) => v).map(([k]) => game.i18n.localize(`shiver.Nightmare.${k}`));
    context.atDeathsDoor = actor.hasStatus("deathsDoor");
    context.isDead = actor.hasStatus("dead");
    context.points = system.attributes.abilityPoints;
    context.levelOptions = Array.from({ length: 16 }, (_, i) => ({ value: i, selected: i === system.attributes.level.value }));
  }

  /**
   * NPC skills, Deathcon and reactions.
   * @param {object} context
   */
  _prepareNpcData(context) {
    const system = this.actor.system;
    context.skills = Object.entries(CONFIG.shiver.skills).map(([key, skill]) => ({
      key, label: game.i18n.localize(skill.label), img: skill.img, ...system.skills[key]
    }));
    context.deathconOptions = Object.entries(CONFIG.shiver.deathcon).map(([k, v]) => ({ key: k, label: game.i18n.localize(v.label), selected: system.deathcon === k }));
    context.reactionOptions = Object.entries(CONFIG.shiver.reactionTables).map(([k, v]) => ({ key: k, label: game.i18n.localize(v.label), selected: system.reaction === k }));
    context.stateOptions = Object.entries(CONFIG.shiver.combatStates).map(([k, v]) => ({ key: k, label: game.i18n.localize(v.label), selected: system.combatState === k }));
    const table = CONFIG.shiver.reactionTables[system.reaction];
    const deathcon = CONFIG.shiver.deathcon[system.deathcon];
    context.reactionRows = [1, 2, 3, 4, 5, 6].map(face => {
      const symbol = CONFIG.shiver.skillDieFaces[face];
      return {
        face, symbol,
        img: CONFIG.shiver.skills[symbol].icon,
        label: game.i18n.localize(CONFIG.shiver.skills[symbol].label),
        active: deathcon?.faces.includes(symbol),
        standard: table?.faces?.[face] ?? "",
        custom: system.reactions[face] ?? ""
      };
    });
    context.damageMods = ["immune", "resistant", "weak"].map(key => ({
      key,
      label: game.i18n.localize(`shiver.Damage.${key}`),
      notes: system.damage[`${key}Notes`],
      types: [...Object.keys(CONFIG.shiver.damageTypes), "silver", "holy", "fear"].map(t => ({
        key: t,
        label: CONFIG.shiver.damageTypes[t] ? game.i18n.localize(CONFIG.shiver.damageTypes[t].label) : game.i18n.localize(`shiver.Damage.${t}`),
        checked: system.damage[key].has(t)
      }))
    }));
  }

  /**
   * Status effects with their rules, for the combat tab.
   * @param {object} context
   */
  _prepareStatuses(context) {
    const actor = this.actor;
    context.statuses = CONFIG.statusEffects.map(s => {
      const effect = actor.statusEffect(s.id);
      const rules = s.flags?.shiver?.rules ?? {};
      return {
        id: s.id, img: s.img, label: game.i18n.localize(s.name),
        active: !!effect, valued: !!rules.valued, value: effect ? actor.statusValue(s.id) : 0,
        removable: !!rules.removal, standUp: !!rules.standUp,
        hint: game.i18n.localize(`shiver.StatusHint.${s.id}`),
        infection: (s.id === "infected" && effect) ? game.i18n.localize(CONFIG.shiver.infections[effect.flags?.shiver?.infection ?? "other"]?.label ?? "") : null
      };
    });
    context.activeStatuses = context.statuses.filter(s => s.active);
  }

  /**
   * Combat actions this turn.
   * @param {object} context
   */
  _prepareCombat(context) {
    const actor = this.actor;
    const combatant = combatantFor(actor);
    context.inCombat = !!combatant;
    if ( !combatant ) return;
    const allow = actionAllowance(actor);
    const used = actionsUsed(actor);
    context.combatActions = Object.entries(CONFIG.shiver.actions).map(([k, cfg]) => ({
      key: k, icon: cfg.icon, label: game.i18n.localize(cfg.label), used: used[k], max: allow[k], spent: used[k] >= allow[k]
    }));
    const state = CONFIG.Combat.documentClass.stateOf?.(combatant);
    context.combatState = state ? game.i18n.localize(CONFIG.shiver.combatStates[state].label) : "";
  }

  /**
   * Organize and classify Items for the sheet.
   * @param {object} context
   */
  async _prepareItems(context) {
    const groups = { weapon: [], armour: [], item: [], ability: [], background: [], flaw: [], power: [], trait: [] };
    for ( const item of this.actor.items.contents.sort((a, b) => (a.system.tier ?? 0) - (b.system.tier ?? 0) || (a.sort - b.sort)) ) {
      const uses = usesRemaining(item);
      const sys = item.system;
      const i = {
        _id: item.id,
        id: item.id,
        name: item.name,
        type: item.type,
        img: item.img || Item.implementation.DEFAULT_ICON,
        system: sys,
        isAttack: item.isAttack,
        uses,
        usesLabel: uses.limited ? `${uses.remaining}/${uses.max}` : "",
        expanded: this.#expanded.has(item.id),
        actionLabel: sys.action && (sys.action !== "passive") ? game.i18n.localize(CONFIG.shiver.actionCosts[sys.action] ?? sys.action) : "",
        skillLabel: sys.skill ? game.i18n.localize(CONFIG.shiver.skills[sys.skill]?.label ?? sys.skill) : "",
        damageTypeLabel: sys.damageType ? game.i18n.localize(CONFIG.shiver.damageTypes[sys.damageType]?.label ?? sys.damageType) : "",
        rangeLabel: sys.range ? `${game.i18n.localize(CONFIG.shiver.ranges[sys.range]?.label ?? sys.range)}` : "",
        needsReload: !!item.getFlag("shiver", "needsReload"),
        lost: ["ability", "background"].includes(item.type) && (sys.active === false),
        aimed: !!item.getFlag("shiver", "aimed"),
        canAim: !!sys.automation?.some(r => r.kind === "custom" && /take aim/i.test(r.note ?? "")) || sys.properties?.has?.("takeAim"),
        customNotes: [...(sys.automation ?? []), ...(sys.flawAutomation ?? [])].filter(r => r.kind === "custom").map(r => r.note),
        canUse: item.isAttack || (sys.action && (sys.action !== "passive")) || !!sys.doom || uses.limited
          || [...(sys.automation ?? []), ...(sys.flawAutomation ?? [])].some(r => ["applyStatus", "removeStatus", "heal", "check", "doom", "cost", "fearStep", "luck"].includes(r.kind)),
        slotPips: item.type === "armour" ? sys.slotHp.map((hp, s) => ({ slot: s, pips: Array.from({ length: sys.hpPerSlot }, (_, p) => ({ index: p + 1, filled: p < hp })) })) : null
      };
      if ( item.type === "ability" && sys.attack?.skill ) {
        i.attackLabel = `${game.i18n.localize(CONFIG.shiver.skills[sys.attack.skill]?.label ?? "")} · ${sys.attack.damage} ${game.i18n.localize(CONFIG.shiver.damageTypes[sys.attack.damageType]?.label ?? "")}`;
      }
      if ( i.expanded ) {
        i.enrichDescription = await TextEditor.enrichHTML(sys.description ?? "", { rollData: item.getRollData(), relativeTo: item, secrets: item.isOwner });
      }
      (groups[item.type] ?? groups.item).push(i);
    }
    context.weapons = groups.weapon;
    context.armour = groups.armour;
    context.gear = groups.item;
    context.backgrounds = groups.background;
    context.flaws = groups.flaw;
    context.powers = groups.power;
    context.traits = groups.trait;
    // Abilities grouped by archetype, then tier.
    const byArchetype = new Map();
    for ( const a of groups.ability ) {
      const key = a.system.archetype || "other";
      if ( !byArchetype.has(key) ) byArchetype.set(key, { key, name: CONFIG.shiver.archetypes?.[key]?.name ?? game.i18n.localize("shiver.Ability.other"), items: [] });
      byArchetype.get(key).items.push(a);
    }
    context.abilityGroups = [...byArchetype.values()];
    context.attacks = [...groups.weapon.filter(w => w.system.equipped), ...groups.power, ...groups.ability.filter(a => a.isAttack)];
    const sys = this.actor.system;
    if ( this.actor.type === "character" ) {
      const armourSlots = groups.armour.filter(a => a.system.equipped).reduce((n, a) => n + a.system.slots, 0);
      const weapons = groups.weapon.filter(w => w.system.equipped && !w.system.unarmed && !w.system.properties?.has?.("punchUp")).length;
      context.slotUsage = {
        armour: armourSlots, armourMax: sys.slots.armour, armourOver: armourSlots > sys.slots.armour,
        weapons, weaponsMax: sys.slots.weapons, weaponsOver: weapons > sys.slots.weapons
      };
    }
  }

  /* -------------------------------------------- */

  /**
   * Get the owned Item which a sheet element belongs to.
   * @param {HTMLElement} target
   * @returns {Item|undefined}
   */
  _getItem(target) {
    const li = target.closest("[data-item-id]");
    return this.actor.items.get(li?.dataset.itemId);
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    for ( const li of this.element.querySelectorAll("li.item[data-item-id], li.effect[data-effect-id]") ) {
      li.classList.add("draggable");
    }
    await super._onRender(context, options);
  }

  /** @inheritDoc */
  async _onDropItem(event, item) {
    // Dropping a Background replaces the old one.
    if ( (item.type === "background") && this.actor.isOwner && (item.parent !== this.actor) ) {
      const old = this.actor.itemTypes.background.map(b => b.id);
      if ( old.length ) await this.actor.deleteEmbeddedDocuments("Item", old);
      await this.actor.update({ "system.attributes.background": item.name });
    }
    return super._onDropItem(event, item);
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static async #onCreateItem(event, target) {
    const type = target.dataset.type;
    const name = game.i18n.format("shiver.NewItem", { type: game.i18n.localize(`TYPES.Item.${type}`) });
    return Item.implementation.create({ name, type }, { parent: this.actor });
  }

  static #onEditItem(event, target) {
    this._getItem(target)?.sheet.render(true);
  }

  static async #onDeleteItem(event, target) {
    const item = this._getItem(target);
    if ( !item ) return;
    const ok = await DialogV2.confirm({ window: { title: item.name }, content: `<p>${game.i18n.localize("shiver.ConfirmDelete")}</p>` });
    if ( !ok ) return;
    this.#expanded.delete(item.id);
    return item.delete();
  }

  static #onItemToChat(event, target) {
    return this._getItem(target)?.toChat();
  }

  static #onUseItem(event, target) {
    return this._getItem(target)?.roll();
  }

  static #onToggleDescription(event, target) {
    const item = this._getItem(target);
    if ( !item ) return;
    if ( this.#expanded.has(item.id) ) this.#expanded.delete(item.id);
    else this.#expanded.add(item.id);
    this.render();
  }

  /** Roll a Skill Check. */
  static #onRoll(event, target) {
    const skill = target.dataset.skill;
    const tags = target.dataset.tags ? target.dataset.tags.split(",") : [];
    // A successful Stealth or Hide check puts the character in Stealth or Hiding (p.27).
    const status = tags.includes("stealth") ? "stealth" : (tags.includes("hide") ? "hidden" : null);
    const label = status ? game.i18n.localize(`shiver.Quick.${status === "stealth" ? "stealth" : "hide"}`) : undefined;
    if ( skill ) return this.actor.rollCheck(skill, { tags, label, extra: status ? { onSuccessStatus: status } : null });
  }

  static #onSetFear(event, target) {
    return this.actor.setFearLevel(Number(target.dataset.level));
  }

  static #onFearCheck(event, target) {
    return this.actor.rollFearCheck({ purpose: target.dataset.purpose ?? "resist" });
  }

  static #onSetLuck(event, target) {
    const n = Number(target.dataset.index);
    const value = this.actor.system.attributes.luck.value;
    return this.actor.update({ "system.attributes.luck.value": value >= n ? n - 1 : n });
  }

  /** Click a Lifeline box to mark wounds up to it (or clear back to it). */
  static #onSetWounds(event, target) {
    const n = Number(target.dataset.index);
    const max = this.actor.system.hp.max;
    const wounds = max - this.actor.system.hp.value;
    const next = wounds >= n ? n - 1 : n;
    return this.actor.update({ "system.hp.value": max - next });
  }

  static #onSetArmourHp(event, target) {
    const item = this._getItem(target);
    if ( !item ) return;
    const slot = Number(target.dataset.slot);
    const n = Number(target.dataset.index);
    const hp = [...item.system.slotHp];
    hp[slot] = hp[slot] >= n ? n - 1 : n;
    return item.update({ "system.slotHp": hp });
  }

  static async #onToggleEquipped(event, target) {
    const item = this._getItem(target);
    if ( !item ) return;
    // Two weapons and three Armour Slots (p.16, p.128) are enforced when the item updates.
    return item.update({ "system.equipped": !item.system.equipped });
  }

  static async #onReload(event, target) {
    const item = this._getItem(target);
    if ( !item ) return;
    await item.update({ "flags.shiver.needsReload": false });
    await markAction(this.actor, "interact");
  }

  static async #onTakeAim(event, target) {
    const item = this._getItem(target);
    if ( !item ) return;
    await item.update({ "flags.shiver.aimed": true });
    await markAction(this.actor, "interact");
  }

  static #onRemoveStatus(event, target) {
    return this.actor.rollRemoveStatus(target.closest("[data-status]").dataset.status);
  }

  static async #onStatusValue(event, target) {
    const id = target.closest("[data-status]").dataset.status;
    const effect = this.actor.statusEffect(id);
    if ( !effect ) return;
    const rules = CONFIG.statusEffects.find(s => s.id === id)?.flags?.shiver?.rules ?? {};
    const current = Number(effect.flags?.shiver?.value);
    const value = Math.max(rules.minValue ?? 1, (Number.isFinite(current) ? current : 1) + Number(target.dataset.delta));
    return effect.setFlag("shiver", "value", value);
  }

  static async #onInfectionType(event, target) {
    const effect = this.actor.statusEffect("infected");
    if ( !effect ) return;
    const options = Object.entries(CONFIG.shiver.infections).map(([k, v]) => `<option value="${k}" ${effect.flags?.shiver?.infection === k ? "selected" : ""}>${game.i18n.localize(v.label)}</option>`).join("");
    const type = await DialogV2.prompt({
      window: { title: "shiver.Status.infected" },
      content: `<div class="form-group"><select name="type">${options}</select></div>`,
      ok: { callback: (e, b) => b.form.elements.type.value },
      rejectClose: false
    });
    if ( type ) await effect.setFlag("shiver", "infection", type);
  }

  static async #onToggleStatus(event, target) {
    const id = target.closest("[data-status]").dataset.status;
    if ( this.actor.hasStatus(id) ) return this.actor.removeStatus(id);
    return this.actor.applyStatus(id);
  }

  static #onStandUp() {
    return this.actor.standUp();
  }

  static #onDeathsDoor() {
    return this.actor.rollDeathsDoor();
  }

  static async #onStabilise() {
    const target = [...game.user.targets][0]?.actor;
    if ( !target ) return ui.notifications.warn("shiver.Warn.TargetDying", { localize: true });
    return this.actor.rollStabilise(target);
  }

  static async #onCombatAction(event, target) {
    const combatant = combatantFor(this.actor);
    if ( !combatant ) return;
    const key = target.dataset.key;
    const used = actionsUsed(this.actor);
    const max = actionAllowance(this.actor)[key];
    used[key] = used[key] >= max ? 0 : used[key] + 1;
    await setCombatantFlag(combatant, "actions", used);
    this.render();
  }

  /**
   * Escape a Brawl (p.22): costs an Interact (or Attack) Action, and every enemy in the Brawl gets a free attack.
   */
  static async #onEscape() {
    const token = this.actor.getActiveTokens()[0];
    const { tokenGap } = await import("../documents/actor-actions.mjs");
    const enemies = token ? canvas.tokens.placeables.filter(t => (t !== token) && t.actor && !t.actor.hasStatus("dead")
      && (t.document.disposition !== token.document.disposition) && (tokenGap(t, token) <= 5)) : [];
    await markAction(this.actor, "interact");
    const names = enemies.map(e => foundry.utils.escapeHTML(e.name)).join(", ");
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="shiver-card"><h3><i class="fa-solid fa-person-running"></i> ${game.i18n.localize("shiver.Combat.escape")}</h3>
        <p>${game.i18n.format("shiver.Combat.escapeText", { name: this.actor.name, enemies: names || game.i18n.localize("shiver.Combat.noneAdjacent") })}</p></div>`
    });
  }

  /** Grapple the targeted enemy: an Opposed Grit Check (p.22). */
  static async #onGrapple() {
    const target = [...game.user.targets][0]?.actor;
    if ( !target ) return ui.notifications.warn("shiver.Warn.NoTargets", { localize: true });
    await markAction(this.actor, "attack");
    return game.shiver.tools.grapple(this.actor, target);
  }

  static #onOpenTree() {
    if ( !this.actor.system.attributes.archetype ) return ui.notifications.warn("shiver.Archetype.chooseFirst", { localize: true });
    return new ArchetypeTree(this.actor).render({ force: true });
  }

  static #onChooseArchetype() {
    return chooseArchetype(this.actor);
  }

  static async #onResetUses(event, target) {
    const item = this._getItem(target);
    if ( item ) await item.update({ "system.uses.spent": 0 });
  }

  static async #onClearNightmare() {
    return this.actor.update({ "system.nightmare.weakened": "", "system.nightmare.traumaSkill": "", "system.nightmare.traumaAbility": "" });
  }

  static async #onRollReaction() {
    return game.shiver.rollReaction(this.actor);
  }

  static #onManageEffect(event, target) {
    return onManageActiveEffect(target, this.actor);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);
    // Damage modifier checkboxes come in as booleans keyed by type; collect them into arrays.
    for ( const key of ["immune", "resistant", "weak"] ) {
      const flat = foundry.utils.getProperty(data, `system.damageSet.${key}`);
      if ( flat ) foundry.utils.setProperty(data, `system.damage.${key}`, Object.entries(flat).filter(([, v]) => v).map(([k]) => k));
    }
    if ( data.system?.damageSet ) delete data.system.damageSet;
    return data;
  }
}
