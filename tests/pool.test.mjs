import test from "node:test";
import assert from "node:assert/strict";
import { buildPool, evaluatePool, judge, damageMultiplier, modifyDamageForType, resolveArmour, doomQuarter,
  doomMarksCrossed, stepSpeed, tallySymbols } from "../module/dice/pool.mjs";

test("pool: Grit 5/2 -> 5d6 + 2d8 (reference example)", () => {
  const p = buildPool({ skill: 5, talent: 2 });
  assert.equal(p.d6, 5); assert.equal(p.d8, 2);
});

test("pool: advantage, disadvantage, luck and fear", () => {
  assert.deepEqual(pick(buildPool({ skill: 3, talent: 0, minorAdvantage: 1 })), [4, 0]);
  assert.deepEqual(pick(buildPool({ skill: 3, talent: 0, majorAdvantage: 1 })), [3, 1]);
  assert.deepEqual(pick(buildPool({ skill: 3, talent: 1, majorDisadvantage: 1 })), [3, 0]);
  assert.deepEqual(pick(buildPool({ skill: 3, talent: 0, majorDisadvantage: 1 })), [1, 0]);
  assert.deepEqual(pick(buildPool({ skill: 2, talent: 0, majorDisadvantage: 1 })), [1, 0]);
  assert.deepEqual(pick(buildPool({ skill: 1, talent: 0, minorDisadvantage: 1 })), [1, 0]);
  assert.deepEqual(pick(buildPool({ skill: 3, talent: 0, luck: 1 })), [4, 0]);
  assert.deepEqual(pick(buildPool({ skill: 3, talent: 0, fear: 2 })), [1, 0]);
  assert.deepEqual(pick(buildPool({ skill: 2, talent: 0, fear: 2 })), [1, 0]);
  assert.deepEqual(pick(buildPool({ skill: 1, talent: 2, fear: 2 })), [1, 2]);
  assert.deepEqual(pick(buildPool({ skill: 4, talent: 0, fear: 1, luck: 1 })), [4, 0]);
  assert.deepEqual(pick(buildPool({ skill: 0, talent: 2, fear: 2 })), [0, 2]);
  assert.deepEqual(pick(buildPool({ skill: 0, talent: 0 })), [1, 0]);
  assert.deepEqual(pick(buildPool({ skill: 3, talent: 0, bonuses: [{ label: "x", d6: 1, d8: 1 }] })), [4, 1]);
  assert.deepEqual(pick(buildPool({ skill: 3, talent: 0, penalties: [{ label: "prone", d6: -1 }] })), [2, 0]);
  assert.deepEqual(pick(buildPool({ skill: 1, talent: 2, minorDisadvantage: 1 })), [1, 2]);
  assert.deepEqual(pick(buildPool({ skill: 0, talent: 2, minorDisadvantage: 1 })), [0, 2]);
});

test("evaluate: talent symbols count for non-Strange skills, strange symbols for Strange", () => {
  // d6: grit, wit, strange, luck ; d8: double talent(7), double strange(1)
  const grit = evaluatePool([1, 2, 5, 6], [7, 1], ["grit"]);
  assert.equal(grit.successes, 3); assert.equal(grit.strange, 3); assert.equal(grit.luck, 1);
  assert.equal(grit.fullHouse, false);
  const strange = evaluatePool([1, 2, 5, 6], [7, 1], ["strange"]);
  assert.equal(strange.successes, 3);
  const combined = evaluatePool([1, 2, 5, 6], [7, 1], ["grit", "strange"]);
  assert.equal(combined.successes, 6);
  const luck = evaluatePool([6, 6], [4], ["luck"]);
  assert.equal(luck.successes, 3); assert.equal(luck.luck, 2);
});

test("full house needs 3+ dice all succeeding", () => {
  assert.equal(evaluatePool([1, 1, 1], [], ["grit"]).fullHouse, true);
  assert.equal(evaluatePool([1, 1], [4], ["grit"]).fullHouse, true);
  assert.equal(evaluatePool([1, 1], [], ["grit"]).fullHouse, false);
  assert.equal(evaluatePool([1, 1], [1], ["grit"]).fullHouse, false);
  assert.equal(evaluatePool([5, 5], [2], ["strange"]).fullHouse, true);
});

test("judge vs CR", () => {
  assert.equal(judge(1, 2), "failure");
  assert.equal(judge(2, 2), "success");
  assert.equal(judge(3, 1), "critical");
  assert.equal(judge(3, 1, true), "fullHouse");
  assert.equal(judge(3, 4, true), "failure");
  assert.equal(judge(3, null), null);
  assert.equal(damageMultiplier("critical"), 2);
  assert.equal(damageMultiplier("fullHouse"), 3);
});

test("damage modifiers", () => {
  assert.equal(modifyDamageForType(5, { resistant: true }), 2);
  assert.equal(modifyDamageForType(5, { weak: true }), 10);
  assert.equal(modifyDamageForType(5, { immune: true }), 0);
});

test("armour", () => {
  const r = resolveArmour(3, [{ id: "a", hp: 2 }, { id: "b", hp: 0 }, { id: "c", hp: 1 }], [6, 5]);
  assert.equal(r.damage, 1);
  assert.deepEqual(r.rolls.map(x => [x.id, x.blocked, x.wound]), [["a", 1, 0], ["c", 1, 1]]);
  const s = resolveArmour(1, [{ id: "a", hp: 2 }, { id: "c", hp: 2 }], [6, 5]);
  assert.equal(s.damage, 0); assert.equal(s.rolls.length, 2);
  assert.deepEqual(s.rolls.map(x => [x.blocked, x.wound]), [[1, 0], [0, 1]]);
});

test("doom", () => {
  assert.equal(doomQuarter(0), 0); assert.equal(doomQuarter(14), 0); assert.equal(doomQuarter(15), 1);
  assert.equal(doomQuarter(60), 4);
  assert.deepEqual(doomMarksCrossed(13, 31), [15, 30]);
  assert.deepEqual(doomMarksCrossed(15, 16), []);
});

test("speed + tally", () => {
  assert.equal(stepSpeed("average", -1), "slow");
  assert.equal(stepSpeed("slow", -1), "slow");
  assert.equal(stepSpeed("average", 5), "fast");
  assert.deepEqual(tallySymbols([1, 6], [8, 2]), { grit: 1, wit: 0, smarts: 0, heart: 0, luck: 1, strange: 1, talent: 2 });
});

function pick(p) { return [p.d6, p.d8]; }
