/**
 * Operations that need Gamemaster permissions (the Doom Clock, other players' actors, shared chat cards). Players send
 * them to the active GM with a User query; a GM runs them directly.
 *
 * Every operation runs with the GM's permissions, so each handler checks its request: it gets the sending User (which
 * Foundry's server supplies, so it can't be forged), only touches the documents and fields its rule needs, and only
 * for a user the rules allow to ask.
 */

/** @type {Record<string, (data: object, user: User) => Promise<any>>} */
const GM_OPS = {};

/**
 * Register an operation that runs on the active GM's client.
 * @param {string} op
 * @param {(data: object, user: User) => Promise<any>} handler  Gets the request data and the user who sent it.
 */
export function registerGMOperation(op, handler) {
  GM_OPS[op] = handler;
}

/**
 * Register the query handlers. Called during init.
 */
export function registerQueries() {
  // Ask a character's player to choose their Nightmare Mode penalty. Sent by whoever changed the character's Health:
  // a GM, or another of the character's owners.
  CONFIG.queries["shiver.nightmareQuarter"] = async ({ uuid, key } = {}, { user } = {}) => {
    if ( !["weakened", "trauma"].includes(key) ) throw new Error(`Unknown Nightmare Mode penalty "${key}"`);
    const actor = await resolveActor(uuid);
    requireControl(user, actor);
    return actor._onNightmareQuarter(key);
  };
  CONFIG.queries["shiver.gm"] = async ({ op, data } = {}, { user } = {}) => {
    const handler = Object.hasOwn(GM_OPS, op) ? GM_OPS[op] : null;
    if ( !handler ) throw new Error(`Unknown SHIVER GM operation "${op}"`);
    if ( !(user instanceof foundry.documents.BaseUser) ) throw new Error("SHIVER GM operations need a known sender");
    return handler(data ?? {}, user);
  };
}

/**
 * Run an operation as the GM: directly if this user is a GM, otherwise through the active GM.
 * @param {string} op
 * @param {object} data
 * @param {object} [options]
 * @param {boolean} [options.warn=true]   Warn the user when no GM is connected.
 * @returns {Promise<any>}  The operation's result, or undefined when no GM could run it.
 */
export async function asGM(op, data, { warn = true } = {}) {
  if ( game.user.isGM ) return GM_OPS[op](data ?? {}, game.user);
  const gm = game.users.activeGM;
  if ( !gm ) {
    if ( warn ) ui.notifications.warn("shiver.Warn.NoGM", { localize: true });
    return undefined;
  }
  return gm.query("shiver.gm", { op, data }, { timeout: 60000 });
}

/** @type {Map<string, Promise>} */
const QUEUES = new Map();

/**
 * Run async work one at a time per key, so that GM-side read-modify-write operations (the Doom Clock, a chat card,
 * an actor's health) can't interleave when several requests arrive together.
 * @param {string} key
 * @param {() => Promise<any>} fn
 * @returns {Promise<any>}
 */
export function serialize(key, fn) {
  const prior = QUEUES.get(key) ?? Promise.resolve();
  const next = prior.catch(() => {}).then(fn);
  const tail = next.catch(() => {});
  QUEUES.set(key, tail);
  tail.then(() => { if ( QUEUES.get(key) === tail ) QUEUES.delete(key); });
  return next;
}

/**
 * Wait for a document to arrive in a collection, for handlers that can run before the creating broadcast lands.
 * @param {() => any} getter
 * @param {number} [timeout=3000]
 * @returns {Promise<any>}
 */
export async function waitFor(getter, timeout = 3000) {
  const start = performance.now();
  let value = getter();
  while ( !value && ((performance.now() - start) < timeout) ) {
    await new Promise(r => setTimeout(r, 50));
    value = getter();
  }
  return value;
}

/* -------------------------------------------- */
/*  Checking GM operation requests              */
/* -------------------------------------------- */

/** A GM operation request that its sender isn't allowed to make. */
export class GMOperationRefused extends Error {}

/**
 * Resolve a UUID that must point at an Actor (world, compendium-free, or a token's synthetic actor).
 * @param {string} uuid
 * @returns {Promise<Actor>}
 */
export async function resolveActor(uuid) {
  const actor = (typeof uuid === "string") ? await fromUuid(uuid) : null;
  if ( (actor?.documentName !== "Actor") || actor.pack ) throw new GMOperationRefused(`Not an actor in this world: ${uuid}`);
  return actor;
}

/**
 * May this user act for this document? GMs always may; players need Owner permission.
 * @param {User} user
 * @param {Document} document
 * @returns {boolean}
 */
export function canControl(user, document) {
  return !!user && !!document && (user.isGM || document.testUserPermission(user, "OWNER"));
}

/**
 * Refuse the request unless the user may act for the document.
 * @param {User} user
 * @param {Document} document
 */
export function requireControl(user, document) {
  if ( !canControl(user, document) ) throw new GMOperationRefused(`${user?.name ?? "This user"} doesn't own ${document?.name ?? "that"}`);
}

/**
 * Refuse the request unless it comes from a GM.
 * @param {User} user
 */
export function requireGM(user) {
  if ( !user?.isGM ) throw new GMOperationRefused("Only a GM can do that");
}

/**
 * Read an integer from a request, refusing anything outside the bounds.
 * @param {any} value
 * @param {number} min
 * @param {number} max
 * @param {string} [label]
 * @returns {number}
 */
export function boundedInt(value, min, max, label = "value") {
  const n = Number(value);
  if ( !Number.isInteger(n) || (n < min) || (n > max) ) throw new GMOperationRefused(`Invalid ${label}: ${value}`);
  return n;
}

/**
 * Was this chat card posted by someone who controls the actor it's about? A card claiming to be another character's
 * roll is ignored.
 * @param {ChatMessage} message
 * @param {Actor} actor
 * @returns {boolean}
 */
export function authorControls(message, actor) {
  return canControl(message?.author, actor);
}

/**
 * A short plain string from a request (for chat text such as a reason), or a fallback.
 * @param {any} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function shortText(value, fallback = "") {
  return (typeof value === "string") ? value.slice(0, 200) : fallback;
}
