import { asGM, registerGMOperation } from "../socket.mjs";
import { ruleApplies } from "../rules/automation.mjs";

/**
 * Per-turn action tracking (p.22): one Move, one Attack and one Interact per Combat Turn. Skipping the Attack allows
 * a second Interact. Abilities and enemy profiles can grant extra actions.
 */

/**
 * The combatant for an actor in the active combat.
 * @param {Actor} actor
 * @returns {Combatant|null}
 */
export function combatantFor(actor) {
  const combat = game.combat;
  if ( !combat?.started ) return null;
  return combat.getCombatantsByActor(actor)[0] ?? null;
}

/**
 * The actions an actor may take each turn, including extra actions from abilities.
 * @param {Actor} actor
 * @returns {{move: number, attack: number, interact: number}}
 */
export function actionAllowance(actor) {
  const allowance = { move: 1, attack: 1, interact: 1 };
  if ( !actor ) return allowance;
  if ( actor.type === "npc" ) {
    for ( const k of Object.keys(allowance) ) allowance[k] += Number(actor.system.extraActions?.[k]) || 0;
  }
  for ( const rule of actor.rulesOfKind("extraActions") ) {
    // Conditions the system can't check (e.g. "if you didn't move") are left to the player, so they count.
    if ( ruleApplies(rule, { tags: new Set(["combat"]), actor }) === false ) continue;
    const action = rule.action ?? "attack";
    if ( action in allowance ) allowance[action] += Number(rule.amount) || 0;
  }
  // Rage-style stacks stored on the combatant.
  const combatant = combatantFor(actor);
  const bonus = combatant?.getFlag("shiver", "bonusActions") ?? {};
  for ( const [k, v] of Object.entries(bonus) ) if ( k in allowance ) allowance[k] += Number(v) || 0;
  return allowance;
}

/**
 * The actions an actor has used this turn.
 * @param {Actor} actor
 * @returns {{move: number, attack: number, interact: number}}
 */
export function actionsUsed(actor) {
  const combatant = combatantFor(actor);
  const used = combatant?.getFlag("shiver", "actions") ?? {};
  return { move: used.move ?? 0, attack: used.attack ?? 0, interact: used.interact ?? 0 };
}

/**
 * Record that an actor used an action in combat. Using a second Interact Action spends the Attack (p.22).
 * Warns, but does not block, when an actor goes over their allowance; the Director has the final say.
 * @param {Actor} actor
 * @param {"move"|"attack"|"interact"} action
 */
export async function markAction(actor, action) {
  const combatant = combatantFor(actor);
  if ( !combatant ) return;
  const used = actionsUsed(actor);
  const allow = actionAllowance(actor);
  let legal = used[action] < allow[action];
  if ( (action === "interact") && !legal && (used.attack < allow.attack) ) {
    // Skipping the Attack gives a second Interact (p.22).
    used.attack += 1;
    legal = true;
  }
  used[action] = (used[action] ?? 0) + 1;
  if ( !legal ) {
    ui.notifications.warn(game.i18n.format("shiver.Warn.NoActionLeft", {
      name: actor.name, action: game.i18n.localize(CONFIG.shiver.actions[action].label) }));
  }
  return setCombatantFlag(combatant, "actions", used);
}

/**
 * Set a flag on a combatant, through the GM when needed.
 * @param {Combatant} combatant
 * @param {string} key
 * @param {any} value
 */
export async function setCombatantFlag(combatant, key, value) {
  if ( combatant.isOwner ) return combatant.setFlag("shiver", key, value);
  return asGM("combatantFlag", { combatUuid: combatant.parent.uuid, id: combatant.id, key, value });
}

registerGMOperation("combatantFlag", async ({ combatUuid, id, key, value }) => {
  const combat = await fromUuid(combatUuid);
  return combat?.combatants.get(id)?.setFlag("shiver", key, value);
});
