const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

/**
 * Build the data for an ability item from an Archetype Tree node.
 * @param {object} archetype
 * @param {object} node
 * @param {object[]} [extraRules]   Rules from the player's choices (e.g. +2 Core Points)
 * @returns {object}
 */
export function nodeItemData(archetype, node, extraRules = []) {
  const summary = node.summary ?? "";
  return {
    name: node.name,
    type: "ability",
    img: CONFIG.shiver.skills[archetype.skill]?.img ?? "icons/svg/book.svg",
    system: {
      description: `<p>${foundry.utils.escapeHTML(summary)}</p>${node.page ? `<p><em>${game.i18n.format("shiver.Ability.pageRef", { page: node.page })}</em></p>` : ""}`,
      summary,
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
      // Rules waiting on a player's choice ("skill: choice") are replaced by the choice.
      automation: [...(node.automation ?? []).filter(r => !(extraRules.length && (r.skill === "choice"))), ...extraRules],
      page: node.page ?? null,
      attack: node.attack ?? { skill: "", damage: 0, damageType: "blunt", range: "close" }
    },
    flags: { shiver: { sourceId: node.id } }
  };
}

/* -------------------------------------------- */

/**
 * Can a character gain an Archetype Tree ability (p.30, p.78)? It must belong to one of the character's Archetypes,
 * connect to an ability they own in the tier below, and they need an unspent Ability Point.
 * @param {Actor} actor
 * @param {object} system   The ability's system data
 * @returns {{ok: boolean, reason?: string}}
 */
export function treeNodeAllowed(actor, system) {
  if ( !system?.tree ) return { ok: true };
  const attrs = actor.system.attributes;
  const owned = [attrs.archetype, ...(attrs.hybrids ?? [])].filter(Boolean);
  if ( system.node ) {
    if ( !owned.includes(system.archetype) ) {
      const name = CONFIG.shiver.archetypes?.[system.archetype]?.name ?? system.archetype;
      return { ok: false, reason: game.i18n.format("shiver.Tree.notYourArchetype", { name }) };
    }
    const nodes = new Set(actor.itemTypes.ability.map(i => i.system.node).filter(Boolean));
    if ( nodes.has(system.node) ) return { ok: false, reason: game.i18n.localize("shiver.Tree.alreadyOwned") };
    const node = CONFIG.shiver.archetypes?.[system.archetype]?.nodes.find(n => n.id === system.node);
    const prereqs = node?.prerequisites ?? system.prerequisites ?? [];
    const mode = node?.prerequisiteMode ?? "any";
    const met = !prereqs.length || ((mode === "all") ? prereqs.every(p => nodes.has(p)) : prereqs.some(p => nodes.has(p)));
    if ( !met ) return { ok: false, reason: game.i18n.localize("shiver.Tree.notConnected") };
  }
  if ( (attrs.abilityPoints?.available ?? 0) <= 0 ) return { ok: false, reason: game.i18n.localize("shiver.Tree.noPoints") };
  return { ok: true };
}

/* -------------------------------------------- */

/**
 * Hybrid eligibility (p.78): at least 5 permanent Core Skill Points in the archetype's skill, with each Talent Point
 * worth 2. The Survivor needs two different skills at 5 or more. At most three archetypes.
 * @param {Actor} actor
 * @param {object} archetype
 * @returns {{ok: boolean, reason?: string}}
 */
export function hybridEligibility(actor, archetype) {
  const sys = actor.system;
  const owned = [sys.attributes.archetype, ...sys.attributes.hybrids].filter(Boolean);
  if ( owned.includes(archetype.id) ) return { ok: false, reason: game.i18n.localize("shiver.Tree.alreadyHave") };
  if ( owned.length >= 3 ) return { ok: false, reason: game.i18n.localize("shiver.Tree.maxArchetypes") };
  const score = k => {
    const a = sys.abilities[k];
    // Permanent points: base points plus tree stat nodes, not temporary effects.
    let skill = a.skill.base;
    let talent = a.talent.base;
    for ( const item of actor.itemTypes.ability ) {
      for ( const r of item.system.automation ?? [] ) {
        if ( r.when ) continue;
        if ( (r.kind === "skillPoints") && (r.skill === k) ) skill += Number(r.amount) || 0;
        if ( (r.kind === "talentPoints") && (r.skill === k) ) talent += Number(r.amount) || 0;
      }
    }
    return skill + (2 * talent);
  };
  const need = archetype.hybrid ?? { skills: [archetype.skill], count: 1 };
  const skills = need.skills === "any" ? Object.keys(CONFIG.shiver.skills) : need.skills;
  const qualifying = skills.filter(k => score(k) >= 5);
  if ( qualifying.length < (need.count ?? 1) ) {
    return { ok: false, reason: game.i18n.format("shiver.Tree.hybridNeeds", {
      n: need.count ?? 1,
      skills: skills.map(k => game.i18n.localize(CONFIG.shiver.skills[k].label)).join(", ")
    }) };
  }
  return { ok: true };
}

/* -------------------------------------------- */

/**
 * The Archetype Tree (p.30): spend one Ability Point per Character Level on connected nodes, starting at Tier 1.
 */
export class ArchetypeTree extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this.archetypeId = options.archetype ?? actor.system.attributes.archetype ?? Object.keys(CONFIG.shiver.archetypes)[0];
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["shiver", "shiver-tree", "themed", "theme-dark"],
    window: { icon: "fa-solid fa-sitemap", resizable: true },
    position: { width: 940, height: 820 },
    actions: {
      selectArchetype: ArchetypeTree.#onSelectArchetype,
      unlockNode: ArchetypeTree.#onUnlock,
      removeNode: ArchetypeTree.#onRemove,
      addHybrid: ArchetypeTree.#onAddHybrid
    }
  };

  /** @override */
  static PARTS = {
    tree: { template: "systems/shiver/templates/apps/archetype-tree.hbs", scrollable: [".tree-scroll"] }
  };

  /** @override */
  get title() {
    return game.i18n.format("shiver.Tree.title", { name: this.actor.name });
  }

  /** @override */
  async _prepareContext(options) {
    const actor = this.actor;
    const sys = actor.system;
    const owned = [sys.attributes.archetype, ...sys.attributes.hybrids].filter(Boolean);
    if ( !owned.includes(this.archetypeId) && owned.length ) this.archetypeId = owned[0];
    const archetype = CONFIG.shiver.archetypes[this.archetypeId];
    const points = sys.attributes.abilityPoints;
    const ownedNodes = new Map(actor.itemTypes.ability.filter(i => i.system.node).map(i => [i.system.node, i]));
    const enforce = game.settings.get("shiver", "enforceTree");

    const nodes = (archetype?.nodes ?? []).map(n => {
      const have = ownedNodes.has(n.id);
      const prereqs = n.prerequisites ?? [];
      const met = !prereqs.length || ((n.prerequisiteMode === "all") ? prereqs.every(p => ownedNodes.has(p)) : prereqs.some(p => ownedNodes.has(p)));
      const available = !have && met && (points.available > 0);
      return {
        ...n,
        have, met, available,
        locked: !have && !available,
        canUnlock: available || (!have && !enforce && game.user.isGM),
        style: `grid-row: ${12 - n.tier}; grid-column: ${Math.round((n.column ?? 0) * 2) + 1} / span 2;`,
        uses: n.uses ? `${n.uses.max ?? 1}× ${game.i18n.localize(CONFIG.shiver.frequencies[n.uses.per] ?? n.uses.per)}` : "",
        actionLabel: n.action && (n.action !== "passive") ? game.i18n.localize(CONFIG.shiver.actionCosts[n.action] ?? n.action) : ""
      };
    });
    const maxColumn = Math.max(2, ...nodes.map(n => Math.round((n.column ?? 0) * 2) + 2));
    const tabs = owned.map(id => ({ id, name: CONFIG.shiver.archetypes[id]?.name ?? id, active: id === this.archetypeId }));
    const hybridOptions = Object.values(CONFIG.shiver.archetypes).filter(a => !owned.includes(a.id)).map(a => {
      const e = hybridEligibility(actor, a);
      return { id: a.id, name: a.name, ok: e.ok, reason: e.reason };
    });
    return {
      actor, archetype, nodes, points, tabs, maxColumn,
      tiers: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(t => ({ tier: t, row: 12 - t })),
      paths: (archetype?.paths ?? []).map(p => ({ ...p, style: `grid-column: ${Math.round((p.column ?? 0) * 2) + 1} / span 2;` })),
      hybridOptions,
      canHybrid: owned.length && (owned.length < 3) && actor.isOwner,
      editable: actor.isOwner,
      isGM: game.user.isGM,
      discrepancies: archetype?.discrepancies ?? []
    };
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#drawLinks();
  }

  /**
   * Draw the lines connecting nodes to their prerequisites.
   */
  #drawLinks() {
    const grid = this.element.querySelector(".tree-grid");
    const svg = this.element.querySelector(".tree-links");
    if ( !grid || !svg ) return;
    const box = grid.getBoundingClientRect();
    svg.setAttribute("width", grid.scrollWidth);
    svg.setAttribute("height", grid.scrollHeight);
    const lines = [];
    const center = (el, edge) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left + (r.width / 2), y: edge === "top" ? r.top - box.top : r.bottom - box.top };
    };
    for ( const el of grid.querySelectorAll(".tree-node[data-node-id]") ) {
      const prereqs = (el.dataset.prereqs || "").split(",").filter(Boolean);
      for ( const p of prereqs ) {
        const from = grid.querySelector(`.tree-node[data-node-id="${p}"]`);
        if ( !from ) continue;
        const a = center(from, "top");
        const b = center(el, "bottom");
        const active = from.classList.contains("have") && el.classList.contains("have");
        lines.push(`<path class="${active ? "active" : ""}" d="M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y}"/>`);
      }
    }
    svg.innerHTML = lines.join("");
  }

  /** @this {ArchetypeTree} */
  static #onSelectArchetype(event, target) {
    this.archetypeId = target.dataset.archetype;
    this.render();
  }

  /** @this {ArchetypeTree} */
  static async #onUnlock(event, target) {
    if ( !this.actor.isOwner || this.#busy ) return;
    this.#busy = true;
    try {
      await ArchetypeTree.#unlock.call(this, target);
    } finally {
      this.#busy = false;
    }
  }

  /** Is a node being unlocked right now? */
  #busy = false;

  /** @this {ArchetypeTree} */
  static async #unlock(target) {
    const archetype = CONFIG.shiver.archetypes[this.archetypeId];
    const node = archetype?.nodes.find(n => n.id === target.closest("[data-node-id]")?.dataset.nodeId);
    if ( !node ) return;
    const enforce = game.settings.get("shiver", "enforceTree");
    const points = this.actor.system.attributes.abilityPoints;
    if ( this.actor.itemTypes.ability.some(i => i.system.node === node.id) ) return;
    if ( enforce || !game.user.isGM ) {
      if ( points.available <= 0 ) return ui.notifications.warn("shiver.Tree.noPoints", { localize: true });
      const owned = new Set(this.actor.itemTypes.ability.map(i => i.system.node));
      const prereqs = node.prerequisites ?? [];
      const met = !prereqs.length || ((node.prerequisiteMode === "all") ? prereqs.every(p => owned.has(p)) : prereqs.some(p => owned.has(p)));
      if ( !met ) return ui.notifications.warn("shiver.Tree.notConnected", { localize: true });
    }
    const extra = await ArchetypeTree.promptChoices(this.actor, node);
    if ( extra === null ) return;
    await this.actor.createEmbeddedDocuments("Item", [nodeItemData(archetype, node, extra)], { shiverTree: true });
    this.render();
  }

  /**
   * Ask the player how to spend a stat node (e.g. +2 Core Skill Points: two to one skill or one to each of two).
   * @param {Actor} actor
   * @param {object} node
   * @returns {Promise<object[]|null>}  Extra rules, or null if cancelled.
   */
  static async promptChoices(actor, node) {
    const c = node.choices;
    if ( !c || !c.type ) return [];
    if ( (c.type === "talentPoints") && c.skill && (c.skill !== "choice") ) return [];
    if ( c.type === "talentPoints" ) {
      const options = Object.entries(CONFIG.shiver.skills).map(([k, v]) => `<option value="${k}">${game.i18n.localize(v.label)}</option>`).join("");
      const skill = await DialogV2.prompt({
        window: { title: node.name },
        content: `<p>${game.i18n.format("shiver.Tree.chooseTalent", { n: c.amount ?? 1 })}</p><div class="form-group"><select name="skill">${options}</select></div>`,
        ok: { callback: (event, button) => button.form.elements.skill.value },
        rejectClose: false
      });
      if ( !skill ) return null;
      return [{ kind: "talentPoints", skill, amount: c.amount ?? 1 }];
    }
    if ( c.type !== "skillPoints" ) return [];
    const amount = c.amount ?? 2;
    const rows = Object.entries(CONFIG.shiver.skills).map(([k, v]) => `<div class="form-group">
      <label>${game.i18n.localize(v.label)} (${actor.system.abilities[k].skill.total})</label>
      <input type="number" name="${k}" value="0" min="0" max="${c.maxPerSkill ?? amount}" step="1"></div>`).join("");
    const result = await DialogV2.prompt({
      window: { title: node.name },
      content: `<p>${game.i18n.format("shiver.Tree.spendPoints", { n: amount })}</p>${rows}`,
      ok: {
        callback: (event, button) => {
          const f = new foundry.applications.ux.FormDataExtended(button.form).object;
          return Object.fromEntries(Object.keys(CONFIG.shiver.skills).map(k => [k, Math.max(0, Number(f[k]) || 0)]));
        }
      },
      rejectClose: false
    });
    if ( !result ) return null;
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    if ( total !== amount ) {
      ui.notifications.warn(game.i18n.format("shiver.Tree.spendExactly", { n: amount }));
      return null;
    }
    return Object.entries(result).filter(([, v]) => v > 0).map(([skill, v]) => ({ kind: "skillPoints", skill, amount: v }));
  }

  /** @this {ArchetypeTree} */
  static async #onRemove(event, target) {
    if ( !this.actor.isOwner ) return;
    const id = target.closest("[data-node-id]")?.dataset.nodeId;
    const item = this.actor.itemTypes.ability.find(i => i.system.node === id);
    if ( !item ) return;
    // Don't strand abilities that rely on this one.
    const dependants = this.actor.itemTypes.ability.filter(i => (i.system.prerequisites ?? []).includes(id));
    const stranded = dependants.filter(d => !(d.system.prerequisites ?? []).some(p => (p !== id)
      && this.actor.itemTypes.ability.some(i => i.system.node === p)));
    if ( stranded.length && game.settings.get("shiver", "enforceTree") ) {
      return ui.notifications.warn(game.i18n.format("shiver.Tree.hasDependants", { names: stranded.map(s => s.name).join(", ") }));
    }
    const ok = await DialogV2.confirm({ window: { title: item.name }, content: `<p>${game.i18n.localize("shiver.Tree.removeConfirm")}</p>` });
    if ( ok ) await item.delete();
    this.render();
  }

  /** @this {ArchetypeTree} */
  static async #onAddHybrid(event, target) {
    const id = target.dataset.archetype;
    const archetype = CONFIG.shiver.archetypes[id];
    if ( !archetype ) return;
    const check = hybridEligibility(this.actor, archetype);
    if ( !check.ok && !game.user.isGM ) return ui.notifications.warn(check.reason);
    // Each hybrid Archetype costs a unique Fatal Flaw (p.79).
    const { default: flaws } = await import("../content/flaws.mjs");
    const have = new Set(this.actor.itemTypes.flaw.map(f => f.flags?.shiver?.sourceId));
    const options = flaws.filter(f => !have.has(f.id)).map(f => `<option value="${f.id}">${f.name}</option>`).join("");
    const flawId = await DialogV2.prompt({
      window: { title: game.i18n.format("shiver.Tree.hybridTitle", { name: archetype.name }) },
      content: `${check.ok ? "" : `<p class="warning">${check.reason}</p>`}<p>${game.i18n.localize("shiver.Tree.fatalFlawPrompt")}</p>
        <div class="form-group"><select name="flaw">${options}</select></div>`,
      ok: { callback: (event, button) => button.form.elements.flaw.value },
      rejectClose: false
    });
    if ( !flawId ) return;
    const flaw = flaws.find(f => f.id === flawId);
    const { flawItemData } = await import("./content-items.mjs");
    await this.actor.createEmbeddedDocuments("Item", [flawItemData(flaw)]);
    await this.actor.update({ "system.attributes.hybrids": [...this.actor.system.attributes.hybrids, id] });
    this.archetypeId = id;
    this.render();
  }
}

/* -------------------------------------------- */

/**
 * Choose an Archetype for a new character: sets the Skill Point tracker, the Deficiency, and grants the Tier 1
 * ability with the first Ability Point (p.28-31).
 * @param {Actor} actor
 */
export async function chooseArchetype(actor) {
  const archetypes = Object.values(CONFIG.shiver.archetypes);
  const options = archetypes.map(a => `<option value="${a.id}">${a.name}</option>`).join("");
  const skills = Object.entries(CONFIG.shiver.skills).map(([k, v]) => `<option value="${k}">${game.i18n.localize(v.label)}</option>`).join("");
  const result = await DialogV2.prompt({
    window: { title: "shiver.Archetype.choose", icon: "fa-solid fa-masks-theater" },
    position: { width: 460 },
    content: `<div class="form-group"><label>${game.i18n.localize("shiver.Archetype.label")}</label><select name="archetype">${options}</select></div>
      <div class="form-group"><label>${game.i18n.localize("shiver.Archetype.deficiency")}</label><select name="deficiency">${skills}</select></div>
      <p class="hint archetype-hint"></p>`,
    render: (event, dialog) => {
      const form = dialog.element.querySelector("form");
      const hint = form.querySelector(".archetype-hint");
      const update = () => {
        const a = CONFIG.shiver.archetypes[form.elements.archetype.value];
        hint.innerHTML = `<strong>${game.i18n.localize("shiver.Archetype.strength")}:</strong> ${foundry.utils.escapeHTML(a.strength ?? "")}<br>
          <strong>${game.i18n.localize("shiver.Archetype.deficiency")}:</strong> ${foundry.utils.escapeHTML(a.deficiency?.text ?? "")}`;
        for ( const opt of form.elements.deficiency.options ) opt.disabled = (a.deficiency?.exclude ?? []).includes(opt.value);
        if ( form.elements.deficiency.selectedOptions[0]?.disabled ) {
          form.elements.deficiency.value = [...form.elements.deficiency.options].find(o => !o.disabled)?.value;
        }
      };
      form.addEventListener("change", update);
      update();
    },
    ok: { callback: (event, button) => ({ archetype: button.form.elements.archetype.value, deficiency: button.form.elements.deficiency.value }) },
    rejectClose: false
  });
  if ( !result ) return;
  const archetype = CONFIG.shiver.archetypes[result.archetype];
  const updates = {
    "system.attributes.archetype": archetype.id,
    "system.attributes.deficiency": result.deficiency,
    "system.attributes.hybrids": []
  };
  for ( const [k, [skill, talent]] of Object.entries(archetype.startingSkills) ) {
    const loss = (k === result.deficiency) ? (archetype.deficiency?.amount ?? 1) : 0;
    updates[`system.abilities.${k}.skill.value`] = Math.max(0, skill - loss);
    updates[`system.abilities.${k}.talent.value`] = talent;
  }
  await actor.update(updates);
  // The first Ability Point always goes to a Tier 1 ability (p.30). The Weird has several to choose from.
  const tier1s = archetype.nodes.filter(n => n.tier === 1);
  let tier1 = tier1s[0];
  if ( tier1s.length > 1 ) {
    const options = tier1s.map(n => `<option value="${n.id}">${foundry.utils.escapeHTML(n.name)} (${foundry.utils.escapeHTML(n.path)})</option>`).join("");
    const id = await DialogV2.prompt({
      window: { title: archetype.name },
      content: `<p>${game.i18n.localize("shiver.Tree.chooseTier1")}</p><div class="form-group"><select name="node">${options}</select></div>`,
      ok: { callback: (e, b) => b.form.elements.node.value },
      rejectClose: false
    });
    tier1 = tier1s.find(n => n.id === id) ?? null;
  }
  if ( tier1 && (actor.system.attributes.level.value >= 1) && !actor.itemTypes.ability.some(i => i.system.node === tier1.id) ) {
    await actor.createEmbeddedDocuments("Item", [nodeItemData(archetype, tier1)], { shiverTree: true });
  }
  return archetype;
}
