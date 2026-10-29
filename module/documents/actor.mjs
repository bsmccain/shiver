import { asGM } from "../socket.mjs";

/**
 * The SHIVER Actor document.
 * @extends {Actor}
 */
export class shiverActor extends Actor {

  /** @inheritDoc */
  prepareData() {
    this._rules = null;
    super.prepareData();
  }

  /* -------------------------------------------- */
  /*  Rules                                       */
  /* -------------------------------------------- */

  /**
   * Every automation rule granted by this actor's active items (abilities, backgrounds, flaws, equipped gear).
   * @returns {object[]}  Rules with an `item` property pointing at their source.
   */
  automationRules() {
    if ( this._rules ) return this._rules;
    const rules = [];
    // Archetype-wide rules for the character's starting Archetype.
    const archetype = CONFIG.shiver.archetypes?.[this.system.attributes?.archetype];
    for ( const rule of archetype?.special ?? [] ) rules.push({ ...rule, label: rule.label ?? archetype.name });
    for ( const item of this.items ) {
      // A Background's Flaw keeps applying even when Trauma has taken its ability.
      for ( const rule of item.system?.flawAutomation ?? [] ) rules.push({ ...rule, item, flaw: true });
      if ( !item.system?.active ) continue;
      for ( const rule of item.system.automation ?? [] ) rules.push({ ...rule, item });
    }
    // Rules can also be granted by Active Effects through a flag.
    for ( const effect of this.appliedEffects ?? [] ) {
      for ( const rule of effect.flags?.shiver?.automation ?? [] ) rules.push({ ...rule, effect });
      // Infections apply the rules of every stage reached (p.192-194).
      if ( effect.statuses?.has("infected") ) {
        const infection = CONFIG.shiver.infections[effect.flags?.shiver?.infection ?? "other"];
        const stage = Number(effect.flags?.shiver?.value) || 0;
        for ( let i = 1; i <= stage; i++ ) {
          for ( const rule of infection?.stages?.[i] ?? [] ) rules.push({ ...rule, effect, label: game.i18n.localize(infection.label) });
        }
      }
    }
    return this._rules = rules;
  }

  /**
   * Rules of a particular kind.
   * @param {string} kind
   * @returns {object[]}
   */
  rulesOfKind(kind) {
    return this.automationRules().filter(r => r.kind === kind);
  }

  /**
   * The rule blocks of every status currently affecting this actor, with their values.
   * @type {object[]}
   */
  get statusRules() {
    const rules = [];
    for ( const effect of this.appliedEffects ?? [] ) {
      for ( const id of effect.statuses ) {
        const status = CONFIG.statusEffects.find(s => s.id === id);
        if ( !status ) continue;
        const v = Number(effect.flags?.shiver?.value);
        rules.push({ id, value: Number.isFinite(v) ? v : 1, effect, ...(status.flags?.shiver?.rules ?? {}) });
      }
    }
    return rules;
  }

  /**
   * Does this actor have a status?
   * @param {string} id
   * @returns {boolean}
   */
  hasStatus(id) {
    return this.statuses.has(id);
  }

  /**
   * The X of a valued status such as Bleed (X), or 0 when absent.
   * @param {string} id
   * @returns {number}
   */
  statusValue(id) {
    const effect = this.statusEffect(id);
    if ( !effect ) return 0;
    const v = Number(effect.flags?.shiver?.value);
    return Number.isFinite(v) ? v : 1;
  }

  /**
   * The Active Effect for a status.
   * @param {string} id
   * @returns {ActiveEffect|undefined}
   */
  statusEffect(id) {
    const status = CONFIG.statusEffects.find(s => s.id === id);
    return this.effects.get(status?._id) ?? this.effects.find(e => e.statuses.has(id));
  }

  /* -------------------------------------------- */

  /**
   * Apply a status, or raise its value. Valued statuses such as Bleed (X) keep the highest value
   * unless `stack` is set.
   * @param {string} id
   * @param {object} [options]
   * @param {number} [options.value]          X for a valued status
   * @param {boolean} [options.stack=false]   Add to an existing value rather than keeping the higher
   * @param {string} [options.origin]         The UUID of whatever applied the status
   * @param {object} [options.duration]       Active Effect duration data
   * @param {object} [options.flags]          Extra shiver flags (e.g. expiry bookkeeping)
   * @returns {Promise<ActiveEffect|undefined>}
   */
  async applyStatus(id, { value, stack = false, origin, duration, flags = {}, overlay = false } = {}) {
    if ( !this.isOwner ) return asGM("applyStatus", { uuid: this.uuid, id, value, stack, origin, duration, flags, overlay });
    const status = CONFIG.statusEffects.find(s => s.id === id);
    if ( !status ) throw new Error(`Unknown status ${id}`);
    const rules = status.flags?.shiver?.rules ?? {};
    // Status immunities (e.g. Immune: Fear, Burning).
    const immune = this.system.immunities;
    if ( immune?.has(id) || (rules.fear && immune?.has("fear")) ) return undefined;
    // Terrified already includes being Afraid (p.96).
    if ( (id === "afraid") && this.hasStatus("terrified") ) return this.statusEffect("terrified");
    const existing = this.statusEffect(id);
    if ( existing ) {
      // Re-applying a status never shortens it: a permanent application clears the old expiry, a timed one keeps it.
      const timed = ["expires", "expiresWith", "armed"];
      const newTimed = timed.some(k => k in flags) || !!duration;
      const oldTimed = timed.some(k => existing.flags?.shiver?.[k]) || Number.isFinite(existing.duration?.value);
      const keep = Object.fromEntries(Object.entries(flags).filter(([k]) => !timed.includes(k)));
      const update = { flags: { shiver: oldTimed && !newTimed ? { ...keep, "-=expires": null, "-=expiresWith": null, "-=armed": null } : keep } };
      if ( oldTimed && !newTimed ) update.duration = { value: null };
      if ( rules.valued && (value !== undefined) ) {
        const current = Number(existing.flags?.shiver?.value) || 1;
        update.flags.shiver.value = stack ? current + value : Math.max(current, value);
      }
      await existing.update(update);
      return existing;
    }
    const ActiveEffect = getDocumentClass("ActiveEffect");
    const effect = await ActiveEffect.fromStatusEffect(id, { parent: this });
    const data = effect.toObject();
    data.flags ??= {};
    data.flags.shiver = { ...(data.flags.shiver ?? {}), ...flags };
    if ( rules.valued ) data.flags.shiver.value = Math.max(rules.minValue ?? 1, Number.isFinite(Number(value)) && (value !== undefined) ? Number(value) : (rules.minValue ?? 1));
    if ( origin ) data.origin = origin;
    if ( duration ) data.duration = duration;
    if ( overlay ) foundry.utils.setProperty(data, "flags.core.overlay", true);
    return ActiveEffect.create(data, { parent: this, keepId: true });
  }

  /**
   * Remove a status.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async removeStatus(id) {
    if ( !this.isOwner ) return asGM("removeStatus", { uuid: this.uuid, id });
    const effect = this.statusEffect(id);
    if ( !effect ) return;
    try {
      await effect.delete();
    } catch(err) {
      // Already removed by another client or hook.
      if ( this.effects.has(effect.id) ) throw err;
    }
  }

  /* -------------------------------------------- */
  /*  Fear                                        */
  /* -------------------------------------------- */

  /**
   * Fear Status: 0 Stable, 1 Afraid, 2 Terrified (p.96).
   * @type {number}
   */
  get fearLevel() {
    if ( this.statuses.has("terrified") ) return 2;
    if ( this.statuses.has("afraid") ) return 1;
    return 0;
  }

  /**
   * Set the Fear Status.
   * @param {number} level  0 Stable, 1 Afraid, 2 Terrified
   */
  async setFearLevel(level) {
    level = Math.clamp(Number(level) || 0, 0, 2);
    if ( level === this.fearLevel ) return;
    if ( !this.isOwner ) return asGM("setFear", { uuid: this.uuid, level });
    if ( level === 2 ) {
      await this.removeStatus("afraid");
      await this.applyStatus("terrified");
    }
    else if ( level === 1 ) {
      await this.removeStatus("terrified");
      await this.applyStatus("afraid");
    }
    else {
      await this.removeStatus("afraid");
      await this.removeStatus("terrified");
    }
  }

  /**
   * Move the Fear Status by a number of steps: positive is more afraid.
   * @param {number} steps
   * @returns {Promise<{from: number, to: number}>}
   */
  async stepFear(steps) {
    const from = this.fearLevel;
    const to = Math.clamp(from + steps, 0, 2);
    await this.setFearLevel(to);
    return { from, to };
  }

  /* -------------------------------------------- */
  /*  Dice Pools                                  */
  /* -------------------------------------------- */

  /**
   * The Core Skill Points and Talent Points this actor rolls for a skill.
   * @param {string} skill
   * @returns {{skill: number, talent: number}}
   */
  getPool(skill) {
    const s = this.system;
    if ( this.type === "character" ) {
      const a = s.abilities?.[skill];
      return { skill: a?.skill.total ?? 0, talent: a?.talent.total ?? 0 };
    }
    const n = s.skills?.[skill];
    return { skill: n?.total ?? n?.value ?? 0, talent: n?.talentTotal ?? n?.talent ?? 0 };
  }

  /**
   * The Luck Bank, for characters.
   * @type {{value: number, max: number}|null}
   */
  get luckBank() {
    if ( this.type !== "character" ) return null;
    const luck = this.system.attributes.luck;
    return { value: luck.value, max: luck.bankMax ?? luck.max ?? 1 };
  }

  /**
   * Bank Luck Points, up to the bank's size (p.20). Extra Luck Points are lost.
   * @param {number} n
   * @returns {Promise<number>}  The number actually banked.
   */
  async bankLuck(n) {
    const bank = this.luckBank;
    if ( !bank || (n <= 0) ) return 0;
    if ( this.rulesOfKind("noLuckBank").length ) return 0;
    const space = Math.max(0, bank.max - bank.value);
    const banked = Math.min(space, n);
    if ( banked ) await this._ownerUpdate({ "system.attributes.luck.value": bank.value + banked });
    return banked;
  }

  /**
   * Spend Luck Points from the bank.
   * @param {number} n
   * @returns {Promise<boolean>}
   */
  async spendLuck(n) {
    const bank = this.luckBank;
    if ( !bank || (n <= 0) ) return n <= 0;
    if ( bank.value < n ) return false;
    await this._ownerUpdate({ "system.attributes.luck.value": bank.value - n });
    return true;
  }

  /**
   * The actor's Challenge Rating, including Steeled, Weakened and similar effects (minimum 1).
   * @type {number}
   */
  get challengeRating() {
    return Math.max(1, this.system.cr?.value ?? this.system.cr?.base ?? 1);
  }

  /* -------------------------------------------- */
  /*  Health                                      */
  /* -------------------------------------------- */

  /**
   * Heal wounds. Cursed characters can't heal (p.219).
   * @param {number} amount
   * @param {object} [options]
   * @param {boolean} [options.chat=true]
   * @returns {Promise<number>}  Wounds healed.
   */
  async heal(amount, { chat = true, source = "" } = {}) {
    amount = Math.max(0, Math.floor(amount));
    if ( !amount ) return 0;
    if ( !this.isOwner ) return asGM("heal", { uuid: this.uuid, amount, chat, source });
    if ( this.statusRules.some(r => r.noHealing) ) {
      ui.notifications.warn(game.i18n.format("shiver.Warn.Cursed", { name: this.name }));
      return 0;
    }
    const { value, max } = this.system.hp;
    const healed = Math.min(amount, max - value);
    if ( !healed ) return 0;
    // Coming back from 0 swaps Death's Door for Unconscious in _onHealthChange.
    await this.update({ "system.hp.value": value + healed }, { shiverHeal: true });
    if ( chat ) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `<div class="shiver-card shiver-heal"><i class="fa-solid fa-heart-pulse"></i> ${
          game.i18n.format("shiver.Heal.healed", { name: this.name, amount: healed })}${source ? ` <span class="reason">(${source})</span>` : ""}</div>`
      });
    }
    return healed;
  }

  /**
   * Update this actor as its owner, or through the GM.
   * @param {object} changes
   * @param {object} [options]
   * @protected
   */
  async _ownerUpdate(changes, options = {}) {
    if ( this.isOwner ) return this.update(changes, options);
    return asGM("updateActor", { uuid: this.uuid, changes, options });
  }

  /* -------------------------------------------- */
  /*  Events                                      */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    if ( (await super._preUpdate(changes, options, user)) === false ) return false;

    // Health can't go beyond the ends of the Lifeline.
    const hp = foundry.utils.getProperty(changes, "system.hp.value");
    if ( typeof hp === "number" ) {
      const max = foundry.utils.getProperty(changes, "system.hp.max") ?? this.system.hp.max;
      foundry.utils.setProperty(changes, "system.hp.value", Math.clamp(Math.round(hp), 0, max));
      options.shiverHpBefore = this.system.hp.value;
    }
    // Cursed characters can't heal.
    if ( (typeof hp === "number") && (hp > this.system.hp.value) && !options.shiverAllowHeal
      && this.statusRules?.some(r => r.noHealing) && !options.shiverHeal ) {
      foundry.utils.setProperty(changes, "system.hp.value", this.system.hp.value);
      ui.notifications.warn(game.i18n.format("shiver.Warn.Cursed", { name: this.name }));
    }
  }

  /** @inheritDoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    // "Import Data" with a pre-1.0 character replaces the actor through an update (without hooks): migrate its Fear.
    if ( game.user.isActiveGM && (changed.system?.legacyFearLevel > 0) ) {
      migrateLegacyFear(this).catch(err => console.error("SHIVER | Fear migration failed", this.name, err));
    }
    if ( (userId !== game.user.id) || !("shiverHpBefore" in options) ) return;
    const before = options.shiverHpBefore;
    const after = this.system.hp.value;
    if ( before === after ) return;
    this._onHealthChange(before, after, options);
  }

  /**
   * React to a change in health: Death's Door, death, and Nightmare Mode penalties (p.15).
   * @param {number} before
   * @param {number} after
   * @param {object} options
   * @protected
   */
  async _onHealthChange(before, after, options) {
    if ( this.type === "npc" ) {
      if ( (after === 0) && (before > 0) && !this.hasStatus("dead") ) {
        await this.applyStatus("dead", { overlay: true });
      }
      else if ( (after > 0) && this.hasStatus("dead") ) await this.removeStatus("dead");
      return;
    }
    const mode = game.settings.get("shiver", "modeOfPlay");
    if ( (after === 0) && (before > 0) ) {
      if ( mode === "nightmare" ) await this._onDeath();
      else if ( !this.hasStatus("deathsDoor") && !this.hasStatus("dead") ) {
        await this.applyStatus("deathsDoor");
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          content: `<div class="shiver-card shiver-deaths-door"><h3><i class="fa-solid fa-skull-crossbones"></i> ${
            game.i18n.localize("shiver.Status.deathsDoor")}</h3><p>${game.i18n.format("shiver.Death.door", { name: this.name })}</p>
            <div class="card-buttons"><button type="button" data-shiver-action="deathsDoorRoll" data-actor-uuid="${this.uuid}">
            <i class="fa-solid fa-clover"></i> ${game.i18n.localize("shiver.Death.rollLuck")}</button>
            <button type="button" data-shiver-action="stabilise" data-actor-uuid="${this.uuid}">
            <i class="fa-solid fa-kit-medical"></i> ${game.i18n.localize("shiver.Death.stabilise")}</button></div></div>`
        });
      }
    }
    if ( (after > 0) && (before === 0) ) {
      if ( this.hasStatus("deathsDoor") ) {
        await this.removeStatus("deathsDoor");
        await this.applyStatus("unconscious");
      }
    }

    // Nightmare Mode: penalties when a quarter of the Lifeline fills (p.15). Reaching 0 is handled above.
    if ( (mode === "nightmare") && (after > 0) ) {
      const quarters = this.system.lifelineQuarters;
      const woundsBefore = this.system.hp.max - before;
      const woundsAfter = this.system.hp.max - after;
      for ( const [i, key] of CONFIG.shiver.lifelineQuarters.entries() ) {
        const t = quarters[i];
        if ( (woundsBefore < t) && (woundsAfter >= t) ) await this._onNightmareQuarter(key);
      }
    }
  }

  /**
   * The character dies (Nightmare Mode at 16 wounds, a failed Death's Door roll, etc.).
   * @protected
   */
  async _onDeath() {
    await this.removeStatus("deathsDoor");
    await this.applyStatus("dead", { overlay: true });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<div class="shiver-card shiver-dead"><h3><i class="fa-solid fa-skull"></i> ${
        game.i18n.localize("shiver.Status.dead")}</h3><p>${game.i18n.format("shiver.Death.dead", { name: this.name })}</p></div>`
    });
  }

  /**
   * Prompt for a Nightmare Mode lifeline penalty (Weakened: choose a skill; Trauma: choose a talent or an ability).
   * @param {string} key
   * @protected
   */
  async _onNightmareQuarter(key) {
    if ( key === "dead" ) return this._onDeath();
    // Let the character's player make the choice when they're online.
    const owner = game.users.find(u => u.active && !u.isGM && this.testUserPermission(u, "OWNER"));
    if ( owner && !owner.isSelf && ["weakened", "trauma"].includes(key) ) {
      try {
        return await owner.query("shiver.nightmareQuarter", { uuid: this.uuid, key }, { timeout: 120000 });
      } catch(err) {
        console.warn("SHIVER | Nightmare prompt fell back to this user", err);
      }
    }
    let detail = "";
    if ( key === "weakened" && !this.system.nightmare.weakened ) {
      const skill = await promptSkill(this, "shiver.Nightmare.weakenedPrompt",
        Object.keys(CONFIG.shiver.skills).filter(k => this.system.abilities[k].skill.total > 0));
      if ( skill ) {
        await this.update({ "system.nightmare.weakened": skill });
        detail = game.i18n.localize(CONFIG.shiver.skills[skill].label);
      }
    }
    if ( key === "trauma" && !this.system.nightmare.traumaSkill && !this.system.nightmare.traumaAbility ) {
      // Trauma: lose a Talent Point in a skill that has one, or lose the use of an ability (p.15).
      const options = Object.keys(CONFIG.shiver.skills).filter(k => this.system.abilities[k].talent.total > 0);
      const abilities = this.items.filter(i => ["ability", "background"].includes(i.type));
      let choice = options.length ? await promptSkill(this, "shiver.Nightmare.traumaPrompt", options, abilities.length > 0) : "__ability__";
      if ( choice && (choice !== "__ability__") ) {
        await this.update({ "system.nightmare.traumaSkill": choice });
        detail = game.i18n.localize(CONFIG.shiver.skills[choice].label);
      }
      else if ( abilities.length ) {
        const id = await foundry.applications.api.DialogV2.prompt({
          window: { title: this.name },
          content: `<p>${game.i18n.localize("shiver.Nightmare.traumaAbilityPrompt")}</p><div class="form-group"><select name="abilityId">${
            abilities.map(i => `<option value="${i.id}">${foundry.utils.escapeHTML(i.name)}</option>`).join("")}</select></div>`,
          ok: { callback: (event, button) => button.form.elements.namedItem("abilityId")?.value ?? null },
          rejectClose: false
        });
        const item = this.items.get(id);
        if ( item ) {
          await this.update({ "system.nightmare.traumaAbility": item.id });
          detail = game.i18n.format("shiver.Nightmare.abilityLost", { name: item.name });
        }
      }
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<div class="shiver-card shiver-nightmare"><h3>${game.i18n.localize(`shiver.Nightmare.${key}`)}</h3>
        <p>${game.i18n.localize(`shiver.Nightmare.${key}Hint`)}${detail ? ` <strong>${detail}</strong>` : ""}</p></div>`
    });
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    if ( (await super._preCreate(data, options, user)) === false ) return false;
    const updates = {};
    if ( this.type === "character" ) {
      updates["prototypeToken.actorLink"] = true;
      updates["prototypeToken.disposition"] = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
      if ( !foundry.utils.hasProperty(data, "system.attributes.level.value") ) {
        updates["system.attributes.level.value"] = game.settings.get("shiver", "storyLevel");
      }
    }
    else {
      updates["prototypeToken.disposition"] = CONST.TOKEN_DISPOSITIONS.HOSTILE;
    }
    updates["prototypeToken.bar1.attribute"] = "hp";
    this.updateSource(updates);
  }

  /* -------------------------------------------- */

  /**
   * Roll data for formulas in descriptions.
   * @override
   */
  getRollData() {
    const data = { ...super.getRollData() };
    if ( this.type === "character" ) {
      for ( const [k, v] of Object.entries(data.abilities ?? {}) ) {
        data[`${k}-skill`] = v.skill.total ?? v.skill.value;
        data[`${k}-talent`] = v.talent.total ?? v.talent.value;
      }
      data.lvl = data.attributes?.level?.value ?? 0;
    }
    data.cr = this.challengeRating;
    return data;
  }
}

/* -------------------------------------------- */

/**
 * Ask the owner of an actor to pick a Core Skill.
 * @param {Actor} actor
 * @param {string} prompt        Localization key
 * @param {string[]} skills      Allowed skill keys
 * @param {boolean} [allowNone]  Offer a "none" option
 * @returns {Promise<string|null>}
 */
async function promptSkill(actor, prompt, skills, allowNone = false) {
  if ( !skills.length ) return null;
  const options = skills.map(k => `<option value="${k}">${game.i18n.localize(CONFIG.shiver.skills[k].label)}</option>`);
  if ( allowNone ) options.push(`<option value="__ability__">${game.i18n.localize("shiver.Nightmare.loseAbility")}</option>`);
  const value = await foundry.applications.api.DialogV2.prompt({
    window: { title: actor.name },
    content: `<p>${game.i18n.localize(prompt)}</p><div class="form-group"><select name="skill">${options.join("")}</select></div>`,
    ok: { callback: (event, button) => button.form.elements.skill.value || "__none__" },
    rejectClose: false
  });
  return ((value === "__none__") || !value) ? null : value;
}

/* -------------------------------------------- */

/**
 * Turn a fear level saved before 1.0 into the Afraid or Terrified status, once. Runs on the active GM's client when
 * the world loads, and when an old actor is created or imported over an existing one.
 * @param {Actor} actor
 * @returns {Promise<void>}
 */
export async function migrateLegacyFear(actor) {
  const level = actor.system?.legacyFearLevel;
  if ( !Number.isInteger(level) || (level <= 0) ) return;
  if ( actor.fearLevel < level ) await actor.setFearLevel(level);
  // 0 marks it done, so the old field still in the database isn't converted again.
  await actor.update({ "system.legacyFearLevel": 0 });
}
