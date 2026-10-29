import { shiver } from "../helpers/config.mjs";
import { dropInvalidNumbers, numberField } from "./_fields.mjs";
import { stepSpeed } from "../dice/pool.mjs";
import { ruleApplies } from "../rules/automation.mjs";

const { ArrayField, BooleanField, HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

const SKILL_KEYS = Object.keys(shiver.skills);
const SPEED_CHOICES = () => Object.fromEntries(Object.entries(CONFIG.shiver.speeds).map(([k, v]) => [k, v.label]));
const SIZE_CHOICES = () => Object.fromEntries(Object.entries(CONFIG.shiver.sizes).map(([k, v]) => [k, v.label]));

/**
 * Damage types an actor is immune, resistant or weak to, plus free text for things like "Silver".
 */
function damageModifierFields() {
  return {
    immune: new SetField(new StringField()),
    resistant: new SetField(new StringField()),
    weak: new SetField(new StringField()),
    immuneNotes: new StringField({ initial: "" }),
    resistantNotes: new StringField({ initial: "" }),
    weakNotes: new StringField({ initial: "" })
  };
}

/**
 * Data shared by every Actor type.
 */
class ShiverActorData extends foundry.abstract.TypeDataModel {

  /** @override */
  static defineSchema() {
    return {
      hp: new SchemaField({
        value: numberField(16),
        max: numberField(16)
      }),
      speed: new SchemaField({
        base: new StringField({ initial: "average", choices: SPEED_CHOICES })
      }),
      size: new StringField({ initial: "humanoid", choices: SIZE_CHOICES }),
      cr: new SchemaField({
        base: numberField(1)
      }),
      damage: new SchemaField(damageModifierFields()),
      biography: new HTMLField({ initial: "" })
    };
  }

  /** @inheritDoc */
  static migrateData(source) {
    // Speed used to be a number of feet.
    if ( typeof source.speed?.value === "number" ) {
      const ft = source.speed.value;
      source.speed.base ??= ft <= 20 ? "slow" : (ft >= 40 ? "fast" : "average");
      delete source.speed.value;
    }
    if ( (typeof source.size === "string") ) {
      const size = source.size.trim().toLowerCase();
      if ( !(size in shiver.sizes) ) source.size = "humanoid";
      else source.size = size;
    }
    if ( typeof source.cr === "number" ) source.cr = { base: Math.max(1, source.cr) };
    delete source.hp?.min;
    dropInvalidNumbers(source, this.schema);
    return super.migrateData(source);
  }

  /* -------------------------------------------- */

  /** Wounds currently marked on the Lifeline (or taken by an enemy). */
  get wounds() {
    return Math.max(0, this.hp.max - this.hp.value);
  }

  /** @override */
  prepareBaseData() {
    // Derived values that ability and status rules adjust during prepareDerivedData.
    this.speed.value = this.speed.base;
    this.speed.steps = 0;
    this.cr.value = this.cr.base;
    this.immunities = new Set(this.damage.immune);
    this.resistances = new Set(this.damage.resistant);
    this.weaknesses = new Set(this.damage.weak);
  }

  /** @override */
  prepareDerivedData() {
    const actor = this.parent;
    const rules = actor.statusRules;

    // Abilities and gear that change Speed, CR and damage modifiers. Conditions the system can check on the actor
    // (no weapon, no armour, wounds, Fear Status) are honoured; anything else is left to the table.
    const passive = new Set(["passive"]);
    const holds = rule => !rule.when || (ruleApplies(rule, { tags: passive, actor }) === true);
    let fast = false;
    for ( const rule of actor.automationRules() ) {
      switch ( rule.kind ) {
        case "speed": if ( rule.set && holds(rule) ) { this.speed.value = rule.set; if ( rule.set === "fast" ) fast = true; } break;
        case "speedStep": if ( holds(rule) ) this.speed.steps += Number(rule.amount) || 0; break;
        case "cr": if ( holds(rule) ) this.cr.value += Number(rule.amount) || 0; break;
        case "immunity": for ( const t of rule.types ?? [] ) this.immunities.add(t); break;
        case "resistance": for ( const t of rule.types ?? [] ) this.resistances.add(t); break;
        case "weakness": for ( const t of rule.types ?? [] ) this.weaknesses.add(t); break;
      }
    }

    // Heavy armour slows its wearer by one step (p.15).
    for ( const item of actor.itemTypes.armour ?? [] ) {
      if ( item.system.equipped && item.system.heavy && !item.system.broken ) this.speed.steps -= 1;
    }
    this.speed.value = stepSpeed(this.speed.value, this.speed.steps);

    // Status effects.
    let moveHalved = false;
    for ( const r of rules ) {
      if ( r.speed ) this.speed.value = r.speed;
      if ( r.moveHalved ) moveHalved = true;
      if ( r.cr ) this.cr.value += r.cr;
    }
    this._prepareSpeedOverrides?.();
    this.cr.value = Math.max(1, this.cr.value);
    const speed = CONFIG.shiver.speeds[this.speed.value] ?? CONFIG.shiver.speeds.average;
    this.speed.ft = moveHalved ? Math.floor(speed.ft / 2) : speed.ft;
    this.speed.hex = moveHalved ? Math.floor(speed.hex / 2) : speed.hex;
    this.speed.label = game.i18n.localize(speed.label);
    this.speed.moveHalved = moveHalved;

    this.hp.value = Math.clamp(this.hp.value, 0, Math.max(this.hp.max, 0));
    this.hp.wounds = this.wounds;
    this.hp.pct = this.hp.max ? Math.round((this.hp.value / this.hp.max) * 100) : 0;
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
          value: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 15, initial: 1 })
        }),
        luck: new SchemaField({
          value: numberField(0),
          max: numberField(1)
        }),
        fear: new StringField({ initial: "" }),
        archetype: new StringField({ initial: "" }),
        hybrids: new ArrayField(new StringField()),
        deficiency: new StringField({ initial: "", blank: true }),
        background: new StringField({ initial: "" }),
        gender: new StringField({ initial: "" }),
        age: new StringField({ initial: "" }),
        player: new StringField({ initial: "" })
      }),
      abilities: new SchemaField(SKILL_KEYS.reduce((abilities, key) => {
        abilities[key] = new SchemaField({
          skill: new SchemaField({
            value: numberField(3)
          }),
          talent: new SchemaField({
            value: numberField(0)
          })
        });
        return abilities;
      }, {})),
      nightmare: new SchemaField({
        weakened: new StringField({ initial: "", blank: true }),
        traumaSkill: new StringField({ initial: "", blank: true }),
        traumaAbility: new StringField({ initial: "", blank: true })
      }),
      survivor: new SchemaField({
        stabilised: new BooleanField({ initial: false })
      }),
      haunting: new BooleanField({ initial: false }),
      notes: new HTMLField({ initial: "" }),
      // A fear level from before 1.0 (0 Stable, 1 Afraid, 2 Terrified), waiting to become a status. See migrateData.
      legacyFearLevel: new NumberField({ nullable: true, integer: true, min: 0, max: 2, initial: null })
    };
  }

  /** @inheritDoc */
  static migrateData(source) {
    const attrs = source.attributes;
    if ( attrs ) {
      if ( typeof attrs.age === "number" ) attrs.age = String(attrs.age);
      if ( attrs.fear === "I fear..." ) attrs.fear = "";
      // The fear level is now tracked with the Afraid and Terrified statuses. Keep an old level until the GM's client
      // turns it into one of them (migrateLegacyFear in documents/actor.mjs).
      if ( "fear-level" in attrs ) {
        if ( (source.legacyFearLevel === undefined) || (source.legacyFearLevel === null) ) {
          source.legacyFearLevel = Math.clamp(Number(attrs["fear-level"]?.value) || 0, 0, 2);
        }
        delete attrs["fear-level"];
      }
      if ( attrs.luck ) delete attrs.luck.min;
    }
    for ( const ability of Object.values(source.abilities ?? {}) ) {
      delete ability?.skill?.reference;
      delete ability?.talent?.reference;
    }
    return super.migrateData(source);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareBaseData() {
    super.prepareBaseData();
    for ( const ability of Object.values(this.abilities) ) {
      ability.skill.base = ability.skill.value;
      ability.talent.base = ability.talent.value;
      ability.skill.bonus = 0;
      ability.talent.bonus = 0;
    }
    this.attributes.luck.bankMax = 1;
    this.slots = { armour: 3, weapons: 2 };
  }

  /** @inheritDoc */
  prepareDerivedData() {
    const actor = this.parent;

    // Static ability rules.
    let health = 0;
    for ( const rule of actor.automationRules() ) {
      if ( rule.when ) continue;
      const amount = Number(rule.amount) || 0;
      switch ( rule.kind ) {
        case "skillPoints":
          if ( this.abilities[rule.skill] ) this.abilities[rule.skill].skill.bonus += amount;
          break;
        case "talentPoints":
          if ( this.abilities[rule.skill] ) this.abilities[rule.skill].talent.bonus += amount;
          break;
        case "health": health += amount; break;
        case "luckBankMax":
          if ( rule.mode === "add" ) this.attributes.luck.bankMax += amount;
          else this.attributes.luck.bankMax = Math.max(this.attributes.luck.bankMax, amount);
          break;
        case "armourSlots": this.slots.armour += amount; break;
        case "weaponSlots": this.slots.weapons += amount; break;
      }
    }
    this.hp.max = CONFIG.shiver.lifelineLength + health;

    // Nightmare Mode penalties for wounded quarters of the Lifeline (p.15).
    this._prepareNightmare();

    for ( const ability of Object.values(this.abilities) ) {
      ability.skill.total = Math.max(0, ability.skill.base + ability.skill.bonus);
      ability.talent.total = Math.max(0, ability.talent.base + ability.talent.bonus);
    }
    this.attributes.luck.max = this.attributes.luck.bankMax;
    this.attributes.luck.value = Math.clamp(this.attributes.luck.value, 0, this.attributes.luck.bankMax);

    // Ability Points: one per Character Level, spent on Archetype Tree nodes (p.30).
    const spent = actor.itemTypes.ability?.filter(i => i.system.tree).length ?? 0;
    this.attributes.abilityPoints = {
      total: this.attributes.level.value,
      spent,
      available: this.attributes.level.value - spent
    };

    super.prepareDerivedData();
  }

  /**
   * Work out which Nightmare Mode lifeline penalties are active.
   * @protected
   */
  _prepareNightmare() {
    const quarters = this.lifelineQuarters;
    this.penalties = { weakened: false, limping: false, trauma: false, dead: false };
    if ( game.settings.get("shiver", "modeOfPlay") !== "nightmare" ) return;
    const wounds = this.wounds;
    for ( const [i, key] of CONFIG.shiver.lifelineQuarters.entries() ) {
      if ( wounds >= quarters[i] ) this.penalties[key] = true;
    }
    if ( this.penalties.weakened && this.abilities[this.nightmare.weakened] ) {
      this.abilities[this.nightmare.weakened].skill.bonus -= 1;
    }
    if ( this.penalties.trauma && this.abilities[this.nightmare.traumaSkill] ) {
      this.abilities[this.nightmare.traumaSkill].talent.bonus -= 1;
    }
  }

  /**
   * Has Nightmare Mode Trauma taken away this ability (p.15)? Worked out from wounds directly, because item rules are
   * read before the penalties are prepared.
   * @param {string} itemId
   * @returns {boolean}
   */
  lostToTrauma(itemId) {
    if ( !itemId || (this.nightmare?.traumaAbility !== itemId) ) return false;
    if ( game.settings.get("shiver", "modeOfPlay") !== "nightmare" ) return false;
    return this.wounds >= this.lifelineQuarters[2];
  }

  /** @override */
  _prepareSpeedOverrides() {
    if ( this.penalties?.limping ) this.speed.value = "slow";
  }

  /**
   * The wound counts at which each quarter of the Lifeline is filled.
   * @type {number[]}
   */
  get lifelineQuarters() {
    const max = this.hp.max || CONFIG.shiver.lifelineLength;
    return [1, 2, 3, 4].map(q => Math.round((max * q) / 4));
  }
}

/* -------------------------------------------- */

/**
 * Data for enemies and other non-player characters (p.161-168). Enemies have no Talent Dice (p.168).
 */
export class NpcData extends ShiverActorData {

  /** @override */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      type: new StringField({ initial: "" }),
      deathcon: new StringField({ initial: "amber" }),
      reaction: new StringField({ initial: "bruiser" }),
      reactions: new SchemaField(Object.fromEntries([1, 2, 3, 4, 5, 6].map(f => [f, new StringField({ initial: "" })]))),
      combatState: new StringField({ initial: "middle", choices: () => Object.fromEntries(
        Object.entries(CONFIG.shiver.combatStates).map(([k, v]) => [k, v.label])) }),
      extraActions: new SchemaField({
        move: numberField(0),
        attack: numberField(0),
        interact: numberField(0)
      }),
      ally: new BooleanField({ initial: false }),
      description: new HTMLField({ initial: "" }),
      skills: new SchemaField(SKILL_KEYS.reduce((skills, key) => {
        skills[key] = new SchemaField({
          value: numberField(3),
          talent: numberField(0)
        });
        return skills;
      }, {}))
    };
  }

  /** @inheritDoc */
  static migrateData(source) {
    // Older NPCs stored their rating colour name and free-text damage modifiers.
    if ( source.rating?.name && !source.deathcon ) source.deathcon = String(source.rating.name).toLowerCase();
    delete source.rating;
    if ( typeof source.reaction === "string" ) source.reaction = source.reaction.toLowerCase();
    for ( const [key, notes] of [["immunity", "immuneNotes"], ["resistance", "resistantNotes"], ["weakness", "weakNotes"]] ) {
      if ( typeof source[key] === "string" ) {
        source.damage ??= {};
        if ( source[key] !== "None" ) source.damage[notes] ??= source[key];
        delete source[key];
      }
    }
    return super.migrateData(source);
  }

  /** @inheritDoc */
  prepareBaseData() {
    super.prepareBaseData();
    for ( const skill of Object.values(this.skills) ) {
      skill.total = skill.value;
      skill.talentTotal = skill.talent;
    }
  }
}
