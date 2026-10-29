import { asGM, boundedInt, registerGMOperation, resolveActor, serialize, shortText } from "../socket.mjs";
import { doomMarksCrossed, doomQuarter } from "../dice/pool.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

/**
 * The Doom Clock (p.18-19, p.123-126). Its state lives in the world setting `shiver.doomClock`:
 * - minutes: 0 (Clear) to 60 (Midnight)
 * - cycle:   the Doom Cycle number, starting at 1. The Director starts a new cycle.
 * - fired:   the quarter marks whose Doom Events have already been announced this cycle
 */
export class DoomClock {

  static DEFAULT = { minutes: 0, cycle: 1, fired: [] };

  /** @returns {{minutes: number, cycle: number, fired: number[]}} */
  static get state() {
    const s = game.settings.get("shiver", "doomClock") ?? {};
    return {
      minutes: Math.clamp(Number(s.minutes) || 0, 0, 60),
      cycle: Math.max(1, Number(s.cycle) || 1),
      fired: Array.isArray(s.fired) ? s.fired : []
    };
  }

  static get minutes() {
    return this.state.minutes;
  }

  static get cycle() {
    return this.state.cycle;
  }

  /** The current Doom Quarter index: 0-3 within the cycle, 4 at Midnight. */
  static get quarter() {
    return doomQuarter(this.minutes);
  }

  /**
   * The name of the last mark reached, e.g. "Half Past", or "Clear".
   * @param {number} [minutes]
   * @returns {string}
   */
  static label(minutes = this.minutes) {
    const mark = [60, 45, 30, 15].find(m => minutes >= m);
    return game.i18n.localize(mark ? CONFIG.shiver.doomQuarters[mark] : "shiver.Doom.clear");
  }

  /* -------------------------------------------- */

  /**
   * Move the Doom Clock. Positive values tick it up, negative values turn it back.
   * @param {number} delta
   * @param {object} [context]
   * @param {string} [context.reason]     Why the clock moved, shown in chat
   * @param {string} [context.actorUuid]  The actor responsible, whose Flaws may modify the change
   * @param {boolean} [context.raw]       Skip Flaw modifiers
   * @returns {Promise<object|undefined>}
   */
  static async tick(delta, context = {}) {
    delta = Math.trunc(Number(delta) || 0);
    if ( !delta ) return;
    return asGM("doomTick", { delta, ...context });
  }

  /**
   * Set the Doom Clock to an exact number of minutes (GM only).
   * @param {number} minutes
   */
  static async set(minutes, context = {}) {
    if ( !game.user.isGM ) return;
    return this.tick(Math.clamp(minutes, 0, 60) - this.minutes, { ...context, raw: true });
  }

  /**
   * Reset the clock to Clear and begin a new Doom Cycle (p.19). OPDC abilities recharge.
   */
  static async newCycle() {
    if ( !game.user.isGM ) return;
    const state = this.state;
    const next = { minutes: 0, cycle: state.cycle + 1, fired: [] };
    await game.settings.set("shiver", "doomClock", next);
    await ChatMessage.create({
      content: `<div class="shiver-card shiver-doom-log"><i class="fa-solid fa-clock-rotate-left"></i> ${
        game.i18n.format("shiver.Doom.newCycle", { cycle: next.cycle })}</div>`,
      speaker: { alias: game.i18n.localize("shiver.Doom.title") }
    });
    Hooks.callAll("shiver.doomCycle", next);
  }

  /* -------------------------------------------- */

  /**
   * GM handler: apply a change to the Doom Clock.
   * @param {object} data
   * @returns {Promise<{from: number, to: number, delta: number}>}
   */
  static async _onTick({ delta, reason = "", actorUuid = null, raw = false }) {
    const state = this.state;
    const actor = actorUuid ? await fromUuid(actorUuid) : null;

    // Character Flaws can change how much the clock moves (e.g. The Curse doubles increases, p.79).
    if ( actor && !raw ) {
      const mods = { delta, notes: [] };
      for ( const rule of actor.automationRules?.() ?? [] ) {
        if ( rule.kind !== "doomModifier" ) continue;
        if ( (mods.delta > 0) && (rule.multiplyIncrease) ) {
          mods.delta *= rule.multiplyIncrease;
          mods.notes.push(rule.item?.name);
        }
        if ( (mods.delta < 0) && rule.noTickBack ) {
          mods.delta = 0;
          mods.notes.push(rule.item?.name);
        }
      }
      if ( mods.notes.length ) reason = `${reason} (${mods.notes.filter(Boolean).join(", ")})`;
      delta = mods.delta;
    }

    const from = state.minutes;
    let to = Math.clamp(from + delta, 0, 60);
    if ( (from >= 60) && (delta > 0) && (game.settings.get("shiver", "doomAtMidnight") === "cycle") ) {
      await this.newCycle();
      return this._onTick({ delta, reason, raw: true, actorUuid });
    }
    const applied = to - from;
    const marks = doomMarksCrossed(from, to).filter(m => !state.fired.includes(m));
    const next = { minutes: to, cycle: state.cycle, fired: [...state.fired, ...marks] };
    if ( applied || marks.length ) await game.settings.set("shiver", "doomClock", next);

    // Log the change.
    const sign = applied > 0 ? "+" : "";
    const who = actor ? `${actor.name}: ` : "";
    const lines = [];
    if ( applied ) {
      lines.push(`<i class="fa-solid fa-clock"></i> ${game.i18n.format("shiver.Doom.changed", {
        delta: `${sign}${applied}`, minutes: to })}${reason ? ` <span class="reason">${who}${reason}</span>` : ""}`);
    }
    else if ( delta ) {
      lines.push(`<i class="fa-solid fa-clock"></i> ${game.i18n.localize(delta > 0 ? "shiver.Doom.atMidnight" : "shiver.Doom.atClear")}${
        reason ? ` <span class="reason">${who}${reason}</span>` : ""}`);
    }
    if ( lines.length ) {
      await ChatMessage.create({
        content: `<div class="shiver-card shiver-doom-log">${lines.join("<br>")}</div>`,
        speaker: { alias: game.i18n.localize("shiver.Doom.title") }
      });
    }

    // Announce Doom Events at each newly reached quarter (p.18).
    for ( const mark of marks ) await this._announceQuarter(mark, next.cycle);
    return { from, to, delta: applied };
  }

  /**
   * Announce a Doom Event. Everyone learns the mark was reached; only the GM sees the event the Director prepared.
   * @param {number} mark
   * @param {number} cycle
   */
  static async _announceQuarter(mark, cycle) {
    const name = game.i18n.localize(CONFIG.shiver.doomQuarters[mark]);
    await ChatMessage.create({
      content: `<div class="shiver-card shiver-doom-event mark-${mark}">
        <h3><i class="fa-solid fa-skull"></i> ${name}</h3>
        <p>${game.i18n.localize(mark === 60 ? "shiver.Doom.midnightReached" : "shiver.Doom.quarterReached")}</p>
      </div>`,
      speaker: { alias: game.i18n.localize("shiver.Doom.title") }
    });
    const events = game.settings.get("shiver", "doomEvents") ?? {};
    const text = events[mark];
    if ( text ) {
      await ChatMessage.create({
        content: `<div class="shiver-card shiver-doom-event gm"><h3>${name}: ${
          game.i18n.localize("shiver.Doom.eventFor")}</h3><p>${foundry.utils.escapeHTML(text)}</p></div>`,
        speaker: { alias: game.i18n.localize("shiver.Doom.title") },
        whisper: game.users.filter(u => u.isGM).map(u => u.id)
      });
    }
    Hooks.callAll("shiver.doomQuarter", { mark, quarter: doomQuarter(mark), cycle });
  }

  /* -------------------------------------------- */

  /**
   * Register settings, the GM operation, and the HUD.
   */
  static register() {
    game.settings.register("shiver", "doomClock", {
      scope: "world",
      config: false,
      type: Object,
      default: this.DEFAULT,
      onChange: value => {
        ui.shiverDoom?.render();
        Hooks.callAll("shiver.doomChanged", value);
      }
    });
    game.settings.register("shiver", "doomEvents", {
      scope: "world",
      config: false,
      type: Object,
      default: { 15: "", 30: "", 45: "", 60: "" }
    });
    game.settings.register("shiver", "showDoomClock", {
      name: "shiver.Settings.showDoomClock.name",
      hint: "shiver.Settings.showDoomClock.hint",
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
      onChange: show => show ? ui.shiverDoom?.render({ force: true }) : ui.shiverDoom?.close()
    });
    game.settings.register("shiver", "doomClockPosition", {
      scope: "client",
      config: false,
      type: Object,
      default: {}
    });
    // Rules tick the clock by a few minutes at a time. Only a GM can move it without the actor's Flaws applying (a
    // Director change or setting the clock), and a player can't move it more than a full cycle at once.
    registerGMOperation("doomTick", async ({ delta, reason, actorUuid, raw }, user) => {
      const minutes = boundedInt(delta, -60, 60, "Doom Clock change");
      let actor = null;
      if ( actorUuid ) actor = await resolveActor(actorUuid);
      return serialize("doom", () => this._onTick({
        delta: minutes, reason: shortText(reason), actorUuid: actor?.uuid ?? null, raw: user.isGM && (raw === true)
      }));
    });
  }
}

/* -------------------------------------------- */

/**
 * The Doom Clock display: a 60-minute dial with the four quarters. The Director gets controls to move it.
 */
export class DoomClockHUD extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "shiver-doom-clock",
    classes: ["shiver", "shiver-doom-hud", "themed", "theme-dark"],
    window: {
      title: "shiver.Doom.title",
      icon: "fa-solid fa-clock",
      minimizable: true,
      resizable: false
    },
    position: { width: 210, height: "auto" },
    actions: {
      tick: DoomClockHUD.#onTick,
      newCycle: DoomClockHUD.#onNewCycle,
      setMinutes: DoomClockHUD.#onSetMinutes,
      editEvents: DoomClockHUD.#onEditEvents,
      tool: DoomClockHUD.#onTool
    }
  };

  /** @override */
  static PARTS = {
    clock: { template: "systems/shiver/templates/apps/doom-clock.hbs" }
  };

  /** @inheritDoc */
  _initializeApplicationOptions(options) {
    const opts = super._initializeApplicationOptions(options);
    const saved = game.settings.get("shiver", "doomClockPosition") ?? {};
    if ( Number.isFinite(saved.left) ) opts.position.left = saved.left;
    else opts.position.left = Math.max(120, window.innerWidth - 560);
    if ( Number.isFinite(saved.top) ) opts.position.top = saved.top;
    else opts.position.top = 70;
    return opts;
  }

  /** @inheritDoc */
  setPosition(position) {
    const pos = super.setPosition(position);
    if ( this.rendered ) {
      this.#savePosition ??= foundry.utils.debounce(p => {
        game.settings.set("shiver", "doomClockPosition", { left: p.left, top: p.top });
      }, 500);
      this.#savePosition(pos);
    }
    return pos;
  }

  #savePosition;

  /** @override */
  async _prepareContext(options) {
    const { minutes, cycle } = DoomClock.state;
    const quarter = doomQuarter(minutes);
    const r = 46;
    const cx = 60;
    const cy = 60;

    // A filled wedge from 12 o'clock to the current minute.
    const angle = (minutes / 60) * Math.PI * 2;
    const x = cx + (r * Math.sin(angle));
    const y = cy - (r * Math.cos(angle));
    const large = minutes > 30 ? 1 : 0;
    let wedge = "";
    if ( minutes >= 60 ) wedge = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
    else if ( minutes > 0 ) wedge = `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;

    const ticks = Array.from({ length: 60 }, (_, i) => {
      const a = (i / 60) * Math.PI * 2;
      const major = (i % 15) === 0;
      const inner = major ? r - 10 : r - 4;
      return {
        x1: (cx + (inner * Math.sin(a))).toFixed(2), y1: (cy - (inner * Math.cos(a))).toFixed(2),
        x2: (cx + (r * Math.sin(a))).toFixed(2), y2: (cy - (r * Math.cos(a))).toFixed(2),
        major, passed: i < minutes
      };
    });
    const hand = {
      x: (cx + ((r - 6) * Math.sin(angle))).toFixed(2),
      y: (cy - ((r - 6) * Math.cos(angle))).toFixed(2)
    };
    const nextMark = [15, 30, 45, 60].find(m => m > minutes);
    return {
      minutes, cycle, quarter, wedge, ticks, hand, cx, cy, r,
      label: DoomClock.label(minutes),
      quarterLabel: quarter >= 4 ? game.i18n.localize("shiver.Doom.midnight")
        : game.i18n.format("shiver.Doom.quarterN", { n: quarter + 1 }),
      toNext: nextMark ? nextMark - minutes : null,
      nextLabel: nextMark ? game.i18n.localize(CONFIG.shiver.doomQuarters[nextMark]) : null,
      midnight: minutes >= 60,
      isGM: game.user.isGM
    };
  }

  /** @this {DoomClockHUD} */
  static async #onTick(event, target) {
    const delta = Number(target.dataset.delta) || 0;
    await DoomClock.tick(delta, { reason: game.i18n.localize("shiver.Doom.directorChange"), raw: true });
  }

  /** @this {DoomClockHUD} */
  static async #onNewCycle() {
    const ok = await DialogV2.confirm({
      window: { title: "shiver.Doom.newCycleTitle" },
      content: `<p>${game.i18n.localize("shiver.Doom.newCycleConfirm")}</p>`
    });
    if ( ok ) await DoomClock.newCycle();
  }

  /** @this {DoomClockHUD} */
  static async #onSetMinutes() {
    const value = await DialogV2.prompt({
      window: { title: "shiver.Doom.setTitle" },
      content: `<div class="form-group"><label>${game.i18n.localize("shiver.Doom.minutes")}</label>
        <input type="number" name="minutes" min="0" max="60" value="${DoomClock.minutes}" autofocus></div>`,
      ok: { callback: (event, button) => button.form.elements.minutes.valueAsNumber }
    });
    if ( Number.isFinite(value) ) await DoomClock.set(value, { reason: game.i18n.localize("shiver.Doom.directorChange") });
  }

  /** @this {DoomClockHUD} */
  static async #onTool(event, target) {
    return game.shiver.tools?.[target.dataset.tool]?.();
  }

  /** @this {DoomClockHUD} */
  static async #onEditEvents() {
    const events = game.settings.get("shiver", "doomEvents") ?? {};
    const rows = [15, 30, 45, 60].map(m => `<div class="form-group stacked">
      <label>${game.i18n.localize(CONFIG.shiver.doomQuarters[m])} (:${m})</label>
      <textarea name="m${m}" rows="2">${foundry.utils.escapeHTML(events[m] ?? "")}</textarea></div>`).join("");
    const result = await DialogV2.prompt({
      window: { title: "shiver.Doom.eventsTitle", icon: "fa-solid fa-skull" },
      position: { width: 460 },
      content: `<p class="hint">${game.i18n.localize("shiver.Doom.eventsHint")}</p>${rows}`,
      ok: {
        label: "shiver.Save",
        callback: (event, button) => {
          const f = button.form.elements;
          return { 15: f.m15.value, 30: f.m30.value, 45: f.m45.value, 60: f.m60.value };
        }
      }
    });
    if ( result ) await game.settings.set("shiver", "doomEvents", result);
  }
}
