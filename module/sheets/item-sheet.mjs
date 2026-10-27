const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * The Item sheet, with a separate template for each Item type.
 * @extends {ItemSheetV2}
 */
export class shiverItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["shiver", "sheet", "item", "themed", "theme-light"],
    position: { width: 520, height: 480 },
    window: { resizable: true },
    form: { submitOnChange: true }
  };

  /** @override */
  static PARTS = {
    item: { template: "systems/shiver/templates/item/item-item-sheet.html", scrollable: [".sheet-body"] },
    trait: { template: "systems/shiver/templates/item/item-trait-sheet.html", scrollable: [".sheet-body"] },
    power: { template: "systems/shiver/templates/item/item-power-sheet.html", scrollable: [".sheet-body"] },
    weapon: { template: "systems/shiver/templates/item/item-weapon-sheet.html", scrollable: [".sheet-body"] },
    armour: { template: "systems/shiver/templates/item/item-armour-sheet.html", scrollable: [".sheet-body"] }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [{ id: "description" }, { id: "attributes" }],
      initial: "description",
      labelPrefix: "shiver.Tab"
    }
  };

  /* -------------------------------------------- */

  /** @override */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    return { [this.item.type]: parts[this.item.type] };
  }

  /* -------------------------------------------- */

  /** @override */
  _getTabsConfig(group) {
    const config = super._getTabsConfig(group);
    // Armour has nothing to show on the attributes tab.
    if ( (group === "primary") && (this.item.type === "armour") ) {
      return { ...config, tabs: config.tabs.filter(tab => tab.id !== "attributes") };
    }
    return config;
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    // Retrieve base data structure.
    const context = await super._prepareContext(options);
    const item = this.item;

    // Retrieve the roll data for rich text enrichment.
    context.rollData = item.getRollData();

    // Add the item's data to context for easier access, as well as flags.
    context.item = item;
    context.system = item.system;
    context.flags = item.flags;
    context.systemFields = item.system.schema.fields;

    context.enrichDescription = await TextEditor.enrichHTML(item.system.description, {
      rollData: context.rollData, relativeTo: item, secrets: item.isOwner
    });

    return context;
  }
}
