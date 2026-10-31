/**
 * Pre-load the Handlebars partials and templates used by the system.
 * @returns {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
  return foundry.applications.handlebars.loadTemplates([
    "systems/shiver/templates/actor/parts/actor-combat.html",
    "systems/shiver/templates/actor/parts/actor-abilities.html",
    "systems/shiver/templates/actor/parts/actor-items.html",
    "systems/shiver/templates/actor/parts/actor-effects.html",
    "systems/shiver/templates/chat/check-card.hbs",
    "systems/shiver/templates/chat/damage-card.hbs",
    "systems/shiver/templates/chat/reaction-card.hbs",
    "systems/shiver/templates/chat/item-card.hbs",
    "systems/shiver/templates/chat/opposed-card.hbs",
    "systems/shiver/templates/chat/group-card.hbs",
    "systems/shiver/templates/apps/check-dialog.hbs",
    "systems/shiver/templates/apps/doom-clock.hbs",
    "systems/shiver/templates/apps/archetype-tree.hbs",
    "systems/shiver/templates/combat/tracker.hbs",
    "systems/shiver/templates/combat/footer.hbs"
  ]);
};
