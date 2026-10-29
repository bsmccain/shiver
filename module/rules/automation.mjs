/**
 * Automation rules attached to items (abilities, backgrounds, flaws, gear) are plain objects with a `kind`.
 * Rules without a `when` apply all the time. A `when` can be:
 * - a tag expression: "attack+unarmed" (all tags) or "fear|steady" (any tag), using CHECK_TAGS
 * - an object: { tags: [...], any: [...], wounds: {gte: 4, lte: 11}, fear: {gte: 1}, notTags: [...] }
 * - free text the system can't interpret, in which case the rule is offered as an optional toggle
 *
 * Rule kinds the system reads:
 * - poolDice {skill, d6, d8, when}              extra dice in a Dice Pool
 * - extraSuccessFaces {rollSkill, countsAs, when} other symbols counting as successes
 * - damageReductionRoll {dice, face, perSuccess, when, reroll}  roll Skill Dice when hit (e.g. Tough)
 * - skillPoints / talentPoints {skill, amount}  permanent Core Skill / Talent Points
 * - health {amount}                             extra Health Points
 * - luckBankMax {amount, mode}                  Luck Bank size
 * - speed {set} / speedStep {amount}            Speed changes
 * - cr {amount, when}                           Challenge Rating changes
 * - immunity / resistance / weakness {types}    damage modifiers
 * - armourSlots / weaponSlots {amount}          carrying limits
 * - extraActions {action, amount, when}         extra combat actions
 * - doom {amount, when}                         Doom Clock change when used ("use")
 * - doomModifier {multiplyIncrease, noTickBack, extraPerStrange}  Flaws that change Doom ticks
 * - noLuckBank                                  can't bank Luck
 * - uses {per, count}                           limited uses
 * - check {skill, cr, onSuccess, onFail}        a check made when the ability is used
 * - applyStatus {status, value, target, save, when}
 * - heal {amount, target, perSymbol}
 * - damage {amount, type, when}
 * - autoFail {when}                             automatically fail matching checks
 * - poolCap {skill, d6, when}                   cap a pool (e.g. The Shakes)
 * - custom {note}                               handled by the table
 */

/**
 * Tags the system attaches to checks.
 * @type {Set<string>}
 */
export const CHECK_TAGS = new Set([
  "check", "attack", "strike", "unarmed", "melee", "ranged", "thrown", "grapple", "fear", "steady", "stealth",
  "hide", "deathsDoor", "heal", "removeStatus", "assist", "opposed", "save", "sight", "escape", "power", "weapon",
  "charge", "counter", "stabilise", "group", "luckCrit", "heavy", "ability", "item",
  "grit", "wit", "smarts", "heart", "luck", "strange"
]);

/**
 * Does a rule apply in a context?
 * @param {object} rule
 * @param {object} context
 * @param {Set<string>} context.tags
 * @param {Actor} [context.actor]
 * @returns {boolean|null}   True or false when the system can tell, null when it is up to the player.
 */
export function ruleApplies(rule, { tags = new Set(), actor } = {}) {
  const when = rule.when;
  if ( (when === undefined) || (when === null) || (when === "") || (when === "always") ) return true;
  if ( typeof when === "object" ) {
    if ( when.tags && !when.tags.every(t => tags.has(t)) ) return false;
    if ( when.any && !when.any.some(t => tags.has(t)) ) return false;
    if ( when.notTags && when.notTags.some(t => tags.has(t)) ) return false;
    if ( when.wounds && actor ) {
      const w = actor.system.hp.max - actor.system.hp.value;
      if ( (when.wounds.gte !== undefined) && (w < when.wounds.gte) ) return false;
      if ( (when.wounds.lte !== undefined) && (w > when.wounds.lte) ) return false;
    }
    if ( when.fear && actor ) {
      const f = actor.fearLevel ?? 0;
      if ( (when.fear.gte !== undefined) && (f < when.fear.gte) ) return false;
      if ( (when.fear.lte !== undefined) && (f > when.fear.lte) ) return false;
    }
    if ( when.status && actor && !actor.hasStatus(when.status) ) return false;
    if ( when.noWeapon && actor ) {
      if ( actor.itemTypes.weapon.some(w => w.system.equipped && !w.system.unarmed) ) return false;
    }
    if ( when.noArmour && actor ) {
      if ( actor.itemTypes.armour.some(a => a.system.equipped) ) return false;
    }
    if ( when.manual ) return null;
    return true;
  }
  const text = String(when).trim();
  const isAny = text.includes("|");
  const parts = text.split(isAny ? "|" : "+").map(s => s.trim()).filter(Boolean);
  if ( !parts.length || !parts.every(p => CHECK_TAGS.has(p.replace(/^!/, ""))) ) return null;
  const test = p => p.startsWith("!") ? !tags.has(p.slice(1)) : tags.has(p);
  return isAny ? parts.some(test) : parts.every(test);
}

/**
 * Describe a rule's condition for display.
 * @param {object} rule
 * @returns {string}
 */
export function describeWhen(rule) {
  const when = rule.when;
  if ( !when ) return "";
  if ( typeof when === "string" ) return when;
  return when.label ?? when.text ?? "";
}

/**
 * Does a rule's skill filter match a skill?
 * @param {object} rule
 * @param {string} skill
 * @returns {boolean}
 */
export function skillMatches(rule, skill) {
  const s = rule.skill ?? rule.rollSkill ?? "any";
  if ( Array.isArray(s) ) return s.includes(skill) || s.includes("any");
  return (s === "any") || (s === skill);
}
