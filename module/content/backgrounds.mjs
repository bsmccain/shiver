// SHIVER Core Rulebook backgrounds (pp. 80-94): one Ability and one Flaw each.
// group = the Archetype group the Background belongs to; randomiser = the Skill Die symbol that picks it within the group
// (p.80: roll a Skill Die for the group, then again for the Background; a Luck symbol lets the player pick).
export default [
  // Warrior Backgrounds (pp. 81-82)
  {
    id: "bg-jock", name: "The Jock", page: 81, group: "warrior", randomiser: "grit",
    abilityName: "Athlete",
    abilitySummary: "+1 Talent Die on feats of athleticism such as running, jumping and climbing.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Athlete", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Feat of athleticism (running, jumping, climbing, etc.)" } }
    ],
    flawName: "Cocky",
    flawSummary: "When a failed Skill Check ticks the Doom Clock forward, tick it 1 extra minute for each Strange symbol rolled.",
    flawAutomation: [
      { kind: "doomModifier", extraPerStrange: 1 }
    ]
  },
  {
    id: "bg-soldier", name: "The Soldier", page: 81, group: "warrior", randomiser: "wit",
    abilityName: "Gun Nut",
    abilitySummary: "+1 Talent Die on Strikes with ranged weapons that aren't thrown.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Gun Nut", skill: "any", d6: 0, d8: 1, when: { tags: ["strike", "ranged", "weapon"], notTags: ["thrown"], label: "Strike with a non-thrown ranged weapon" } }
    ],
    flawName: "Superstitious",
    flawSummary: "Any Fear Check caused by an unnatural (non-human) creature fails automatically.",
    flawAutomation: [
      { kind: "autoFail", label: "Superstitious", skill: "any", when: { tags: ["fear"], notTags: ["steady"], manual: true, label: "Fear Check caused by a non-human creature" } }
    ]
  },
  {
    id: "bg-gentle-giant", name: "The Gentle Giant", page: 81, group: "warrior", randomiser: "smarts",
    abilityName: "Feed the Rabbits",
    abilitySummary: "+1 Talent Die when interacting with animals.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Feed the Rabbits", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Interacting with animals" } }
    ],
    flawName: "Pacifist",
    flawSummary: "Lose 1 Skill Die when Striking humans or animals.",
    flawAutomation: [
      { kind: "poolDice", label: "Pacifist", skill: "any", d6: -1, d8: 0, when: { tags: ["strike"], manual: true, label: "Striking a human or an animal" } }
    ]
  },
  {
    id: "bg-goon", name: "The Goon", page: 82, group: "warrior", randomiser: "heart",
    abilityName: "Knock Knock",
    abilitySummary: "+1 Talent Die when forcing entry through a door or entrance, breaking a lock or busting down a barricade.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Knock Knock", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Forcing a door or entrance, breaking a lock or busting a barricade" } }
    ],
    flawName: "Blunt",
    flawSummary: "Lose 1 Skill Die when trying to persuade or lie.",
    flawAutomation: [
      { kind: "poolDice", label: "Blunt", skill: "any", d6: -1, d8: 0, when: { notTags: ["attack", "fear"], manual: true, label: "Persuading or lying" } }
    ]
  },
  {
    id: "bg-troglodyte", name: "The Troglodyte", page: 82, group: "warrior", randomiser: "strange",
    abilityName: "Strong",
    abilitySummary: "Ignore the Heavy property on weapons and armour. On Opposed Grit Checks, add 1 to the successes you roll.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "extraActions", action: "interact", amount: 1, when: { manual: true, label: "Only to cover the extra Interact Action a Heavy weapon's Strike costs" } },
      { kind: "custom", note: "Ignore Heavy: Heavy armour doesn't lower your Speed. The system still slows you one step for equipped Heavy armour, so undo it by hand. (A Heavy weapon's extra Interact Action is covered by this Background's extra Interact Action.)" },
      { kind: "custom", note: "On an Opposed Grit Check, add 1 to your successes when comparing results." }
    ],
    flawName: "Stupid",
    flawSummary: "Lose 1 Skill Die on Smarts Checks made outside a Combat Encounter.",
    flawAutomation: [
      { kind: "poolDice", label: "Stupid", skill: "smarts", d6: -1, d8: 0, when: { notTags: ["combat", "attack"], label: "Outside a Combat Encounter (untick in combat)" } }
    ]
  },

  // Maverick Backgrounds (pp. 83-84)
  {
    id: "bg-hunter", name: "The Hunter", page: 83, group: "maverick", randomiser: "grit",
    abilityName: "Tracker",
    abilitySummary: "+1 Talent Die when tracking or investigating.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Tracker", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Tracking or investigating" } }
    ],
    flawName: "One Track Mind",
    flawSummary: "In a Combat Encounter you become obsessed with the enemy you target. Targeting a different enemy is at Minor Disadvantage until the obsession dies or is out of your view.",
    flawAutomation: [
      { kind: "poolDice", label: "One Track Mind", skill: "any", d6: -1, d8: 0, when: { any: ["strike", "ability"], manual: true, label: "Targeting an enemy other than your obsession" } },
      { kind: "custom", note: "The first enemy you target in a Combat Encounter is your obsession until it dies or leaves your view." }
    ]
  },
  {
    id: "bg-rebel", name: "The Rebel", page: 83, group: "maverick", randomiser: "smarts",
    abilityName: "Keeping a Distance",
    abilitySummary: "After a successful Strike you may Escape at once; it costs no Interact Action and the enemy gets no Attack Action against you.",
    action: "free", uses: null, doom: 0,
    automation: [
      { kind: "extraActions", action: "interact", amount: 1, when: { manual: true, label: "Only to Escape right after a successful Strike" } },
      { kind: "custom", note: "Right after a successful Strike you may Escape from the Brawl. It costs no Interact Action (the extra Interact Action covers it) and the enemies in the Brawl get no Attack Action against you." }
    ],
    flawName: "Uncooperative",
    flawSummary: "You can't Assist allies or be Assisted by them on Skill Checks. Working together with an ally in any other way is at Minor Disadvantage.",
    flawAutomation: [
      { kind: "custom", note: "You can't give or receive Assist dice on Skill Checks." },
      { kind: "poolDice", label: "Uncooperative", skill: "any", d6: -1, d8: 0, when: { notTags: ["fear", "attack"], manual: true, label: "Working together with an ally (other than Assisting)" } }
    ]
  },
  {
    id: "bg-criminal", name: "The Criminal", page: 83, group: "maverick", randomiser: "wit",
    abilityName: "Underworld Contacts",
    abilitySummary: "+1 Talent Die when dealing in criminal activity.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Underworld Contacts", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Dealing in criminal activity" } }
    ],
    flawName: "Untrustworthy",
    flawSummary: "When trying to persuade others, lose 1 Skill Die and any Talent Dice.",
    flawAutomation: [
      { kind: "poolDice", label: "Untrustworthy", skill: "any", d6: -1, d8: -9, when: { notTags: ["attack", "fear"], manual: true, label: "Persuading others (lose 1 Skill Die and all Talent Dice; leave other Talent Die bonuses unticked)" } }
    ]
  },
  {
    id: "bg-operative", name: "The Operative", page: 84, group: "maverick", randomiser: "heart",
    abilityName: "Ghost",
    abilitySummary: "You may re-roll your first failed Wit Check when trying to enter Stealth.",
    action: "free", uses: null, doom: 0,
    automation: [
      { kind: "custom", note: "If your first Wit Check to enter Stealth fails, you may re-roll it." }
    ],
    flawName: "Covert",
    flawSummary: "You can't use items with the Heavy property, including weapons and armour.",
    flawAutomation: [
      { kind: "custom", note: "You can't equip or use any weapon, armour or other item with the Heavy property." }
    ]
  },
  {
    id: "bg-drifter", name: "The Drifter", page: 84, group: "maverick", randomiser: "strange",
    abilityName: "Street Smarts",
    abilitySummary: "+1 Talent Die when navigating.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Street Smarts", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Navigating" } }
    ],
    flawName: "Lone Wolf",
    flawSummary: "You can't contribute to Overwhelming an enemy.",
    flawAutomation: [
      { kind: "custom", note: "Don't count this character among the 3+ characters needed to Overwhelm an enemy (adjust the automatic Overwhelm by hand)." }
    ]
  },

  // Scholar Backgrounds (pp. 85-86)
  {
    id: "bg-scientist", name: "The Scientist", page: 85, group: "scholar", randomiser: "grit",
    abilityName: "Thinking Outside the Box",
    abilitySummary: "After failing a non-Smarts Check outside Combat, you may re-roll every die showing a Smarts symbol.",
    action: "free", uses: null, doom: 0,
    automation: [
      { kind: "custom", note: "After failing a check of any skill other than Smarts outside Combat, you may re-roll every die that shows a Smarts symbol." }
    ],
    flawName: "Calculating",
    flawSummary: "Lose a Heart die when trying to read someone's emotional state or tell whether they are telling the truth.",
    flawAutomation: [
      { kind: "poolDice", label: "Calculating", skill: "heart", d6: -1, d8: 0, when: { notTags: ["attack", "fear"], manual: true, label: "Reading someone's emotions or whether they're lying" } }
    ]
  },
  {
    id: "bg-surgeon", name: "The Surgeon", page: 85, group: "scholar", randomiser: "smarts",
    abilityName: "Surgical Strike",
    abilitySummary: "+1 Talent Die when attacking Humanoid enemies.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Surgical Strike", skill: "any", d6: 0, d8: 1, when: { tags: ["strike"], manual: true, label: "Attacking a Humanoid enemy" } }
    ],
    flawName: "Arrogant",
    flawSummary: "If you miss with a Strike, your next Strike is at Minor Disadvantage.",
    flawAutomation: [
      { kind: "poolDice", label: "Arrogant", skill: "any", d6: -1, d8: 0, when: { tags: ["strike"], manual: true, label: "Your previous Strike missed" } }
    ]
  },
  {
    id: "bg-nerd", name: "The Nerd", page: 85, group: "scholar", randomiser: "wit",
    abilityName: "Run Away",
    abilitySummary: "Enemies get no Attack Actions when you Escape a Brawl. A Move Action straight away from an enemy you're Brawling makes your Speed Fast until your Combat Turn ends.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "custom", note: "When you Escape from a Brawl, enemies get no Attack Actions against you." },
      { kind: "custom", note: "If your Move Action takes you directly away from an enemy you're Brawling, your Speed is Fast (40 ft) until the end of your Combat Turn." }
    ],
    flawName: "Weak",
    flawSummary: "While wearing armour, your Speed is Slow.",
    flawAutomation: [
      // There is no "wearing armour" condition, so drop Speed to Slow by default and cancel it out when no armour is worn.
      { kind: "speedStep", amount: -4 },
      { kind: "speedStep", amount: 4, when: { noArmour: true, label: "No armour worn (Weak doesn't apply)" } }
    ]
  },
  {
    id: "bg-hacker", name: "The Hacker", page: 86, group: "scholar", randomiser: "heart",
    abilityName: "It's a Unix System",
    abilitySummary: "+1 Talent Die on Smarts Checks to interact with technology.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "It's a Unix System", skill: "smarts", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Interacting with technology" } }
    ],
    flawName: "Night Owl",
    flawSummary: "In the daytime, lose 1 Skill Die on Wit Checks to observe your surroundings.",
    flawAutomation: [
      { kind: "poolDice", label: "Night Owl", skill: "wit", d6: -1, d8: 0, when: { notTags: ["attack", "fear"], manual: true, label: "Daytime: observing your surroundings" } }
    ]
  },
  {
    id: "bg-tinkerer", name: "The Tinkerer", page: 86, group: "scholar", randomiser: "strange",
    abilityName: "Fixer",
    abilitySummary: "+1 Talent Die when fixing or constructing mechanical objects.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Fixer", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Fixing or constructing a mechanical object" } }
    ],
    flawName: "Curious",
    flawSummary: "When you hear a peculiar noise or see an unopened chest or door, you must pass a CR 2 Smarts Check to resist investigating blindly.",
    flawAutomation: [
      { kind: "check", skill: "smarts", cr: 2, label: "Curious (peculiar noise, or an unopened chest or door)", onSuccess: "You resist the urge.", onFail: "You must investigate it blindly." }
    ]
  },

  // Socialite Backgrounds (pp. 87-88)
  {
    id: "bg-actor", name: "The Actor", page: 87, group: "socialite", randomiser: "grit",
    abilityName: "Going Method",
    abilitySummary: "+1 Talent Die when disguising yourself as someone else.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Going Method", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Disguising yourself as someone else" } }
    ],
    flawName: "Drama Queen",
    flawSummary: "On Heart Checks to lie, charm or persuade, rolling 2 or more successes over the CR makes you fail.",
    flawAutomation: [
      { kind: "custom", note: "On a Heart Check to lie, charm or persuade, a roll of CR + 2 or more successes is a failure. Change the outcome by hand." }
    ]
  },
  {
    id: "bg-cheerleader", name: "The Cheerleader", page: 87, group: "socialite", randomiser: "wit",
    abilityName: "Back-Flip",
    abilitySummary: "When targeted by an attack from a Large to Colossal enemy, roll 1 Skill Die. On a Wit symbol you take no damage.",
    action: "reaction", uses: null, doom: 0,
    automation: [
      { kind: "custom", note: "When a Large, Giant or Colossal enemy targets you with an attack, roll 1 Skill Die. On a Wit symbol you take no damage from that attack." }
    ],
    flawName: "Vain",
    flawSummary: "While you have 8 or more wounds, lose 1 Core Skill Point from Heart until you've healed.",
    flawAutomation: [
      { kind: "poolDice", label: "Vain", skill: "heart", d6: -1, d8: 0, when: { wounds: { gte: 8 }, label: "8 or more wounds" } }
    ]
  },
  {
    id: "bg-con-man", name: "The Con Man", page: 87, group: "socialite", randomiser: "smarts",
    abilityName: "Big Fight Energy",
    abilitySummary: "In a Brawl you count as 2 characters when Overwhelming an enemy.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "custom", note: "Count this character twice towards the 3+ characters needed to Overwhelm an enemy in your Brawl." }
    ],
    flawName: "Centre of Attention",
    flawSummary: "In a Combat Encounter, an enemy that would target a character at random always targets you.",
    flawAutomation: [
      { kind: "custom", note: "Director: whenever an enemy would pick its target at random, it picks this character." }
    ]
  },
  {
    id: "bg-priest", name: "The Priest", page: 88, group: "socialite", randomiser: "heart",
    abilityName: "Holy Smash",
    abilitySummary: "Interact Action: make an Opposed Heart Check against an ally or enemy. If you succeed, the target has Minor Advantage or Major Disadvantage on its next Skill Check, depending on your sermon.",
    action: "interact", uses: null, doom: 0,
    automation: [
      { kind: "check", skill: "heart", cr: null, label: "Holy Smash (opposed by the targeted ally or enemy)", onSuccess: "The target has your choice of Minor Advantage or Major Disadvantage on its next Skill Check.", onFail: "No effect." },
      { kind: "custom", note: "Opposed: the Director sets the CR from the target's roll. Apply the chosen Advantage or Disadvantage to the target's next Skill Check by hand." }
    ],
    flawName: "Shaken Faith",
    flawSummary: "Meeting a supernatural being (ghost, demon, etc.) calls for a CR 1 Fear Check. Failing makes you Afraid, and your Fear Checks are +1 CR until you are Stable.",
    flawAutomation: [
      { kind: "custom", note: "Director: when this character meets a supernatural being (ghost, demon, etc.), call for a CR 1 Fear Check. On a failure they become Afraid, and add +1 to the CR of their Fear Checks until they are Stable again." }
    ]
  },
  {
    id: "bg-lawyer", name: "The Lawyer", page: 88, group: "socialite", randomiser: "strange",
    abilityName: "Legal Speak",
    abilitySummary: "+1 Talent Die when trying to persuade authority figures.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Legal Speak", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Persuading the law or an authority figure" } }
    ],
    flawName: "Law Abiding Citizen",
    flawSummary: "All Skill Checks for any action that could be considered criminal are at Minor Disadvantage.",
    flawAutomation: [
      { kind: "poolDice", label: "Law Abiding Citizen", skill: "any", d6: -1, d8: 0, when: { notTags: ["fear"], manual: true, label: "Doing something that could be considered criminal" } }
    ]
  },

  // Fool Backgrounds (pp. 89-90)
  {
    id: "bg-harbinger", name: "The Harbinger", page: 89, group: "fool", randomiser: "grit",
    abilityName: "Game Over Man!",
    abilitySummary: "OPDQ: roll your Luck Pool. If you roll more Luck than Strange symbols, the Director gives guidance on where danger may lurk. If not, you may stumble onto something deadly or get bad advice.",
    action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
    automation: [
      { kind: "check", skill: "luck", cr: null, label: "Game Over Man!", onSuccess: "More Luck than Strange symbols: the Director hints where danger may lurk.", onFail: "Otherwise you may stumble onto something deadly, or get bad advice." },
      { kind: "custom", note: "No CR: compare the Luck symbols rolled with the Strange symbols rolled." }
    ],
    flawName: "Morbid",
    flawSummary: "Lose 1 Skill Die on all Fear Checks and on any Check that would make you Afraid or Terrified.",
    flawAutomation: [
      { kind: "poolDice", label: "Morbid", skill: "any", d6: -1, d8: 0, when: { tags: ["fear"], label: "Fear Check" } },
      { kind: "poolDice", label: "Morbid", skill: "any", d6: -1, d8: 0, when: { notTags: ["fear", "attack"], manual: true, label: "Failing would make you Afraid or Terrified" } }
    ]
  },
  {
    id: "bg-janitor", name: "The Janitor", page: 89, group: "fool", randomiser: "wit",
    abilityName: "Mop Master",
    abilitySummary: "+1 Talent Die when fighting with improvised weapons. Improvised weapons deal +1 damage, or +2 if the weapon is a mop.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Mop Master", skill: "any", d6: 0, d8: 1, when: { tags: ["strike", "weapon"], notTags: ["unarmed"], manual: true, label: "Fighting with an improvised weapon" } },
      { kind: "strikeMode", label: "Mop Master: improvised weapon (+1 damage)", damageBonus: 1, onHit: [] },
      { kind: "strikeMode", label: "Mop Master: mop (+2 damage)", damageBonus: 2, onHit: [] }
    ],
    flawName: "Clean Freak",
    flawSummary: "Minor Disadvantage on all Skill Checks while covered in grime or in a filthy environment.",
    flawAutomation: [
      { kind: "poolDice", label: "Clean Freak", skill: "any", d6: -1, d8: 0, when: { manual: true, label: "Covered in grime or in a filthy environment" } }
    ]
  },
  {
    id: "bg-stoner", name: "The Stoner", page: 89, group: "fool", randomiser: "smarts",
    abilityName: "Taking a Hit",
    abilitySummary: "OPDQ: take a big hit from your stash to heal 3 wounds.",
    action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
    automation: [
      { kind: "heal", amount: 3, target: "self" }
    ],
    flawName: "Stoned",
    flawSummary: "Lose 1 Skill Die on Wit Checks. Failed Wit Checks may cause hallucinations.",
    flawAutomation: [
      { kind: "poolDice", label: "Stoned", skill: "wit", d6: -1, d8: 0 },
      { kind: "custom", note: "Director: a failed Wit Check may cause hallucinations." }
    ]
  },
  {
    id: "bg-regular", name: "The Regular", page: 90, group: "fool", randomiser: "heart",
    abilityName: "Oblivious",
    abilitySummary: "While inebriated, +1 Talent Die on Fear Checks and Opposed Strange Checks.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Oblivious", skill: "any", d6: 0, d8: 1, when: { tags: ["fear"], manual: true, label: "Fear Check while inebriated" } },
      { kind: "poolDice", label: "Oblivious", skill: "strange", d6: 0, d8: 1, when: { tags: ["opposed"], notTags: ["fear"], manual: true, label: "Opposed Strange Check while inebriated" } }
    ],
    flawName: "Drunkard",
    flawSummary: "Lose 1 Core Skill Point from Wit, to a minimum of 1.",
    flawAutomation: [
      { kind: "skillPoints", skill: "wit", amount: -1 }
    ]
  },
  {
    id: "bg-conspiracist", name: "The Conspiracist", page: 90, group: "fool", randomiser: "strange",
    abilityName: "Sounds Familiar",
    abilitySummary: "Roll your Luck Pool. Depending on the result, the Director gives you a story you remember that relates to your current predicament.",
    action: "interact", uses: null, doom: 0,
    automation: [
      { kind: "check", skill: "luck", cr: null, label: "Sounds Familiar", onSuccess: "The Director tells you a related story you recall; the better the roll, the more it helps.", onFail: "The Director decides what, if anything, you recall." }
    ],
    flawName: "Wackjob",
    flawSummary: "Lose 1 Skill Die when trying to convince others.",
    flawAutomation: [
      { kind: "poolDice", label: "Wackjob", skill: "any", d6: -1, d8: 0, when: { notTags: ["attack", "fear"], manual: true, label: "Convincing others" } }
    ]
  },

  // Weird Backgrounds (pp. 91-92)
  {
    id: "bg-experiment", name: "The Experiment", page: 91, group: "weird", randomiser: "grit",
    abilityName: "Mental Conditioning",
    abilitySummary: "+1 Talent Die when resisting negative effects caused by pain. You take half damage from attacks that deal Soul damage.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Mental Conditioning", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Resisting a negative effect caused by pain" } },
      { kind: "resistance", types: ["soul"] },
      { kind: "custom", note: "Only Soul damage from attacks is halved. The resistance halves all Soul damage, so undo it for non-attack sources (e.g. Painful Memories)." }
    ],
    flawName: "Traumatised",
    flawSummary: "Lose 1 Skill Die on Heart Checks with 'normal' people.",
    flawAutomation: [
      { kind: "poolDice", label: "Traumatised", skill: "heart", d6: -1, d8: 0, when: { notTags: ["attack", "fear"], manual: true, label: "Dealing with 'normal' people" } }
    ]
  },
  {
    id: "bg-possessed", name: "The Possessed", page: 91, group: "weird", randomiser: "smarts",
    abilityName: "Demon's Claw",
    abilitySummary: "Attack Action: make a CR 1 Strange Check. On a success, deal 2 Soul damage to all enemies within Near Range in front of you. It deals 1 Soul damage to you and ticks the Doom Clock 3 minutes.",
    action: "attack", uses: null, doom: 3,
    automation: [
      {
        kind: "check", skill: "strange", cr: 1, label: "Demon's Claw (target every enemy within Near Range in front of you before rolling)",
        onSuccess: "2 Soul damage to each targeted enemy; you take 1 Soul damage.", onFail: "No damage to enemies; you still take 1 Soul damage.",
        success: [
          { kind: "damage", amount: 2, type: "soul", target: "enemy" },
          { kind: "damage", amount: 1, type: "soul", target: "self" }
        ],
        failure: [
          { kind: "damage", amount: 1, type: "soul", target: "self" }
        ]
      }
    ],
    flawName: "Unholy",
    flawSummary: "Minor Disadvantage while on holy ground. You have a Weakness to Holy weapons and abilities.",
    flawAutomation: [
      { kind: "poolDice", label: "Unholy", skill: "any", d6: -1, d8: 0, when: { manual: true, label: "On holy ground" } },
      { kind: "weakness", types: ["holy"] }
    ]
  },
  {
    id: "bg-cursed", name: "The Cursed", page: 91, group: "weird", randomiser: "wit",
    abilityName: "Evil Eye",
    abilitySummary: "Make a Strange Check against the target enemy's CR. On a success it loses its next Attack Action and must make a Fear Check. Ticks the Doom Clock 2 minutes.",
    action: "interact", uses: null, doom: 2,
    automation: [
      { kind: "check", skill: "strange", cr: null, label: "Evil Eye (CR = the targeted enemy's CR)", onSuccess: "The target loses its next Attack Action and must make a Fear Check.", onFail: "No effect." },
      { kind: "custom", note: "The CR is the target enemy's CR. The book gives no CR for the target's Fear Check, so the Director sets it." }
    ],
    flawName: "The Curse",
    flawSummary: "You can't bank Luck, and you can never tick the Doom Clock back.",
    flawAutomation: [
      { kind: "noLuckBank" },
      { kind: "doomModifier", noTickBack: true }
    ]
  },
  {
    id: "bg-abducted", name: "The Abducted", page: 92, group: "weird", randomiser: "strange",
    abilityName: "Haywire",
    abilitySummary: "Make a CR 1 Strange Check to deactivate a mechanical device or make it malfunction. Also +1 Talent Die when handling otherworldly technology.",
    action: "interact", uses: null, doom: 0,
    automation: [
      { kind: "check", skill: "strange", cr: 1, label: "Haywire", onSuccess: "The mechanical device shuts down or malfunctions.", onFail: "No effect." },
      { kind: "poolDice", label: "Haywire", skill: "any", d6: 0, d8: 1, when: { notTags: ["attack", "fear"], manual: true, label: "Handling otherworldly technology" } }
    ],
    flawName: "The Cat Knows",
    flawSummary: "Animals avoid you where they can and attack if you get too close. In a Combat Encounter, animals always target you first.",
    flawAutomation: [
      { kind: "custom", note: "Director: animals avoid this character where possible and attack if they get too close. In a Combat Encounter, animals always target this character first." }
    ]
  },
  {
    id: "bg-android", name: "The Android", page: 92, group: "weird", randomiser: "heart",
    abilityName: "Iron Skeleton",
    abilitySummary: "Your first Armour Slot is never destroyed or repaired; heal its wounds like Health Points. Push-backs move you half as far. No abilities that need a physical body (e.g. Beast Mode).",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "custom", note: "Your first Armour Slot can't be destroyed or repaired. Heal its wounds as if they were Health Points." },
      { kind: "custom", note: "Effects that push you back move you half the distance." },
      { kind: "custom", note: "You can't take abilities that need a physical body, such as Beast Mode." }
    ],
    flawName: "Uncanny Valley",
    flawSummary: "Lose 1 Skill Die on Heart Checks to charm others. If you fail such a Check, the target must make a Fear Check.",
    flawAutomation: [
      { kind: "poolDice", label: "Uncanny Valley", skill: "heart", d6: -1, d8: 0, when: { notTags: ["attack", "fear"], manual: true, label: "Charming others" } },
      { kind: "custom", note: "If you fail a Heart Check to charm someone, they must make a Fear Check (the Director sets the CR)." }
    ]
  },

  // Survivor Backgrounds (pp. 93-94)
  {
    id: "bg-tactician", name: "The Tactician", page: 93, group: "survivor", randomiser: "grit",
    abilityName: "Tactical Re-Deployment",
    abilitySummary: "After the enemies' Combat States are revealed, you may change the Combat State of yourself or one ally.",
    action: "free", uses: { per: "encounter", max: 1 }, doom: 0,
    automation: [
      { kind: "custom", note: "Once the enemies' Combat States are revealed, move yourself or one ally to a different Combat State." }
    ],
    flawName: "People Are Pawns",
    flawSummary: "When you target an enemy that is in a Brawl with an ally, roll a CR 1 Luck Check. On a failure you hit the ally instead.",
    flawAutomation: [
      { kind: "check", skill: "luck", cr: 1, label: "People Are Pawns (targeting an enemy in a Brawl with an ally)", onSuccess: "Your attack goes ahead against the enemy.", onFail: "You hit your ally instead of the enemy." },
      { kind: "custom", note: "On a failure, resolve your Strike against the ally instead of the enemy (by hand). Use spends Tactical Re-Deployment, so to roll this check post the Background to chat (speech-bubble icon) and click its Roll button." }
    ]
  },
  {
    id: "bg-sheriff", name: "The Sheriff", page: 93, group: "survivor", randomiser: "wit",
    abilityName: "Quick-Draw",
    abilitySummary: "If you're using a ranged weapon when a Combat Encounter starts, you may make a Strike with it after Combat States are set and before the first Combat Round.",
    action: "free", uses: { per: "encounter", max: 1 }, doom: 0,
    automation: [
      { kind: "custom", note: "At the start of a Combat Encounter, if you're using a ranged weapon, make one Strike with it after Combat States are set and before Combat Round 1." }
    ],
    flawName: "Too Many Doughnuts",
    flawSummary: "Your Move Distance is 5 ft lower, whatever your Speed.",
    flawAutomation: [
      { kind: "custom", note: "Reduce your Move Distance by 5 ft at every Speed: Slow 15 ft, Average 25 ft, Fast 35 ft." }
    ]
  },
  {
    id: "bg-new-kid", name: "The New Kid", page: 93, group: "survivor", randomiser: "smarts",
    abilityName: "All Rounder",
    abilitySummary: "Gain the starting ability of an Archetype Tree other than your own.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "custom", note: "Add the Tier 1 starting ability of another Archetype's tree to your character." }
    ],
    flawName: "Blank Slate",
    flawSummary: "You have two Flaws, which you pick from any other Backgrounds.",
    flawAutomation: [
      { kind: "custom", note: "Instead of this Flaw, pick two Flaws from other Backgrounds and add them to your character." }
    ]
  },
  {
    id: "bg-khaki-scout", name: "The Khaki Scout", page: 94, group: "survivor", randomiser: "heart",
    abilityName: "Survival Badge",
    abilitySummary: "Wit symbols also count as successes on Smarts Checks to heal or to remove Status Effects.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "extraSuccessFaces", label: "Survival Badge", rollSkill: "smarts", countsAs: ["wit"], when: { any: ["heal", "removeStatus"], label: "Healing or removing a Status Effect" } }
    ],
    flawName: "Always in Uniform",
    flawSummary: "You can use only 1 Armour Slot.",
    flawAutomation: [
      { kind: "armourSlots", amount: -2 }
    ]
  },
  {
    id: "bg-final-girl", name: "The Final Girl", page: 94, group: "survivor", randomiser: "strange",
    abilityName: "Big Bad Beater",
    abilitySummary: "+1 Talent Die on Strikes against enemies with a Red or Black Deathcon rating.",
    action: "passive", uses: null, doom: 0,
    automation: [
      { kind: "poolDice", label: "Big Bad Beater", skill: "any", d6: 0, d8: 1, when: { tags: ["strike"], manual: true, label: "Strike against a Red or Black Deathcon enemy" } }
    ],
    flawName: "Destined",
    flawSummary: "In Combat Encounters and chases, enemies with a Red or Black Deathcon rating always target you unless they are distracted.",
    flawAutomation: [
      { kind: "custom", note: "Director: in Combat Encounters and chases, Red or Black Deathcon enemies always target this character unless distracted." }
    ]
  }
];
