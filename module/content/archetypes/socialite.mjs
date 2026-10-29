export default {
  id: "socialite",
  name: "The Socialite",
  skill: "heart",
  page: 50,
  hybrid: { skills: ["heart"], count: 1 },
  startingSkills: { grit: [3, 0], wit: [3, 0], smarts: [3, 0], heart: [5, 1], luck: [3, 0], strange: [3, 0] },
  strength: "Start with 1 Talent Point in Heart, so Heart checks add a Talent Die. The tracker already includes it (Heart 5 Core Skill Points, 1 Talent Point).",
  deficiency: { exclude: ["heart"], amount: 1, text: "Remove 1 Core Skill Point from one Core Skill other than Heart (3 to 2)." },
  special: [],
  paths: [
    { id: "companion", name: "Companion", column: 0.5 },
    { id: "charmer", name: "Charmer", column: 2 },
    { id: "provoker", name: "Provoker", column: 3.5 }
  ],
  nodes: [
    {
      id: "socialite-snap-out-of-it", name: "Snap Out Of It!", tier: 1, path: "core", column: 2,
      prerequisites: [], prerequisiteMode: "any",
      kind: "ability",
      page: 50, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "On your Fear Checks you may re-roll any dice showing Heart symbols. OPDQ: roll a CR 1 Heart Check to lower an ally's Fear Status by 1 step.",
      automation: [
        { kind: "custom", note: "Passive: on your own Fear Checks, you may re-roll any dice that show Heart symbols.", when: "fear" },
        { kind: "check", skill: "heart", cr: 1, label: "Target the ally to calm", onSuccess: "The targeted ally's Fear Status drops 1 step (Terrified to Afraid, or Afraid to Stable).", onFail: "No effect.",
          success: [{ kind: "fearStep", amount: -1, target: "ally" }] }
      ]
    },
    {
      id: "socialite-best-buddies", name: "Best Buddies", tier: 2, path: "companion", column: 0.5,
      prerequisites: ["socialite-snap-out-of-it"], prerequisiteMode: "any",
      kind: "ability",
      page: 51, action: "passive", uses: null, doom: 0,
      summary: "Start the story with a companion (human, animal or other) tracked on its own character sheet: 8 Health Points, Average Speed, 3 Core Skill Points in every Core Skill, 1 weapon. It can't wear armour, use your abilities or bank Luck, but you may spend your Luck Points on its checks.",
      automation: [
        { kind: "custom", note: "Create a companion character sheet: 8 HP Lifeline, Average Speed, 3 Core Skill Points in each Core Skill and no Talent Points, 1 weapon, no armour, no Luck Bank, can't use your abilities. You may spend your own Luck Points on its checks." }
      ]
    },
    {
      id: "socialite-charmed-im-sure", name: "Charmed I'm Sure", tier: 2, path: "charmer", column: 2,
      prerequisites: ["socialite-snap-out-of-it"], prerequisiteMode: "any",
      kind: "ability",
      page: 51, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die when trying to charm or persuade others.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear", "deathsDoor", "heal", "removeStatus", "save"], manual: true, label: "Charming or persuading someone" } }
      ]
    },
    {
      id: "socialite-taunt", name: "Taunt", tier: 2, path: "provoker", column: 3.5,
      prerequisites: ["socialite-snap-out-of-it"], prerequisiteMode: "any",
      kind: "ability",
      page: 51, action: "interact", uses: null, doom: 0,
      summary: "Interact Action: roll a Heart Check against an enemy's CR. On a success it is Taunted and must attack you, if able, on its next Combat Turn.",
      automation: [
        { kind: "check", skill: "heart", cr: null, label: "Target the enemy; CR = its CR", onSuccess: "The target is Taunted: it must attack you, if able, on its next Combat Turn.", onFail: "No effect.",
          success: [{ kind: "applyStatus", status: "taunted", target: "enemy" }] }
      ]
    },
    {
      id: "socialite-emotional-support", name: "Emotional Support", tier: 3, path: "companion", column: 0,
      prerequisites: ["socialite-best-buddies"], prerequisiteMode: "any",
      kind: "ability",
      page: 51, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die on Fear Checks while your companion is within 10 ft of you.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { tags: ["fear"], manual: true, label: "Companion within 10 ft" } }
      ]
    },
    {
      id: "socialite-brave-and-the-bold", name: "Brave and the Bold", tier: 3, path: "companion", column: 1,
      prerequisites: ["socialite-best-buddies"], prerequisiteMode: "any",
      kind: "ability",
      page: 51, action: "passive", uses: null, doom: 0,
      summary: "Your companion's Speed becomes Fast and it can use 1 Armour Slot.",
      automation: [
        { kind: "custom", note: "On your companion's sheet: set its Speed to Fast and allow it 1 Armour Slot." }
      ],
      upgrades: "socialite-best-buddies"
    },
    {
      id: "socialite-liar-liar", name: "Liar Liar", tier: 3, path: "charmer", column: 2,
      prerequisites: ["socialite-charmed-im-sure"], prerequisiteMode: "any",
      kind: "ability",
      page: 51, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die when lying to someone or when judging whether you are being lied to.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear", "deathsDoor", "heal", "removeStatus", "save"], manual: true, label: "Lying, or telling whether you're being lied to" } }
      ]
    },
    {
      id: "socialite-emboldened", name: "Emboldened", tier: 3, path: "provoker", column: 3.5,
      prerequisites: ["socialite-taunt"], prerequisiteMode: "any",
      kind: "ability",
      page: 51, action: "passive", uses: null, doom: 0,
      summary: "When you Taunt an enemy, the damage of its first Strike against you is reduced by 2 (minimum 1).",
      automation: [
        { kind: "custom", note: "An enemy you Taunted deals 2 less damage (minimum 1) with its first Strike against you." }
      ],
      upgrades: "socialite-taunt"
    },
    {
      id: "socialite-stalwart-friends", name: "Stalwart Friends", tier: 4, path: "companion", column: 0.5,
      prerequisites: ["socialite-emotional-support", "socialite-brave-and-the-bold"], prerequisiteMode: "any",
      kind: "ability",
      page: 52, action: "passive", uses: null, doom: 0,
      summary: "Your companion's Lifeline becomes 12 Health Points.",
      automation: [
        { kind: "custom", note: "On your companion's sheet: its Lifeline becomes 12 HP." }
      ],
      upgrades: "socialite-best-buddies"
    },
    {
      id: "socialite-inspire", name: "Inspire", tier: 4, path: "charmer", column: 2,
      prerequisites: ["socialite-liar-liar"], prerequisiteMode: "any",
      kind: "ability",
      page: 52, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "OPDQ: a target ally adds +1 Talent Die to their next Skill Check. No roll needed. Costs an Interact Action during a Combat Encounter.",
      automation: [
        { kind: "custom", note: "The target ally adds +1 Talent Die to their next Skill Check, then the bonus ends." }
      ]
    },
    {
      id: "socialite-enrage", name: "Enrage", tier: 4, path: "provoker", column: 3.5,
      prerequisites: ["socialite-emboldened"], prerequisiteMode: "any",
      kind: "ability",
      page: 52, action: "passive", uses: null, doom: 0,
      summary: "Enemies you Taunt are also Weakened (CR -1, minimum 1) for as long as they remain Taunted.",
      automation: [
        { kind: "applyStatus", status: "weakened", target: "enemy", flags: { expires: "endOfNextTurn" }, when: { manual: true, label: "Enemy you just Taunted" } }
      ],
      upgrades: "socialite-taunt"
    },
    {
      id: "socialite-core-plus-companion", name: "+2 Core Points", tier: 5, path: "companion", column: 0.5,
      prerequisites: ["socialite-stalwart-friends"], prerequisiteMode: "any",
      kind: "bonus",
      page: 52, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to qualify for a hybrid Archetype (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "socialite-core-plus-charmer", name: "+2 Core Points", tier: 5, path: "charmer", column: 2,
      prerequisites: ["socialite-inspire"], prerequisiteMode: "any",
      kind: "bonus",
      page: 52, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to qualify for a hybrid Archetype (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "socialite-core-plus-provoker", name: "+2 Core Points", tier: 5, path: "provoker", column: 3.5,
      prerequisites: ["socialite-enrage"], prerequisiteMode: "any",
      kind: "bonus",
      page: 52, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to qualify for a hybrid Archetype (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "socialite-cute-or-vicious", name: "Cute or Vicious", tier: 6, path: "companion", column: 0.5,
      prerequisites: ["socialite-core-plus-companion"], prerequisiteMode: "any",
      kind: "ability",
      page: 52, action: "passive", uses: null, doom: 0,
      summary: "Choose one permanently. Cute: when your companion is targeted by a Strike, roll a Heart Check against the attacker's CR; on a success the companion is Steeled. While it is Near, you may re-roll failed Heart Checks to charm. Vicious: your companion gets +1 Attack Action. While it is Near, you may re-roll failed Heart Checks to intimidate.",
      automation: [
        { kind: "custom", note: "Choose Cute or Vicious when you take this ability. The choice is permanent." },
        { kind: "check", skill: "heart", cr: null, label: "Cute only: when your companion is targeted by a Strike, target the companion; CR = the attacker's CR", onSuccess: "Your companion is Steeled until its next Combat Turn starts.", onFail: "No effect.",
          success: [{ kind: "applyStatus", status: "steeled", target: "ally", flags: { expires: "startOfNextTurn" } }] },
        { kind: "custom", note: "Cute: while your companion is within Near Range (15 ft), you may re-roll failed Heart Checks to charm." },
        { kind: "custom", note: "Vicious: your companion gets +1 Attack Action on its Combat Turn. While it is within Near Range (15 ft), you may re-roll failed Heart Checks to intimidate." }
      ]
    },
    {
      id: "socialite-distract", name: "Distract", tier: 6, path: "charmer", column: 2,
      prerequisites: ["socialite-core-plus-charmer"], prerequisiteMode: "any",
      kind: "ability",
      page: 52, action: "interact", uses: null, doom: 0,
      summary: "Heart Check against the highest CR among enemies within Near Range (15 ft). On a success they are all distracted. Out of combat, all your allies enter Stealth. In combat, those enemies are Taunted until your next Combat Turn, and each ally may take one immediate bonus action: Escape a Brawl with them without giving them an Attack Action, or Strike a distracted enemy as if it were Weakened.",
      automation: [
        { kind: "check", skill: "heart", cr: null, label: "In combat: target every enemy within 15 ft; CR = the highest of their CRs", onSuccess: "The targeted enemies are Taunted until your next Combat Turn, and each ally gets a bonus action.", onFail: "No effect.",
          success: [{ kind: "applyStatus", status: "taunted", target: "enemy", until: "attackerNextTurn", flags: { expires: "combatEnd" } }] },
        { kind: "check", skill: "heart", cr: null, label: "Out of combat: target your allies; CR = the highest CR among enemies within 15 ft", onSuccess: "The targeted allies enter Stealth.", onFail: "No effect.",
          success: [{ kind: "applyStatus", status: "stealth", target: "ally" }] },
        { kind: "custom", note: "In combat, after a success each ally may at once take one bonus action: Escape a Brawl with Taunted enemies without giving them an Attack Action, or Strike a distracted enemy as if it were Weakened (CR -1, minimum 1)." }
      ]
    },
    {
      id: "socialite-intimidate", name: "Intimidate", tier: 6, path: "provoker", column: 3.5,
      prerequisites: ["socialite-core-plus-provoker"], prerequisiteMode: "any",
      kind: "ability",
      page: 52, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die on Heart Checks to intimidate.",
      automation: [
        { kind: "poolDice", skill: "heart", d6: 0, d8: 1, when: { notTags: ["attack", "fear", "deathsDoor", "heal", "removeStatus", "save"], manual: true, label: "Intimidating someone" } }
      ]
    },
    {
      id: "socialite-guardian-angel", name: "Guardian Angel", tier: 7, path: "companion", column: 0,
      prerequisites: ["socialite-cute-or-vicious"], prerequisiteMode: "any",
      kind: "ability",
      page: 53, action: "passive", uses: null, doom: 0,
      summary: "While you are Near your companion (within 15 ft), you are Steeled (CR +1).",
      automation: [
        { kind: "applyStatus", status: "steeled", target: "self" },
        { kind: "custom", note: "Steeled only while your companion is within Near Range (15 ft). Click Use on this ability's sheet to apply Steeled, and remove it when you move farther apart." }
      ]
    },
    {
      id: "socialite-sick-em", name: "Sick Em!", tier: 7, path: "companion", column: 1,
      prerequisites: ["socialite-cute-or-vicious"], prerequisiteMode: "any",
      kind: "ability",
      page: 53, action: "passive", uses: null, doom: 0,
      summary: "Your companion may spend an Attack Action to roll a Heart Check against an enemy's CR. On a success the companion Taunts that enemy, which is also Weakened while it stays Taunted.",
      automation: [
        { kind: "applyStatus", status: "taunted", target: "enemy", when: { manual: true, label: "Your companion's Sick Em! check succeeded" } },
        { kind: "applyStatus", status: "weakened", target: "enemy", flags: { expires: "endOfNextTurn" }, when: { manual: true, label: "Your companion's Sick Em! check succeeded" } },
        { kind: "custom", note: "Companion action: it spends its own Attack Action and rolls its own Heart against the enemy's CR. On a success, target that enemy and use this card's Taunted and Weakened buttons. The Taunt's source is the companion: the enemy must attack it." }
      ]
    },
    {
      id: "socialite-rousing-speech", name: "Rousing Speech", tier: 7, path: "charmer", column: 2,
      prerequisites: ["socialite-distract"], prerequisiteMode: "any",
      kind: "ability",
      page: 53, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "OPDQ, during a Combat Encounter only: roll a CR 1 Heart Check. On a success each ally adds +1 Skill Die to Attack Action rolls until the encounter ends, or +1 Talent Die instead if you rolled 3 or more successes.",
      automation: [
        { kind: "check", skill: "heart", cr: 1, label: "Combat Encounters only", onSuccess: "Each ally adds +1 Skill Die to Attack Action rolls until the Combat Encounter ends (+1 Talent Die instead with 3+ successes).", onFail: "No effect." },
        { kind: "custom", note: "On a success, each ally adds the bonus die themselves: +1 Skill Die (or +1 Talent Die if you rolled 3+ successes) on their Attack Action rolls until the encounter ends." }
      ]
    },
    {
      id: "socialite-barbed-words", name: "Barbed Words", tier: 7, path: "provoker", column: 3.5,
      prerequisites: ["socialite-intimidate"], prerequisiteMode: "any",
      kind: "ability",
      page: 53, action: "attack", uses: null, doom: 0,
      summary: "Spend an Attack or Interact Action to insult an enemy: it must pass a CR 2 Heart Check or take 3 Soul damage.",
      automation: [
        { kind: "custom", note: "The target enemy rolls a CR 2 Heart Check; if it fails, it takes 3 Soul damage (Soul ignores armour). You may spend an Interact Action instead of an Attack Action." }
      ]
    },
    {
      id: "socialite-talent-plus-companion", name: "+1 Heart Talent Point", tier: 8, path: "companion", column: 0.5,
      prerequisites: ["socialite-guardian-angel", "socialite-sick-em"], prerequisiteMode: "any",
      kind: "bonus",
      page: 53, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Heart.",
      automation: [
        { kind: "talentPoints", skill: "heart", amount: 1 }
      ]
    },
    {
      id: "socialite-talent-plus-charmer", name: "+1 Heart Talent Point", tier: 8, path: "charmer", column: 2,
      prerequisites: ["socialite-rousing-speech"], prerequisiteMode: "any",
      kind: "bonus",
      page: 53, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Heart.",
      automation: [
        { kind: "talentPoints", skill: "heart", amount: 1 }
      ]
    },
    {
      id: "socialite-talent-plus-provoker", name: "+1 Heart Talent Point", tier: 8, path: "provoker", column: 3.5,
      prerequisites: ["socialite-barbed-words"], prerequisiteMode: "any",
      kind: "bonus",
      page: 53, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Heart.",
      automation: [
        { kind: "talentPoints", skill: "heart", amount: 1 }
      ]
    },
    {
      id: "socialite-bulwark-buddies", name: "Bulwark Buddies", tier: 9, path: "companion", column: 0.5,
      prerequisites: ["socialite-talent-plus-companion"], prerequisiteMode: "any",
      kind: "ability",
      page: 53, action: "passive", uses: null, doom: 0,
      summary: "Your companion's Lifeline becomes 16 Health Points. While it is within 5 ft of you, damage you take from attacks is reduced by 1 (minimum 1).",
      automation: [
        { kind: "custom", note: "On your companion's sheet: its Lifeline becomes 16 HP." },
        { kind: "custom", note: "While your companion is within 5 ft, reduce damage you take from attacks by 1 (minimum 1)." }
      ],
      upgrades: "socialite-stalwart-friends"
    },
    {
      id: "socialite-allied-armour", name: "Allied Armour", tier: 9, path: "charmer", column: 2,
      prerequisites: ["socialite-talent-plus-charmer"], prerequisiteMode: "any",
      kind: "ability",
      page: 53, action: "passive", uses: null, doom: 0,
      summary: "Damage dealt to you is reduced by 1 for each ally within 5 ft of you (minimum 1).",
      automation: [
        { kind: "custom", note: "Reduce any damage dealt to you by 1 per ally within 5 ft (minimum 1)." }
      ]
    },
    {
      id: "socialite-imposing-presence", name: "Imposing Presence", tier: 9, path: "provoker", column: 3.5,
      prerequisites: ["socialite-talent-plus-provoker"], prerequisiteMode: "any",
      kind: "ability",
      page: 53, action: "attack", uses: null, doom: 0,
      summary: "Attack Action: every enemy within Medium Range (50 ft) makes a CR 2 Heart Check; those that fail become Afraid and flee out of that range. Until your next Combat Turn, an enemy must pass a Heart Check with CR equal to your CR to target you.",
      automation: [
        { kind: "applyStatus", status: "afraid", target: "enemy", save: { skill: "heart", cr: 2 } },
        { kind: "custom", note: "Target every enemy within 50 ft before using this. Enemies that fail flee beyond 50 ft. Until your next Combat Turn, an enemy must pass a Heart Check with CR equal to your CR before it can target you." }
      ]
    },
    {
      id: "socialite-loyal-to-a-fault", name: "Loyal to a Fault", tier: 10, path: "companion", column: 0.5,
      prerequisites: ["socialite-bulwark-buddies"], prerequisiteMode: "any",
      kind: "ability",
      page: 54, action: "reaction", uses: null, doom: 0,
      summary: "When an attack would leave you dead or at Death's Door, you may roll a CR 1 Heart Check. On a success, if your companion is within 25 ft, it takes all of that Strike's damage instead of you.",
      automation: [
        { kind: "check", skill: "heart", cr: 1, onSuccess: "If your companion is within 25 ft, it takes all of the Strike's damage instead of you.", onFail: "You take the damage as normal." },
        { kind: "custom", note: "Roll before the damage is applied. On a success with your companion within 25 ft, apply the whole Strike's damage to the companion instead of you." }
      ]
    },
    {
      id: "socialite-mutineer", name: "Mutineer", tier: 10, path: "charmer", column: 2,
      prerequisites: ["socialite-allied-armour"], prerequisiteMode: "any",
      kind: "ability",
      page: 54, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "OPDQ: roll a Heart Check with CR equal to an enemy's CR +1. On a success it fights for you until death and counts as a companion (p51). Only 1 Mutineer at a time; the Director adjusts its Core Skills and abilities to suit its power.",
      automation: [
        { kind: "check", skill: "heart", cr: null, label: "Target the enemy; CR = its CR +1", onSuccess: "The enemy is Beguiled: it fights on your side until death and is treated as a companion.", onFail: "No effect.",
          success: [{ kind: "applyStatus", status: "beguiled", target: "enemy" }] },
        { kind: "custom", note: "On a success the Director hands the Mutineer to you as a companion and adjusts its Core Skills and abilities to suit its power. You can have only 1 Mutineer at a time." }
      ]
    },
    {
      id: "socialite-scream-queen", name: "Scream Queen", tier: 10, path: "provoker", column: 3.5,
      prerequisites: ["socialite-imposing-presence"], prerequisiteMode: "any",
      kind: "ability",
      page: 54, action: "attack", uses: null, doom: 0,
      summary: "Every enemy within Long Range (150 ft) makes a CR 2 Heart Check. Each that fails suffers Imposing Presence's effects (p53), is Weakened until your next Combat Turn, has a random piece of its armour (if any) destroyed and takes 3 Soul damage.",
      automation: [
        { kind: "applyStatus", status: "afraid", target: "enemy", save: { skill: "heart", cr: 2 } },
        { kind: "applyStatus", status: "weakened", target: "enemy", until: "attackerNextTurn", when: { manual: true, label: "Enemies that failed the Heart Check" } },
        { kind: "custom", note: "Target every enemy within 150 ft before using this. Then target the enemies that failed (became Afraid) and use the Weakened button. Each of them also flees beyond 150 ft, loses a random piece of armour if it has any, and takes 3 Soul damage. Until your next Combat Turn, enemies must pass a Heart Check with CR equal to your CR to target you." }
      ]
    }
  ],
  discrepancies: [
    "The diagram (p55) labels some nodes differently from the text: 'Loyalty to a Fault', 'Brave & the Bold', 'Cute / Vicious', '+1 Hearts TP'. Used the text names (p51-54); the Tier 8 nodes are named '+1 Heart Talent Point' after the p53 text.",
    "No action cost is printed for Snap Out Of It!'s OPDQ part, Distract, Rousing Speech or Mutineer. Set to Interact (p22: using a non-attack ability).",
    "Scream Queen prints no action cost. Set to Attack, because it applies Imposing Presence (an Attack Action) and deals damage; p22 alone would make it Interact.",
    "Barbed Words lets you spend either an Attack or an Interact Action. Recorded as Attack; Interact is allowed instead.",
    "Sick Em! is the companion's Attack Action, so it is marked passive for the Socialite. The companion rolls its own Heart.",
    "Cute or Vicious: the text doesn't say who rolls Cute's Heart Check (owner or companion) or how long its Steeled lasts. Automated as the owner's roll with the companion targeted. Steeled lasts until the companion's next Combat Turn starts, like a Heart critical.",
    "Enrage and Sick Em!: 'Weakened while Taunted' is applied with Taunted's own duration (until the end of the enemy's next Combat Turn). If a Taunt ends early, remove Weakened by hand.",
    "Sick Em!: its buttons apply Taunted from the Socialite's card, so the Socialite is recorded as the source. The companion is the real source.",
    "Mutineer: the text names no status for a converted enemy. Automation applies Beguiled (p219: its actions are controlled by whoever Beguiled it) as the marker.",
    "Imposing Presence: unclear whether the targeting restriction covers every enemy or only those that failed. 'Effective Range' was read as Medium Range.",
    "Snap Out Of It!: unclear whether Talent Die star faces count as Heart symbols for the re-roll.",
    "Emboldened and Enrage: unclear whether they also apply to Taunts from Distract.",
    "Distract: its in-combat Taunt covers 'all enemies in Range'. Read as the same Near Range (15 ft) used for the check.",
    "Inspire and Rousing Speech: unclear whether 'ally' includes yourself or your companion.",
    "Allied Armour and Bulwark Buddies: the text doesn't say whether they stack or whether they apply before or after armour rolls.",
    "Mutineer: unclear whether Companion path upgrades (Stalwart Friends, Bulwark Buddies and the others) also apply to the Mutineer."
  ]
};
