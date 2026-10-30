import { receiveDamage, postDamageReport } from "./damage.mjs";
import { actionAllowance } from "./actions.mjs";
import { claimOrder, describeFlow, firstSection, moveEntry, nextStop, orderValues, SECTIONS,
  stateForInitiative } from "./flow.mjs";
import { asGM, canControl, GMOperationRefused, registerGMOperation, requireControl, serialize } from "../socket.mjs";

/**
 * SHIVER combat (p.21-22, p.118). There is no initiative roll: each combatant is put in a Combat State (First, Middle
 * or Last) and characters in the same state choose their order. The combatant's initiative stores the state
 * (3, 2, 1) plus a small offset for its place within the state, so core sorting and turn handling still work.
 *
 * A round runs First, then Middle, then Last. Within a state, whoever acts next takes the turn ("Go now"); the turn
 * order is rearranged so it reads [acted] [current] [waiting]. Between turns the combat can wait for someone to take
 * the turn: see flow.mjs.
 */
export class ShiverCombat extends Combat {

  /**
   * The Combat State of a combatant.
   * @param {Combatant} combatant
   * @returns {"first"|"middle"|"last"|null}
   */
  static stateOf(combatant) {
    return stateForInitiative(combatant?.initiative);
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

  /* -------------------------------------------- */
  /*  Turn flow                                   */
  /* -------------------------------------------- */

  /**
   * The stop the combat is waiting at, if no-one has taken the turn yet. Stored with the round and the combatant the
   * turn pointer was on, so it lapses if the turn is moved some other way.
   * @type {{round: number, section: string}|null}
   */
  get pendingStop() {
    const f = this.getFlag("shiver", "flow");
    if ( !f?.pending || (f.round !== this.round) ) return null;
    if ( (f.combatantId ?? null) !== (this.combatant?.id ?? null) ) return null;
    return f.pending;
  }

  /**
   * The turn order in the form flow.mjs works with.
   * @returns {{id: string, state: string|null, defeated: boolean}[]}
   */
  _flowEntries() {
    return this.turns.map(c => ({ id: c.id, state: this.constructor.stateOf(c), defeated: c.isDefeated }));
  }

  /**
   * Where the round stands: see describeFlow.
   * @type {object}
   */
  get flow() {
    return describeFlow(this._flowEntries(), { round: this.round, turn: this.turn, pending: this.pendingStop });
  }

  /**
   * Can this user have this combatant take the next turn? Only those still waiting in the current Combat State can.
   * Players can for their own characters once the last turn has ended, or to follow on from their own turn.
   * @param {Combatant} combatant
   * @param {User} [user]
   * @returns {boolean}
   */
  canGoNow(combatant, user = game.user) {
    const flow = this.flow;
    if ( !flow.begun || !flow.inSection.some(e => e.id === combatant.id) ) return false;
    if ( user.isGM ) return true;
    if ( !canControl(user, combatant.actor ?? combatant) ) return false;
    return flow.pending || canControl(user, this.combatant?.actor ?? this.combatant);
  }

  /**
   * Can this user end the turn in progress?
   * @param {User} [user]
   * @returns {boolean}
   */
  canEndTurn(user = game.user) {
    const current = this.flow.current;
    if ( !current ) return false;
    const c = this.combatants.get(current.id);
    return user.isGM || canControl(user, c?.actor ?? c);
  }

  /**
   * Can this user drag this combatant? GMs can move anyone anywhere. Players can move their own characters within
   * their Combat State, while they're still waiting to act.
   * @param {Combatant} combatant
   * @param {User} [user]
   * @returns {boolean}
   */
  canMove(combatant, user = game.user) {
    if ( user.isGM ) return true;
    if ( !this.constructor.stateOf(combatant) || !canControl(user, combatant.actor ?? combatant) ) return false;
    const flow = this.flow;
    return !flow.begun || flow.waiting.some(e => e.id === combatant.id);
  }

  /**
   * Run turn-flow changes one at a time, so that requests arriving together can't interleave.
   * @param {() => Promise<any>} fn
   * @returns {Promise<any>}
   */
  _serial(fn) {
    return serialize(`combat-flow.${this.id}`, fn);
  }

  /**
   * Have a combatant take the next turn. Ends the turn in progress, if there is one.
   * @param {Combatant} combatant
   */
  async goNow(combatant) {
    if ( !game.user.isGM ) return asGM("combatGoNow", { combatId: this.id, combatantId: combatant.id });
    return this._serial(() => this._goNow(combatant, game.user));
  }

  /**
   * End the turn in progress and wait for someone to take the next one. Once everyone in a Combat State has acted,
   * the combat moves on to the next state.
   */
  async endTurn() {
    if ( !game.user.isGM ) return asGM("combatEndTurn", { combatId: this.id });
    return this._serial(() => this._endTurn(game.user));
  }

  /**
   * Move on to the next Combat State. Anyone still waiting in the current one loses their turn this round.
   */
  async nextSection() {
    if ( !game.user.isGM ) return this;
    await this._serial(() => this._endTurn(game.user, { skipSection: true }));
    return this;
  }

  /**
   * Begin the encounter: wait for someone in the first Combat State to take the first turn.
   * @override
   */
  async startCombat() {
    if ( !game.user.isGM ) return this;
    this._playCombatSound("startEncounter");
    await this._serial(() => this._setPending({ round: 1, section: firstSection(this._flowEntries()) }));
    return this;
  }

  /**
   * The next combatant waiting in the current Combat State takes the turn. If there isn't one, the turn ends and the
   * combat moves on to the next state, where the table chooses who goes.
   * @override
   */
  async nextTurn() {
    if ( !game.user.isGM ) {
      await this.endTurn();
      return this;
    }
    await this._serial(async () => {
      const flow = this.flow;
      if ( !flow.begun ) return this._setPending({ round: 1, section: firstSection(this._flowEntries()) });
      const next = flow.inSection[0] && this.combatants.get(flow.inSection[0].id);
      if ( next ) return this._goNow(next, game.user);
      return this._endTurn(game.user, { skipSection: flow.pending });
    });
    return this;
  }

  /**
   * Skip the rest of the round: wait for someone in the first Combat State of the next one.
   * @override
   */
  async nextRound() {
    if ( !game.user.isGM ) return this;
    await this._serial(async () => {
      const flow = this.flow;
      if ( flow.current ) await this._expireEndOfTurn(this.combatants.get(flow.current.id));
      await this._setPending({ round: flow.round + 1, section: firstSection(this._flowEntries()) });
    });
    return this;
  }

  /**
   * While waiting for someone to take the turn, going back resumes the turn that just ended.
   * @override
   */
  async previousTurn() {
    if ( game.user.isGM && this.getFlag("shiver", "flow") ) {
      const waiting = this.pendingStop;
      await this.update({ "flags.shiver.flow": null });
      if ( waiting ) return this;
    }
    return super.previousTurn();
  }

  /** @override */
  async previousRound() {
    if ( game.user.isGM && this.getFlag("shiver", "flow") ) await this.update({ "flags.shiver.flow": null });
    return super.previousRound();
  }

  /**
   * @param {Combatant} combatant
   * @param {User} user
   */
  async _goNow(combatant, user) {
    if ( !combatant || !this.canGoNow(combatant, user) ) {
      throw new GMOperationRefused(game.i18n.format("shiver.Combat.notWaiting", { name: combatant?.name ?? "" }));
    }
    const flow = this.flow;
    const ids = claimOrder(this._flowEntries(), flow, combatant.id);
    await this._applyOrder(ids.map(id => ({ id, state: this.constructor.stateOf(this.combatants.get(id)) })));
    await this._beginTurn(flow.round, this.turns.findIndex(c => c.id === combatant.id));
  }

  /**
   * @param {User} user
   * @param {object} [options]
   * @param {boolean} [options.skipSection]
   */
  async _endTurn(user, { skipSection = false } = {}) {
    const flow = this.flow;
    if ( !flow.begun ) return;
    if ( !skipSection && !this.canEndTurn(user) ) throw new GMOperationRefused(game.i18n.localize("shiver.Warn.NotAllowed"));
    if ( flow.current ) await this._expireEndOfTurn(this.combatants.get(flow.current.id));
    await this._setPending(nextStop(this._flowEntries(), flow, { skipSection }));
  }

  /**
   * Wait for someone to take the turn.
   * @param {{round: number, section: string}} stop
   */
  async _setPending(stop) {
    await this.update({ "flags.shiver.flow": { round: this.round, combatantId: this.combatant?.id ?? null, pending: stop } });
  }

  /**
   * Move Foundry's turn pointer forward to a turn, as core's startCombat, nextTurn and nextRound do, so the usual
   * hooks and turn events run. Combatants passed over are "skipped".
   * @param {number} round
   * @param {number} turn
   */
  async _beginTurn(round, turn) {
    const updateData = { round, turn, "flags.shiver.flow": null };
    if ( this.round === 0 ) {
      Hooks.callAll("combatStart", this, updateData);
      await this.update(updateData);
      await foundry.documents.ActiveEffect.registry?.refresh("combatStart", { combat: this });
      return;
    }
    const options = { direction: 1, worldTime: { delta: this.getTimeDelta(this.round, this.turn, round, turn) } };
    Hooks.callAll(round > this.round ? "combatRound" : "combatTurn", this, updateData, options);
    await this.update(updateData, options);
  }

  /**
   * Set the combatants' initiative so they sort into this order, keeping the turn on the same combatant. Turn events
   * don't run: no-one's turn starts or ends because of a reorder.
   * @param {{id: string, state: string|null}[]} list
   */
  async _applyOrder(list) {
    const bases = Object.fromEntries(Object.entries(CONFIG.shiver.combatStates).map(([k, v]) => [k, v.value]));
    const values = orderValues(list, bases);
    const updates = [];
    for ( const [id, initiative] of values ) {
      const c = this.combatants.get(id);
      if ( c && (c.initiative !== initiative) ) updates.push({ _id: id, initiative });
    }
    if ( !updates.length ) return;
    const currentId = this.combatant?.id;
    await this.updateEmbeddedDocuments("Combatant", updates, { turnEvents: false });
    if ( !currentId ) return;
    const turn = this.turns.findIndex(c => c.id === currentId);
    if ( (turn >= 0) && (turn !== this.turn) ) await this.update({ turn }, { turnEvents: false });
  }

  /**
   * The turn order as a list of combatants and their Combat States.
   * @returns {{id: string, state: string|null}[]}
   */
  _orderList() {
    return this.turns.map(c => ({ id: c.id, state: this.constructor.stateOf(c) }));
  }

  /* -------------------------------------------- */
  /*  Placing combatants                          */
  /* -------------------------------------------- */

  /**
   * Assign Combat States instead of rolling initiative: each combatant goes to the bottom of its suggested state.
   * @override
   */
  async rollInitiative(ids) {
    ids = typeof ids === "string" ? [ids] : ids;
    if ( !game.user.isGM ) {
      await asGM("combatAssign", { combatId: this.id, ids });
      return this;
    }
    await this._serial(() => this._assignStates(ids));
    return this;
  }

  /** @param {string[]} ids */
  async _assignStates(ids) {
    let list = this._orderList();
    for ( const id of ids ) {
      const c = this.combatants.get(id);
      if ( c ) list = moveEntry(list, id, { section: this.constructor.suggestState(c), bottom: true }) ?? list;
    }
    await this._applyOrder(list);
  }

  /**
   * Put a combatant into a Combat State, at the bottom.
   * @param {Combatant} combatant
   * @param {string} state
   */
  async setState(combatant, state) {
    return this.moveCombatant(combatant, { section: state, bottom: true });
  }

  /**
   * Move a combatant in the turn order: see moveEntry for the target.
   * @param {Combatant} combatant
   * @param {object} target
   */
  async moveCombatant(combatant, target) {
    if ( !game.user.isGM ) {
      return asGM("combatMove", {
        combatId: this.id, combatantId: combatant.id,
        targetId: target.targetId ?? null, after: !!target.after, section: target.section ?? null, bottom: !!target.bottom
      });
    }
    return this._serial(() => this._moveCombatant(combatant, target, game.user));
  }

  /**
   * @param {Combatant} combatant
   * @param {object} target
   * @param {User} user
   */
  async _moveCombatant(combatant, target, user) {
    const list = moveEntry(this._orderList(), combatant.id, target);
    if ( !list ) return;
    if ( !user.isGM && !this._playerMoveAllowed(combatant, list, user) ) {
      throw new GMOperationRefused(game.i18n.localize("shiver.Combat.cantMove"));
    }
    await this._applyOrder(list);
  }

  /**
   * A player keeps their character in its Combat State, and among those still waiting to act.
   * @param {Combatant} combatant
   * @param {{id: string, state: string|null}[]} list   The order after the move.
   * @param {User} user
   * @returns {boolean}
   */
  _playerMoveAllowed(combatant, list, user) {
    if ( !this.canMove(combatant, user) ) return false;
    if ( list.find(e => e.id === combatant.id)?.state !== this.constructor.stateOf(combatant) ) return false;
    const flow = this.flow;
    if ( !flow.begun ) return true;
    const entries = list.map(e => ({ ...e, defeated: !!this.combatants.get(e.id)?.isDefeated }));
    const pointer = this.combatant?.id;
    const turn = pointer ? list.findIndex(e => e.id === pointer) : this.turn;
    const after = describeFlow(entries, { round: this.round, turn, pending: this.pendingStop });
    return after.waiting.some(e => e.id === combatant.id);
  }

  /** @type {Set<string>} */
  #entering = new Set();

  /** Place combatants that joined together in one go, so they get distinct places. */
  #placeEntering = foundry.utils.debounce(() => {
    const ids = [...this.#entering].filter(id => this.combatants.get(id)?.initiative === null);
    this.#entering.clear();
    if ( ids.length ) this._serial(() => this._assignStates(ids)).catch(err => console.error(err));
  }, 100);

  /**
   * Put new combatants into their suggested Combat State straight away.
   * @inheritDoc
   */
  async _onEnter(combatant) {
    await super._onEnter(combatant);
    if ( combatant.initiative !== null ) return;
    this.#entering.add(combatant.id);
    this.#placeEntering();
  }

  /* -------------------------------------------- */
  /*  Turn events (run on the active GM)          */
  /* -------------------------------------------- */

  /** @override */
  async _onStartTurn(combatant, context) {
    await super._onStartTurn(combatant, context);
    // A combatant passed over (their Combat State was skipped) doesn't get a turn.
    if ( context.skipped ) return;
    // Each combatant's turn starts once a round: stepping back and forward again, or taking the turn after it was
    // handed to someone else, doesn't repeat start-of-turn effects (Bleed etc.).
    const key = String(context.round);
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
    if ( !context.skipped ) await this._expireEndOfTurn(combatant);
  }

  /**
   * End the statuses that last until the end of this combatant's turn. Runs when the turn ends, before the next
   * combatant is chosen.
   * @param {Combatant} combatant
   */
  async _expireEndOfTurn(combatant) {
    const actor = combatant?.actor;
    if ( !actor ) return;
    const expired = actor.effects.filter(e => e.flags?.shiver?.armed);
    if ( expired.length ) await actor.deleteEmbeddedDocuments("ActiveEffect", expired.map(e => e.id));
  }

  /** @override */
  async _onEndRound(context) {
    await super._onEndRound(context);
    // Starting the encounter "ends" round 0, which no-one spent anywhere.
    if ( !context.round ) return;
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

/** The drag data type for moving a combatant within the tracker. */
const DRAG_TYPE = "application/x-shiver-combatant";

/**
 * The SHIVER combat tracker: combatants grouped by Combat State, with action trackers. Combatants can be dragged to
 * reorder them or (for the GM) to change their Combat State, and take their turn with "Go now".
 */
export class ShiverCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {

  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      goNow: ShiverCombatTracker.#onGoNow,
      setCombatState: ShiverCombatTracker.#onSetState,
      toggleCombatAction: ShiverCombatTracker.#onToggleAction
    }
  };

  /** @override */
  static PARTS = {
    ...super.PARTS,
    tracker: {
      template: "systems/shiver/templates/combat/tracker.hbs",
      scrollable: [""]
    },
    footer: {
      template: "systems/shiver/templates/combat/footer.hbs"
    }
  };

  /**
   * The combatant being dragged.
   * @type {string|null}
   */
  #dragId = null;

  /** @inheritDoc */
  async _prepareCombatContext(context, options) {
    await super._prepareCombatContext(context, options);
    const combat = this.viewed;
    const flow = combat?.flow;
    context.shiver = {
      begun: !!flow?.begun,
      inProgress: !!flow?.current,
      canEndTurn: !!combat?.canEndTurn(game.user)
    };
  }

  /** @inheritDoc */
  async _prepareTrackerContext(context, options) {
    await super._prepareTrackerContext(context, options);
    const combat = this.viewed;
    if ( !combat ) return;
    const flow = combat.flow;
    const waiting = new Set(flow.waiting.map(e => e.id));
    const label = key => game.i18n.localize(CONFIG.shiver.combatStates[key]?.label ?? "");
    const groups = Object.entries(CONFIG.shiver.combatStates).map(([key, cfg]) => ({
      key, label: game.i18n.localize(cfg.label), turns: [], droppable: true, current: flow.begun && (flow.section === key)
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
      // While waiting for someone to take the turn, the last combatant to act no longer has it.
      if ( turn.active && !flow.current ) {
        turn.active = false;
        turn.css = turn.css.split(" ").filter(k => k !== "active").join(" ");
      }
      turn.acted = flow.begun && !!state && !waiting.has(turn.id) && (turn.id !== flow.current?.id);
      if ( turn.acted ) turn.css = `${turn.css} acted`.trim();
      turn.canGoNow = combat.canGoNow(c);
      turn.canDrag = combat.canMove(c);
      (groups.find(g => g.key === state) ?? unassigned).turns.push(turn);
    }
    const showEmpty = game.user.isGM && (combat.combatants.size > 0);
    context.groups = [...groups, unassigned].filter(g => g.turns.length || (showEmpty && g.droppable));
    context.stateOptions = Object.entries(CONFIG.shiver.combatStates).map(([k, v]) => ({ key: k, label: game.i18n.localize(v.label) }));
    context.flowBanner = !flow.pending ? ""
      : flow.fresh ? game.i18n.format("shiver.Combat.chooseRound", { round: flow.round, state: label(flow.section) })
        : game.i18n.format("shiver.Combat.choose", { state: label(flow.section) });
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    const list = this.element.querySelector(".shiver-tracker");
    if ( !list || list.dataset.dragBound ) return;
    list.dataset.dragBound = "true";
    list.addEventListener("dragstart", this.#onDragStart.bind(this));
    list.addEventListener("dragover", this.#onDragOver.bind(this));
    list.addEventListener("dragleave", this.#onDragLeave.bind(this));
    list.addEventListener("drop", this.#onDrop.bind(this));
    list.addEventListener("dragend", this.#onDragEnd.bind(this));
  }

  /* -------------------------------------------- */
  /*  Drag and drop                               */
  /* -------------------------------------------- */

  /** @param {DragEvent} event */
  #onDragStart(event) {
    const li = event.target.closest?.(".combatant[draggable='true']");
    if ( !li ) return;
    this.#dragId = li.dataset.combatantId;
    event.dataTransfer.setData(DRAG_TYPE, this.#dragId);
    event.dataTransfer.effectAllowed = "move";
    li.classList.add("dragging");
  }

  /**
   * Where a drag over this element would drop the combatant, if it can go there.
   * @param {DragEvent} event
   * @returns {{element: HTMLElement, target: object}|null}
   */
  #dropTarget(event) {
    const combat = this.viewed;
    const moving = combat?.combatants.get(this.#dragId);
    if ( !moving ) return null;
    const movingState = ShiverCombat.stateOf(moving);
    const element = event.target.closest?.(".combatant[data-combatant-id], .combat-state-header[data-state]");
    if ( !element ) return null;
    if ( element.matches(".combat-state-header") ) {
      const section = element.dataset.state;
      if ( !SECTIONS.includes(section) ) return null;
      if ( !game.user.isGM && (section !== movingState) ) return null;
      return { element, target: { section } };
    }
    const targetId = element.dataset.combatantId;
    const state = element.dataset.state;
    if ( (targetId === moving.id) || !SECTIONS.includes(state) ) return null;
    if ( !game.user.isGM && (state !== movingState) ) return null;
    const rect = element.getBoundingClientRect();
    return { element, target: { targetId, after: event.clientY > (rect.top + (rect.height / 2)) } };
  }

  /** @param {DragEvent} event */
  #onDragOver(event) {
    if ( !this.#dragId || !event.dataTransfer.types.includes(DRAG_TYPE) ) return;
    const drop = this.#dropTarget(event);
    this.#clearDropMarks();
    if ( !drop ) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const { element, target } = drop;
    element.classList.add(target.section ? "drop-into" : (target.after ? "drop-after" : "drop-before"));
  }

  /** @param {DragEvent} event */
  #onDragLeave(event) {
    if ( !event.currentTarget.contains(event.relatedTarget) ) this.#clearDropMarks();
  }

  /** @param {DragEvent} event */
  async #onDrop(event) {
    if ( !this.#dragId || !event.dataTransfer.types.includes(DRAG_TYPE) ) return;
    event.preventDefault();
    event.stopPropagation();
    const drop = this.#dropTarget(event);
    const combat = this.viewed;
    const moving = combat?.combatants.get(this.#dragId);
    this.#onDragEnd();
    if ( !drop || !moving ) return;
    try {
      await combat.moveCombatant(moving, drop.target);
    } catch(err) {
      ui.notifications.warn(err.message);
    }
  }

  #onDragEnd() {
    this.#dragId = null;
    this.#clearDropMarks();
    this.element.querySelectorAll(".shiver-tracker .dragging").forEach(el => el.classList.remove("dragging"));
  }

  #clearDropMarks() {
    this.element.querySelectorAll(".shiver-tracker :is(.drop-before, .drop-after, .drop-into)")
      .forEach(el => el.classList.remove("drop-before", "drop-after", "drop-into"));
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /** @this {ShiverCombatTracker} */
  static async #onGoNow(event, target) {
    const li = target.closest("[data-combatant-id]");
    const c = this.viewed?.combatants.get(li?.dataset.combatantId);
    if ( !c ) return;
    target.disabled = true;
    try {
      await this.viewed.goNow(c);
    } catch(err) {
      ui.notifications.warn(err.message);
    } finally {
      target.disabled = false;
    }
  }

  /** @this {ShiverCombatTracker} */
  static async #onSetState(event, target) {
    if ( !game.user.isGM ) return;
    const li = target.closest("[data-combatant-id]");
    const c = this.viewed?.combatants.get(li?.dataset.combatantId);
    if ( c ) await this.viewed.setState(c, target.dataset.state);
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
    for ( const [key, cfg] of Object.entries(CONFIG.shiver.combatStates).reverse() ) {
      options.unshift({
        label: game.i18n.format("shiver.Combat.setState", { state: game.i18n.localize(cfg.label) }),
        icon: '<i class="fa-solid fa-list-ol"></i>',
        visible: () => game.user.isGM,
        onClick: (event, li) => this.viewed.setState(getCombatant(li), key)
      });
    }
    options.unshift({
      label: "shiver.Combat.goNow",
      icon: '<i class="fa-solid fa-play"></i>',
      visible: li => { const c = getCombatant(li); return !!c && this.viewed.canGoNow(c); },
      onClick: (event, li) => this.viewed.goNow(getCombatant(li)).catch(err => ui.notifications.warn(err.message))
    });
    return options;
  }
}

/* -------------------------------------------- */
/*  GM operations                               */
/* -------------------------------------------- */

/**
 * The combat and combatant a player's request names.
 * @param {object} data
 * @returns {{combat: ShiverCombat, combatant: Combatant|undefined}}
 */
function requested({ combatId, combatantId }) {
  const combat = game.combats.get(combatId);
  if ( !(combat instanceof ShiverCombat) ) throw new GMOperationRefused("No such combat");
  const combatant = (combatantId === undefined) ? undefined : combat.combatants.get(combatantId);
  if ( (combatantId !== undefined) && !combatant ) throw new GMOperationRefused("No such combatant");
  return { combat, combatant };
}

// A player has their own character take the next turn.
registerGMOperation("combatGoNow", async (data, user) => {
  const { combat, combatant } = requested(data);
  requireControl(user, combatant.actor ?? combatant);
  await combat._serial(() => combat._goNow(combatant, user));
  return true;
});

// A player ends their character's turn.
registerGMOperation("combatEndTurn", async (data, user) => {
  const { combat } = requested({ combatId: data.combatId });
  await combat._serial(() => combat._endTurn(user));
  return true;
});

// A player moves their own character within its Combat State.
registerGMOperation("combatMove", async (data, user) => {
  const { combat, combatant } = requested(data);
  requireControl(user, combatant.actor ?? combatant);
  const target = {
    targetId: (typeof data.targetId === "string") ? data.targetId : null,
    after: data.after === true,
    section: SECTIONS.includes(data.section) ? data.section : null,
    bottom: data.bottom === true
  };
  await combat._serial(() => combat._moveCombatant(combatant, target, user));
  return true;
});

// A player puts their own characters into their suggested Combat States. Only characters without a state yet: moving
// one that already has a state could undo the GM's choice, or put a character who has acted back among those waiting.
registerGMOperation("combatAssign", async (data, user) => {
  const { combat } = requested({ combatId: data.combatId });
  const ids = Array.isArray(data.ids) ? data.ids.filter(id => typeof id === "string") : [];
  const own = ids.map(id => combat.combatants.get(id))
    .filter(c => c && (c.initiative === null) && canControl(user, c.actor ?? c)).map(c => c.id);
  if ( own.length ) await combat._serial(() => combat._assignStates(own));
  return true;
});
