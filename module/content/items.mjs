export default [
  // Healing
  {
    id: "adrenaline-shot", name: "Adrenaline Shot", page: 156, category: "healing",
    consumable: true, quantity: 1, uses: null, doom: 0, action: "interact", skill: "",
    summary: "Revive: a character at Death's Door comes back conscious with 1 Health Point. One use only.",
    automation: [
      { kind: "removeStatus", status: "deathsDoor", target: "ally" },
      { kind: "heal", amount: 1, target: "ally" },
      { kind: "custom", note: "Target the character at Death's Door before using it. They leave Death's Door at 1 HP and stay conscious, unlike a normal stabilise. A Cursed target can't heal, so the Director sets the 1 HP by hand if they allow the revive." }
    ]
  },
  {
    id: "medicine", name: "Medicine", page: 158, category: "healing",
    consumable: true, quantity: 1, uses: null, doom: 0, action: "interact", skill: "",
    summary: "Cure: heals 1 wound and removes the Poisoned status from a character.",
    automation: [
      { kind: "removeStatus", status: "poisoned", target: "ally" },
      { kind: "heal", amount: 1, target: "ally" },
      { kind: "custom", note: "Target the character to treat before using it. With no target, it treats you." }
    ]
  },
  {
    id: "med-kit", name: "Med Kit", page: 158, category: "healing",
    consumable: false, quantity: 1, uses: { per: "story", max: 3 }, doom: 0, action: "interact", skill: "smarts",
    summary: "Patch Up: roll your Smarts Pool. Heal 2 wounds plus 1 more for each Smarts symbol rolled. Limit 3 uses.",
    automation: [
      { kind: "heal", amount: 2, target: "ally" },
      { kind: "heal", skill: "smarts", amount: 0, perSymbol: 1, freeSymbols: 0, cr: 1, target: "ally" },
      { kind: "custom", note: "Target the patient before using it and keep them targeted when you click Roll. With no target, it treats you. Use heals the 2 wounds at once; Roll heals 1 more wound per Smarts symbol. A roll with no Smarts symbols shows Failure, but the 2 wounds still stand." }
    ]
  },
  {
    id: "obadiahs-cure-all-tonic", name: "Obadiah's Cure All Tonic", page: 159, category: "healing",
    consumable: true, quantity: 1, uses: null, doom: 0, action: "interact", skill: "luck",
    summary: "Unpredictable Tonic: roll your Luck Pool. More Luck than Strange symbols: heal 4 wounds. More Strange than Luck: take 2 Blunt damage and gain Poisoned (1). A tie does nothing.",
    automation: [
      {
        kind: "check", skill: "luck", cr: null, label: "Unpredictable Tonic",
        onSuccess: "More Luck than Strange symbols: heal 4 wounds.",
        onFail: "More Strange than Luck symbols: take 2 Blunt damage and gain Poisoned (1).",
        success: [
          { kind: "heal", amount: 4, target: "self" }
        ],
        failure: [
          { kind: "damage", amount: 2, type: "blunt", target: "self", strike: false },
          { kind: "applyStatus", status: "poisoned", value: 1, target: "self" }
        ]
      },
      { kind: "custom", note: "The result depends on Luck vs Strange symbols, not a CR, so the Director sets the CR after the roll. Count Talent symbols as Luck. More Luck: set CR 1 (heals 4). More Strange: set CR 5 (2 Blunt damage and Poisoned (1)). A tie: leave the CR unset and nothing happens. CR 5 also counts as a failed check, so the engine ticks the Doom Clock 1 minute per Strange symbol. The tonic doesn't call for that, so turn the clock back." }
    ]
  },
  {
    id: "repair-kit", name: "Repair Kit", page: 159, category: "healing",
    consumable: true, quantity: 3, uses: { per: "opdq", max: 1 }, doom: 0, action: "interact", skill: "smarts",
    summary: "Repair (OPDQ): roll your Smarts Pool. Repair 1 wound on a piece of armour or a vehicle, plus 1 more for each Smarts symbol rolled. Limit 3 uses.",
    automation: [
      { kind: "check", skill: "smarts", cr: 1, label: "Repair", onSuccess: "Repair 1 wound on one piece of armour or a vehicle, plus 1 per Smarts symbol rolled.", onFail: "No Smarts symbols: repair 1 wound only." },
      { kind: "custom", note: "Quantity tracks the 3 total uses. After the roll, restore 1 + (Smarts symbols) Health Points to the chosen armour's slots or the vehicle by hand. A roll with no Smarts symbols shows Failure but still repairs 1." }
    ]
  },
  {
    id: "rosary-beads", name: "Rosary Beads", page: 159, category: "healing",
    consumable: false, quantity: 1, uses: { per: "opdq", max: 1 }, doom: 0, action: "interact", skill: "heart",
    summary: "Healing Prayer (OPDQ): roll your Heart Pool and heal yourself 1 wound for each Heart symbol rolled.",
    automation: [
      { kind: "heal", skill: "heart", amount: 0, perSymbol: 1, freeSymbols: 0, cr: 1, target: "self" }
    ]
  },

  // Buff
  {
    id: "alchemists-almanac", name: "Alchemist's Almanac", page: 156, category: "buff",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "passive", skill: "",
    summary: "Studious: +1 Core Skill Point in Smarts while the book is in your possession.",
    automation: [
      { kind: "skillPoints", skill: "smarts", amount: 1 }
    ]
  },
  {
    id: "energy-drink", name: "Energy Drink", page: 157, category: "buff",
    consumable: true, quantity: 1, uses: null, doom: 0, action: "interact", skill: "",
    summary: "Energy Boost: your Speed becomes Fast for a short time or for one Combat Encounter. 1 use.",
    automation: [
      { kind: "custom", note: "Set your Speed to Fast by hand for the rest of this Combat Encounter, or for a short time out of combat (the Director decides how long), then set it back." }
    ]
  },
  {
    id: "holy-book", name: "Holy Book", page: 157, category: "buff",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "passive", skill: "",
    summary: "Holy Protection: Demonic enemies have Major Disadvantage when they Strike you.",
    automation: [
      { kind: "custom", note: "Holy Protection: when a Demonic enemy Strikes you, the Director gives it Major Disadvantage (-1 Talent Die, or -2 Skill Dice if it has no Talent Dice; minimum 1 die)." }
    ]
  },
  {
    id: "holy-pendant", name: "Holy Pendant", page: 157, category: "buff",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "passive", skill: "",
    summary: "Warding Energy: Demonic enemies have Minor Disadvantage when they Strike you.",
    automation: [
      { kind: "custom", note: "Warding Energy: when a Demonic enemy Strikes you, the Director gives it Minor Disadvantage (-1 Skill Die, minimum 1 die)." }
    ]
  },
  {
    id: "liquor", name: "Liquor", page: 158, category: "buff",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "interact", skill: "",
    summary: "Dutch Courage: a drink lowers your Fear Status by one step and gives +1 Talent Die on rolls to resist Fear effects for 2 hours. The Director decides how many drinks the bottle holds.",
    automation: [
      { kind: "fearStep", amount: -1 },
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { tags: ["fear"], manual: true, label: "Dutch Courage: you drank Liquor in the last 2 hours" } },
      { kind: "custom", note: "Each drink steps your Fear Status down once. For the next 2 in-game hours, tick the Dutch Courage bonus on Fear Checks. The Director sets how many drinks are left." }
    ]
  },
  {
    id: "study-pills", name: "Study Pills", page: 160, category: "buff",
    consumable: false, quantity: 1, uses: { per: "opdc", max: 1 }, doom: 0, action: "interact", skill: "",
    summary: "High Alert (OPDC): +1 Core Skill Point in Wit and in Smarts until the next Doom Event, but you have Major Disadvantage on Fear Checks.",
    automation: [
      { kind: "poolDice", skill: ["wit", "smarts"], d6: 1, d8: 0, when: { manual: true, label: "High Alert: Study Pills taken (until the next Doom Event)" } },
      { kind: "custom", note: "Until the Doom Clock reaches its next quarter mark (Doom Event), tick the High Alert bonus on Wit and Smarts Checks and add Major Disadvantage to your Fear Checks in the roll dialog." }
    ]
  },
  {
    id: "strength-serum", name: "Strength Serum", page: 211, category: "buff",
    consumable: false, quantity: 1, uses: { per: "opdc", max: 1 }, doom: 0, action: "interact", skill: "",
    summary: "Strength Boost (OPDC): +2 Core Skill Points in Grit for the current Doom Quarter, but you have Major Disadvantage on Smarts Checks. From the sample adventure Corporate Risers.",
    automation: [
      { kind: "poolDice", skill: "grit", d6: 2, d8: 0, when: { manual: true, label: "Strength Boost: Strength Serum taken this Doom Quarter" } },
      { kind: "custom", note: "Until the Doom Clock enters the next quarter, tick the Strength Boost bonus on Grit Checks and add Major Disadvantage to your Smarts Checks in the roll dialog." }
    ]
  },
  {
    id: "necklace-of-anubis", name: "Necklace of Anubis", page: 213, category: "buff",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "passive", skill: "",
    summary: "Anubis' Blessing: while you wear it, enemies have Major Disadvantage on Attack Actions that target you. From the sample adventure Corporate Risers.",
    automation: [
      { kind: "custom", note: "Anubis' Blessing (while worn): any enemy making an Attack Action against you has Major Disadvantage (-1 Talent Die, or -2 Skill Dice if it has no Talent Dice; minimum 1 die). The Director applies it." }
    ]
  },

  // Tool
  {
    id: "grappling-hook", name: "Grappling Hook", page: 157, category: "tool",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "passive", skill: "",
    summary: "Mountaineer: +1 Talent Die when you use the hook to scale difficult terrain or vertical surfaces.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Mountaineer: scaling difficult terrain or a vertical surface with the Grappling Hook" } }
    ]
  },
  {
    id: "hack-tool", name: "Hack-Tool", page: 157, category: "tool",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "passive", skill: "",
    summary: "Hacker: +1 Talent Die when you use the tool to hack or bypass any technology.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Hacker: hacking or bypassing technology with the Hack-Tool" } }
    ]
  },
  {
    id: "spectral-goggles", name: "Spectral Goggles", page: 160, category: "tool",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "passive", skill: "",
    summary: "Ghost Hunter: +1 Talent Die when tracking spirits. Spectre-vision: lets you see Spectral enemies, anything hidden on the astral plane and whatever else is invisible to the naked eye.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Ghost Hunter: tracking a spirit" } },
      { kind: "custom", note: "Spectre-vision: you can see Spectral enemies, things hidden on the astral plane and anything else invisible to the naked eye." }
    ]
  },
  {
    id: "chew-toy", name: "Chew Toy", page: 211, category: "tool",
    consumable: true, quantity: 1, uses: null, doom: 0, action: "interact", skill: "",
    summary: "Go Fetch!: throw it as a distraction. A target Animal within Medium Range (50 ft) must pass a CR 1 Heart Check or spend its next Move Action chasing the toy. From the sample adventure Corporate Risers.",
    automation: [
      { kind: "custom", note: "Pick an Animal within 50 ft. It rolls a CR 1 Heart Check; on a failure the Director spends its next Move Action chasing the toy." }
    ]
  },

  // Curiosity
  {
    id: "amulet-of-osiris", name: "Amulet of Osiris", page: 156, category: "curiosity",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "passive", skill: "",
    summary: "Unlucky: -1 Core Skill Point in Luck while the amulet is in your possession. Spirit Talker: while you wear it, you can see and talk to ghosts and beings on the astral plane.",
    automation: [
      { kind: "skillPoints", skill: "luck", amount: -1 },
      { kind: "custom", note: "Unlucky applies whenever you carry the amulet, worn or not, so keep it equipped on the sheet. Spirit Talker only works while you actually wear it." }
    ]
  },
  {
    id: "cracked-mirror", name: "Cracked Mirror", page: 156, category: "curiosity",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "interact", skill: "",
    summary: "Behind You: the mirror shows invisible and spectral enemies and magically hidden secrets behind you.",
    automation: [
      { kind: "custom", note: "Behind You: when you look into the mirror, the Director reveals any invisible or spectral enemies and magically hidden secrets behind you." }
    ]
  },
  {
    id: "monkeys-paw", name: "Monkey's Paw", page: 158, category: "curiosity",
    consumable: false, quantity: 1, uses: { per: "story", max: 5 }, doom: 5, action: "free", skill: "",
    summary: "Fate Changer: re-roll a Skill Check with +1 Talent Die in your Dice Pool. Each use moves the Doom Clock forward 5 minutes. Limited to 5 uses.",
    automation: [
      { kind: "poolDice", skill: "any", d6: 0, d8: 1, when: { manual: true, label: "Fate Changer: re-rolling with the Monkey's Paw" } },
      { kind: "custom", note: "After a Skill Check, click Use (spends 1 of 5 uses and adds 5 minutes to the Doom Clock), then roll the check again with the Fate Changer bonus ticked." }
    ]
  },
  {
    id: "mysterious-camera", name: "Mysterious Camera", page: 159, category: "curiosity",
    consumable: false, quantity: 1, uses: null, doom: 0, action: "interact", skill: "",
    summary: "Peculiar Photos: its photos capture astral-plane enemies, spirits and secrets the naked eye can't see. Flash Bulb: for an instant everyone can see what the camera sees, and a spirit caught in the flash is Stunned.",
    automation: [
      { kind: "applyStatus", status: "stunned", target: "enemy" },
      { kind: "custom", note: "Flash Bulb: target only spirits caught in the flash before using it; they are Stunned with no check. Clear your targets to just take a photo. The Director describes what the photo reveals." }
    ]
  },
  {
    id: "spectral-board", name: "Spectral Board", page: 159, category: "curiosity",
    consumable: false, quantity: 1, uses: { per: "opdc", max: 1 }, doom: 5, action: "interact", skill: "strange",
    summary: "Spectral Interrogation (OPDC): whoever leads the session rolls their Strange Pool, and each other player taking part may add 1 Skill Die as an assist. Each Strange symbol lets you ask a spirit one question, which it answers. When the ritual ends the Doom Clock moves forward 5 minutes.",
    automation: [
      { kind: "check", skill: "strange", cr: 1, label: "Spectral Interrogation", onSuccess: "Ask the spirits one question for each Strange symbol rolled.", onFail: "No Strange symbols: the spirits answer nothing." },
      { kind: "custom", note: "The leader uses the board and adds 1 Skill Die to the roll for each other player taking part. Each Strange symbol is one question the spirits must answer. The 5 Doom minutes are added when the board is used." }
    ]
  },
  {
    id: "the-skeleton-keys", name: "The Skeleton Keys", page: 160, category: "curiosity",
    consumable: false, quantity: 1, uses: null, doom: 3, action: "interact", skill: "",
    summary: "Master Key: unlocks any door. Cursed: each use moves the Doom Clock forward 3 minutes and makes you Cursed.",
    automation: [
      { kind: "applyStatus", status: "cursed", target: "self" },
      { kind: "custom", note: "Master Key opens any door. While Cursed you can't heal or remove wounds from your Lifeline; the Curse ends only when the Keys are destroyed." }
    ]
  },
  {
    id: "voodoo-doll", name: "Voodoo Doll", page: 160, category: "curiosity",
    consumable: false, quantity: 1, uses: { per: "opdq", max: 1 }, doom: 5, action: "interact", skill: "strange",
    summary: "Cursed: each use moves the Doom Clock forward 5 minutes and makes you Cursed. Pinhead (OPDQ): choose a target and roll a Strange Check. For each Strange symbol, the target takes 2 Sharp damage and must make a Fear Check.",
    automation: [
      { kind: "applyStatus", status: "cursed", target: "self" },
      {
        kind: "check", skill: "strange", cr: 1, label: "Pinhead",
        onSuccess: "For each Strange symbol, the target takes 2 Sharp damage and makes a Fear Check.",
        onFail: "No Strange symbols: the target is unharmed.",
        success: [
          { kind: "damage", amount: 2, type: "sharp", target: "enemy", strike: false }
        ]
      },
      { kind: "custom", note: "Pinhead: target your victim before clicking Roll. A success deals the first 2 Sharp damage to it automatically. Deal 2 more Sharp damage by hand for each further Strange symbol. The target also makes a Fear Check for each Strange symbol (a Strange Check; the Director sets the CR) by hand. While Cursed you can't heal; the Curse ends only when the doll is destroyed." }
    ]
  }
];
