/**
 * Turn content entries (module/content/*.mjs) into Item data. Pure functions so the compendium build script can use
 * them outside Foundry.
 */

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const para = (text, page) => `<p>${esc(text)}</p>${page ? `<p class="page-ref"><em>SHIVER Core Rulebook p.${page}</em></p>` : ""}`;
const uses = u => u ? { per: u.per, max: u.max ?? 1 } : { per: "always", max: 1 };

export const ICONS = {
  weapon: "icons/svg/sword.svg",
  armour: "icons/svg/shield.svg",
  item: "icons/svg/item-bag.svg",
  ability: "icons/svg/book.svg",
  background: "icons/svg/mystery-man.svg",
  flaw: "icons/svg/hazard.svg",
  power: "icons/svg/lightning.svg",
  trait: "icons/svg/aura.svg"
};

export function weaponItemData(w) {
  return {
    name: w.name,
    type: "weapon",
    img: ICONS.weapon,
    system: {
      description: para(w.summary, w.page),
      summary: w.summary ?? "",
      page: w.page ?? null,
      category: w.category ?? "melee",
      skill: w.skill,
      altSkills: w.altSkills ?? [],
      damage: w.damage ?? 0,
      damageType: w.damageType ?? "blunt",
      altDamageTypes: w.altDamageTypes ?? [],
      range: w.range ?? "close",
      properties: w.properties ?? [],
      material: w.material ?? "",
      unarmed: !!w.unarmed,
      equipped: true,
      ammo: w.ammo ?? { value: null, max: null },
      automation: w.automation ?? []
    },
    flags: { shiver: { sourceId: w.id } }
  };
}

export function armourItemData(a) {
  return {
    name: a.name,
    type: "armour",
    img: ICONS.armour,
    system: {
      description: para(a.summary, a.page),
      summary: a.summary ?? "",
      page: a.page ?? null,
      slots: a.slots ?? 1,
      hpPerSlot: 2,
      slotHp: Array.from({ length: a.slots ?? 1 }, () => 2),
      heavy: !!a.heavy,
      unbreakable: !!a.unbreakable,
      equipped: true,
      abilityName: a.abilityName ?? "",
      automation: a.automation ?? []
    },
    flags: { shiver: { sourceId: a.id } }
  };
}

export function gearItemData(i) {
  return {
    name: i.name,
    type: "item",
    img: ICONS.item,
    system: {
      description: para(i.summary, i.page),
      summary: i.summary ?? "",
      page: i.page ?? null,
      category: i.category ?? "",
      consumable: !!i.consumable,
      quantity: i.quantity ?? 1,
      uses: uses(i.uses),
      doom: i.doom ?? 0,
      action: i.action ?? "interact",
      skill: i.skill ?? "",
      equipped: true,
      automation: i.automation ?? []
    },
    flags: { shiver: { sourceId: i.id } }
  };
}

export function backgroundItemData(b) {
  return {
    name: b.name,
    type: "background",
    img: ICONS.background,
    system: {
      description: `<p><strong>${esc(b.abilityName)}.</strong> ${esc(b.abilitySummary)}</p><p><strong>${esc(b.flawName)} (Flaw).</strong> ${esc(b.flawSummary)}</p>${b.page ? `<p class="page-ref"><em>SHIVER Core Rulebook p.${b.page}</em></p>` : ""}`,
      page: b.page ?? null,
      abilityName: b.abilityName ?? "",
      abilitySummary: b.abilitySummary ?? "",
      abilityDescription: para(b.abilitySummary),
      action: b.action ?? "passive",
      uses: uses(b.uses),
      doom: b.doom ?? 0,
      automation: b.automation ?? [],
      flawName: b.flawName ?? "",
      flawSummary: b.flawSummary ?? "",
      flawDescription: para(b.flawSummary),
      flawAutomation: b.flawAutomation ?? [],
      archetype: b.group ?? ""
    },
    flags: { shiver: { sourceId: b.id } }
  };
}

export function flawItemData(f) {
  return {
    name: f.name,
    type: "flaw",
    img: ICONS.flaw,
    system: {
      description: para(f.summary, f.page),
      summary: f.summary ?? "",
      page: f.page ?? null,
      fatal: true,
      automation: f.automation ?? []
    },
    flags: { shiver: { sourceId: f.id } }
  };
}

export function powerAbilityData(p) {
  return {
    name: p.name,
    type: "ability",
    img: ICONS.power,
    system: {
      description: para(p.summary, p.page),
      summary: p.summary ?? "",
      page: p.page ?? null,
      archetype: "survivor",
      node: p.id,
      path: "ewf",
      tier: 10,
      tree: false,
      action: p.action ?? "attack",
      uses: uses(p.uses),
      doom: p.doom ?? 0,
      automation: p.automation ?? [],
      attack: p.attack ?? { skill: "", damage: 0, damageType: "blunt", range: "close" }
    },
    flags: { shiver: { sourceId: p.id } }
  };
}
