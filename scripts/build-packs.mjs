/**
 * Build the compendium packs from the content modules in module/content.
 * Usage: node scripts/build-packs.mjs   (needs @foundryvtt/foundryvtt-cli: npm install)
 */
import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

import { ARCHETYPES } from "../module/content/archetypes.mjs";
import weapons from "../module/content/weapons.mjs";
import armour from "../module/content/armour.mjs";
import items from "../module/content/items.mjs";
import backgrounds from "../module/content/backgrounds.mjs";
import flaws from "../module/content/flaws.mjs";
import ewf from "../module/content/ewf-powers.mjs";
import {
  armourItemData, backgroundItemData, flawItemData, gearItemData, powerAbilityData, weaponItemData
} from "../module/apps/content-items.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "packs", "_source");
const OUT = path.join(ROOT, "packs");

/** A stable 16-character document id from a content id. */
const docId = key => createHash("sha1").update(key).digest("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 16);

const manifest = JSON.parse(await (await import("node:fs/promises")).readFile(path.join(ROOT, "system.json"), "utf8"));
const stats = { coreVersion: manifest.compatibility.verified, systemId: "shiver", systemVersion: manifest.version };

function itemDoc(pack, data, sourceId, folder = null, sort = 0) {
  const _id = docId(`${pack}.${sourceId}`);
  return { _id, _key: `!items!${_id}`, folder, sort, ownership: { default: 0 }, effects: [], _stats: stats, ...data };
}

function folderDoc(pack, name, sort) {
  const _id = docId(`${pack}.folder.${name}`);
  return { _id, _key: `!folders!${_id}`, name, type: "Item", folder: null, sorting: "m", sort, color: null, flags: {}, _stats: stats };
}

/** Archetype abilities, one folder per archetype. */
function abilityDocs() {
  const docs = [];
  let fs = 0;
  for ( const archetype of Object.values(ARCHETYPES) ) {
    const folder = folderDoc("abilities", archetype.name, fs += 100000);
    docs.push(folder);
    for ( const [i, node] of archetype.nodes.entries() ) {
      const data = nodeItemData(archetype, node);
      docs.push(itemDoc("abilities", data, node.id, folder._id, (node.tier * 1000) + i));
    }
  }
  const ewfFolder = folderDoc("abilities", "Earth, Wind & Fire Powers", fs += 100000);
  docs.push(ewfFolder);
  for ( const [i, p] of ewf.entries() ) docs.push(itemDoc("abilities", powerAbilityData(p), p.id, ewfFolder._id, i));
  return docs;
}

/** Mirrors module/apps/archetype-tree.mjs nodeItemData without Foundry globals. */
function nodeItemData(archetype, node) {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const skillImg = {
    grit: "SHIVER_GRIT", wit: "SHIVER_WIT", smarts: "SHIVER_SMARTS", heart: "SHIVER_HEART", luck: "SHIVER_LUCK", strange: "SHIVER_STRANGE"
  }[archetype.skill];
  return {
    name: node.name,
    type: "ability",
    img: skillImg ? `systems/shiver/assets/dice/skill/${skillImg}.png` : "icons/svg/book.svg",
    system: {
      description: `<p>${esc(node.summary)}</p>${node.page ? `<p class="page-ref"><em>SHIVER Core Rulebook p.${node.page}</em></p>` : ""}`,
      summary: node.summary ?? "",
      archetype: archetype.id,
      node: node.id,
      path: node.path ?? "",
      tier: node.tier,
      tree: true,
      prerequisites: node.prerequisites ?? [],
      action: node.action ?? "passive",
      uses: node.uses ? { per: node.uses.per, max: node.uses.max ?? 1 } : { per: "always", max: 1 },
      doom: node.doom ?? 0,
      upgrades: node.upgrades ?? "",
      choices: node.choices ?? {},
      automation: node.automation ?? [],
      page: node.page ?? null,
      attack: node.attack ?? { skill: "", damage: 0, damageType: "blunt", range: "close" }
    },
    flags: { shiver: { sourceId: node.id } }
  };
}

const PACKS = {
  weapons: () => weapons.map((w, i) => itemDoc("weapons", weaponItemData(w), w.id, null, i)),
  armour: () => armour.map((a, i) => itemDoc("armour", armourItemData(a), a.id, null, i)),
  items: () => items.map((it, i) => itemDoc("items", gearItemData(it), it.id, null, i)),
  backgrounds: () => backgrounds.map((b, i) => itemDoc("backgrounds", backgroundItemData(b), b.id, null, i)),
  flaws: () => flaws.map((f, i) => itemDoc("flaws", flawItemData(f), f.id, null, i)),
  abilities: abilityDocs
};

for ( const [name, build] of Object.entries(PACKS) ) {
  const docs = build();
  const dir = path.join(SRC, name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for ( const d of docs ) await writeFile(path.join(dir, `${d._id}.json`), JSON.stringify(d, null, 2));
  await rm(path.join(OUT, name), { recursive: true, force: true });
  await compilePack(dir, path.join(OUT, name), { log: false });
  console.log(`${name}: ${docs.length} documents`);
}
