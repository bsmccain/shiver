import { dropInvalidNumbers, numberField } from "./_fields.mjs";

const { HTMLField, StringField } = foundry.data.fields;

/**
 * Data shared by every Item type.
 */
class ShiverItemData extends foundry.abstract.TypeDataModel {

  /** @override */
  static defineSchema() {
    return {
      description: new HTMLField({ initial: "" })
    };
  }

  /** @inheritDoc */
  static migrateData(source) {
    dropInvalidNumbers(source, this.schema);
    return super.migrateData(source);
  }
}

/* -------------------------------------------- */

/**
 * Data for generic gear.
 */
export class GearData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      quantity: numberField(1),
      weight: numberField(0),
      formula: new StringField({ initial: "(@abilities.grit.skill.value)d6+(@abilities.grit.talent.value)d8" })
    };
  }
}

/* -------------------------------------------- */

/**
 * Data for traits.
 */
export class TraitData extends ShiverItemData {}

/* -------------------------------------------- */

/**
 * Data for powers.
 */
export class PowerData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      skill: new StringField({ initial: "Strange" }),
      damage: numberField(1),
      damagetype: new StringField({ initial: "Fire" }),
      range: numberField(5),
      formula: new StringField({ initial: "" })
    };
  }
}

/* -------------------------------------------- */

/**
 * Data for weapons.
 */
export class WeaponData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      weight: numberField(0),
      skill: new StringField({ initial: "Grit" }),
      damage: numberField(1),
      damagetype: new StringField({ initial: "Blunt" }),
      range: numberField(5),
      formula: new StringField({ initial: "" })
    };
  }
}

/* -------------------------------------------- */

/**
 * Data for armour.
 */
export class ArmourData extends ShiverItemData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      hp: numberField(2),
      slots: numberField(1)
    };
  }
}
