import { shiver } from "../helpers/config.mjs";
import { dropInvalidNumbers, numberField } from "./_fields.mjs";

const { HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data shared by every Actor type.
 */
class ShiverActorData extends foundry.abstract.TypeDataModel {

  /** @override */
  static defineSchema() {
    return {
      hp: new SchemaField({
        value: numberField(16),
        min: numberField(0),
        max: numberField(16)
      }),
      speed: new SchemaField({
        value: numberField(30)
      }),
      size: new StringField({ initial: "" }),
      biography: new HTMLField({ initial: "" })
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
 * Data for player characters.
 */
export class CharacterData extends ShiverActorData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      attributes: new SchemaField({
        level: new SchemaField({
          value: numberField(1)
        }),
        luck: new SchemaField({
          value: numberField(0),
          min: numberField(0),
          max: numberField(3)
        }),
        fear: new StringField({ initial: "I fear..." }),
        archetype: new StringField({ initial: "" }),
        background: new StringField({ initial: "" }),
        gender: new StringField({ initial: "" }),
        age: numberField(20),
        "fear-level": new SchemaField({
          value: numberField(0),
          min: numberField(0),
          max: numberField(shiver.fearLevels.length - 1)
        })
      }),
      abilities: new SchemaField(Object.keys(shiver.skills).reduce((abilities, key) => {
        abilities[key] = new SchemaField({
          skill: new SchemaField({
            value: numberField(3),
            reference: numberField(3)
          }),
          talent: new SchemaField({
            value: numberField(0),
            reference: numberField(0)
          })
        });
        return abilities;
      }, {}))
    };
  }
}

/* -------------------------------------------- */

/**
 * Data for non-player characters.
 */
export class NpcData extends ShiverActorData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      cr: numberField(0),
      type: new StringField({ initial: "Slasher" }),
      rating: new SchemaField({
        name: new StringField({ initial: "Amber" }),
        color: numberField(0)
      }),
      reaction: new StringField({ initial: "Bruiser" }),
      immunity: new StringField({ initial: "None" }),
      resistance: new StringField({ initial: "None" }),
      weakness: new StringField({ initial: "None" }),
      description: new HTMLField({ initial: "" }),
      skills: new SchemaField(Object.keys(shiver.skills).reduce((skills, key) => {
        skills[key] = new SchemaField({
          value: numberField(3)
        });
        return skills;
      }, {}))
    };
  }
}
