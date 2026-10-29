import { ShiverCheck, rollDice, facesOf } from "../dice/check.mjs";
import { tallySymbols } from "../dice/pool.mjs";
import { asGM, registerGMOperation, serialize, waitFor } from "../socket.mjs";

const { DialogV2 } = foundry.applications.api;

const skillOptions = (selected = "grit") => Object.entries(CONFIG.shiver.skills)
  .map(([k, v]) => `<option value="${k}" ${k === selected ? "selected" : ""}>${game.i18n.localize(v.label)}</option>`).join("");

const actorOptions = filter => game.actors.filter(filter)
  .map(a => `<option value="${a.uuid}">${foundry.utils.escapeHTML(a.name)}</option>`).join("");

/**
 * Director tools. They are reached from the Doom Clock window and game.shiver.tools.
 */
export const GMTools = {

  /**
   * Ask the players for a Skill Check with a hidden Challenge Rating (p.10). Results resolve automatically.
   */
  async requestCheck() {
    const result = await DialogV2.prompt({
      window: { title: "shiver.Tools.requestCheck", icon: "fa-solid fa-dice" },
      content: `<div class="form-group"><label>${game.i18n.localize("shiver.Check.skill")}</label><select name="skill">${skillOptions()}</select></div>
        <div class="form-group"><label>${game.i18n.localize("shiver.Check.cr")}</label><input type="number" name="cr" min="1" max="10" value="2"></div>
        <div class="form-group"><label>${game.i18n.localize("shiver.Tools.label")}</label><input type="text" name="label" placeholder="${game.i18n.localize("shiver.Tools.labelHint")}"></div>
        <label class="checkbox"><input type="checkbox" name="fear"> ${game.i18n.localize("shiver.Tools.fearCheck")}</label>
        <label class="checkbox"><input type="checkbox" name="showCR"> ${game.i18n.localize("shiver.Tools.showCR")}</label>`,
      ok: { callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object },
      rejectClose: false
    });
    if ( !result ) return;
    const skill = result.fear ? "strange" : result.skill;
    const skillLabel = game.i18n.localize(CONFIG.shiver.skills[skill].label);
    const label = result.label || (result.fear ? game.i18n.localize("shiver.Fear.check") : game.i18n.format("shiver.Check.checkOf", { skill: skillLabel }));
    const cr = Math.max(1, Number(result.cr) || 1);
    const request = await ChatMessage.create({
      speaker: { alias: game.i18n.localize("shiver.Tools.director") },
      content: `<div class="shiver-card shiver-request"><h3><i class="fa-solid fa-dice"></i> ${foundry.utils.escapeHTML(label)}</h3>
        <p>${game.i18n.format("shiver.Tools.requestText", { skill: skillLabel })}${result.showCR ? ` (CR ${cr})` : ""}</p>
        <div class="card-buttons"><button type="button" data-shiver-action="requestedCheck"><i class="fa-solid fa-dice"></i> ${game.i18n.localize("shiver.Check.roll")}</button></div></div>`,
      flags: { shiver: { request: { skill, label, fear: !!result.fear, showCR: !!result.showCR } } }
    });
    // The CR stays in a note only the GMs receive.
    await ChatMessage.create({
      speaker: { alias: game.i18n.localize("shiver.Tools.director") },
      content: `<div class="shiver-card shiver-request-note"><i class="fa-solid fa-eye-slash"></i> ${game.i18n.format("shiver.Tools.hiddenCRNote", { label: foundry.utils.escapeHTML(label), cr })}</div>`,
      whisper: game.users.filter(u => u.isGM).map(u => u.id),
      flags: { shiver: { requestCR: { requestId: request.id, cr, show: !!result.showCR } } }
    });
    return request;
  },

  /**
   * An Opposed Skill Check (p.12): both sides roll, most successes wins, the Director settles ties (p.117).
   */
  /**
   * Grapple (p.22): an Opposed Grit Check; the winner may make the loser Grappled.
   * @param {Actor} actor
   * @param {Actor} target
   */
  async grapple(actor, target) {
    const sides = [
      { actorUuid: actor.uuid, skill: "grit", name: actor.name, messageId: null, successes: null },
      { actorUuid: target.uuid, skill: "grit", name: target.name, messageId: null, successes: null }
    ];
    const state = { label: game.i18n.format("shiver.Combat.grappleTitle", { a: actor.name, b: target.name }), sides, winner: null, onWin: { status: "grappled" } };
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: await renderOpposed(state),
      flags: { shiver: { opposed: state } }
    });
  },

  async opposedCheck() {
    const tokens = canvas?.tokens?.controlled ?? [];
    const targets = [...game.user.targets];
    // Tokens on the scene (unlinked enemies included), then world characters not on it.
    const seen = new Set();
    const entries = [];
    for ( const t of canvas?.tokens?.placeables ?? [] ) {
      if ( !t.actor ) continue;
      entries.push({ uuid: t.actor.uuid, name: t.name });
      if ( t.document.actorLink ) seen.add(t.actor.id);
    }
    for ( const a of game.actors ) if ( (a.type === "character") && !seen.has(a.id) ) entries.push({ uuid: a.uuid, name: a.name });
    const pcs = entries.map(e => `<option value="${e.uuid}">${foundry.utils.escapeHTML(e.name)}</option>`).join("");
    const result = await DialogV2.prompt({
      window: { title: "shiver.Tools.opposedCheck", icon: "fa-solid fa-people-arrows" },
      content: `<fieldset><legend>${game.i18n.localize("shiver.Tools.sideA")}</legend>
          <div class="form-group"><select name="a">${pcs}</select><select name="skillA">${skillOptions("heart")}</select></div></fieldset>
        <fieldset><legend>${game.i18n.localize("shiver.Tools.sideB")}</legend>
          <div class="form-group"><select name="b">${pcs}</select><select name="skillB">${skillOptions("strange")}</select></div></fieldset>
        <div class="form-group"><label>${game.i18n.localize("shiver.Tools.label")}</label><input type="text" name="label"></div>`,
      render: (event, dialog) => {
        const f = dialog.element.querySelector("form").elements;
        if ( tokens[0]?.actor ) f.a.value = tokens[0].actor.uuid;
        if ( targets[0]?.actor ) f.b.value = targets[0].actor.uuid;
      },
      ok: { callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object },
      rejectClose: false
    });
    if ( !result ) return;
    const sides = [
      { actorUuid: result.a, skill: result.skillA, name: fromUuidSync(result.a)?.name, messageId: null, successes: null },
      { actorUuid: result.b, skill: result.skillB, name: fromUuidSync(result.b)?.name, messageId: null, successes: null }
    ];
    const state = { label: result.label || game.i18n.localize("shiver.Tools.opposedCheck"), sides, winner: null };
    return ChatMessage.create({
      speaker: { alias: game.i18n.localize("shiver.Tools.director") },
      content: await renderOpposed(state),
      flags: { shiver: { opposed: state } }
    });
  },

  /**
   * A group Combined Skill Check (p.12): several characters roll and pool their successes against one CR.
   */
  async groupCheck() {
    const result = await DialogV2.prompt({
      window: { title: "shiver.Tools.groupCheck", icon: "fa-solid fa-people-group" },
      content: `<div class="form-group"><label>${game.i18n.localize("shiver.Check.skill")}</label><select name="skill">${skillOptions("wit")}</select></div>
        <div class="form-group"><label>${game.i18n.localize("shiver.Check.cr")}</label><input type="number" name="cr" min="1" max="20" value="4"></div>
        <div class="form-group"><label>${game.i18n.localize("shiver.Tools.label")}</label><input type="text" name="label"></div>`,
      ok: { callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object },
      rejectClose: false
    });
    if ( !result ) return;
    const state = {
      label: result.label || game.i18n.format("shiver.Tools.groupOf", { skill: game.i18n.localize(CONFIG.shiver.skills[result.skill].label) }),
      skill: result.skill, entries: [], total: 0, resolved: false, outcome: null
    };
    const message = await ChatMessage.create({
      speaker: { alias: game.i18n.localize("shiver.Tools.director") },
      content: await renderGroup(state),
      flags: { shiver: { group: state } }
    });
    await ChatMessage.create({
      speaker: { alias: game.i18n.localize("shiver.Tools.director") },
      content: `<div class="shiver-card"><i class="fa-solid fa-eye-slash"></i> ${game.i18n.format("shiver.Tools.hiddenCRNote", { label: state.label, cr: result.cr })}</div>`,
      whisper: game.users.filter(u => u.isGM).map(u => u.id),
      flags: { shiver: { groupCR: { groupId: message.id, cr: Number(result.cr) } } }
    });
    return message;
  },

  /**
   * Award a Character Level (p.30, p.122): +1 Ability Point, up to level 15.
   */
  async awardLevel() {
    const pcs = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);
    const list = (pcs.length ? pcs : game.actors.filter(a => a.type === "character"))
      .map(a => `<label class="checkbox"><input type="checkbox" name="${a.id}" checked> ${foundry.utils.escapeHTML(a.name)} (${a.system.attributes.level.value})</label>`).join("");
    const result = await DialogV2.prompt({
      window: { title: "shiver.Tools.awardLevel", icon: "fa-solid fa-arrow-up" },
      content: list || `<p>${game.i18n.localize("shiver.Tools.noCharacters")}</p>`,
      ok: { callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object },
      rejectClose: false
    });
    if ( !result ) return;
    const names = [];
    for ( const [id, on] of Object.entries(result) ) {
      if ( !on ) continue;
      const actor = game.actors.get(id);
      const level = actor?.system.attributes.level.value ?? 0;
      if ( !actor || level >= 15 ) continue;
      await actor.update({ "system.attributes.level.value": level + 1 });
      names.push(`${actor.name} → ${level + 1}`);
    }
    if ( names.length ) {
      await ChatMessage.create({
        speaker: { alias: game.i18n.localize("shiver.Tools.director") },
        content: `<div class="shiver-card shiver-level"><h3><i class="fa-solid fa-arrow-up"></i> ${game.i18n.localize("shiver.Tools.levelUp")}</h3><p>${names.join("<br>")}</p></div>`
      });
    }
  },

  /**
   * Damage or heal the selected tokens: falls (1 Blunt per 10 ft), hazards, healing (p.14, p.221).
   */
  async damageHeal() {
    const tokens = canvas.tokens.controlled.length ? canvas.tokens.controlled : [...game.user.targets];
    if ( !tokens.length ) return ui.notifications.warn("shiver.Warn.NoTargets", { localize: true });
    const types = Object.entries(CONFIG.shiver.damageTypes).map(([k, v]) => `<option value="${k}">${game.i18n.localize(v.label)}</option>`).join("");
    const result = await DialogV2.prompt({
      window: { title: "shiver.Tools.damageHeal", icon: "fa-solid fa-burst" },
      content: `<p>${tokens.map(t => foundry.utils.escapeHTML(t.name)).join(", ")}</p>
        <div class="form-group"><label>${game.i18n.localize("shiver.Tools.mode")}</label><select name="mode">
          <option value="damage">${game.i18n.localize("shiver.Tools.damage")}</option>
          <option value="fall">${game.i18n.localize("shiver.Tools.fall")}</option>
          <option value="heal">${game.i18n.localize("shiver.Tools.heal")}</option></select></div>
        <div class="form-group"><label>${game.i18n.localize("shiver.Tools.amount")}</label><input type="number" name="amount" min="0" value="1"></div>
        <div class="form-group"><label>${game.i18n.localize("shiver.Damage.type")}</label><select name="type">${types}</select></div>
        <label class="checkbox"><input type="checkbox" name="strike"> ${game.i18n.localize("shiver.Tools.isAttack")}</label>`,
      ok: { callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object },
      rejectClose: false
    });
    if ( !result ) return;
    const { applyDamage } = await import("../combat/damage.mjs");
    for ( const t of tokens ) {
      const actor = t.actor;
      if ( !actor ) continue;
      const n = Math.max(0, Number(result.amount) || 0);
      if ( result.mode === "heal" ) await actor.heal(n);
      // Falling: 1 Blunt per 10 ft, rounded down.
      else if ( result.mode === "fall" ) await applyDamage(actor, { amount: Math.floor(n / 10), type: "blunt", strike: false, notes: [game.i18n.format("shiver.Tools.fallNote", { ft: n })] });
      else await applyDamage(actor, { amount: n, type: result.type, strike: !!result.strike });
    }
  },

  /**
   * Roll Skill Dice for an "Act of God" (p.122): many Luck symbols is good news, many Strange symbols is bad.
   */
  async actOfGod() {
    const n = await DialogV2.prompt({
      window: { title: "shiver.Tools.actOfGod", icon: "fa-solid fa-cloud-bolt" },
      content: `<div class="form-group"><label>${game.i18n.localize("shiver.Check.skillDice")}</label><input type="number" name="n" min="1" max="20" value="3"></div>`,
      ok: { callback: (event, button) => button.form.elements.n.valueAsNumber },
      rejectClose: false
    });
    if ( !n ) return;
    const roll = await rollDice(n, 0);
    const t = tallySymbols(facesOf(roll).d6, []);
    return ChatMessage.create({
      speaker: { alias: game.i18n.localize("shiver.Tools.director") },
      rolls: [roll],
      content: `<div class="shiver-card"><h3><i class="fa-solid fa-cloud-bolt"></i> ${game.i18n.localize("shiver.Tools.actOfGod")}</h3>
        <p>${game.i18n.format("shiver.Tools.actOfGodResult", { luck: t.luck, strange: t.strange })}</p></div>`
    });
  }
};

/* -------------------------------------------- */
/*  Opposed checks                              */
/* -------------------------------------------- */

async function renderOpposed(state) {
  return foundry.applications.handlebars.renderTemplate("systems/shiver/templates/chat/opposed-card.hbs", {
    state,
    sides: state.sides.map((s, i) => ({ ...s, index: i, skillLabel: game.i18n.localize(CONFIG.shiver.skills[s.skill]?.label ?? s.skill),
      rolled: Number.isFinite(s.successes), win: state.winner === i, lose: (state.winner !== null) && (state.winner !== i) && (state.winner !== "none") })),
    tie: state.tie && (state.winner === null),
    bothLose: state.winner === "none"
  });
}

/**
 * Record a side's result on an opposed card; when both are in, decide the winner.
 * @param {object} data
 */
async function onOpposedResult({ cardId, side, messageId }) {
  const card = await waitFor(() => game.messages.get(cardId));
  const check = (await waitFor(() => game.messages.get(messageId)))?.getFlag("shiver", "check");
  if ( !card || !check ) return;
  const state = foundry.utils.deepClone(card.getFlag("shiver", "opposed"));
  if ( check.luckChoice === null ) return;
  const s = state.sides[side];
  s.messageId = messageId;
  s.successes = check.finalSuccesses ?? check.successes;
  s.luck = check.tally?.luck ?? 0;
  s.strange = check.tally?.strange ?? 0;
  const actor = await fromUuid(s.actorUuid);
  s.points = actor?.getPool(s.skill)?.skill ?? 0;
  const [a, b] = state.sides;
  if ( Number.isFinite(a.successes) && Number.isFinite(b.successes) ) {
    if ( a.successes === b.successes ) state.tie = true;
    else await settleOpposed(state, a.successes > b.successes ? 0 : 1);
  }
  await card.update({ content: await renderOpposed(state), "flags.shiver.opposed": state });
}

/**
 * Resolve both sides' checks once a winner (or "none") is known.
 * @param {object} state
 * @param {number|"none"} winner
 */
async function settleOpposed(state, winner) {
  state.winner = winner;
  state.tie = false;
  // Grapples and similar contests apply a status to the loser.
  if ( state.onWin?.status && Number.isInteger(winner) ) {
    const loser = await fromUuid(state.sides[1 - winner].actorUuid);
    await loser?.applyStatus(state.onWin.status);
  }
  for ( const [i, s] of state.sides.entries() ) {
    if ( !s.messageId ) continue;
    const outcome = (winner === i) ? "success" : "failure";
    await ShiverCheck._forceOutcome({ messageId: s.messageId, outcome });
  }
}

async function onOpposedTie({ cardId, choice }) {
  const card = game.messages.get(cardId);
  const state = foundry.utils.deepClone(card?.getFlag("shiver", "opposed"));
  if ( !state || (state.winner !== null) ) return;
  if ( choice === "reroll" ) {
    for ( const s of state.sides ) { s.successes = null; s.messageId = null; }
    state.tie = false;
  }
  else await settleOpposed(state, choice === "none" ? "none" : Number(choice));
  await card.update({ content: await renderOpposed(state), "flags.shiver.opposed": state });
}

/* -------------------------------------------- */
/*  Group checks                                */
/* -------------------------------------------- */

async function renderGroup(state) {
  return foundry.applications.handlebars.renderTemplate("systems/shiver/templates/chat/group-card.hbs", {
    state, skillLabel: game.i18n.localize(CONFIG.shiver.skills[state.skill]?.label ?? state.skill),
    outcomeLabel: state.outcome ? game.i18n.localize(`shiver.Outcome.${state.outcome}`) : null
  });
}

async function onGroupResult({ cardId, messageId }) {
  const card = await waitFor(() => game.messages.get(cardId));
  const check = (await waitFor(() => game.messages.get(messageId)))?.getFlag("shiver", "check");
  if ( !card || !check ) return;
  const state = foundry.utils.deepClone(card.getFlag("shiver", "group"));
  if ( check.luckChoice === null ) return;
  // Each character rolls once for the group.
  if ( state.resolved || state.entries.some(e => (e.messageId === messageId) || (check.actorUuid && (e.actorUuid === check.actorUuid))) ) return;
  state.entries.push({ messageId, actorUuid: check.actorUuid, name: check.actorName, successes: check.finalSuccesses ?? check.successes });
  state.total = state.entries.reduce((n, e) => n + e.successes, 0);
  await card.update({ content: await renderGroup(state), "flags.shiver.group": state });
}

async function onGroupResolve({ cardId }) {
  const card = game.messages.get(cardId);
  const state = foundry.utils.deepClone(card?.getFlag("shiver", "group"));
  if ( !state || state.resolved ) return;
  const cr = game.messages.find(m => m.getFlag("shiver", "groupCR")?.groupId === cardId)?.getFlag("shiver", "groupCR").cr;
  if ( !Number.isFinite(cr) ) return ui.notifications.warn("shiver.Tools.noGroupCR", { localize: true });
  state.cr = cr;
  state.outcome = state.total >= cr ? "success" : "failure";
  state.resolved = true;
  for ( const e of state.entries ) await ShiverCheck._forceOutcome({ messageId: e.messageId, outcome: state.outcome });
  await card.update({ content: await renderGroup(state), "flags.shiver.group": state });
}

/* -------------------------------------------- */

/**
 * Register the GM operations and expose the tools.
 */
export function registerGMTools() {
  registerGMOperation("opposedResult", d => serialize(`card.${d.cardId}`, () => onOpposedResult(d)));
  registerGMOperation("opposedTie", d => serialize(`card.${d.cardId}`, () => onOpposedTie(d)));
  registerGMOperation("groupResult", d => serialize(`card.${d.cardId}`, () => onGroupResult(d)));
  registerGMOperation("groupResolve", d => serialize(`card.${d.cardId}`, () => onGroupResolve(d)));
  // A result is recorded once the roller has chosen how to use Double Luck.
  Hooks.on("shiver.luckChosen", async (message, state) => {
    if ( !game.user.isGM ) return;
    if ( state.opposed ) await serialize(`card.${state.opposed.cardId}`, () => onOpposedResult({ cardId: state.opposed.cardId, side: state.opposed.side, messageId: message.id }));
    if ( state.group ) await serialize(`card.${state.group.cardId}`, () => onGroupResult({ cardId: state.group.cardId, messageId: message.id }));
  });
  Hooks.once("ready", () => game.shiver.tools = GMTools);
}

/**
 * Roll one side of an opposed check, or join a group check.
 * @param {ChatMessage} card
 * @param {string} action
 * @param {DOMStringMap} data
 */
export async function onToolCardAction(card, action, data) {
  if ( action === "opposedRoll" ) {
    const state = card.getFlag("shiver", "opposed");
    const side = state.sides[Number(data.side)];
    const actor = await fromUuid(side.actorUuid);
    if ( !actor?.isOwner ) return ui.notifications.warn("shiver.Warn.NotOwner", { localize: true });
    const message = await ShiverCheck.prompt({
      actor, skill: side.skill, type: "opposed", label: `${state.label}: ${actor.name}`, tags: ["opposed"],
      opposed: { cardId: card.id, side: Number(data.side) }, skipDialog: actor.type === "npc" && game.user.isGM
    });
    if ( message ) await asGM("opposedResult", { cardId: card.id, side: Number(data.side), messageId: message.id });
    return message;
  }
  if ( action === "opposedTie" ) {
    if ( !game.user.isGM ) return;
    return onOpposedTie({ cardId: card.id, choice: data.choice });
  }
  if ( action === "groupJoin" ) {
    const { currentActor } = await import("../chat.mjs");
    const actor = currentActor();
    if ( !actor ) return ui.notifications.warn("shiver.Warn.SelectActor", { localize: true });
    const state = card.getFlag("shiver", "group");
    if ( state.entries.some(e => e.actorUuid === actor.uuid) ) return ui.notifications.warn("shiver.Warn.AlreadyRolled", { localize: true });
    const message = await ShiverCheck.prompt({
      actor, skill: state.skill, type: "group", label: `${state.label}: ${actor.name}`, tags: ["group"],
      group: { cardId: card.id }
    });
    if ( message ) await asGM("groupResult", { cardId: card.id, messageId: message.id });
    return message;
  }
  if ( action === "groupResolve" ) {
    if ( !game.user.isGM ) return;
    return onGroupResolve({ cardId: card.id });
  }
}
