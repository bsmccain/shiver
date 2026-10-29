// Data models.
import { CharacterData, NpcData } from "./data/actor.mjs";
import {
  AbilityData, ArmourData, BackgroundData, FlawData, GearData, PowerData, TraitData, WeaponData
} from "./data/item.mjs";
// Documents.
import { shiverActor } from "./documents/actor.mjs";
import { ActorActions } from "./documents/actor-actions.mjs";
import { shiverItem } from "./documents/item.mjs";
// Sheets.
import { shiverActorSheet } from "./sheets/actor-sheet.mjs";
import { shiverItemSheet } from "./sheets/item-sheet.mjs";
// Systems.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { shiver } from "./helpers/config.mjs";
import { SkillDie, TalentDie } from "./dice/terms.mjs";
import { ShiverCheck } from "./dice/check.mjs";
import { DoomClock, DoomClockHUD } from "./doom/doom-clock.mjs";
import { registerStatusEffects } from "./effects/statuses.mjs";
import { registerQueries } from "./socket.mjs";
import { registerSettings } from "./settings.mjs";
import { registerActorOperations } from "./gm-ops.mjs";
import { onRenderChatMessage } from "./chat.mjs";
import { ShiverCombat, ShiverCombatTracker } from "./combat/combat.mjs";
import { receiveDamage, applyDamage, rollReaction } from "./combat/damage.mjs";
import { registerIntegrations } from "./integrations.mjs";
import { registerGMTools } from "./apps/gm-tools.mjs";
import { ARCHETYPES } from "./content/archetypes.mjs";
import { ArchetypeTree } from "./apps/archetype-tree.mjs";
import { describeRule } from "./sheets/item-sheet.mjs";
import { treeNodeAllowed } from "./apps/archetype-tree.mjs";
import { equipFits, isFreeWeapon } from "./documents/actor-actions.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", async function() {
  // Utility classes and API on the game object.
  game.shiver = {
    shiverActor,
    shiverItem,
    ShiverCheck,
    DoomClock,
    ArchetypeTree,
    rollItemMacro,
    receiveDamage,
    applyDamage,
    rollReaction,
    describeRule
  };

  CONFIG.shiver = shiver;
  CONFIG.shiver.archetypes = ARCHETYPES;
  CONFIG.Dice.terms.s = SkillDie;
  CONFIG.Dice.terms.t = TalentDie;

  // There is no initiative roll in SHIVER: combatants are placed in Combat States (p.21).
  CONFIG.Combat.initiative = { formula: "2", decimals: 2 };
  CONFIG.Combat.documentClass = ShiverCombat;
  CONFIG.ui.combat = ShiverCombatTracker;
  CONFIG.ActiveEffect.expiryAction = "delete";

  // Documents.
  Object.assign(shiverActor.prototype, ActorActions);
  CONFIG.Actor.documentClass = shiverActor;
  CONFIG.Item.documentClass = shiverItem;
  Object.assign(CONFIG.Actor.dataModels, { character: CharacterData, npc: NpcData });
  Object.assign(CONFIG.Item.dataModels, {
    item: GearData,
    trait: TraitData,
    power: PowerData,
    weapon: WeaponData,
    armour: ArmourData,
    ability: AbilityData,
    background: BackgroundData,
    flaw: FlawData
  });
  CONFIG.Actor.trackableAttributes = {
    character: { bar: ["hp"], value: ["attributes.luck.value"] },
    npc: { bar: ["hp"], value: [] }
  };

  registerStatusEffects();
  registerSettings();
  DoomClock.register();
  registerQueries();
  registerActorOperations();

  // Sheets.
  const { Actors, Items } = foundry.documents.collections;
  Actors.registerSheet("shiver", shiverActorSheet, { makeDefault: true, label: "shiver.SheetActor" });
  Items.registerSheet("shiver", shiverItemSheet, { makeDefault: true, label: "shiver.SheetItem" });

  registerHandlebarsHelpers();
  registerIntegrations();
  registerGMTools();
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

function registerHandlebarsHelpers() {
  Handlebars.registerHelper("concat", function(...args) {
    return args.slice(0, -1).filter(a => typeof a !== "object").join("");
  });
  Handlebars.registerHelper("toLowerCase", str => String(str ?? "").toLowerCase());
  Handlebars.registerHelper("ifEquals", function(a, b, options) {
    return (a == b) ? options.fn(this) : options.inverse(this);
  });
  Handlebars.registerHelper("shiverRange", (n, options) => {
    let out = "";
    for ( let i = 0; i < n; i++ ) out += options.fn({ index: i, number: i + 1 });
    return out;
  });
  Handlebars.registerHelper("shiverHas", (collection, value) => {
    if ( !collection ) return false;
    if ( collection instanceof Set ) return collection.has(value);
    if ( Array.isArray(collection) ) return collection.includes(value);
    return false;
  });
}

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  if ( game.settings.get("shiver", "showDoomClock") ) {
    ui.shiverDoom = new DoomClockHUD();
    ui.shiverDoom.render({ force: true });
  }
  else ui.shiverDoom = new DoomClockHUD();

  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if ( data.type !== "Item" ) return;
    const item = foundry.utils.fromUuidSync(data.uuid, { strict: false });
    if ( !item?.isEmbedded ) return;
    createItemMacro(item, slot);
    return false;
  });
});

Hooks.on("renderChatMessageHTML", onRenderChatMessage);

// Keep action pips on open sheets in step with the tracker.
Hooks.on("updateCombatant", combatant => combatant.actor?.sheet?.rendered && combatant.actor.sheet.render());
Hooks.on("updateCombat", combat => {
  for ( const c of combat.combatants ) if ( c.actor?.sheet?.rendered ) c.actor.sheet.render();
});

// Character limits: Archetype Tree abilities follow the tree (p.30, p.78); two weapons and three Armour Slots (p.128).
Hooks.on("preCreateItem", (item, data, options, userId) => {
  if ( userId !== game.user.id ) return;
  const actor = item.parent;
  if ( !(actor instanceof Actor) || (actor.type !== "character") ) return;
  if ( (item.type === "ability") && item.system.tree && !options.shiverTree && game.settings.get("shiver", "enforceTree") ) {
    const check = treeNodeAllowed(actor, item.system);
    if ( !check.ok ) {
      ui.notifications.warn(game.i18n.format("shiver.Tree.blocked", { name: item.name, reason: check.reason }));
      return false;
    }
  }
  if ( ["armour", "weapon"].includes(item.type) && item.system.equipped ) {
    // Items created together count against each other's slots.
    const pending = PENDING_EQUIP.get(actor.uuid) ?? { armour: 0, weapons: 0 };
    if ( !equipFits(actor, item, pending) ) {
      item.updateSource({ "system.equipped": false });
      ui.notifications.info(game.i18n.format("shiver.Warn.Unequipped", { item: item.name }));
    }
    else {
      if ( item.type === "armour" ) pending.armour += item.system.slots ?? 1;
      else if ( !isFreeWeapon(item) ) pending.weapons += 1;
      PENDING_EQUIP.set(actor.uuid, pending);
      setTimeout(() => PENDING_EQUIP.delete(actor.uuid), 0);
    }
  }
});

/** Slots claimed by items that are being created in the same batch. */
const PENDING_EQUIP = new Map();
Hooks.on("preUpdateItem", (item, changes, options, userId) => {
  if ( userId !== game.user.id ) return;
  const actor = item.parent;
  if ( !(actor instanceof Actor) || (actor.type !== "character") || !["armour", "weapon"].includes(item.type) ) return;
  if ( (foundry.utils.getProperty(changes, "system.equipped") === true) && !item.system.equipped && !equipFits(actor, item) ) {
    const key = item.type === "armour" ? "shiver.Warn.ArmourSlots" : "shiver.Warn.WeaponSlots";
    ui.notifications.warn(game.i18n.format(key, { n: item.type === "armour" ? actor.system.slots.armour : actor.system.slots.weapons }));
    return false;
  }
});

// Tree nodes that need a choice (e.g. +2 Core Points) prompt for it however they were added, e.g. from the compendium.
Hooks.on("createItem", async (item, options, userId) => {
  if ( (userId !== game.user.id) || (item.type !== "ability") || !item.parent ) return;
  const c = item.system.choices;
  if ( !c?.type ) return;
  const pending = (item.system.automation ?? []).some(r => r.skill === "choice");
  const chosen = (item.system.automation ?? []).some(r => ["skillPoints", "talentPoints"].includes(r.kind) && (r.skill !== "choice"));
  if ( !pending && chosen ) return;
  const node = { name: item.name, choices: c };
  const extra = await ArchetypeTree.promptChoices(item.parent, node);
  if ( !extra?.length ) return;
  await item.update({ "system.automation": [...item.system.automation.filter(r => r.skill !== "choice"), ...extra] });
});

// Keep Afraid and Terrified exclusive: Terrified replaces Afraid (p.96).
Hooks.on("createActiveEffect", async (effect, options, userId) => {
  if ( userId !== game.user.id ) return;
  const actor = effect.parent;
  if ( !(actor instanceof Actor) ) return;
  if ( effect.statuses.has("afraid") && actor.hasStatus("terrified") ) return effect.delete();
  if ( effect.statuses.has("terrified") && actor.statusEffect("afraid") ) await actor.removeStatus("afraid");
});

// Requested checks with a hidden CR resolve themselves when the GM's note has the CR.
Hooks.on("createChatMessage", async message => {
  if ( !game.user.isActiveGM ) return;
  const check = message.getFlag("shiver", "check");
  if ( !check?.requestId || Number.isFinite(check.cr) ) return;
  const note = game.messages.find(m => m.getFlag("shiver", "requestCR")?.requestId === check.requestId)?.getFlag("shiver", "requestCR");
  if ( Number.isFinite(note?.cr) ) await ShiverCheck._onSetCR({ messageId: message.id, cr: note.cr, hidden: !note.show });
});

// Infections advance one stage each Doom Quarter (p.192), unless the Director tracks them on the Lifeline.
Hooks.on("shiver.doomQuarter", async () => {
  // The hook fires only on the GM client that moved the clock.
  if ( !game.user.isGM || (game.settings.get("shiver", "infectionMethod") !== "doom") ) return;
  const actors = new Set(game.actors.contents);
  for ( const t of canvas?.scene?.tokens ?? [] ) if ( t.actor && !t.actorLink ) actors.add(t.actor);
  for ( const actor of actors ) {
    const effect = actor.statusEffect("infected");
    if ( !effect ) continue;
    const stage = Math.min(4, (Number(effect.flags?.shiver?.value) || 0) + 1);
    await effect.setFlag("shiver", "value", stage);
    const infection = CONFIG.shiver.infections[effect.flags?.shiver?.infection ?? "other"];
    const notes = (infection?.stages?.[stage] ?? []).map(r => r.note ?? game.shiver.describeRule?.(r)).filter(Boolean);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      whisper: game.users.filter(u => u.isGM || actor.testUserPermission(u, "OWNER")).map(u => u.id),
      content: `<div class="shiver-card shiver-infection"><h3><i class="fa-solid fa-biohazard"></i> ${game.i18n.format("shiver.Infection.stage", {
        name: actor.name, infection: game.i18n.localize(infection?.label ?? "shiver.Status.infected"), stage })}</h3>${notes.map(n => `<p>${n}</p>`).join("")}</div>`
    });
  }
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * @param {Item} item       The dropped owned Item
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(item, slot) {
  const command = `game.shiver.rollItemMacro(${JSON.stringify(item.name)});`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if ( !macro ) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command,
      flags: { "shiver.itemMacro": true }
    });
  }
  return game.user.assignHotbarMacro(macro, slot);
}

/**
 * Use an item of the speaker's actor by name.
 * @param {string} itemName
 * @returns {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if ( speaker.token ) actor = game.actors.tokens[speaker.token];
  if ( !actor ) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if ( !item ) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
  return item.roll();
}
