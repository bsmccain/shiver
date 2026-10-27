/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {HTMLElement} target    The clicked effect control, with a data-effect-action attribute
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export function onManageActiveEffect(target, owner) {
  const li = target.closest("li");
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
  switch ( target.dataset.effectAction ) {
    case "create":
      return owner.createEmbeddedDocuments("ActiveEffect", [{
        name: game.i18n.localize("shiver.EffectNew"),
        img: "icons/svg/aura.svg",
        origin: owner.uuid,
        duration: li.dataset.effectType === "temporary" ? { value: 1, units: "rounds" } : undefined,
        disabled: li.dataset.effectType === "inactive"
      }]);
    case "edit":
      return effect.sheet.render(true);
    case "delete":
      return effect.delete();
    case "toggle":
      return effect.update({disabled: !effect.disabled});
  }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {

    // Define effect header categories
    const categories = {
      temporary: {
        type: "temporary",
        label: "shiver.EffectTemporary",
        effects: []
      },
      passive: {
        type: "passive",
        label: "shiver.EffectPassive",
        effects: []
      },
      inactive: {
        type: "inactive",
        label: "shiver.EffectInactive",
        effects: []
      }
    };

    // Iterate over active effects, classifying them into categories
    for ( let e of effects ) {
      if ( e.disabled ) categories.inactive.effects.push(e);
      else if ( e.isTemporary ) categories.temporary.effects.push(e);
      else categories.passive.effects.push(e);
    }
    return categories;
}
