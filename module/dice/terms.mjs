/**
 * The SHIVER Archetype Dice (p.10). Both are rolled like ordinary d6/d8 dice, but each face shows symbols rather than
 * a number, so their numeric total is meaningless. Use `symbolsForTerm` (pool.mjs) to read them.
 */

const { DiceTerm } = foundry.dice.terms;

/**
 * The Skill Die: a d6 with one Core Skill symbol per face. Formula: `Nds`.
 */
export class SkillDie extends DiceTerm {
  constructor(termData = {}) {
    super({ ...termData, faces: 6 });
  }

  /** @override */
  static DENOMINATION = "s";

  /** @override */
  getResultLabel(result) {
    const skill = CONFIG.shiver.skillDieFaces[result.result];
    const config = CONFIG.shiver.skills[skill];
    if ( !config ) return String(result.result);
    const label = game.i18n.localize(config.label);
    return `<img src="${config.icon}" alt="${label}" title="${label}" width="30" height="30">`;
  }

  /** @override */
  getResultCSS(result) {
    const css = super.getResultCSS(result);
    css.push("shiver-die", "shiver-skill-die", `shiver-face-${CONFIG.shiver.skillDieFaces[result.result]}`);
    return css.filter(c => !["min", "max"].includes(c));
  }
}

/* -------------------------------------------- */

/**
 * The Talent Die: a d8 with Talent and Strange symbols, some faces doubled. Formula: `Ndt`.
 */
export class TalentDie extends DiceTerm {
  constructor(termData = {}) {
    super({ ...termData, faces: 8 });
  }

  /** @override */
  static DENOMINATION = "t";

  /** @override */
  getResultLabel(result) {
    const face = CONFIG.shiver.talentDieFaces[result.result];
    if ( !face ) return String(result.result);
    const symbol = game.i18n.localize(face.symbol === "talent" ? "shiver.Symbol.talent" : "shiver.SkillStrange");
    const label = `${face.count}× ${symbol}`;
    return `<img src="${CONFIG.shiver.talentDieImages[result.result]}" alt="${label}" title="${label}" width="32" height="32">`;
  }

  /** @override */
  getResultCSS(result) {
    const css = super.getResultCSS(result);
    const face = CONFIG.shiver.talentDieFaces[result.result];
    css.push("shiver-die", "shiver-talent-die", `shiver-face-${face?.symbol}${face?.count}`);
    return css.filter(c => !["min", "max"].includes(c));
  }
}

/* -------------------------------------------- */

/**
 * Is this dice term one of the SHIVER Archetype Dice?
 * @param {RollTerm} term
 * @returns {boolean}
 */
export function isShiverDie(term) {
  return (term instanceof SkillDie) || (term instanceof TalentDie);
}
