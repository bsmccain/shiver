import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {rollDialog} from "../system/dice.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * The tabs shown on each type of Actor sheet.
 * @type {Record<string, ApplicationTabsConfiguration>}
 */
const ACTOR_TABS = {
  character: {
    tabs: [{ id: "skills" }, { id: "traits" }, { id: "items" }, { id: "spells" }, { id: "description" }, { id: "effects" }],
    initial: "skills",
    labelPrefix: "shiver.Tab"
  },
  npc: {
    tabs: [{ id: "description" }, { id: "abilities" }, { id: "attacks" }, { id: "effects" }],
    initial: "description",
    labelPrefix: "shiver.Tab"
  }
};

/**
 * The Actor sheet used for both characters and NPCs.
 * @extends {ActorSheetV2}
 */
export class shiverActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["shiver", "sheet", "actor", "themed", "theme-light"],
    position: { width: 600, height: 600 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      createItem: shiverActorSheet.#onCreateItem,
      editItem: shiverActorSheet.#onEditItem,
      deleteItem: shiverActorSheet.#onDeleteItem,
      itemToChat: shiverActorSheet.#onItemToChat,
      toggleDescription: shiverActorSheet.#onToggleDescription,
      roll: shiverActorSheet.#onRoll,
      setFear: shiverActorSheet.#onSetFear,
      manageEffect: shiverActorSheet.#onManageEffect
    }
  };

  /** @override */
  static PARTS = {
    character: {
      template: "systems/shiver/templates/actor/actor-character-sheet.html",
      scrollable: [".sheet-body"]
    },
    npc: {
      template: "systems/shiver/templates/actor/actor-npc-sheet.html",
      scrollable: [".sheet-body"]
    }
  };

  /**
   * The tabs are configured per Actor type, see ACTOR_TABS.
   * @override
   */
  static TABS = {
    primary: {}
  };

  /**
   * The IDs of items whose descriptions are currently expanded on the sheet.
   * @type {Set<string>}
   */
  #expanded = new Set();

  /* -------------------------------------------- */

  /** @override */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    return { [this.actor.type]: parts[this.actor.type] };
  }

  /* -------------------------------------------- */

  /** @override */
  _getTabsConfig(group) {
    if ( group === "primary" ) return ACTOR_TABS[this.actor.type];
    return super._getTabsConfig(group);
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const rollData = actor.getRollData();

    // Add the actor's data to context for easier access, as well as flags.
    context.actor = actor;
    context.system = actor.system;
    context.flags = actor.flags;
    context.rollData = rollData;

    // Prepare items.
    await this._prepareItems(context);

    // Prepare character data.
    if (actor.type == 'character') {
      this._prepareCharacterData(context);
    }

    // Prepare NPC data.
    if (actor.type == 'npc') {
      this._prepareNpcData(context);
    }

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(actor.effects);

    // Prepare rich text fields.
    const enrichOptions = { rollData, relativeTo: actor, secrets: actor.isOwner };
    context.systemFields = actor.system.schema.fields;
    context.enrichBio = await TextEditor.enrichHTML(actor.system.biography, enrichOptions);
    context.description = await TextEditor.enrichHTML(actor.system.description, enrichOptions);

    return context;
  }

  /**
   * Prepare character skills, fear level and lifeline.
   *
   * @param {Object} context The context to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    const system = this.actor.system;

    // Handle skills and talents.
    context.abilities = Object.entries(CONFIG.shiver.skills).map(([key, skill]) => ({
      key,
      label: game.i18n.localize(skill.label),
      img: skill.img,
      ...system.abilities[key]
    }));

    // Handle the fear level.
    context.fearLevels = CONFIG.shiver.fearLevels.map((key, value) => ({
      key,
      value,
      active: system.attributes["fear-level"].value === value
    }));

    // Handle the lifeline: boxes are crossed off from the left as health is lost.
    const length = CONFIG.shiver.lifelineLength;
    context.lifeline = Array.from({ length }, (_, i) => i < (length - system.hp.value));
  }

  /**
   * Prepare NPC skills.
   *
   * @param {Object} context The context to prepare.
   *
   * @return {undefined}
   */
  _prepareNpcData(context) {
    const system = this.actor.system;
    context.skills = Object.entries(CONFIG.shiver.skills).map(([key, skill]) => ({
      key,
      label: game.i18n.localize(skill.label),
      img: skill.img,
      ...system.skills[key]
    }));
  }

  /**
   * Organize and classify Items for the sheet.
   *
   * @param {Object} context The context to prepare.
   *
   * @return {undefined}
   */
  async _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const traits = [];
    const powers = [];

    // Iterate through items, allocating to containers
    for (const item of this.actor.items.contents.sort((a, b) => a.sort - b.sort)) {
      const i = {
        _id: item.id,
        name: item.name,
        type: item.type,
        img: item.img || Item.implementation.DEFAULT_ICON,
        system: item.system,
        skillImg: CONFIG.shiver.attackIcon,
        display: this.#expanded.has(item.id) ? "block" : "none",
        enrichDescription: await TextEditor.enrichHTML(item.system.description, {
          rollData: item.getRollData(), relativeTo: item, secrets: item.isOwner
        })
      };
      // Append to gear.
      if (i.type === 'item' || i.type === "weapon" || i.type === "armour") {
        gear.push(i);
      }
      // Append to trait
      else if (i.type === 'trait') {
        traits.push(i);
      }
      // Append to spells.
      else if (i.type === 'power') {
        powers.push(i);
      }
    }
    // Assign and return
    context.gear = gear;
    context.traits = traits;
    context.powers = powers;
  }

  /* -------------------------------------------- */

  /**
   * Get the owned Item which a sheet element belongs to.
   * @param {HTMLElement} target    An element within an item list entry
   * @returns {Item|undefined}
   */
  _getItem(target) {
    const li = target.closest(".item");
    return this.actor.items.get(li?.dataset.itemId);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onRender(context, options) {
    // Make owned items and effects draggable, so they can be dropped on the hotbar or other sheets.
    // This must happen before the parent class binds its drag and drop handlers.
    for ( const li of this.element.querySelectorAll("li.item[data-item-id], li.effect[data-effect-id]") ) {
      li.classList.add("draggable");
    }
    await super._onRender(context, options);
  }

  /* -------------------------------------------- */

  /**
   * Handle creating a new Owned Item for the actor using the type defined in the HTML dataset
   * @this {shiverActorSheet}
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The clicked element
   */
  static async #onCreateItem(event, target) {
    // Get the type of item to create.
    const type = target.dataset.type;
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Finally, create the item!
    return Item.implementation.create({ name, type }, { parent: this.actor });
  }

  /**
   * Render the item sheet for viewing/editing.
   * @this {shiverActorSheet}
   */
  static #onEditItem(event, target) {
    this._getItem(target)?.sheet.render(true);
  }

  /**
   * Delete an owned item.
   * @this {shiverActorSheet}
   */
  static async #onDeleteItem(event, target) {
    const item = this._getItem(target);
    if ( !item ) return;
    this.#expanded.delete(item.id);
    return item.delete();
  }

  /**
   * Post an owned item's details to chat.
   * @this {shiverActorSheet}
   */
  static #onItemToChat(event, target) {
    const item = this._getItem(target);
    if ( !item ) return;
    let html;
    if(item.type === "weapon"){
    html = `<hr><h3>WEAPON  [${item.name}]</h3>
            <h4>Skill: ${item.system.skill}</h4>
            <h4>Range: ${item.system.range}</h4>
            <h4>Damage: ${item.system.damage} ${item.system.damagetype} </h4><hr>
            <span>${ item.system.description}</span>`
    }else if(item.type === "power"){
    html = `<hr><h3>POWER  [${item.name}]</h3>
      <h4>Skill: ${item.system.skill}</h4>
      <h4>Range: ${item.system.range}</h4>
      <h4>Damage: ${item.system.damage} ${item.system.damagetype} </h4><hr>
      <span>${item.system.description}</span>`
    }else if(item.type === "armour"){
    html =  `<hr><h3>ARMOUR  [${item.name}] HP: ${item.system.hp}</h3>
    <span>${item.system.description}</span>`
    }else{
    html = `<hr><h3>${item.name}</h3>
    <span>${item.system.description}</span>`
    }
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: html
    }, { messageMode: game.settings.get("core", "messageMode") });
  }

  /**
   * Hide/show an item's description on the sheet.
   * @this {shiverActorSheet}
   */
  static #onToggleDescription(event, target) {
    const item = this._getItem(target);
    if ( !item ) return;
    if ( this.#expanded.has(item.id) ) this.#expanded.delete(item.id);
    else this.#expanded.add(item.id);
    this.render();
  }

  /**
   * Handle clickable rolls.
   * @this {shiverActorSheet}
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The clicked element
   */
  static #onRoll(event, target) {
    const dataset = target.dataset;

    // Handle item rolls, which use the actor's dice for the item's skill.
    if (dataset.rollType == 'item') {
      const item = this._getItem(target);
      if ( !item ) return;
      const skill = item.system.skill?.toLowerCase();
      if ( !(skill in CONFIG.shiver.skills) ) {
        return ui.notifications.warn(game.i18n.format("shiver.UnknownSkill", { skill: item.system.skill, item: item.name }));
      }
      const ability = this.actor.system.abilities?.[skill];
      const skillDice = ability?.skill.value ?? this.actor.system.skills?.[skill]?.value ?? 0;
      const talentDice = ability?.talent.value ?? 0;
      return rollDialog(this.actor, skill, skillDice, talentDice);
    }

    if (dataset.skill) {
      return rollDialog(this.actor, dataset.skill, dataset.skillDice, dataset.talentDice);
    }
  }

  /**
   * Set the character's fear level.
   * @this {shiverActorSheet}
   */
  static #onSetFear(event, target) {
    return this.actor.update({ "system.attributes.fear-level.value": Number(target.dataset.level) });
  }

  /**
   * Active Effect management.
   * @this {shiverActorSheet}
   */
  static #onManageEffect(event, target) {
    return onManageActiveEffect(target, this.actor);
  }
}
