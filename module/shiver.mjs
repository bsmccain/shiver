// Import data models.
import { CharacterData, NpcData } from "./data/actor.mjs";
import { ArmourData, GearData, PowerData, TraitData, WeaponData } from "./data/item.mjs";
// Import document classes.
import { shiverActor } from "./documents/actor.mjs";
import { shiverItem } from "./documents/item.mjs";
// Import sheet classes.
import { shiverActorSheet } from "./sheets/actor-sheet.mjs";
import { shiverItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { shiver } from "./helpers/config.mjs";
import { ShiverSkillDie } from "./system/dice.mjs";
import { ShiverTalentDie } from "./system/dice.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.shiver = {
    shiverActor,
    shiverItem,
    rollItemMacro
  };

  // Add custom constants for configuration.
  CONFIG.shiver = shiver;
  CONFIG.Dice.terms["6"] = ShiverSkillDie;
  CONFIG.Dice.terms["8"] = ShiverTalentDie;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "@speed.value",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = shiverActor;
  CONFIG.Item.documentClass = shiverItem;

  // Define the data models for each Document type
  Object.assign(CONFIG.Actor.dataModels, {
    character: CharacterData,
    npc: NpcData
  });
  Object.assign(CONFIG.Item.dataModels, {
    item: GearData,
    trait: TraitData,
    power: PowerData,
    weapon: WeaponData,
    armour: ArmourData
  });

  // Register sheet application classes
  const { Actors, Items } = foundry.documents.collections;
  Actors.registerSheet("shiver", shiverActorSheet, { makeDefault: true, label: "shiver.SheetActor" });
  Items.registerSheet("shiver", shiverItemSheet, { makeDefault: true, label: "shiver.SheetItem" });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

// Dice so Nice support!
Hooks.once('diceSoNiceReady', (dice3d) => {
  dice3d.addSystem({id:"shiver",name:"shiver"},"preferred");
  dice3d.addDicePreset({
    type:"d6",
    labels:[
      "systems/shiver/assets/dice/skill/SHIVER_GRIT.png",
      "systems/shiver/assets/dice/skill/SHIVER_WIT.png",
      "systems/shiver/assets/dice/skill/SHIVER_SMARTS.png",
      "systems/shiver/assets/dice/skill/SHIVER_HEART.png", 
	    "systems/shiver/assets/dice/skill/SHIVER_STRANGE.png",
      "systems/shiver/assets/dice/skill/SHIVER_LUCK.png",
    ],
    bumpMaps:[
            ,,,,,,
    ],
    system:"shiver"
  });

  dice3d.addDicePreset({
    type:"d8",
    labels:[
      "systems/shiver/assets/dice/talent/SHIVER_T_STRANGE2.png",
      "systems/shiver/assets/dice/talent/SHIVER_T_STRANGE.png",
      "systems/shiver/assets/dice/talent/SHIVER_T_STRANGE.png",
      "systems/shiver/assets/dice/talent/SHIVER_T_TALENT.png",
      "systems/shiver/assets/dice/talent/SHIVER_T_TALENT.png",
      "systems/shiver/assets/dice/talent/SHIVER_T_TALENT.png",
      "systems/shiver/assets/dice/talent/SHIVER_T_TALENT2.png",
      "systems/shiver/assets/dice/talent/SHIVER_T_TALENT2.png"
    ],
    bumpMaps:[
            ,,,,,,,,
    ],
    system:"shiver"
  });
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type !== "Item") return;
    // Only owned Items get an item macro; leave anything else to the core hotbar.
    const item = foundry.utils.fromUuidSync(data.uuid, { strict: false });
    if (!item?.isEmbedded) return;
    createItemMacro(item, slot);
    return false;
  });
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Item} item       The dropped owned Item
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(item, slot) {
  // Create the macro command
  const command = `game.shiver.rollItemMacro(${JSON.stringify(item.name)});`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "shiver.itemMacro": true }
    });
  }
  return game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}