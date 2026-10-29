/**
 * World and client settings.
 */
export function registerSettings() {
  const world = (key, data) => game.settings.register("shiver", key, { scope: "world", config: true, ...data,
    name: `shiver.Settings.${key}.name`, hint: `shiver.Settings.${key}.hint` });

  world("modeOfPlay", {
    type: String,
    default: "survivor",
    choices: { survivor: "shiver.Settings.modeOfPlay.survivor", nightmare: "shiver.Settings.modeOfPlay.nightmare" },
    onChange: () => game.actors.forEach(a => { a.reset(); a.render(false); })
  });
  world("storyLevel", { type: new foundry.data.fields.NumberField({ min: 1, max: 15, step: 1, integer: true }), default: 1 });
  world("doomAtMidnight", {
    type: String,
    default: "hold",
    choices: { hold: "shiver.Settings.doomAtMidnight.hold", cycle: "shiver.Settings.doomAtMidnight.cycle" }
  });
  world("fearCheckStrangeDoom", { type: Boolean, default: true });
  world("autoReactions", { type: Boolean, default: true });
  world("autoOverwhelm", { type: Boolean, default: true });
  world("playersApplyDamage", { type: Boolean, default: true });
  world("hideEnemyDamage", { type: Boolean, default: false });
  world("enemyCrits", { type: Boolean, default: false });
  world("enforceTree", { type: Boolean, default: true });
  world("enforceRange", { type: Boolean, default: true });
  world("infectionMethod", {
    type: String,
    default: "doom",
    choices: { doom: "shiver.Settings.infectionMethod.doom", lifeline: "shiver.Settings.infectionMethod.lifeline" }
  });
}
