/**
 * Hidden Challenge Ratings. The book advises keeping the CR hidden and describing the obstacle instead (p.10).
 *
 * Foundry sends every world document to every client, whispered chat messages included, so a CR written anywhere in
 * the world could be read from a player's browser console. A hidden CR is kept only in the GM's browser (a client
 * setting) until its check is resolved. The check cards store whether a hidden CR was set, never its value.
 *
 * Keys: "request.<request card id>", "group.<group card id>", "check.<check card id>".
 */

const SETTING = "hiddenCRs";

/** Entries older than this are forgotten. */
const MAX_AGE = 3 * 24 * 60 * 60 * 1000;

/**
 * Register the client setting that holds the GM's hidden CRs.
 */
export function registerHiddenCRs() {
  game.settings.register("shiver", SETTING, { scope: "client", config: false, type: Object, default: {} });
}

/**
 * A hidden CR this GM set, or null if it isn't known in this browser.
 * @param {string} key
 * @returns {number|null}
 */
export function getHiddenCR(key) {
  if ( !game.user.isGM ) return null;
  const cr = game.settings.get("shiver", SETTING)?.[key]?.cr;
  return Number.isFinite(cr) ? cr : null;
}

/**
 * Remember a hidden CR in this GM's browser.
 * @param {string} key
 * @param {number} cr
 * @returns {Promise<void>}
 */
export async function setHiddenCR(key, cr) {
  if ( !game.user.isGM || !Number.isFinite(cr) ) return;
  const now = Date.now();
  const all = Object.fromEntries(Object.entries(game.settings.get("shiver", SETTING) ?? {})
    .filter(([, v]) => (now - (v?.at ?? 0)) < MAX_AGE));
  all[key] = { cr, at: now };
  await game.settings.set("shiver", SETTING, all);
}
