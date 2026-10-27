export const shiver = {};

/**
 * The six skills used within the system, in the order they appear on the sheets.
 * The value of each skill die face (1-6) is given by `face`.
 * @type {Object}
 */
shiver.skills = {
  "grit": {
    label: "shiver.SkillGrit",
    face: 1,
    img: "systems/shiver/assets/dice/skill/SHIVER_GRIT.png"
  },
  "wit": {
    label: "shiver.SkillWit",
    face: 2,
    img: "systems/shiver/assets/dice/skill/SHIVER_WIT.png"
  },
  "smarts": {
    label: "shiver.SkillSmarts",
    face: 3,
    img: "systems/shiver/assets/dice/skill/SHIVER_SMARTS.png"
  },
  "heart": {
    label: "shiver.SkillHeart",
    face: 4,
    img: "systems/shiver/assets/dice/skill/SHIVER_HEART.png"
  },
  "luck": {
    label: "shiver.SkillLuck",
    face: 6,
    img: "systems/shiver/assets/dice/skill/SHIVER_LUCK.png"
  },
  "strange": {
    label: "shiver.SkillStrange",
    face: 5,
    img: "systems/shiver/assets/dice/skill/SHIVER_STRANGE.png"
  }
};

/**
 * The character fear levels, indexed by the value stored in `system.attributes.fear-level.value`.
 * @type {string[]}
 */
shiver.fearLevels = ["stable", "afraid", "terrified"];

/**
 * The number of boxes on a character's lifeline.
 * @type {number}
 */
shiver.lifelineLength = 16;

/**
 * The icon shown next to weapons and powers which can be rolled.
 * @type {string}
 */
shiver.attackIcon = "systems/shiver/assets/icons/attack-icon-14.png";
