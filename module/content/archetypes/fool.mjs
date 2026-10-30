export default {
  id: "fool",
  name: "The Fool",
  skill: "luck",
  page: 56,
  hybrid: { skills: ["luck"], count: 1 },
  startingSkills: { grit: [3, 0], wit: [3, 0], smarts: [3, 0], heart: [3, 0], luck: [5, 1], strange: [3, 0] },
  strength: "Start with 1 Talent Point in Luck (+1 Talent Die on Luck Checks) and 5 Core Skill Points in Luck, as shown on the tracker.",
  deficiency: { exclude: ["luck"], amount: 1, text: "Remove 1 Core Skill Point from one Core Skill other than Luck (3 to 2)." },
  special: [],
  paths: [
    { id: "last-chancer", name: "Last Chancer", column: 0.5 },
    { id: "accumulator", name: "Accumulator", column: 2 },
    { id: "blessed", name: "Blessed", column: 3.5 }
  ],
  nodes: [
    // Tier 1
    {
      id: "fool-banking-on-it", name: "Banking On It", tier: 1, path: "core", column: 2,
      prerequisites: [], prerequisiteMode: "any", kind: "ability",
      page: 56, action: "passive", uses: null, doom: 0,
      summary: "Your Luck Bank can hold up to 3 Luck Points (normally 1).",
      automation: [
        { kind: "luckBankMax", amount: 3 }
      ]
    },

    // Tier 2
    {
      id: "fool-murphys-law", name: "Murphy's Law", tier: 2, path: "last-chancer", column: 0.5,
      prerequisites: ["fool-banking-on-it"], prerequisiteMode: "any", kind: "ability",
      page: 57, action: "reaction", uses: null, doom: 0,
      summary: "When targeted by an attack you may roll 1 Skill Die. On a Luck symbol the attack misses (no damage) and you bank 1 Luck Point.",
      automation: [
        { kind: "luck", amount: 1 },
        { kind: "custom", note: "When targeted by an attack, roll 1 Skill Die (/r 1ds). On a Luck symbol the attack misses: tell the Director, then click Use to bank the Luck Point." }
      ]
    },
    {
      id: "fool-clock-it-back", name: "Clock It Back", tier: 2, path: "accumulator", column: 2,
      prerequisites: ["fool-banking-on-it"], prerequisiteMode: "any", kind: "ability",
      page: 57, action: "free", uses: null, doom: 0,
      summary: "Spend 1 Luck Point (a Luck symbol just rolled or a banked point) to turn the Doom Clock back 1 minute, instead of needing 2 Luck symbols.",
      automation: [
        { kind: "cost", luck: 1 },
        { kind: "doom", amount: -1 },
        { kind: "custom", note: "Use spends 1 banked Luck Point. To spend a Luck symbol you just rolled, Use after the check resolves; if that symbol was lost to a full bank, add 1 back to your bank afterwards." }
      ]
    },
    {
      id: "fool-idiot-savant", name: "Idiot Savant", tier: 2, path: "blessed", column: 3.5,
      prerequisites: ["fool-banking-on-it"], prerequisiteMode: "any", kind: "ability",
      page: 57, action: "passive", uses: null, doom: 0,
      summary: "On Smarts Checks you may re-roll any dice showing a Luck symbol.",
      automation: [
        { kind: "custom", note: "Smarts Checks: you may re-roll any dice that show a Luck symbol." }
      ]
    },

    // Tier 3
    {
      id: "fool-cashing-in", name: "Cashing In", tier: 3, path: "last-chancer", column: 0.5,
      prerequisites: ["fool-murphys-law"], prerequisiteMode: "any", kind: "ability",
      page: 57, action: "interact", uses: null, doom: 0,
      summary: "Spend 3 banked Luck Points to heal yourself 1 wound.",
      automation: [
        { kind: "cost", luck: 3 },
        { kind: "heal", amount: 1, target: "self" }
      ]
    },
    {
      id: "fool-loveable-fool", name: "Loveable Fool", tier: 3, path: "accumulator", column: 1.5,
      prerequisites: ["fool-clock-it-back"], prerequisiteMode: "any", kind: "ability",
      page: 57, action: "passive", uses: null, doom: 0,
      summary: "On Heart Checks you may re-roll any dice showing a Luck symbol.",
      automation: [
        { kind: "custom", note: "Heart Checks: you may re-roll any dice that show a Luck symbol." }
      ]
    },
    {
      id: "fool-clumsily-covert", name: "Clumsily Covert", tier: 3, path: "accumulator", column: 2.5,
      prerequisites: ["fool-clock-it-back"], prerequisiteMode: "any", kind: "ability",
      page: 57, action: "free", uses: { per: "encounter", max: 1 }, doom: 0,
      summary: "At the start of a Combat Encounter, roll a Luck Check with CR equal to the highest enemy CR in the combat. On a success you begin the encounter in Stealth.",
      automation: [
        {
          kind: "check", skill: "luck", cr: null, label: "Start of the Combat Encounter; CR = the highest enemy CR in the combat",
          onSuccess: "You begin the Combat Encounter in Stealth.", onFail: "No effect.",
          success: [{ kind: "applyStatus", status: "stealth", target: "self" }]
        }
      ]
    },
    {
      id: "fool-dodgy-probability", name: "Dodgy Probability", tier: 3, path: "blessed", column: 3.5,
      prerequisites: ["fool-idiot-savant"], prerequisiteMode: "any", kind: "ability",
      page: 57, action: "passive", uses: null, doom: 0,
      summary: "When rolling to evade traps or environmental hazards you may roll your Luck Pool instead of Wit.",
      automation: [
        { kind: "custom", note: "Evading a trap or environmental hazard: you may switch the check from Wit to Luck in the roll dialog." }
      ]
    },

    // Tier 4
    {
      id: "fool-luck-drain", name: "Luck Drain", tier: 4, path: "last-chancer", column: 0.5,
      prerequisites: ["fool-cashing-in"], prerequisiteMode: "any", kind: "ability",
      page: 58, action: "reaction", uses: null, doom: 0,
      summary: "When targeted by an attack you may roll 1 Skill Die. On a Luck symbol the attacker is Cursed and has Minor Disadvantage on its next Combat Turn, and you add +1 Talent Die to every Skill Check you make on your next Combat Turn.",
      automation: [
        { kind: "applyStatus", status: "cursed", target: "enemy" },
        { kind: "poolDice", skill: "any", d8: 1, when: { manual: true, label: "During your next Combat Turn after a Luck Drain success" } },
        { kind: "custom", note: "When targeted by an attack, roll 1 Skill Die (/r 1ds). On a Luck symbol, target the attacker and click Use to Curse it; it also has Minor Disadvantage (-1 Skill Die) on its next Combat Turn. Tick the +1 Talent Die on your checks during your next Combat Turn." }
      ]
    },
    {
      id: "fool-fluky-fortress", name: "Fluky Fortress", tier: 4, path: "accumulator", column: 2,
      prerequisites: ["fool-loveable-fool", "fool-clumsily-covert"], prerequisiteMode: "any", kind: "ability",
      page: 58, action: "reaction", uses: null, doom: 0,
      summary: "Spend 1 banked Luck Point to stop 1 damage to an ally within 10 ft.",
      automation: [
        { kind: "cost", luck: 1 },
        { kind: "custom", note: "When an ally within 10 ft would take damage: each Use spends 1 Luck Point and prevents 1 of that damage (reduce it before applying)." }
      ]
    },
    {
      id: "fool-bumbling-presence", name: "Bumbling Presence", tier: 4, path: "blessed", column: 3.5,
      prerequisites: ["fool-dodgy-probability"], prerequisiteMode: "any", kind: "ability",
      page: 58, action: "free", uses: { per: "turn", max: 1 }, doom: 0,
      summary: "Start of your Combat Turn, while in a Brawl: you may make a Luck Check against the CR of the enemy you're Brawling. Success lets you Escape without that enemy getting its free Attack Action.",
      automation: [
        { kind: "check", skill: "luck", cr: null, label: "Start of your Combat Turn in a Brawl; CR = that enemy's CR", onSuccess: "You may Escape the Brawl without granting that enemy an Attack Action.", onFail: "No effect." },
        { kind: "custom", note: "On a success you may Escape this turn. If you do, the enemy you were Brawling doesn't get its free Attack Action, even though the Escape card lists it." }
      ]
    },

    // Tier 5
    {
      id: "fool-core-plus-last-chancer", name: "+2 Core Points", tier: 5, path: "last-chancer", column: 0.5,
      prerequisites: ["fool-luck-drain"], prerequisiteMode: "any", kind: "bonus",
      page: 58, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to hybridise (p.78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "fool-core-plus-accumulator", name: "+2 Core Points", tier: 5, path: "accumulator", column: 2,
      prerequisites: ["fool-fluky-fortress"], prerequisiteMode: "any", kind: "bonus",
      page: 58, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to hybridise (p.78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "fool-core-plus-blessed", name: "+2 Core Points", tier: 5, path: "blessed", column: 3.5,
      prerequisites: ["fool-bumbling-presence"], prerequisiteMode: "any", kind: "bonus",
      page: 58, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to hybridise (p.78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },

    // Tier 6
    {
      id: "fool-splash-back", name: "Splash-Back", tier: 6, path: "last-chancer", column: 0.5,
      prerequisites: ["fool-core-plus-last-chancer"], prerequisiteMode: "any", kind: "ability",
      page: 58, action: "reaction", uses: null, doom: 0,
      summary: "When targeted by an attack you may roll 1 Skill Die. On a Luck symbol, half the Strike's damage (rounded down) is dealt to the attacker instead of you.",
      automation: [
        { kind: "custom", note: "When targeted by an attack, roll 1 Skill Die (/r 1ds). On a Luck symbol, half the Strike's damage (rounded down) goes to the attacker instead of you; the Director splits the damage." }
      ]
    },
    {
      id: "fool-rubbing-off-on-you", name: "Rubbing Off On You", tier: 6, path: "accumulator", column: 2,
      prerequisites: ["fool-core-plus-accumulator"], prerequisiteMode: "any", kind: "ability",
      page: 58, action: "passive", uses: null, doom: 0,
      summary: "Allies within 15 ft of you may re-roll 1 die showing a Luck symbol on their Skill Checks.",
      automation: [
        { kind: "custom", note: "Allies within 15 ft of you may re-roll 1 die showing a Luck symbol on their Skill Checks." }
      ]
    },
    {
      id: "fool-ignorance-is-bliss", name: "Ignorance Is Bliss", tier: 6, path: "blessed", column: 3,
      prerequisites: ["fool-core-plus-blessed"], prerequisiteMode: "any", kind: "ability",
      page: 58, action: "passive", uses: null, doom: 0,
      summary: "Roll Luck instead of the normal Core Skill on checks against Fear, being Intimidated, Confusion, and any other check the Director rules you're too oblivious to notice.",
      automation: [
        { kind: "custom", note: "Resisting Intimidation, Confusion and other checks the Director allows: switch the skill to Luck in the roll dialog. The Fear Check dialog can't change skill, so roll a Luck Check from your sheet instead and have the Director apply the Fear result." }
      ]
    },
    {
      id: "fool-intoxicating-knowledge", name: "Intoxicating Knowledge", tier: 6, path: "blessed", column: 4,
      prerequisites: ["fool-core-plus-blessed"], prerequisiteMode: "any", kind: "ability",
      page: 58, action: "passive", uses: null, doom: 0,
      summary: "Investigation Smarts Checks may roll Luck instead (the Director may make the result vague). +1 Talent Die on checks to resist poisons and toxins, whether helpful or harmful.",
      automation: [
        { kind: "poolDice", skill: "any", d8: 1, when: { manual: true, label: "Resisting the effects of poison or toxins" } },
        { kind: "custom", note: "Smarts Checks to investigate your surroundings: you may switch to your Luck Pool, but the Director may make the information hazy." }
      ]
    },

    // Tier 7
    {
      id: "fool-fools-intuition", name: "Fool's Intuition", tier: 7, path: "last-chancer", column: 0,
      prerequisites: ["fool-splash-back"], prerequisiteMode: "any", kind: "ability",
      page: 59, action: "passive", uses: null, doom: 0,
      summary: "On Skill Checks outside Combat (not Luck Checks) you may re-roll 1 die showing a Luck symbol as a Talent Die.",
      automation: [
        { kind: "custom", note: "Non-Luck Skill Checks outside Combat: you may re-roll 1 die showing a Luck symbol, rolling a Talent Die in its place." }
      ]
    },
    {
      id: "fool-what-are-the-chances", name: "What Are The Chances?", tier: 7, path: "last-chancer", column: 1,
      prerequisites: ["fool-splash-back"], prerequisiteMode: "any", kind: "ability",
      page: 59, action: "free", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, use Luck in place of the Core Skill for any one Skill Check.",
      automation: [
        { kind: "custom", note: "Use to spend this Doom Quarter's use, then switch the skill to Luck in that check's roll dialog. Strike and Fear Check dialogs can't change skill: for a Strike, tick Luck under the weapon's Alternative Skills first; for a Fear Check, roll a Luck Check from your sheet and have the Director apply the result." }
      ]
    },
    {
      id: "fool-lucky-shot", name: "Lucky Shot", tier: 7, path: "accumulator", column: 2,
      prerequisites: ["fool-rubbing-off-on-you"], prerequisiteMode: "any", kind: "ability",
      page: 59, action: "free", uses: null, doom: 0,
      summary: "When your Strike is a Critical Hit, roll a Luck Check against the enemy's CR. On a success deal triple damage instead of double; on a Full House deal quadruple damage.",
      automation: [
        { kind: "check", skill: "luck", cr: null, label: "After one of your Strikes is a Critical Hit; CR = that enemy's CR", onSuccess: "Triple damage instead of double (quadruple on a Full House).", onFail: "Normal Critical Hit damage." },
        { kind: "custom", note: "On a success, the Director deals the difference by hand so the Strike totals triple its base damage (quadruple on a Full House). The extra depends on the weapon, so it isn't applied automatically." }
      ]
    },
    {
      id: "fool-insurance-policy", name: "Insurance Policy", tier: 7, path: "blessed", column: 3.5,
      prerequisites: ["fool-ignorance-is-bliss", "fool-intoxicating-knowledge"], prerequisiteMode: "any", kind: "ability",
      page: 59, action: "passive", uses: null, doom: 0,
      summary: "While your Luck Bank holds 3 Luck Points you are Steeled.",
      automation: [
        { kind: "applyStatus", status: "steeled", target: "self" },
        { kind: "custom", note: "Steeled only while your Luck Bank holds 3 Luck Points: Use to apply Steeled when the bank fills, and remove it as soon as it drops below 3." }
      ]
    },

    // Tier 8
    {
      id: "fool-talent-plus-last-chancer", name: "+1 Luck Talent Point", tier: 8, path: "last-chancer", column: 0.5,
      prerequisites: ["fool-fools-intuition", "fool-what-are-the-chances"], prerequisiteMode: "any", kind: "bonus",
      page: 59, action: "passive", uses: null, doom: 0,
      summary: "Add 1 Talent Point to Luck.",
      automation: [
        { kind: "talentPoints", skill: "luck", amount: 1 }
      ]
    },
    {
      id: "fool-talent-plus-accumulator", name: "+1 Luck Talent Point", tier: 8, path: "accumulator", column: 2,
      prerequisites: ["fool-lucky-shot"], prerequisiteMode: "any", kind: "bonus",
      page: 59, action: "passive", uses: null, doom: 0,
      summary: "Add 1 Talent Point to Luck.",
      automation: [
        { kind: "talentPoints", skill: "luck", amount: 1 }
      ]
    },
    {
      id: "fool-talent-plus-blessed", name: "+1 Luck Talent Point", tier: 8, path: "blessed", column: 3.5,
      prerequisites: ["fool-insurance-policy"], prerequisiteMode: "any", kind: "bonus",
      page: 59, action: "passive", uses: null, doom: 0,
      summary: "Add 1 Talent Point to Luck.",
      automation: [
        { kind: "talentPoints", skill: "luck", amount: 1 }
      ]
    },

    // Tier 9
    {
      id: "fool-dimwitted-defence", name: "Dimwitted Defence", tier: 9, path: "last-chancer", column: 0.5,
      prerequisites: ["fool-talent-plus-last-chancer"], prerequisiteMode: "any", kind: "ability",
      page: 59, action: "reaction", uses: null, doom: 0,
      summary: "When targeted by an attack you may roll up to as many Skill Dice as you have banked Luck Points. If any shows a Luck symbol you take no damage from that attack. Lose 1 banked Luck Point per die rolled, whatever the result.",
      automation: [
        { kind: "cost", luck: 1 },
        { kind: "custom", note: "When targeted by an attack, choose N up to your banked Luck Points and roll N Skill Dice (/r Nds). Any Luck symbol: you take no damage from that attack. Click Use once per die rolled to pay 1 Luck Point each, whatever the result." }
      ]
    },
    {
      id: "fool-making-it-rain", name: "Making It Rain", tier: 9, path: "accumulator", column: 2,
      prerequisites: ["fool-talent-plus-accumulator"], prerequisiteMode: "any", kind: "ability",
      page: 59, action: "free", uses: null, doom: 0,
      summary: "Spend 3 banked Luck Points to gain 1 extra Attack Action on your next Combat Turn.",
      automation: [
        { kind: "cost", luck: 3 },
        { kind: "extraActions", action: "attack", amount: 1, when: { manual: true, label: "Your next Combat Turn after paying 3 Luck Points for Making It Rain" } },
        { kind: "custom", note: "The extra Attack Action is only for your next Combat Turn after you Use this. The combat tracker allows it on every turn, so only take it then." }
      ]
    },
    {
      id: "fool-domino-effect", name: "Domino Effect", tier: 9, path: "blessed", column: 3.5,
      prerequisites: ["fool-talent-plus-blessed"], prerequisiteMode: "any", kind: "ability",
      page: 59, action: "passive", uses: null, doom: 0,
      summary: "Each successful Strike forces the target to make a CR 1 Luck Check. On a fail it's flung into the nearest enemy, goes Prone and takes 2 Blunt damage; that enemy then makes the same CR 1 check and the chain continues on each fail. With no enemy to hit, the Director improvises (terrain or a Status Effect).",
      automation: [
        {
          kind: "strikeMode", label: "Domino Effect",
          onHit: [
            { kind: "onHit", status: "prone", save: { skill: "luck", cr: 1 }, note: "Domino Effect: if the CR 1 Luck save fails, the enemy also takes 2 Blunt damage and crashes into the nearest enemy, which makes its own CR 1 Luck Check (repeat on a failure)." }
          ]
        },
        { kind: "custom", note: "Applies to every successful Strike: pick the Domino Effect mode when you Strike with a weapon. Deal the 2 Blunt damage and run the chain by hand; with no enemy nearby the Director improvises." }
      ]
    },

    // Tier 10
    {
      id: "fool-witless-warrior", name: "Witless Warrior", tier: 10, path: "last-chancer", column: 0.5,
      prerequisites: ["fool-dimwitted-defence"], prerequisiteMode: "any", kind: "ability",
      page: 60, action: "passive", uses: null, doom: 0,
      summary: "All your weapon Strikes roll Luck in place of the weapon's Core Skill.",
      automation: [
        { kind: "custom", note: "Tick Luck under Alternative Skills on each weapon's item sheet, then choose Luck in the Strike dialog. The Strike then rolls your Luck Pool, counts Luck symbols as successes and uses the Luck Critical Hit effect." }
      ]
    },
    {
      id: "fool-jackpot", name: "Jackpot", tier: 10, path: "accumulator", column: 2,
      prerequisites: ["fool-making-it-rain"], prerequisiteMode: "any", kind: "ability",
      page: 60, action: "passive", uses: null, doom: 0,
      summary: "Spending a banked Luck Point on a Skill Check adds +1 Talent Die instead of +1 Skill Die (only 1 Luck Point per check this way). When you spend Luck to turn the Doom Clock back, it goes back 1 extra minute.",
      automation: [
        { kind: "poolDice", skill: "any", d6: -1, d8: 1, when: { manual: true, label: "Spent 1 Luck Point on this check (Talent Die instead of Skill Die)" } },
        { kind: "doom", amount: -1 },
        { kind: "custom", note: "Tick the Jackpot bonus when you spend a Luck Point on a check (only 1 point per check converts). Right after spending Luck to turn the Doom Clock back (Clock It Back or two Luck symbols), Use Jackpot to turn it back 1 more minute." }
      ]
    },
    {
      id: "fool-suffer-the-fool", name: "Suffer The Fool", tier: 10, path: "blessed", column: 3.5,
      prerequisites: ["fool-domino-effect"], prerequisiteMode: "any", kind: "ability",
      page: 60, action: "passive", uses: null, doom: 0,
      summary: "On a non-Luck Skill Check made as part of an Attack Action, you may re-roll dice that show a Luck symbol as Talent Dice.",
      automation: [
        { kind: "custom", note: "Non-Luck Skill Checks made as part of an Attack Action: you may re-roll dice showing a Luck symbol as Talent Dice." }
      ]
    }
  ],
  discrepancies: [
    "Murphy's Law (p.57) says the Luck Point goes into 'their' Luck Bank; enemies have no Luck Bank, so it is treated as the Fool's own.",
    "Murphy's Law, Luck Drain, Splash-Back and Dimwitted Defence all trigger when targeted by an attack. The book does not say whether several can be used on the same attack or whether one die can serve more than one; treated as separate rolls.",
    "Action costs are not stated for the Fool's abilities. Cashing In is set to Interact because p.22 lists healing yourself as an Interact Action. The triggered ones are set as free or reaction. Insurance Policy and Jackpot are passive; their Use button (apply Steeled / extra Doom minute) costs no action.",
    "Murphy's Law, Luck Drain, Splash-Back and Dimwitted Defence roll bare Skill Dice, not Skill Checks, so they are left as manual rolls. An ability check card would roll a full Dice Pool, tick the Doom Clock when a failed roll shows a Strange symbol, and bank any Luck symbol. The book asks for none of that (apart from Murphy's Law's Luck Point).",
    "Bumbling Presence does not say whether the Escape still uses an Interact or Attack Action (p.22). Some other trees say so explicitly, this one does not.",
    "Luck Drain applies Cursed (p.219: removed by killing the enemy that created it) with no duration, which is odd when the Fool is the source. Director's call on when it ends.",
    "Splash-Back: read as the Fool taking the other half of the damage (rounded up).",
    "Lucky Shot: unclear whether the Full House means the Strike or the Luck Check, and whether a Full House Strike needs the Luck Check at all. A Full House is not always a Critical Hit (p.24).",
    "Domino Effect: 'They are knocked Prone and dealt 2 Blunt damage' may mean only the enemy that failed or also the enemy it crashes into. The automation applies Prone only to the enemy that failed.",
    "Re-roll abilities (Idiot Savant, Loveable Fool, Rubbing Off On You, Fool's Intuition, Suffer The Fool) do not say whether the original Luck symbol still banks a Luck Point. Suffer The Fool does not say whether it re-rolls one die or all of them.",
    "Jackpot limits converting Luck to Talent Dice to 1 Luck Point per check, but the base rules (p.11, p.20) never cap Luck spent per check. Unclear whether more points can still be spent for Skill Dice.",
    "Witless Warrior: assumed a Critical Hit then uses the Luck critical effect (p.24), since Luck is the skill used for the Strike.",
    "p.56 has no separate Deficiency heading; the text sits under Strength. The Strength text mentions only the Talent Point; the tracker shows Luck at 5 Core Skill Points, which was followed.",
    "Diagram spellings differ from the text: 'LOVABLE FOOL' (text: Loveable Fool), 'SPLASH BACK' (text: Splash-Back). Text names used."
  ]
};
