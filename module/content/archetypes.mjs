import warrior from "./archetypes/warrior.mjs";
import maverick from "./archetypes/maverick.mjs";
import scholar from "./archetypes/scholar.mjs";
import socialite from "./archetypes/socialite.mjs";
import fool from "./archetypes/fool.mjs";
import weird from "./archetypes/weird.mjs";
import survivor from "./archetypes/survivor.mjs";

/**
 * The seven Archetypes (p.29), keyed by id. Each holds its starting Skill Point tracker, Strength, Deficiency and its
 * Archetype Tree (p.30).
 * @type {Record<string, object>}
 */
export const ARCHETYPES = Object.fromEntries([warrior, maverick, scholar, socialite, fool, weird, survivor]
  .map(a => [a.id, a]));

/**
 * Find a tree node by id across all archetypes.
 * @param {string} id
 * @returns {{archetype: object, node: object}|null}
 */
export function findNode(id) {
  for ( const archetype of Object.values(ARCHETYPES) ) {
    const node = archetype.nodes.find(n => n.id === id);
    if ( node ) return { archetype, node };
  }
  return null;
}
