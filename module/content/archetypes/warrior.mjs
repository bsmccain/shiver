export default {
  id: "warrior",
  name: "The Warrior",
  skill: "grit",
  page: 32,
  hybrid: { skills: ["grit"], count: 1 },
  startingSkills: { grit: [5, 1], wit: [3, 0], smarts: [3, 0], heart: [3, 0], luck: [3, 0], strange: [3, 0] },
  strength: "Start with 1 Talent Point in Grit, so every Grit Check gets 1 Talent Die. The starting tracker already counts it.",
  deficiency: {
    exclude: ["grit"],
    amount: 1,
    text: "Remove 1 Core Skill Point from one Core Skill other than Grit, taking it from 3 to 2."
  },
  special: [],
  paths: [
    { id: "berserker", name: "Berserker", column: 0.5 },
    { id: "fighter", name: "Fighter", column: 2 },
    { id: "protector", name: "Protector", column: 3.5 }
  ],
  nodes: [
    // Tier 1
    {
      id: "warrior-tough", name: "Tough", tier: 1, path: "core", column: 2,
      prerequisites: [], prerequisiteMode: "any", kind: "ability",
      page: 32, action: "passive", uses: null, doom: 0,
      summary: "When an attack hits you, roll 1 Skill Die. A Grit symbol reduces that attack's damage by 1.",
      automation: [
        { kind: "damageReductionRoll", dice: 1, face: "grit", when: "hit" }
      ]
    },

    // Tier 2
    {
      id: "warrior-fury", name: "Fury", tier: 2, path: "berserker", column: 0.5,
      prerequisites: ["warrior-tough"], prerequisiteMode: "any", kind: "ability",
      page: 33, action: "passive", uses: { per: "round", max: 1 }, doom: 0,
      summary: "Once per Combat Round, when you are attacked and take damage, add 1 Skill Die to your Dice Pool on your next Attack Action.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 1, d8: 0, when: { tags: ["attack"], manual: true, label: "Fury: you were attacked and took damage since your last Attack Action (once per Combat Round)" } }
      ]
    },
    {
      id: "warrior-stun", name: "Stun", tier: 2, path: "fighter", column: 2,
      prerequisites: ["warrior-tough"], prerequisiteMode: "any", kind: "ability",
      page: 33, action: "attack", uses: null, doom: 0,
      summary: "Spend an Attack Action on a stunning blow. If the Strike succeeds, its weapon damage is halved, rounded down, and the enemy must pass a CR 2 Grit Check or be Stunned.",
      automation: [
        { kind: "strikeMode", label: "Stun", damageMultiplier: 0.5, tags: ["stun"], onHit: [
          { kind: "onHit", status: "stunned", save: { skill: "grit", cr: 2 } }
        ] }
      ]
    },
    {
      id: "warrior-get-behind-me", name: "Get Behind Me", tier: 2, path: "protector", column: 3.5,
      prerequisites: ["warrior-tough"], prerequisiteMode: "any", kind: "ability",
      page: 33, action: "interact", uses: null, doom: 0,
      summary: "On your Combat Turn, spend an Interact Action to pick 1 ally within Near Range (15 ft). If that ally is attacked before your next Combat Turn, roll a CR 1 Grit Check. On a success you either take all of the attack's damage yourself, or you and the ally each take half, rounded down.",
      automation: [
        { kind: "check", skill: "grit", cr: 1, label: "Guarded ally is attacked", onSuccess: "Take all of the attack's damage yourself, or you and the ally each take half (round down).", onFail: "The ally takes the attack as normal." },
        { kind: "custom", note: "Name the guarded ally when you use this. Roll the Grit Check from this card when that ally is attacked before your next Combat Turn, then split the damage by hand." }
      ]
    },

    // Tier 3
    {
      id: "warrior-furious-fists", name: "Furious Fists", tier: 3, path: "berserker", column: 0.5,
      prerequisites: ["warrior-fury"], prerequisiteMode: "any", kind: "ability",
      page: 33, action: "passive", uses: null, doom: 0,
      summary: "Gain 1 Talent Die on Unarmed Strikes. Your Unarmed Strikes deal 3 Blunt damage.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: "unarmed" },
        { kind: "strikeMode", label: "Furious Fists", damage: 3, damageType: "blunt", unarmedOnly: true, onHit: [] },
        { kind: "custom", note: "Your Unarmed Strikes deal 3 Blunt, not 1. Pick the Furious Fists mode, or set your Unarmed Strike's damage to 3 so that Stun, Sweep and Chained Strike modes halve or double the right number." }
      ]
    },
    {
      id: "warrior-sweep", name: "Sweep", tier: 3, path: "fighter", column: 2,
      prerequisites: ["warrior-stun"], prerequisiteMode: "any", kind: "ability",
      page: 33, action: "attack", uses: null, doom: 0,
      summary: "If enemies are within Close Range (5 ft) of you and of each other, one Attack Action makes Strikes on up to 3 of them. Each successful Strike deals half damage, rounded down, and knocks that enemy back 10 ft.",
      automation: [
        { kind: "strikeMode", label: "Sweep", damageMultiplier: 0.5, onHit: [
          { kind: "onHit", note: "Sweep: knock this enemy back 10 ft." }
        ] },
        { kind: "custom", note: "Target up to 3 enemies that are all within 5 ft of you and of each other, then Strike in Sweep mode." }
      ]
    },
    {
      id: "warrior-back-off", name: "Back Off", tier: 3, path: "protector", column: 3.5,
      prerequisites: ["warrior-get-behind-me"], prerequisiteMode: "any", kind: "ability",
      page: 33, action: "free", uses: null, doom: 0,
      summary: "After a successful Strike on an enemy that is in a Brawl with an ally, you may knock it back 10 ft in a direction you choose, which Escapes it from the Brawl. Each ally who was in that Brawl may immediately make an Attack Action against it.",
      automation: [
        { kind: "strikeMode", label: "Back Off", onHit: [
          { kind: "onHit", note: "Back Off: if this enemy is in a Brawl with an ally, you may knock it back 10 ft in a direction you choose, Escaping it from the Brawl. Each ally who was in that Brawl may make an immediate Attack Action against it." }
        ] },
        { kind: "custom", note: "Pick the Back Off mode when you Strike an enemy that is brawling an ally, or apply it by hand after any other successful Strike. Move the enemy 10 ft and end the Brawl by hand. Allies who were in it each get an immediate Attack Action against it." }
      ]
    },

    // Tier 4
    {
      id: "warrior-charge", name: "Charge", tier: 4, path: "berserker", column: 0,
      prerequisites: ["warrior-furious-fists"], prerequisiteMode: "any", kind: "ability",
      page: 34, action: "attack", uses: null, doom: 0,
      summary: "Spend an Attack Action to Charge an enemy within your Move Distance, ending next to it, then roll a Grit Check against its CR. On a success you Grapple it or knock it Prone, and deal damage as a successful Unarmed Strike, which is 3 Blunt with Furious Fists.",
      attack: { skill: "grit", damage: 3, damageType: "blunt", range: "close", unarmed: true },
      automation: [
        { kind: "onHit", note: "Charge: post Charge to chat from your sheet (speech-bubble icon) and click Grapple or Prone with the enemy targeted." },
        { kind: "applyStatus", status: "grappled", target: "enemy", when: { manual: true, label: "Charge hit: Grapple it" } },
        { kind: "applyStatus", status: "prone", target: "enemy", when: { manual: true, label: "Charge hit: knock it Prone" } },
        { kind: "custom", note: "Move your token next to the target, up to your Move Distance, as part of this Attack Action. Target the enemy and use this ability to roll the Grit Check against its CR. On a hit, post Charge to chat and click Grapple or Prone while the enemy is still targeted." }
      ]
    },
    {
      id: "warrior-wounded-bear", name: "Wounded Bear", tier: 4, path: "berserker", column: 1,
      prerequisites: ["warrior-furious-fists"], prerequisiteMode: "any", kind: "ability",
      page: 34, action: "passive", uses: null, doom: 0,
      summary: "Gain extra Attack Actions from the wounds on your Lifeline. 4 wounds give +1, 5 to 11 wounds give +2, and 12 or more give +3.",
      automation: [
        { kind: "extraActions", action: "attack", amount: 1, when: { wounds: { gte: 4, lte: 4 } } },
        { kind: "extraActions", action: "attack", amount: 2, when: { wounds: { gte: 5, lte: 11 } } },
        { kind: "extraActions", action: "attack", amount: 3, when: { wounds: { gte: 12 } } }
      ]
    },
    {
      id: "warrior-counter-attack", name: "Counter Attack", tier: 4, path: "fighter", column: 2,
      prerequisites: ["warrior-sweep"], prerequisiteMode: "any", kind: "ability",
      page: 34, action: "reaction", uses: null, doom: 0,
      summary: "After an enemy makes a successful attack against you, roll a Grit Check with CR equal to that enemy's CR. On a success, deal half your weapon's damage, rounded down, to that enemy.",
      automation: [
        { kind: "strikeMode", label: "Counter Attack", damageMultiplier: 0.5, noCrit: true, tags: ["counter"], onHit: [] },
        { kind: "check", skill: "grit", cr: null, label: "Counter Attack (CR = the attacker's CR)", onSuccess: "Deal half your weapon's damage (round down) to the attacker.", onFail: "No effect." },
        { kind: "custom", note: "Target the attacker and Strike with a Grit weapon in Counter Attack mode. It doesn't use your own Attack Action, so ignore the one the tracker marks. If your weapon doesn't roll Grit, roll this card's Grit Check against the attacker's CR and apply half damage by hand." }
      ]
    },
    {
      id: "warrior-meat-shield", name: "Meat-Shield", tier: 4, path: "protector", column: 3.5,
      prerequisites: ["warrior-back-off"], prerequisiteMode: "any", kind: "ability",
      page: 34, action: "passive", uses: null, doom: 0,
      summary: "While you Grapple an enemy your size or smaller and have an empty Armour Slot, it can be your Meat-Shield. When you are attacked it fills an Armour Slot, and damage to that slot goes to the enemy instead. It breaks free when the slot has no Health Points left, or with an Interact Action as normal. The Director can add or remove slot Health Points to suit the enemy, and the Meat-Shield is gone if it dies.",
      automation: [
        { kind: "custom", note: "When attacked while grappling a valid enemy with an empty Armour Slot, add a temporary 1-slot armour called Meat-Shield (2 HP unless the Director changes it) and roll for it like normal armour. Deal each wound it takes to the grappled enemy. Remove it when the slot hits 0 HP, the Grapple ends or the enemy dies." }
      ]
    },

    // Tier 5
    {
      id: "warrior-core-plus-berserker", name: "+2 Core Points", tier: 5, path: "berserker", column: 0.5,
      prerequisites: ["warrior-charge", "warrior-wounded-bear"], prerequisiteMode: "any", kind: "bonus",
      page: 34, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. This can help you qualify to hybridise (p78).",
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 },
      automation: []
    },
    {
      id: "warrior-core-plus-fighter", name: "+2 Core Points", tier: 5, path: "fighter", column: 2,
      prerequisites: ["warrior-counter-attack"], prerequisiteMode: "any", kind: "bonus",
      page: 34, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. This can help you qualify to hybridise (p78).",
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 },
      automation: []
    },
    {
      id: "warrior-core-plus-protector", name: "+2 Core Points", tier: 5, path: "protector", column: 3.5,
      prerequisites: ["warrior-meat-shield"], prerequisiteMode: "any", kind: "bonus",
      page: 34, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. This can help you qualify to hybridise (p78).",
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 },
      automation: []
    },

    // Tier 6
    {
      id: "warrior-martial-artist", name: "Martial Artist", tier: 6, path: "berserker", column: 0.5,
      prerequisites: ["warrior-core-plus-berserker"], prerequisiteMode: "any", kind: "ability",
      page: 34, action: "passive", uses: null, doom: 0,
      summary: "Wit symbols count as successes on Grit Checks for Unarmed Strikes.",
      automation: [
        { kind: "extraSuccessFaces", rollSkill: "grit", countsAs: ["wit"], when: "unarmed" }
      ]
    },
    {
      id: "warrior-block", name: "Block", tier: 6, path: "fighter", column: 2,
      prerequisites: ["warrior-core-plus-fighter"], prerequisiteMode: "any", kind: "ability",
      page: 34, action: "interact", uses: null, doom: 0,
      summary: "Spend an Interact Action to prepare a Block. You are Steeled until your next Combat Turn.",
      automation: [
        { kind: "applyStatus", status: "steeled", target: "self", flags: { expires: "startOfNextTurn" } }
      ]
    },
    {
      id: "warrior-natural-toughness", name: "Natural Toughness", tier: 6, path: "protector", column: 3.5,
      prerequisites: ["warrior-core-plus-protector"], prerequisiteMode: "any", kind: "ability",
      page: 34, action: "passive", uses: null, doom: 0,
      summary: "Tough rolls 1 extra Skill Die, 2 in total. Each Grit symbol blocks 1 damage.",
      upgrades: "warrior-tough",
      automation: [
        { kind: "damageReductionRoll", dice: 1, face: "grit", when: "hit" }
      ]
    },

    // Tier 7
    {
      id: "warrior-freight-train", name: "Freight Train", tier: 7, path: "berserker", column: 0,
      prerequisites: ["warrior-martial-artist"], prerequisiteMode: "any", kind: "ability",
      page: 35, action: "free", uses: null, doom: 0,
      summary: "Upgrades Charge. After a successful Charge you may Charge again at once without spending an Action. With an enemy Grappled you can ram it into another enemy within range. Both take 2 Blunt, and the rammed enemy is knocked Prone and back 10 ft. You may instead release the Grappled enemy, knocking it back 10 ft and Prone, or keep holding it.",
      upgrades: "warrior-charge",
      automation: [
        { kind: "applyStatus", status: "prone", target: "enemy" },
        { kind: "custom", note: "After each successful Charge, you may Charge again for free. Using this ability knocks your targets Prone, so target the rammed enemy, or the grappled enemy if you release it. Deal 2 Blunt to both rammed enemies and move them 10 ft by hand." }
      ]
    },
    {
      id: "warrior-unencumbered", name: "Unencumbered", tier: 7, path: "berserker", column: 1,
      prerequisites: ["warrior-martial-artist"], prerequisiteMode: "any", kind: "ability",
      page: 35, action: "passive", uses: null, doom: 0,
      summary: "While you use no weapon and wear no armour, your Speed is Fast and you are Steeled.",
      automation: [
        { kind: "speed", set: "fast", when: { noWeapon: true, noArmour: true, label: "No weapon or armour" } },
        { kind: "cr", amount: 1, when: { noWeapon: true, noArmour: true, label: "Steeled: no weapon or armour" } }
      ]
    },
    {
      id: "warrior-chained-strike", name: "Chained Strike", tier: 7, path: "fighter", column: 2,
      prerequisites: ["warrior-block"], prerequisiteMode: "any", kind: "ability",
      page: 35, action: "free", uses: { per: "turn", max: 1 }, doom: 0,
      summary: "Once per Combat Turn, after a successful Strike on an enemy, you may make a second Strike at once. If that also succeeds, make a third Strike that deals double damage.",
      automation: [
        { kind: "strikeMode", label: "Chained Strike (third Strike)", damageMultiplier: 2, onHit: [] },
        { kind: "custom", note: "Use once per Combat Turn after a Strike hits. The second Strike is a normal Strike. If it hits, roll the third in Chained Strike mode for double damage. Neither extra Strike costs an Action." }
      ]
    },
    {
      id: "warrior-pro-wrestler", name: "Pro Wrestler", tier: 7, path: "protector", column: 3,
      prerequisites: ["warrior-natural-toughness"], prerequisiteMode: "any", kind: "ability",
      page: 35, action: "attack", uses: null, doom: 0,
      summary: "Gain 1 Talent Die on Grit Checks to Grapple. While you have an enemy Grappled, an Attack Action lets you make one move. Caber Toss throws it up to 20 ft. Aimed at another enemy, roll a Grit Check against that enemy's CR, and on a success both are knocked Prone and take 1 Blunt. Into a solid object, it takes 1 Blunt per 10 ft thrown. Headlock makes it Weakened while you keep the Grapple. Suplex is a Grit Check against its CR that deals 5 Blunt on a success, and it is knocked Prone either way.",
      automation: [
        { kind: "poolDice", skill: "grit", d6: 0, d8: 1, when: { notTags: ["attack", "fear", "deathsDoor", "heal", "removeStatus", "save"], manual: true, label: "Grit Check to Grapple" } },
        { kind: "applyStatus", status: "weakened", target: "enemy", when: { manual: true, label: "Headlock" } },
        { kind: "check", skill: "grit", cr: null, label: "Caber Toss at an enemy (CR = that enemy's CR)", onSuccess: "Both enemies are knocked Prone and take 1 Blunt.", onFail: "No Prone or damage from the throw.", success: [
          { kind: "applyStatus", status: "prone", target: "enemy" },
          { kind: "damage", amount: 1, type: "blunt", target: "enemy", strike: false }
        ] },
        { kind: "strikeMode", label: "Suplex", damage: 5, damageType: "blunt", unarmedOnly: true, onHit: [
          { kind: "onHit", status: "prone" }
        ] },
        { kind: "applyStatus", status: "prone", target: "enemy", when: { manual: true, label: "Suplex missed" } },
        { kind: "custom", note: "Each move needs an enemy in your Grapple. For Headlock or Caber Toss, use this ability (it spends the Attack Action) and work from its card. Headlock: target the held enemy and click Headlock, then remove Weakened when the Grapple ends. Caber Toss at an enemy: target both enemies and roll the card's Grit Check against the target enemy's CR. End your Grapple on the thrown enemy by hand. Thrown into a solid object, it takes 1 Blunt per 10 ft (up to 20 ft) by hand. Suplex: Strike the held enemy with your Unarmed Strike in Suplex mode. If that misses, post this ability to chat and click Suplex missed." }
      ]
    },
    {
      id: "warrior-juicy-bait", name: "Juicy Bait", tier: 7, path: "protector", column: 4,
      prerequisites: ["warrior-natural-toughness"], prerequisiteMode: "any", kind: "ability",
      page: 35, action: "reaction", uses: null, doom: 0,
      summary: "An enemy trying to Strike an ally within Near Range (15 ft) of you must first make a Smarts Check against your CR. If it fails, it must Strike you instead, and your allies treat it as Weakened until your next Combat Turn.",
      automation: [
        { kind: "applyStatus", status: "weakened", target: "enemy", save: { skill: "smarts", cr: 1 }, until: "attackerNextTurn", when: { manual: true, label: "Your CR is 1" } },
        { kind: "applyStatus", status: "weakened", target: "enemy", save: { skill: "smarts", cr: 2 }, until: "attackerNextTurn", when: { manual: true, label: "Your CR is 2 (e.g. Steeled)" } },
        { kind: "custom", note: "When an enemy tries to Strike an ally near you, target it, use this ability and click the button for your current CR to roll its Smarts save. If it fails, it must Strike you instead. Weakened ends when your next Combat Turn starts. It is meant to help only your allies." }
      ]
    },

    // Tier 8
    {
      id: "warrior-talent-plus-berserker", name: "+1 Grit Talent", tier: 8, path: "berserker", column: 0.5,
      prerequisites: ["warrior-freight-train", "warrior-unencumbered"], prerequisiteMode: "any", kind: "bonus",
      page: 35, action: "passive", uses: null, doom: 0,
      summary: "Add 1 Talent Point to Grit.",
      automation: [
        { kind: "talentPoints", skill: "grit", amount: 1 }
      ]
    },
    {
      id: "warrior-talent-plus-fighter", name: "+1 Grit Talent", tier: 8, path: "fighter", column: 2,
      prerequisites: ["warrior-chained-strike"], prerequisiteMode: "any", kind: "bonus",
      page: 35, action: "passive", uses: null, doom: 0,
      summary: "Add 1 Talent Point to Grit.",
      automation: [
        { kind: "talentPoints", skill: "grit", amount: 1 }
      ]
    },
    {
      id: "warrior-talent-plus-protector", name: "+1 Grit Talent", tier: 8, path: "protector", column: 3.5,
      prerequisites: ["warrior-pro-wrestler", "warrior-juicy-bait"], prerequisiteMode: "any", kind: "bonus",
      page: 35, action: "passive", uses: null, doom: 0,
      summary: "Add 1 Talent Point to Grit.",
      automation: [
        { kind: "talentPoints", skill: "grit", amount: 1 }
      ]
    },

    // Tier 9
    {
      id: "warrior-zen-master", name: "Zen Master", tier: 9, path: "berserker", column: 0.5,
      prerequisites: ["warrior-talent-plus-berserker"], prerequisiteMode: "any", kind: "ability",
      page: 36, action: "passive", uses: null, doom: 0,
      summary: "Smarts symbols count as successes on Grit Checks for Unarmed Strikes.",
      automation: [
        { kind: "extraSuccessFaces", rollSkill: "grit", countsAs: ["smarts"], when: "unarmed" }
      ]
    },
    {
      id: "warrior-primal-surge", name: "Primal Surge", tier: 9, path: "fighter", column: 2,
      prerequisites: ["warrior-talent-plus-fighter"], prerequisiteMode: "any", kind: "ability",
      page: 36, action: "passive", uses: null, doom: 0,
      summary: "While you have 12 or more wounds, Tough rolls 1 extra Skill Die and you may re-roll any non-Grit symbols on those dice. Each Grit symbol blocks 1 damage.",
      upgrades: "warrior-tough",
      automation: [
        { kind: "damageReductionRoll", dice: 1, face: "grit", reroll: true, when: { tags: ["hit"], wounds: { gte: 12 } } }
      ]
    },
    {
      id: "warrior-iron-hide", name: "Iron Hide", tier: 9, path: "protector", column: 3.5,
      prerequisites: ["warrior-talent-plus-protector"], prerequisiteMode: "any", kind: "ability",
      page: 36, action: "passive", uses: null, doom: 0,
      summary: "Tough rolls 3 Skill Dice in total, each Grit symbol blocking 1 damage. You are also Resistant to Shock and Fire damage.",
      upgrades: "warrior-tough",
      automation: [
        { kind: "damageReductionRoll", set: 3, face: "grit", when: "hit" },
        { kind: "resistance", types: ["shock", "fire"] }
      ]
    },

    // Tier 10
    {
      id: "warrior-rage", name: "Rage", tier: 10, path: "berserker", column: 0.5,
      prerequisites: ["warrior-zen-master"], prerequisiteMode: "any", kind: "ability",
      page: 36, action: "passive", uses: null, doom: 0,
      summary: "Each time a successful Strike is made against you, gain 1 extra Attack Action for the rest of the Combat Encounter, up to 3 extra.",
      automation: [
        { kind: "gainActionWhenHit", action: "attack", amount: 1, max: 3 }
      ]
    },
    {
      id: "warrior-brutal-efficiency", name: "Brutal Efficiency", tier: 10, path: "fighter", column: 2,
      prerequisites: ["warrior-primal-surge"], prerequisiteMode: "any", kind: "ability",
      page: 36, action: "free", uses: null, doom: 0,
      summary: "On a Critical Hit you may pick any Critical Hit effect instead of the one for the Strike's Core Skill, or one of two extra effects. Hobble stops the enemy taking a Move Action on its next Combat Turn and drops its Speed one step for good. Crushing Blow makes the enemy Weakened until your next Combat Turn.",
      automation: [
        { kind: "applyStatus", status: "weakened", target: "enemy", until: "attackerNextTurn", when: { manual: true, label: "Crushing Blow" } },
        { kind: "applyStatus", status: "immobile", target: "enemy", flags: { expires: "endOfNextTurn" }, when: { manual: true, label: "Hobble: no Move Action next turn" } },
        { kind: "custom", note: "On a Critical Hit you may swap the automatic crit effect for any skill's crit effect, Crushing Blow or Hobble. Remove the automatic one by hand if you swap. For Crushing Blow or Hobble, target the enemy, use this ability and click the button. Both effects end on their own. Hobble also drops the enemy's base Speed one step for good, so change that by hand." }
      ]
    },
    {
      id: "warrior-adrenaline-rush", name: "Adrenaline Rush", tier: 10, path: "protector", column: 3.5,
      prerequisites: ["warrior-iron-hide"], prerequisiteMode: "any", kind: "ability",
      page: 36, action: "reaction", uses: null, doom: 0,
      summary: "When damage would send you to Death's Door or kill you, roll a Grit Check with CR equal to the number of Adrenaline Rush Checks made this Doom Cycle. On a success you are left on 1 Health Point instead.",
      automation: [
        { kind: "check", skill: "grit", cr: null, label: "Adrenaline Rush (CR = checks this Doom Cycle)", onSuccess: "You are left on 1 Health Point instead.", onFail: "The damage applies as normal.", success: [
          { kind: "removeStatus", status: "deathsDoor" },
          { kind: "removeStatus", status: "dead" },
          { kind: "setHealth", amount: 1 }
        ] },
        { kind: "custom", note: "Roll this after the damage takes you to 0 HP. Keep a count of Adrenaline Rush Checks this Doom Cycle, including this one, and use it as the CR, so the first is CR 1 and the second CR 2. The count resets when a new Doom Cycle starts. The 1 Health Point is set even if you are Cursed." }
      ]
    }
  ],
  discrepancies: [
    "Tier 9 paths: the 2024 p37 diagram puts Primal Surge in the Berserker column and Zen Master in the Fighter column. The p36 headings say Berserker Path: Zen Master and Fighter Path: Primal Surge, and the 2021 printing of the p37 diagram agrees with them. The 2023 errata doesn't mention the change, so the 2024 diagram is treated as a layout slip: Rage needs Zen Master and Brutal Efficiency needs Primal Surge.",
    "Tier 8 nodes read '+1 Grit AD' on the diagram, but p35 says to add 1 Talent Point to Grit. They grant 1 Grit Talent Point.",
    "Freight Train upgrades Charge, but the diagram lets you reach it through Wounded Bear without ever taking Charge. The diagram is followed. The Director may require Charge first.",
    "Wounded Bear (p34) prints '4 Wounds Taken: +1', so 1 to 3 wounds give nothing and +1 applies at exactly 4. It is implemented as printed. Change the first band to 1 to 4 wounds if the Director reads it as a typo.",
    "Get Behind Me (p33) doesn't say whether the 'half each' split needs the CR 1 success or happens on a failure, or whether it covers every attack on the ally before your next turn. Both splits are treated as success options.",
    "Adrenaline Rush (p36) sets CR to the number of checks made this Doom Cycle. Counting only earlier checks would make the first CR 0, but CRs run 1 to 5 (p10), so the current check is counted and the first is CR 1. The book's 'remaining Health Points become 1' isn't healing, so the 1 HP is set directly and the Cursed status doesn't block it.",
    "Charge (p34) is a Grit Check against the enemy's CR that deals Unarmed Strike damage. It is set up as its own Strike at 3 Blunt, since Furious Fists is its only prerequisite, and counts as an Unarmed Strike, so Furious Fists' Talent Die, Martial Artist and Zen Master apply to it. Untick them in the roll dialog if the Director rules the Charge check isn't an Unarmed Strike. Not stated whether the movement also uses the Move Action.",
    "Pro Wrestler's Suplex is called a Strike, so it is an Unarmed Strike mode and Unarmed Strike bonuses apply to it. Caber Toss is only called a Grit Check, so it is a plain Grit Check on the ability's card with no Strike bonuses. Its 'Grappled (pg. 129)' reference is wrong, since Grappled is on p22 and p219.",
    "Unencumbered (p35) makes you Steeled. The system grants that as +1 CR, which stacks with the Steeled status from Block or a Heart Critical. Being Steeled twice shouldn't count twice, so remove the extra Steeled status while Unencumbered applies.",
    "Brutal Efficiency's Hobble (p36) stops the enemy's Move Action on its next Combat Turn. It is shown with the system's Immobile status, which isn't a p219 status, and is removed at the end of that turn.",
    "Meat-Shield (p34) doesn't give the slot's Health Points. It uses the normal 2 HP per Armour Slot (p15) unless the Director changes it.",
    "Counter Attack (p34) states no use limit, range or action cost, so it triggers on every successful attack against you. It is a Grit Check with a fixed result (half damage), not a normal Strike, so its strike mode skips Critical Hit effects.",
    "Rage (p36) doesn't say whether its extra Attack Actions stack with Wounded Bear's. They are separate abilities, so both apply unless the Director rules otherwise.",
    "Chained Strike (p35) doesn't say whether the extra Strikes must hit the same enemy or use the same weapon, or how the double damage stacks with a Critical Hit.",
    "Juicy Bait (p35) makes the enemy Weakened only for your allies. The system's Weakened status lowers its CR for everyone, you included."
  ]
};
