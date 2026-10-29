import { ShiverCheck } from "../dice/check.mjs";
import { DoomClock } from "../doom/doom-clock.mjs";
import { doomQuarter } from "../dice/pool.mjs";
import { markAction } from "../combat/actions.mjs";

/**
 * Roll and action methods mixed into the SHIVER Actor class.
 */
export const ActorActions = {

  /**
   * Can this actor act? Stunned, Paralysed, unconscious and dying characters take no actions (p.219, p.15).
   * @param {"move"|"attack"|"interact"|null} [action]
   * @returns {boolean}  False (with a warning) when the action isn't allowed.
   */
  canAct(action = null) {
    const blocker = this.statusRules.find(r => r.noActions);
    if ( blocker ) {
      ui.notifications.warn(game.i18n.format("shiver.Warn.CantAct", { name: this.name, status: game.i18n.localize(`shiver.Status.${blocker.id}`) }));
      return false;
    }
    if ( ["attack", "move"].includes(action) ) {
      const held = this.statusRules.find(r => r.noMoveAttack || ((action === "move") && r.noMove));
      if ( held ) {
        ui.notifications.warn(game.i18n.format("shiver.Warn.CantAct", { name: this.name, status: game.i18n.localize(`shiver.Status.${held.id}`) }));
        return false;
      }
    }
    return true;
  },

  /**
   * Roll a Skill Check (p.11).
   * @param {string} skill
   * @param {object} [options]   See CheckOptions
   * @returns {Promise<ChatMessage|null>}
   */
  async rollCheck(skill, options = {}) {
    const label = options.label ?? game.i18n.format("shiver.Check.checkOf", { skill: game.i18n.localize(CONFIG.shiver.skills[skill]?.label ?? skill) });
    return ShiverCheck.prompt({ actor: this, skill, type: "check", ...options, label });
  },

  /**
   * Make a Fear Check: a Strange Check against a CR or an opposing enemy (p.96).
   * @param {object} [options]
   * @param {number} [options.cr]
   * @param {"resist"|"steady"} [options.purpose="resist"]
   * @param {number} [options.setAtLeast]   On failure, set Fear to at least this level instead of stepping
   */
  async rollFearCheck({ cr = null, purpose = "resist", setAtLeast = null, label, requestId = null } = {}) {
    if ( (purpose === "steady") && !this.canAct("interact") ) return null;
    const key = purpose === "steady" ? "shiver.Fear.steady" : "shiver.Fear.check";
    const message = await ShiverCheck.prompt({
      actor: this, skill: "strange", type: "fear", cr, label: label ?? game.i18n.localize(key),
      requestId, crHidden: !!requestId,
      tags: purpose === "steady" ? ["fear", "steady"] : ["fear"],
      fear: { purpose, setAtLeast }
    });
    if ( message && (purpose === "steady") ) await markAction(this, "interact");
    return message;
  },

  /**
   * Roll the Luck Pool at Death's Door: one success keeps you alive (p.15).
   */
  async rollDeathsDoor() {
    if ( !this.hasStatus("deathsDoor") ) return refuse("shiver.Warn.NotDying", { localize: true });
    return ShiverCheck.prompt({
      actor: this, skill: "luck", type: "deathsDoor", cr: 1, tags: ["deathsDoor"],
      label: game.i18n.localize("shiver.Death.rollLuck")
    });
  },

  /**
   * Stabilise a character at Death's Door with a CR 2 Smarts Check (p.15).
   * @param {Actor} target
   */
  async rollStabilise(target) {
    if ( !this.canAct("interact") ) return null;
    if ( !target?.hasStatus("deathsDoor") ) return refuse("shiver.Warn.NotDying", { localize: true });
    const message = await ShiverCheck.prompt({
      actor: this, skill: "smarts", type: "stabilise", cr: 2, tags: ["stabilise", "heal"],
      label: game.i18n.format("shiver.Death.stabiliseTarget", { name: target.name }),
      extra: { targetUuid: target.uuid }
    });
    if ( message ) await markAction(this, "interact");
    return message;
  },

  /**
   * Try to remove a status with a check (Bleed: Smarts CR 2, Burning: Grit/Wit CR 1, ...; p.219).
   * @param {string} statusId
   */
  async rollRemoveStatus(statusId) {
    if ( !this.canAct("interact") ) return null;
    const status = CONFIG.statusEffects.find(s => s.id === statusId);
    const removal = status?.flags?.shiver?.rules?.removal;
    if ( !removal ) return;
    if ( removal.fearCheck ) return this.rollFearCheck({ purpose: "steady" });
    const skills = removal.skills ?? ["grit"];
    let skill = skills[0];
    if ( skills.length > 1 ) {
      // Prefer the stronger pool where there's a choice (e.g. Burning: Grit or Wit).
      skill = skills.reduce((a, b) => {
        const pa = this.getPool(a); const pb = this.getPool(b);
        return (pb.skill + (2 * pb.talent)) > (pa.skill + (2 * pa.talent)) ? b : a;
      });
    }
    const name = game.i18n.localize(`shiver.Status.${statusId}`);
    // A check that names two Core Skills ("CR 1 Grit/Wit Check" for Burning) is a Combined Skill Check (p.12, p.220):
    // one skill's Dice Pool, and both skills' symbols count. The dialog shows the combined skill as a checkbox, so a
    // table that reads it as "Grit or Wit" can untick it.
    const message = await ShiverCheck.prompt({
      actor: this, skill, type: "removal", cr: removal.opposed ? null : removal.cr,
      tags: ["removeStatus"], combined: skills.filter(s => s !== skill),
      label: game.i18n.format("shiver.Status.removeTitle", { status: name }),
      status: { id: statusId }
    });
    if ( message ) await markAction(this, removal.action ?? "interact");
    return message;
  },

  /**
   * Stand up from Prone with a Move Action (p.219).
   */
  async standUp() {
    if ( !this.canAct() ) return null;
    await this.removeStatus("prone");
    await markAction(this, "move");
  },

  /* -------------------------------------------- */

  /**
   * The Challenge Rating to hit this actor, including Overwhelm when three or more characters are brawling it (p.23).
   * @param {Token} [token]   The targeted token, to check for Overwhelm on the canvas
   * @returns {{cr: number, notes: string[]}}
   */
  targetCR(token) {
    let cr = this.challengeRating;
    const notes = [];
    if ( token && (this.type === "npc") && !this.hasStatus("overwhelmed") && game.settings.get("shiver", "autoOverwhelm") ) {
      const size = CONFIG.shiver.sizes[this.system.size]?.order ?? 1;
      if ( size <= CONFIG.shiver.sizes.large.order ) {
        const brawlers = canvas.tokens.placeables.filter(t => (t !== token) && (t.actor?.type === "character")
          && !t.actor.statusRules.some(r => r.noActions) && (tokenGap(t, token) <= 5));
        if ( brawlers.length >= 3 ) {
          const before = cr;
          cr = Math.max(1, cr - 1);
          if ( cr !== before ) notes.push(game.i18n.format("shiver.Combat.overwhelmNote", { n: brawlers.length }));
        }
      }
    }
    return { cr, notes };
  },

  /**
   * Make a Strike with a weapon or power (p.22).
   * @param {Item} item
   * @param {object} [options]
   * @param {Token[]} [options.targets]   Defaults to the user's targets
   * @param {boolean} [options.noCrit]    The extra Strike from a Wit Critical can't crit (p.24)
   */
  async rollAttack(item, options = {}) {
    if ( isLostAbility(item) ) return refuse(game.i18n.format("shiver.Warn.AbilityLost", { item: item.name }));
    if ( !this.canAct("attack") ) return null;
    // Abilities that make Strikes keep their profile in system.attack.
    const sys = (item.type === "ability") ? { ...item.system, ...item.system.attack, automation: item.system.automation,
      doom: item.system.doom, properties: new Set() } : item.system;
    if ( (sys.ammo?.max ?? null) !== null && (sys.ammo.value ?? 0) <= 0 ) {
      return refuse(game.i18n.format("shiver.Warn.NoAmmo", { item: item.name }));
    }
    if ( item.getFlag("shiver", "needsReload") && !options.free ) {
      return refuse(game.i18n.format("shiver.Warn.Reload", { item: item.name }));
    }
    // Weapons and powers can have limited uses too (abilities spend theirs in Item#roll).
    const limited = (item.type !== "ability") ? usesRemaining(item) : { limited: false };
    if ( limited.limited && (limited.remaining <= 0) ) {
      return refuse(game.i18n.format("shiver.Warn.NoUses", { item: item.name, when: limited.recharge }));
    }
    let tokens = options.targets ?? [...game.user.targets];
    const notes = [];
    const targets = tokens.filter(t => t.actor).map(t => {
      const { cr, notes: n } = t.actor.targetCR(t);
      notes.push(...n);
      return { tokenUuid: t.document.uuid, actorUuid: t.actor.uuid, name: t.name, img: t.document.texture.src, cr };
    });

    // Weapons may let the wielder choose between skills (p.133) and damage types. Abilities can add Strike variants
    // (e.g. the Warrior's Stun) that change the damage and add effects on a hit.
    const skills = [sys.skill, ...(sys.altSkills ?? [])].filter(s => s in CONFIG.shiver.skills);
    let skill = options.skill ?? skills[0] ?? "grit";
    let damageType = options.damageType ?? sys.damageType;
    const altTypes = [...(sys.altDamageTypes ?? [])];
    const modes = (item.type === "weapon") ? this.rulesOfKind("strikeMode").filter(r => {
      // A weapon's own Strike variants only apply to that weapon.
      if ( (r.item?.type === "weapon") && (r.item !== item) ) return false;
      if ( r.unarmedOnly && !sys.unarmed ) return false;
      if ( r.meleeOnly && ((CONFIG.shiver.ranges[sys.range]?.ft ?? 5) > 15) ) return false;
      return true;
    }) : [];
    let mode = options.mode ?? null;
    if ( !options.skipChoice && !mode && ((skills.length > 1) || altTypes.length || item.system.properties?.has?.("stun") || modes.length) ) {
      const choice = await chooseAttackMode(item, skills, [sys.damageType, ...altTypes], modes);
      if ( !choice ) return null;
      skill = choice.skill;
      damageType = choice.damageType;
      options.stunMode = choice.stunMode;
      mode = choice.mode;
    }

    const rules = [...(sys.automation ?? []), ...(mode?.onHit ?? [])];
    const range = CONFIG.shiver.ranges[sys.range];
    const thrown = ["thrown", "trap"].includes(sys.category) || !!sys.thrown;
    // Category first (melee weapons with Near reach stay melee), then the range.
    const ranged = rules.some(r => r.kind === "ranged") || thrown || !!sys.ranged || (sys.category === "ranged")
      || ((sys.category !== "melee") && !rules.some(r => r.kind === "melee") && ((range?.ft ?? 5) > 15) && (item.type === "weapon"));
    const attack = {
      itemUuid: item.uuid,
      itemName: item.name,
      itemType: item.type,
      damage: (mode?.damage ?? Math.floor((sys.damage ?? 0) * (mode?.damageMultiplier ?? 1))) + (Number(mode?.damageBonus) || 0),
      damageType: mode?.damageType ?? damageType,
      modeLabel: mode?.label ?? null,
      range: sys.range,
      rangeLabel: range ? `${game.i18n.localize(range.label)} (${range.ft} ft)` : "",
      ranged,
      material: sys.material || null,
      ignoreArmour: rules.some(r => r.kind === "ignoreArmour"),
      heavy: !!sys.properties?.has?.("heavy"),
      unarmed: !!sys.unarmed,
      thrown,
      onHit: rules.filter(r => ["onHit", "saveOverride"].includes(r.kind)),
      noCrit: !!options.noCrit || !!mode?.noCrit,
      stunMode: !!options.stunMode,
      targets
    };
    const tags = ["attack", "strike", ranged ? "ranged" : "melee", item.type, ...(mode?.tags ?? [])];
    if ( sys.unarmed ) tags.push("unarmed");
    if ( thrown ) tags.push("thrown");
    if ( attack.heavy ) tags.push("heavy");

    // Targets must be within the weapon's Range (p.22, p.129), plus range bonuses such as Bullseye.
    const { ruleApplies: applies } = await import("../rules/automation.mjs");
    let reach = range?.ft ?? 5;
    for ( const r of this.rulesOfKind("rangeBonus") ) {
      if ( applies(r, { tags: new Set(tags), actor: this }) === true ) reach += Number(r.ft) || 0;
    }
    const origin = this.getActiveTokens()[0];
    if ( origin && game.settings.get("shiver", "enforceRange") && attack.targets.length ) {
      const inRange = [];
      const outOfRange = [];
      for ( const t of attack.targets ) {
        const token = fromUuidSync(t.tokenUuid)?.object;
        if ( !token || (tokenGap(origin, token) <= reach) ) inRange.push(t);
        else outOfRange.push(`${t.name} (${tokenGap(origin, token)} ft)`);
      }
      if ( outOfRange.length ) {
        ui.notifications.warn(game.i18n.format("shiver.Warn.OutOfRange", { item: item.name, ft: reach, targets: outOfRange.join(", ") }));
        if ( !inRange.length ) return null;
        attack.targets = inRange;
      }
    }
    // Flat damage bonuses from abilities and infections (e.g. Lycanthropy stage 3: melee Strikes +2).
    const { ruleApplies } = await import("../rules/automation.mjs");
    for ( const r of this.rulesOfKind("damageBonus") ) {
      if ( ruleApplies(r, { tags: new Set(tags), actor: this }) === true ) attack.damage += Number(r.amount) || 0;
    }
    const message = await ShiverCheck.prompt({
      actor: this, skill, type: "attack", tags, attack,
      label: options.label ?? game.i18n.format("shiver.Check.attackWith", { item: mode?.label ? `${item.name} (${mode.label})` : item.name }),
      minorAdvantage: item.getFlag("shiver", "aimed") ? 1 : 0,
      skipDialog: !!options.skipDialog,
      notes
    });
    if ( !message ) return null;

    // Optional Malfunctions (p.132): one extra Skill Die on every attack with the weapon.
    if ( sys.properties?.has?.("malfunctions") ) await rollMalfunction(this, item);

    // Spend fuel/ammo, set Reload, and use the actions (Heavy weapons take an Attack and an Interact, p.22).
    const updates = {};
    if ( (sys.ammo?.max ?? null) !== null ) updates["system.ammo.value"] = Math.max(0, (sys.ammo.value ?? 0) - 1);
    if ( rules.some(r => r.kind === "reload") ) updates["flags.shiver.needsReload"] = true;
    if ( item.getFlag("shiver", "aimed") ) updates["flags.shiver.aimed"] = false;
    if ( !foundry.utils.isEmpty(updates) ) await item.update(updates);
    if ( limited.limited ) await spendUse(item, limited);
    if ( !options.free ) {
      await markAction(this, "attack");
      if ( attack.heavy ) await markAction(this, "interact");
    }
    // Striking from Stealth reveals you (p.27).
    if ( this.hasStatus("stealth") ) await this.removeStatus("stealth");
    if ( this.hasStatus("hidden") ) await this.removeStatus("hidden");
    // Doom costs on use (e.g. Weird powers).
    if ( sys.doom ) await DoomClock.tick(sys.doom, { reason: item.name, actorUuid: this.uuid });
    if ( mode?.doom ) await DoomClock.tick(mode.doom, { reason: mode.label, actorUuid: this.uuid });
    return message;
  },

  /* -------------------------------------------- */

  /**
   * Use an ability or item: spend its limited uses, pay its Doom cost, roll its check, and post it to chat.
   * @param {Item} item
   */
  async useItem(item) {
    const sys = item.system;
    if ( isLostAbility(item) ) return refuse(game.i18n.format("shiver.Warn.AbilityLost", { item: item.name }));
    if ( ["attack", "interact", "move"].includes(sys.action) && !this.canAct(sys.action) ) return null;
    if ( sys.consumable && ((sys.quantity ?? 0) <= 0) ) return refuse("shiver.Warn.NoQuantity", { localize: true });
    const uses = usesRemaining(item);
    if ( uses.limited && (uses.remaining <= 0) ) {
      return refuse(game.i18n.format("shiver.Warn.NoUses", { item: item.name, when: uses.recharge }));
    }
    // Costs paid to use the ability: Luck Points or wounds (e.g. the Fool's Cashing In).
    const rules0 = sys.automation ?? [];
    for ( const r of rules0.filter(r => r.kind === "cost") ) {
      if ( r.luck ) {
        const ok = await this.spendLuck(Number(r.luck));
        if ( !ok ) return refuse(game.i18n.format("shiver.Warn.NoLuck", { n: r.luck }));
      }
    }
    if ( uses.limited ) await spendUse(item, uses);
    if ( sys.consumable && (sys.quantity > 0) ) {
      if ( sys.quantity <= 1 ) await item.update({ "system.quantity": 0 });
      else await item.update({ "system.quantity": sys.quantity - 1 });
    }

    const rules = sys.automation ?? [];
    const notes = [];
    // Doom Clock cost (Weird abilities, cursed items).
    let doom = Number(sys.doom) || 0;
    for ( const r of rules ) if ( (r.kind === "doom") && (!r.when || r.when === "use") ) doom += Number(r.amount) || 0;
    if ( doom ) {
      await DoomClock.tick(doom, { reason: item.name, actorUuid: this.uuid });
      notes.push(game.i18n.format(doom > 0 ? "shiver.Check.doomUp" : "shiver.Check.doomDown", { n: Math.abs(doom) }));
    }
    // Self effects.
    for ( const r of rules ) {
      if ( (r.kind === "applyStatus") && ((r.target === "self") || !r.target) && (!r.when || r.when === "use") ) {
        await applyEffectRules(this, [{ ...r, target: "self" }], [], item.name);
        notes.push(game.i18n.format("shiver.Check.statusApplied", { status: game.i18n.localize(`shiver.Status.${r.status}`) }));
      }
      if ( (r.kind === "removeStatus") && (r.target !== "ally") && (!r.when || r.when === "use") ) {
        await this.removeStatus(r.status);
      }
      if ( (r.kind === "fearStep") && (!r.when || r.when === "use") ) {
        await this.stepFear(Number(r.amount) || -1);
      }
      if ( (r.kind === "heal") && !r.perSymbol && (r.target !== "ally") && (!r.when || r.when === "use") ) {
        await this.heal(Number(r.amount) || 0, { source: item.name });
      }
      if ( (r.kind === "luck") && (!r.when || r.when === "use") ) {
        if ( r.amount > 0 ) await this.bankLuck(r.amount);
      }
    }

    // Statuses for targets (enemies roll their saves; characters get a save card).
    const targets = [...game.user.targets].map(t => t.actor).filter(Boolean);
    for ( const r of rules.filter(r => (r.kind === "applyStatus") && ["enemy", "ally", "target"].includes(r.target) && (!r.when || r.when === "use")) ) {
      await applyEffectRules(this, [r], targets, item.name);
      if ( targets.length ) notes.push(game.i18n.format("shiver.Check.statusTargets", { status: game.i18n.localize(`shiver.Status.${r.status}`), n: targets.length }));
    }
    for ( const r of rules.filter(r => (r.kind === "removeStatus") && (r.target === "ally") && (!r.when || r.when === "use")) ) {
      for ( const target of targets ) await target.removeStatus(r.status);
    }
    for ( const r of rules.filter(r => (r.kind === "heal") && !r.perSymbol && (r.target === "ally") && (!r.when || r.when === "use")) ) {
      for ( const target of (targets.length ? targets : [this]) ) await target.heal(Number(r.amount) || 0, { source: item.name });
    }
    for ( const r of rules.filter(r => (r.kind === "removeStatus") && (r.target === "ally") && !targets.length && (!r.when || r.when === "use")) ) {
      await this.removeStatus(r.status);
    }

    // Action cost in combat.
    if ( ["attack", "interact", "move"].includes(sys.action) ) await markAction(this, sys.action);

    // Post the item to chat, with buttons for the checks and situational effects it calls for.
    const content = await renderItemCard(item, this, notes);
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content,
      flags: { shiver: { item: { uuid: item.uuid, actorUuid: this.uuid } } }
    }, { messageMode: game.settings.get("core", "messageMode") });
  },

  /**
   * Roll a check an item or ability calls for.
   * @param {Item} item
   * @param {number} [index]   Index of the rule in the item's automation (defaults to the first check)
   */
  async rollItemCheck(item, index) {
    const rules = itemRules(item);
    const i = Number.isInteger(index) ? index : rules.findIndex(r => r.kind === "check" || ((r.kind === "heal") && r.perSymbol));
    let rule = rules[i];
    if ( !rule ) return;
    if ( ruleLost(item, i) ) return refuse(game.i18n.format("shiver.Warn.AbilityLost", { item: item.name }));
    const heal = (rule.kind === "heal") ? rule : null;
    const target = [...game.user.targets][0]?.actor ?? null;
    return ShiverCheck.prompt({
      actor: this,
      skill: rule.skill ?? "smarts",
      type: heal ? "heal" : "check",
      cr: Number.isFinite(rule.cr) ? rule.cr : (heal ? 1 : null),
      label: rule.label ? `${item.name}: ${rule.label}` : item.name,
      tags: ["ability", ...(heal ? ["heal"] : [])],
      notes: [rule.onSuccess ? `${game.i18n.localize("shiver.Outcome.success")}: ${rule.onSuccess}` : null,
        rule.onFail ? `${game.i18n.localize("shiver.Outcome.failure")}: ${rule.onFail}` : null].filter(Boolean),
      heal: heal ? { base: heal.amount ?? 0, perSymbol: heal.perSymbol ?? 0, freeSymbols: heal.freeSymbols ?? 0 } : null,
      extra: {
        targetUuid: (heal && (heal.target === "ally") && target) ? target.uuid : null,
        itemUuid: item.uuid,
        // Effects that happen on a success or a failure, applied to the targets chosen when rolling.
        onSuccess: rule.success ?? null,
        onFailure: rule.failure ?? null,
        targetUuids: [...game.user.targets].map(t => t.actor?.uuid).filter(Boolean)
      }
    });
  }
};

/* -------------------------------------------- */

/**
 * Would equipping this item stay within the character's limits: three Armour Slots and two weapons (p.16, p.128)?
 * Unarmed Strikes and Punch-Up weapons don't take a weapon slot.
 * @param {Actor} actor
 * @param {Item} item
 * @returns {boolean}
 */
export function equipFits(actor, item, pending = { armour: 0, weapons: 0 }) {
  const slots = actor.system.slots ?? { armour: 3, weapons: 2 };
  if ( item.type === "armour" ) {
    const used = actor.itemTypes.armour.filter(a => a.system.equipped && (a !== item)).reduce((n, a) => n + a.system.slots, 0);
    return used + pending.armour + (item.system.slots ?? 1) <= slots.armour;
  }
  if ( item.type === "weapon" ) {
    if ( isFreeWeapon(item) ) return true;
    const used = actor.itemTypes.weapon.filter(w => w.system.equipped && (w !== item) && !isFreeWeapon(w)).length;
    return used + pending.weapons + 1 <= slots.weapons;
  }
  return true;
}

/**
 * Unarmed Strikes and Punch-Up weapons don't take a weapon slot (p.134, p.138).
 * @param {Item} w
 * @returns {boolean}
 */
export function isFreeWeapon(w) {
  return !!(w.system.unarmed || w.system.properties?.has?.("punchUp"));
}

/* -------------------------------------------- */

/**
 * Warn the user and return null, so callers can tell a refused action from one that happened.
 * @param {...any} args   Arguments for ui.notifications.warn
 * @returns {null}
 */
function refuse(...args) {
  ui.notifications.warn(...args);
  return null;
}

/**
 * Every automation rule an item has, including a Background's Flaw rules.
 * @param {Item} item
 * @returns {object[]}
 */
export function itemRules(item) {
  return [...(item.system.automation ?? []), ...(item.system.flawAutomation ?? [])];
}

/**
 * Is this an ability (or a Background's ability) the character has lost, e.g. to Nightmare Mode Trauma (p.15)?
 * @param {Item} item
 * @returns {boolean}
 */
export function isLostAbility(item) {
  return ["ability", "background"].includes(item?.type) && (item.system.active === false);
}

/**
 * Is the rule at this index of itemRules(item) unusable because its ability is lost? A Background's Flaw rules come
 * after its ability rules and still apply.
 * @param {Item} item
 * @param {number} index
 * @returns {boolean}
 */
function ruleLost(item, index) {
  if ( !isLostAbility(item) ) return false;
  return (item.type === "ability") || (index < (item.system.automation?.length ?? 0));
}

/**
 * Apply a list of effect rules (from a check's success or failure) to targets or the actor.
 * @param {Actor} actor
 * @param {object[]} rules
 * @param {Actor[]} targets
 * @param {string} source
 * @returns {Promise<string[]>}  Notes describing what happened.
 */
export async function applyEffectRules(actor, rules, targets, source) {
  const notes = [];
  const { rollSave } = await import("../combat/damage.mjs");
  for ( const r of rules ?? [] ) {
    const who = ["enemy", "ally", "target"].includes(r.target) ? targets : [actor];
    for ( const target of who.filter(Boolean) ) {
      const flags = { ...(r.flags ?? {}) };
      if ( r.until === "attackerNextTurn" ) flags.expiresWith = { combatant: actor.uuid, event: "turnStart" };
      if ( r.until === "encounter" ) flags.expires = "combatEnd";
      if ( r.until === "endOfNextTurn" ) flags.expires = "endOfNextTurn";
      const duration = r.rounds ? { value: Number(r.rounds), units: "rounds", expiry: "turnStart" } : undefined;
      switch ( r.kind ) {
        case "applyStatus":
          if ( r.save ) await rollSave(target, { skill: r.save.skill, cr: r.save.cr, status: r.status, value: r.value, flags, duration, fear: !!r.fear }, actor);
          else await target.applyStatus(r.status, { value: r.value, flags, duration, origin: actor.uuid });
          notes.push(`${target.name}: ${game.i18n.localize(`shiver.Status.${r.status}`)}`);
          break;
        case "removeStatus":
          await target.removeStatus(r.status);
          notes.push(game.i18n.format("shiver.Check.statusRemoved", { status: game.i18n.localize(`shiver.Status.${r.status}`) }));
          break;
        case "heal": {
          const n = await target.heal(Number(r.amount) || 0, { source });
          if ( n ) notes.push(`${target.name}: ${game.i18n.format("shiver.Heal.amount", { n })}`);
          break;
        }
        case "fearStep": await target.stepFear(Number(r.amount) || -1); break;
        case "luck": if ( r.amount > 0 ) await target.bankLuck(r.amount); break;
        // "Your remaining Health Points become N": not healing, so Cursed doesn't stop it.
        case "setHealth": {
          const hp = Math.max(target.system.hp.value, Number(r.amount) || 1);
          await target._ownerUpdate({ "system.hp.value": hp }, { shiverAllowHeal: true });
          notes.push(`${target.name}: ${game.i18n.localize("shiver.Sheet.health")} ${hp}`);
          break;
        }
        case "damage": {
          const { applyDamage } = await import("../combat/damage.mjs");
          await applyDamage(target, { amount: Number(r.amount) || 0, type: r.type ?? "blunt", strike: !!r.strike });
          break;
        }
      }
    }
    if ( r.kind === "doom" ) await DoomClock.tick(Number(r.amount) || 0, { reason: source, actorUuid: actor.uuid });
  }
  return notes;
}

/* -------------------------------------------- */

/**
 * Roll on the Malfunction table (p.132) and apply what can be applied.
 * @param {Actor} actor
 * @param {Item} item
 */
export async function rollMalfunction(actor, item) {
  const roll = await new Roll("1ds").evaluate();
  const symbol = CONFIG.shiver.skillDieFaces[roll.dice[0].results[0].result];
  const notes = [];
  if ( symbol === "heart" ) {
    await actor.applyStatus("prone");
    notes.push(game.i18n.format("shiver.Check.statusApplied", { status: game.i18n.localize("shiver.Status.prone") }));
  }
  if ( symbol === "strange" ) {
    const { applyDamage } = await import("../combat/damage.mjs");
    await applyDamage(actor, { amount: Math.floor((item.system.damage ?? 0) / 2), type: item.system.damageType, strike: false });
  }
  if ( symbol === "grit" ) await item.update({ "flags.shiver.needsReload": true });
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: [roll],
    content: `<div class="shiver-card shiver-malfunction"><h3><i class="fa-solid fa-gears"></i> ${game.i18n.format("shiver.Malfunction.title", { item: item.name })}</h3>
      <p>${game.i18n.localize(CONFIG.shiver.malfunctions[symbol])}</p>${notes.map(n => `<p class="note">${n}</p>`).join("")}</div>`
  });
}

/**
 * Apply one of an item's situational rules (e.g. "on a Grit result, every enemy is knocked Prone") to the user's
 * targets, or to the user for self rules.
 * @param {Actor} actor
 * @param {Item} item
 * @param {number} index
 */
export async function applyItemRule(actor, item, index) {
  const r = itemRules(item)[index];
  if ( !r ) return;
  if ( ruleLost(item, index) ) return refuse(game.i18n.format("shiver.Warn.AbilityLost", { item: item.name }));
  const targets = [...game.user.targets].map(t => t.actor).filter(Boolean);
  if ( ["enemy", "ally", "target"].includes(r.target) && !targets.length ) return refuse("shiver.Warn.NoTargets", { localize: true });
  return applyEffectRules(actor, [r], targets, item.name);
}

/**
 * Render the chat card for using an item.
 * @param {Item} item
 * @param {Actor} actor
 * @param {string[]} notes
 * @returns {Promise<string>}
 */
export async function renderItemCard(item, actor, notes = []) {
  const sys = item.system;
  const rules = itemRules(item);
  const label = s => game.i18n.localize(CONFIG.shiver.skills[s]?.label ?? s ?? "");
  const checks = rules.map((r, index) => ({ r, index })).filter(({ r }) => (r.kind === "check") || ((r.kind === "heal") && r.perSymbol))
    .map(({ r, index }) => ({
      index, cr: r.cr, label: label(r.skill ?? "smarts"),
      text: [r.label, r.onSuccess ? `✔ ${r.onSuccess}` : "", r.onFail ? `✘ ${r.onFail}` : ""].filter(Boolean).join(" ")
    }));
  const situational = rules.map((r, index) => ({ r, index })).filter(({ r }) => ["applyStatus", "removeStatus", "heal", "fearStep", "doom", "luck"].includes(r.kind)
    && !r.perSymbol && r.when && (r.when !== "use"))
    .map(({ r, index }) => ({
      index,
      text: `${r.when?.label ?? (typeof r.when === "string" ? r.when : "")}: ${
        r.status ? game.i18n.localize(`shiver.Status.${r.status}`) : (r.kind === "heal" ? game.i18n.format("shiver.Heal.amount", { n: r.amount }) : `${r.kind} ${r.amount ?? ""}`)
      }${r.save ? ` (${label(r.save.skill)} CR ${r.save.cr})` : ""}${["enemy", "ally", "target"].includes(r.target) ? ` → ${game.i18n.localize("shiver.Item.targets")}` : ""}`
    }));
  const customs = rules.filter(r => r.kind === "custom").map(r => r.note);
  return foundry.applications.handlebars.renderTemplate("systems/shiver/templates/chat/item-card.hbs", {
    item, actor, notes, uses: usesRemaining(item), checks, situational, customs,
    description: await foundry.applications.ux.TextEditor.implementation.enrichHTML(sys.description || sys.abilityDescription || "", { relativeTo: item, rollData: item.getRollData() })
  });
}

/* -------------------------------------------- */

/**
 * The distance in feet between two tokens, counted in grid spaces at 5 ft per space as the book does (p.14, p.129:
 * Close 1, Near 3, Medium 10, Long 30, Far 40), so it doesn't depend on the scene's distance units.
 * Adjacent tokens are 5 ft apart.
 * @param {Token} a
 * @param {Token} b
 * @returns {number}
 */
export function tokenGap(a, b) {
  const grid = canvas.grid;
  const size = grid.size;
  const dist = 5;
  const ax = a.document.x / size; const ay = a.document.y / size;
  const bx = b.document.x / size; const by = b.document.y / size;
  const dx = Math.max(0, Math.max(ax, bx) - Math.min(ax + a.document.width, bx + b.document.width));
  const dy = Math.max(0, Math.max(ay, by) - Math.min(ay + a.document.height, by + b.document.height));
  return (Math.floor(Math.max(dx, dy) + 1e-6) + 1) * dist;
}

/**
 * Ask which skill, damage type or mode a weapon attack uses.
 * @param {Item} item
 * @param {string[]} skills
 * @param {string[]} types
 * @returns {Promise<{skill: string, damageType: string, stunMode: boolean}|null>}
 */
async function chooseAttackMode(item, skills, types, modes = []) {
  const skillOpts = skills.map(s => `<option value="${s}">${game.i18n.localize(CONFIG.shiver.skills[s].label)}</option>`).join("");
  const typeOpts = [...new Set(types)].filter(Boolean).map(t => `<option value="${t}">${game.i18n.localize(CONFIG.shiver.damageTypes[t]?.label ?? t)}</option>`).join("");
  const stun = item.system.properties?.has?.("stun");
  const modeOpts = [`<option value="">${game.i18n.localize("shiver.Weapon.normalStrike")}</option>`,
    ...modes.map((m, i) => `<option value="${i}">${foundry.utils.escapeHTML(m.label ?? m.item?.name ?? "")}</option>`)].join("");
  return foundry.applications.api.DialogV2.prompt({
    window: { title: item.name },
    content: `<div class="form-group"><label>${game.i18n.localize("shiver.Check.skill")}</label><select name="skill">${skillOpts}</select></div>
      <div class="form-group"><label>${game.i18n.localize("shiver.Damage.type")}</label><select name="damageType">${typeOpts}</select></div>
      ${modes.length ? `<div class="form-group"><label>${game.i18n.localize("shiver.Weapon.strikeMode")}</label><select name="mode">${modeOpts}</select></div>` : ""}
      ${stun ? `<label class="checkbox"><input type="checkbox" name="stunMode"> ${game.i18n.localize("shiver.Weapon.stunMode")}</label>` : ""}`,
    ok: {
      label: "shiver.Check.roll",
      callback: (event, button) => {
        const f = button.form.elements;
        const m = f.mode?.value;
        return {
          skill: f.skill.value,
          damageType: f.damageType.value,
          stunMode: !!f.stunMode?.checked,
          mode: (m === "" || m === undefined) ? null : modes[Number(m)]
        };
      }
    },
    rejectClose: false
  });
}

/* -------------------------------------------- */

/**
 * How many uses an item has left, recharging from the Doom Clock and combat (p.19).
 * @param {Item} item
 * @returns {{limited: boolean, max?: number, spent?: number, remaining?: number, recharge?: string}}
 */
export function usesRemaining(item) {
  const u = item.system.uses;
  if ( !u || (u.per === "always") || !u.per ) return { limited: false };
  const doom = DoomClock.state;
  const quarter = doomQuarter(doom.minutes);
  let spent = u.spent ?? 0;
  let recharge = "";
  const combat = game.combat;
  switch ( u.per ) {
    case "opdq":
      if ( (doom.cycle > u.cycle) || ((doom.cycle === u.cycle) && (quarter > u.serial)) ) spent = 0;
      recharge = quarter < 4 ? game.i18n.format("shiver.Uses.nextQuarter", { mark: (quarter + 1) * 15 }) : game.i18n.localize("shiver.Uses.nextCycle");
      break;
    case "opdc":
      if ( doom.cycle > u.cycle ) spent = 0;
      recharge = game.i18n.localize("shiver.Uses.nextCycle");
      break;
    case "encounter":
      if ( !combat || (combat.id !== u.combat) ) spent = 0;
      recharge = game.i18n.localize("shiver.Uses.nextEncounter");
      break;
    case "round":
      if ( !combat || (combat.id !== u.combat) || (combat.round !== u.round) ) spent = 0;
      recharge = game.i18n.localize("shiver.Uses.nextRound");
      break;
    case "turn":
      if ( !combat || (combat.id !== u.combat) || (combat.round !== u.round) || (combat.turn !== u.turn) ) spent = 0;
      recharge = game.i18n.localize("shiver.Uses.nextTurn");
      break;
    case "story":
      recharge = game.i18n.localize("shiver.Uses.story");
      break;
  }
  const max = Math.max(1, u.max ?? 1);
  return { limited: true, max, spent, remaining: Math.max(0, max - spent), recharge };
}

/**
 * Spend one use of an item.
 * @param {Item} item
 * @param {object} [uses]
 */
export async function spendUse(item, uses = usesRemaining(item)) {
  const doom = DoomClock.state;
  const combat = game.combat;
  return item.update({
    "system.uses.spent": (uses.spent ?? 0) + 1,
    "system.uses.serial": doomQuarter(doom.minutes),
    "system.uses.cycle": doom.cycle,
    "system.uses.combat": combat?.id ?? "",
    "system.uses.round": combat?.round ?? 0,
    "system.uses.turn": combat?.turn ?? -1
  });
}
