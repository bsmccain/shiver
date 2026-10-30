/**
 * Integrations with Dice So Nice! and Dice Tray.
 */

const SKILL_LABELS = [
  "systems/shiver/assets/dice/skill/SHIVER_GRIT.png",
  "systems/shiver/assets/dice/skill/SHIVER_WIT.png",
  "systems/shiver/assets/dice/skill/SHIVER_SMARTS.png",
  "systems/shiver/assets/dice/skill/SHIVER_HEART.png",
  "systems/shiver/assets/dice/skill/SHIVER_STRANGE.png",
  "systems/shiver/assets/dice/skill/SHIVER_LUCK.png"
];

const TALENT_LABELS = [
  "systems/shiver/assets/dice/talent/SHIVER_T_STRANGE2.png",
  "systems/shiver/assets/dice/talent/SHIVER_T_STRANGE.png",
  "systems/shiver/assets/dice/talent/SHIVER_T_STRANGE.png",
  "systems/shiver/assets/dice/talent/SHIVER_T_TALENT.png",
  "systems/shiver/assets/dice/talent/SHIVER_T_TALENT.png",
  "systems/shiver/assets/dice/talent/SHIVER_T_TALENT.png",
  "systems/shiver/assets/dice/talent/SHIVER_T_TALENT2.png",
  "systems/shiver/assets/dice/talent/SHIVER_T_TALENT2.png"
];

export function registerIntegrations() {

  // Dice So Nice! is registered at module load (see setupDiceSoNice) because it can be ready before init.

  // Dice Tray: Skill and Talent Dice buttons. Rolls from the tray post a symbol tally.
  Hooks.once("dice-calculator.keymaps", (maps, Template) => {
    maps.shiver = class ShiverDiceMap extends Template {
      showExtraButtons = false;

      get dice() {
        return {
          ds: {
            img: "systems/shiver/assets/dice/skill/SHIVER_STRANGE_small.png",
            tooltip: game.i18n.localize("shiver.Dice.skill"),
            alternative: true
          },
          dt: {
            img: "systems/shiver/assets/dice/talent/SHIVER_T_TALENT_small.png",
            tooltip: game.i18n.localize("shiver.Dice.talent"),
            alternative: true
          }
        };
      }

      get rows() {
        const { ds, dt } = this.dice;
        return [{ ds, dt }];
      }
    };
  });
}

/**
 * Dice So Nice!: Skill Dice (ds) and Talent Dice (dt) show their symbols, in every dice set. The SHIVER set also
 * gives plain d6 and d8 the symbols.
 * @param {object} dice3d
 */
function setupDiceSoNice(dice3d) {
  const factory = dice3d?.DiceFactory;
  if ( !dice3d || factory?.systems?.has("shiver") ) return;
  try {
    dice3d.addSystem({ id: "shiver", name: "SHIVER" }, "preferred");
    for ( const system of ["shiver", "standard"] ) {
      dice3d.addDicePreset({ type: "ds", labels: SKILL_LABELS, system }, "d6");
      dice3d.addDicePreset({ type: "dt", labels: TALENT_LABELS, system }, "d8");
    }
    dice3d.addDicePreset({ type: "d6", labels: SKILL_LABELS, system: "shiver" }, "d6");
    dice3d.addDicePreset({ type: "d8", labels: TALENT_LABELS, system: "shiver" }, "d8");
  } catch(err) {
    console.error("SHIVER | Dice So Nice setup failed", err);
  }
}

Hooks.once("diceSoNiceReady", setupDiceSoNice);
Hooks.once("ready", () => setupDiceSoNice(game.dice3d));
