import { buildPool } from "./pool.mjs";
import { describeWhen, ruleApplies, skillMatches } from "../rules/automation.mjs";

const { DialogV2 } = foundry.applications.api;

/**
 * @typedef CheckOptions
 * @property {Actor} [actor]           The actor rolling (optional for a bare pool roll)
 * @property {string} skill            The Core Skill rolled
 * @property {string} [type="check"]   check | attack | fear | deathsDoor | save | removal | stabilise | luckCrit
 * @property {string} [label]          Title for the chat card
 * @property {number|null} [cr]        Challenge Rating, null when the Director will set it
 * @property {boolean} [crHidden]      Hide the Challenge Rating from players
 * @property {string[]} [tags]         Context tags for ability rules (see CHECK_TAGS)
 * @property {string[]} [combined]     Extra skills whose symbols also count (Combined Skill Check, p.12)
 * @property {object} [attack]         Attack details, for Strikes
 * @property {object} [extra]          Extra state to carry onto the chat card
 * @property {number} [minorAdvantage] Pre-set advantage counts
 * @property {number} [majorAdvantage]
 * @property {number} [minorDisadvantage]
 * @property {number} [majorDisadvantage]
 * @property {boolean} [skipDialog]    Roll straight away with defaults
 */

/**
 * Gather everything that can change a Dice Pool for this check, as described on p.11.
 * @param {CheckOptions} options
 * @returns {object}
 */
export function prepareCheckContext(options) {
  const actor = options.actor ?? null;
  const skill = options.skill;
  const tags = new Set(["check", skill, ...(options.tags ?? [])]);
  if ( options.type === "attack" ) tags.add("attack");
  if ( options.type === "fear" ) tags.add("fear");
  const base = actor ? actor.getPool(skill) : { skill: 0, talent: 0 };

  // Abilities that add dice (step 3) or count other symbols.
  const bonuses = [];
  const faces = [];
  const caps = [];
  const autoFailOptions = [];
  let autoFail = null;
  for ( const rule of actor?.automationRules() ?? [] ) {
    if ( rule.kind === "poolDice" ) {
      if ( !skillMatches(rule, skill) ) continue;
      const applies = ruleApplies(rule, { tags, actor });
      if ( applies === false ) continue;
      bonuses.push({
        id: foundry.utils.randomID(), label: rule.label ?? rule.item?.name ?? rule.effect?.name ?? "",
        when: describeWhen(rule), d6: Number(rule.d6) || 0, d8: Number(rule.d8) || 0, checked: applies === true
      });
    }
    else if ( rule.kind === "extraSuccessFaces" ) {
      if ( !skillMatches({ skill: rule.rollSkill ?? rule.skill ?? "any" }, skill) ) continue;
      const applies = ruleApplies(rule, { tags, actor });
      if ( applies === false ) continue;
      faces.push({
        id: foundry.utils.randomID(), label: rule.label ?? rule.item?.name ?? "", when: describeWhen(rule),
        countsAs: [].concat(rule.countsAs ?? []), checked: applies === true
      });
    }
    else if ( rule.kind === "poolCap" ) {
      if ( !skillMatches(rule, skill) ) continue;
      if ( ruleApplies(rule, { tags, actor }) !== true ) continue;
      caps.push({ label: rule.item?.name ?? "", d6: Number(rule.d6) || 1, total: rule.total });
    }
    else if ( rule.kind === "autoFail" ) {
      if ( !skillMatches(rule, skill) ) continue;
      const applies = ruleApplies(rule, { tags, actor });
      if ( applies === true ) autoFail = rule.item?.name ?? rule.label ?? "";
      else if ( applies === null ) {
        autoFailOptions.push({ id: foundry.utils.randomID(), label: rule.item?.name ?? rule.label ?? "", when: describeWhen(rule) });
      }
    }
  }

  // Status penalties (Prone, Blinded) and Fear Status (step 6).
  const penalties = [];
  let fear = 0;
  for ( const r of actor?.statusRules ?? [] ) {
    if ( r.fear ) fear = Math.max(fear, r.fear);
    else if ( r.pool && ((r.pool.scope === "all") || tags.has(r.pool.scope)) ) {
      penalties.push({ id: r.id, label: game.i18n.localize(`shiver.Status.${r.id}`), d6: r.pool.d6 ?? 0, d8: r.pool.d8 ?? 0, checked: true });
    }
    if ( r.failsSight && tags.has("sight") ) autoFail = game.i18n.localize(`shiver.Status.${r.id}`);
  }

  // Attacks get Minor Advantage against Prone targets and Major Advantage from Stealth (p.27, p.219).
  let minorAdvantage = options.minorAdvantage ?? 0;
  let majorAdvantage = options.majorAdvantage ?? 0;
  const notes = [];
  if ( options.type === "attack" ) {
    const targets = options.attack?.targets ?? [];
    const target = targets.length === 1 ? fromUuidSync(targets[0].actorUuid) : null;
    for ( const r of target?.statusRules ?? [] ) {
      // Vengeance helps only the enemy that holds it (its origin), when one is recorded.
      if ( (r.id === "vengeance") && r.effect?.origin && actor && !r.effect.origin.endsWith(actor.id) && (r.effect.origin !== actor.uuid) ) continue;
      if ( r.attackersPool?.d6 ) {
        minorAdvantage += r.attackersPool.d6;
        notes.push(game.i18n.format("shiver.Check.targetStatus", { status: game.i18n.localize(`shiver.Status.${r.id}`) }));
      }
    }
    if ( actor?.statusRules.some(r => r.stealth) ) {
      majorAdvantage += 1;
      notes.push(game.i18n.localize("shiver.Check.stealthStrike"));
    }
  }

  const luck = actor?.luckBank;
  return {
    actor, skill, tags: [...tags], base, bonuses, faces, penalties, fear, caps, autoFail, autoFailOptions, notes,
    minorAdvantage, majorAdvantage,
    minorDisadvantage: options.minorDisadvantage ?? 0,
    majorDisadvantage: options.majorDisadvantage ?? 0,
    luck: luck ? { value: luck.value, max: luck.max } : null,
    combined: options.combined ?? []
  };
}

/* -------------------------------------------- */

/**
 * Build the final pool from the dialog's values.
 * @param {object} ctx      From prepareCheckContext
 * @param {object} values   Form values
 * @returns {{d6: number, d8: number, steps: object[]}}
 */
export function poolFromValues(ctx, values) {
  const bonuses = ctx.bonuses.filter(b => values[`bonus-${b.id}`]).map(b => ({ label: b.label, d6: b.d6, d8: b.d8 }));
  const penalties = ctx.penalties.filter(p => values[`penalty-${p.id}`]).map(p => ({ label: p.label, d6: p.d6, d8: p.d8 }));
  const pool = buildPool({
    skill: values.skillDice,
    talent: values.talentDice,
    bonuses,
    minorAdvantage: values.minorAdvantage,
    majorAdvantage: values.majorAdvantage,
    minorDisadvantage: values.minorDisadvantage,
    majorDisadvantage: values.majorDisadvantage,
    luck: values.luck,
    fear: values.applyFear ? ctx.fear : 0,
    penalties
  });
  for ( const cap of ctx.caps ) {
    if ( cap.total ) {
      pool.d6 = Math.min(pool.d6 + pool.d8, cap.d6);
      pool.d8 = 0;
    }
    else pool.d6 = Math.min(pool.d6, cap.d6);
    pool.steps.push({ label: cap.label, d6: 0, d8: 0, cap: cap.d6 });
  }
  return pool;
}

/* -------------------------------------------- */

/**
 * Show the dice pool dialog for a Skill Check.
 * @param {CheckOptions} options
 * @returns {Promise<object|null>}  The roll configuration, or null if cancelled.
 */
export async function checkDialog(options) {
  const ctx = prepareCheckContext(options);
  const defaults = {
    skillDice: options.skillDice ?? ctx.base.skill,
    talentDice: options.talentDice ?? ctx.base.talent,
    minorAdvantage: ctx.minorAdvantage,
    majorAdvantage: ctx.majorAdvantage,
    minorDisadvantage: ctx.minorDisadvantage,
    majorDisadvantage: ctx.majorDisadvantage,
    luck: 0,
    applyFear: true,
    assistD6: options.assistD6 ?? 0,
    assistD8: options.assistD8 ?? 0,
    cr: options.cr ?? null
  };
  for ( const b of ctx.bonuses ) defaults[`bonus-${b.id}`] = b.checked;
  for ( const f of ctx.faces ) defaults[`face-${f.id}`] = f.checked;
  for ( const p of ctx.penalties ) defaults[`penalty-${p.id}`] = p.checked;
  for ( const s of ctx.combined ) defaults[`combined-${s}`] = true;

  if ( options.skipDialog ) return finalize(options, ctx, defaults);

  const content = await foundry.applications.handlebars.renderTemplate("systems/shiver/templates/apps/check-dialog.hbs", {
    ctx, defaults, options,
    skills: Object.entries(CONFIG.shiver.skills).map(([k, v]) => ({
      key: k, label: game.i18n.localize(v.label), selected: k === ctx.skill,
      combined: defaults[`combined-${k}`] ?? false
    })),
    canChangeSkill: !["attack", "fear", "deathsDoor", "luckCrit"].includes(options.type),
    showCR: game.user.isGM || !options.crHidden,
    isGM: game.user.isGM,
    fearLabel: ctx.fear ? game.i18n.localize(ctx.fear === 2 ? "shiver.Status.terrified" : "shiver.Status.afraid") : null,
    helpers: game.actors.filter(a => (a.type === "character") && (a !== ctx.actor)).map(a => ({ uuid: a.uuid, name: a.name }))
  });

  let switchTo = null;
  const values = await DialogV2.wait({
    window: { title: options.label ?? game.i18n.localize("shiver.Check.title"), icon: "fa-solid fa-dice" },
    classes: ["shiver-check-dialog"],
    position: { width: 420 },
    content,
    buttons: [{
      action: "roll",
      label: "shiver.Check.roll",
      icon: "fa-solid fa-dice",
      default: true,
      callback: (event, button) => readForm(button.form, ctx)
    }],
    render: (event, dialog) => {
      const form = dialog.element.querySelector("form");
      const update = () => {
        const v = readForm(form, ctx);
        const skill = form.elements.skill?.value ?? ctx.skill;
        if ( skill !== ctx.skill ) {
          // A different skill has different ability bonuses: reopen the dialog for it.
          switchTo = skill;
          return dialog.close();
        }
        const pool = poolFromValues(ctx, v);
        const preview = form.querySelector(".pool-preview");
        if ( preview ) {
          preview.innerHTML = game.i18n.format("shiver.Check.poolPreview", { d6: pool.d6, d8: pool.d8 })
            + (v.assistD6 || v.assistD8 ? ` + ${game.i18n.format("shiver.Check.assistPreview", { d6: v.assistD6, d8: v.assistD8 })}` : "");
        }
      };
      form.addEventListener("change", update);
      form.addEventListener("input", update);
      update();
    },
    rejectClose: false
  });
  if ( switchTo ) {
    const label = (options.type === "check") || !options.type
      ? game.i18n.format("shiver.Check.checkOf", { skill: game.i18n.localize(CONFIG.shiver.skills[switchTo].label) }) : options.label;
    return checkDialog({ ...options, skill: switchTo, label, skillDice: undefined, talentDice: undefined });
  }
  if ( !values || (typeof values !== "object") ) return null;
  return finalize(options, ctx, values);
}

/**
 * Read the dialog form.
 * @param {HTMLFormElement} form
 * @param {object} ctx
 * @returns {object}
 */
function readForm(form, ctx) {
  const fd = new foundry.applications.ux.FormDataExtended(form).object;
  const num = k => Math.max(0, Math.floor(Number(fd[k]) || 0));
  const values = {
    skill: fd.skill ?? ctx.skill,
    skillDice: num("skillDice"),
    talentDice: num("talentDice"),
    minorAdvantage: num("minorAdvantage"),
    majorAdvantage: num("majorAdvantage"),
    minorDisadvantage: num("minorDisadvantage"),
    majorDisadvantage: num("majorDisadvantage"),
    luck: Math.min(num("luck"), ctx.luck?.value ?? 0),
    sight: !!fd.sight,
    applyFear: fd.applyFear ?? true,
    assistD6: num("assistD6"),
    assistD8: num("assistD8"),
    assistActor: fd.assistActor || "",
    cr: (fd.cr === null) || (fd.cr === "") || (fd.cr === undefined) ? null : Math.max(0, Math.floor(Number(fd.cr))),
    messageMode: fd.messageMode || null
  };
  for ( const b of ctx.bonuses ) values[`bonus-${b.id}`] = !!fd[`bonus-${b.id}`];
  for ( const f of ctx.faces ) values[`face-${f.id}`] = !!fd[`face-${f.id}`];
  for ( const p of ctx.penalties ) values[`penalty-${p.id}`] = !!fd[`penalty-${p.id}`];
  for ( const a of ctx.autoFailOptions ) values[`autofail-${a.id}`] = !!fd[`autofail-${a.id}`];
  for ( const k of Object.keys(CONFIG.shiver.skills) ) values[`combined-${k}`] = !!fd[`combined-${k}`];
  return values;
}

/**
 * Turn dialog values into a roll configuration.
 * @param {CheckOptions} options
 * @param {object} ctx
 * @param {object} values
 * @returns {object}
 */
function finalize(options, ctx, values) {
  const skill = values.skill ?? ctx.skill;
  ctx.skill = skill;
  const pool = poolFromValues(ctx, values);
  const counted = new Set([skill]);
  for ( const k of Object.keys(CONFIG.shiver.skills) ) if ( values[`combined-${k}`] ) counted.add(k);
  for ( const f of ctx.faces ) if ( values[`face-${f.id}`] ) for ( const s of f.countsAs ) counted.add(s);
  const combined = [...counted].filter(s => s !== skill);
  let cr = values.cr;
  if ( (cr === null) || (cr === undefined) || Number.isNaN(cr) ) cr = options.cr ?? null;
  if ( cr === 0 ) cr = null;
  return {
    ...options,
    actor: undefined,
    actorUuid: options.actor?.uuid ?? null,
    skill,
    combined,
    counted: [...counted],
    tags: ctx.tags,
    pool,
    luckSpent: values.luck ?? 0,
    assist: (values.assistD6 || values.assistD8)
      ? { d6: values.assistD6, d8: values.assistD8, actorUuid: values.assistActor || null } : null,
    cr,
    // Blinded characters fail anything that needs sight (p.219).
    autoFail: ctx.autoFail ?? ctx.autoFailOptions.find(a => values[`autofail-${a.id}`])?.label ?? ((values.sight && ctx.actor?.statusRules.some(r => r.failsSight)) ? game.i18n.localize("shiver.Status.blinded") : null),
    notes: [...(options.notes ?? []), ...ctx.notes],
    messageMode: values.messageMode ?? null
  };
}
