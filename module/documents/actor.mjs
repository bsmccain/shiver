/**
 * Extend the base Actor document by defining a custom roll data structure.
 * @extends {Actor}
 */
export class shiverActor extends Actor {

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    if ( (await super._preUpdate(changes, options, user)) === false ) return false;

    // A character's health can't go beyond the ends of their lifeline.
    const hp = foundry.utils.getProperty(changes, "system.hp.value");
    if ( (this.type === "character") && (typeof hp === "number") ) {
      const { min, max } = this.system.hp;
      foundry.utils.setProperty(changes, "system.hp.value", Math.clamp(hp, min, max));
    }
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Copy the system data so that the additions below don't modify the actor.
    const data = { ...super.getRollData() };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the skill and talent values to the top level, so that rolls can use
    // formulas like `@grit-skill`.
    for (let [k, v] of Object.entries(data.abilities)) {
      data[`${k}-skill`] = v.skill.value;
      data[`${k}-talent`] = v.talent.value;
    }

    // Add level for easier access, or fall back to 0.
    data.lvl = data.attributes.level.value ?? 0;
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

}
