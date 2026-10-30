/**
 * The Armoury (SHIVER Core Rulebook p.128-150): melee, ranged, trap/thrown and legendary weapons.
 * Weapon properties are expressed as automation rules (see module/rules/automation.mjs). Heavy and Stun are read from
 * `properties`; Take Aim is read from `properties` ("takeAim") by the actor sheet; fuel and single-use consumables use
 * `ammo`.
 */
export default [
  // ---------------------------------------------------------------- Melee (p.133-138)
  {
    id: "baseball-bat", name: "Baseball Bat", page: 133, category: "melee",
    skill: "grit", altSkills: [], damage: 2, damageType: "blunt", altDamageTypes: [], range: "close",
    properties: [], material: "", ammo: null, unarmed: false,
    summary: "Grit; 2 Blunt; Close (5 ft). No special ability.",
    automation: []
  },
  {
    id: "baseball-bat-modified", name: "Baseball Bat (Modified)", page: 133, category: "melee",
    skill: "grit", altSkills: [], damage: 4, damageType: "blunt", altDamageTypes: [], range: "close",
    properties: [], material: "", ammo: null, unarmed: false,
    summary: "Grit; 4 Blunt; Close (5 ft). A nail-studded bat. No special ability.",
    automation: []
  },
  {
    id: "bike-chain", name: "Bike Chain", page: 133, category: "melee",
    skill: "wit", altSkills: ["grit"], damage: 3, damageType: "blunt", altDamageTypes: [], range: "near",
    properties: ["restrain"], material: "", ammo: null, unarmed: false,
    summary: "Wit or Grit; 3 Blunt; Near (15 ft); melee. Restrain: an enemy it hits must pass a CR 1 Wit Check or be Grappled.",
    automation: [
      { kind: "onHit", status: "grappled", save: { skill: "wit", cr: 1 } },
      { kind: "melee" }
    ]
  },
  {
    id: "bionic-arm", name: "Bionic Arm", page: 134, category: "melee",
    skill: "grit", altSkills: [], damage: 3, damageType: "blunt", altDamageTypes: [], range: "close",
    properties: ["punchUp"], material: "", ammo: null, unarmed: true,
    summary: "Grit; 3 Blunt; Close (5 ft). Punch-Up: your Unarmed Strikes use this profile, and it doesn't take one of your weapon slots.",
    automation: [
      { kind: "custom", note: "Punch-Up: make your Unarmed Strikes with this (3 Blunt) instead of the basic Unarmed Strike (1 Blunt). It already counts as an Unarmed Strike and takes no weapon slot." }
    ]
  },
  {
    id: "crowbar", name: "Crowbar", page: 134, category: "melee",
    skill: "grit", altSkills: [], damage: 2, damageType: "blunt", altDamageTypes: [], range: "close",
    properties: ["openSesame"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 2 Blunt; Close (5 ft). Open Sesame: +1 Talent Die when you use it to open a door.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Opening a door with the Crowbar" } }
    ]
  },
  {
    id: "book-of-banishment", name: "Book of Banishment", page: 134, category: "melee",
    skill: "heart", altSkills: [], damage: 3, damageType: "soul", altDamageTypes: [], range: "medium",
    properties: ["weaken"], material: "", ammo: null, unarmed: false,
    summary: "Heart; 3 Soul; Medium (50 ft); listed as melee. Weaken: the target must pass a CR 1 Heart Check or be Weakened (CR -1) until your next Combat Turn.",
    automation: [
      { kind: "onHit", status: "weakened", save: { skill: "heart", cr: 1 }, until: "attackerNextTurn" },
      { kind: "melee" }
    ]
  },
  {
    id: "cudgel", name: "Cudgel", page: 134, category: "melee",
    skill: "grit", altSkills: [], damage: 2, damageType: "blunt", altDamageTypes: [], range: "close",
    properties: ["stun"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 2 Blunt; Close (5 ft). Stun: on a hit you may deal just 1 Blunt and leave the target Stunned (no save) instead of the normal damage.",
    automation: []
  },
  {
    id: "chainsaw", name: "Chainsaw", page: 134, category: "melee",
    skill: "grit", altSkills: [], damage: 6, damageType: "sharp", altDamageTypes: [], range: "close",
    properties: ["fuel"], material: "", ammo: { value: 10, max: 10 }, unarmed: false,
    summary: "Grit; 6 Sharp; Close (5 ft). Fuel (10): each Strike burns 1 fuel, and it can't be used once empty.",
    automation: []
  },
  {
    id: "drill", name: "Drill", page: 134, category: "melee",
    skill: "smarts", altSkills: [], damage: 3, damageType: "pierce", altDamageTypes: [], range: "close",
    properties: ["tooledUp"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 3 Pierce; Close (5 ft). Tooled Up: +1 Talent Die on checks to repair vehicles or armour.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Repairing a vehicle or armour (Drill)" } }
    ]
  },
  {
    id: "fire-axe", name: "Fire Axe", page: 135, category: "melee",
    skill: "grit", altSkills: [], damage: 4, damageType: "sharp", altDamageTypes: [], range: "close",
    properties: ["openSesame"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 4 Sharp; Close (5 ft). Open Sesame: +1 Talent Die when you use it to open a door.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Opening a door with the Fire Axe" } }
    ]
  },
  {
    id: "flare", name: "Flare", page: 135, category: "melee",
    skill: "grit", altSkills: [], damage: 2, damageType: "fire", altDamageTypes: [], range: "close",
    properties: ["letThereBeLight"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 2 Fire; Close (5 ft). Let there be light: once lit it sheds bright red light in a 50 ft (Medium) radius for 20 minutes unless put out.",
    automation: [
      { kind: "custom", note: "Let there be light: when lit, give your token a 50 ft bright light. It lasts 20 minutes unless put out." }
    ]
  },
  {
    id: "hidden-blade", name: "Hidden Blade", page: 135, category: "melee",
    skill: "wit", altSkills: [], damage: 2, damageType: "pierce", altDamageTypes: [], range: "close",
    properties: ["hidden"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 2 Pierce; Close (5 ft). Hidden: easy to conceal, so a search won't turn it up.",
    automation: [
      { kind: "custom", note: "Hidden: searches don't find this weapon." }
    ]
  },
  {
    id: "holy-relic", name: "Holy Relic", page: 135, category: "melee",
    skill: "heart", altSkills: [], damage: 3, damageType: "soul", altDamageTypes: [], range: "medium",
    properties: ["ward", "holy"], material: "holy", ammo: null, unarmed: false,
    summary: "Heart; 3 Soul; Medium (50 ft); listed as melee. Ward: a targeted enemy that fails a CR 1 Heart Check spends its next Move Action retreating its full Move Distance straight away from you. Holy: counts as a Holy weapon.",
    automation: [
      { kind: "onHit", note: "Ward: the target makes a CR 1 Heart Check. On a failure its next Move Action must take it its full Move Distance directly away from the bearer." },
      { kind: "melee" }
    ]
  },
  {
    id: "improvised-weapon-tier-1", name: "Improvised Weapon (Tier 1)", page: 136, category: "melee",
    skill: "smarts", altSkills: [], damage: 2, damageType: "sharp", altDamageTypes: [], range: "close",
    properties: ["malfunctions"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 2 Sharp; Close (5 ft). Lowest of 3 quality tiers (Tier 2: 4 Sharp, Tier 3: 6 Sharp). Built with the Improviser ability (p45), whose Smarts symbols set the tier. It Malfunctions (p132).",
    automation: [
      { kind: "custom", note: "Malfunctions (p132): the system rolls the Malfunction die after each attack and applies Jammed, Stumble's Prone and Backfire's half damage to you. Clear Jammed with the Reload button. Unjamming costs your next Move Action, but the button marks an Interact Action, so correct the action tracker. Handle the rest by hand: Stumble also makes the attack miss, Lowered Guard (Wit) gives the next attack against you Major Advantage, and Break (Smarts) halves its damage until repaired. Improviser (p45) adds that a failed Strike showing a Strange symbol can break or backfire it." }
    ]
  },
  {
    id: "improvised-weapon-tier-2", name: "Improvised Weapon (Tier 2)", page: 136, category: "melee",
    skill: "smarts", altSkills: [], damage: 4, damageType: "sharp", altDamageTypes: [], range: "close",
    properties: ["malfunctions"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 4 Sharp; Close (5 ft). Middle of 3 quality tiers (Tier 1: 2 Sharp, Tier 3: 6 Sharp). Built with the Improviser ability (p45), whose Smarts symbols set the tier. It Malfunctions (p132).",
    automation: [
      { kind: "custom", note: "Malfunctions (p132): the system rolls the Malfunction die after each attack and applies Jammed, Stumble's Prone and Backfire's half damage to you. Clear Jammed with the Reload button. Unjamming costs your next Move Action, but the button marks an Interact Action, so correct the action tracker. Handle the rest by hand: Stumble also makes the attack miss, Lowered Guard (Wit) gives the next attack against you Major Advantage, and Break (Smarts) halves its damage until repaired. Improviser (p45) adds that a failed Strike showing a Strange symbol can break or backfire it." }
    ]
  },
  {
    id: "improvised-weapon-tier-3", name: "Improvised Weapon (Tier 3)", page: 136, category: "melee",
    skill: "smarts", altSkills: [], damage: 6, damageType: "sharp", altDamageTypes: [], range: "close",
    properties: ["malfunctions"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 6 Sharp; Close (5 ft). Best of 3 quality tiers (Tier 1: 2 Sharp, Tier 2: 4 Sharp). Built with the Improviser ability (p45), whose Smarts symbols set the tier. It Malfunctions (p132).",
    automation: [
      { kind: "custom", note: "Malfunctions (p132): the system rolls the Malfunction die after each attack and applies Jammed, Stumble's Prone and Backfire's half damage to you. Clear Jammed with the Reload button. Unjamming costs your next Move Action, but the button marks an Interact Action, so correct the action tracker. Handle the rest by hand: Stumble also makes the attack miss, Lowered Guard (Wit) gives the next attack against you Major Advantage, and Break (Smarts) halves its damage until repaired. Improviser (p45) adds that a failed Strike showing a Strange symbol can break or backfire it." }
    ]
  },
  {
    id: "laser-sword", name: "Laser Sword", page: 136, category: "melee",
    skill: "smarts", altSkills: [], damage: 6, damageType: "pierce", altDamageTypes: [], range: "close",
    properties: [], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 6 Pierce; Close (5 ft). No special ability.",
    automation: []
  },
  {
    id: "sledgehammer", name: "Sledgehammer", page: 136, category: "melee",
    skill: "grit", altSkills: [], damage: 6, damageType: "blunt", altDamageTypes: [], range: "close",
    properties: ["knockBack", "twoHander"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 6 Blunt; Close (5 ft). Knock-back (N): a hit shoves the target 15 ft (Near) away. Two-hander: needs both hands free.",
    automation: [
      { kind: "onHit", note: "Knock-back (N): push the target 15 ft (Near, 3 hex) away from you." },
      { kind: "custom", note: "Two-hander: needs both hands free." }
    ]
  },
  {
    id: "shield", name: "Shield", page: 136, category: "melee",
    skill: "grit", altSkills: [], damage: 2, damageType: "blunt", altDamageTypes: [], range: "close",
    properties: ["hunker"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 2 Blunt; Close (5 ft). Hunker: spend an Interact Action to gain Steeled (CR +1) until your next Combat Turn.",
    automation: [
      { kind: "applyStatus", status: "steeled", target: "self", flags: { expires: "startOfNextTurn" }, when: { manual: true, label: "Hunker (spend an Interact Action)" } },
      { kind: "custom", note: "Hunker: post the Shield to chat and click its Steeled button. Steeled ends when your next Combat Turn starts. Mark the Interact Action it costs." }
    ]
  },
  {
    id: "silver-dagger", name: "Silver Dagger", page: 136, category: "melee",
    skill: "grit", altSkills: ["wit"], damage: 2, damageType: "sharp", altDamageTypes: [], range: "close",
    properties: ["silver", "bloody"], material: "silver", ammo: null, unarmed: false,
    summary: "Grit or Wit; 2 Sharp; Close (5 ft). Silver: counts as a silver weapon. Bloody: a hit's Sharp save is a CR 2 Luck Check, and failing it gives Bleed (2) rather than Bleed (1).",
    automation: [
      { kind: "saveOverride", damageType: "sharp", cr: 2, value: 2 }
    ]
  },
  {
    id: "spear", name: "Spear", page: 137, category: "melee",
    skill: "wit", altSkills: [], damage: 3, damageType: "pierce", altDamageTypes: [], range: "near",
    properties: [], material: "", ammo: null, unarmed: false,
    summary: "Wit; 3 Pierce; Near (15 ft); a melee weapon with reach. No special ability (its description mentions throwing, but no thrown rule is given).",
    automation: [
      { kind: "melee" }
    ]
  },
  {
    id: "spiked-flail", name: "Spiked Flail", page: 137, category: "melee",
    skill: "grit", altSkills: [], damage: 4, damageType: "sharp", altDamageTypes: [], range: "near",
    properties: ["bloody"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 4 Sharp; Near (15 ft); melee. Bloody: a hit's Sharp save is a CR 2 Luck Check, and failing it gives Bleed (2) rather than Bleed (1).",
    automation: [
      { kind: "saveOverride", damageType: "sharp", cr: 2, value: 2 },
      { kind: "melee" }
    ]
  },
  {
    id: "stake", name: "Stake", page: 137, category: "melee",
    skill: "grit", altSkills: ["wit"], damage: 2, damageType: "pierce", altDamageTypes: [], range: "close",
    properties: ["vampireSlayer"], material: "", ammo: null, unarmed: false,
    summary: "Grit or Wit; 2 Pierce; Close (5 ft). Vampire Slayer: after a Critical Hit on a Vampyric enemy of CR 2 or lower, roll a CR 2 Luck Check; on a success it dies outright.",
    automation: [
      { kind: "onHit", note: "Vampire Slayer: if this was a Critical Hit on a Vampyric enemy of CR 2 or lower, keep it targeted, post this weapon to chat and roll its CR 2 Luck Check. On a success the enemy is slain instantly." },
      { kind: "check", skill: "luck", cr: 2, label: "Vampire Slayer (after a Critical Hit on a Vampyric enemy of CR 2 or lower)", onSuccess: "The targeted enemy is slain instantly.", success: [{ kind: "applyStatus", status: "dead", target: "enemy" }] }
    ]
  },
  {
    id: "stun-baton", name: "Stun Baton", page: 137, category: "melee",
    skill: "smarts", altSkills: ["grit"], damage: 2, damageType: "shock", altDamageTypes: [], range: "close",
    properties: ["electrocute"], material: "", ammo: null, unarmed: false,
    summary: "Smarts or Grit; 2 Shock; Close (5 ft). Electrocute: Shock damage is doubled against a target standing in water.",
    automation: [
      { kind: "onHit", damageType: "shock", note: "Electrocute: if the target is in water, the Shock damage is doubled. Add the extra wounds by hand." }
    ]
  },
  {
    id: "sword", name: "Sword", page: 138, category: "melee",
    skill: "grit", altSkills: [], damage: 4, damageType: "sharp", altDamageTypes: [], range: "close",
    properties: ["iStabAtThee"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 4 Sharp; Close (5 ft). I Stab at Thee!: instead of a normal Strike, your Attack Action can be a Wit Check against the target's CR; on a success it takes 2 Pierce.",
    automation: [
      { kind: "check", skill: "wit", cr: null, label: "I Stab at Thee! (CR is the target's CR)", onSuccess: "The targeted enemy takes 2 Pierce.", success: [{ kind: "damage", amount: 2, type: "pierce", target: "enemy", strike: true }] },
      { kind: "custom", note: "I Stab at Thee!: instead of a normal Strike, target the enemy, post the Sword to chat and roll its Wit Check. The Director sets the CR to the target's CR. It uses your Attack Action, so mark it. It counts as a Strike, so handle the enemy's Reaction and leaving Stealth by hand." }
    ]
  },
  {
    id: "torch", name: "Torch", page: 138, category: "melee",
    skill: "grit", altSkills: [], damage: 1, damageType: "fire", altDamageTypes: [], range: "close",
    properties: ["letThereBeLight"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 1 Fire; Close (5 ft). Let there be light: once lit it sheds bright light in a 50 ft (Medium) radius for 20 minutes unless put out.",
    automation: [
      { kind: "custom", note: "Let there be light: when lit, give your token a 50 ft bright light. It lasts 20 minutes unless put out." }
    ]
  },
  {
    id: "unarmed-strike", name: "Unarmed Strike", page: 138, category: "melee",
    skill: "grit", altSkills: [], damage: 1, damageType: "blunt", altDamageTypes: [], range: "close",
    properties: [], material: "", ammo: null, unarmed: true,
    summary: "Grit; 1 Blunt; Close (5 ft). What you hit with when no weapon is to hand. Takes no weapon slot.",
    automation: []
  },
  {
    id: "woodsman-axe", name: "Woodsman Axe", page: 138, category: "melee",
    skill: "grit", altSkills: [], damage: 3, damageType: "sharp", altDamageTypes: [], range: "close",
    properties: ["cleave"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 3 Sharp; Close (5 ft). Cleave: if a Strike kills its target, the unused damage carries over to another enemy of your choice within Close Range (5 ft).",
    automation: [
      { kind: "onHit", note: "Cleave: if this Strike killed the target, deal the leftover damage to another enemy of your choice within Close Range (5 ft)." }
    ]
  },
  {
    id: "zweihander", name: "Zweihander", page: 138, category: "melee",
    skill: "grit", altSkills: [], damage: 6, damageType: "sharp", altDamageTypes: [], range: "near",
    properties: ["heavy", "twoHander", "cleave"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 6 Sharp; Near (15 ft); melee. Heavy: each Strike costs an Attack and an Interact Action. Two-hander: needs both hands free. Cleave: if a Strike kills its target, the unused damage carries over to another enemy of your choice within Close Range (5 ft).",
    automation: [
      { kind: "onHit", note: "Cleave: if this Strike killed the target, deal the leftover damage to another enemy of your choice within Close Range (5 ft)." },
      { kind: "custom", note: "Two-hander: needs both hands free." },
      { kind: "melee" }
    ]
  },

  // ---------------------------------------------------------------- Ranged (p.139-145)
  {
    id: "blunderbuss", name: "Blunderbuss", page: 139, category: "ranged",
    skill: "grit", altSkills: [], damage: 6, damageType: "blunt", altDamageTypes: [], range: "medium",
    properties: ["knockBack", "twoHander", "reload"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 6 Blunt; Medium (50 ft). Knock-back (N): a hit shoves the target 15 ft (Near) away. Two-hander: needs both hands free. Reload: after attacking with it, spend an Interact Action reloading before attacking with it again.",
    automation: [
      { kind: "reload" },
      { kind: "onHit", note: "Knock-back (N): push the target 15 ft (Near, 3 hex) away from you." },
      { kind: "custom", note: "Two-hander: needs both hands free." }
    ]
  },
  {
    id: "crossbow", name: "Crossbow", page: 139, category: "ranged",
    skill: "wit", altSkills: [], damage: 6, damageType: "pierce", altDamageTypes: [], range: "long",
    properties: ["reload"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 6 Pierce; Long (150 ft). Reload: needs an Interact Action to reload after each Strike.",
    automation: [
      { kind: "reload" }
    ]
  },
  {
    id: "dart-thrower", name: "Dart Thrower", page: 139, category: "ranged",
    skill: "smarts", altSkills: [], damage: 2, damageType: "pierce", altDamageTypes: [], range: "medium",
    properties: ["variableAmmoDarts"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 2 Pierce; Medium (50 ft). Variable ammo: an Interact Action swaps the loaded dart. Sleep Dart: a damaged enemy must pass a CR 1 Grit Check or be Paralysed. Poison Dart: a damaged enemy must pass a CR 1 Grit Check or gain Poisoned (1). Tracking Dart: leaves a glowing trail (no further rule is printed).",
    automation: [
      { kind: "onHit", note: "Loaded dart. Sleep or Poison: keep the damaged target targeted, post the Dart Thrower to chat and click that dart's button (the target saves with Grit CR 1). Tracking: it leaves a trail of glowing liquid." },
      { kind: "applyStatus", status: "paralysed", target: "enemy", save: { skill: "grit", cr: 1 }, when: { manual: true, label: "Sleep Dart damaged the target" } },
      { kind: "applyStatus", status: "poisoned", value: 1, target: "enemy", save: { skill: "grit", cr: 1 }, when: { manual: true, label: "Poison Dart damaged the target" } },
      { kind: "custom", note: "Variable ammo: switching between Sleep, Poison and Tracking darts costs an Interact Action. The book gives no way to end the Sleep Dart's Paralysed, so the Director decides when it wears off." }
    ]
  },
  {
    id: "flame-thrower", name: "Flame-thrower", page: 140, category: "ranged",
    skill: "smarts", altSkills: [], damage: 5, damageType: "fire", altDamageTypes: [], range: "near",
    properties: ["fuel", "highlyFlammable"], material: "", ammo: { value: 10, max: 10 }, unarmed: false,
    summary: "Smarts; 5 Fire; Near (15 ft). Fuel (10): each Strike burns 1 fuel, and it can't be used once empty. Highly Flammable: a hit's Fire save is a CR 2 Luck Check, and failing it gives Burning (2) rather than Burning (1).",
    automation: [
      { kind: "saveOverride", damageType: "fire", cr: 2, value: 2 },
      { kind: "ranged" }
    ]
  },
  {
    id: "flare-pistol", name: "Flare Pistol", page: 140, category: "ranged",
    skill: "wit", altSkills: [], damage: 2, damageType: "fire", altDamageTypes: [], range: "far",
    properties: ["reload", "letThereBeLight"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 2 Fire; Far (200 ft). Reload: needs an Interact Action to reload after each Strike. Let there be light: each flare sheds bright red light in a 50 ft (Medium) radius for 20 minutes unless put out. You can fire it as long as you have flares.",
    automation: [
      { kind: "reload" },
      { kind: "custom", note: "Let there be light: each flare fired lights a 50 ft radius around where it lands for 20 minutes unless put out. Keep track of your flares." }
    ]
  },
  {
    id: "flintlock-pistol", name: "Flintlock Pistol", page: 140, category: "ranged",
    skill: "wit", altSkills: [], damage: 3, damageType: "pierce", altDamageTypes: [], range: "medium",
    properties: ["reload"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 3 Pierce; Medium (50 ft). Reload: needs an Interact Action to reload after each Strike.",
    automation: [
      { kind: "reload" }
    ]
  },
  {
    id: "flintlock-rifle", name: "Flintlock Rifle", page: 140, category: "ranged",
    skill: "wit", altSkills: [], damage: 4, damageType: "pierce", altDamageTypes: [], range: "long",
    properties: ["reload"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 4 Pierce; Long (150 ft). Reload: needs an Interact Action to reload after each Strike.",
    automation: [
      { kind: "reload" }
    ]
  },
  {
    id: "gauss-cannon", name: "Gauss Cannon", page: 141, category: "ranged",
    skill: "smarts", altSkills: [], damage: 6, damageType: "shock", altDamageTypes: [], range: "long",
    properties: ["reload", "twoHander", "heavy"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 6 Shock; Long (150 ft). Reload: needs an Interact Action to reload after each Strike. Two-hander: needs both hands free. Heavy: each Strike costs an Attack and an Interact Action.",
    automation: [
      { kind: "reload" },
      { kind: "custom", note: "Two-hander: needs both hands free." }
    ]
  },
  {
    id: "heavy-machine-gun", name: "Heavy Machine Gun", page: 141, category: "ranged",
    skill: "grit", altSkills: [], damage: 4, damageType: "pierce", altDamageTypes: [], range: "long",
    properties: ["heavy", "twoHander", "sprayNPray"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 4 Pierce; Long (150 ft). Heavy: each Strike costs an Attack and an Interact Action. Two-hander: needs both hands free. Spray'n'Pray: every other enemy within 5 ft of the target must pass a CR 1 Luck Check or also be hit by the Strike.",
    automation: [
      { kind: "onHit", note: "Spray'n'Pray: each other enemy within 5 ft of the target makes a CR 1 Luck Check. Those that fail are also hit by this Strike." },
      { kind: "custom", note: "Two-hander: needs both hands free." }
    ]
  },
  {
    id: "harpoon-gun", name: "Harpoon Gun", page: 141, category: "ranged",
    skill: "grit", altSkills: [], damage: 6, damageType: "sharp", altDamageTypes: [], range: "medium",
    properties: ["reload", "pinned"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 6 Sharp; Medium (50 ft). Reload: needs an Interact Action to reload after each Strike. Pinned: a Large or smaller enemy it hits can't Move until it spends its Interact Action pulling the harpoon out, taking 1 wound.",
    automation: [
      { kind: "reload" },
      { kind: "onHit", status: "immobile", note: "Pinned: the target is Immobile until it spends its Interact Action removing the projectile, which gives it 1 wound. Only Large or smaller enemies are pinned, so remove Immobile from anything bigger." }
    ]
  },
  {
    id: "hunting-rifle", name: "Hunting Rifle", page: 141, category: "ranged",
    skill: "wit", altSkills: [], damage: 6, damageType: "pierce", altDamageTypes: [], range: "long",
    properties: ["reload", "twoHander", "takeAim"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 6 Pierce; Long (150 ft). Reload: needs an Interact Action to reload after each Strike. Two-hander: needs both hands free. Take Aim: an Interact Action spent aiming gives your next Strike with it Minor Advantage.",
    automation: [
      { kind: "reload" },
      { kind: "custom", note: "Two-hander: needs both hands free." }
    ]
  },
  {
    id: "leecher", name: "Leecher", page: 142, category: "ranged",
    skill: "strange", altSkills: [], damage: 2, damageType: "soul", altDamageTypes: [], range: "medium",
    properties: ["witherLeecher"], material: "", ammo: null, unarmed: false,
    summary: "Strange; 2 Soul; Medium (50 ft). Wither: an enemy it hits must pass a CR 2 Grit Check or be Weakened (CR -1) until your next Combat Turn.",
    automation: [
      { kind: "onHit", status: "weakened", save: { skill: "grit", cr: 2 }, until: "attackerNextTurn" }
    ]
  },
  {
    id: "longbow", name: "Longbow", page: 142, category: "ranged",
    skill: "wit", altSkills: [], damage: 2, damageType: "pierce", altDamageTypes: [], range: "long",
    properties: [], material: "", ammo: null, unarmed: false,
    summary: "Wit; 2 Pierce; Long (150 ft). No special ability.",
    automation: []
  },
  {
    id: "lightning-lancer", name: "Lightning Lancer", page: 142, category: "ranged",
    skill: "smarts", altSkills: [], damage: 4, damageType: "shock", altDamageTypes: [], range: "medium",
    properties: ["electrocute", "sprayNPray"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 4 Shock; Medium (50 ft). Electrocute: Shock damage is doubled against a target standing in water. Spray'n'Pray: every other enemy within 5 ft of the target must pass a CR 1 Luck Check or also be hit by the Strike.",
    automation: [
      { kind: "onHit", damageType: "shock", note: "Electrocute: if the target is in water, the Shock damage is doubled. Add the extra wounds by hand." },
      { kind: "onHit", note: "Spray'n'Pray: each other enemy within 5 ft of the target makes a CR 1 Luck Check. Those that fail are also hit by this Strike." }
    ]
  },
  {
    id: "mine-launcher", name: "Mine Launcher", page: 142, category: "ranged",
    skill: "smarts", altSkills: [], damage: 8, damageType: "blunt", altDamageTypes: [], range: "long",
    properties: ["reload", "remoteDetonate"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 8 Blunt; Long (150 ft). Reload: needs an Interact Action to reload after each Strike. Remote Detonate: an Interact Action sets off a mine this launcher fired.",
    automation: [
      { kind: "reload" },
      { kind: "custom", note: "Remote Detonate: spend an Interact Action to detonate a mine fired from this launcher. Resolve the blast by hand." }
    ]
  },
  {
    id: "pistol", name: "Pistol", page: 143, category: "ranged",
    skill: "wit", altSkills: [], damage: 2, damageType: "pierce", altDamageTypes: [], range: "medium",
    properties: [], material: "", ammo: null, unarmed: false,
    summary: "Wit; 2 Pierce; Medium (50 ft). No special ability.",
    automation: []
  },
  {
    id: "plasma-cutter", name: "Plasma Cutter", page: 143, category: "ranged",
    skill: "smarts", altSkills: [], damage: 3, damageType: "fire", altDamageTypes: [], range: "medium",
    properties: ["piercer"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 3 Fire; Medium (50 ft). Piercer: armour never reduces its damage.",
    automation: [
      { kind: "ignoreArmour" }
    ]
  },
  {
    id: "rivet-gun", name: "Rivet Gun", page: 143, category: "ranged",
    skill: "grit", altSkills: [], damage: 4, damageType: "pierce", altDamageTypes: [], range: "near",
    properties: ["knockBack", "twoHander"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 4 Pierce; Near (15 ft). Knock-back (N): a hit shoves the target 3 hex (Near) away. Two-hander: needs both hands free.",
    automation: [
      { kind: "onHit", note: "Knock-back (N): push the target 15 ft (Near, 3 hex) away from you." },
      { kind: "custom", note: "Two-hander: needs both hands free." },
      { kind: "ranged" }
    ]
  },
  {
    id: "plasma-welder", name: "Plasma Welder", page: 143, category: "ranged",
    skill: "smarts", altSkills: [], damage: 5, damageType: "fire", altDamageTypes: [], range: "near",
    properties: ["piercer", "fuel", "highlyFlammable"], material: "", ammo: { value: 10, max: 10 }, unarmed: false,
    summary: "Smarts; 5 Fire; Near (15 ft). Piercer: armour never reduces its damage. Fuel (10): each Strike burns 1 fuel, and it can't be used once empty. Highly Flammable: a hit's Fire save is a CR 2 Luck Check, and failing it gives Burning (2) rather than Burning (1).",
    automation: [
      { kind: "ignoreArmour" },
      { kind: "saveOverride", damageType: "fire", cr: 2, value: 2 },
      { kind: "ranged" }
    ]
  },
  {
    id: "sawn-off-shotgun", name: "Sawn-off Shotgun", page: 144, category: "ranged",
    skill: "grit", altSkills: [], damage: 6, damageType: "blunt", altDamageTypes: [], range: "near",
    properties: ["reload", "sprayNPray"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 6 Blunt; Near (15 ft). Reload: needs an Interact Action to reload after each Strike. Spray'n'Pray: every other enemy within 5 ft of the target must pass a CR 1 Luck Check or also be hit by the Strike.",
    automation: [
      { kind: "reload" },
      { kind: "onHit", note: "Spray'n'Pray: each other enemy within 5 ft of the target makes a CR 1 Luck Check. Those that fail are also hit by this Strike." },
      { kind: "ranged" }
    ]
  },
  {
    id: "sniper-rifle", name: "Sniper Rifle", page: 144, category: "ranged",
    skill: "wit", altSkills: [], damage: 6, damageType: "pierce", altDamageTypes: [], range: "far",
    properties: ["twoHander", "heavy", "reload"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 6 Pierce; Far (200 ft). Two-hander: needs both hands free. Heavy: each Strike costs an Attack and an Interact Action. Reload: needs an Interact Action to reload after each Strike.",
    automation: [
      { kind: "reload" },
      { kind: "custom", note: "Two-hander: needs both hands free." }
    ]
  },
  {
    id: "shotgun", name: "Shotgun", page: 144, category: "ranged",
    skill: "wit", altSkills: [], damage: 6, damageType: "blunt", altDamageTypes: [], range: "medium",
    properties: ["reload", "knockBack", "twoHander"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 6 Blunt; Medium (50 ft). Reload: needs an Interact Action to reload after each Strike. Knock-back (N): a hit shoves the target 3 hex (Near) away. Two-hander: needs both hands free.",
    automation: [
      { kind: "reload" },
      { kind: "onHit", note: "Knock-back (N): push the target 15 ft (Near, 3 hex) away from you." },
      { kind: "custom", note: "Two-hander: needs both hands free." }
    ]
  },
  {
    id: "sonic-pacifier", name: "Sonic Pacifier", page: 144, category: "ranged",
    skill: "smarts", altSkills: [], damage: 4, damageType: "soul", altDamageTypes: [], range: "medium",
    properties: ["sensoryOverload"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 4 Soul; Medium (50 ft). Sensory Overload: the target must pass a CR 2 Smarts Check or be Blinded until the end of the next Combat Round.",
    automation: [
      { kind: "onHit", status: "blinded", save: { skill: "smarts", cr: 2 }, rounds: 1 }
    ]
  },
  {
    id: "sorcerers-skull-candle", name: "Sorcerer's Skull Candle", page: 145, category: "ranged",
    skill: "heart", altSkills: ["strange"], damage: 3, damageType: "soul", altDamageTypes: ["corrosive"], range: "long",
    properties: ["dualDamage", "terrifying", "corrode"], material: "", ammo: null, unarmed: false,
    summary: "Heart or Strange; 3 Soul or Corrosive; Long (150 ft). Terrifying: a target hit with Soul damage must pass a CR 2 Strange Check or become Afraid. Corrode: a target hit with Corrosive damage must pass a CR 1 Luck Check or be Weakened (CR -1) until the Combat Encounter ends.",
    automation: [
      { kind: "onHit", damageType: "soul", status: "afraid", save: { skill: "strange", cr: 2 }, fear: true },
      { kind: "onHit", damageType: "corrosive", status: "weakened", save: { skill: "luck", cr: 1 }, until: "encounter" }
    ]
  },
  {
    id: "stake-rifle", name: "Stake Rifle", page: 145, category: "ranged",
    skill: "wit", altSkills: [], damage: 3, damageType: "pierce", altDamageTypes: [], range: "long",
    properties: ["pinned", "vampireSlayer"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 3 Pierce; Long (150 ft). Pinned: a Large or smaller enemy it hits can't Move until it spends its Interact Action pulling the stake out, taking 1 wound. Vampire Slayer: after a Critical Hit on a Vampyric enemy of CR 2 or lower, roll a CR 2 Luck Check; on a success it dies outright.",
    automation: [
      { kind: "onHit", status: "immobile", note: "Pinned: the target is Immobile until it spends its Interact Action removing the projectile, which gives it 1 wound. Only Large or smaller enemies are pinned, so remove Immobile from anything bigger." },
      { kind: "onHit", note: "Vampire Slayer: if this was a Critical Hit on a Vampyric enemy of CR 2 or lower, keep it targeted, post this weapon to chat and roll its CR 2 Luck Check. On a success the enemy is slain instantly." },
      { kind: "check", skill: "luck", cr: 2, label: "Vampire Slayer (after a Critical Hit on a Vampyric enemy of CR 2 or lower)", onSuccess: "The targeted enemy is slain instantly.", success: [{ kind: "applyStatus", status: "dead", target: "enemy" }] }
    ]
  },
  {
    id: "spore-launcher", name: "Spore Launcher", page: 145, category: "ranged",
    skill: "smarts", altSkills: [], damage: 2, damageType: "poison", altDamageTypes: [], range: "medium",
    properties: ["reload", "toxic"], material: "", ammo: null, unarmed: false,
    summary: "Smarts; 2 Poison; Medium (50 ft). Reload: needs an Interact Action to reload after each Strike. Toxic: a hit's Poison save is a CR 2 Grit Check, and failing it gives Poisoned (2) rather than Poisoned (1).",
    automation: [
      { kind: "reload" },
      { kind: "saveOverride", damageType: "poison", cr: 2, value: 2 }
    ]
  },
  {
    id: "wizards-staff", name: "Wizard's Staff", page: 145, category: "ranged",
    skill: "smarts", altSkills: ["strange"], damage: 3, damageType: "shock", altDamageTypes: ["fire"], range: "long",
    properties: ["dualDamage", "highlyFlammable", "electrocute"], material: "", ammo: null, unarmed: false,
    summary: "Smarts or Strange; 3 Shock or Fire; Long (150 ft). Highly Flammable: a Fire hit's save is a CR 2 Luck Check, and failing it gives Burning (2) rather than Burning (1). Electrocute: Shock damage is doubled against a target standing in water.",
    automation: [
      { kind: "saveOverride", damageType: "fire", cr: 2, value: 2 },
      { kind: "onHit", damageType: "shock", note: "Electrocute: if the target is in water, the Shock damage is doubled. Add the extra wounds by hand." }
    ]
  },

  // ---------------------------------------------------------------- Traps and thrown (p.146-148)
  {
    id: "thrown-object", name: "Thrown Object", page: 146, category: "thrown",
    skill: "wit", altSkills: [], damage: 1, damageType: "blunt", altDamageTypes: [], range: "medium",
    properties: [], material: "", ammo: null, unarmed: false,
    summary: "Wit (assumed, as no skill is printed); 1 Blunt; Medium (50 ft). Any loose object you can hurl. Very tough enemies may be unaffected.",
    automation: [
      { kind: "custom", note: "The Director may rule that a tough enemy ignores this damage." }
    ]
  },
  {
    id: "acid-flask", name: "Acid Flask", page: 146, category: "thrown",
    skill: "wit", altSkills: [], damage: 3, damageType: "corrosive", altDamageTypes: [], range: "medium",
    properties: [], material: "", ammo: { value: 1, max: 1 }, unarmed: false,
    summary: "Wit; 3 Corrosive; Medium (50 ft). Can be made with the Mad Scientist ability (p46).",
    automation: []
  },
  {
    id: "caltrops", name: "Caltrops", page: 146, category: "trap",
    skill: "wit", altSkills: [], damage: 3, damageType: "sharp", altDamageTypes: [], range: "medium",
    properties: ["deployable", "trap"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 3 Sharp; Medium (50 ft). Deployable and Trap, as for the Bear Trap: set on a hex, an enemy moving toward it must pass a CR 2 Wit Check to go around, or it stumbles in and takes the damage.",
    automation: [
      { kind: "custom", note: "Deployable and Trap: place the caltrops on a hex. An enemy moving toward it makes a CR 2 Wit Check. On a success it goes around; on a failure it takes 3 Sharp and the Sharp save. There is no Strike roll, so apply the damage by hand." }
    ]
  },
  {
    id: "bear-trap", name: "Bear Trap", page: 146, category: "trap",
    skill: "grit", altSkills: [], damage: 4, damageType: "pierce", altDamageTypes: [], range: "close",
    properties: ["deployable", "trap", "trapped"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 4 Pierce; Close (5 ft). Deployable: it must be set as a trap, and an enemy coming within Close Range of it takes its damage and triggers its abilities. Trap: an enemy moving toward its hex makes a CR 2 Wit Check, stepping around it on a success or blundering in on a failure. Trapped: a caught Large or smaller enemy can't Move until it passes a CR 2 Grit Check, and it takes 1 wound breaking free.",
    automation: [
      { kind: "applyStatus", status: "immobile", target: "enemy", save: { skill: "wit", cr: 2 }, when: { manual: true, label: "Trap: a Large or smaller enemy moves toward it" } },
      { kind: "custom", note: "Deployable and Trap: place the trap on a hex. When an enemy moves toward it, target the enemy and click the trap's button on its chat card. The enemy rolls a CR 2 Wit Check, and if it fails it is Immobile (Trapped). There is no Strike roll, so apply the 4 Pierce by hand on a failure. For an enemy bigger than Large, roll its Wit Check by hand: it takes the damage on a failure but isn't Trapped. A Trapped enemy stays put until it passes a CR 2 Grit Check, then removes Immobile and takes 1 wound." }
    ]
  },
  {
    id: "cryo-grenade", name: "Cryo Grenade", page: 146, category: "thrown",
    skill: "smarts", altSkills: [], damage: 6, damageType: "cold", altDamageTypes: [], range: "medium",
    properties: ["explosive"], material: "", ammo: { value: 1, max: 1 }, unarmed: false,
    summary: "Smarts; 6 Cold; Medium (50 ft). Explosive (C): every enemy within 5 ft (Close) of the target hit also takes the damage.",
    automation: [
      { kind: "onHit", note: "Explosive (C): this damage, and its effects, also hit every enemy within Close Range (5 ft) of the target." }
    ]
  },
  {
    id: "flashbang-grenade", name: "Flashbang Grenade", page: 147, category: "thrown",
    skill: "wit", altSkills: [], damage: 1, damageType: "soul", altDamageTypes: [], range: "medium",
    properties: ["explosive", "sensoryOverload"], material: "", ammo: { value: 1, max: 1 }, unarmed: false,
    summary: "Wit; 1 Soul; Medium (50 ft). Explosive (C): every enemy within 5 ft (Close) of the target hit also takes the damage. Sensory Overload: every enemy within 50 ft (Medium) of the Strike must pass a CR 2 Smarts Check or be Blinded until your next Combat Round.",
    automation: [
      { kind: "onHit", status: "blinded", save: { skill: "smarts", cr: 2 }, until: "attackerNextTurn", note: "Sensory Overload: every other enemy within Medium Range (50 ft) of the Strike also makes a CR 2 Smarts Check or is Blinded. Target them, post the Flashbang to chat and click its Blinded button." },
      { kind: "applyStatus", status: "blinded", target: "enemy", save: { skill: "smarts", cr: 2 }, until: "attackerNextTurn", when: { manual: true, label: "Sensory Overload: other enemies within 50 ft of the Strike" } },
      { kind: "onHit", note: "Explosive (C): this damage, and its effects, also hit every enemy within Close Range (5 ft) of the target." }
    ]
  },
  {
    id: "grenade", name: "Grenade", page: 147, category: "thrown",
    skill: "wit", altSkills: [], damage: 6, damageType: "blunt", altDamageTypes: [], range: "medium",
    properties: ["explosive"], material: "", ammo: { value: 1, max: 1 }, unarmed: false,
    summary: "Wit; 6 Blunt; Medium (50 ft). Explosive (C): every enemy within 5 ft (Close) of the target hit also takes the damage.",
    automation: [
      { kind: "onHit", note: "Explosive (C): this damage, and its effects, also hit every enemy within Close Range (5 ft) of the target." }
    ]
  },
  {
    id: "hunters-snare", name: "Hunter's Snare", page: 147, category: "trap",
    skill: "wit", altSkills: [], damage: 1, damageType: "pierce", altDamageTypes: [], range: "close",
    properties: ["deployable", "trap", "trapped"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 1 Pierce; Close (5 ft). Deployable, Trap and Trapped, as for the Bear Trap: an enemy moving toward its hex must pass a CR 2 Wit Check to go around, or it stumbles in and takes the damage. A caught Large or smaller enemy can't Move until it passes a CR 2 Grit Check, and it takes 1 wound breaking free.",
    automation: [
      { kind: "applyStatus", status: "immobile", target: "enemy", save: { skill: "wit", cr: 2 }, when: { manual: true, label: "Trap: a Large or smaller enemy moves toward it" } },
      { kind: "custom", note: "Deployable and Trap: place the snare on a hex. When an enemy moves toward it, target the enemy and click the snare's button on its chat card. The enemy rolls a CR 2 Wit Check, and if it fails it is Immobile (Trapped). There is no Strike roll, so apply the 1 Pierce by hand on a failure. For an enemy bigger than Large, roll its Wit Check by hand: it takes the damage on a failure but isn't Trapped. A Trapped enemy stays put until it passes a CR 2 Grit Check, then removes Immobile and takes 1 wound." }
    ]
  },
  {
    id: "mine", name: "Mine", page: 147, category: "trap",
    skill: "smarts", altSkills: [], damage: 8, damageType: "blunt", altDamageTypes: [], range: "close",
    properties: ["deployable", "trap", "explosive"], material: "", ammo: { value: 1, max: 1 }, unarmed: false,
    summary: "Smarts; 8 Blunt; Close (5 ft). Deployable and Trap, as for the Bear Trap: an enemy moving toward its hex must pass a CR 2 Wit Check to go around, or it stumbles in and sets it off. Explosive (C): every enemy within 5 ft (Close) of the target also takes the damage.",
    automation: [
      { kind: "custom", note: "Deployable and Trap: place the mine on a hex. An enemy moving toward it makes a CR 2 Wit Check. On a success it goes around; on a failure the mine deals 8 Blunt to it and to every enemy within Close Range (5 ft) of it. There is no Strike roll, so apply the damage by hand." }
    ]
  },
  {
    id: "molotov-cocktail", name: "Molotov Cocktail", page: 147, category: "thrown",
    skill: "wit", altSkills: [], damage: 4, damageType: "fire", altDamageTypes: [], range: "medium",
    properties: ["explosive", "highlyFlammable"], material: "", ammo: { value: 1, max: 1 }, unarmed: false,
    summary: "Wit; 4 Fire; Medium (50 ft). Explosive (C): every enemy within 5 ft (Close) of the target hit also takes the damage. Highly Flammable: a Fire hit's save is a CR 2 Luck Check, and failing it gives Burning (2) rather than Burning (1). Can be made with the Mad Scientist ability (p46).",
    automation: [
      { kind: "saveOverride", damageType: "fire", cr: 2, value: 2 },
      { kind: "onHit", note: "Explosive (C): this damage, and its effects, also hit every enemy within Close Range (5 ft) of the target." }
    ]
  },
  {
    id: "oil-flask", name: "Oil Flask", page: 148, category: "thrown",
    skill: "wit", altSkills: [], damage: 0, damageType: "blunt", altDamageTypes: [], range: "medium",
    properties: ["lightEmUp"], material: "", ammo: { value: 1, max: 1 }, unarmed: false,
    summary: "Wit; no damage (N/A); Medium (50 ft). Light 'Em Up: Fire damage against an enemy it hits is doubled and gives Burning (1) with no save. The effect ends once one Fire Strike or Fire ability has applied Burning this way. Can be made with the Mad Scientist ability (p46).",
    automation: [
      { kind: "onHit", note: "Light 'Em Up: the next Fire Strike or Fire ability against this target deals double damage and gives Burning (1) with no save. The effect then ends." }
    ]
  },
  {
    id: "smoke-bomb", name: "Smoke Bomb", page: 148, category: "thrown",
    skill: "wit", altSkills: [], damage: 0, damageType: "blunt", altDamageTypes: [], range: "medium",
    properties: ["obscure"], material: "", ammo: { value: 1, max: 1 }, unarmed: false,
    summary: "Wit; no damage (N/A); Medium (50 ft). Obscure: smoke surrounds you for 2 Combat Rounds. You may Escape a Brawl at once with no penalty. Each enemy within 50 ft (Medium) must pass a CR 2 Wit Check or be Blinded until the start of your next Combat Turn. While inside the cloud you are Steeled and in Stealth.",
    automation: [
      { kind: "applyStatus", status: "steeled", target: "self", rounds: 2, when: { manual: true, label: "Obscure: you are in the smoke cloud" } },
      { kind: "applyStatus", status: "stealth", target: "self", rounds: 2, when: { manual: true, label: "Obscure: you are in the smoke cloud" } },
      { kind: "applyStatus", status: "blinded", target: "enemy", save: { skill: "wit", cr: 2 }, until: "attackerNextTurn", when: { manual: true, label: "Obscure: enemies within 50 ft of you" } },
      { kind: "custom", note: "Obscure: don't Strike with it. Post the Smoke Bomb to chat, target the enemies within 50 ft and use its buttons: they save or are Blinded, and you gain Steeled and Stealth for the cloud's 2 Combat Rounds. You may Escape a Brawl at once with no free attacks against you. Remove Steeled and Stealth early if you leave the cloud, and mark the bomb as used." }
    ]
  },
  {
    id: "sunlight-flask", name: "Sunlight Flask", page: 148, category: "thrown",
    skill: "wit", altSkills: [], damage: 1, damageType: "fire", altDamageTypes: [], range: "medium",
    properties: ["explosive", "sunlight", "sensoryOverload"], material: "", ammo: { value: 1, max: 1 }, unarmed: false,
    summary: "Wit; 1 Fire; Medium (50 ft). Explosive (C): every enemy within 5 ft (Close) of the target hit also takes the damage. Sunlight: a creature with a Weakness to sunlight takes 5 Fire and gains Burning (1) when the flask hits it. Sensory Overload: the enemy hit must pass a CR 2 Wit Check or be Blinded for the next Combat Round. Can be made with the Mad Scientist ability (p46).",
    automation: [
      { kind: "onHit", status: "blinded", save: { skill: "wit", cr: 2 }, rounds: 1 },
      { kind: "onHit", note: "Sunlight: if the target has a Weakness to sunlight, it takes 5 Fire damage (apply by hand) and gains Burning (1): post the flask to chat and click its Burning button." },
      { kind: "applyStatus", status: "burning", value: 1, target: "enemy", when: { manual: true, label: "Sunlight: the target hit has a Weakness to sunlight" } },
      { kind: "onHit", note: "Explosive (C): this damage, and its effects, also hit every enemy within Close Range (5 ft) of the target." }
    ]
  },
  {
    id: "throwing-knives", name: "Throwing Knives", page: 148, category: "thrown",
    skill: "wit", altSkills: [], damage: 2, damageType: "pierce", altDamageTypes: [], range: "medium",
    properties: [], material: "", ammo: null, unarmed: false,
    summary: "Wit; 2 Pierce; Medium (50 ft). No special ability.",
    automation: []
  },

  // ---------------------------------------------------------------- Legendary (p.149-150)
  {
    id: "doom-bringer", name: "Doom Bringer", page: 149, category: "legendary",
    skill: "grit", altSkills: [], damage: 3, damageType: "pierce", altDamageTypes: [], range: "close",
    properties: ["legendary", "witherDoomBringer", "vampyric"], material: "", ammo: null, unarmed: false,
    summary: "Grit; 3 Pierce; Close (5 ft). Legendary weapon, linked to the Survivor's Legendary Weapon ability (p74). Wither: a targeted enemy must pass a CR 2 Grit Check or be Weakened (CR -1) for the rest of the Combat Encounter. Vampyric: each successful Strike heals you 1 wound and ticks the Doom Clock up 1 minute.",
    automation: [
      { kind: "onHit", status: "weakened", save: { skill: "grit", cr: 2 }, until: "encounter" },
      { kind: "onHit", heal: 1, doom: 1, note: "Vampyric: you heal 1 wound and the Doom Clock ticks up 1 minute." }
    ]
  },
  {
    id: "energy-blade", name: "Energy Blade", page: 149, category: "legendary",
    skill: "smarts", altSkills: [], damage: 6, damageType: "fire", altDamageTypes: [], range: "close",
    properties: ["legendary", "fuel", "highlyFlammable"], material: "", ammo: { value: 10, max: 10 }, unarmed: false,
    summary: "Smarts; 6 Fire; Close (5 ft). Legendary weapon, linked to the Survivor's Legendary Weapon ability (p74). Fuel (10): each Strike burns 1 fuel, and it can't be used once empty. Highly Flammable: a Fire hit's save is a CR 2 Luck Check, and failing it gives Burning (2) rather than Burning (1).",
    automation: [
      { kind: "saveOverride", damageType: "fire", cr: 2, value: 2 }
    ]
  },
  {
    id: "the-helsing", name: "The Helsing", page: 149, category: "legendary",
    skill: "wit", altSkills: [], damage: 3, damageType: "fire", altDamageTypes: ["blunt", "shock"], range: "long",
    properties: ["legendary", "variableAmmoHelsing"], material: "", ammo: null, unarmed: false,
    summary: "Wit; 3 damage of the loaded type (printed N/A); Long (150 ft). Legendary weapon, linked to the Survivor's Legendary Weapon ability (p74). Variable Ammo: an Interact Action switches its damage type between Fire, Blunt (Holy or Silver) and Shock.",
    automation: [
      { kind: "custom", note: "Variable Ammo: changing the loaded type costs an Interact Action. Pick the loaded type in the Strike dialog. Blunt rounds are Holy or Silver, so set this weapon's Material to holy or silver while they are loaded, and clear it for Fire or Shock." }
    ]
  },
  {
    id: "excalibur", name: "Excalibur", page: 150, category: "legendary",
    skill: "heart", altSkills: [], damage: 6, damageType: "sharp", altDamageTypes: [], range: "close",
    properties: ["legendary", "onlyTheWorthy", "cleave"], material: "", ammo: null, unarmed: false,
    summary: "Heart; 6 Sharp; Close (5 ft). Legendary weapon, linked to the Survivor's Legendary Weapon ability (p74). Only the Worthy: only a character the sword judges worthy can wield it. Cleave: if a Strike kills its target, the unused damage carries over to another enemy of your choice within Close Range (5 ft).",
    automation: [
      { kind: "onHit", note: "Cleave: if this Strike killed the target, deal the leftover damage to another enemy of your choice within Close Range (5 ft)." },
      { kind: "custom", note: "Only the Worthy: the Director decides whether you are worthy to use it." }
    ]
  },
  {
    id: "necronomicon", name: "Necronomicon", page: 150, category: "legendary",
    skill: "strange", altSkills: [], damage: 5, damageType: "soul", altDamageTypes: [], range: "medium",
    properties: ["legendary", "terrifying"], material: "", ammo: null, unarmed: false,
    summary: "Strange; 5 Soul; Medium (50 ft). Legendary weapon, linked to the Survivor's Legendary Weapon ability (p74). Terrifying: an enemy it hits must pass a CR 2 Strange Check or become Afraid.",
    automation: [
      { kind: "onHit", status: "afraid", save: { skill: "strange", cr: 2 }, fear: true }
    ]
  }
];
