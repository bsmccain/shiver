import { damageMultiplier, evaluatePool, judge, tallySymbols } from "./pool.mjs";
import { SkillDie, TalentDie } from "./terms.mjs";
import { checkDialog } from "./check-dialog.mjs";
import { DoomClock } from "../doom/doom-clock.mjs";
import { asGM, registerGMOperation, serialize, waitFor } from "../socket.mjs";

const { OperatorTerm } = foundry.dice.terms;

/**
 * Roll a pool of Skill and Talent Dice.
 * @param {number} d6
 * @param {number} d8
 * @returns {Promise<Roll>}
 */
export async function rollDice(d6, d8) {
  const terms = [];
  if ( d6 > 0 ) terms.push(new SkillDie({ number: d6 }));
  if ( d8 > 0 ) {
    if ( terms.length ) terms.push(new OperatorTerm({ operator: "+" }));
    terms.push(new TalentDie({ number: d8 }));
  }
  if ( !terms.length ) terms.push(new SkillDie({ number: 1 }));
  return Roll.fromTerms(terms).evaluate();
}

/**
 * Why a helper can't assist a roller in combat, if they can't (p.13).
 * @param {Actor|null} roller
 * @param {Actor} helper
 * @returns {Promise<string|null>}
 */
async function assistProblem(roller, helper) {
  const { actionAllowance, actionsUsed, combatantFor } = await import("../combat/actions.mjs");
  if ( helper.statusRules?.some(r => r.noActions) ) return game.i18n.format("shiver.Check.assistCantAct", { name: helper.name });
  const hc = combatantFor(helper);
  const rc = roller ? combatantFor(roller) : null;
  if ( !hc || !rc ) return null;
  const stateOf = CONFIG.Combat.documentClass.stateOf;
  if ( stateOf(hc) !== stateOf(rc) ) return game.i18n.format("shiver.Check.assistState", { name: helper.name });
  if ( actionsUsed(helper).interact >= actionAllowance(helper).interact ) return game.i18n.format("shiver.Check.assistInteract", { name: helper.name });
  return null;
}

/**
 * Read the Skill Die and Talent Die faces from a roll.
 * @param {Roll} roll
 * @returns {{d6: number[], d8: number[]}}
 */
export function facesOf(roll) {
  const d6 = [];
  const d8 = [];
  for ( const die of roll?.dice ?? [] ) {
    const target = (die instanceof TalentDie) || (die.faces === 8) ? d8 : d6;
    for ( const r of die.results ) if ( r.active !== false ) target.push(r.result);
  }
  return { d6, d8 };
}

/* -------------------------------------------- */

/**
 * SHIVER Skill Checks and their chat cards.
 *
 * A check is rolled by its owner and then resolved by the GM: the Challenge Rating may be set by the Director after
 * the roll, and a roll with two or more Luck symbols waits for the player to choose how to use them (p.20). Once a
 * check is resolved its consequences are applied once: Doom Clock ticks, Luck banking, Fear steps, and so on.
 */
export class ShiverCheck {

  /**
   * Prompt for a Skill Check, then roll it.
   * @param {object} options   See CheckOptions in check-dialog.mjs
   * @returns {Promise<ChatMessage|null>}
   */
  static async prompt(options) {
    const config = await checkDialog(options);
    if ( !config ) return null;
    return this.roll(config);
  }

  /* -------------------------------------------- */

  /**
   * Roll a configured check and post its chat card.
   * @param {object} config
   * @returns {Promise<ChatMessage>}
   */
  static async roll(config) {
    const actor = config.actorUuid ? await fromUuid(config.actorUuid) : null;

    // Spend banked Luck declared before the roll (p.20). If the bank no longer holds it, the dice don't come.
    if ( actor && config.luckSpent ) {
      const spent = await actor.spendLuck(config.luckSpent);
      if ( !spent ) {
        config.pool = { ...config.pool, d6: Math.max((config.pool.d8 > 0) ? 0 : 1, config.pool.d6 - config.luckSpent) };
        config.notes = [...(config.notes ?? []), game.i18n.localize("shiver.Warn.LuckGone")];
        config.luckSpent = 0;
      }
    }

    const roll = await rollDice(config.pool.d6, config.pool.d8);
    const rolls = [roll];
    let assistRoll = null;
    if ( config.assist ) {
      // In combat a helper must be in the same Combat State and still have their Interact Action (p.13).
      const helper = config.assist.actorUuid ? await fromUuid(config.assist.actorUuid) : null;
      const problem = helper ? await assistProblem(actor, helper) : null;
      if ( problem ) {
        config.notes = [...(config.notes ?? []), problem];
        config.assist = null;
      }
      else {
        assistRoll = await rollDice(config.assist.d6, config.assist.d8);
        rolls.push(assistRoll);
        if ( helper ) {
          const { markAction } = await import("../combat/actions.mjs");
          await markAction(helper, "interact");
          config.assist.name = helper.name;
        }
      }
    }
    const faces = facesOf(roll);
    const assistFaces = assistRoll ? facesOf(assistRoll) : { d6: [], d8: [] };
    const main = evaluatePool(faces.d6, faces.d8, config.counted);
    const help = evaluatePool(assistFaces.d6, assistFaces.d8, config.counted);

    const state = {
      version: 1,
      type: config.type ?? "check",
      actorUuid: config.actorUuid ?? null,
      actorName: actor?.name ?? "",
      actorImg: actor?.img ?? "",
      isPC: actor?.type === "character",
      skill: config.skill,
      combined: config.combined ?? [],
      counted: config.counted,
      label: config.label ?? "",
      tags: config.tags ?? [],
      pool: config.pool,
      luckSpent: config.luckSpent ?? 0,
      dice: faces,
      assist: config.assist ? { ...config.assist, dice: assistFaces, successes: help.successes, strange: help.strange } : null,
      successes: main.successes + help.successes,
      strange: main.strange,
      assistStrange: help.strange,
      luck: main.luck,
      fullHouse: main.fullHouse,
      tally: tallySymbols(faces.d6, faces.d8),
      cr: Number.isFinite(config.cr) ? config.cr : null,
      crHidden: !!config.crHidden,
      autoFail: config.autoFail ?? null,
      // Luck Pool rolls at Death's Door or for a Luck Critical aren't checks that bank Luck.
      noLuckBank: ["deathsDoor", "luckCrit"].includes(config.type),
      // Only characters use Luck (p.20): enemies' Luck symbols do nothing.
      luckChoice: ((main.luck >= 2) && (actor?.type === "character") && !["deathsDoor", "luckCrit"].includes(config.type)) ? null : "auto",
      outcome: null,
      resolved: false,
      results: null,
      notes: config.notes ?? [],
      attack: config.attack ?? null,
      fear: config.fear ?? null,
      status: config.status ?? null,
      save: config.save ?? null,
      heal: config.heal ?? null,
      extra: config.extra ?? null,
      requestId: config.requestId ?? null,
      opposed: config.opposed ?? null,
      group: config.group ?? null,
      forcedOutcome: null,
      attackerIsNpc: actor?.type === "npc"
    };
    if ( state.attack ) {
      state.attack.targets = (state.attack.targets ?? []).map(t => ({ ...t, outcome: null, applied: false }));
    }

    // Determine the outcome straight away when nothing is pending.
    this._computeOutcome(state);

    const messageMode = config.messageMode ?? game.settings.get("core", "messageMode");
    const message = await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: await this.renderCard(state),
      rolls,
      flags: { shiver: { check: state } },
      sound: CONFIG.sounds.dice
    }, { messageMode });

    // The GM resolves consequences (Doom Clock and anything else the roller may not own).
    if ( this._isResolvable(state) ) await this.requestResolve(message);
    return message;
  }

  /* -------------------------------------------- */

  /**
   * Can a check be resolved now?
   * @param {object} state
   * @returns {boolean}
   */
  static _isResolvable(state) {
    if ( state.resolved ) return false;
    if ( state.luckChoice === null ) return false;
    // Opposed and group checks are settled by their shared card.
    if ( ["opposed", "group"].includes(state.type) ) return !!state.forcedOutcome;
    if ( state.attack?.targets?.length ) return true;
    return Number.isFinite(state.cr) || !!state.autoFail;
  }

  /**
   * Work out successes and outcome from the current state.
   * @param {object} state
   */
  static _computeOutcome(state) {
    const luckBonus = state.luckChoice === "success" ? 1 : 0;
    const successes = state.successes + luckBonus;
    state.finalSuccesses = successes;
    if ( state.forcedOutcome ) {
      state.outcome = state.forcedOutcome;
      return;
    }
    if ( state.luckChoice === null ) return;
    if ( state.attack?.targets?.length ) {
      for ( const t of state.attack.targets ) {
        t.outcome = state.autoFail ? "failure" : judge(successes, t.cr, state.fullHouse);
        // Enemies' Strikes only crit characters if the Director allows it; some Strikes can't crit at all (p.24).
        const noCrit = state.attack.noCrit || (state.attackerIsNpc && !game.settings.get("shiver", "enemyCrits"));
        if ( noCrit && ["critical", "fullHouse"].includes(t.outcome) ) t.outcome = "success";
      }
      // The check as a whole succeeds if any target was hit.
      const order = ["failure", "success", "critical", "fullHouse"];
      state.outcome = state.attack.targets.reduce((best, t) => order.indexOf(t.outcome) > order.indexOf(best) ? t.outcome : best, "failure");
      if ( !state.attack.targets.length ) state.outcome = null;
      return;
    }
    if ( state.autoFail ) state.outcome = "failure";
    else state.outcome = judge(successes, state.cr, state.fullHouse);
    // Untargeted Strikes follow the same no-crit rules as targeted ones.
    if ( state.attack && ["critical", "fullHouse"].includes(state.outcome) ) {
      const noCrit = state.attack.noCrit || (state.attackerIsNpc && !game.settings.get("shiver", "enemyCrits"));
      if ( noCrit ) state.outcome = "success";
    }
  }

  /* -------------------------------------------- */

  /**
   * Ask the GM to resolve a check message.
   * @param {ChatMessage} message
   */
  static async requestResolve(message) {
    if ( game.user.isGM ) return this._resolve({ messageId: message.id });
    if ( game.users.activeGM ) return asGM("resolveCheck", { messageId: message.id });
    // No GM: resolve what the roller can without touching the Doom Clock.
    return this._resolve({ messageId: message.id, local: true });
  }

  /**
   * Resolve a check: apply its consequences once and update the card.
   * @param {object} data
   * @param {string} data.messageId
   * @param {boolean} [data.local]   Resolved by a player because no GM is connected
   * @returns {Promise<object|undefined>}
   */
  static async _resolve({ messageId, local = false }) {
    return serialize(`check.${messageId}`, () => this.#resolve({ messageId, local }));
  }

  static async #resolve({ messageId, local = false }) {
    const message = await waitFor(() => game.messages.get(messageId));
    if ( !message ) return;
    const state = foundry.utils.deepClone(message.getFlag("shiver", "check"));
    if ( !state || !this._isResolvable(state) ) return;
    this._computeOutcome(state);
    if ( !state.outcome && !state.attack?.targets?.length ) return;

    const actor = state.actorUuid ? await fromUuid(state.actorUuid) : null;
    const results = { doom: 0, doomUp: 0, doomBack: 0, doomReasons: [], luckBanked: 0, luckLost: 0, notes: [] };
    const failed = state.outcome === "failure";

    // Doom Clock: +1 per Strange symbol on a failed check, including an assistant's (p.11, p.13, p.19).
    if ( failed && state.isPC ) {
      const isFear = state.type === "fear";
      const strangeCounts = !isFear || game.settings.get("shiver", "fearCheckStrangeDoom");
      let strange = (strangeCounts ? state.strange : 0) + (state.assistStrange ?? 0);
      // Flaws such as Cocky add extra minutes per Strange symbol counted.
      const counted = strangeCounts ? state.strange : 0;
      for ( const rule of actor?.rulesOfKind("doomModifier") ?? [] ) {
        if ( rule.extraPerStrange && counted ) {
          strange += rule.extraPerStrange * counted;
          results.notes.push(rule.item?.name);
        }
      }
      if ( strange ) {
        results.doomUp += strange;
        results.doomReasons.push(game.i18n.format("shiver.Doom.reasonStrange", { n: strange }));
      }
      // A failed Fear Check ticks the clock one more minute (p.19).
      if ( isFear ) {
        results.doomUp += 1;
        results.doomReasons.push(game.i18n.localize("shiver.Doom.reasonFear"));
      }
    }

    // Double Luck can turn the Doom Clock back (p.19).
    if ( state.luckChoice === "doom" ) results.doomBack = 1;
    results.doom = results.doomUp - results.doomBack;

    // Bank Luck Points from Luck symbols (p.20). Two used together for another purpose are not banked.
    const luckToBank = Math.max(0, state.luck - (["success", "doom"].includes(state.luckChoice) ? 2 : 0));
    if ( actor && luckToBank && (actor.type === "character") && !state.noLuckBank ) {
      results.luckBanked = await actor.bankLuck(luckToBank);
      results.luckLost = luckToBank - results.luckBanked;
    }

    // Type-specific consequences.
    await this._applyTypeResults(state, actor, results);

    state.resolved = true;
    state.results = results;
    await message.update({
      content: await this.renderCard(state),
      "flags.shiver.check": state
    });

    // Ticks up and back are applied separately, so Flaws that change one direction (The Curse doubles increases,
    // a Weird curse forbids turning back) see the right amount.
    if ( !local ) {
      if ( results.doomUp ) {
        await DoomClock.tick(results.doomUp, { reason: `${state.label || ""} ${results.doomReasons.join(", ")}`.trim(), actorUuid: state.actorUuid });
      }
      if ( results.doomBack ) {
        await DoomClock.tick(-results.doomBack, { reason: `${state.label || ""} ${game.i18n.localize("shiver.Doom.reasonLuck")}`.trim(), actorUuid: state.actorUuid });
      }
    }
    else if ( results.doomUp || results.doomBack ) {
      ui.notifications.warn("shiver.Warn.DoomNoGM", { localize: true });
    }
    Hooks.callAll("shiver.checkResolved", message, state);
    return state;
  }

  /**
   * Apply the consequences specific to each kind of check.
   * @param {object} state
   * @param {Actor} actor
   * @param {object} results
   * @protected
   */
  static async _applyTypeResults(state, actor, results) {
    const success = ["success", "critical", "fullHouse"].includes(state.outcome);
    switch ( state.type ) {
      case "fear": {
        if ( !actor ) break;
        if ( !success ) {
          // Failing a Fear Check worsens Fear Status one step, or to a set level (p.96).
          const from = actor.fearLevel;
          const to = state.fear?.setAtLeast ? Math.max(from, state.fear.setAtLeast) : Math.min(2, from + 1);
          await actor.setFearLevel(to);
          results.fear = { from, to };
          for ( const rule of actor.rulesOfKind("onFearFail") ) {
            if ( rule.damage ) {
              const { applyDamage } = await import("../combat/damage.mjs");
              await applyDamage(actor, { amount: rule.damage, type: rule.type ?? "soul", strike: false, notes: [rule.item?.name ?? ""] });
              results.notes.push(rule.item?.name);
            }
          }
        }
        else if ( state.fear?.purpose === "steady" ) {
          const from = actor.fearLevel;
          await actor.setFearLevel(from - 1);
          results.fear = { from, to: Math.max(0, from - 1) };
        }
        break;
      }
      case "removal": {
        if ( success && actor && state.status?.id ) {
          await actor.removeStatus(state.status.id);
          results.removed = state.status.id;
        }
        break;
      }
      case "save": {
        if ( !success && actor && state.save?.status ) {
          await actor.applyStatus(state.save.status, {
            value: state.save.value, origin: state.save.origin, duration: state.save.duration, flags: state.save.flags ?? {}
          });
          results.applied = state.save.status;
        }
        break;
      }
      case "deathsDoor": {
        if ( !actor || !actor.hasStatus("deathsDoor") ) break;
        if ( success ) {
          results.survived = true;
          // Earth, Wind & Fire "Regenerate": 3+ Luck symbols wake you and heal 4 (p.95).
          const regen = actor.rulesOfKind("deathsDoorRegenerate")[0];
          if ( regen && ((state.tally.luck + state.tally.talent) >= (regen.luck ?? 3)) ) {
            const healed = await actor.heal(regen.heal ?? 4, { source: regen.item?.name });
            if ( healed ) {
              await actor.removeStatus("unconscious");
              results.notes.push(regen.item?.name);
            }
          }
        }
        else {
          await actor._onDeath();
          results.died = true;
        }
        break;
      }
      case "stabilise": {
        const target = state.extra?.targetUuid ? await fromUuid(state.extra.targetUuid) : null;
        // Stabilising regains one Health Point; the character stays unconscious (p.15). The health change itself
        // swaps Death's Door for Unconscious.
        if ( success && target?.hasStatus("deathsDoor") ) {
          await target._ownerUpdate({ "system.hp.value": Math.max(1, target.system.hp.value) }, { shiverAllowHeal: true });
          results.stabilised = target.name;
        }
        break;
      }
      case "heal": {
        const target = state.extra?.targetUuid ? await fromUuid(state.extra.targetUuid) : actor;
        if ( success && target && state.heal ) {
          const symbols = state.counted.reduce((n, s) => n + (state.tally[s] ?? 0), 0)
            + (state.counted.some(s => s !== "strange") ? state.tally.talent : 0);
          const amount = (state.heal.base ?? 0) + Math.max(0, symbols - (state.heal.freeSymbols ?? 0)) * (state.heal.perSymbol ?? 0);
          results.healed = await target.heal(amount, { source: state.label });
        }
        break;
      }
    }
    const list = success ? state.extra?.onSuccess : (state.outcome === "failure" ? state.extra?.onFailure : null);
    if ( actor && list?.length ) {
      const { applyEffectRules } = await import("../documents/actor-actions.mjs");
      const targets = [];
      for ( const uuid of state.extra.targetUuids ?? [] ) {
        const t = await fromUuid(uuid);
        if ( t ) targets.push(t);
      }
      results.notes.push(...await applyEffectRules(actor, list, targets, state.label));
    }
    if ( success && actor && state.extra?.onSuccessStatus ) {
      await actor.applyStatus(state.extra.onSuccessStatus);
      results.applied = state.extra.onSuccessStatus;
    }
    if ( state.extra?.onResolve ) Hooks.callAll(`shiver.${state.extra.onResolve}`, state, actor, results);
  }

  /* -------------------------------------------- */
  /*  Card actions                                */
  /* -------------------------------------------- */

  /**
   * Handle a click on a chat card button.
   * @param {ChatMessage} message
   * @param {string} action
   * @param {DOMStringMap} data
   */
  static async onCardAction(message, action, data) {
    const state = message.getFlag("shiver", "check");
    switch ( action ) {
      case "setCR":
        if ( !game.user.isGM ) return;
        return this._onSetCR({ messageId: message.id, cr: Number(data.cr) });
      case "luckChoice":
        if ( !this._canControl(state) ) return;
        // With no GM connected, the roller settles their own card (the Doom Clock waits for a GM).
        if ( game.user.isGM || (!game.users.activeGM && message.isAuthor) ) {
          return this._onLuckChoice({ messageId: message.id, choice: data.choice, local: !game.user.isGM });
        }
        return asGM("luckChoice", { messageId: message.id, choice: data.choice });
    }
  }

  /**
   * Can the current user make choices for this check's roller?
   * @param {object} state
   * @returns {boolean}
   */
  static _canControl(state) {
    if ( game.user.isGM ) return true;
    const actor = state?.actorUuid ? fromUuidSync(state.actorUuid) : null;
    return !!actor?.isOwner;
  }

  /** GM: set the Challenge Rating of a pending check. */
  static async _onSetCR(data) {
    return serialize(`check.${data.messageId}`, () => this.#setCR(data));
  }

  static async #setCR({ messageId, cr, hidden }) {
    const message = await waitFor(() => game.messages.get(messageId));
    const state = foundry.utils.deepClone(message?.getFlag("shiver", "check"));
    if ( !state || state.resolved ) return;
    state.cr = cr;
    if ( hidden !== undefined ) state.crHidden = hidden;
    this._computeOutcome(state);
    await message.update({ content: await this.renderCard(state), "flags.shiver.check": state });
    if ( this._isResolvable(state) ) await this.#resolve({ messageId });
  }

  /**
   * GM: settle a check's outcome from outside (opposed and group checks), then resolve it.
   * @param {object} data
   */
  static async _forceOutcome(data) {
    return serialize(`check.${data.messageId}`, () => this.#forceOutcome(data));
  }

  static async #forceOutcome({ messageId, outcome }) {
    const message = await waitFor(() => game.messages.get(messageId));
    const state = foundry.utils.deepClone(message?.getFlag("shiver", "check"));
    if ( !state || state.resolved ) return;
    state.forcedOutcome = outcome;
    if ( state.luckChoice === null ) state.luckChoice = "bank";
    this._computeOutcome(state);
    await message.update({ content: await this.renderCard(state), "flags.shiver.check": state });
    await this.#resolve({ messageId });
  }

  /** GM: record how two Luck symbols are used. */
  static async _onLuckChoice(data) {
    return serialize(`check.${data.messageId}`, () => this.#luckChoice(data));
  }

  static async #luckChoice({ messageId, choice, local = false }) {
    const message = await waitFor(() => game.messages.get(messageId));
    const state = foundry.utils.deepClone(message?.getFlag("shiver", "check"));
    if ( !state || state.resolved || (state.luckChoice !== null) ) return;
    if ( !["bank", "success", "doom"].includes(choice) ) return;
    state.luckChoice = choice;
    this._computeOutcome(state);
    await message.update({ content: await this.renderCard(state), "flags.shiver.check": state });
    if ( this._isResolvable(state) ) await this.#resolve({ messageId, local });
    Hooks.callAll("shiver.luckChosen", message, state);
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /**
   * Render the chat card for a check.
   * @param {object} state
   * @returns {Promise<string>}
   */
  static async renderCard(state) {
    const skillCfg = CONFIG.shiver.skills[state.skill];
    const dice = [
      ...state.dice.d6.map(f => ({ img: CONFIG.shiver.skills[CONFIG.shiver.skillDieFaces[f]]?.icon, title: game.i18n.localize(CONFIG.shiver.skills[CONFIG.shiver.skillDieFaces[f]]?.label ?? ""), counts: state.counted.includes(CONFIG.shiver.skillDieFaces[f]), type: "d6" })),
      ...state.dice.d8.map(f => {
        const face = CONFIG.shiver.talentDieFaces[f];
        const counts = face.symbol === "talent" ? state.counted.some(s => s !== "strange") : state.counted.includes("strange");
        return { img: CONFIG.shiver.talentDieImages[f], title: `${face.count}× ${game.i18n.localize(face.symbol === "talent" ? "shiver.Symbol.talent" : "shiver.SkillStrange")}`, counts, type: "d8" };
      })
    ];
    const assistDice = state.assist ? [
      ...state.assist.dice.d6.map(f => ({ img: CONFIG.shiver.skills[CONFIG.shiver.skillDieFaces[f]]?.icon, type: "d6" })),
      ...state.assist.dice.d8.map(f => ({ img: CONFIG.shiver.talentDieImages[f], type: "d8" }))
    ] : [];
    const tally = Object.entries(state.tally).filter(([, n]) => n).map(([k, n]) => ({
      key: k, n, label: game.i18n.localize(k === "talent" ? "shiver.Symbol.talent" : CONFIG.shiver.skills[k].label)
    }));
    const outcomeLabel = state.outcome ? game.i18n.localize(`shiver.Outcome.${state.outcome}`) : null;
    const showCR = Number.isFinite(state.cr) && !state.crHidden;
    const pendingCR = !state.attack?.targets?.length && !Number.isFinite(state.cr) && !state.autoFail
      && !["opposed", "group"].includes(state.type);
    const r = state.results ?? {};
    const results = [];
    const up = r.doomUp ?? Math.max(0, r.doom ?? 0);
    const back = r.doomBack ?? Math.max(0, -(r.doom ?? 0));
    if ( up > 0 ) results.push({ icon: "fa-clock", cls: "doom", text: game.i18n.format("shiver.Check.doomUp", { n: up }) });
    if ( back > 0 ) results.push({ icon: "fa-clock-rotate-left", cls: "doom-back", text: game.i18n.format("shiver.Check.doomDown", { n: back }) });
    if ( r.luckBanked ) results.push({ icon: "fa-clover", cls: "luck", text: game.i18n.format("shiver.Check.luckBanked", { n: r.luckBanked }) });
    if ( r.luckLost ) results.push({ icon: "fa-clover", cls: "luck-lost", text: game.i18n.format("shiver.Check.luckLost", { n: r.luckLost }) });
    if ( r.fear ) results.push({ icon: "fa-ghost", cls: "fear", text: game.i18n.format("shiver.Check.fearChange", {
      from: game.i18n.localize(`shiver.Fear.${CONFIG.shiver.fearLevels[r.fear.from]}`),
      to: game.i18n.localize(`shiver.Fear.${CONFIG.shiver.fearLevels[r.fear.to]}`) }) });
    if ( r.removed ) results.push({ icon: "fa-check", cls: "removed", text: game.i18n.format("shiver.Check.statusRemoved", { status: game.i18n.localize(`shiver.Status.${r.removed}`) }) });
    if ( r.applied ) results.push({ icon: "fa-triangle-exclamation", cls: "applied", text: game.i18n.format("shiver.Check.statusApplied", { status: game.i18n.localize(`shiver.Status.${r.applied}`) }) });
    if ( r.survived ) results.push({ icon: "fa-heart", cls: "survived", text: game.i18n.localize("shiver.Death.survived") });
    if ( r.died ) results.push({ icon: "fa-skull", cls: "died", text: game.i18n.localize("shiver.Death.failed") });
    if ( r.stabilised ) results.push({ icon: "fa-kit-medical", cls: "stabilised", text: game.i18n.format("shiver.Death.stabilised", { name: r.stabilised }) });
    if ( r.healed ) results.push({ icon: "fa-heart-pulse", cls: "healed", text: game.i18n.format("shiver.Heal.amount", { n: r.healed }) });
    for ( const n of (r.notes ?? []).filter(Boolean) ) results.push({ icon: "fa-circle-info", cls: "note", text: n });

    const attack = state.attack ? this._attackContext(state) : null;
    return foundry.applications.handlebars.renderTemplate("systems/shiver/templates/chat/check-card.hbs", {
      state, dice, assistDice, tally, outcomeLabel, showCR, pendingCR, results, attack,
      skillLabel: skillCfg ? game.i18n.localize(skillCfg.label) : "",
      skillImg: skillCfg?.icon,
      combinedLabels: (state.combined ?? []).map(s => game.i18n.localize(CONFIG.shiver.skills[s]?.label ?? s)),
      crOptions: [1, 2, 3, 4, 5],
      luckPending: state.luckChoice === null,
      // On a Luck check the Luck symbols are already successes (p.20).
      luckSuccessAllowed: !state.counted.includes("luck"),
      luckChoiceLabel: ["bank", "success", "doom"].includes(state.luckChoice) ? game.i18n.localize(`shiver.Luck.${state.luckChoice}`) : null,
      luckSpent: state.luckSpent
    });
  }

  /**
   * Prepare attack details for the card.
   * @param {object} state
   * @returns {object}
   */
  static _attackContext(state) {
    const a = state.attack;
    const typeLabel = game.i18n.localize(CONFIG.shiver.damageTypes[a.damageType]?.label ?? a.damageType ?? "");
    const crit = CONFIG.shiver.criticalEffects[state.skill];
    const targets = (a.targets ?? []).map((t, i) => {
      const mult = damageMultiplier(t.outcome);
      return {
        ...t, index: i,
        hit: mult > 0,
        outcomeLabel: t.outcome ? game.i18n.localize(`shiver.Outcome.${t.outcome}`) : "",
        damage: (a.damage ?? 0) * mult,
        multiplier: mult,
        critEffect: ((t.outcome === "critical") || (t.outcome === "fullHouse")) && !a.noCrit && crit ? game.i18n.localize(crit.label) : null,
        strikeAgain: ((t.outcome === "critical") || (t.outcome === "fullHouse")) && !a.noCrit && !!crit?.strikeAgain && !state.extraStrikeTaken
      };
    });
    return { ...a, typeLabel, targets, untargeted: !targets.length };
  }
}

/* -------------------------------------------- */

registerGMOperation("resolveCheck", data => ShiverCheck._resolve(data));
registerGMOperation("claimStrikeAgain", ({ messageId }) => serialize(`check.${messageId}`, async () => {
  const message = game.messages.get(messageId);
  const state = message?.getFlag("shiver", "check");
  if ( !state || state.extraStrikeTaken ) return false;
  await message.update({ "flags.shiver.check.extraStrikeTaken": true });
  return true;
}));
registerGMOperation("releaseStrikeAgain", ({ messageId }) => serialize(`check.${messageId}`, async () => {
  const message = game.messages.get(messageId);
  if ( message?.getFlag("shiver", "check")?.extraStrikeTaken ) await message.update({ "flags.shiver.check.extraStrikeTaken": false });
  return true;
}));
registerGMOperation("luckChoice", data => ShiverCheck._onLuckChoice(data));
