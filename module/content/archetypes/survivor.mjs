export default {
  id: "survivor",
  name: "The Survivor",
  skill: "any",
  page: 72,
  hybrid: { skills: "any", count: 2 },
  startingSkills: { grit: [3, 0], wit: [3, 0], smarts: [3, 0], heart: [3, 0], luck: [3, 0], strange: [3, 0] },
  strength: "Choose two different Core Skills and add +1 Core Skill Point and +1 Talent Point to each (3/0 becomes 4/1). These aren't in the starting tracker, so set them on the tracker yourself.",
  deficiency: {
    exclude: [],
    amount: 1,
    text: "Remove 1 Core Skill Point from each of two different Core Skills (3 to 2). Neither can be one of your Strength skills. Pick one here and lower the second on the tracker yourself."
  },
  special: [],
  paths: [
    { id: "cockroach", name: "Cockroach", column: 0 },
    { id: "leader", name: "Leader", column: 1 },
    { id: "chosen", name: "Chosen", column: 2 },
    { id: "survivalist", name: "Survivalist", column: 3.5 }
  ],
  nodes: [
    // Tier 1
    {
      id: "survivor-deus-ex-machina", name: "Deus Ex Machina", tier: 1, path: "core", column: 1.5,
      prerequisites: [], prerequisiteMode: "any", kind: "ability",
      page: 72, action: "free", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, re-roll a Skill Check and add 1 extra Skill Die to the Dice Pool for the re-roll.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 1, d8: 0, when: { manual: true, label: "Deus Ex Machina re-roll (+1 Skill Die)" } },
        { kind: "custom", note: "After one of your Skill Checks, Use this to spend the Doom Quarter's use, then roll the same check again with the Deus Ex Machina box ticked (+1 Skill Die). The re-roll's result replaces the first." }
      ]
    },

    // Tier 2
    {
      id: "survivor-play-dead", name: "Play Dead", tier: 2, path: "cockroach", column: 0,
      prerequisites: ["survivor-deus-ex-machina"], prerequisiteMode: "any", kind: "ability",
      page: 73, action: "interact", uses: null, doom: 0,
      summary: "On your Combat Turn, spend an Interact Action and roll a Heart Check. Enemies whose CR is equal to or less than your successes stop targeting you. At the start of each later Combat Turn you can keep it up by giving up all your other Actions and rolling Heart again; the new number of Heart symbols sets the CR threshold.",
      automation: [
        { kind: "check", skill: "heart", cr: 1, onSuccess: "Every enemy whose CR is no higher than your number of successes stops targeting you.", onFail: "No successes: no enemy is fooled." },
        { kind: "custom", note: "The Director tracks which enemies ignore you. To keep it up, at the start of each later Combat Turn give up all your other Actions and roll Heart again; the new count of Heart symbols becomes the threshold." }
      ]
    },
    {
      id: "survivor-rally", name: "Rally", tier: 2, path: "chosen-leader", column: 1.5,
      prerequisites: ["survivor-deus-ex-machina"], prerequisiteMode: "any", kind: "ability",
      page: 73, action: "interact", uses: null, doom: 0,
      summary: "During a Combat Encounter, spend an Interact Action to choose an ally within 10 ft. They add +1 Talent Die to their next Fear Check.",
      automation: [
        { kind: "custom", note: "Choose an ally within 10 ft. On their next Fear Check they add +1 Talent Die in their roll dialog." }
      ]
    },
    {
      id: "survivor-field-surgeon", name: "Field Surgeon", tier: 2, path: "survivalist", column: 3.5,
      prerequisites: ["survivor-deus-ex-machina"], prerequisiteMode: "any", kind: "ability",
      page: 73, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, if you have 8 or more wounds, roll a CR 1 Smarts Check to stitch yourself up. On success heal 1 wound, plus 1 more for each Smarts symbol beyond the first.",
      automation: [
        { kind: "heal", skill: "smarts", amount: 1, perSymbol: 1, freeSymbols: 1, cr: 1, target: "self" },
        { kind: "custom", note: "Only usable while you have 8 or more wounds." }
      ]
    },

    // Tier 3
    {
      id: "survivor-worm-tongue", name: "Worm-Tongue", tier: 3, path: "cockroach", column: 0,
      prerequisites: ["survivor-play-dead"], prerequisiteMode: "any", kind: "ability",
      page: 74, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die when attempting to lie.",
      automation: [
        { kind: "poolDice", skill: "heart", d6: 0, d8: 1, when: { notTags: ["attack", "fear", "deathsDoor", "heal", "removeStatus", "save"], manual: true, label: "Attempting to lie" } }
      ]
    },
    {
      id: "survivor-complex-back-story", name: "Complex Back-Story", tier: 3, path: "leader", column: 1,
      prerequisites: ["survivor-rally"], prerequisiteMode: "any", kind: "ability",
      page: 74, action: "passive", uses: null, doom: 0,
      summary: "Choose one additional Background for your character.",
      automation: [
        { kind: "custom", note: "Add a second Background to your character from the Backgrounds list." }
      ]
    },
    {
      id: "survivor-plot-armour", name: "Plot Armour", tier: 3, path: "chosen", column: 2,
      prerequisites: ["survivor-rally"], prerequisiteMode: "any", kind: "ability",
      page: 74, action: "passive", uses: null, doom: 0,
      summary: "One of your Armour Slots holds Plot Armour. It works like normal armour, but it heals all its wounds every Doom Quarter and can't be repaired by normal means. It can't be removed or permanently destroyed: anything that would destroy it reduces it to 0 Health Points instead.",
      automation: [
        { kind: "custom", note: "Add an armour item named Plot Armour (1 Armour Slot, 2 HP, no special ability), tick its 'Can't be destroyed' box and keep it equipped; it rolls like normal armour when you're hit. Restore it to full HP at the start of each Doom Quarter. It can't be repaired normally or removed: if something would destroy it, set it to 0 HP instead." }
      ]
    },
    {
      id: "survivor-camouflage", name: "Camouflage", tier: 3, path: "survivalist", column: 3,
      prerequisites: ["survivor-field-surgeon"], prerequisiteMode: "any", kind: "ability",
      page: 74, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die when trying to Hide.",
      automation: [
        { kind: "poolDice", skill: "wit", d6: 0, d8: 1, when: "hide" },
        { kind: "custom", note: "Roll Hide attempts with the sheet's Hide button (Wit), including the CR 1 Wit Check to stay still when an enemy is within 5 ft, so the +1 Talent Die is added automatically." }
      ]
    },
    {
      id: "survivor-batter-up", name: "Batter Up!", tier: 3, path: "survivalist", column: 4,
      prerequisites: ["survivor-field-surgeon"], prerequisiteMode: "any", kind: "ability",
      page: 74, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die when using melee weapons that deal Blunt damage.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { tags: ["strike", "melee", "weapon"], manual: true, label: "Strike with a melee weapon that deals Blunt damage" } }
      ]
    },

    // Tier 4
    {
      id: "survivor-not-worth-it", name: "Not Worth It", tier: 4, path: "cockroach", column: 0,
      prerequisites: ["survivor-worm-tongue"], prerequisiteMode: "any", kind: "ability",
      page: 74, action: "interact", uses: null, doom: 0,
      summary: "While in a Brawl with an enemy, spend an Interact Action to roll a Heart Check against that enemy's CR. On success you Escape from it without giving it an Attack Action, and it can't target you until your next Combat Turn.",
      automation: [
        { kind: "check", skill: "heart", cr: null, onSuccess: "You Escape from that enemy without giving it an Attack Action, and it can't target you until your next Combat Turn.", onFail: "No effect." },
        { kind: "custom", note: "Only while in a Brawl with the enemy. The CR is that enemy's CR." }
      ]
    },
    {
      id: "survivor-tactical-retreat", name: "Tactical Retreat", tier: 4, path: "leader", column: 1,
      prerequisites: ["survivor-complex-back-story"], prerequisiteMode: "any", kind: "ability",
      page: 74, action: "interact", uses: null, doom: 0,
      summary: "Roll a Heart Check with CR equal to the number of engaged allies within 10 ft of you. On success, all allies can Escape from the enemies Brawling them without giving those enemies an Attack Action. Each enemy escaped from this way makes a Move Action towards you and engages you in a Brawl if it can.",
      automation: [
        { kind: "check", skill: "heart", cr: null, onSuccess: "All allies can Escape from the enemies Brawling them without giving those enemies an Attack Action. Each enemy escaped from moves towards you and engages you in a Brawl if it can.", onFail: "No effect." },
        { kind: "custom", note: "Set the CR to the number of engaged allies within 10 ft of you." }
      ]
    },
    {
      id: "survivor-legendary-weapon", name: "Legendary Weapon", tier: 4, path: "chosen", column: 2,
      prerequisites: ["survivor-plot-armour"], prerequisiteMode: "any", kind: "ability",
      page: 74, action: "passive", uses: null, doom: 0,
      summary: "Gain a Legendary Weapon of your choice (pp.149-150). +1 Talent Die on Strikes with it.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { tags: ["strike", "weapon"], manual: true, label: "Strike with your Legendary Weapon" } },
        { kind: "custom", note: "Add one Legendary Weapon of your choice from the weapons list (pp.149-150)." }
      ]
    },
    {
      id: "survivor-jack-of-all-trades", name: "Jack Of All Trades", tier: 4, path: "survivalist", column: 3.5,
      prerequisites: ["survivor-camouflage", "survivor-batter-up"], prerequisiteMode: "any", kind: "ability",
      page: 74, action: "passive", uses: null, doom: 0,
      summary: "+1 Core Skill Point in a Core Skill in which you have no Talent Point.",
      automation: [
        { kind: "custom", note: "When you take this, put the point in a Core Skill in which you have no Talent Point." }
      ],
      choices: { type: "skillPoints", amount: 1, maxPerSkill: 1 }
    },

    // Tier 5
    {
      id: "survivor-t5-talent-cockroach", name: "+1 Talent (Heart / Smarts)", tier: 5, path: "cockroach", column: 0,
      prerequisites: ["survivor-not-worth-it"], prerequisiteMode: "any", kind: "bonus",
      page: 75, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Heart or Smarts (your choice). Can be used to qualify for a hybrid (p78).",
      automation: [
        { kind: "talentPoints", skill: "choice", amount: 1 },
        { kind: "custom", note: "When you unlock this node, pick Heart or Smarts in the skill prompt (it lists every Core Skill)." }
      ],
      choices: { type: "talentPoints", skills: ["heart", "smarts"], amount: 1 }
    },
    {
      id: "survivor-t5-talent-leader", name: "+1 Talent (Heart / Wit)", tier: 5, path: "leader", column: 1,
      prerequisites: ["survivor-tactical-retreat"], prerequisiteMode: "any", kind: "bonus",
      page: 75, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Heart or Wit (your choice). Can be used to qualify for a hybrid (p78).",
      automation: [
        { kind: "talentPoints", skill: "choice", amount: 1 },
        { kind: "custom", note: "When you unlock this node, pick Heart or Wit in the skill prompt (it lists every Core Skill)." }
      ],
      choices: { type: "talentPoints", skills: ["heart", "wit"], amount: 1 }
    },
    {
      id: "survivor-t5-talent-chosen", name: "+1 Talent (Grit / Wit)", tier: 5, path: "chosen", column: 2,
      prerequisites: ["survivor-legendary-weapon"], prerequisiteMode: "any", kind: "bonus",
      page: 75, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Grit or Wit (your choice). Can be used to qualify for a hybrid (p78).",
      automation: [
        { kind: "talentPoints", skill: "choice", amount: 1 },
        { kind: "custom", note: "When you unlock this node, pick Grit or Wit in the skill prompt (it lists every Core Skill)." }
      ],
      choices: { type: "talentPoints", skills: ["grit", "wit"], amount: 1 }
    },
    {
      id: "survivor-t5-talent-survivalist", name: "+1 Talent (Grit / Wit)", tier: 5, path: "survivalist", column: 3.5,
      prerequisites: ["survivor-jack-of-all-trades"], prerequisiteMode: "any", kind: "bonus",
      page: 75, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Grit or Wit (your choice). Can be used to qualify for a hybrid (p78).",
      automation: [
        { kind: "talentPoints", skill: "choice", amount: 1 },
        { kind: "custom", note: "When you unlock this node, pick Grit or Wit in the skill prompt (it lists every Core Skill)." }
      ],
      choices: { type: "talentPoints", skills: ["grit", "wit"], amount: 1 }
    },

    // Tier 6
    {
      id: "survivor-leech", name: "Leech", tier: 6, path: "cockroach", column: 0,
      prerequisites: ["survivor-t5-talent-cockroach"], prerequisiteMode: "any", kind: "ability",
      page: 75, action: "interact", uses: null, doom: 0,
      summary: "In combat, spend an Interact Action to try to steal a Talent Die. Against an ally, pick a Core Skill in which they have a Talent Die and roll an Opposed Heart Check; against an enemy the Opposed Check uses Smarts. On success you gain that Talent Die and the target loses it until the start of your next Combat Turn. Outside combat the effect lasts 30 seconds.",
      automation: [
        { kind: "check", skill: "heart", cr: null, onSuccess: "You gain the target's Talent Die in the chosen Core Skill and they lose it until the start of your next Combat Turn (30 seconds outside combat).", onFail: "No effect." },
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Leech: stolen Talent Die (that Core Skill only, until the start of your next Combat Turn)" } },
        { kind: "custom", note: "Opposed check: against an enemy switch the roll to Smarts. While the stolen die lasts, tick the Leech box on checks with that skill; the target rolls 1 fewer Talent Die in it." }
      ]
    },
    {
      id: "survivor-adrenaline", name: "Adrenaline", tier: 6, path: "leader", column: 1,
      prerequisites: ["survivor-t5-talent-leader"], prerequisiteMode: "any", kind: "ability",
      page: 75, action: "passive", uses: null, doom: 0,
      summary: "While Afraid or Terrified you are Steeled and Fast.",
      automation: [
        { kind: "cr", amount: 1, when: { fear: { gte: 1 } } },
        { kind: "speed", set: "fast", when: { fear: { gte: 1 } } }
      ]
    },
    {
      id: "survivor-power-through", name: "Power Through", tier: 6, path: "chosen", column: 2,
      prerequisites: ["survivor-t5-talent-chosen"], prerequisiteMode: "any", kind: "ability",
      page: 75, action: "passive", uses: null, doom: 0,
      summary: "While you have 8 or more wounds, roll 1 additional Skill Die for your Plot Armour when it tries to repel damage.",
      automation: [
        { kind: "custom", note: "With 8 or more wounds, when you're hit and Plot Armour rolls, roll 1 extra Skill Die for it: Luck blocks 1 damage; Strange blocks 1 damage and Plot Armour takes 1 wound." }
      ],
      upgrades: "survivor-plot-armour"
    },
    {
      id: "survivor-final-survivor", name: "Final Survivor", tier: 6, path: "survivalist", column: 3.5,
      prerequisites: ["survivor-t5-talent-survivalist"], prerequisiteMode: "any", kind: "ability",
      page: 75, action: "passive", uses: null, doom: 0,
      summary: "For each ally who dies during the story, add +1 Core Skill Point to a Core Skill of your choice for the rest of the story (maximum +3). If you are the last one left alive, also add +1 Talent Point to a chosen Core Skill.",
      automation: [
        { kind: "custom", note: "Each time an ally dies this story, add +1 Core Skill Point to a Core Skill of your choice by adding a skillPoints rule to this ability (at most 3 in total). If you are the last one left alive, also add +1 Talent Point to a Core Skill of your choice. Remove these bonuses when the story ends." }
      ]
    },

    // Tier 7
    {
      id: "survivor-copycat", name: "Copycat", tier: 7, path: "cockroach", column: 0,
      prerequisites: ["survivor-leech"], prerequisiteMode: "any", kind: "ability",
      page: 75, action: "interact", uses: null, doom: 0,
      summary: "In combat, spend an Interact Action to try to temporarily steal an ability you have seen the target use: Opposed Smarts Check against an enemy, Opposed Heart Check against an ally. On success you can use one of their abilities (your choice) on your Combat Turn, and the target can't use it until your next Combat Turn. Outside combat the effect lasts 30 seconds.",
      automation: [
        { kind: "check", skill: "smarts", cr: null, onSuccess: "You can use one of the target's abilities that you've seen in action (your choice) on your Combat Turn. The target can't use it until your next Combat Turn (30 seconds outside combat).", onFail: "No effect." },
        { kind: "custom", note: "Opposed check: Smarts against an enemy, Heart against an ally (switch the skill in the roll dialog)." }
      ]
    },
    {
      id: "survivor-thats-an-order", name: "That's An Order", tier: 7, path: "leader", column: 1,
      prerequisites: ["survivor-adrenaline"], prerequisiteMode: "any", kind: "ability",
      page: 75, action: "interact", uses: null, doom: 0,
      summary: "Spend an Interact Action and 1 Luck Point from your Luck Bank to let another ally take 1 additional Attack Action. Once per ally per Combat Encounter.",
      automation: [
        { kind: "cost", luck: 1 },
        { kind: "custom", note: "The ally you choose may take 1 additional Attack Action. Each ally can get this only once per Combat Encounter." }
      ]
    },
    {
      id: "survivor-heros-resolve-monster-hunter", name: "Hero's Resolve / Monster Hunter", tier: 7, path: "chosen", column: 2,
      prerequisites: ["survivor-power-through"], prerequisiteMode: "any", kind: "ability",
      page: 75, action: "passive", uses: null, doom: 0,
      summary: "Pick one. Hero's Resolve: +1 Talent Die on Heart Checks with good NPCs or allies; -1 Skill Die when disguising yourself or on Heart Checks against enemies or NPCs aligned against your cause. Monster Hunter: +1 Talent Die on Strikes against non-human enemies; -1 Skill Die on Strikes against humans.",
      automation: [
        { kind: "poolDice", skill: "heart", d6: 0, d8: 1, when: { notTags: ["attack", "fear", "deathsDoor", "heal", "removeStatus", "save"], manual: true, label: "Hero's Resolve: Heart Check with a good NPC or an ally" } },
        { kind: "poolDice", skill: "any", d6: -1, d8: 0, when: { notTags: ["fear", "deathsDoor", "heal", "removeStatus", "save"], manual: true, label: "Hero's Resolve: disguising yourself, or a Heart Check against an enemy or NPC opposed to your cause (-1 Skill Die)" } },
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { tags: ["strike"], manual: true, label: "Monster Hunter: Strike against a non-human enemy" } },
        { kind: "poolDice", skill: "any", d6: -1, d8: 0, when: { tags: ["strike"], manual: true, label: "Monster Hunter: Strike against a human (-1 Skill Die)" } },
        { kind: "custom", note: "Choose Hero's Resolve or Monster Hunter when you take this, then delete the other option's two rules (or ignore their boxes)." }
      ]
    },
    {
      id: "survivor-bitter-ends", name: "Bitter Ends", tier: 7, path: "survivalist", column: 3.5,
      prerequisites: ["survivor-final-survivor"], prerequisiteMode: "any", kind: "ability",
      page: 75, action: "passive", uses: null, doom: 0,
      summary: "With 12 or more wounds you are Steeled. If you are already Steeled, you gain +1 Challenge Rating.",
      automation: [
        { kind: "cr", amount: 1, when: { wounds: { gte: 12 } } }
      ]
    },

    // Tier 8
    {
      id: "survivor-showdown", name: "Showdown", tier: 8, path: "all", column: 1.5,
      prerequisites: ["survivor-copycat", "survivor-thats-an-order", "survivor-heros-resolve-monster-hunter", "survivor-bitter-ends"], prerequisiteMode: "any", kind: "ability",
      page: 76, action: "passive", uses: null, doom: 0,
      summary: "While you are in a Brawl with a single enemy, you are the only one Brawling it, and no ally has targeted it during the Brawl, you are Steeled and gain 1 extra Attack Action.",
      automation: [
        { kind: "applyStatus", status: "steeled", target: "self", until: "encounter" },
        { kind: "extraActions", action: "attack", amount: 1, when: { manual: true, label: "Showdown: you're the only one in a Brawl with a single enemy that no ally has targeted during the Brawl" } },
        { kind: "custom", note: "Use this when the Showdown conditions start to mark yourself Steeled (it clears at the end of combat). Remove Steeled sooner if someone else joins the Brawl or an ally targets the enemy. The tracker always counts the extra Attack Action; only take it while the conditions hold." }
      ]
    },

    // Tier 9
    {
      id: "survivor-t9-cr-cockroach", name: "+1 CR", tier: 9, path: "cockroach", column: 0,
      prerequisites: ["survivor-showdown"], prerequisiteMode: "any", kind: "bonus",
      page: 76, action: "passive", uses: null, doom: 0,
      summary: "Your Challenge Rating permanently increases by 1.",
      automation: [{ kind: "cr", amount: 1 }]
    },
    {
      id: "survivor-t9-talent-leader", name: "+1 Talent", tier: 9, path: "leader", column: 1,
      prerequisites: ["survivor-showdown"], prerequisiteMode: "any", kind: "bonus",
      page: 76, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in any Core Skill.",
      automation: [
        { kind: "talentPoints", skill: "choice", amount: 1 }
      ],
      choices: { type: "talentPoints", amount: 1, maxPerSkill: 1 }
    },
    {
      id: "survivor-t9-cr-chosen", name: "+1 CR", tier: 9, path: "chosen", column: 2,
      prerequisites: ["survivor-showdown"], prerequisiteMode: "any", kind: "bonus",
      page: 76, action: "passive", uses: null, doom: 0,
      summary: "Your Challenge Rating permanently increases by 1.",
      automation: [{ kind: "cr", amount: 1 }]
    },
    {
      id: "survivor-t9-talent-survivalist", name: "+1 Talent", tier: 9, path: "survivalist", column: 3.5,
      prerequisites: ["survivor-showdown"], prerequisiteMode: "any", kind: "bonus",
      page: 76, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in any Core Skill.",
      automation: [
        { kind: "talentPoints", skill: "choice", amount: 1 }
      ],
      choices: { type: "talentPoints", amount: 1, maxPerSkill: 1 }
    },

    // Tier 10
    {
      id: "survivor-cockroach", name: "Cockroach", tier: 10, path: "cockroach", column: 0,
      prerequisites: ["survivor-t9-cr-cockroach"], prerequisiteMode: "any", kind: "ability",
      page: 76, action: "reaction", uses: null, doom: 0,
      summary: "When an enemy Strike would make you Dead or put you at Death's Door, and another ally or enemy (not the attacker) is within 10 ft, roll a Luck Check with CR equal to the number of times you have used this ability this Doom Cycle. On success the blow leaves you at 1 Health Point instead. The prevented damage goes to one enemy within 10 ft other than the attacker or, if there is none, to the nearest ally within 10 ft. If no one can take it, you die.",
      automation: [
        { kind: "check", skill: "luck", cr: null, onSuccess: "You drop to 1 Health Point instead. Deal the prevented damage to one enemy within 10 ft other than the attacker or, if there is none, to the nearest ally within 10 ft. If no one can take it, you die.", onFail: "The blow lands as normal." },
        { kind: "custom", note: "Trigger: an enemy Strike that would kill you or put you at Death's Door while another ally or enemy besides the attacker is within 10 ft. The CR is the number of times you have used Cockroach this Doom Cycle, so keep count." }
      ]
    },
    {
      id: "survivor-no-one-left-behind", name: "No One Left Behind", tier: 10, path: "leader", column: 1,
      prerequisites: ["survivor-t9-talent-leader"], prerequisiteMode: "any", kind: "ability",
      page: 76, action: "passive", uses: null, doom: 0,
      summary: "While an ally you can see has 12 or more wounds, you gain +1 Talent Point in Grit and in Wit until they are healed. If you are within 10 ft of that ally, they are also Steeled.",
      automation: [
        { kind: "poolDice", skill: ["grit", "wit"], d6: 0, d8: 1, when: { manual: true, label: "An ally you can see has 12 or more wounds" } },
        { kind: "applyStatus", status: "steeled", target: "ally" },
        { kind: "custom", note: "The +1 Talent Point in Grit and Wit is the +1 Talent Die box on those checks. Target the badly wounded ally while within 10 ft and Use this to mark them Steeled; remove it once they are healed or you are more than 10 ft away." }
      ]
    },
    {
      id: "survivor-earth-wind-and-fire", name: "Earth, Wind, and Fire", tier: 10, path: "chosen", column: 2,
      prerequisites: ["survivor-t9-cr-chosen"], prerequisiteMode: "any", kind: "ability",
      page: 76, action: "passive", uses: null, doom: 0,
      summary: "Gain one unnatural power from p95, chosen with the Director.",
      automation: [
        { kind: "custom", note: "Choose one Earth, Wind and Fire power (p95) with the Director and add it from the powers list." }
      ]
    },
    {
      id: "survivor-highly-skilled", name: "Highly Skilled", tier: 10, path: "survivalist", column: 3.5,
      prerequisites: ["survivor-t9-talent-survivalist"], prerequisiteMode: "any", kind: "ability",
      page: 76, action: "passive", uses: null, doom: 0,
      summary: "Gain one ability from another part of the Survivor tree, below Tier 9.",
      automation: [
        { kind: "custom", note: "Choose one ability below Tier 9 from another part of the Survivor tree and add it to your character." }
      ]
    }
  ],
  discrepancies: [
    "The diagram (p77) labels some nodes differently from the text: 'Worm Tongue', 'Complex Back Story', 'Batter Up', 'Heroes Resolve', 'Earth Wind and Fire'. Used the text names (p73-76). p77's text layer also hides labels from an older tree ('Tough as Nails', '+1 Speed', '+1 AD', 'Cashing In') that aren't on the printed diagram. Ignored.",
    "Strength (p72): '+1 Talent Point and +1 Core Skill Point in two different Core Skills' is read as both points going to each of the two skills (4/1 and 4/1). It is a player choice, so the starting tracker stays at 3/0 and the player sets it.",
    "Deficiency (p72) removes 1 point from each of two skills. The archetype picker handles one skill, so the second is lowered by hand.",
    "Tier 5 text (p75) says '1 Talent Die in a specific Core Skill'; the diagram shows '+1 TP' with two skills per path (e.g. 'HEARTS / SMARTS'). Followed the diagram: +1 Talent Point in one of the two skills, the player's choice. The unlock prompt lists every Core Skill, so a note reminds the player of the two allowed.",
    "Tier 9 text (p76) ties the bonus to the path you took, but on the diagram Showdown connects to all four Tier 9 nodes. Followed the diagram (each needs only Showdown). The Director may limit it to your own path.",
    "Rally is printed as 'Chosen/Leader path' and sits on the shared trunk before the Chosen and Leader paths split (diagram). Its path is 'chosen-leader'.",
    "Field Surgeon and Tactical Retreat print no action cost. Set to Interact (non-attack ability, p22). Tactical Retreat has no use limit. Unclear whether a failed Field Surgeon roll spends the Doom Quarter's use.",
    "Deus Ex Machina: 'any Skill Check' is read as one of your own checks.",
    "Play Dead: the first roll counts successes and the maintain roll counts Heart symbols. Talent Die faces count as Heart symbols on a Heart Check (p10), so both readings agree.",
    "Complex Back-Story: presumably the extra Background brings both its ability and its Flaw.",
    "Plot Armour: no stats beyond 'behaves like a normal piece of armour'. Assumed 1 Armour Slot (2 HP) with no special ability, and 'heals its wounds every Doom Quarter' read as full HP at each new Doom Quarter.",
    "Power Through: the extra die is rolled like an armour die (Luck blocks, Strange blocks and wounds Plot Armour). Unclear whether it still rolls once Plot Armour is at 0 HP.",
    "Leech and Copycat: no rule says which Talent Die is stolen from an enemy, which may have none, or how copied limited-use abilities work.",
    "That's An Order: unclear whether the ally takes the extra Attack Action right away or on their own Combat Turn.",
    "Adrenaline and Bitter Ends give their Steeled as a live +1 CR (while Afraid or Terrified; at 12+ wounds) rather than a Steeled status. Bitter Ends' 'if already Steeled, +1 CR' implies Steeled doesn't stack with itself, and the +1 CR rule gives the right total either way. Adrenaline's +1 CR does stack with a Steeled status from another source (e.g. Showdown), which RAW it shouldn't; the Director can discount it.",
    "Showdown: no frequency is given for the extra Attack Action. Read as 1 extra Attack Action on each of your Combat Turns while the conditions hold.",
    "Cockroach: if the CR counts only earlier uses, the first use each Doom Cycle is CR 0 (automatic success). It only triggers on enemy Strikes, not on statuses or hazards.",
    "No One Left Behind: 'until they are healed' doesn't say whether that means below 12 wounds or fully healed. Several badly wounded allies presumably don't stack.",
    "Highly Skilled: doesn't say whether prerequisites apply or whether Tier 5 bonus nodes and Showdown can be taken."
  ]
};
