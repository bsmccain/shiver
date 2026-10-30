import test from "node:test";
import assert from "node:assert/strict";
import { claimOrder, describeFlow, firstSection, moveEntry, nextStop, orderValues, stateForInitiative }
  from "../module/combat/flow.mjs";

// A, B in First; C, D, E in Middle; F in Last.
const entries = () => [
  { id: "A", state: "first" }, { id: "B", state: "first" },
  { id: "C", state: "middle" }, { id: "D", state: "middle" }, { id: "E", state: "middle" },
  { id: "F", state: "last" }
];
const ids = list => list.map(e => e.id);
const BASES = { first: 3, middle: 2, last: 1 };

test("flow: not begun before the combat starts", () => {
  const flow = describeFlow(entries(), { round: 0, turn: null });
  assert.equal(flow.begun, false);
  assert.equal(flow.current, null);
});

test("flow: beginning waits for someone in the first state", () => {
  const flow = describeFlow(entries(), { round: 0, turn: null, pending: { round: 1, section: "first" } });
  assert.equal(flow.begun, true);
  assert.equal(flow.fresh, true);
  assert.equal(flow.round, 1);
  assert.deepEqual(ids(flow.inSection), ["A", "B"]);
  assert.deepEqual(ids(flow.waiting), ["A", "B", "C", "D", "E", "F"]);
});

test("flow: a turn in progress; those after it are waiting", () => {
  const flow = describeFlow(entries(), { round: 1, turn: 2 });
  assert.equal(flow.current.id, "C");
  assert.equal(flow.section, "middle");
  assert.deepEqual(ids(flow.inSection), ["D", "E"]);
  assert.deepEqual(ids(flow.waiting), ["D", "E", "F"]);
});

test("flow: ending a turn stays in the state while anyone there is waiting", () => {
  const flow = describeFlow(entries(), { round: 1, turn: 2 });
  assert.deepEqual(nextStop(entries(), flow), { round: 1, section: "middle" });
  const pending = describeFlow(entries(), { round: 1, turn: 2, pending: { round: 1, section: "middle" } });
  assert.equal(pending.current, null);
  assert.deepEqual(ids(pending.inSection), ["D", "E"]);
});

test("flow: the last in a state moves the combat on to the next state", () => {
  const flow = describeFlow(entries(), { round: 1, turn: 1 });
  assert.deepEqual(ids(flow.inSection), []);
  assert.deepEqual(nextStop(entries(), flow), { round: 1, section: "middle" });
});

test("flow: the last of the round waits for the first state of the next", () => {
  const flow = describeFlow(entries(), { round: 1, turn: 5 });
  assert.deepEqual(nextStop(entries(), flow), { round: 2, section: "first" });
  const fresh = describeFlow(entries(), { round: 1, turn: 5, pending: { round: 2, section: "first" } });
  assert.equal(fresh.fresh, true);
  assert.deepEqual(ids(fresh.inSection), ["A", "B"]);
});

test("flow: skipping a state passes over those still waiting in it", () => {
  const flow = describeFlow(entries(), { round: 1, turn: 2 });
  const stop = nextStop(entries(), flow, { skipSection: true });
  assert.deepEqual(stop, { round: 1, section: "last" });
  const after = describeFlow(entries(), { round: 1, turn: 2, pending: stop });
  assert.deepEqual(ids(after.waiting), ["F"]);
  assert.deepEqual(ids(after.inSection), ["F"]);
});

test("flow: skipping the last state goes to the next round", () => {
  const flow = describeFlow(entries(), { round: 1, turn: 4, pending: { round: 1, section: "last" } });
  assert.deepEqual(nextStop(entries(), flow, { skipSection: true }), { round: 2, section: "first" });
});

test("flow: empty states are passed over", () => {
  const list = [{ id: "C", state: "middle" }, { id: "F", state: "last" }];
  assert.equal(firstSection(list), "middle");
  const flow = describeFlow(list, { round: 1, turn: 1 });
  assert.deepEqual(nextStop(list, flow), { round: 2, section: "middle" });
});

test("flow: defeated and unassigned combatants don't wait for a turn", () => {
  const list = entries();
  list[3].defeated = true;
  list.push({ id: "X", state: null });
  const flow = describeFlow(list, { round: 1, turn: 2 });
  assert.deepEqual(ids(flow.inSection), ["E"]);
  assert.deepEqual(ids(flow.waiting), ["E", "F"]);
});

test("flow: taking the turn moves a combatant to the front of those waiting in its state", () => {
  const flow = describeFlow(entries(), { round: 1, turn: 2, pending: { round: 1, section: "middle" } });
  assert.deepEqual(claimOrder(entries(), flow, "E"), ["A", "B", "C", "E", "D", "F"]);
  assert.deepEqual(claimOrder(entries(), flow, "D"), ["A", "B", "C", "D", "E", "F"]);
  const fresh = describeFlow(entries(), { round: 1, turn: 5, pending: { round: 2, section: "first" } });
  assert.deepEqual(claimOrder(entries(), fresh, "B"), ["B", "A", "C", "D", "E", "F"]);
});

test("flow: moving next to another combatant takes its state", () => {
  const list = entries();
  assert.deepEqual(moveEntry(list, "F", { targetId: "A", after: true }).map(e => `${e.id}:${e.state}`),
    ["A:first", "F:first", "B:first", "C:middle", "D:middle", "E:middle"]);
  assert.deepEqual(ids(moveEntry(list, "E", { targetId: "C" })), ["A", "B", "E", "C", "D", "F"]);
  assert.equal(moveEntry(list, "A", { targetId: "nobody" }), null);
});

test("flow: moving into a state goes to its top or bottom", () => {
  const list = [...entries(), { id: "X", state: null }];
  assert.deepEqual(ids(moveEntry(list, "X", { section: "middle" })), ["A", "B", "X", "C", "D", "E", "F"]);
  assert.deepEqual(ids(moveEntry(list, "X", { section: "middle", bottom: true })), ["A", "B", "C", "D", "E", "X", "F"]);
  assert.deepEqual(ids(moveEntry(list, "X", { section: "last", bottom: true })), ["A", "B", "C", "D", "E", "F", "X"]);
  assert.deepEqual(ids(moveEntry([{ id: "C", state: "middle" }, { id: "X", state: null }], "X", { section: "first" })),
    ["X", "C"]);
  assert.equal(moveEntry(list, "X", { section: "none" }), null);
});

test("flow: initiative values keep each state's order and range", () => {
  const list = moveEntry(entries(), "F", { section: "middle" });
  const values = orderValues([...list, { id: "X", state: null }], BASES);
  const sorted = [...list].sort((a, b) => values.get(b.id) - values.get(a.id));
  assert.deepEqual(ids(sorted), ids(list));
  for ( const e of list ) assert.equal(stateForInitiative(values.get(e.id)), e.state);
  assert.equal(values.get("X"), null);
  const many = Array.from({ length: 40 }, (_, i) => ({ id: `n${i}`, state: "last" }));
  const v = orderValues(many, BASES);
  for ( const e of many ) assert.equal(stateForInitiative(v.get(e.id)), "last");
  assert.equal(new Set(v.values()).size, 40);
});

test("flow: a pending state left with no-one waiting passes to the next stop", () => {
  const list = entries();
  list[3].defeated = true;
  list[4].defeated = true;
  const flow = describeFlow(list, { round: 1, turn: 2, pending: { round: 1, section: "middle" } });
  assert.equal(flow.section, "last");
  assert.deepEqual(ids(flow.inSection), ["F"]);
  const moved = [...entries().slice(0, 5), { id: "F", state: "last", defeated: true }];
  const end = describeFlow(moved, { round: 1, turn: 4, pending: { round: 1, section: "last" } });
  assert.equal(end.fresh, true);
  assert.equal(end.round, 2);
  assert.deepEqual(ids(end.inSection), ["A", "B"]);
  const none = describeFlow([{ id: "X", state: null }], { round: 1, turn: 0, pending: { round: 1, section: "middle" } });
  assert.equal(none.section, "middle");
});

test("flow: a new round whose waiting state empties starts from its first state, not a round later", () => {
  // Start of combat: everyone placed in Middle, then all moved to First.
  const start = [{ id: "A", state: "first" }, { id: "B", state: "first" }];
  const begin = describeFlow(start, { round: 0, turn: null, pending: { round: 1, section: "middle" } });
  assert.equal(begin.round, 1);
  assert.equal(begin.section, "first");
  assert.deepEqual(begin.stop, { round: 1, section: "first" });
  // Mid-combat: waiting for Last of round 3, and its only combatant moved to Middle.
  const mid = [{ id: "A", state: "middle" }];
  const later = describeFlow(mid, { round: 2, turn: 0, pending: { round: 3, section: "last" } });
  assert.equal(later.round, 3);
  assert.deepEqual(ids(later.inSection), ["A"]);
});

test("flow: a reorder checked against the stop actually in effect can't bring the old round back", () => {
  // A in First; B, C, D in Last. B and C have acted, the turn rests on C, D is defeated.
  const list = [{ id: "A", state: "first" }, { id: "B", state: "last" }, { id: "C", state: "last" },
    { id: "D", state: "last", defeated: true }];
  const flow = describeFlow(list, { round: 1, turn: 2, pending: { round: 1, section: "last" } });
  assert.deepEqual(flow.stop, { round: 2, section: "first" });
  // B drags after C. Against the stop in effect, B is still waiting in round 2.
  const moved = [list[0], list[2], list[1], list[3]];
  const after = describeFlow(moved, { round: 1, turn: 1, pending: flow.stop });
  assert.equal(after.round, 2);
  assert.ok(after.waiting.some(e => e.id === "B"));
});
