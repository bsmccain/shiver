/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return foundry.applications.handlebars.loadTemplates([

    // Actor partials.
    "systems/shiver/templates/actor/parts/actor-items.html",
    "systems/shiver/templates/actor/parts/actor-powers.html",
    "systems/shiver/templates/actor/parts/actor-effects.html",
    "systems/shiver/templates/actor/parts/actor-traits.html",
    "systems/shiver/templates/actor/parts/actor-attacks.html"
  ]);
};
