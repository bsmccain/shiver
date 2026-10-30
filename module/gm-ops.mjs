import { boundedInt, canControl, GMOperationRefused, registerGMOperation, resolveActor, shortText } from "./socket.mjs";

/**
 * Actor operations a player may need the GM to perform on actors they don't own: the rules let a character's abilities
 * and Strikes put statuses on enemies, heal allies, and so on. Each one checks its request (see socket.mjs) and only
 * changes what its rule needs.
 */
export function registerActorOperations() {
  registerGMOperation("applyStatus", async ({ uuid, id, value, stack, origin, duration, flags, overlay }, user) => {
    const actor = await resolveActor(uuid);
    requireLifecycleControl(user, actor, statusId(id), "apply");
    await actor.applyStatus(statusId(id), {
      value: (value === undefined) || (value === null) ? undefined : boundedInt(value, 0, 20, "status value"),
      stack: stack === true,
      origin: shortText(origin) || undefined,
      duration: statusDuration(duration),
      flags: statusFlags(flags),
      overlay: overlay === true
    });
    return true;
  });
  registerGMOperation("removeStatus", async ({ uuid, id }, user) => {
    const actor = await resolveActor(uuid);
    requireLifecycleControl(user, actor, statusId(id), "remove");
    await actor.removeStatus(statusId(id));
    return true;
  });
  registerGMOperation("setFear", async ({ uuid, level }) => {
    const actor = await resolveActor(uuid);
    await actor.setFearLevel(boundedInt(level, 0, 2, "fear level"));
    return true;
  });
  registerGMOperation("heal", async ({ uuid, amount, chat, source }) => {
    const actor = await resolveActor(uuid);
    return actor.heal(boundedInt(amount, 0, 1000, "healing"), { chat: chat !== false, source: shortText(source) });
  });
  registerGMOperation("updateActor", async ({ uuid, changes, options }, user) => {
    const actor = await resolveActor(uuid);
    const update = ownerUpdateChanges(actor, changes, user);
    await actor.update(update, { shiverAllowHeal: options?.shiverAllowHeal === true });
    return true;
  });
}

/* -------------------------------------------- */

/** Statuses that follow from Health and death, not from an ability's effect. */
const LIFECYCLE = new Set(["dead", "deathsDoor", "unconscious", "infected"]);

/**
 * Players' abilities never kill, knock out or infect another character directly: those come from wounds, and the GM
 * resolves the few abilities that do (a Vampire Slayer's check runs on the GM's client). Reviving an ally (Revive,
 * Adrenaline Shot) removes them, so a player may remove them from another character, but not from an enemy.
 * @param {User} user
 * @param {Actor} actor
 * @param {string} id
 * @param {"apply"|"remove"} change
 */
function requireLifecycleControl(user, actor, id, change) {
  if ( !LIFECYCLE.has(id) || canControl(user, actor) ) return;
  if ( (change === "remove") && (actor.type === "character") ) return;
  throw new GMOperationRefused(`Only the GM can ${change} ${id} on ${actor.name}`);
}

/**
 * A status from a request: must be one of the system's statuses.
 * @param {string} id
 * @returns {string}
 */
export function statusId(id) {
  if ( (typeof id !== "string") || !CONFIG.statusEffects.some(s => s.id === id) ) throw new GMOperationRefused(`Unknown status ${id}`);
  return id;
}

/**
 * A status duration from a request (e.g. Blinded for 2 Combat Rounds).
 * @param {object} [duration]
 * @returns {object|undefined}
 */
export function statusDuration(duration) {
  if ( !duration ) return undefined;
  const units = ["rounds", "turns"].includes(duration.units) ? duration.units : "rounds";
  const events = ["combatStart", "roundStart", "turnStart", "combatEnd", "roundEnd", "turnEnd"];
  return {
    value: boundedInt(duration.value, 1, 100, "duration"),
    units,
    expiry: events.includes(duration.expiry) ? duration.expiry : undefined
  };
}

/**
 * The status flags a request may set: when it expires, its value, and an infection's type. Anything else, such as
 * automation rules, is dropped.
 * @param {object} [flags]
 * @returns {object}
 */
export function statusFlags(flags) {
  const out = {};
  if ( !flags || (typeof flags !== "object") ) return out;
  if ( ["combatEnd", "endOfNextTurn", "startOfNextTurn"].includes(flags.expires) ) out.expires = flags.expires;
  const w = flags.expiresWith;
  if ( w && (typeof w.combatant === "string") && ["turnStart", "turnEnd"].includes(w.event) ) {
    out.expiresWith = { combatant: w.combatant.slice(0, 200), event: w.event };
  }
  if ( (flags.value !== undefined) && (flags.value !== null) ) out.value = boundedInt(flags.value, 0, 20, "status value");
  if ( (typeof flags.infection === "string") && (flags.infection in (CONFIG.shiver.infections ?? {})) ) out.infection = flags.infection;
  return out;
}

/**
 * The changes a non-owner may ask the GM to make with _ownerUpdate. The rules only ever raise another character's
 * Health (stabilising, "your Health Points become 1") or add to their Luck Bank; anything else needs ownership.
 * @param {Actor} actor
 * @param {object} changes
 * @param {User} user
 * @returns {object}
 */
function ownerUpdateChanges(actor, changes, user) {
  const flat = foundry.utils.flattenObject(changes ?? {});
  const owner = canControl(user, actor);
  const update = {};
  for ( const [key, raw] of Object.entries(flat) ) {
    if ( key === "system.hp.value" ) {
      const max = actor.system.hp?.max ?? 16;
      const value = boundedInt(raw, 0, max, "Health");
      if ( !owner && (value < actor.system.hp.value) ) throw new GMOperationRefused("Only the owner can lower Health this way");
      update[key] = value;
    }
    else if ( key === "system.attributes.luck.value" ) {
      const value = boundedInt(raw, 0, 10, "Luck");
      if ( !owner && (value < (actor.system.attributes?.luck?.value ?? 0)) ) throw new GMOperationRefused("Only the owner can spend Luck");
      update[key] = value;
    }
    else throw new GMOperationRefused(`Can't change ${key} this way`);
  }
  return update;
}
