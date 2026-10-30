import { dropInvalidNumbers, numberField } from "./_fields.mjs";

const { ArrayField, BooleanField, HTMLField, NumberField, ObjectField, SchemaField, SetField, StringField } =
  foundry.data.fields;

const choices = key => () => Object.fromEntries(Object.entries(CONFIG.shiver[key]).map(([k, v]) =>
  [k, typeof v === "string" ? v : v.label]));

/**
 * Automation rules attached to an item. Each entry is a plain object with a `kind` (see module/rules/automation.mjs).
 */
function automationField() {
  return new ArrayField(new ObjectField());
}

/**
 * Limited uses, recharging per turn, round, encounter, Doom Quarter (OPDQ), Doom Cycle (OPDC) or story.
 */
function usesField(per = "always") {
  return new SchemaField({
    per: new StringField({ initial: per, choices: choices("frequencies") }),
    max: numberField(1),
    spent: numberField(0),
    // The Doom Clock state when the uses were last spent, used to recharge OPDQ/OPDC uses.
    serial: numberField(-1),
    cycle: numberField(0),
    // Combat state when last spent, used to recharge per-turn/round/encounter uses.
    combat: new StringField({ initial: "", blank: true }),
    round: numberField(0),
    turn: numberField(-1)
  });
}

/**
 * Data shared by every Item type.
 */
class ShiverItemData extends foundry.abstract.TypeDataModel {

  /** @override */
  static defineSchema() {
    return {
      description: new HTMLField({ initial: "" }),
      source: new StringField({ initial: "" }),
      automation: automationField()
    };
  }

  /** @inheritDoc */
  static migrateData(source) {
    dropInvalidNumbers(source, this.schema);
    return super.migrateData(source);
  }

  /**
   * Is this item currently contributing its automation rules to its owner?
   * @type {boolean}
   */
  get active() {
    return true;
  }
}

/* -------------------------------------------- */

/**
 * Normalise a skill name written as free text ("Grit") to a skill key ("grit").
 * @param {string} value
 * @returns {string}
 */
function skillKey(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return key;
}

/* -------------------------------------------- */

/**
 * Data for generic gear and special items (p.156-160).
 */
export class GearData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      quantity: numberField(1),
      weight: numberField(0),
      consumable: new BooleanField({ initial: false }),
      uses: usesField("always"),
      doom: numberField(0),
      action: new StringField({ initial: "interact", choices: choices("actionCosts") }),
      skill: new StringField({ initial: "", blank: true }),
      cr: new NumberField({ required: false, nullable: true, initial: null }),
      category: new StringField({ initial: "", blank: true }),
      equipped: new BooleanField({ initial: true }),
      summary: new StringField({ initial: "" }),
      page: new NumberField({ required: false, nullable: true, initial: null })
    };
  }

  /** @override */
  get active() {
    return this.equipped && (this.quantity > 0);
  }

  /** @inheritDoc */
  static migrateData(source) {
    delete source.formula;
    if ( typeof source.skill === "string" ) source.skill = skillKey(source.skill);
    return super.migrateData(source);
  }
}

/* -------------------------------------------- */

/**
 * Data for traits: free-form abilities, mostly used by enemies.
 */
export class TraitData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      action: new StringField({ initial: "passive", choices: choices("actionCosts") }),
      uses: usesField("always"),
      doom: numberField(0),
      disrupt: new BooleanField({ initial: false }),
      summary: new StringField({ initial: "" })
    };
  }
}

/* -------------------------------------------- */

/**
 * Data for powers: attack abilities that use a Core Skill and deal damage (e.g. enemy powers, Earth Wind & Fire).
 */
export class PowerData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      skill: new StringField({ initial: "strange" }),
      damage: numberField(1),
      damageType: new StringField({ initial: "blunt" }),
      range: new StringField({ initial: "close" }),
      action: new StringField({ initial: "attack", choices: choices("actionCosts") }),
      uses: usesField("always"),
      doom: numberField(0),
      opposed: new StringField({ initial: "", blank: true }),
      disrupt: new BooleanField({ initial: false })
    };
  }

  /** @inheritDoc */
  static migrateData(source) {
    migrateAttack(source);
    return super.migrateData(source);
  }
}

/**
 * Migrate the free-text attack fields used by earlier versions.
 * @param {object} source
 */
function migrateAttack(source) {
  if ( typeof source.skill === "string" ) source.skill = skillKey(source.skill);
  if ( "damagetype" in source ) {
    source.damageType ??= String(source.damagetype ?? "blunt").toLowerCase();
    delete source.damagetype;
  }
  if ( typeof source.range === "number" ) {
    const ft = source.range;
    source.range = ft <= 5 ? "close" : ft <= 15 ? "near" : ft <= 50 ? "medium" : ft <= 150 ? "long" : "far";
  }
  delete source.formula;
}

/* -------------------------------------------- */

/**
 * Data for weapons (p.128-150). A character can carry two weapons (p.16).
 */
export class WeaponData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      weight: numberField(0),
      skill: new StringField({ initial: "grit" }),
      altSkills: new SetField(new StringField()),
      damage: numberField(1),
      damageType: new StringField({ initial: "blunt" }),
      altDamageTypes: new SetField(new StringField()),
      range: new StringField({ initial: "close" }),
      properties: new SetField(new StringField()),
      category: new StringField({ initial: "", blank: true }),
      material: new StringField({ initial: "", blank: true }),
      equipped: new BooleanField({ initial: true }),
      unarmed: new BooleanField({ initial: false }),
      ammo: new SchemaField({
        value: new NumberField({ required: false, nullable: true, initial: null, integer: true, min: 0 }),
        max: new NumberField({ required: false, nullable: true, initial: null, integer: true, min: 0 })
      }),
      uses: usesField("always"),
      doom: numberField(0),
      summary: new StringField({ initial: "" }),
      page: new NumberField({ required: false, nullable: true, initial: null })
    };
  }

  /** @inheritDoc */
  static migrateData(source) {
    migrateAttack(source);
    return super.migrateData(source);
  }

  /** Heavy weapons take an Attack and an Interact Action (player reference). */
  get heavy() {
    return this.properties.has("heavy");
  }

  /** @override */
  get active() {
    return this.equipped;
  }
}

/* -------------------------------------------- */

/**
 * Data for armour (p.15, p.151-155). Each Armour Slot it fills has its own Health Points.
 */
export class ArmourData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      slots: new NumberField({ required: true, nullable: false, integer: true, min: 1, max: 3, initial: 1 }),
      hpPerSlot: numberField(2),
      slotHp: new ArrayField(new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 2 })),
      heavy: new BooleanField({ initial: false }),
      equipped: new BooleanField({ initial: true }),
      unbreakable: new BooleanField({ initial: false }),
      abilityName: new StringField({ initial: "" }),
      summary: new StringField({ initial: "" }),
      page: new NumberField({ required: false, nullable: true, initial: null })
    };
  }

  /** @inheritDoc */
  static migrateData(source) {
    // Earlier versions stored a single HP number.
    if ( typeof source.hp === "number" ) {
      const slots = Math.clamp(Number(source.slots) || 1, 1, 3);
      const per = 2;
      let remaining = source.hp;
      source.slotHp ??= Array.from({ length: slots }, () => {
        const v = Math.clamp(remaining, 0, per);
        remaining -= v;
        return v;
      });
      delete source.hp;
    }
    return super.migrateData(source);
  }

  /** @override */
  prepareDerivedData() {
    const per = this.hpPerSlot;
    const hp = Array.from({ length: this.slots }, (_, i) => Math.clamp(this.slotHp[i] ?? per, 0, per));
    this.slotHp = hp;
    this.hp = { value: hp.reduce((a, b) => a + b, 0), max: per * this.slots };
    this.broken = !this.unbreakable && (this.hp.value <= 0);
  }

  /** Armour abilities stop working once every slot is destroyed (p.15). */
  get active() {
    return this.equipped && !this.broken;
  }
}

/* -------------------------------------------- */

/**
 * Data for Archetype abilities and Archetype Tree nodes (p.30).
 */
export class AbilityData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      archetype: new StringField({ initial: "" }),
      node: new StringField({ initial: "" }),
      path: new StringField({ initial: "" }),
      tier: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 10, initial: 1 }),
      tree: new BooleanField({ initial: false }),
      prerequisites: new ArrayField(new StringField()),
      action: new StringField({ initial: "passive", choices: choices("actionCosts") }),
      uses: usesField("always"),
      doom: numberField(0),
      upgrades: new StringField({ initial: "", blank: true }),
      choices: new ObjectField(),
      summary: new StringField({ initial: "" }),
      page: new NumberField({ required: false, nullable: true, initial: null }),
      // Abilities that make a Strike (e.g. Claws, Decay) carry an attack profile.
      attack: new SchemaField({
        skill: new StringField({ initial: "", blank: true }),
        damage: numberField(0),
        damageType: new StringField({ initial: "blunt" }),
        range: new StringField({ initial: "close" }),
        unarmed: new BooleanField({ initial: false }),
        ranged: new BooleanField({ initial: false })
      })
    };
  }

  /** Does this ability make a Strike? */
  get isAttack() {
    return !!this.attack?.skill;
  }

  /** Abilities lost to Nightmare Mode Trauma stop working (p.15). */
  get active() {
    return !this.parent?.parent?.system?.lostToTrauma?.(this.parent.id);
  }
}

/* -------------------------------------------- */

/**
 * Data for Backgrounds (p.80-94): a unique ability and a Flaw.
 */
export class BackgroundData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      abilityName: new StringField({ initial: "" }),
      abilityDescription: new HTMLField({ initial: "" }),
      action: new StringField({ initial: "passive", choices: choices("actionCosts") }),
      uses: usesField("always"),
      doom: numberField(0),
      flawName: new StringField({ initial: "" }),
      flawDescription: new HTMLField({ initial: "" }),
      flawAutomation: automationField(),
      archetype: new StringField({ initial: "", blank: true }),
      abilitySummary: new StringField({ initial: "" }),
      flawSummary: new StringField({ initial: "" }),
      page: new NumberField({ required: false, nullable: true, initial: null })
    };
  }

  /** A Background's ability can be lost to Nightmare Mode Trauma (its Flaw still applies, see flawAutomation). */
  get active() {
    return !this.parent?.parent?.system?.lostToTrauma?.(this.parent.id);
  }
}

/* -------------------------------------------- */

/**
 * Data for Flaws, including Fatal Flaws (p.79).
 */
export class FlawData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      fatal: new BooleanField({ initial: false }),
      summary: new StringField({ initial: "" }),
      page: new NumberField({ required: false, nullable: true, initial: null })
    };
  }
}
