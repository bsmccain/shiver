/**
 * Turn flow for SHIVER's Combat States (p.21-22), kept free of Foundry code so it can be tested.
 *
 * A round runs through the Combat States in order: First, then Middle, then Last. Within a state the characters choose
 * who acts next. The combat's turn order always reads [already acted] [current turn] [still waiting]: whoever acts
 * next is moved to the front of the waiting combatants in their state, so the order on the tracker is the order in
 * which people actually went.
 *
 * Between turns the combat can wait for someone to be chosen. That "pending stop" names the round and Combat State the
 * next turn comes from. Foundry's turn pointer stays on the last combatant to act until someone takes the turn.
 *
 * An entry is `{ id, state, defeated }`, listed in turn order. `state` is "first", "middle", "last", or null when the
 * combatant has no Combat State yet.
 */

export const SECTIONS = Object.freeze(["first", "middle", "last"]);

/**
 * The position of a Combat State in the round, or -1 for none.
 * @param {string|null} state
 * @returns {number}
 */
export function rankOf(state) {
  return SECTIONS.indexOf(state);
}

/**
 * The Combat State an initiative value stands for. Each state owns the values within 0.5 of its base (3, 2, 1).
 * @param {number|null} initiative
 * @returns {string|null}
 */
export function stateForInitiative(initiative) {
  if ( !Number.isFinite(initiative) ) return null;
  if ( initiative >= 2.5 ) return "first";
  if ( initiative >= 1.5 ) return "middle";
  return "last";
}

const playing = e => !!e.state && !e.defeated;

/**
 * The first Combat State anyone is in.
 * @param {object[]} entries
 * @returns {string}
 */
export function firstSection(entries) {
  return entries.find(playing)?.state ?? SECTIONS[0];
}

/**
 * Where the round stands.
 * @param {object[]} entries
 * @param {object} combat
 * @param {number} combat.round            The combat's round (0 before it starts).
 * @param {number|null} combat.turn        The index of Foundry's current turn.
 * @param {{round: number, section: string}|null} [combat.pending]  Set while waiting for someone to take the turn.
 * @returns {{begun: boolean, round: number, section: string|null, pending: boolean, stop: object|null,
 *   fresh: boolean, current: object|null, waiting: object[], inSection: object[]}}
 *   `stop` is the stop the combat is actually waiting at: the stored one, or the next one if the stored state has
 *   no-one left waiting.
 *   `round` is the round being played (one ahead of the combat's while a new round waits for its first turn).
 *   `current` is the combatant whose turn is in progress. `waiting` lists everyone still to act this round, and
 *   `inSection` those of them in the current Combat State: the ones who may act next.
 */
export function describeFlow(entries, { round = 0, turn = null, pending = null } = {}) {
  const flow = flowAt(entries, round, turn, pending);
  if ( !flow.pending || flow.inSection.length || !entries.some(playing) ) return flow;
  // A Combat State left with no-one waiting (they were moved, defeated or removed) passes to the next stop. In a round
  // that hasn't started yet no-one has acted, so it starts again from the first state with anyone in it.
  const stop = flow.fresh ? { round: flow.round, section: firstSection(entries) }
    : nextStop(entries, flow, { skipSection: true });
  return flowAt(entries, round, turn, stop);
}

/**
 * describeFlow, without passing over an empty Combat State.
 * @returns {object}
 */
function flowAt(entries, round, turn, pending) {
  const pointer = Number.isInteger(turn) ? (entries[turn] ?? null) : null;
  const begun = (round > 0) || !!pending;
  const flowRound = pending ? pending.round : round;
  const fresh = flowRound > round;
  const from = (fresh || !pointer) ? 0 : turn + 1;
  const later = entries.filter((e, i) => (i >= from) && playing(e));
  const section = pending?.section ?? pointer?.state ?? later[0]?.state ?? null;
  const waiting = section ? later.filter(e => rankOf(e.state) >= rankOf(section)) : [];
  return {
    begun,
    round: flowRound,
    section,
    pending: !!pending,
    stop: pending ? { round: flowRound, section } : null,
    fresh,
    current: (begun && !pending) ? pointer : null,
    waiting,
    inSection: waiting.filter(e => e.state === section)
  };
}

/**
 * Where the combat waits after the current turn ends: the same Combat State while anyone in it is still waiting,
 * otherwise the next state with someone waiting, otherwise the first state of the next round.
 * @param {object[]} entries
 * @param {object} flow                  From describeFlow.
 * @param {object} [options]
 * @param {boolean} [options.skipSection=false]  Leave the current Combat State even if some are still waiting: they
 *                                               lose their turn.
 * @returns {{round: number, section: string}}
 */
export function nextStop(entries, flow, { skipSection = false } = {}) {
  const { round, section } = flow;
  if ( !skipSection && flow.inSection.length ) return { round, section };
  const after = flow.waiting.find(e => rankOf(e.state) > rankOf(section));
  if ( after ) return { round, section: after.state };
  return { round: round + 1, section: firstSection(entries) };
}

/**
 * Does a reorder leave everyone else's turn as it was? Only the moved combatants may change between having acted and
 * still waiting; the round and the turn in progress must stay the same. Before a round's first turn, any move within
 * the round is allowed.
 * @param {object} before      describeFlow before the reorder.
 * @param {object} after       describeFlow after it.
 * @param {Iterable<string>} moved
 * @returns {boolean}
 */
export function turnsKept(before, after, moved) {
  if ( !before.begun ) return true;
  // In a round that hasn't started no-one has acted. A move can only bring back the turns of a passed-over state.
  if ( before.fresh ) return after.round === before.round;
  if ( (after.round !== before.round) || ((after.current?.id ?? null) !== (before.current?.id ?? null)) ) return false;
  const skip = new Set(moved);
  const was = new Set(before.waiting.map(e => e.id));
  const now = new Set(after.waiting.map(e => e.id));
  return [...was, ...now].every(id => skip.has(id) || (was.has(id) === now.has(id)));
}

/**
 * The turn order once a combatant takes the next turn: they move to the front of those waiting in their state.
 * @param {object[]} entries
 * @param {object} flow     From describeFlow.
 * @param {string} id
 * @returns {string[]}      Combatant ids in turn order.
 */
export function claimOrder(entries, flow, id) {
  const ids = entries.map(e => e.id);
  const front = flow.inSection[0]?.id;
  if ( !front || (front === id) ) return ids;
  const rest = ids.filter(i => i !== id);
  rest.splice(rest.indexOf(front), 0, id);
  return rest;
}

/**
 * Move one combatant in the order: next to another combatant (taking on its Combat State), or to the top or bottom
 * of a Combat State.
 * @param {{id: string, state: string|null}[]} list   In turn order.
 * @param {string} id
 * @param {object} target
 * @param {string} [target.targetId]   Drop next to this combatant.
 * @param {boolean} [target.after]     After it rather than before.
 * @param {string} [target.section]    Or drop into this Combat State.
 * @param {boolean} [target.bottom]    At the bottom of the state rather than the top.
 * @returns {{id: string, state: string|null}[]|null}  The new order, or null when the target isn't valid.
 */
export function moveEntry(list, id, { targetId = null, after = false, section = null, bottom = false } = {}) {
  const moving = list.find(e => e.id === id);
  if ( !moving ) return null;
  const rest = list.filter(e => e.id !== id);
  let index;
  let state;
  if ( targetId ) {
    const t = rest.findIndex(e => e.id === targetId);
    if ( (t < 0) || !rest[t].state ) return null;
    state = rest[t].state;
    index = t + (after ? 1 : 0);
  }
  else {
    if ( rankOf(section) < 0 ) return null;
    state = section;
    const r = rankOf(section);
    index = rest.findIndex(e => (rankOf(e.state) < 0) || (bottom ? rankOf(e.state) > r : rankOf(e.state) >= r));
    if ( index < 0 ) index = rest.length;
  }
  rest.splice(index, 0, { ...moving, state });
  return rest;
}

/**
 * Initiative values that sort a list into its order: each Combat State's combatants spread evenly within its range.
 * @param {{id: string, state: string|null}[]} list
 * @param {Record<string, number>} bases   The base value of each state (first: 3, middle: 2, last: 1).
 * @returns {Map<string, number|null>}
 */
export function orderValues(list, bases) {
  const values = new Map();
  for ( const state of SECTIONS ) {
    const group = list.filter(e => e.state === state);
    const n = group.length;
    group.forEach((e, i) => values.set(e.id, Math.round((bases[state] + 0.45 - (0.9 * (i + 0.5) / n)) * 10000) / 10000));
  }
  for ( const e of list ) if ( !e.state ) values.set(e.id, null);
  return values;
}
