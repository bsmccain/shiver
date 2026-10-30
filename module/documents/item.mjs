import { renderItemCard, usesRemaining } from "./actor-actions.mjs";

/**
 * The SHIVER Item document.
 * @extends {Item}
 */
export class shiverItem extends Item {

  /**
   * Roll data for formulas in descriptions.
   * @override
   */
  getRollData() {
    const rollData = this.actor?.getRollData() ?? {};
    rollData.item = this.system.toObject?.() ?? {};
    return rollData;
  }

  /**
   * Can this item make a Strike?
   * @type {boolean}
   */
  get isAttack() {
    return ["weapon", "power"].includes(this.type) || ((this.type === "ability") && !!this.system.attack?.skill);
  }

  /**
   * Limited uses left, recharging from the Doom Clock and combat.
   * @type {object}
   */
  get usesState() {
    return usesRemaining(this);
  }

  /**
   * Use the item: weapons and powers make a Strike; everything else is used and posted to chat.
   * @param {object} [options]
   * @returns {Promise<ChatMessage|null>}
   */
  async roll(options = {}) {
    if ( !this.actor ) return this.toChat();
    if ( this.isAttack ) {
      // Attack abilities still spend their uses and pay their costs.
      if ( this.type === "ability" ) {
        if ( this.system.active === false ) {
          return ui.notifications.warn(game.i18n.format("shiver.Warn.AbilityLost", { item: this.name }));
        }
        const uses = this.usesState;
        if ( uses.limited && (uses.remaining <= 0) ) {
          return ui.notifications.warn(game.i18n.format("shiver.Warn.NoUses", { item: this.name, when: uses.recharge }));
        }
        const message = await this.actor.rollAttack(this, options);
        if ( message && uses.limited ) {
          const { spendUse } = await import("./actor-actions.mjs");
          await spendUse(this, uses);
        }
        return message;
      }
      return this.actor.rollAttack(this, options);
    }
    return this.actor.useItem(this);
  }

  /**
   * Post the item's description to chat without using it.
   * @returns {Promise<ChatMessage>}
   */
  async toChat() {
    const content = await renderItemCard(this, this.actor);
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content,
      flags: { shiver: { item: { uuid: this.uuid, actorUuid: this.actor?.uuid ?? null } } }
    }, { messageMode: game.settings.get("core", "messageMode") });
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    if ( (await super._preCreate(data, options, user)) === false ) return false;
    // Fill armour slot HP when first created.
    if ( (this.type === "armour") && !this.system.slotHp.length ) {
      this.updateSource({ "system.slotHp": Array.from({ length: this.system.slots }, () => this.system.hpPerSlot) });
    }
    if ( !data.img || (data.img === Item.implementation.DEFAULT_ICON) ) {
      const img = CONFIG.shiver.itemIcons?.[this.type];
      if ( img ) this.updateSource({ img });
    }
  }

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    if ( (await super._preUpdate(changes, options, user)) === false ) return false;
    // Keep one HP entry per Armour Slot.
    const slots = foundry.utils.getProperty(changes, "system.slots");
    if ( (this.type === "armour") && Number.isInteger(slots) && !foundry.utils.hasProperty(changes, "system.slotHp") ) {
      const per = foundry.utils.getProperty(changes, "system.hpPerSlot") ?? this.system.hpPerSlot;
      const hp = Array.from({ length: slots }, (_, i) => this._source.system.slotHp[i] ?? per);
      foundry.utils.setProperty(changes, "system.slotHp", hp);
    }
  }
}
