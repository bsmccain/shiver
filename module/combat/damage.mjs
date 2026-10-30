import { damageMultiplier, evaluatePool, modifyDamageForType, resolveArmour, SKILL_DIE_FACES } from "../dice/pool.mjs";
import { facesOf, rollDice, ShiverCheck } from "../dice/check.mjs";
import { DoomClock } from "../doom/doom-clock.mjs";
import { asGM, authorControls, boundedInt, canControl, GMOperationRefused, registerGMOperation, requireControl, resolveActor, serialize,
  shortText, waitFor } from "../socket.mjs";
import { ruleApplies } from "../rules/automation.mjs";
import { statusDuration, statusFlags, statusId } from "../gm-ops.mjs";

/**
 * @typedef DamageInput
 * @property {number} amount              Damage before the target's modifiers
 * @property {string} [type="blunt"]      Damage type (p.131)
 * @property {boolean} [strike=false]     Was this a Strike/attack hit? Only attacks trigger armour, Tough and Lifesaver
 * @property {boolean} [ignoreArmour]     Skip armour rolls (Pierce, Soul, Corrosive, Piercer)
 * @property {boolean} [ranged]           A ranged attack (for Bulletproof)
 * @property {string} [material]          Weapon material, e.g. "silver", matched against Weaknesses
 * @property {string} [source]            Name of the source for the chat card
 * @property {string} [attackerUuid]
 */

/**
 * Apply damage to an actor and report each step. Order (the rules don't fix one, see armour spec A-08):
 * 1. Immune / Resistant / Weakness for the damage type, material and ranged category (p.23)
 * 2. Corrosive damage hits armour first; Pierce, Soul and Corrosive skip armour rolls (p.131)
 * 3. Armour rolls, one Skill Die per Armour Slot with HP (p.15)
 * 4. Damage reduction rolls from abilities such as Tough (p.32)
 * 5. Lifesaver armour, then wounds on the Lifeline
 * @param {Actor} actor
 * @param {DamageInput} input
 * @returns {Promise<object>}  A report of what happened.
 */
export async function receiveDamage(actor, input) {
  const type = input.type ?? "blunt";
  const typeCfg = CONFIG.shiver.damageTypes[type] ?? {};
  const report = { actorUuid: actor.uuid, name: actor.name, initial: Math.max(0, Math.floor(input.amount)), type, steps: [], rolls: [] };
  let amount = report.initial;
  const sys = actor.system;

  // 1. Damage modifiers.
  const keys = [type, input.material, input.ranged ? "ranged" : null].filter(Boolean);
  const immune = keys.some(k => sys.immunities?.has(k));
  const resistant = keys.some(k => sys.resistances?.has(k));
  const weak = keys.some(k => sys.weaknesses?.has(k));
  if ( immune || resistant || weak ) {
    const before = amount;
    amount = modifyDamageForType(amount, { immune, resistant, weak });
    report.steps.push({ key: immune ? "immune" : (resistant && weak ? "resistWeak" : (resistant ? "resistant" : "weak")), before, after: amount });
  }

  // Only armour within the character's Armour Slots protects them (p.15, p.128).
  let capacity = (actor.type === "character") ? (actor.system.slots?.armour ?? 3) : Infinity;
  const armour = [];
  for ( const a of actor.itemTypes.armour ?? [] ) {
    if ( !a.system.equipped ) continue;
    if ( a.system.slots > capacity ) break;
    capacity -= a.system.slots;
    if ( (a.system.hp.value > 0) || a.system.unbreakable ) armour.push(a);
  }
  const armourUpdates = new Map();
  const slotHp = item => armourUpdates.get(item.id) ?? [...item.system.slotHp];

  // 2. Corrosive damage is dealt to armour first (p.131).
  if ( typeCfg.corrodesArmour && armour.length && amount > 0 && input.strike ) {
    let absorbed = 0;
    for ( const item of armour ) {
      const hp = slotHp(item);
      for ( let i = 0; (i < hp.length) && (amount > 0); i++ ) {
        const take = Math.min(hp[i], amount);
        hp[i] -= take;
        amount -= take;
        absorbed += take;
      }
      armourUpdates.set(item.id, hp);
    }
    if ( absorbed ) report.steps.push({ key: "corroded", before: amount + absorbed, after: amount, absorbed });
  }

  // 3. Armour rolls.
  const ignoreArmour = input.ignoreArmour || typeCfg.ignoresArmour;
  if ( input.strike && !ignoreArmour && armour.length ) {
    const slots = [];
    for ( const item of armour ) {
      const hp = slotHp(item);
      hp.forEach((v, i) => { if ( v > 0 ) slots.push({ id: `${item.id}.${i}`, itemId: item.id, hp: v, name: item.name }); });
    }
    if ( slots.length ) {
      const roll = await new Roll(`${slots.length}ds`).evaluate();
      report.rolls.push(roll);
      const faces = facesOf(roll).d6;
      const before = amount;
      const res = resolveArmour(amount, slots, faces);
      amount = res.damage;
      for ( const r of res.rolls ) {
        const slot = slots.find(s => s.id === r.id);
        r.name = slot?.name;
        if ( r.wound ) {
          const item = actor.items.get(slot.itemId);
          const hp = slotHp(item);
          // Armour takes damage one slot at a time (p.151).
          const idx = hp.findIndex(v => v > 0);
          if ( idx >= 0 ) hp[idx] -= 1;
          armourUpdates.set(item.id, hp);
        }
      }
      report.armour = res.rolls;
      report.steps.push({ key: "armour", before, after: amount });
    }
  }
  if ( armourUpdates.size ) {
    await actor.updateEmbeddedDocuments("Item", [...armourUpdates.entries()].map(([_id, hp]) => ({ _id, "system.slotHp": hp })));
  }

  // 4. Damage reduction rolls from abilities, like the Warrior's Tough (p.32).
  if ( input.strike && amount > 0 ) {
    const ctx = { tags: new Set(["hit", input.ranged ? "ranged" : "melee"]), actor };
    const reducers = actor.rulesOfKind("damageReductionRoll").filter(r => ruleApplies(r, ctx) !== false);
    if ( reducers.length ) {
      // Rules for the same ability stack their dice (e.g. Natural Toughness adds a die to Tough).
      // Unconditional dice add up (Tough + Natural Toughness); "set" rules replace that total (Iron Hide);
      // conditional dice (e.g. Primal Surge at 12+ wounds) are added on top, whatever order the items are in.
      let base = 0;
      let set = 0;
      let bonus = 0;
      let face = "grit";
      let reroll = false;
      const names = [];
      for ( const r of reducers ) {
        if ( r.set ) set = Math.max(set, Number(r.set) || 0);
        else if ( r.when && (typeof r.when === "object") ) bonus += Number(r.dice) || 0;
        else base += Number(r.dice) || 0;
        face = r.face ?? face;
        if ( r.reroll ) reroll = true;
        names.push(r.item?.name);
      }
      const dice = Math.max(base, set) + bonus;
      if ( dice > 0 ) {
        let roll = await new Roll(`${dice}ds`).evaluate();
        report.rolls.push(roll);
        let faces = facesOf(roll).d6;
        if ( reroll ) {
          const misses = faces.filter(f => SKILL_DIE_FACES[f] !== face).length;
          if ( misses ) {
            const again = await new Roll(`${misses}ds`).evaluate();
            report.rolls.push(again);
            faces = faces.filter(f => SKILL_DIE_FACES[f] === face).concat(facesOf(again).d6);
          }
        }
        const blocked = Math.min(amount, faces.filter(f => SKILL_DIE_FACES[f] === face).length);
        const before = amount;
        amount -= blocked;
        report.steps.push({ key: "reduction", label: [...new Set(names)].filter(Boolean).join(", "), before, after: amount, faces });
      }
    }
  }

  // 5. Lifesaver (Helmet, Mining Helmet): a Strike that would take you to 0 destroys the item instead (p.153-154).
  const hpBefore = sys.hp.value;
  let hpAfter = Math.max(0, hpBefore - amount);
  if ( input.strike && (hpBefore > 0) && (hpAfter === 0) && (amount > 0) && (actor.type === "character") ) {
    const saver = actor.items.find(i => i.system.active && i.system.automation?.some(r => r.kind === "lifesaver"));
    if ( saver ) {
      hpAfter = Math.min(hpBefore, 1) || 1;
      report.steps.push({ key: "lifesaver", label: saver.name, before: amount, after: hpBefore - hpAfter });
      amount = hpBefore - hpAfter;
      await saver.delete();
    }
  }

  // Abilities that grant actions for the rest of the encounter when a Strike hits you (e.g. the Warrior's Rage).
  if ( input.strike && (actor.type === "character") ) {
    for ( const r of actor.rulesOfKind("gainActionWhenHit") ) {
      const { combatantFor } = await import("./actions.mjs");
      const combatant = combatantFor(actor);
      if ( !combatant ) continue;
      const bonus = { ...(combatant.getFlag("shiver", "bonusActions") ?? {}) };
      const key = r.action ?? "attack";
      const next = Math.min(Number(r.max) || 99, (bonus[key] ?? 0) + (Number(r.amount) || 1));
      if ( next !== bonus[key] ) {
        bonus[key] = next;
        await combatant.setFlag("shiver", "bonusActions", bonus);
        report.steps.push({ key: "gainAction", label: r.item?.name ?? "", before: next, after: next });
      }
    }
  }

  report.final = amount;
  report.hpBefore = hpBefore;
  report.hpAfter = hpAfter;
  if ( amount > 0 ) await actor.update({ "system.hp.value": hpAfter }, { shiverDamage: true });
  return report;
}

/* -------------------------------------------- */

/**
 * GM operation: apply an attack check's damage to one of its targets (or to explicitly given tokens).
 * @param {object} data
 * @param {string} data.messageId
 * @param {number} [data.index]          Index into the check's targets
 * @param {string[]} [data.actorUuids]   Apply to these actors instead (untargeted attacks)
 */
async function applyAttackDamage(data) {
  return serialize(`check.${data.messageId}`, () => _applyAttackDamage(data));
}

async function _applyAttackDamage({ messageId, index, actorUuids }) {
  const message = await waitFor(() => game.messages.get(messageId));
  const state = foundry.utils.deepClone(message?.getFlag("shiver", "check"));
  if ( !state?.attack || !state.resolved ) return;
  const attack = state.attack;
  const attacker = state.actorUuid ? await fromUuid(state.actorUuid) : null;

  let entries = [];
  if ( Number.isInteger(index) ) {
    const t = attack.targets[index];
    if ( !t || t.applied ) return;
    entries.push({ target: t, actorUuid: t.actorUuid, outcome: t.outcome });
    t.applied = true;
  }
  else {
    // Each targeted token can only take an untargeted Strike's damage once.
    attack.appliedUuids ??= [];
    for ( const uuid of actorUuids ?? [] ) {
      if ( attack.appliedUuids.includes(uuid) ) continue;
      attack.appliedUuids.push(uuid);
      entries.push({ target: null, actorUuid: uuid, outcome: state.outcome });
    }
  }
  // Mark first, so a double click can't apply damage twice.
  await message.update({ "flags.shiver.check.attack": attack });

  for ( const entry of entries ) {
    const actor = (typeof entry.actorUuid === "string") ? await fromUuid(entry.actorUuid) : null;
    if ( (actor?.documentName !== "Actor") || actor.pack ) continue;
    await serialize(`actor.${actor.uuid}`, () => resolveHit({ attacker, actor, attack, outcome: entry.outcome, skill: state.skill, message }));
  }
  await message.update({ content: await ShiverCheck.renderCard({ ...state, attack: { ...attack } }), "flags.shiver.check": state });
}

/**
 * Resolve one successful Strike against one target.
 * @param {object} args
 */
export async function resolveHit({ attacker, actor, attack, outcome, skill, message }) {
  const mult = damageMultiplier(outcome);
  if ( !mult ) return;
  const isCrit = (outcome === "critical") || (outcome === "fullHouse");
  const crit = (isCrit && !attack.noCrit) ? CONFIG.shiver.criticalEffects[skill] : null;
  const notes = [];
  const extraRolls = [];

  // Luck Critical: roll the Luck pool, +1 damage per Luck symbol (p.24).
  let bonus = 0;
  if ( crit?.luckDamage && attacker ) {
    const pool = attacker.getPool("luck");
    const roll = await rollDice(pool.skill, pool.talent);
    extraRolls.push(roll);
    const faces = facesOf(roll);
    bonus = evaluatePool(faces.d6, faces.d8, ["luck"]).successes;
    notes.push(game.i18n.format("shiver.Crit.luckBonus", { n: bonus }));
  }

  // Enemy Reactions are rolled as the hit lands, before wounds, since some change the damage (p.26, p.163).
  if ( (actor.type === "npc") && game.settings.get("shiver", "autoReactions") ) await rollReaction(actor);

  let base = attack.damage ?? 0;
  if ( attack.stunMode ) base = 1;
  const amount = (base * mult) + bonus;
  const report = await receiveDamage(actor, {
    amount,
    type: attack.damageType,
    strike: true,
    ignoreArmour: attack.ignoreArmour,
    ranged: attack.ranged,
    material: attack.material,
    source: attack.itemName,
    attackerUuid: attacker?.uuid
  });
  report.rolls.unshift(...extraRolls);

  // Effects of the hit. These happen on a successful hit even when armour stops the damage (p.131).
  const effects = [];
  const saves = [];
  const typeCfg = CONFIG.shiver.damageTypes[attack.damageType] ?? {};
  const overrides = (attack.onHit ?? []).filter(r => r.kind === "saveOverride" && (!r.damageType || r.damageType === attack.damageType));
  if ( typeCfg.status && !attack.stunMode ) {
    let save = typeCfg.save ? { ...typeCfg.save } : null;
    let value = typeCfg.value;
    for ( const o of overrides ) {
      if ( save && o.cr ) save.cr = o.cr;
      if ( o.value ) value = o.value;
    }
    if ( typeCfg.rounds ) {
      effects.push({ status: typeCfg.status, value, duration: { value: typeCfg.rounds, units: "rounds", expiry: "turnStart" } });
    }
    else saves.push({ skill: save?.skill, cr: save?.cr, status: typeCfg.status, value, label: game.i18n.localize(typeCfg.label) });
  }
  if ( attack.stunMode ) effects.push({ status: "stunned", flags: { expires: "endOfNextTurn" } });

  // Weapon properties that act on a hit (Restrain, Weaken, Toxic, ...).
  for ( const r of attack.onHit ?? [] ) {
    if ( r.kind !== "onHit" ) continue;
    if ( r.damageType && (r.damageType !== attack.damageType) ) continue;
    const flags = {};
    let duration;
    if ( r.until === "attackerNextTurn" ) flags.expiresWith = { combatant: attacker?.uuid, event: "turnStart" };
    if ( r.until === "encounter" ) flags.expires = "combatEnd";
    if ( r.until === "endOfNextTurn" ) flags.expires = "endOfNextTurn";
    if ( r.rounds ) duration = { value: Number(r.rounds), units: "rounds", expiry: "turnStart" };
    if ( r.save ) saves.push({ skill: r.save.skill, cr: r.save.cr, status: r.status, value: r.value, fear: r.fear, flags, duration, label: r.label });
    else if ( r.status ) effects.push({ status: r.status, value: r.value, flags, duration });
    if ( r.heal && attacker ) {
      await attacker.heal(r.heal, { source: attack.itemName });
      notes.push(game.i18n.format("shiver.Heal.amount", { n: r.heal }));
    }
    if ( r.doom ) await DoomClock.tick(r.doom, { reason: attack.itemName, actorUuid: attacker?.uuid });
    if ( r.note ) notes.push(r.note);
  }

  // Critical effects (p.24).
  if ( crit?.status ) effects.push({ status: crit.status, value: crit.value });
  if ( crit?.selfStatus && attacker ) {
    await attacker.applyStatus(crit.selfStatus, { flags: { expires: "startOfNextTurn" } });
    notes.push(game.i18n.format("shiver.Crit.selfStatus", { name: attacker.name, status: game.i18n.localize(`shiver.Status.${crit.selfStatus}`) }));
  }
  if ( crit?.strikeAgain ) notes.push(game.i18n.localize("shiver.Crit.strikeAgainNote"));

  // Apply unconditional effects; saves for statuses. An enemy the hit killed suffers nothing more.
  const killed = (actor.type !== "character") && (actor.system.hp.value <= 0);
  if ( killed ) saves.length = 0;
  if ( !killed ) {
    for ( const e of effects ) {
      if ( actor.system.immunities?.has(e.status) ) continue;
      await actor.applyStatus(e.status, { value: e.value, duration: e.duration, flags: e.flags ?? {}, origin: attacker?.uuid });
      notes.push(game.i18n.format("shiver.Check.statusApplied", { status: game.i18n.localize(`shiver.Status.${e.status}`) }));
    }
  }

  // Post the damage report.
  const damageMessage = await postDamageReport(actor, report, { attack, outcome, notes, saves, attacker });

  // The target rolls its saves: enemies roll straight away, characters get buttons on the card.
  if ( actor.type !== "character" ) {
    for ( const s of saves ) await rollSave(actor, s, attacker);
  }

  return { report, damageMessage };
}

/**
 * Roll a save against a status for a target (enemies roll automatically with no dialog).
 * @param {Actor} actor
 * @param {object} save
 * @param {Actor} [attacker]
 */
export async function rollSave(actor, save, attacker, { auto = false } = {}) {
  if ( actor.system.immunities?.has(save.status) ) return;
  // An ability can make an enemy or another character roll a save. That roll isn't this user's to make, so the GM
  // rolls it.
  if ( !actor.isOwner ) return asGM("rollSave", { uuid: actor.uuid, save, attackerUuid: attacker?.uuid ?? null });
  if ( !save.skill ) {
    return actor.applyStatus(save.status, { value: save.value, flags: save.flags ?? {}, duration: save.duration });
  }
  const isNpc = actor.type !== "character";
  const opts = {
    actor,
    skill: save.skill,
    type: save.fear ? "fear" : "save",
    cr: save.cr,
    label: game.i18n.format("shiver.SaveCheck.title", { skill: game.i18n.localize(CONFIG.shiver.skills[save.skill].label), status: game.i18n.localize(`shiver.Status.${save.status}`) }),
    tags: ["save"],
    save: { status: save.status, value: save.value, flags: save.flags ?? {}, duration: save.duration, origin: attacker?.uuid },
    fear: save.fear ? { setAtLeast: save.status === "terrified" ? 2 : 1 } : null,
    skipDialog: isNpc || auto
  };
  return ShiverCheck.prompt(opts);
}

/**
 * Roll an enemy's Reaction (p.26, p.163): one Skill Die; the Deathcon level decides which faces react.
 * @param {Actor} actor
 */
export async function rollReaction(actor) {
  const roll = await new Roll("1ds").evaluate();
  const face = roll.dice[0].results[0].result;
  const symbol = SKILL_DIE_FACES[face];
  const deathcon = CONFIG.shiver.deathcon[actor.system.deathcon];
  const reacts = deathcon?.faces?.includes(symbol) ?? false;
  const custom = actor.system.reactions?.[face];
  const table = CONFIG.shiver.reactionTables[actor.system.reaction];
  const text = custom || table?.faces?.[face] || "";
  const reactionText = reacts || (custom && symbol === "luck") ? text : "";
  const content = await foundry.applications.handlebars.renderTemplate("systems/shiver/templates/chat/reaction-card.hbs", {
    actor, symbol, face,
    img: CONFIG.shiver.skills[symbol]?.icon,
    symbolLabel: game.i18n.localize(CONFIG.shiver.skills[symbol]?.label ?? ""),
    deathcon: deathcon ? game.i18n.localize(deathcon.label) : actor.system.deathcon,
    tableLabel: table ? game.i18n.localize(table.label) : "",
    reacts: !!reactionText,
    text: reactionText
  });
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll],
    whisper: game.users.filter(u => u.isGM).map(u => u.id),
    blind: false,
    flags: { shiver: { reaction: { face, symbol, reacts: !!reactionText } } }
  });
}

/**
 * Post a damage report card.
 * @param {Actor} actor
 * @param {object} report
 * @param {object} context
 */
export async function postDamageReport(actor, report, { attack, outcome, notes = [], saves = [], attacker } = {}) {
  const typeLabel = CONFIG.shiver.damageTypes[report.type] ? game.i18n.localize(CONFIG.shiver.damageTypes[report.type].label)
    : (CONFIG.statusEffects.find(s => s.id === report.type) ? game.i18n.localize(`shiver.Status.${report.type}`) : (report.type ?? ""));
  const steps = report.steps.map(s => ({
    ...s,
    text: game.i18n.format(`shiver.Damage.step.${s.key}`, { before: s.before, after: s.after, label: s.label ?? "", absorbed: s.absorbed ?? 0 })
  }));
  const armour = (report.armour ?? []).map(r => ({
    ...r, img: CONFIG.shiver.skills[r.symbol]?.icon,
    text: r.wound ? game.i18n.localize("shiver.Damage.armourWound") : (r.blocked ? game.i18n.localize("shiver.Damage.armourBlock") : "")
  }));
  const isPC = actor.type === "character";
  const content = await foundry.applications.handlebars.renderTemplate("systems/shiver/templates/chat/damage-card.hbs", {
    actor, report, typeLabel, steps, armour, notes,
    outcome: outcome ? game.i18n.localize(`shiver.Outcome.${outcome}`) : null,
    source: attack?.itemName ?? report.source,
    attacker: attacker?.name,
    saves: isPC ? saves.map((s, i) => ({ ...s, index: i, skillLabel: s.skill ? game.i18n.localize(CONFIG.shiver.skills[s.skill].label) : "",
      statusLabel: game.i18n.localize(`shiver.Status.${s.status}`) })) : [],
    hpText: game.i18n.format("shiver.Damage.hp", { value: report.hpAfter, max: actor.system.hp.max })
  });
  // Exact numbers for enemies are the Director's business (p.121).
  const whisper = (!isPC && game.settings.get("shiver", "hideEnemyDamage")) ? game.users.filter(u => u.isGM).map(u => u.id) : [];
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: report.rolls,
    whisper,
    flags: { shiver: { damage: { actorUuid: actor.uuid, saves: isPC ? saves : [], attackerUuid: attacker?.uuid ?? null } } }
  });
}

/* -------------------------------------------- */

/**
 * Ask for damage to be applied from an attack card.
 * @param {ChatMessage} message
 * @param {object} data
 */
export async function requestApplyDamage(message, data) {
  return asGM("applyAttackDamage", { messageId: message.id, ...data });
}

/**
 * Apply plain damage (e.g. Bleed, falling) through the GM.
 * @param {Actor} actor
 * @param {DamageInput} input
 */
export async function applyDamage(actor, input) {
  if ( !actor.isOwner ) return asGM("receiveDamage", { uuid: actor.uuid, input });
  const report = await receiveDamage(actor, input);
  await postDamageReport(actor, report, { notes: input.notes ?? [] });
  return report;
}

// Apply a Strike's damage from its card. The GM may always; a player only when the world lets players apply damage,
// for a card that the attacker's own player posted, and when they control the attacker or the target (p.22).
registerGMOperation("applyAttackDamage", async ({ messageId, index, actorUuids }, user) => {
  const message = await waitFor(() => game.messages.get(messageId));
  const state = message?.getFlag("shiver", "check");
  if ( !state?.attack ) throw new GMOperationRefused("That card isn't a Strike");
  const i = Number.isInteger(index) ? index : undefined;
  if ( !user.isGM ) {
    if ( !game.settings.get("shiver", "playersApplyDamage") ) throw new GMOperationRefused("Only the GM applies damage in this world");
    const attacker = state.actorUuid ? await fromUuid(state.actorUuid) : null;
    if ( !attacker || !authorControls(message, attacker) ) throw new GMOperationRefused("That Strike wasn't rolled by its attacker's player");
    const targetUuid = (i !== undefined) ? state.attack.targets?.[i]?.actorUuid : null;
    const target = targetUuid ? await fromUuid(targetUuid) : null;
    if ( !canControl(user, attacker) && !canControl(user, target) ) throw new GMOperationRefused("You don't control the attacker or the target");
  }
  const uuids = Array.isArray(actorUuids) ? actorUuids.filter(u => typeof u === "string").slice(0, 50) : undefined;
  return applyAttackDamage({ messageId: message.id, index: i, actorUuids: uuids });
});

// Plain damage from a rule (an ability's damage, Bleed, a fall). The input is checked: a bounded amount of a known
// damage type, with no other options. Damage to a character the sender doesn't control comes from an ability's rule
// (the book's largest deals 5), and only when the world lets players apply damage.
registerGMOperation("receiveDamage", async ({ uuid, input }, user) => {
  const actor = await resolveActor(uuid);
  const clean = damageInput(input);
  if ( !canControl(user, actor) ) {
    if ( !game.settings.get("shiver", "playersApplyDamage") ) throw new GMOperationRefused("Only the GM applies damage in this world");
    if ( clean.amount > 10 ) throw new GMOperationRefused(`Too much damage for an ability: ${clean.amount}`);
  }
  return serialize(`actor.${actor.uuid}`, async () => {
    const report = await receiveDamage(actor, clean);
    await postDamageReport(actor, report, { notes: clean.notes });
    return report;
  });
});

/**
 * A plain damage request, keeping only the fields receiveDamage reads.
 * @param {object} input
 * @returns {DamageInput}
 */
function damageInput(input = {}) {
  const type = (typeof input.type === "string") && (input.type in CONFIG.shiver.damageTypes) ? input.type : "blunt";
  return {
    amount: boundedInt(Math.floor(Number(input.amount) || 0), 0, 1000, "damage"),
    type,
    strike: input.strike === true,
    ranged: input.ranged === true,
    ignoreArmour: input.ignoreArmour === true,
    material: shortText(input.material) || undefined,
    source: shortText(input.source) || undefined,
    attackerUuid: shortText(input.attackerUuid) || undefined,
    notes: Array.isArray(input.notes) ? input.notes.filter(n => typeof n === "string").slice(0, 5).map(n => n.slice(0, 200)) : []
  };
}

// A save a player's ability forces on an actor they don't own, rolled by the GM from checked data.
registerGMOperation("rollSave", async ({ uuid, save, attackerUuid }) => {
  const actor = await resolveActor(uuid);
  const attacker = (typeof attackerUuid === "string") ? await fromUuid(attackerUuid) : null;
  const message = await rollSave(actor, saveRequest(save), (attacker?.documentName === "Actor") ? attacker : null, { auto: true });
  return message?.id ?? null;
});

/**
 * A save from a request: a known status and skill, a bounded CR and value, and filtered flags and duration.
 * @param {object} save
 * @returns {object}
 */
function saveRequest(save = {}) {
  return {
    status: statusId(save.status),
    skill: (typeof save.skill === "string") && (save.skill in CONFIG.shiver.skills) ? save.skill : "grit",
    cr: boundedInt(save.cr ?? 1, 1, 10, "CR"),
    value: (save.value === undefined) || (save.value === null) ? undefined : boundedInt(save.value, 0, 20, "status value"),
    flags: statusFlags(save.flags),
    duration: statusDuration(save.duration),
    fear: save.fear === true
  };
}

// A save on a damage card can only be rolled once.
registerGMOperation("claimSave", async ({ messageId, index }, user) => serialize(`check.${messageId}`, async () => {
  const message = game.messages.get(messageId);
  const dmg = message?.getFlag("shiver", "damage");
  if ( !dmg ) return false;
  await requireSaveOwner(dmg, user);
  const rolled = dmg.rolledSaves ?? [];
  if ( rolled.includes(index) ) return false;
  await message.update({ "flags.shiver.damage.rolledSaves": [...rolled, index] });
  return true;
}));

// A save whose roll didn't happen (its dialog was cancelled) can be rolled again.
registerGMOperation("releaseSave", async ({ messageId, index }, user) => serialize(`check.${messageId}`, async () => {
  const message = game.messages.get(messageId);
  const dmg = message?.getFlag("shiver", "damage");
  if ( !dmg ) return false;
  await requireSaveOwner(dmg, user);
  const rolled = dmg.rolledSaves ?? [];
  if ( rolled.includes(index) ) await message.update({ "flags.shiver.damage.rolledSaves": rolled.filter(i => i !== index) });
  return true;
}));

/**
 * Only the damaged character's players (or a GM) roll the saves on its damage card.
 * @param {object} dmg   The card's damage flags
 * @param {User} user
 */
async function requireSaveOwner(dmg, user) {
  const actor = dmg.actorUuid ? await fromUuid(dmg.actorUuid) : null;
  requireControl(user, actor);
}
