import { receiveDamage, postDamageReport } from "./damage.mjs";
import { actionAllowance, actionsUsed } from "./actions.mjs";
import { asGM, registerGMOperation } from "../socket.mjs";

/**
 * SHIVER combat (p.21-22, p.118). There is no initiative roll: each combatant is put in a Combat State (First, Middle
 * or Last) and characters in the same state choose their order. The combatant's initiative stores the state
 * (3, 2, 1) plus a small offset for its place within the state, so core sorting and turn handling still work.
 */
export class ShiverCombat extends Combat {

  /**
   * The Combat State of a combatant.
   * @param {Combatant} combatant
   * @returns {"first"|"middle"|"last"|null}
   */
  static stateOf(combatant) {
    const init = combatant.initiative;
    if ( !Number.isFinite(init) ) return null;
    if ( init >= 2.5 ) return "first";
    if ( init >= 1.5 ) return "middle";
    return "last";
  }

  /**
   * Suggest a Combat State (p.21): Fast or surprising → First; Slow, injured, Prone or at Disadvantage → Last.
   * Enemies use the state on their profile.
   * @param {Combatant} combatant
   * @returns {string}
   */
  static suggestState(combatant) {
    const actor = combatant.actor;
    if ( !actor ) return "middle";
    if ( actor.type === "npc" ) return actor.system.combatState || "middle";
    const speed = actor.system.speed?.value;
    if ( speed === "fast" ) return "first";
    const injured = (actor.system.hp.max - actor.system.hp.value) >= Math.ceil(actor.system.hp.max / 2);
    if ( (speed === "slow") || injured || actor.hasStatus("prone") || actor.hasStatus("stunned") ) return "last";
    return "middle";
  }

  /**
   * Assign Combat States instead of rolling initiative.
   * @override
   */
  async rollInitiative(ids, { updateTurn = true } = {}) {
    ids = typeof ids === "string" ? [ids] : ids;
    const currentId = this.combatant?.id;
    const updates = [];
    // Each combatant goes to the end of its state, in order, so they get distinct places.
    const placed = new Map(this.combatants.map(c => [c.id, c.initiative]));
    for ( const id of ids ) {
      const c = this.combatants.get(id);
      if ( !c ) continue;
      const state = this.constructor.suggestState(c);
      placed.delete(id);
      const initiative = this._initiativeFor(state, c, placed);
      placed.set(id, initiative);
      updates.push({ _id: id, initiative });
    }
    if ( !updates.length ) return this;
    await this.updateEmbeddedDocuments("Combatant", updates);
    if ( updateTurn && currentId ) await this.update({ turn: this.turns.findIndex(t => t.id === currentId) });
    return this;
  }

  /**
   * The initiative value that places a combatant at the end of a Combat State.
   * @param {string} state
   * @param {Combatant} [combatant]
   * @returns {number}
   */
  _initiativeFor(state, combatant, placed) {
    const base = CONFIG.shiver.combatStates[state]?.value ?? 2;
    const values = placed ? [...placed.entries()].filter(([id]) => id !== combatant?.id).map(([, v]) => v)
      : this.combatants.filter(c => c !== combatant).map(c => c.initiative);
    const inState = values.filter(v => this.constructor.stateOf({ initiative: v }) === state);
    const lowest = inState.reduce((min, v) => Math.min(min, v), base + 0.5);
    return Math.round((Math.min(base + 0.49, lowest) - 0.01) * 100) / 100;
  }

  /**
   * Put a combatant into a Combat State.
   * @param {Combatant} combatant
   * @param {string} state
   */
  async setState(combatant, state) {
    return combatant.update({ initiative: this._initiativeFor(state, combatant) });
  }

  /**
   * Move a combatant earlier or later within its Combat State.
   * @param {Combatant} combatant
   * @param {number} direction   -1 to act earlier, +1 to act later
   */
  async shift(combatant, direction) {
    const state = this.constructor.stateOf(combatant);
    const group = this.turns.filter(c => this.constructor.stateOf(c) === state);
    const i = group.indexOf(combatant);
    const j = i + direction;
    if ( (i < 0) || (j < 0) || (j >= group.length) ) return;
    const other = group[j];
    let a = combatant.initiative;
    let b = other.initiative;
    // Combatants that share a value get distinct ones first.
    if ( a === b ) b = Math.round((b + (direction * 0.01)) * 100) / 100;
    const updates = [{ _id: combatant.id, initiative: b }, { _id: other.id, initiative: a }];
    // Players reorder their own character, but the swap also moves the other combatant: the GM does it.
    if ( game.user.isGM ) return this.updateEmbeddedDocuments("Combatant", updates);
    return asGM("combatShift", { combatId: this.id, updates });
  }

  /* -------------------------------------------- */
  /*  Turn events (run on the active GM)          */
  /* -------------------------------------------- */

  /** @override */
  async _onStartTurn(combatant, context) {
    await super._onStartTurn(combatant, context);
    // Stepping back and forward again doesn't repeat start-of-turn effects (Bleed etc.).
    const key = `${context.round}.${context.turn}`;
    if ( combatant.getFlag("shiver", "turnStarted") === key ) return;
    await combatant.setFlag("shiver", "turnStarted", key);
    const actor = combatant.actor;
    await combatant.setFlag("shiver", "actions", { move: 0, attack: 0, interact: 0 });

    // Effects that last until someone's next turn end now (Steeled from a Heart Critical, Block, Weaken...).
    for ( const c of this.combatants ) {
      const a = c.actor;
      if ( !a ) continue;
      const expired = a.effects.filter(e => {
        const f = e.flags?.shiver ?? {};
        if ( (c === combatant) && (f.expires === "startOfNextTurn") && !this._createdThisTurn(e, context) ) return true;
        return (f.expiresWith?.event === "turnStart") && actor && (f.expiresWith.combatant === actor.uuid)
          && !this._createdThisTurn(e, context);
      });
      if ( expired.length ) await a.deleteEmbeddedDocuments("ActiveEffect", expired.map(e => e.id));
    }
    if ( !actor ) return;

    // Arm statuses that end at the end of this turn (Blinded, Stunned, Taunted).
    const arm = actor.effects.filter(e => e.flags?.shiver?.expires === "endOfNextTurn" || this._defaultsToEndOfTurn(e));
    for ( const e of arm ) await e.setFlag("shiver", "armed", true);

    // Bleed, Burning and Poisoned deal X wounds at the start of each turn (p.219).
    for ( const r of actor.statusRules.filter(s => s.turnWounds) ) {
      if ( actor.system.hp.value <= 0 ) break;
      const report = await receiveDamage(actor, { amount: r.value, type: "status", strike: false });
      report.type = r.id;
      await postDamageReport(actor, report, {
        notes: [game.i18n.format("shiver.Status.turnWounds", { status: game.i18n.localize(`shiver.Status.${r.id}`), n: r.value })]
      });
    }

    // Reminders: Death's Door rolls and lost turns.
    const notes = [];
    if ( actor.hasStatus("deathsDoor") ) notes.push({ key: "shiver.Combat.deathsDoorTurn", button: "deathsDoorRoll" });
    else if ( actor.statusRules.some(r => r.noActions) ) notes.push({ key: "shiver.Combat.noActions" });
    else if ( actor.hasStatus("grappled") ) notes.push({ key: "shiver.Combat.grappled" });
    for ( const n of notes ) {
      const button = n.button ? `<div class="card-buttons"><button type="button" data-shiver-action="${n.button}" data-actor-uuid="${actor.uuid}">${
        game.i18n.localize("shiver.Death.rollLuck")}</button></div>` : "";
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<div class="shiver-card shiver-turn-note"><p>${game.i18n.format(n.key, { name: actor.name })}</p>${button}</div>`
      });
    }
  }

  /** @override */
  async _onEndTurn(combatant, context) {
    await super._onEndTurn(combatant, context);
    const actor = combatant.actor;
    if ( !actor ) return;
    const expired = actor.effects.filter(e => e.flags?.shiver?.armed);
    if ( expired.length ) await actor.deleteEmbeddedDocuments("ActiveEffect", expired.map(e => e.id));
  }

  /** @override */
  async _onEndRound(context) {
    await super._onEndRound(context);
    // Flaws that hurt for every round spent afraid (Painful Memories, p.79).
    for ( const c of this.combatants ) {
      const actor = c.actor;
      if ( !actor || !actor.fearLevel ) continue;
      for ( const rule of actor.rulesOfKind("roundFearDamage") ) {
        const report = await receiveDamage(actor, { amount: rule.amount ?? 1, type: rule.type ?? "soul", strike: false });
        await postDamageReport(actor, report, { notes: [rule.item?.name ?? ""] });
      }
    }
  }

  /**
   * Statuses that end at the end of the bearer's next turn by default (p.219).
   * @param {ActiveEffect} effect
   * @returns {boolean}
   */
  _defaultsToEndOfTurn(effect) {
    if ( effect.flags?.shiver?.expires ) return false;
    // A duration in rounds (e.g. a weapon's "until the end of the next round") replaces the default.
    if ( Number.isFinite(effect.duration?.value) && (effect.duration.units === "rounds") ) return false;
    for ( const id of effect.statuses ) {
      const rules = CONFIG.statusEffects.find(s => s.id === id)?.flags?.shiver?.rules;
      if ( rules?.expires === "endOfNextTurn" ) return true;
    }
    return false;
  }

  /**
   * Was an effect created during the turn that is starting now? Such effects shouldn't expire immediately.
   * @param {ActiveEffect} effect
   * @param {object} context
   * @returns {boolean}
   */
  _createdThisTurn(effect, context) {
    const start = effect.start;
    const combatId = start?.combat?.id ?? start?.combat;
    if ( !start || (combatId !== this.id) ) return false;
    return (start.round === context.round) && (start.turn === context.turn);
  }

  /** @inheritDoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    if ( !game.user.isActiveGM ) return;
    // Effects lasting "for the encounter", or until someone's next turn, end with it.
    const timed = e => {
      const f = e.flags?.shiver ?? {};
      return ["combatEnd", "startOfNextTurn", "endOfNextTurn"].includes(f.expires) || !!f.expiresWith || !!f.armed;
    };
    for ( const c of this.combatants ) {
      const actor = c.actor;
      const ids = actor?.effects.filter(timed).map(e => e.id) ?? [];
      if ( ids.length ) actor.deleteEmbeddedDocuments("ActiveEffect", ids);
    }
  }
}

/* -------------------------------------------- */

/**
 * The SHIVER combat tracker: combatants grouped by Combat State, with action trackers.
 */
export class ShiverCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {

  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      setCombatState: ShiverCombatTracker.#onSetState,
      shiftCombatant: ShiverCombatTracker.#onShift,
      toggleCombatAction: ShiverCombatTracker.#onToggleAction
    }
  };

  /** @override */
  static PARTS = {
    ...super.PARTS,
    tracker: {
      template: "systems/shiver/templates/combat/tracker.hbs",
      scrollable: [""]
    }
  };

  /** @inheritDoc */
  async _prepareTrackerContext(context, options) {
    await super._prepareTrackerContext(context, options);
    const combat = this.viewed;
    if ( !combat ) return;
    const groups = Object.entries(CONFIG.shiver.combatStates).map(([key, cfg]) => ({
      key, label: game.i18n.localize(cfg.label), turns: []
    }));
    const unassigned = { key: "none", label: game.i18n.localize("shiver.Combat.unassigned"), turns: [] };
    for ( const turn of context.turns ?? [] ) {
      const c = combat.combatants.get(turn.id);
      const state = ShiverCombat.stateOf(c);
      turn.state = state;
      const actor = c.actor;
      const allow = actionAllowance(actor);
      const used = c.getFlag("shiver", "actions") ?? {};
      turn.actions = Object.entries(CONFIG.shiver.actions).map(([k, cfg]) => ({
        key: k, icon: cfg.icon, label: game.i18n.localize(cfg.label),
        used: used[k] ?? 0, max: allow[k], spent: (used[k] ?? 0) >= allow[k]
      }));
      turn.canControl = game.user.isGM || c.isOwner;
      turn.fear = actor?.fearLevel ? game.i18n.localize(actor.fearLevel === 2 ? "shiver.Status.terrified" : "shiver.Status.afraid") : "";
      (groups.find(g => g.key === state) ?? unassigned).turns.push(turn);
    }
    context.groups = [...groups, unassigned].filter(g => g.turns.length);
    context.stateOptions = Object.entries(CONFIG.shiver.combatStates).map(([k, v]) => ({ key: k, label: game.i18n.localize(v.label) }));
  }

  /** @this {ShiverCombatTracker} */
  static async #onSetState(event, target) {
    if ( !game.user.isGM ) return;
    const li = target.closest("[data-combatant-id]");
    const c = this.viewed?.combatants.get(li?.dataset.combatantId);
    if ( c ) await this.viewed.setState(c, target.dataset.state);
  }

  /** @this {ShiverCombatTracker} */
  static async #onShift(event, target) {
    const li = target.closest("[data-combatant-id]");
    const c = this.viewed?.combatants.get(li?.dataset.combatantId);
    if ( !c || !(game.user.isGM || c.isOwner) ) return;
    await this.viewed.shift(c, Number(target.dataset.direction));
  }

  /** @this {ShiverCombatTracker} */
  static async #onToggleAction(event, target) {
    const li = target.closest("[data-combatant-id]");
    const c = this.viewed?.combatants.get(li?.dataset.combatantId);
    if ( !c || !(game.user.isGM || c.isOwner) ) return;
    const key = target.dataset.key;
    const used = { move: 0, attack: 0, interact: 0, ...(c.getFlag("shiver", "actions") ?? {}) };
    const max = actionAllowance(c.actor)[key];
    used[key] = (used[key] >= max) ? 0 : used[key] + 1;
    await c.setFlag("shiver", "actions", used);
  }

  /** @inheritDoc */
  _getEntryContextOptions() {
    const options = super._getEntryContextOptions();
    const getCombatant = li => this.viewed.combatants.get(li.dataset.combatantId);
    for ( const [key, cfg] of Object.entries(CONFIG.shiver.combatStates) ) {
      options.unshift({
        label: game.i18n.format("shiver.Combat.setState", { state: game.i18n.localize(cfg.label) }),
        icon: '<i class="fa-solid fa-list-ol"></i>',
        visible: () => game.user.isGM,
        onClick: (event, li) => this.viewed.setState(getCombatant(li), key)
      });
    }
    return options;
  }
}

registerGMOperation("combatShift", async ({ combatId, updates }) => game.combats.get(combatId)?.updateEmbeddedDocuments("Combatant", updates));
