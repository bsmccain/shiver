import { ShiverCheck } from "./dice/check.mjs";
import { requestApplyDamage, rollSave } from "./combat/damage.mjs";
import { evaluatePool, tallySymbols } from "./dice/pool.mjs";
import { facesOf } from "./dice/check.mjs";
import { isShiverDie } from "./dice/terms.mjs";
import { onToolCardAction } from "./apps/gm-tools.mjs";

/**
 * The actor a user is acting as: their controlled token's actor, or their assigned character.
 * @returns {Actor|null}
 */
export function currentActor() {
  const token = canvas?.ready ? canvas.tokens.controlled[0] : null;
  return token?.actor ?? game.user.character ?? null;
}

/**
 * Wire up SHIVER chat cards when they render.
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
export function onRenderChatMessage(message, html) {
  const check = message.getFlag("shiver", "check");
  const damage = message.getFlag("shiver", "damage");

  // Only the GM sees Director controls; only owners see the roller's choices.
  if ( !game.user.isGM ) html.querySelectorAll(".gm-only").forEach(e => e.remove());
  const ownerUuid = check?.actorUuid ?? damage?.actorUuid ?? message.getFlag("shiver", "item")?.actorUuid;
  const owner = ownerUuid ? fromUuidSync(ownerUuid) : null;
  if ( !game.user.isGM && !(owner?.isOwner) ) html.querySelectorAll(".owner-only").forEach(e => e.remove());
  // Checks already rolled from an item card are spent.
  for ( const i of message.getFlag("shiver", "item")?.rolled ?? [] ) {
    html.querySelector(`[data-shiver-action="itemCheck"][data-index="${i}"]`)?.setAttribute("disabled", "");
  }

  // Hidden Challenge Ratings: show them to the GM only.
  if ( game.user.isGM && check?.crHidden && Number.isFinite(check.cr) ) {
    const line = html.querySelector(".result-line");
    if ( line && !line.querySelector(".gm-cr") ) {
      line.insertAdjacentHTML("beforeend", `<span class="gm-cr" data-tooltip="${game.i18n.localize("shiver.Check.hiddenCR")}">CR ${check.cr}</span>`);
    }
  }

  // Plain rolls with Archetype Dice (from the chat box or the Dice Tray) get a symbol tally, unless the roll is
  // private to someone else (GM rolls, blind rolls, Enemy Reactions): then the faces stay hidden too.
  if ( !check && message.isRoll && message.isContentVisible && message.rolls.some(r => r.dice.some(isShiverDie)) ) {
    addTally(message, html);
  }

  html.querySelectorAll("[data-shiver-action]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      button.disabled = true;
      onAction(message, button.dataset.shiverAction, button.dataset)
        .catch(err => {
          console.error(err);
          ui.notifications.error(err.message);
        })
        .finally(() => button.disabled = false);
    });
  });
}

/**
 * Add a tally of symbols to a plain roll message.
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
function addTally(message, html) {
  const d6 = [];
  const d8 = [];
  for ( const roll of message.rolls ) {
    const f = facesOf({ dice: roll.dice.filter(isShiverDie) });
    d6.push(...f.d6);
    d8.push(...f.d8);
  }
  const tally = tallySymbols(d6, d8);
  const parts = Object.entries(tally).filter(([, n]) => n).map(([k, n]) => {
    const label = game.i18n.localize(k === "talent" ? "shiver.Symbol.talent" : CONFIG.shiver.skills[k].label);
    return `<span class="sym sym-${k}">${label} ×${n}</span>`;
  });
  const content = html.querySelector(".message-content");
  if ( !content || content.querySelector(".shiver-tally") ) return;
  content.querySelectorAll(".dice-total").forEach(e => e.classList.add("shiver-hidden-total"));
  content.insertAdjacentHTML("beforeend", `<div class="shiver-tally tally">${parts.join("")}</div>`);
}

/**
 * Handle a card action.
 * @param {ChatMessage} message
 * @param {string} action
 * @param {DOMStringMap} data
 */
async function onAction(message, action, data) {
  const check = message.getFlag("shiver", "check");
  switch ( action ) {
    case "setCR":
    case "luckChoice":
      return ShiverCheck.onCardAction(message, action, data);

    case "applyDamage": {
      const target = check?.attack?.targets?.[Number(data.index)];
      if ( !canApplyDamage(check, target) ) return ui.notifications.warn("shiver.Warn.NotAllowed", { localize: true });
      return requestApplyDamage(message, { index: Number(data.index) });
    }

    case "applyDamageSelected": {
      if ( !canApplyDamage(check) ) return ui.notifications.warn("shiver.Warn.NotAllowed", { localize: true });
      const tokens = game.user.targets.size ? [...game.user.targets] : canvas.tokens.controlled;
      if ( !tokens.length ) return ui.notifications.warn("shiver.Warn.NoTargets", { localize: true });
      return requestApplyDamage(message, { actorUuids: tokens.map(t => t.actor?.uuid).filter(Boolean) });
    }

    case "rollSave": {
      const dmg = message.getFlag("shiver", "damage");
      const actor = dmg?.actorUuid ? await fromUuid(dmg.actorUuid) : null;
      const save = dmg?.saves?.[Number(data.index)];
      if ( !actor || !save ) return;
      if ( !actor.isOwner ) return ui.notifications.warn("shiver.Warn.NotOwner", { localize: true });
      const { asGM } = await import("./socket.mjs");
      const claimed = await asGM("claimSave", { messageId: message.id, index: Number(data.index) });
      if ( claimed === false ) return ui.notifications.warn("shiver.Warn.AlreadyRolled", { localize: true });
      const attacker = dmg.attackerUuid ? await fromUuid(dmg.attackerUuid) : null;
      const result = await rollSave(actor, save, attacker);
      // The roll dialog was cancelled: the save can still be rolled from this card.
      if ( !result && save.skill && !actor.system.immunities?.has(save.status) ) {
        await asGM("releaseSave", { messageId: message.id, index: Number(data.index) });
      }
      return result;
    }

    case "deathsDoorRoll": {
      const actor = await fromUuid(data.actorUuid);
      if ( !actor?.isOwner ) return ui.notifications.warn("shiver.Warn.NotOwner", { localize: true });
      if ( !actor.hasStatus("deathsDoor") ) return ui.notifications.warn("shiver.Warn.NotDying", { localize: true });
      return actor.rollDeathsDoor();
    }

    case "stabilise": {
      const target = await fromUuid(data.actorUuid);
      const helper = currentActor();
      if ( !target?.hasStatus("deathsDoor") ) return ui.notifications.warn("shiver.Warn.NotDying", { localize: true });
      if ( !helper || (helper === target) ) return ui.notifications.warn("shiver.Warn.SelectHelper", { localize: true });
      if ( !helper.isOwner ) return ui.notifications.warn("shiver.Warn.NotOwner", { localize: true });
      return helper.rollStabilise(target);
    }

    case "strikeAgain": {
      const actor = check?.actorUuid ? await fromUuid(check.actorUuid) : null;
      const item = check?.attack?.itemUuid ? await fromUuid(check.attack.itemUuid) : null;
      if ( !actor?.isOwner || !item ) return;
      if ( check.extraStrikeTaken ) return ui.notifications.warn("shiver.Warn.AlreadyRolled", { localize: true });
      const { asGM } = await import("./socket.mjs");
      const ok = await asGM("claimStrikeAgain", { messageId: message.id });
      if ( ok === false ) return ui.notifications.warn("shiver.Warn.AlreadyRolled", { localize: true });
      // The extra Strike from a Wit Critical is free and can't crit (p.24).
      const result = await actor.rollAttack(item, { noCrit: true, free: true, label: game.i18n.localize("shiver.Crit.strikeAgain") });
      // Refused or cancelled: the extra Strike can still be taken.
      if ( !result ) await asGM("releaseStrikeAgain", { messageId: message.id });
      return result;
    }

    case "opposedRoll":
    case "opposedTie":
    case "groupJoin":
    case "groupResolve":
      return onToolCardAction(message, action, data);

    case "itemCheck": {
      const info = message.getFlag("shiver", "item");
      const actor = info?.actorUuid ? await fromUuid(info.actorUuid) : null;
      const item = info?.uuid ? await fromUuid(info.uuid) : null;
      if ( !actor?.isOwner || !item ) return ui.notifications.warn("shiver.Warn.NotOwner", { localize: true });
      // Each check on a use card is rolled once; use the item again for another.
      const index = data.index !== undefined ? Number(data.index) : 0;
      const rolled = info.rolled ?? [];
      if ( rolled.includes(index) ) return ui.notifications.warn("shiver.Warn.AlreadyRolled", { localize: true });
      if ( message.isOwner ) await message.setFlag("shiver", "item", { ...info, rolled: [...rolled, index] });
      const result = await actor.rollItemCheck(item, index);
      // Refused (e.g. the ability is lost to Trauma) or cancelled: the check is still there to roll.
      if ( !result && message.isOwner ) {
        const now = message.getFlag("shiver", "item") ?? info;
        await message.setFlag("shiver", "item", { ...now, rolled: (now.rolled ?? []).filter(i => i !== index) });
      }
      return result;
    }

    case "itemRule": {
      const info = message.getFlag("shiver", "item");
      const actor = info?.actorUuid ? await fromUuid(info.actorUuid) : null;
      const item = info?.uuid ? await fromUuid(info.uuid) : null;
      if ( !actor?.isOwner || !item ) return ui.notifications.warn("shiver.Warn.NotOwner", { localize: true });
      const { applyItemRule } = await import("./documents/actor-actions.mjs");
      return applyItemRule(actor, item, Number(data.index));
    }

    case "requestedCheck": {
      const actor = currentActor();
      if ( !actor ) return ui.notifications.warn("shiver.Warn.SelectActor", { localize: true });
      const request = message.getFlag("shiver", "request");
      if ( request.fear ) return actor.rollFearCheck({ label: request.label, requestId: message.id });
      return actor.rollCheck(request.skill, {
        type: "check", requestId: message.id, crHidden: !request.showCR, cr: null, label: request.label
      });
    }
  }
}

/**
 * May the current user apply an attack's damage?
 * @param {object} check
 * @param {object} [target]
 * @returns {boolean}
 */
function canApplyDamage(check, target) {
  if ( game.user.isGM ) return true;
  if ( !game.settings.get("shiver", "playersApplyDamage") ) return false;
  const attacker = check?.actorUuid ? fromUuidSync(check.actorUuid) : null;
  const victim = target?.actorUuid ? fromUuidSync(target.actorUuid) : null;
  return !!(attacker?.isOwner || victim?.isOwner);
}
