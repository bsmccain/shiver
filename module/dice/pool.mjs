/**
 * Pure SHIVER dice pool rules: building a pool, reading Archetype Dice symbols, and judging the result.
 * Nothing in here touches documents, so it can be unit tested outside Foundry.
 */

/** Skill Die faces, p.10. */
export const SKILL_DIE_FACES = Object.freeze({ 1: "grit", 2: "wit", 3: "smarts", 4: "heart", 5: "strange", 6: "luck" });

/** Talent Die faces, p.10/p.13. */
export const TALENT_DIE_FACES = Object.freeze({
  1: { symbol: "strange", count: 2 },
  2: { symbol: "strange", count: 1 },
  3: { symbol: "strange", count: 1 },
  4: { symbol: "talent", count: 1 },
  5: { symbol: "talent", count: 1 },
  6: { symbol: "talent", count: 1 },
  7: { symbol: "talent", count: 2 },
  8: { symbol: "talent", count: 2 }
});

export const SKILLS = Object.freeze(["grit", "wit", "smarts", "heart", "luck", "strange"]);

/* -------------------------------------------- */

/**
 * @typedef PoolModifier
 * @property {string} label       Why the dice were added or removed
 * @property {number} [d6=0]      Skill Dice added (negative to remove)
 * @property {number} [d8=0]      Talent Dice added (negative to remove)
 */

/**
 * @typedef PoolInput
 * @property {number} skill                   Core Skill Points (Skill Dice)
 * @property {number} talent                  Talent Points (Talent Dice)
 * @property {PoolModifier[]} [bonuses]       Abilities and other sources of extra dice (step 3)
 * @property {number} [minorAdvantage=0]      +1 d6 each (step 4)
 * @property {number} [majorAdvantage=0]      +1 d8 each (step 4)
 * @property {number} [minorDisadvantage=0]   -1 d6 each (step 4)
 * @property {number} [majorDisadvantage=0]   -1 d8 each, or -2 d6 when there is no d8 left (step 4)
 * @property {number} [luck=0]                Luck Points spent from the Luck Bank, +1 d6 each (step 5)
 * @property {number} [fear=0]                Core Skill Points lost to Fear Status: Afraid 1, Terrified 2 (step 6)
 * @property {PoolModifier[]} [penalties]     Other status penalties, e.g. Prone or Blinded
 */

/**
 * Assemble a Dice Pool in the order given on p.11. Disadvantage and Fear can never take a pool below one die
 * (p.20, p.96, player reference: "Minimum 1 die per pool").
 * @param {PoolInput} input
 * @returns {{d6: number, d8: number, steps: {label: string, d6: number, d8: number}[]}}
 */
export function buildPool(input) {
  const steps = [];
  const points = Math.max(0, Math.floor(input.skill || 0));
  let d6 = points;
  let d8 = Math.max(0, Math.floor(input.talent || 0));
  steps.push({ label: "skill", d6, d8: 0 }, { label: "talent", d6: 0, d8 });

  // Fear temporarily removes Core Skill Points from every skill, to a minimum of 1 (p.96). It is listed as the last
  // step on p.11, but only ever reduces the dice that come from Core Skill Points.
  const fear = Math.max(0, Math.floor(input.fear || 0));
  const fearLoss = (fear && (points > 0)) ? points - Math.max(1, points - fear) : 0;
  d6 -= fearLoss;

  for ( const b of input.bonuses ?? [] ) {
    const a6 = Math.trunc(b.d6 || 0);
    const a8 = Math.trunc(b.d8 || 0);
    d6 = Math.max(0, d6 + a6);
    d8 = Math.max(0, d8 + a8);
    steps.push({ label: b.label, d6: a6, d8: a8 });
  }

  const minorAdv = Math.max(0, input.minorAdvantage || 0);
  const majorAdv = Math.max(0, input.majorAdvantage || 0);
  if ( minorAdv ) { d6 += minorAdv; steps.push({ label: "minorAdvantage", d6: minorAdv, d8: 0 }); }
  if ( majorAdv ) { d8 += majorAdv; steps.push({ label: "majorAdvantage", d6: 0, d8: majorAdv }); }

  // Reductions never take the Skill Dice below one (p.20 "to a minimum of 1").
  const reduce6 = (n, label) => {
    const before = d6;
    d6 = Math.max(Math.min(d6, 1), d6 - n);
    if ( before !== d6 ) steps.push({ label, d6: d6 - before, d8: 0 });
  };

  for ( let i = 0; i < Math.max(0, input.minorDisadvantage || 0); i++ ) reduce6(1, "minorDisadvantage");
  for ( let i = 0; i < Math.max(0, input.majorDisadvantage || 0); i++ ) {
    if ( d8 > 0 ) {
      // Losing the last Talent Die can't empty the pool either.
      if ( (d8 === 1) && (d6 === 0) ) continue;
      d8 -= 1;
      steps.push({ label: "majorDisadvantage", d6: 0, d8: -1 });
    }
    else reduce6(2, "majorDisadvantage");
  }

  // Status penalties such as Prone and Blinded are Disadvantage (step 4), so they come before the Luck die.
  for ( const p of input.penalties ?? [] ) {
    if ( p.d6 ) reduce6(-p.d6, p.label);
    if ( p.d8 ) {
      const before = d8;
      d8 = Math.max((d6 > 0) ? 0 : Math.min(d8, 1), d8 + p.d8);
      if ( before !== d8 ) steps.push({ label: p.label, d6: 0, d8: d8 - before });
    }
  }

  const luck = Math.max(0, input.luck || 0);
  if ( luck ) { d6 += luck; steps.push({ label: "luck", d6: luck, d8: 0 }); }

  if ( fearLoss ) steps.push({ label: "fear", d6: -fearLoss, d8: 0 });

  if ( (d6 + d8) < 1 ) {
    d6 = 1;
    steps.push({ label: "minimum", d6: 1, d8: 0 });
  }
  return { d6, d8, steps };
}

/* -------------------------------------------- */

/**
 * Count every symbol showing on a set of rolled Archetype Dice.
 * @param {number[]} skillFaces    Skill Die (d6) results
 * @param {number[]} talentFaces   Talent Die (d8) results
 * @returns {Record<string, number>}  Counts for grit, wit, smarts, heart, luck, strange and talent. Strange includes
 *                                    the Strange symbols on Talent Dice.
 */
export function tallySymbols(skillFaces = [], talentFaces = []) {
  const tally = { grit: 0, wit: 0, smarts: 0, heart: 0, luck: 0, strange: 0, talent: 0 };
  for ( const f of skillFaces ) {
    const s = SKILL_DIE_FACES[f];
    if ( s ) tally[s] += 1;
  }
  for ( const f of talentFaces ) {
    const face = TALENT_DIE_FACES[f];
    if ( face ) tally[face.symbol] += face.count;
  }
  return tally;
}

/* -------------------------------------------- */

/**
 * @typedef PoolEvaluation
 * @property {number} successes     Symbols which count towards the Challenge Rating
 * @property {number} strange       Strange symbols rolled (each ticks the Doom Clock on a failed check)
 * @property {number} luck          Luck symbols rolled on Skill Dice (each banks a Luck Point)
 * @property {number} dice          Number of dice rolled
 * @property {boolean} fullHouse    Three or more dice where every die shows a success (p.24)
 * @property {Record<string, number>} tally
 */

/**
 * Judge a rolled pool for a Skill Check.
 *
 * Talent symbols count as any Core Skill other than Strange; Strange symbols on the Talent Die count on Strange
 * checks (p.10). A Combined Skill Check counts the symbols of every listed skill (p.12).
 *
 * @param {number[]} skillFaces           Skill Die (d6) results
 * @param {number[]} talentFaces          Talent Die (d8) results
 * @param {Iterable<string>} countedSkills  Every Core Skill whose symbols count as successes
 * @returns {PoolEvaluation}
 */
export function evaluatePool(skillFaces = [], talentFaces = [], countedSkills = []) {
  const counted = new Set(countedSkills);
  const talentCounts = [...counted].some(s => s !== "strange");
  const strangeCounts = counted.has("strange");
  let successes = 0;
  let everyDieSucceeds = true;
  for ( const f of skillFaces ) {
    if ( counted.has(SKILL_DIE_FACES[f]) ) successes += 1;
    else everyDieSucceeds = false;
  }
  for ( const f of talentFaces ) {
    const face = TALENT_DIE_FACES[f];
    const counts = face.symbol === "talent" ? talentCounts : strangeCounts;
    if ( counts ) successes += face.count;
    else everyDieSucceeds = false;
  }
  const tally = tallySymbols(skillFaces, talentFaces);
  const dice = skillFaces.length + talentFaces.length;
  return {
    successes,
    strange: tally.strange,
    luck: tally.luck,
    dice,
    fullHouse: (dice >= 3) && everyDieSucceeds,
    tally
  };
}

/* -------------------------------------------- */

/**
 * Judge successes against a Challenge Rating (p.11, p.24).
 * A Full House needs three or more dice which all show successes, and still has to meet the Challenge Rating.
 * @param {number} successes
 * @param {number|null} cr
 * @param {boolean} [fullHouse=false]
 * @returns {"failure"|"success"|"critical"|"fullHouse"|null}   Null while the Challenge Rating is unknown.
 */
export function judge(successes, cr, fullHouse = false) {
  if ( !Number.isFinite(cr) ) return null;
  if ( successes < cr ) return "failure";
  if ( fullHouse ) return "fullHouse";
  if ( successes >= cr + 2 ) return "critical";
  return "success";
}

/* -------------------------------------------- */

/**
 * The damage multiplier for an outcome: Critical Hits double damage and Full Houses triple it (p.24).
 * @param {string|null} outcome
 * @returns {number}
 */
export function damageMultiplier(outcome) {
  if ( outcome === "fullHouse" ) return 3;
  if ( outcome === "critical" ) return 2;
  if ( outcome === "success" ) return 1;
  return 0;
}

/* -------------------------------------------- */

/**
 * Apply an enemy's damage modifiers for a damage type (p.23): Immune takes none, Resistant takes half rounded down,
 * Weakness takes double.
 * @param {number} amount
 * @param {{immune?: boolean, resistant?: boolean, weak?: boolean}} mods
 * @returns {number}
 */
export function modifyDamageForType(amount, { immune = false, resistant = false, weak = false } = {}) {
  if ( immune ) return 0;
  let n = amount;
  if ( resistant ) n = Math.floor(n / 2);
  if ( weak ) n *= 2;
  return n;
}

/* -------------------------------------------- */

/**
 * Resolve armour rolls (p.15). Each Armour Slot with Health Points left rolls one Skill Die, one at a time:
 * Luck reduces the damage by 1; Strange reduces it by 1 and the armour takes a wound; anything else does nothing.
 * Every eligible slot rolls, even once the damage is gone, because the rule gives no early stop.
 * @param {number} amount                         Incoming damage
 * @param {{id: string, hp: number}[]} slots      Armour Slots in rolling order
 * @param {number[]} faces                        Skill Die results to use, one per slot rolled
 * @returns {{damage: number, rolls: {id: string, face: number, symbol: string, blocked: number, wound: number}[]}}
 */
export function resolveArmour(amount, slots, faces) {
  let damage = amount;
  const rolls = [];
  let i = 0;
  for ( const slot of slots ) {
    if ( slot.hp <= 0 ) continue;
    const face = faces[i++];
    if ( face === undefined ) break;
    const symbol = SKILL_DIE_FACES[face];
    const entry = { id: slot.id, face, symbol, blocked: 0, wound: 0 };
    if ( (symbol === "luck") || (symbol === "strange") ) {
      if ( damage > 0 ) {
        entry.blocked = 1;
        damage -= 1;
      }
      if ( symbol === "strange" ) entry.wound = 1;
    }
    rolls.push(entry);
  }
  return { damage: Math.max(0, damage), rolls };
}

/* -------------------------------------------- */

/**
 * The Doom Quarter a number of minutes falls in: 0 for 0-14, 1 for 15-29, 2 for 30-44, 3 for 45-59, 4 at Midnight.
 * @param {number} minutes
 * @returns {number}
 */
export function doomQuarter(minutes) {
  return Math.min(4, Math.floor(Math.max(0, minutes) / 15));
}

/**
 * The quarter marks crossed when the Doom Clock moves from one value to another (upwards only).
 * @param {number} from
 * @param {number} to
 * @returns {number[]}   e.g. [15, 30]
 */
export function doomMarksCrossed(from, to) {
  const marks = [];
  for ( const m of [15, 30, 45, 60] ) if ( (from < m) && (to >= m) ) marks.push(m);
  return marks;
}

/* -------------------------------------------- */

/**
 * Step a Speed up or down (slow < average < fast).
 * @param {string} speed
 * @param {number} steps
 * @returns {string}
 */
export function stepSpeed(speed, steps) {
  const order = ["slow", "average", "fast"];
  const i = Math.max(0, order.indexOf(speed));
  return order[Math.clamp ? Math.clamp(i + steps, 0, 2) : Math.min(2, Math.max(0, i + steps))];
}
