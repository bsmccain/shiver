# Shiver
![Foundry v14](https://img.shields.io/badge/foundry-v14-green)

Unofficial SHIVER game system for Foundry VTT (https://foundryvtt.com/).

The SHIVER game is published by Parable Games Ltd. https://www.parablegames.co.uk/

## What it automates

Page numbers refer to the SHIVER Core Rulebook.

- **Skill Checks (p.10-13, p.20).** Skill Dice (`ds`) and Talent Dice (`dt`) with their symbols. The roll dialog builds the Dice Pool in the book's order: Core Skill Points, Talent Points, ability dice, Minor/Major Advantage and Disadvantage, Luck Bank, Fear Status. Combined checks, assists, hidden Challenge Ratings (the Director sets the CR on the card), Critical successes (CR + 2), Full Houses and every symbol rolled are shown on the chat card.
- **Luck (p.20).** Luck symbols bank Luck Points (the Fool banks three). Two Luck symbols can be banked, turned into a success, or used to turn the Doom Clock back.
- **The Doom Clock (p.18-19).** A clock window for everyone, with Director controls. Failed checks tick it by their Strange symbols (assists too), failed Fear Checks add a minute, Weird abilities and cursed items pay their costs. Quarter Past, Half Past, Quarter To and Midnight are announced, the Director's Doom Events are kept off players' screens and whispered to the GM, and once-per-Doom-Quarter and once-per-Doom-Cycle abilities recharge from the clock.
- **Fear (p.96).** Fear Checks, Afraid and Terrified (losing Core Skill Points, minimum 1), steadying your nerve, Fear immunity.
- **The Lifeline (p.14-15).** Wounds, Survivor Mode (Death's Door, the Luck roll each turn, stabilising) and Nightmare Mode (Weakened, Limping, Trauma, death).
- **Armour (p.15, p.151-155).** Armour Slots with 2 HP each, one Skill Die per slot when hit (Luck blocks, Strange blocks and wounds the armour), Heavy armour, destroyed armour losing its abilities, Lifesaver helmets, armour resistances.
- **Damage (p.22-24, p.131).** Strikes against the target's CR (with Steeled, Weakened and Overwhelm), Critical Hits (x2) and Full Houses (x3) with each skill's critical effect, Immune/Resistant/Weak (including Silver and Holy), Pierce/Soul/Corrosive and armour, and the on-hit effect of every damage type with the target's save.
- **Status Effects (p.219).** All of them, with their dice penalties, CR and Speed changes, wounds at the start of each turn, durations and the checks that remove them.
- **Combat (p.21-27).** Combat States (First, Middle, Last) instead of initiative: combatants join in their suggested state, the round runs state by state, characters in the current state take the next turn with Go now, and the tracker can be reordered by dragging; Move/Attack/Interact tracking (two Interacts instead of an Attack, Heavy weapons), Enemy Reactions by Deathcon level, Stealth Strikes, Grapples and Escapes.
- **Characters (p.28-97).** Choosing an Archetype sets the Skill Point tracker, Strength and Deficiency. The Archetype Tree spends one Ability Point per Character Level on connected nodes and handles Hybrid Archetypes and their Fatal Flaws. Abilities, Backgrounds, Flaws, weapons, armour and special items carry automation rules that the roll dialog, damage and combat code apply.
- **Enemies (p.161-194).** NPC sheets with CR, Deathcon, reaction tables, damage modifiers and extra actions; infections advance with the Doom Clock.
- **Director tools.** In the Doom Clock window: request a check with a hidden CR, opposed checks with tie-breaks, group checks, award levels, damage/fall/heal selected tokens, and Act of God rolls.
- **Modules.** Dice So Nice! shows the SHIVER symbols on Skill and Talent Dice, and Dice Tray gets Skill Die and Talent Die buttons.

Compendiums hold the Archetype abilities, Backgrounds, Fatal Flaws, weapons, armour and special items, summarised in our own words with page references. Rebuild them with `node scripts/build-packs.mjs` (needs `@foundryvtt/foundryvtt-cli`).

Engine rule tests: `node --test tests/*.test.mjs`.

#### Legal

SHIVER and all associated names is copyright of Parable Games LTD

This product is an independent production and is not affiliated with Parable Games LTD.

It is published under the SHIVER Third Party License.
