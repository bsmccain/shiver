/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class shiverItem extends Item {

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, start from the actor's roll data.
    const rollData = this.actor?.getRollData() ?? {};
    rollData.item = this.system.toObject();

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const messageMode = game.settings.get("core", "messageMode");
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      return ChatMessage.create({
        speaker: speaker,
        flavor: label,
        content: item.system.description ?? ''
      }, { messageMode });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData);
      await roll.toMessage({
        speaker: speaker,
        flavor: label,
      }, { messageMode });
      return roll;
    }
  }
}
