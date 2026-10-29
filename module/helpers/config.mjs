/**
 * Static rules data for the SHIVER system. Exposed as CONFIG.shiver.
 * Page numbers refer to the SHIVER Core Rulebook.
 */
export const shiver = {};

/**
 * The six Core Skills, in the order they appear on the character sheet. `face` is the Skill Die (d6) face which shows
 * the skill's symbol (p.10).
 * @type {Record<string, {label: string, face: number, img: string, icon: string}>}
 */
shiver.skills = {
  grit: {
    label: "shiver.SkillGrit",
    face: 1,
    img: "systems/shiver/assets/dice/skill/SHIVER_GRIT.png",
    icon: "systems/shiver/assets/dice/skill/SHIVER_GRIT_small.png"
  },
  wit: {
    label: "shiver.SkillWit",
    face: 2,
    img: "systems/shiver/assets/dice/skill/SHIVER_WIT.png",
    icon: "systems/shiver/assets/dice/skill/SHIVER_WIT_small.png"
  },
  smarts: {
    label: "shiver.SkillSmarts",
    face: 3,
    img: "systems/shiver/assets/dice/skill/SHIVER_SMARTS.png",
    icon: "systems/shiver/assets/dice/skill/SHIVER_SMARTS_small.png"
  },
  heart: {
    label: "shiver.SkillHeart",
    face: 4,
    img: "systems/shiver/assets/dice/skill/SHIVER_HEART.png",
    icon: "systems/shiver/assets/dice/skill/SHIVER_HEART_small.png"
  },
  luck: {
    label: "shiver.SkillLuck",
    face: 6,
    img: "systems/shiver/assets/dice/skill/SHIVER_LUCK.png",
    icon: "systems/shiver/assets/dice/skill/SHIVER_LUCK_small.png"
  },
  strange: {
    label: "shiver.SkillStrange",
    face: 5,
    img: "systems/shiver/assets/dice/skill/SHIVER_STRANGE.png",
    icon: "systems/shiver/assets/dice/skill/SHIVER_STRANGE_small.png"
  }
};

/**
 * The symbol shown on each face of the Skill Die (d6), p.10.
 * @type {Record<number, string>}
 */
shiver.skillDieFaces = { 1: "grit", 2: "wit", 3: "smarts", 4: "heart", 5: "strange", 6: "luck" };

/**
 * The symbols shown on each face of the Talent Die (d8), p.10 and p.13: 1 double Strange, 2-3 single Strange,
 * 4-6 single Talent, 7-8 double Talent.
 * @type {Record<number, {symbol: "talent"|"strange", count: number}>}
 */
shiver.talentDieFaces = {
  1: { symbol: "strange", count: 2 },
  2: { symbol: "strange", count: 1 },
  3: { symbol: "strange", count: 1 },
  4: { symbol: "talent", count: 1 },
  5: { symbol: "talent", count: 1 },
  6: { symbol: "talent", count: 1 },
  7: { symbol: "talent", count: 2 },
  8: { symbol: "talent", count: 2 }
};

/** Images for the Talent Die faces. */
shiver.talentDieImages = {
  1: "systems/shiver/assets/dice/talent/SHIVER_T_STRANGE2_small.png",
  2: "systems/shiver/assets/dice/talent/SHIVER_T_STRANGE_small.png",
  3: "systems/shiver/assets/dice/talent/SHIVER_T_STRANGE_small.png",
  4: "systems/shiver/assets/dice/talent/SHIVER_T_TALENT_small.png",
  5: "systems/shiver/assets/dice/talent/SHIVER_T_TALENT_small.png",
  6: "systems/shiver/assets/dice/talent/SHIVER_T_TALENT_small.png",
  7: "systems/shiver/assets/dice/talent/SHIVER_T_TALENT2_small.png",
  8: "systems/shiver/assets/dice/talent/SHIVER_T_TALENT2_small.png"
};

/**
 * Challenge Ratings, p.10.
 * @type {Record<number, string>}
 */
shiver.challengeRatings = {
  1: "shiver.CR.1",
  2: "shiver.CR.2",
  3: "shiver.CR.3",
  4: "shiver.CR.4",
  5: "shiver.CR.5"
};

/**
 * The three Speeds, p.14. `step` orders them so abilities and penalties can move a Speed up or down.
 */
shiver.speeds = {
  slow: { label: "shiver.Speed.slow", ft: 20, hex: 4, step: 0 },
  average: { label: "shiver.Speed.average", ft: 30, hex: 6, step: 1 },
  fast: { label: "shiver.Speed.fast", ft: 40, hex: 8, step: 2 }
};

/**
 * Size categories, p.14. Overwhelm has no effect on Giant or Colossal enemies (p.23).
 */
shiver.sizes = {
  small: { label: "shiver.Size.small", order: 0 },
  humanoid: { label: "shiver.Size.humanoid", order: 1 },
  large: { label: "shiver.Size.large", order: 2 },
  giant: { label: "shiver.Size.giant", order: 3 },
  colossal: { label: "shiver.Size.colossal", order: 4 }
};

/**
 * Range bands in feet, from the player reference.
 */
shiver.ranges = {
  close: { label: "shiver.Range.close", ft: 5 },
  near: { label: "shiver.Range.near", ft: 15 },
  medium: { label: "shiver.Range.medium", ft: 50 },
  long: { label: "shiver.Range.long", ft: 150 },
  far: { label: "shiver.Range.far", ft: 200 }
};

/**
 * Damage types and their effects on a hit (p.131 and the player reference).
 * `save` is the check the struck target makes to avoid `status`. `ignoresArmour` skips armour rolls.
 */
shiver.damageTypes = {
  blunt: { label: "shiver.Damage.blunt" },
  sharp: { label: "shiver.Damage.sharp", save: { skill: "luck", cr: 1 }, status: "bleed", value: 1 },
  fire: { label: "shiver.Damage.fire", save: { skill: "luck", cr: 1 }, status: "burning", value: 1 },
  poison: { label: "shiver.Damage.poison", save: { skill: "grit", cr: 1 }, status: "poisoned", value: 1 },
  shock: { label: "shiver.Damage.shock", save: { skill: "grit", cr: 1 }, status: "stunned" },
  cold: { label: "shiver.Damage.cold", status: "maimed", rounds: 1 },
  pierce: { label: "shiver.Damage.pierce", ignoresArmour: true },
  soul: { label: "shiver.Damage.soul", ignoresArmour: true },
  corrosive: { label: "shiver.Damage.corrosive", ignoresArmour: true, corrodesArmour: true }
};

/**
 * The Critical Hit effect for each Core Skill used to make a Strike, p.24.
 */
shiver.criticalEffects = {
  grit: { label: "shiver.Crit.grit", status: "prone" },
  wit: { label: "shiver.Crit.wit", strikeAgain: true },
  smarts: { label: "shiver.Crit.smarts", status: "bleed", value: 2 },
  heart: { label: "shiver.Crit.heart", selfStatus: "steeled" },
  luck: { label: "shiver.Crit.luck", luckDamage: true },
  strange: { label: "shiver.Crit.strange", status: "terrified" }
};

/**
 * The character fear levels, p.96. Afraid and Terrified are also status effects.
 * @type {string[]}
 */
shiver.fearLevels = ["stable", "afraid", "terrified"];

/**
 * The number of Health Points on a character's Lifeline, p.14.
 * @type {number}
 */
shiver.lifelineLength = 16;

/**
 * The Nightmare Mode penalties for each wounded quarter of the Lifeline, p.15.
 */
shiver.lifelineQuarters = ["weakened", "limping", "trauma", "dead"];

/**
 * Turn order Combat States, p.21. `value` is stored as the combatant's initiative so higher acts first.
 */
shiver.combatStates = {
  first: { label: "shiver.Combat.first", value: 3 },
  middle: { label: "shiver.Combat.middle", value: 2 },
  last: { label: "shiver.Combat.last", value: 1 }
};

/**
 * The combat actions a character can take each Combat Turn, p.22.
 */
shiver.actions = {
  move: { label: "shiver.Action.move", icon: "fa-solid fa-person-running" },
  attack: { label: "shiver.Action.attack", icon: "fa-solid fa-hand-fist" },
  interact: { label: "shiver.Action.interact", icon: "fa-solid fa-hand" }
};

/**
 * The Doom Clock quarters, p.18. Keys are the minute marks.
 */
shiver.doomQuarters = {
  15: "shiver.Doom.quarterPast",
  30: "shiver.Doom.halfPast",
  45: "shiver.Doom.quarterTo",
  60: "shiver.Doom.midnight"
};

/**
 * Ability usage frequencies. OPDQ and OPDC recharge from the Doom Clock (p.19).
 */
shiver.frequencies = {
  always: "shiver.Frequency.always",
  turn: "shiver.Frequency.turn",
  round: "shiver.Frequency.round",
  encounter: "shiver.Frequency.encounter",
  opdq: "shiver.Frequency.opdq",
  opdc: "shiver.Frequency.opdc",
  story: "shiver.Frequency.story"
};

/**
 * The action an ability or item costs to use.
 */
shiver.actionCosts = {
  passive: "shiver.Cost.passive",
  move: "shiver.Action.move",
  attack: "shiver.Action.attack",
  interact: "shiver.Action.interact",
  reaction: "shiver.Cost.reaction",
  free: "shiver.Cost.free"
};

/**
 * Deathcon threat ratings (p.162-163). When an enemy is hit, the Director rolls one Skill Die: the enemy reacts if the
 * face is one of its Deathcon level's faces. The Luck face never triggers a standard reaction.
 */
shiver.deathcon = {
  amber: { label: "shiver.Deathcon.amber", order: 1, faces: ["grit"] },
  blue: { label: "shiver.Deathcon.blue", order: 2, faces: ["grit", "wit"] },
  yellow: { label: "shiver.Deathcon.yellow", order: 3, faces: ["grit", "wit", "smarts"] },
  red: { label: "shiver.Deathcon.red", order: 4, faces: ["grit", "wit", "smarts", "heart"] },
  black: { label: "shiver.Deathcon.black", order: 5, faces: ["grit", "wit", "smarts", "heart", "strange"] }
};

/**
 * The four standard Enemy Reaction tables (p.163-165), keyed by Skill Die face. Summaries are paraphrased; enemies can
 * override any face with their own text.
 */
shiver.reactionTables = {
  bruiser: {
    label: "shiver.Reaction.bruiser",
    faces: {
      1: "Retaliate: 1 Blunt to the nearest character in range.",
      2: "Shove: pushes one character in Close Range 50 ft away.",
      3: "Savage Strike: 2 Blunt to one character in Close Range, who is Maimed.",
      4: "Fling: throws one character in Close Range 150 ft away for 2 Blunt.",
      5: "Monstrous Regeneration: rolls its Grit Pool and heals 1 wound per Grit symbol.",
      6: ""
    }
  },
  agile: {
    label: "shiver.Reaction.agile",
    faces: {
      1: "Adrenaline: may immediately take a Move Action.",
      2: "Fighting Dirty: knocks one character in Close Range Prone.",
      3: "Sprinter: may immediately Move; if in a Brawl it Escapes and can't be attacked as it goes.",
      4: "Retaliate: 1 Blunt to the nearest character in range.",
      5: "Slippery Devil: rolls its Wit Pool; the attack's damage is reduced by 1 per Wit symbol.",
      6: ""
    }
  },
  intelligent: {
    label: "shiver.Reaction.intelligent",
    faces: {
      1: "Help: another enemy within Long Range may immediately take a Move Action.",
      2: "Observant: its next Attack Action against the attacker has Minor Advantage.",
      3: "Retaliate: 1 Blunt to the nearest character in range.",
      4: "Tactical Positioning: up to 2 enemies within Long Range may immediately Move or Escape a Brawl freely.",
      5: "Clever Girl: its next Attack Action against the attacker has Major Advantage.",
      6: ""
    }
  },
  scary: {
    label: "shiver.Reaction.scary",
    faces: {
      1: "Snarl: the attacker makes a CR 1 Strange Check or becomes Afraid.",
      2: "Spooked: every character within Near Range makes a CR 2 Strange Check or moves 10 ft away.",
      3: "Retaliate: 1 Blunt to the nearest character in range.",
      4: "Psychic Pains: the attacker takes 1 Soul and makes a CR 1 Strange Check or becomes Afraid.",
      5: "The Horror: the attacker makes a CR 2 Strange Check or becomes Terrified.",
      6: ""
    }
  },
  custom: { label: "shiver.Reaction.custom", faces: { 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" } }
};

/**
 * The icon shown next to weapons and powers which can be rolled.
 * @type {string}
 */
shiver.attackIcon = "systems/shiver/assets/icons/attack-icon-14.png";

/**
 * Infections (p.192-194). With the Doom Clock method an infection moves up one stage each Doom Quarter after it is
 * caught; stage rules apply while the infection is at that stage or beyond.
 */
shiver.infections = {
  vampyrism: {
    label: "shiver.Infection.vampyrism",
    stages: {
      1: [{ kind: "custom", note: "Weakened (CR -1) while in direct sunlight." }],
      2: [{ kind: "talentPoints", skill: "wit", amount: 1 }],
      3: [{ kind: "custom", note: "When damaged you may feed on blood to heal 1. Heart CR 1 or blood lust: heal 3, deal 3 Sharp to the victim, and witnesses make a CR 1 Fear Check." }],
      4: [{ kind: "custom", note: "You become a Vampire." }]
    }
  },
  lycanthropy: {
    label: "shiver.Infection.lycanthropy",
    stages: {
      1: [{ kind: "weakness", types: ["silver"] }],
      2: [{ kind: "talentPoints", skill: "grit", amount: 1 }],
      3: [{ kind: "damageBonus", amount: 2, when: "melee" }, { kind: "custom", note: "On a Critical Hit, Heart CR 2 or attack the closest ally." }],
      4: [{ kind: "custom", note: "You become a Werewolf." }]
    }
  },
  parasite: {
    label: "shiver.Infection.parasite",
    stages: {
      1: [{ kind: "speedStep", amount: -1 }],
      2: [{ kind: "custom", note: "Creatures of the parasite's kind won't harm you." }],
      3: [{ kind: "custom", note: "Using your full Move or exerting yourself: Grit CR 1 or take 1 wound." }],
      4: [{ kind: "custom", note: "You die and the parasite bursts free." }]
    }
  },
  zvirus: {
    label: "shiver.Infection.zvirus",
    stages: {
      1: [{ kind: "speed", set: "slow" }],
      2: [{ kind: "custom", note: "You can smell human brains within Far Range." }],
      3: [{ kind: "skillPoints", skill: "smarts", amount: -1 }],
      4: [{ kind: "custom", note: "You become a Shambler or a Sprinter." }]
    }
  },
  other: { label: "shiver.Infection.other", stages: {} }
};

/**
 * The optional weapon Malfunction table (p.132): one extra Skill Die per attack.
 */
shiver.malfunctions = {
  grit: "shiver.Malfunction.grit",
  wit: "shiver.Malfunction.wit",
  smarts: "shiver.Malfunction.smarts",
  heart: "shiver.Malfunction.heart",
  strange: "shiver.Malfunction.strange",
  luck: "shiver.Malfunction.luck"
};
