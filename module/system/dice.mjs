const { DialogV2 } = foundry.applications.api;
const { FormDataExtended } = foundry.applications.ux;

export class ShiverSkillDie extends foundry.dice.terms.Die {
    constructor(termData) {
      super(termData);
      this.faces = 6;
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "6";

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
	      "1": '<img src="systems/shiver/assets/dice/skill/SHIVER_GRIT_small.png" width="30" height="30" />',
        "2": '<img src="systems/shiver/assets/dice/skill/SHIVER_WIT_small.png" width="30" height="30"/>',
        "3": '<img src="systems/shiver/assets/dice/skill/SHIVER_SMARTS_small.png" width="30" height="30"/>',
        "4": '<img src="systems/shiver/assets/dice/skill/SHIVER_HEART_small.png" width="30" height="30"/>',
	      "5": '<img src="systems/shiver/assets/dice/skill/SHIVER_STRANGE_small.png" width="30" height="30"/>',
        "6": '<img src="systems/shiver/assets/dice/skill/SHIVER_LUCK_small.png" width="30" height="30"/>'
        }[result.result];
    }
}

export class ShiverTalentDie extends foundry.dice.terms.Die {
  constructor(termData) {
    super(termData);
    this.faces = 8;
  }

  /* -------------------------------------------- */

  /** @override */
  static DENOMINATION = "8";

  /* -------------------------------------------- */

  /** @override */
  getResultLabel(result) {
      return {
      "1": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_STRANGE2_small.png" width="32" height="32" />',
      "2": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_STRANGE_small.png" width="32" height="32"/>',
      "3": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_STRANGE_small.png" width="32" height="32"/>',
      "4": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT_small.png" width="32" height="32"/>',
      "5": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT_small.png" width="32" height="32"/>',
      "6": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT_small.png" width="32" height="32"/>',
      "7": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT2_small.png" width="32" height="32"/>',
      "8": '<img src="systems/shiver/assets/dice/talent/SHIVER_T_TALENT2_small.png" width="32" height="32"/>'
      }[result.result];
  }
}

/* -------------------------------------------- */

/**
 * Show the dice roller dialog, and roll the chosen pool of dice.
 * @param {Actor} actor                 The actor making the roll
 * @param {string} skill                The skill selected by default
 * @param {number|string} skillDice     The default number of skill dice (d6)
 * @param {number|string} talentDice    The default number of talent dice (d8)
 */
export async function rollDialog(actor, skill, skillDice, talentDice) {
  const skillOptions = Object.entries(CONFIG.shiver.skills).map(([key, config]) => {
    const selected = key === skill ? " selected" : "";
    return `<option value="${key}"${selected}>${game.i18n.localize(config.label)}</option>`;
  }).join("");

  const content = `
  <div class="shiver-roller">
    <div class="form-group">
      <label>Choose a Skill</label>
      <select name="skill">${skillOptions}</select>
    </div>
    <div class="form-group">
      <label>Skill Dice Pool [D6]</label>
      <input type="number" name="skillPool" value="${Number(skillDice) || 0}" min="0" step="1">
    </div>
    <div class="form-group">
      <label>Talent Dice Pool [D8]</label>
      <input type="number" name="talentPool" value="${Number(talentDice) || 0}" min="0" step="1">
    </div>
  </div>`;

  const formData = await DialogV2.wait({
    window: { title: "Shiver Roller" },
    content,
    buttons: [{
      action: "roll",
      label: "Roll",
      icon: "fa-solid fa-dice",
      default: true,
      callback: (event, button) => new FormDataExtended(button.form).object
    }, {
      action: "close",
      label: "Close"
    }],
    rejectClose: false
  });
  if ( !formData || (typeof formData !== "object") ) return;
  return rollPool(formData.skillPool, formData.talentPool, formData.skill, actor);
}

/* -------------------------------------------- */

/**
 *  Roll the pool of dice
 */
export async function rollPool(skillDice, talentDice, skill, actor){
  skillDice = Math.max(Math.floor(Number(skillDice) || 0), 0);
  talentDice = Math.max(Math.floor(Number(talentDice) || 0), 0);
  // Build the pool from the Shiver dice directly, so the results are labelled with the Shiver dice faces.
  let roll = await Roll.fromTerms([
    new ShiverSkillDie({ number: skillDice }),
    new foundry.dice.terms.OperatorTerm({ operator: "+" }),
    new ShiverTalentDie({ number: talentDice })
  ]).evaluate();

  // The skill die face which counts as a success, or 0 if the skill is unknown.
  const skillType = CONFIG.shiver.skills[skill]?.face ?? 0;
  const strangeFace = CONFIG.shiver.skills.strange.face;

  let successes = 0;
  let strange = 0;
  let luck = 0;
  let d6results = [];
  let d8results = [];

  for(const die of roll.dice){
      for(const {result} of die.results){
          //skill dice
          if(die.faces == 6)
          {
              d6results.push(result);
              if( result == skillType) successes += 1;
              if( result == 5) strange+=1;
              if( result == 6) luck += 1;
          }

          //talent dice
          if(die.faces == 8){
              d8results.push(result);
              switch(result){
                  case 1:
                      strange +=2;
                      if( skillType == strangeFace)
                      successes +=2;
                      break
                  case 2:
                  case 3:
                      strange +=1;
                      if( skillType == strangeFace)
                      successes +=1;
                      break
                  case 4:
                  case 5:
                  case 6:
                      if( skillType != strangeFace)
                      successes +=1;
                      break;
                  case 7:
                  case 8:
                      if( skillType != strangeFace)
                      successes +=2;
                      break;
                  default:
                      break;
              }
          }

      }
  }


  let dices6 = '';
  let dices8 = '';

  for(let i = 0; i < d6results.length; ++i){
      dices6 += '<i class="fas fa-dice-d6"></i>'+d6results[i]+'  ';
  }

  for(let i = 0; i < d8results.length; ++i){
      dices8 += '<i class="fas fa-dice-d8"></i>'+d8results[i]+'  ';
  }

  let printsuccesses = '';
  if(successes > 0){
      printsuccesses = `<h3><span style="color:green">successes: <b>${successes}</b></span></h3>`
  }else{
      printsuccesses = `<h3><span style="color:red">successes: <b>${successes}</b></span></h3>`
  }

  const skillLabel = CONFIG.shiver.skills[skill] ? game.i18n.localize(CONFIG.shiver.skills[skill].label) : skill;
  let diceHtml = await roll.render();
  let results_html = `<h2>Rolled <b>${skillLabel}</b></h2>
                      ${printsuccesses}
                      <div></div>
                      <h3><span style="color:purple">strange: <b>${strange}</b></span></h3>
                      <div></div>
                      <h3><span style="color:DarkOliveGreen">luck: <b>${luck}</b></span></h3>
                      <div></div>
                      <div class="shiver-roll">
                      <span>${diceHtml}</span>
                      <div></div>
                      <span>${dices6}</span>
                      <span>${dices8}</span>
                      </div>`

  return ChatMessage.create({
    rolls: [roll],
    speaker: ChatMessage.getSpeaker({actor: actor}),
    content: results_html
  }, { messageMode: game.settings.get("core", "messageMode") });
}
