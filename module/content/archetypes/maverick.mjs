export default {
  id: "maverick",
  name: "The Maverick",
  skill: "wit",
  page: 38,
  hybrid: { skills: ["wit"], count: 1 },
  startingSkills: { grit: [3, 0], wit: [5, 1], smarts: [3, 0], heart: [3, 0], luck: [3, 0], strange: [3, 0] },
  strength: "Start with 1 Talent Point in Wit (+1 Talent Die on every Wit Check). It is already counted in the starting tracker.",
  deficiency: {
    exclude: ["wit"],
    amount: 1,
    text: "Remove 1 Core Skill Point from one Core Skill other than Wit (3 to 2)."
  },
  special: [],
  paths: [
    { id: "assassin", name: "Assassin", column: 0 },
    { id: "thief", name: "Thief", column: 1.5 },
    { id: "ranger", name: "Ranger", column: 3 }
  ],
  nodes: [
    // Tier 1
    {
      id: "maverick-dodge", name: "Dodge", tier: 1, path: "core", column: 1.5,
      prerequisites: [], prerequisiteMode: "any", kind: "ability",
      page: 38, action: "interact", uses: { per: "round", max: 1 }, doom: 0,
      summary: "When targeted by a Strike, if you have not used your Interact Action this Combat Round, spend it to Dodge: roll 1 Skill Die. On a Wit symbol the Strike automatically fails; any other symbol has no effect.",
      automation: [
        { kind: "custom", note: "Use when targeted by a Strike, only if your Interact Action is unused this Combat Round (Dodge spends it). Roll 1 Skill Die (2 with Evasive, +1 more with Lightning Reflexes while your Speed is Fast). Any Wit symbol: the Strike automatically fails. Other symbols: no effect." }
      ]
    },

    // Tier 2
    {
      id: "maverick-sneak-attack", name: "Sneak Attack", tier: 2, path: "assassin", column: 0,
      prerequisites: ["maverick-dodge"], prerequisiteMode: "any", kind: "ability",
      page: 39, action: "passive", uses: null, doom: 0,
      summary: "Your Stealth Strikes deal +2 damage.",
      automation: [
        { kind: "damageBonus", amount: 2, when: { tags: ["strike"], status: "stealth", label: "Stealth Strike" } }
      ]
    },
    {
      id: "maverick-sneaky", name: "Sneaky", tier: 2, path: "thief", column: 1.5,
      prerequisites: ["maverick-dodge"], prerequisiteMode: "any", kind: "ability",
      page: 39, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die on Wit Checks to enter Stealth.",
      automation: [
        { kind: "poolDice", skill: "wit", d6: 0, d8: 1, when: "stealth" }
      ]
    },
    {
      id: "maverick-covering-fire", name: "Covering Fire", tier: 2, path: "ranger", column: 3,
      prerequisites: ["maverick-dodge"], prerequisiteMode: "any", kind: "ability",
      page: 39, action: "attack", uses: null, doom: 0,
      summary: "Ranged weapons only. Spend an Attack Action to choose an enemy and an ally, then roll Wit vs the enemy's CR. On success the ally has Minor Advantage (+1 d6) on Strikes against that enemy, and the enemy has Minor Disadvantage (-1 d6) on attacks against that ally. If the enemy moves, it takes your weapon's damage and the effect ends. To maintain it you can take no other Action on your Combat Turn.",
      automation: [
        { kind: "check", skill: "wit", cr: null, label: "Wit vs the enemy's CR", onSuccess: "Covering Fire holds: the ally has Minor Advantage (+1 d6) on Strikes against the enemy; the enemy has Minor Disadvantage (-1 d6) on attacks against that ally.", onFail: "No effect." },
        { kind: "custom", note: "Needs an equipped ranged weapon; CR = the enemy's CR. The ally adds Minor Advantage in their own roll dialog and the Director applies Minor Disadvantage to the enemy. If the enemy moves, deal it your weapon's damage and end the effect. Taking any other Action on your Combat Turn ends it." }
      ]
    },

    // Tier 3
    {
      id: "maverick-light-footed", name: "Light-Footed", tier: 3, path: "assassin", column: 0,
      prerequisites: ["maverick-sneak-attack"], prerequisiteMode: "any", kind: "ability",
      page: 39, action: "passive", uses: null, doom: 0,
      summary: "Being in Stealth no longer reduces your Move Distance.",
      automation: [
        { kind: "custom", note: "Stealth does not halve your Move Distance: use your full Speed while the Stealth status is on." }
      ]
    },
    {
      id: "maverick-hot-property", name: "Hot Property", tier: 3, path: "thief", column: 1,
      prerequisites: ["maverick-sneaky"], prerequisiteMode: "any", kind: "ability",
      page: 39, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die on Strikes made with a stolen item.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { tags: ["strike", "weapon"], manual: true, label: "Strike with a stolen item" } }
      ]
    },
    {
      id: "maverick-nimble-fingers", name: "Nimble Fingers", tier: 3, path: "thief", column: 2,
      prerequisites: ["maverick-sneaky"], prerequisiteMode: "any", kind: "ability",
      page: 39, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die on Wit Checks to pick locks, disarm traps or use sleight of hand (e.g. pickpocketing).",
      automation: [
        { kind: "poolDice", skill: "wit", d6: 0, d8: 1, when: { notTags: ["attack"], manual: true, label: "Picking a lock, disarming a trap or sleight of hand" } }
      ]
    },
    {
      id: "maverick-crows-nest", name: "Crow's Nest", tier: 3, path: "ranger", column: 3,
      prerequisites: ["maverick-covering-fire"], prerequisiteMode: "any", kind: "ability",
      page: 39, action: "passive", uses: null, doom: 0,
      summary: "Minor Advantage (+1 d6) when Striking an enemy from a height with a ranged weapon. +1 Talent Die when climbing.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 1, d8: 0, when: { tags: ["strike", "ranged", "weapon"], manual: true, label: "Striking from a height (Minor Advantage)" } },
        { kind: "poolDice", skill: ["grit", "wit"], d6: 0, d8: 1, when: { notTags: ["attack"], manual: true, label: "Climbing" } }
      ]
    },

    // Tier 4
    {
      id: "maverick-momentum", name: "Momentum", tier: 4, path: "assassin", column: 0,
      prerequisites: ["maverick-light-footed"], prerequisiteMode: "any", kind: "ability",
      page: 40, action: "passive", uses: null, doom: 0,
      summary: "Melee weapons only. Your first Strike each Combat Turn deals +1 damage for every 10 ft you move. The effect ends when you fail a Strike on your turn.",
      automation: [
        { kind: "strikeMode", label: "Momentum: moved 10 ft (+1)", meleeOnly: true, damageBonus: 1 },
        { kind: "strikeMode", label: "Momentum: moved 20 ft (+2)", meleeOnly: true, damageBonus: 2 },
        { kind: "strikeMode", label: "Momentum: moved 30 ft (+3)", meleeOnly: true, damageBonus: 3 },
        { kind: "strikeMode", label: "Momentum: moved 40 ft (+4)", meleeOnly: true, damageBonus: 4 },
        { kind: "custom", note: "Pick the Momentum mode for how far you moved this Combat Turn, on your first melee-weapon Strike of the turn only, and not once you have failed a Strike this turn. Moved more than 40 ft: add +1 per extra 10 ft by hand." }
      ]
    },
    {
      id: "maverick-poisoner", name: "Poisoner", tier: 4, path: "thief", column: 1.5,
      prerequisites: ["maverick-hot-property", "maverick-nimble-fingers"], prerequisiteMode: "any", kind: "ability",
      page: 40, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "Once per Doom Quarter, craft a poison: roll 1 Skill Die. Grit: Maimed. Wit: Paralysed. Smarts: Blinded. Heart: Weakened. Strange: Afraid. Luck: choose any of these. Your next successful Strike makes your weapon apply that effect for the next 2 Combat Rounds.",
      automation: [
        { kind: "custom", note: "Use to craft (spends the OPDQ use), then roll 1 Skill Die: Grit = Maimed, Wit = Paralysed, Smarts = Blinded, Heart = Weakened, Strange = Afraid, Luck = your choice. Strike with the matching Poison mode until a Strike hits; the status then lasts 2 Combat Rounds." },
        { kind: "strikeMode", label: "Poison: Maimed", onHit: [
          { kind: "onHit", status: "maimed", rounds: 2, until: "encounter", note: "Poisoner: Maimed for 2 Combat Rounds." }
        ] },
        { kind: "strikeMode", label: "Poison: Paralysed", onHit: [
          { kind: "onHit", status: "paralysed", rounds: 2, until: "encounter", note: "Poisoner: Paralysed for 2 Combat Rounds." }
        ] },
        { kind: "strikeMode", label: "Poison: Blinded", onHit: [
          { kind: "onHit", status: "blinded", rounds: 2, until: "encounter", note: "Poisoner: Blinded for 2 Combat Rounds." }
        ] },
        { kind: "strikeMode", label: "Poison: Weakened", onHit: [
          { kind: "onHit", status: "weakened", rounds: 2, until: "encounter", note: "Poisoner: Weakened for 2 Combat Rounds." }
        ] },
        { kind: "strikeMode", label: "Poison: Afraid", onHit: [
          { kind: "onHit", status: "afraid", rounds: 2, until: "encounter", note: "Poisoner: Afraid for 2 Combat Rounds." }
        ] }
      ]
    },
    {
      id: "maverick-bullseye", name: "Bullseye", tier: 4, path: "ranger", column: 3,
      prerequisites: ["maverick-crows-nest"], prerequisiteMode: "any", kind: "ability",
      page: 40, action: "passive", uses: null, doom: 0,
      summary: "Thrown weapons and objects get +30 ft Range, and you get +1 Talent Die on Strikes with them.",
      automation: [
        { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: "strike+thrown" },
        { kind: "rangeBonus", ft: 30, when: "thrown" },
        { kind: "custom", note: "Thrown weapons get +30 ft Range automatically; add it yourself for objects that aren't Thrown weapons. The +1 Talent Die is automatic for Thrown weapons; when throwing an object that isn't one, add the Talent Die in the roll dialog. The system also counts Traps as thrown: untick the die for a deployed trap." }
      ]
    },

    // Tier 5
    {
      id: "maverick-core-plus-assassin", name: "+2 Core Points", tier: 5, path: "assassin", column: 0,
      prerequisites: ["maverick-momentum"], prerequisiteMode: "any", kind: "bonus",
      page: 40, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to qualify for a hybrid (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "maverick-core-plus-thief", name: "+2 Core Points", tier: 5, path: "thief", column: 1.5,
      prerequisites: ["maverick-poisoner"], prerequisiteMode: "any", kind: "bonus",
      page: 40, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to qualify for a hybrid (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "maverick-core-plus-ranger", name: "+2 Core Points", tier: 5, path: "ranger", column: 3,
      prerequisites: ["maverick-bullseye"], prerequisiteMode: "any", kind: "bonus",
      page: 40, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. Can be used to qualify for a hybrid (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },

    // Tier 6
    {
      id: "maverick-evasive", name: "Evasive", tier: 6, path: "assassin", column: 0,
      prerequisites: ["maverick-core-plus-assassin"], prerequisiteMode: "any", kind: "ability",
      page: 40, action: "passive", uses: null, doom: 0,
      summary: "Dodge rolls 2 Skill Dice instead of 1. After a successful Dodge you may Escape the Brawl with that enemy for free: it gets no Attack Action against you and the Escape costs no Interact Action.",
      automation: [
        { kind: "custom", note: "Dodge rolls 2 Skill Dice instead of 1. After a successful Dodge you may Escape the Brawl with that enemy: it gets no free Attack Action and the Escape costs no Interact Action." }
      ],
      upgrades: "maverick-dodge"
    },
    {
      id: "maverick-slippery-character", name: "Slippery Character", tier: 6, path: "thief", column: 1.5,
      prerequisites: ["maverick-core-plus-thief"], prerequisiteMode: "any", kind: "ability",
      page: 40, action: "reaction", uses: null, doom: 0,
      summary: "When an enemy tries to Grapple or otherwise restrain you, roll a Wit Check against its CR. On success you slip free.",
      automation: [
        { kind: "check", skill: "wit", cr: null, label: "Wit vs the enemy's CR", onSuccess: "You slip free of the Grapple or restraint.", onFail: "The Grapple or restraint resolves as normal.",
          success: [{ kind: "removeStatus", status: "grappled", target: "self" }] },
        { kind: "custom", note: "Roll when an enemy tries to Grapple or restrain you; the CR is that enemy's CR. Roll once the Grappled status is on you: success then removes it automatically (rolled earlier, remove it by hand). Remove any other restraint (e.g. Immobile) by hand." }
      ]
    },
    {
      id: "maverick-gun-slinger", name: "Gun-Slinger", tier: 6, path: "ranger", column: 2.5,
      prerequisites: ["maverick-core-plus-ranger"], prerequisiteMode: "any", kind: "ability",
      page: 40, action: "passive", uses: null, doom: 0,
      summary: "You can wield 2 single-handed ranged weapons at once, and make 1 extra Strike with the second weapon each Combat Turn.",
      automation: [
        { kind: "extraActions", action: "attack", amount: 1, when: { manual: true, label: "Wielding two single-handed ranged weapons" } },
        { kind: "custom", note: "Wield 2 single-handed ranged weapons at once. The extra Attack Action may only be 1 Strike with your second weapon each Combat Turn." }
      ]
    },
    {
      id: "maverick-energy-reserves", name: "Energy Reserves", tier: 6, path: "ranger", column: 3.5,
      prerequisites: ["maverick-core-plus-ranger"], prerequisiteMode: "any", kind: "ability",
      page: 40, action: "passive", uses: null, doom: 0,
      summary: "You get 1 additional Attack Action on any Combat Turn in which you do not use a Move Action.",
      automation: [
        { kind: "extraActions", action: "attack", amount: 1, when: { manual: true, label: "You have not used your Move Action this Combat Turn" } },
        { kind: "custom", note: "The action tracker always allows this extra Attack Action; only take it on a Combat Turn in which you don't use your Move Action." }
      ]
    },

    // Tier 7
    {
      id: "maverick-dual-wielder", name: "Dual Wielder", tier: 7, path: "assassin", column: 0,
      prerequisites: ["maverick-evasive"], prerequisiteMode: "any", kind: "ability",
      page: 41, action: "passive", uses: null, doom: 0,
      summary: "You can wield 2 single-handed melee weapons at once, and make 1 extra Strike with the second weapon each Combat Turn.",
      automation: [
        { kind: "extraActions", action: "attack", amount: 1, when: { manual: true, label: "Wielding two single-handed melee weapons" } },
        { kind: "custom", note: "Wield 2 single-handed melee weapons at once. The extra Attack Action may only be 1 Strike with your second weapon each Combat Turn." }
      ]
    },
    {
      id: "maverick-heightened-senses", name: "Heightened Senses", tier: 7, path: "thief", column: 1,
      prerequisites: ["maverick-slippery-character"], prerequisiteMode: "any", kind: "ability",
      page: 41, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Die on Wit Checks to observe your surroundings and spot hidden things.",
      automation: [
        { kind: "poolDice", skill: "wit", d6: 0, d8: 1, when: { notTags: ["attack"], manual: true, label: "Observing your surroundings or spotting hidden things" } }
      ]
    },
    {
      id: "maverick-lightning-reflexes", name: "Lightning Reflexes", tier: 7, path: "thief", column: 2,
      prerequisites: ["maverick-slippery-character"], prerequisiteMode: "any", kind: "ability",
      page: 41, action: "passive", uses: null, doom: 0,
      summary: "Your Speed increases to Fast. While your Speed is Fast, Dodge rolls 1 extra Skill Die.",
      automation: [
        { kind: "speed", set: "fast" },
        { kind: "custom", note: "Dodge: +1 Skill Die while your current Speed is Fast (not while slowed, e.g. by Maimed or Prone)." }
      ],
      upgrades: "maverick-dodge"
    },
    {
      id: "maverick-clipping-wings", name: "Clipping Wings", tier: 7, path: "ranger", column: 3,
      prerequisites: ["maverick-gun-slinger", "maverick-energy-reserves"], prerequisiteMode: "any", kind: "ability",
      page: 41, action: "passive", uses: null, doom: 0,
      summary: "When you make a Strike you can choose to deal half damage and impose an effect for the enemy's next Combat Turn: it can't use one weapon or ability you have seen it use, or it can't move.",
      automation: [
        { kind: "strikeMode", label: "Clipping Wings: can't move", damageMultiplier: 0.5, onHit: [
          { kind: "onHit", status: "immobile", until: "endOfNextTurn", note: "Clipping Wings: the target is Immobile until the end of its next Combat Turn." }
        ] },
        { kind: "strikeMode", label: "Clipping Wings: block weapon or ability", damageMultiplier: 0.5, onHit: [
          { kind: "onHit", note: "Clipping Wings: on its next Combat Turn the target can't use one weapon or ability you have seen it use (name it)." }
        ] }
      ]
    },

    // Tier 8
    {
      id: "maverick-talent-plus-assassin", name: "+1 Wit Talent", tier: 8, path: "assassin", column: 0,
      prerequisites: ["maverick-dual-wielder"], prerequisiteMode: "any", kind: "bonus",
      page: 41, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Wit.",
      automation: [{ kind: "talentPoints", skill: "wit", amount: 1 }]
    },
    {
      id: "maverick-talent-plus-thief", name: "+1 Wit Talent", tier: 8, path: "thief", column: 1.5,
      prerequisites: ["maverick-heightened-senses", "maverick-lightning-reflexes"], prerequisiteMode: "any", kind: "bonus",
      page: 41, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Wit.",
      automation: [{ kind: "talentPoints", skill: "wit", amount: 1 }]
    },
    {
      id: "maverick-talent-plus-ranger", name: "+1 Wit Talent", tier: 8, path: "ranger", column: 3,
      prerequisites: ["maverick-clipping-wings"], prerequisiteMode: "any", kind: "bonus",
      page: 41, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Wit.",
      automation: [{ kind: "talentPoints", skill: "wit", amount: 1 }]
    },

    // Tier 9
    {
      id: "maverick-silenced", name: "Silenced", tier: 9, path: "assassin", column: 0,
      prerequisites: ["maverick-talent-plus-assassin"], prerequisiteMode: "any", kind: "ability",
      page: 41, action: "free", uses: null, doom: 0,
      summary: "A Stealth Strike that kills or knocks out its target doesn't alert other enemies, and you stay in Stealth. They may still find the body.",
      automation: [
        { kind: "applyStatus", status: "stealth", target: "self" },
        { kind: "custom", note: "Use right after a Stealth Strike kills or knocks out its target: it restores the Stealth status the Strike removed, and other enemies stay unaware of you. Hidden bodies are the Director's call." }
      ]
    },
    {
      id: "maverick-one-with-shadow", name: "One With Shadow", tier: 9, path: "thief", column: 1.5,
      prerequisites: ["maverick-talent-plus-thief"], prerequisiteMode: "any", kind: "ability",
      page: 41, action: "reaction", uses: null, doom: 0,
      summary: "While in Stealth, entering an enemy's line of sight doesn't end Stealth outright: make an Opposed Wit Check against the enemy. If it fails, you stay in Stealth.",
      automation: [
        { kind: "check", skill: "wit", cr: null, label: "Opposed Wit vs the enemy", onSuccess: "The enemy fails to spot you; you stay in Stealth.", onFail: "The enemy spots you; Stealth ends.",
          failure: [{ kind: "removeStatus", status: "stealth", target: "self" }] },
        { kind: "custom", note: "Roll whenever you enter an enemy's line of sight while in Stealth. Opposed: the Director rolls the enemy's Wit and sets the CR to beat its successes (ties are the Director's call, p12). Failure removes your Stealth status automatically." }
      ]
    },
    {
      id: "maverick-double-tap", name: "Double Tap", tier: 9, path: "ranger", column: 3,
      prerequisites: ["maverick-talent-plus-ranger"], prerequisiteMode: "any", kind: "ability",
      page: 41, action: "free", uses: null, doom: 0,
      summary: "After a successful Strike on an enemy, immediately make another Strike of the same type against it. The second Strike can't trigger Double Tap.",
      automation: [
        { kind: "custom", note: "After each successful Strike, immediately Strike the same enemy again with the same weapon or attack. This extra Strike costs no action and can't trigger Double Tap." }
      ]
    },

    // Tier 10
    {
      id: "maverick-battle-dancer", name: "Battle Dancer", tier: 10, path: "assassin", column: 0,
      prerequisites: ["maverick-silenced"], prerequisiteMode: "any", kind: "ability",
      page: 42, action: "attack", uses: null, doom: 0,
      summary: "Melee weapons only. Each Attack Action can move you to an enemy within your Move Distance, Strike it, then Escape automatically with no free Attack against you. A kill from one of these Strikes grants +1 Attack Action (max 3).",
      automation: [
        { kind: "custom", note: "Each Attack Action: move up to your Move Distance to an enemy, Strike it with a melee weapon, then Escape it automatically with no free Attack against you. Each kill from these Strikes grants +1 Attack Action (max 3); track the extras by hand." }
      ]
    },
    {
      id: "maverick-helpful-horde", name: "Helpful Horde", tier: 10, path: "thief", column: 1.5,
      prerequisites: ["maverick-one-with-shadow"], prerequisiteMode: "any", kind: "ability",
      page: 42, action: "passive", uses: null, doom: 0,
      summary: "While you carry stolen items, you may fill an empty Armour Slot with 'Helpful Horde' armour. Damage to that slot damages or destroys some of your stolen items (Director's pick); bigger loot can fill more slots.",
      automation: [
        { kind: "custom", note: "While carrying stolen items, add an armour item named Helpful Horde to an empty Armour Slot (the Director sets how many slots your loot fills). When it takes damage or breaks, the Director damages or destroys stolen items in your inventory." }
      ]
    },
    {
      id: "maverick-ducks-in-a-row", name: "Ducks in a Row", tier: 10, path: "ranger", column: 3,
      prerequisites: ["maverick-double-tap"], prerequisiteMode: "any", kind: "ability",
      page: 42, action: "free", uses: null, doom: 0,
      summary: "Ranged weapons only. When you Strike an enemy and another enemy is within Close Range (5 ft) of it in any direction, or within Medium Range (50 ft) directly behind it, you may make another Strike against that second enemy.",
      automation: [
        { kind: "custom", note: "After a ranged-weapon Strike, you may Strike a second enemy that is within 5 ft of the target, or within 50 ft directly behind it. This extra Strike costs no action." }
      ]
    }
  ],
  discrepancies: [
    "Diagram (p43) and text (p38-42) agree on every node's path and tier. p39 prints the Tier 3 block above Tier 2; the headings and diagram were followed.",
    "Tier 8 nodes read '+1 WIT AD' on the diagram, but p41 says +1 Talent Point in Wit. Followed the text.",
    "p43's text layer hides an older 'Outsider' tree (Acrobat, +1 Speed, +1 AD) that isn't on the printed diagram. Ignored.",
    "Dodge: treated as once per Combat Round, since it spends your one Interact Action. Unstated whether skipping your Attack for a second Interact allows a second Dodge.",
    "Bullseye: 'increased Range of 30 ft' read as +30 ft, because thrown items already reach 30-50 ft (p130, p146).",
    "Momentum says both 'first Strike each Combat Round' and 'first Strike on a Combat Turn'. These are the same for a character.",
    "Poisoner: no action cost is given; set to Interact (non-attack ability, p22). Read as the status lasting 2 Combat Rounds on the struck target; the Poison Strike modes apply it with no save for 2 rounds (also ending with the encounter, which stops Blinded's usual end-of-next-turn expiry cutting it short).",
    "Only one Strike mode applies per Strike, so Momentum, Clipping Wings and Poison modes can't be combined on one Strike: pick one mode and apply the others by hand.",
    "Sneak Attack: the +2 is added automatically while you have the Stealth status. The system also gives Strikes from Hiding Major Advantage (Hiding 'follows a similar pattern to Stealth', p27), but Sneak Attack names only Stealth Strikes, so Hidden doesn't add the +2.",
    "Sneaky: the Talent Die is automatic on the sheet's Stealth roll; a plain Wit Check to enter Stealth needs it added by hand.",
    "Momentum: Strike modes cover 10-40 ft (one Move Action at Fast Speed). The text says melee weapons, but the system offers the modes on any weapon with a Range of 15 ft or less: also Unarmed Strikes and Near-range guns (e.g. Sawn-off Shotgun, Flame-thrower), and not the Medium-range Holy Relic or Book of Banishment.",
    "Clipping Wings: 'stop them from moving on their next turn' is applied as Immobile until the end of the target's next Combat Turn.",
    "Slippery Character: unclear whether the Wit Check replaces the normal opposed Grit grapple check. Treated as an extra chance to slip free.",
    "Gun-Slinger and Dual Wielder give an extra Strike with the second weapon, not a general Attack Action; the action tracker still counts it as +1 Attack, and it can't check that you are dual-wielding. Energy Reserves' extra Attack is likewise always counted, whether or not you moved.",
    "Clipping Wings: rounding of half damage isn't stated; rounded down.",
    "Double Tap, Clipping Wings and Energy Reserves have no ranged-only restriction in the text (unlike Covering Fire and Ducks in a Row); none added.",
    "Evasive and Lightning Reflexes stack: Dodge rolls 3 Skill Dice while your Speed is Fast (inferred).",
    "Battle Dancer: 'up to a maximum of 3' has no stated scope; read as at most 3 extra Attack Actions gained per Combat Turn (it could instead cap your total Attack Actions at 3).",
    "Helpful Horde is printed 'Horde' (probably 'Hoard'); kept the printed name. Its slot count is left to the Director."
  ]
};
