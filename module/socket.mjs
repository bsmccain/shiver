/**
 * Operations that need Gamemaster permissions (the Doom Clock, other players' actors, shared chat cards). Players send
 * them to the active GM with a User query; a GM runs them directly.
 */

/** @type {Record<string, (data: object) => Promise<any>>} */
const GM_OPS = {};

/**
 * Register an operation that runs on the active GM's client.
 * @param {string} op
 * @param {(data: object) => Promise<any>} handler
 */
export function registerGMOperation(op, handler) {
  GM_OPS[op] = handler;
}

/**
 * Register the query handler. Called during init.
 */
export function registerQueries() {
  // Ask a character's player to choose their Nightmare Mode penalty.
  CONFIG.queries["shiver.nightmareQuarter"] = async ({ uuid, key }) => {
    const actor = await fromUuid(uuid);
    return actor?._onNightmareQuarter(key);
  };
  CONFIG.queries["shiver.gm"] = async ({ op, data }) => {
    const handler = GM_OPS[op];
    if ( !handler ) throw new Error(`Unknown SHIVER GM operation "${op}"`);
    return handler(data);
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
  if ( game.user.isGM ) return GM_OPS[op](data);
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
