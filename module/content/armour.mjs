export default [
  {
    id: "battle-armour", name: "Battle Armour", page: 151, slots: 3, heavy: false, unbreakable: false,
    abilityName: "Clang!",
    summary: "3 Armour Slots. Clang!: you are Resistant to Blunt and Sharp damage.",
    automation: [
      { kind: "resistance", types: ["blunt", "sharp"] }
    ]
  },
  {
    id: "berserkers-bear-pelt", name: "Berserker's Bear Pelt", page: 151, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Primal Instincts, Beastly Strength",
    summary: "1 Armour Slot. Primal Instincts: +1 Talent Die when tracking enemies. Beastly Strength: +1 Core Skill Point in Grit while it is equipped.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Primal Instincts: tracking enemies" } },
      { kind: "skillPoints", skill: "grit", amount: 1 }
    ]
  },
  {
    id: "body-armour", name: "Body Armour", page: 151, slots: 2, heavy: false, unbreakable: false,
    abilityName: "",
    summary: "2 Armour Slots. No special ability: it rolls 2 Skill Dice to prevent damage when you are hit.",
    automation: []
  },
  {
    id: "bomb-disposal-suit", name: "Bomb Disposal Suit", page: 151, slots: 3, heavy: true, unbreakable: false,
    abilityName: "Bombproof, Heavy",
    summary: "3 Armour Slots. Bombproof: you are Resistant to Fire and Blunt damage and Immune to Burning. Heavy: your Speed drops one tier while it is equipped.",
    automation: [
      { kind: "resistance", types: ["fire", "blunt"] },
      { kind: "immunity", types: ["burning"] }
    ]
  },
  {
    id: "boots-of-spring-heeled-jack", name: "Boots of Spring-Heeled Jack", page: 152, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Springy",
    summary: "1 Armour Slot. Springy: +1 Talent Die when scaling heights or leaping great distances.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Springy: scaling heights or leaping a great distance" } }
    ]
  },
  {
    id: "bulletproof-vest", name: "Bulletproof Vest", page: 152, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Bulletproof",
    summary: "1 Armour Slot. Bulletproof: you are Resistant to damage from ranged attacks (bullets, arrows, thrown objects and so on).",
    automation: [
      { kind: "resistance", types: ["ranged"] }
    ]
  },
  {
    id: "diving-suit", name: "Diving Suit", page: 152, slots: 2, heavy: true, unbreakable: false,
    abilityName: "Warm, Airtight, Heavy",
    summary: "2 Armour Slots. Warm: you are Resistant to Cold damage. Airtight: you can breathe and act normally where the air is unbreathable (space, underwater), but once the suit is at 0 Health Points the environment affects you. Heavy: your Speed drops one tier while it is equipped.",
    automation: [
      { kind: "resistance", types: ["cold"] },
      { kind: "custom", note: "Airtight: you breathe and act normally in unbreathable environments such as space or underwater. When this armour reaches 0 HP the environment's effects apply to you." }
    ]
  },
  {
    id: "dragon-hide-cape", name: "Dragon-Hide Cape", page: 152, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Hot Blooded",
    summary: "1 Armour Slot. Hot Blooded: you are Resistant to Fire damage.",
    automation: [
      { kind: "resistance", types: ["fire"] }
    ]
  },
  {
    id: "exoskeleton", name: "Exoskeleton", page: 152, slots: 2, heavy: true, unbreakable: false,
    abilityName: "Muscle Enhancer, Heavy",
    summary: "2 Armour Slots. Muscle Enhancer: +1 Talent Point in Grit while you wear it. Heavy: your Speed drops one tier while it is equipped.",
    automation: [
      { kind: "talentPoints", skill: "grit", amount: 1 }
    ]
  },
  {
    id: "hazmat-suit", name: "Hazmat Suit", page: 152, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Toxin Free, Airtight",
    summary: "1 Armour Slot. Toxin Free: you are Resistant to Poison damage. Airtight: you can breathe and act normally where the air is unbreathable (space, underwater), but once the suit is at 0 Health Points the environment affects you.",
    automation: [
      { kind: "resistance", types: ["poison"] },
      { kind: "custom", note: "Airtight: you breathe and act normally in unbreathable environments such as space or underwater. When this armour reaches 0 HP the environment's effects apply to you." }
    ]
  },
  {
    id: "fur-lined-explorer", name: "Fur Lined Explorer", page: 153, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Warm",
    summary: "1 Armour Slot. Warm: you are Resistant to Cold damage.",
    automation: [
      { kind: "resistance", types: ["cold"] }
    ]
  },
  {
    id: "helmet", name: "Helmet", page: 153, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Lifesaver",
    summary: "1 Armour Slot. Lifesaver: if a Strike would take your Lifeline to 0 Health Points while the Helmet is equipped, the Helmet is permanently destroyed instead and you are left at 1 Health Point.",
    automation: [
      { kind: "lifesaver" }
    ]
  },
  {
    id: "jet-pack", name: "Jet-Pack", page: 153, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Temporary Flight",
    summary: "1 Armour Slot. Temporary Flight: activate it to gain the Fly ability for one Combat Encounter. 2 uses per Doom Quarter.",
    automation: [
      { kind: "custom", note: "Temporary Flight: activate to gain Fly for one Combat Encounter (move over any terrain without losing Speed unless a physical barrier blocks you). Up to 2 activations per Doom Quarter; track them by hand." }
    ]
  },
  {
    id: "knights-armour", name: "Knight's Armour", page: 153, slots: 3, heavy: true, unbreakable: false,
    abilityName: "Clang!, Heavy, Valour",
    summary: "3 Armour Slots. Clang!: you are Resistant to Blunt and Sharp damage. Heavy: your Speed drops one tier while it is equipped. Valour: Minor Advantage (+1 Skill Die) on Fear Checks.",
    automation: [
      { kind: "resistance", types: ["blunt", "sharp"] },
      { kind: "poolDice", skill: "any", d6: 1, d8: 0, when: "fear" }
    ]
  },
  {
    id: "mining-helmet", name: "Mining Helmet", page: 154, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Lifesaver, Torchlight",
    summary: "1 Armour Slot. Lifesaver: if a Strike would take your Lifeline to 0 Health Points while it is equipped, the helmet is permanently destroyed instead and you are left at 1 Health Point. Torchlight: lights the area in front of you out to Medium Range.",
    automation: [
      { kind: "lifesaver" },
      { kind: "custom", note: "Torchlight: lights the area in front of you out to Medium Range (50 ft). Give your token a light source." }
    ]
  },
  {
    id: "psychic-amplifier", name: "Psychic Amplifier", page: 154, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Level Headed, Mental Protection",
    summary: "1 Armour Slot. Level Headed: Major Advantage (+1 Talent Die) on Fear Checks. Mental Protection: you are Resistant to Soul damage.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: "fear" },
      { kind: "resistance", types: ["soul"] }
    ]
  },
  {
    id: "space-suit", name: "Space Suit", page: 154, slots: 2, heavy: false, unbreakable: false,
    abilityName: "Airtight, Warm",
    summary: "2 Armour Slots. Airtight: you can breathe and act normally where the air is unbreathable (space, underwater), but once the suit is at 0 Health Points the environment affects you. Warm: you are Resistant to Cold damage.",
    automation: [
      { kind: "custom", note: "Airtight: you breathe and act normally in unbreathable environments such as space or underwater. When this armour reaches 0 HP the environment's effects apply to you." },
      { kind: "resistance", types: ["cold"] }
    ]
  },
  {
    id: "stealth-suit", name: "Stealth Suit", page: 154, slots: 2, heavy: false, unbreakable: false,
    abilityName: "Stealthy",
    summary: "2 Armour Slots. Stealthy: +1 Talent Die on Skill Checks to enter Stealth or to Hide.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: "stealth|hide" }
    ]
  },
  {
    id: "symbiotic-entity", name: "Symbiotic Entity", page: 155, slots: 3, heavy: false, unbreakable: false,
    abilityName: "Organic Armour, Agile, Muscle Enhancer",
    summary: "3 Armour Slots. Organic Armour (OPDQ): when it has 2 or fewer Health Points left across all its slots, you may take wounds to repair the same number of its Health Points. Agile: your Speed rises one tier while it is equipped. Muscle Enhancer: +1 Talent Point in Grit while you wear it.",
    automation: [
      { kind: "speedStep", amount: 1 },
      { kind: "talentPoints", skill: "grit", amount: 1 },
      { kind: "custom", note: "Organic Armour (once per Doom Quarter): when this armour has 2 or fewer HP left across all its slots, choose a number of wounds to take on your Lifeline and restore that many HP to the armour. Apply both by hand." }
    ]
  },
  {
    id: "the-juggernaut", name: "The Juggernaut", page: 155, slots: 3, heavy: true, unbreakable: false,
    abilityName: "Clang!, Heavy, Muscle Enhancer, Bulletproof",
    summary: "3 Armour Slots. Clang!: you are Resistant to Blunt and Sharp damage. Heavy: your Speed drops one tier while it is equipped. Muscle Enhancer: +1 Talent Point in Grit while you wear it. Bulletproof: you are Resistant to damage from ranged attacks.",
    automation: [
      { kind: "resistance", types: ["blunt", "sharp", "ranged"] },
      { kind: "talentPoints", skill: "grit", amount: 1 }
    ]
  },
  {
    id: "stab-proof-vest", name: "Stab-Proof Vest", page: 207, slots: 1, heavy: false, unbreakable: false,
    abilityName: "Stab-proof",
    summary: "1 Armour Slot. Stab-proof: you are Resistant to Sharp damage while you wear it. From the sample adventure Corporate Risers.",
    automation: [
      { kind: "resistance", types: ["sharp"] }
    ]
  }
];
