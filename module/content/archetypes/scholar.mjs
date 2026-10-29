export default {
  id: "scholar",
  name: "The Scholar",
  skill: "smarts",
  page: 44,
  hybrid: { skills: ["smarts"], count: 1 },
  startingSkills: { grit: [3, 0], wit: [3, 0], smarts: [5, 1], heart: [3, 0], luck: [3, 0], strange: [3, 0] },
  strength: "Start with 1 Talent Point in Smarts (already in the tracker), so Smarts checks add a Talent Die.",
  deficiency: { exclude: ["smarts"], amount: 1, text: "Remove 1 Core Skill Point from one Core Skill other than Smarts (3 to 2)." },
  special: [],
  paths: [
    { id: "academic", name: "Academic", column: 0.5 },
    { id: "healer", name: "Healer", column: 2.5 },
    { id: "engineer", name: "Engineer", column: 4.5 }
  ],
  nodes: [
    {
      id: "scholar-medic", name: "Medic!", tier: 1, path: "core", column: 2.5,
      prerequisites: [], prerequisiteMode: "any",
      kind: "ability", page: 44, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, make a CR 1 Smarts Check. On a success, heal yourself or an ally for 2 wounds, plus 1 more wound for each Smarts symbol beyond the first.",
      automation: [
        { kind: "heal", skill: "smarts", amount: 2, perSymbol: 1, freeSymbols: 1, cr: 1, target: "ally" },
        { kind: "custom", note: "Target an ally's token to heal them; with no target you heal yourself." }
      ]
    },

    {
      id: "scholar-games-afoot", name: "The Game's Afoot!", tier: 2, path: "academic", column: 0.5,
      prerequisites: ["scholar-medic"], prerequisiteMode: "any",
      kind: "ability", page: 45, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die on Smarts Checks to investigate your surroundings.",
      automation: [
        { kind: "poolDice", skill: "smarts", d6: 0, d8: 1, when: { manual: true, label: "Investigating your surroundings" } }
      ]
    },
    {
      id: "scholar-anatomy", name: "Anatomy", tier: 2, path: "healer", column: 2.5,
      prerequisites: ["scholar-medic"], prerequisiteMode: "any",
      kind: "ability", page: 45, action: "interact", uses: null, doom: 0,
      summary: "Use an Interact Action to make a Smarts Check against a target enemy's CR. On a success the Director reveals one of its Weaknesses; a Critical Success may reveal several.",
      automation: [
        { kind: "check", skill: "smarts", cr: null, onSuccess: "The Director reveals one of the target's Weaknesses (several on a Critical Success).", onFail: "Nothing is revealed." },
        { kind: "custom", note: "Set the CR in the roll dialog to the target enemy's CR. On a success the Director reveals one Weakness (maybe more on a Critical Success)." }
      ]
    },
    {
      id: "scholar-barricade", name: "Barricade", tier: 2, path: "engineer", column: 4.5,
      prerequisites: ["scholar-medic"], prerequisiteMode: "any",
      kind: "ability", page: 45, action: "interact", uses: null, doom: 0,
      summary: "At a door, window or other entrance, use an Interact Action and roll a Smarts Check to barricade it against pursuers. 1 success builds a barricade with CR 1 and 8 Health Points; each success beyond the first adds 2 Health Points.",
      automation: [
        { kind: "check", skill: "smarts", cr: 1, onSuccess: "Barricade built: CR 1, 8 Health Points +2 per success beyond the first.", onFail: "No barricade." },
        { kind: "custom", note: "Only at a door, window or other entrance. Barricade: CR 1, 8 HP +2 per extra success; the Director tracks it and how it slows pursuers." }
      ]
    },

    {
      id: "scholar-specialist-subject", name: "Specialist Subject", tier: 3, path: "academic", column: 0.5,
      prerequisites: ["scholar-games-afoot"], prerequisiteMode: "any",
      kind: "ability", page: 45, action: "passive", uses: null, doom: 0,
      summary: "Choose a broad field of expertise (e.g. Language, Occultism, History, Folklore). +1 Talent Die on Smarts Checks related to it.",
      automation: [
        { kind: "poolDice", skill: "smarts", d6: 0, d8: 1, when: { manual: true, label: "Check relates to your Specialist Subject" } },
        { kind: "custom", note: "Choose and record your subject when you take this ability." }
      ]
    },
    {
      id: "scholar-off-kilter", name: "Off Kilter", tier: 3, path: "healer", column: 2.5,
      prerequisites: ["scholar-anatomy"], prerequisiteMode: "any",
      kind: "ability", page: 45, action: "passive", uses: null, doom: 0,
      summary: "After a successful Strike against an enemy of size Large or smaller, roll a Smarts Check against its CR. If you match or beat it, the enemy is knocked Prone.",
      automation: [
        { kind: "check", skill: "smarts", cr: null, label: "Knock Prone", onSuccess: "The targeted enemy is knocked Prone.", onFail: "No effect.",
          success: [{ kind: "applyStatus", status: "prone", target: "enemy" }] },
        { kind: "custom", note: "Use after each successful Strike on a Large or smaller enemy; it costs no action. Keep that enemy targeted and set the CR to its CR (or leave it for the Director)." }
      ]
    },
    {
      id: "scholar-improviser", name: "Improviser", tier: 3, path: "engineer", column: 4.5,
      prerequisites: ["scholar-barricade"], prerequisiteMode: "any",
      kind: "ability", page: 45, action: "interact", uses: null, doom: 0,
      summary: "Make an improvised melee weapon from materials at hand with a Smarts Check; the Smarts symbols rolled set its quality (Improvised Weapon, p136: Smarts, Close, Tier 1/2/3 = 2/4/6 Sharp). It can Malfunction (p132): if you fail a Strike with it and roll at least 1 Strange symbol, it may break or backfire.",
      automation: [
        { kind: "check", skill: "smarts", cr: 1, onSuccess: "Make an Improvised Weapon; its tier equals the Smarts symbols rolled (max Tier 3).", onFail: "Nothing usable." },
        { kind: "custom", note: "Smarts symbols: 1 = Tier 1 (2 Sharp), 2 = Tier 2 (4 Sharp), 3+ = Tier 3 (6 Sharp). Add the matching Improvised Weapon (Tier N) item (Smarts, Close). It Malfunctions only when you fail a Strike with it and roll at least 1 Strange symbol; then roll on the p132 table. It may break or backfire." }
      ]
    },

    {
      id: "scholar-cunning-linguist", name: "Cunning Linguist", tier: 4, path: "academic", column: 0,
      prerequisites: ["scholar-specialist-subject"], prerequisiteMode: "any",
      kind: "ability", page: 46, action: "passive", uses: null, doom: 0,
      summary: "You may roll your Smarts Pool for checks to persuade, intimidate or deceive.",
      automation: [
        { kind: "custom", note: "On checks to persuade, intimidate or deceive, you may switch the roll from Heart to Smarts in the roll dialog." }
      ]
    },
    {
      id: "scholar-mad-scientist", name: "Mad Scientist", tier: 4, path: "academic", column: 1,
      prerequisites: ["scholar-specialist-subject"], prerequisiteMode: "any",
      kind: "ability", page: 46, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, roll 1 Skill Die to brew a throwable flask: Grit = Molotov (p147), Wit = Oil Flask (p148), Smarts = Acid Flask (p146), Heart = Sunlight Flask (p148), Luck = your choice. Strange = the experiment backfires and you take 2 Blunt damage.",
      automation: [
        { kind: "custom", note: "Roll 1 Skill Die: Grit Molotov, Wit Oil Flask, Smarts Acid Flask, Heart Sunlight Flask, Luck any of these; add the flask to your gear. Strange: no flask and you take 2 Blunt damage." }
      ]
    },
    {
      id: "scholar-bleed", name: "Bleed", tier: 4, path: "healer", column: 2.5,
      prerequisites: ["scholar-off-kilter"], prerequisiteMode: "any",
      kind: "ability", page: 46, action: "passive", uses: null, doom: 0,
      summary: "After a successful Strike, roll the Strike's Dice Pool again. The enemy gains Bleed (X), where X is the number of Smarts symbols in that second roll.",
      automation: [
        { kind: "custom", note: "After each successful Strike, re-roll the same Dice Pool and count Smarts symbols (Talent stars count): the enemy gains Bleed of that value." }
      ]
    },
    {
      id: "scholar-armourer", name: "Armourer", tier: 4, path: "engineer", column: 4,
      prerequisites: ["scholar-improviser"], prerequisiteMode: "any",
      kind: "ability", page: 46, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, roll a Smarts Check to make armour for yourself from materials around you: 1-3 successes make armour for 1 slot, 4+ successes make armour for a 2nd slot as well. Also +1 Talent Die when repairing armour.",
      automation: [
        { kind: "check", skill: "smarts", cr: 1, onSuccess: "1-3 successes: armour for 1 slot. 4+ successes: armour for 2 slots.", onFail: "No armour." },
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Repairing armour" } },
        { kind: "custom", note: "Crafting needs materials from the environment. Add the armour as an item covering 1 slot (2 slots on 4+ successes); the Director sets anything else about it." }
      ]
    },
    {
      id: "scholar-nice-ride", name: "Nice Ride", tier: 4, path: "engineer", column: 5,
      prerequisites: ["scholar-improviser"], prerequisiteMode: "any",
      kind: "ability", page: 46, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die when repairing, modifying or operating vehicles.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Repairing, modifying or operating a vehicle" } }
      ]
    },

    {
      id: "scholar-core-plus-academic", name: "+2 Core Points", tier: 5, path: "academic", column: 0.5,
      prerequisites: ["scholar-cunning-linguist", "scholar-mad-scientist"], prerequisiteMode: "any",
      kind: "bonus", page: 46, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to qualify for a hybrid Archetype (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "scholar-core-plus-healer", name: "+2 Core Points", tier: 5, path: "healer", column: 2.5,
      prerequisites: ["scholar-bleed"], prerequisiteMode: "any",
      kind: "bonus", page: 46, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to qualify for a hybrid Archetype (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "scholar-core-plus-engineer", name: "+2 Core Points", tier: 5, path: "engineer", column: 4.5,
      prerequisites: ["scholar-armourer", "scholar-nice-ride"], prerequisiteMode: "any",
      kind: "bonus", page: 46, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to qualify for a hybrid Archetype (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },

    {
      id: "scholar-chemistry", name: "Chemistry", tier: 6, path: "academic", column: 0.5,
      prerequisites: ["scholar-core-plus-academic"], prerequisiteMode: "any",
      kind: "ability", page: 47, action: "passive", uses: null, doom: 0,
      summary: "Resistant to Corrosive and Cold damage.",
      automation: [
        { kind: "resistance", types: ["corrosive", "cold"] }
      ]
    },
    {
      id: "scholar-miracle-cure", name: "Miracle Cure", tier: 6, path: "healer", column: 2,
      prerequisites: ["scholar-core-plus-healer"], prerequisiteMode: "any",
      kind: "ability", page: 47, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, roll your Smarts Pool. Each Smarts symbol removes one Status Effect from you or an ally; each symbol beyond the number of Status Effects removed heals 1 wound on you or an ally.",
      automation: [
        { kind: "check", skill: "smarts", cr: 1, onSuccess: "Spend Smarts symbols: 1 per Status Effect removed, then 1 per wound healed.", onFail: "No effect." },
        { kind: "custom", note: "Each Smarts symbol (Talent stars count) removes 1 Status Effect from you or an ally; each symbol left over heals 1 wound on you or an ally." }
      ]
    },
    {
      id: "scholar-dissect", name: "Dissect", tier: 6, path: "healer", column: 3,
      prerequisites: ["scholar-core-plus-healer"], prerequisiteMode: "any",
      kind: "ability", page: 47, action: "passive", uses: null, doom: 0,
      summary: "When you Strike an enemy with damage it is Weak to, roll your Smarts Pool. If you match or beat its CR, apply Blinded, Paralysed or Stunned to it (your choice).",
      automation: [
        { kind: "check", skill: "smarts", cr: null, label: "Blinded", onSuccess: "The targeted enemy is Blinded.", onFail: "No effect.",
          success: [{ kind: "applyStatus", status: "blinded", target: "enemy" }] },
        { kind: "check", skill: "smarts", cr: null, label: "Paralysed", onSuccess: "The targeted enemy is Paralysed.", onFail: "No effect.",
          success: [{ kind: "applyStatus", status: "paralysed", target: "enemy" }] },
        { kind: "check", skill: "smarts", cr: null, label: "Stunned", onSuccess: "The targeted enemy is Stunned.", onFail: "No effect.",
          success: [{ kind: "applyStatus", status: "stunned", target: "enemy" }] },
        { kind: "custom", note: "Use when your Strike would deal damage the enemy is Weak to; it costs no action. The three Roll buttons are Blinded, Paralysed and Stunned, in that order: roll only the one you want. Keep the enemy targeted and set the CR to its CR (or leave it for the Director)." }
      ]
    },
    {
      id: "scholar-sparky", name: "Sparky", tier: 6, path: "engineer", column: 4.5,
      prerequisites: ["scholar-core-plus-engineer"], prerequisiteMode: "any",
      kind: "ability", page: 47, action: "passive", uses: null, doom: 0,
      summary: "Resistant to Shock damage, and you can't be Stunned.",
      automation: [
        { kind: "resistance", types: ["shock"] },
        { kind: "immunity", types: ["stunned"] }
      ]
    },

    {
      id: "scholar-talent-plus-academic", name: "+1 Smarts Talent Point", tier: 7, path: "academic", column: 0.5,
      prerequisites: ["scholar-chemistry"], prerequisiteMode: "any",
      kind: "bonus", page: 47, action: "passive", uses: null, doom: 0,
      summary: "Add 1 Talent Point to Smarts.",
      automation: [
        { kind: "talentPoints", skill: "smarts", amount: 1 }
      ]
    },
    {
      id: "scholar-talent-plus-healer", name: "+1 Smarts Talent Point", tier: 7, path: "healer", column: 2.5,
      prerequisites: ["scholar-miracle-cure", "scholar-dissect"], prerequisiteMode: "any",
      kind: "bonus", page: 47, action: "passive", uses: null, doom: 0,
      summary: "Add 1 Talent Point to Smarts.",
      automation: [
        { kind: "talentPoints", skill: "smarts", amount: 1 }
      ]
    },
    {
      id: "scholar-talent-plus-engineer", name: "+1 Smarts Talent Point", tier: 7, path: "engineer", column: 4.5,
      prerequisites: ["scholar-sparky"], prerequisiteMode: "any",
      kind: "bonus", page: 47, action: "passive", uses: null, doom: 0,
      summary: "Add 1 Talent Point to Smarts.",
      automation: [
        { kind: "talentPoints", skill: "smarts", amount: 1 }
      ]
    },

    {
      id: "scholar-elementary", name: "Elementary", tier: 8, path: "academic", column: 0,
      prerequisites: ["scholar-talent-plus-academic"], prerequisiteMode: "any",
      kind: "ability", page: 47, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, roll a Smarts Check. For each success, ask the Director one question about the threat (e.g. its Weaknesses or strengths, where it hides, the key suspects, who can be trusted).",
      automation: [
        { kind: "check", skill: "smarts", cr: 1, onSuccess: "Ask the Director one question about the threat per success.", onFail: "No questions." },
        { kind: "custom", note: "Ask the Director one question about the threat for each success." }
      ]
    },
    {
      id: "scholar-duality", name: "Duality", tier: 8, path: "academic", column: 1,
      prerequisites: ["scholar-talent-plus-academic"], prerequisiteMode: "any",
      kind: "ability", page: 47, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "When you take this, choose a persona. The Mind: +1 Talent Point in Smarts, -1 Core Skill Point in Heart. The Monster: +1 Talent Point in Grit, -1 Core Skill Point in Wit. Once per Doom Quarter you may try a CR 3 check to switch persona: Smarts as The Mind, Heart as The Monster.",
      automation: [
        { kind: "talentPoints", skill: "choice", amount: 1 },
        { kind: "check", skill: "smarts", cr: 3, label: "Switch as The Mind", onSuccess: "You become The Monster.", onFail: "You stay The Mind." },
        { kind: "check", skill: "heart", cr: 3, label: "Switch as The Monster", onSuccess: "You become The Mind.", onFail: "You stay The Monster." },
        { kind: "custom", note: "When unlocking, give the Talent Point to Smarts (The Mind) or Grit (The Monster), then remove 1 Core Point from Heart (Mind) or Wit (Monster) on your skill tracker. Roll the first button as The Mind, the second as The Monster. After a switch, move the Talent Point (edit this ability's talentPoints rule) and the lost Core Point by hand." }
      ],
      choices: { type: "talentPoints", amount: 1 }
    },
    {
      id: "scholar-natural-selection", name: "Natural Selection", tier: 8, path: "healer", column: 2.5,
      prerequisites: ["scholar-talent-plus-healer"], prerequisiteMode: "any",
      kind: "ability", page: 47, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die when Striking the enemy with the lowest CR in the Combat. If CRs are tied, it applies to the tied enemy with the fewest Health Points left.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { tags: ["strike"], manual: true, label: "Target has the lowest CR in the Combat (tie: fewest Health Points left)" } }
      ]
    },
    {
      id: "scholar-utility-belt", name: "Utility Belt", tier: 8, path: "engineer", column: 4,
      prerequisites: ["scholar-talent-plus-engineer"], prerequisiteMode: "any",
      kind: "ability", page: 47, action: "passive", uses: null, doom: 0,
      summary: "In your sanctuary or another suitable place, stock 2 different items: Grappling Hook (+1 Talent Die when climbing), Smoke Bomb (+1 Talent Die on Stealth Checks), Lock-picks (+1 Talent Die to open locks).",
      automation: [
        { kind: "poolDice", skill: "grit", d6: 0, d8: 1, when: { manual: true, label: "Climbing (Grappling Hook stocked)" } },
        { kind: "poolDice", skill: "wit", d6: 0, d8: 1, when: { manual: true, label: "Stealth Check (Smoke Bomb stocked)" } },
        { kind: "poolDice", skill: "wit", d6: 0, d8: 1, when: { manual: true, label: "Opening a lock (Lock-picks stocked)" } },
        { kind: "custom", note: "Stock 2 different belt items in your sanctuary or another suitable place; only those 2 bonuses apply." }
      ]
    },
    {
      id: "scholar-road-rage", name: "Road Rage", tier: 8, path: "engineer", column: 5,
      prerequisites: ["scholar-talent-plus-engineer"], prerequisiteMode: "any",
      kind: "ability", page: 47, action: "passive", uses: null, doom: 0,
      summary: "Vehicles you operate get +20 ft Move Distance, and you get +1 Talent Die on attacks made with vehicles.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { tags: ["attack"], manual: true, label: "Attacking with a vehicle" } },
        { kind: "custom", note: "Vehicles you operate get +20 ft Move Distance." }
      ]
    },

    {
      id: "scholar-renaissance-man", name: "Renaissance Man", tier: 9, path: "academic", column: 0.5,
      prerequisites: ["scholar-elementary", "scholar-duality"], prerequisiteMode: "any",
      kind: "ability", page: 48, action: "passive", uses: null, doom: 0,
      summary: "+1 Core Skill Point in each Core Skill except Smarts.",
      automation: [
        { kind: "skillPoints", skill: "grit", amount: 1 },
        { kind: "skillPoints", skill: "wit", amount: 1 },
        { kind: "skillPoints", skill: "heart", amount: 1 },
        { kind: "skillPoints", skill: "luck", amount: 1 },
        { kind: "skillPoints", skill: "strange", amount: 1 }
      ]
    },
    {
      id: "scholar-buff-tonic", name: "Buff Tonic", tier: 9, path: "healer", column: 2.5,
      prerequisites: ["scholar-natural-selection"], prerequisiteMode: "any",
      kind: "ability", page: 48, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, roll a CR 1 Smarts Check. On a success, an ally of your choice is Steeled until the Combat Encounter ends; only one target can have it at a time. On a failure, the enemy closest to you is Steeled instead.",
      automation: [
        { kind: "check", skill: "smarts", cr: 1, onSuccess: "The targeted ally is Steeled until the Combat Encounter ends.", onFail: "The enemy closest to you is Steeled until the Combat Encounter ends.",
          success: [{ kind: "applyStatus", status: "steeled", target: "ally", until: "encounter" }] },
        { kind: "applyStatus", status: "steeled", target: "enemy", until: "encounter", when: { manual: true, label: "Tonic failed (closest enemy)" } },
        { kind: "custom", note: "Target the ally before rolling; on a success they are Steeled until combat ends. On a failure, target the enemy closest to you and click the 'Tonic failed' button. Only one creature can have the tonic at a time, so remove it from the previous one." }
      ]
    },
    {
      id: "scholar-modified", name: "Modified", tier: 9, path: "engineer", column: 4.5,
      prerequisites: ["scholar-utility-belt", "scholar-road-rage"], prerequisiteMode: "any",
      kind: "ability", page: 48, action: "free", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, spend some time customising a weapon. Choose one: it deals +3 Fire, Electric (Shock) or Corrosive damage, or you roll Smarts for Strikes with it instead of its Core Skill.",
      automation: [
        { kind: "custom", note: "Takes some time to do. Edit the weapon: either +3 Fire, Shock or Corrosive damage, or set its skill to Smarts for your Strikes." }
      ]
    },

    {
      id: "scholar-3-steps-ahead", name: "3 Steps Ahead", tier: 10, path: "academic", column: 0,
      prerequisites: ["scholar-renaissance-man"], prerequisiteMode: "any",
      kind: "ability", page: 48, action: "reaction", uses: null, doom: 0,
      summary: "When you're targeted by a Strike, make a Smarts Check against the attacker's CR. Match it and you take no damage from that Strike; exceed it and you may also Strike the attacker if it's within Range.",
      automation: [
        { kind: "check", skill: "smarts", cr: null, onSuccess: "Match: no damage from the Strike. Exceed: you may also Strike the attacker if it's within Range.", onFail: "The Strike resolves normally." },
        { kind: "custom", note: "Roll when targeted by a Strike, with the CR set to the attacker's CR. Match: take no damage from it. Exceed: you may also Strike the attacker if it's within Range." }
      ]
    },
    {
      id: "scholar-monster-serum", name: "Monster Serum", tier: 10, path: "academic", column: 1,
      prerequisites: ["scholar-renaissance-man"], prerequisiteMode: "any",
      kind: "ability", page: 48, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, roll 1 Skill Die to turn into a monster: Grit = Corpse Titan (p191), Wit = Night Gaunt (p181), Smarts = Werewolf (p173), Heart = Dryad (p172), Strange = Abomination (p180), Luck = your choice. Each Combat Round you stay transformed, make a CR 3 Smarts Check; on a failure your form becomes unstable and you gain 1 wound.",
      automation: [
        { kind: "check", skill: "smarts", cr: 3, label: "Stay stable", onSuccess: "Your form stays stable.", onFail: "Your form becomes unstable: take 1 wound.",
          failure: [{ kind: "damage", amount: 1, type: "blunt", target: "self", strike: false }] },
        { kind: "custom", note: "Roll 1 Skill Die for the form: Grit Corpse Titan, Wit Night Gaunt, Smarts Werewolf, Heart Dryad, Strange Abomination, Luck your choice. Roll the CR 3 Smarts Check from this card each Combat Round you stay transformed." }
      ]
    },
    {
      id: "scholar-revive", name: "Revive", tier: 10, path: "healer", column: 2,
      prerequisites: ["scholar-buff-tonic"], prerequisiteMode: "any",
      kind: "ability", page: 48, action: "interact", uses: { per: "opdc", max: 1 }, doom: 0,
      summary: "Once per Doom Cycle, try to bring one dead ally back to life, even in Nightmare Mode: roll your Smarts Pool. With 1 success they return with 1 Health Point; on a failure they are lost forever.",
      automation: [
        { kind: "check", skill: "smarts", cr: 1, onSuccess: "The targeted ally returns to life with 1 Health Point.", onFail: "The ally is lost forever.",
          success: [{ kind: "removeStatus", status: "dead", target: "ally" }, { kind: "heal", amount: 1, target: "ally" }] },
        { kind: "custom", note: "Target the dead ally's token before rolling. On a failure they can never be revived." }
      ]
    },
    {
      id: "scholar-evolutionary-combatant", name: "Evolutionary Combatant", tier: 10, path: "healer", column: 3,
      prerequisites: ["scholar-buff-tonic"], prerequisiteMode: "any",
      kind: "ability", page: 48, action: "passive", uses: null, doom: 0,
      summary: "Each successful Strike an enemy lands on you in a Brawl unlocks an effect that lasts while you stay in that Brawl. 1st hit: Escape with an Interact Action and no enemy gets an Attack Action against you. 2nd hit: +1 Attack Action on your Combat Turn. 3rd hit: Steeled until the Combat Encounter ends or that enemy is slain.",
      automation: [
        { kind: "extraActions", action: "attack", amount: 1, when: { manual: true, label: "A Brawling enemy has hit you twice and you're still in that Brawl" } },
        { kind: "applyStatus", status: "steeled", target: "self", until: "encounter", when: { manual: true, label: "3rd hit from a Brawling enemy" } },
        { kind: "custom", note: "Count each Brawling enemy's hits on you. 1st: Escape with an Interact Action and no enemy gets a free Attack Action. 2nd: the extra Attack Action is in your allowance; only take it while this applies. 3rd: Use this ability and click the Steeled button (lasts until combat ends); remove Steeled if that enemy is slain first." }
      ]
    },
    {
      id: "scholar-man-of-iron", name: "Man of Iron", tier: 10, path: "engineer", column: 4.5,
      prerequisites: ["scholar-modified"], prerequisiteMode: "any",
      kind: "ability", page: 48, action: "passive", uses: null, doom: 0,
      summary: "You are Steeled while wearing armour or operating any vehicle, and armour's Heavy property doesn't affect you.",
      automation: [
        { kind: "applyStatus", status: "steeled", target: "self" },
        { kind: "removeStatus", status: "steeled", when: { manual: true, label: "Remove (no armour, not in a vehicle)" } },
        { kind: "custom", note: "Use this ability (no action) to become Steeled when you put on armour or operate a vehicle; click the Remove button when you stop. The system still applies Heavy armour's Speed penalty, so undo it by hand." }
      ]
    }
  ],
  discrepancies: [
    "The p47 'Tier 7 Archetype +' box says 'At TIER 8', but the tree (p49) puts '+1 Smarts AD' at Tier 7, with abilities at Tier 8 (that row is misprinted 'Level 8'). Followed the tree: Tier 7.",
    "The tree labels the Tier 7 node '+1 SMARTS AD'; the text (p47) says +1 Talent Point in Smarts. Implemented as +1 Smarts Talent Point.",
    "Strength (p44) only mentions the Smarts Talent Point, but the tracker shows Smarts at 5 Core Skill Points (others 3). Used the tracker: Smarts 5/1, others 3/0, Deficiency applied separately.",
    "Dissect lists 'Blind'; used the Blinded status (p219). Modified lists 'Electric' damage, which isn't a damage type; treated as Shock (p131).",
    "Armourer's 'CR 1-3 / CR 4+' is read as successes: 1-3 = 1 slot, 4+ = 2 slots.",
    "Improviser gives no symbol-to-tier table; used 1 symbol = Tier 1, 2 = Tier 2, 3+ = Tier 3 (p136).",
    "Improviser (p45) only malfunctions on a failed Strike with at least 1 Strange symbol, but the generic Malfunction rule (p132) rolls on every attack and some of its results assume a hit. Followed p45 for the trigger and used the p132 table for the result; the Director may limit it to Break or Backfire.",
    "Duality's switch check is read as the current persona's skill (Smarts as The Mind, Heart as The Monster).",
    "3 Steps Ahead only says matching the CR negates damage; exceeding it is treated as negating damage too, plus the counter-Strike.",
    "No action cost is printed for Medic!, Improviser, Mad Scientist, Armourer, Miracle Cure, Elementary, Duality, Buff Tonic, Revive or Monster Serum; set to Interact (p22). Modified takes time rather than an action, so it is Free. Checks that count symbols with no printed CR (Barricade, Improviser, Elementary, Miracle Cure, Revive) use CR 1.",
    "Dissect gives no duration: Blinded and Stunned use their standard durations (p219), and Paralysed lasts until the Director removes it.",
    "Monster Serum's '1 wound' is applied as 1 Blunt damage with no armour roll; a Blunt Resistance, Immunity or Weakness would change it.",
    "Buff Tonic doesn't say whether you can target yourself, and Evolutionary Combatant doesn't say whether the free Escape protects you from every enemy in the Brawl or only the one that hit you. The Director decides both."
  ]
};
