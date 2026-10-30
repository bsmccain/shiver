/**
 * SHIVER Status Effects (p.219 and the player reference), registered as CONFIG.statusEffects.
 *
 * Each status carries a `shiver` rule block that the system reads:
 * - valued:      the status has a strength X, e.g. Bleed (2). Stored in flags.shiver.value.
 * - pool:        Skill Dice lost from Dice Pools. `scope` is "all" or "attack".
 * - poolMajor:   Major Disadvantage on the listed scope.
 * - attackersPool: Skill Dice gained by anyone attacking this target.
 * - cr:          change to the bearer's Challenge Rating (minimum 1).
 * - speed:       forces the bearer's Speed.
 * - moveHalved:  halves Move Distance.
 * - turnWounds:  takes X wounds at the start of each of the bearer's Combat Turns.
 * - noActions / noMoveAttack: restricts actions.
 * - expires:     "endOfNextTurn" (removed at the end of the bearer's next Combat Turn),
 *                "startOfNextTurn" (removed when the bearer's next Combat Turn starts),
 *                "endOfRound" (removed when the current Combat Round ends).
 * - removal:     how the status can be removed with a check: {action, skills, cr, opposed}.
 * - noHealing:   wounds cannot be healed.
 * - fear:        the Fear level this status represents (Afraid 1, Terrified 2).
 */
export const STATUS_EFFECTS = [
  {
    id: "afraid", name: "shiver.Status.afraid", img: "icons/svg/terror.svg",
    shiver: { fear: 1, pool: { d6: -1, scope: "all" }, removal: { action: "interact", skills: ["strange"], cr: null, fearCheck: true } }
  },
  {
    id: "terrified", name: "shiver.Status.terrified", img: "icons/svg/skull.svg",
    shiver: { fear: 2, pool: { d6: -2, scope: "all" }, removal: { action: "interact", skills: ["strange"], cr: null, fearCheck: true } }
  },
  {
    id: "bleed", name: "shiver.Status.bleed", img: "icons/svg/blood.svg",
    shiver: { valued: true, turnWounds: true, removal: { action: "interact", skills: ["smarts"], cr: 2 } }
  },
  {
    id: "burning", name: "shiver.Status.burning", img: "icons/svg/fire.svg",
    shiver: { valued: true, turnWounds: true, removal: { action: "interact", skills: ["grit", "wit"], cr: 1 } }
  },
  {
    id: "poisoned", name: "shiver.Status.poisoned", img: "icons/svg/poison.svg",
    shiver: { valued: true, turnWounds: true, removal: { action: "interact", skills: ["grit"], cr: 3 } }
  },
  {
    id: "blinded", name: "shiver.Status.blinded", img: "icons/svg/blind.svg",
    shiver: { pool: { d6: -1, scope: "attack" }, failsSight: true, expires: "endOfNextTurn" }
  },
  {
    id: "stunned", name: "shiver.Status.stunned", img: "icons/svg/daze.svg",
    shiver: { noActions: true, expires: "endOfNextTurn" }
  },
  {
    id: "prone", name: "shiver.Status.prone", img: "icons/svg/falling.svg",
    shiver: { pool: { d6: -1, scope: "all" }, attackersPool: { d6: 1 }, speed: "slow", moveHalved: true, standUp: true }
  },
  {
    id: "grappled", name: "shiver.Status.grappled", img: "icons/svg/net.svg",
    shiver: { noMoveAttack: true, removal: { action: "interact", skills: ["grit"], opposed: true } }
  },
  {
    id: "maimed", name: "shiver.Status.maimed", img: "icons/svg/leg.svg",
    shiver: { speed: "slow", removal: { action: "interact", skills: ["smarts"], cr: 2 } }
  },
  {
    id: "crippled", name: "shiver.Status.crippled", img: "icons/svg/bones.svg",
    shiver: { speed: "slow" }
  },
  {
    id: "cursed", name: "shiver.Status.cursed", img: "icons/svg/degen.svg",
    shiver: { noHealing: true }
  },
  {
    id: "paralysed", name: "shiver.Status.paralysed", img: "icons/svg/paralysis.svg",
    shiver: { noActions: true }
  },
  {
    id: "beguiled", name: "shiver.Status.beguiled", img: "icons/svg/aura.svg",
    shiver: {}
  },
  {
    id: "taunted", name: "shiver.Status.taunted", img: "icons/svg/target.svg",
    shiver: { expires: "endOfNextTurn" }
  },
  {
    id: "vengeance", name: "shiver.Status.vengeance", img: "icons/svg/sword.svg",
    shiver: { attackersPool: { d6: 1 } }
  },
  {
    id: "infected", name: "shiver.Status.infected", img: "icons/svg/biohazard.svg",
    shiver: { valued: true, minValue: 0, infection: true }
  },
  {
    id: "steeled", name: "shiver.Status.steeled", img: "icons/svg/shield.svg",
    shiver: { cr: 1 }
  },
  {
    id: "weakened", name: "shiver.Status.weakened", img: "icons/svg/downgrade.svg",
    shiver: { cr: -1 }
  },
  {
    id: "overwhelmed", name: "shiver.Status.overwhelmed", img: "icons/svg/down.svg",
    shiver: { cr: -1 }
  },
  {
    id: "stealth", name: "shiver.Status.stealth", img: "icons/svg/invisible.svg",
    shiver: { moveHalved: true, stealth: true }
  },
  {
    id: "hidden", name: "shiver.Status.hidden", img: "icons/svg/mystery-man.svg",
    shiver: { stealth: true }
  },
  {
    id: "immobile", name: "shiver.Status.immobile", img: "icons/svg/anchor.svg",
    shiver: { noMove: true }
  },
  {
    id: "deathsDoor", name: "shiver.Status.deathsDoor", img: "icons/svg/unconscious.svg",
    shiver: { noActions: true, deathsDoor: true }
  },
  {
    id: "unconscious", name: "shiver.Status.unconscious", img: "icons/svg/sleep.svg",
    shiver: { noActions: true }
  },
  {
    id: "dead", name: "shiver.Status.dead", img: "icons/svg/skull.svg",
    shiver: { noActions: true }
  }
];

/**
 * Look up the rule block for a status id.
 * @param {string} id
 * @returns {object}
 */
export function statusRules(id) {
  return CONFIG.statusEffects.find(s => s.id === id)?.flags?.shiver?.rules ?? {};
}

/**
 * Register the status effects, replacing the core set.
 */
export function registerStatusEffects() {
  CONFIG.statusEffects = STATUS_EFFECTS.map((s, i) => ({
    id: s.id,
    _id: `shiver${s.id.padEnd(10, "0")}`.slice(0, 16),
    name: s.name,
    img: s.img,
    order: i,
    flags: { shiver: { rules: s.shiver, ...(s.shiver.valued ? { value: s.shiver.minValue ?? 1 } : {}) } }
  }));
  CONFIG.specialStatusEffects.DEFEATED = "dead";
  CONFIG.specialStatusEffects.BLIND = "blinded";
  CONFIG.specialStatusEffects.INVISIBLE = "hidden";
}
