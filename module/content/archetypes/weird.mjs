export default {
  id: "weird",
  name: "The Weird",
  skill: "strange",
  page: 62,
  hybrid: { skills: ["strange"], count: 1 },
  startingSkills: { grit: [3, 0], wit: [3, 0], smarts: [3, 0], heart: [3, 0], luck: [3, 0], strange: [5, 1] },
  strength: "Start with 1 Talent Point in Strange (+1 Talent Die on every Strange Check). It is already counted in the starting tracker.",
  deficiency: {
    exclude: ["strange"],
    amount: 1,
    text: "Remove 1 Core Skill Point from one Core Skill other than Strange (3 to 2)."
  },
  special: [],
  paths: [
    { id: "eldritch", name: "Eldritch", column: 0 },
    { id: "spiritualist", name: "Spiritualist", column: 1.5 },
    { id: "psionic", name: "Psionic", column: 3 },
    { id: "body-horror", name: "Body Horror", column: 4.5 }
  ],
  nodes: [
    // Tier 1: the Weird has no shared starting ability. The first Ability Point buys the Tier 1 ability of the chosen path (p62).
    {
      id: "weird-madness", name: "Madness", tier: 1, path: "eldritch", column: 0,
      prerequisites: [], prerequisiteMode: "any", kind: "ability",
      page: 63, action: "attack", uses: null, doom: 0,
      summary: "Attack Action against one enemy: Opposed Strange Check vs its Smarts. On a win, roll a Skill Die to set its next Combat Turn: Grit/Wit it attacks another enemy, Smarts/Heart it moves away from you, Luck/Strange it attacks itself. Doom +2 when successful.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Opposed vs the target's Smarts", onSuccess: "Roll a Skill Die for the target's next Combat Turn: Grit/Wit attack another enemy; Smarts/Heart move away from you; Luck/Strange attack itself. Doom +2.", onFail: "No effect.", success: [{ kind: "doom", amount: 2 }] },
        { kind: "custom", note: "Opposed check: target the enemy, then the Director rolls its Smarts and sets the CR so you need more successes. On a win, roll one Skill Die and the Director plays the target's next Combat Turn by the result." }
      ]
    },
    {
      id: "weird-illusionist", name: "Illusionist", tier: 1, path: "spiritualist", column: 1.5,
      prerequisites: [], prerequisiteMode: "any", kind: "ability",
      page: 63, action: "interact", uses: null, doom: 1,
      summary: "Create a small illusion at Long Range (150 ft): a distraction, light, a foul smell or a strange noise. Doom +1 per illusion. A more complex illusion needs a Strange Check at a CR the Director sets.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Complex illusion only (simple illusions need no roll)", onSuccess: "The complex illusion works as described.", onFail: "The complex illusion fails." }
      ]
    },
    {
      id: "weird-telekinesis", name: "Telekinesis", tier: 1, path: "psionic", column: 3,
      prerequisites: [], prerequisiteMode: "any", kind: "ability",
      page: 63, action: "interact", uses: null, doom: 0,
      summary: "Move an object with a Strange Check (CR set by its size); Doom +1 on success. Or, as an Attack Action against a Large or smaller enemy, make an Opposed Strange Check vs its Grit: on a win, move or throw it 30 ft in any direction, dealing falling damage (30 ft = 3 Blunt). Doom +2 on success against an enemy.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Move an object (CR by its size)", onSuccess: "The object moves. Doom +1.", onFail: "Nothing moves.", success: [{ kind: "doom", amount: 1 }] },
        { kind: "check", skill: "strange", cr: null, label: "Move a targeted enemy 30 ft (opposed vs its Grit)", onSuccess: "Move the enemy up to 30 ft in any direction. Doom +2.", onFail: "The enemy doesn't move.", success: [{ kind: "doom", amount: 2 }] },
        { kind: "check", skill: "strange", cr: null, label: "Throw a targeted enemy 30 ft (opposed vs its Grit)", onSuccess: "Throw the enemy 30 ft; it takes 3 Blunt falling damage. Doom +2.", onFail: "The enemy doesn't move.", success: [{ kind: "damage", amount: 3, type: "blunt", target: "enemy", strike: false }, { kind: "doom", amount: 2 }] },
        { kind: "custom", note: "Using it on an enemy (Large or smaller only) takes your Attack Action instead of an Interact Action; the Director rolls the enemy's Grit and sets the CR so you need more successes." }
      ]
    },
    {
      id: "weird-claws", name: "Claws", tier: 1, path: "body-horror", column: 4.5,
      prerequisites: [], prerequisiteMode: "any", kind: "ability",
      page: 63, action: "attack", uses: null, doom: 0,
      summary: "Claw Unarmed Strikes roll Strange instead of the usual skill and deal 3 Pierce. To hide the claws while attacking, pass a CR 1 Wit Check or fight in a way that hides them. Doom +1 per successful claw Strike.",
      attack: { skill: "strange", damage: 3, damageType: "pierce", range: "close", unarmed: true },
      automation: [
        { kind: "onHit", doom: 1, note: "Claws: Doom +1" },
        { kind: "check", skill: "wit", cr: 1, label: "Hide your claws while attacking", onSuccess: "Onlookers don't see the claws.", onFail: "Your claws are seen." },
        { kind: "custom", note: "Use this ability for your Unarmed Strikes (Strange, 3 Pierce, Close) instead of the normal Unarmed Strike. Instead of the Wit Check you can describe fighting in a way that hides the claws." }
      ]
    },

    // Tier 2
    {
      id: "weird-blood-magic", name: "Blood Magic", tier: 2, path: "eldritch", column: 0,
      prerequisites: ["weird-madness"], prerequisiteMode: "any", kind: "ability",
      page: 64, action: "free", uses: null, doom: 0,
      summary: "After a successful Strike you may make a Strange Check with CR equal to the struck enemy's CR. Heal 1 wound per Strange symbol rolled above that CR; Doom +1 per wound healed.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "After a successful Strike (CR = the struck enemy's CR)", onSuccess: "Heal 1 wound per Strange symbol above the enemy's CR; Doom +1 per wound healed.", onFail: "No healing." },
        { kind: "custom", note: "Optional, right after one of your Strikes hits; the Director sets the CR to the struck enemy's CR. Heal yourself 1 wound per Strange symbol above the CR and tick Doom +1 per wound healed, by hand (the amount depends on the margin)." }
      ]
    },
    {
      id: "weird-astral-form", name: "Astral Form", tier: 2, path: "spiritualist", column: 1.5,
      prerequisites: ["weird-illusionist"], prerequisiteMode: "any", kind: "ability",
      page: 64, action: "interact", uses: null, doom: 0,
      summary: "Leave your body as an Astral Form. It passes through solids, can't be seen by normal people or most enemies, moves at your Speed and can't go beyond Long Range (150 ft) of your body. Only astral attackers or Soul-damage Strikes can harm it; your body is left comatose and can't defend itself. Doom +1 per minute in Astral Form. It can move Small objects with a Strange Check (Doom +1 on success) but can't otherwise affect the physical world.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Astral Form moves a Small object", onSuccess: "You move a Small object. Doom +1.", onFail: "The object doesn't move.", success: [{ kind: "doom", amount: 1 }] },
        { kind: "doom", amount: 1, when: { manual: true, label: "Each minute in Astral Form" } },
        { kind: "custom", note: "While projecting: the Astral Form ignores all damage except from astral-plane attackers or Strikes dealing Soul damage, and stays within 150 ft of your body. Your body is comatose and defenceless (unless you have Soul Separation). Tick Doom +1 for every minute spent in Astral Form." }
      ]
    },
    {
      id: "weird-telepathy", name: "Telepathy", tier: 2, path: "psionic", column: 3,
      prerequisites: ["weird-telekinesis"], prerequisiteMode: "any", kind: "ability",
      page: 64, action: "interact", uses: null, doom: 0,
      summary: "Strange Check with CR equal to half the target's Heart Core Skill Points (rounded down). Success: ask 3 questions about its thoughts, Doom +1. Failure: it knows you tried, Doom +3, and later attempts on it use its full Heart Core Skill Points as the CR.",
      automation: [
        { kind: "check", skill: "strange", cr: null, onSuccess: "Ask the Director or player 3 questions about the target's thoughts. Doom +1.", onFail: "The target knows you tried. Doom +3. Future attempts on it use CR = its full Heart Core Skill Points.", success: [{ kind: "doom", amount: 1 }], failure: [{ kind: "doom", amount: 3 }] },
        { kind: "custom", note: "The Director sets the CR to half the target's Heart Core Skill Points, rounded down, or its full Heart if it caught a previous attempt." }
      ]
    },
    {
      id: "weird-natural-affinity", name: "Natural Affinity", tier: 2, path: "body-horror", column: 4.5,
      prerequisites: ["weird-claws"], prerequisiteMode: "any", kind: "ability",
      page: 64, action: "interact", uses: null, doom: 0,
      summary: "Strange Check to make a plant do one thing: grow, restrain an enemy or NPC, move, or whisper its secrets to you. A CR 1 Strange Check lets you talk with animals. Doom +2 per successful use.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Plant: grow, move or whisper its secrets", onSuccess: "The plant does what you asked. Doom +2.", onFail: "No effect.", success: [{ kind: "doom", amount: 2 }] },
        { kind: "check", skill: "strange", cr: null, label: "Plant restrains a targeted enemy or NPC", onSuccess: "The plant restrains the target (Grappled). Doom +2.", onFail: "No effect.", success: [{ kind: "applyStatus", status: "grappled", target: "enemy" }, { kind: "doom", amount: 2 }] },
        { kind: "check", skill: "strange", cr: 1, label: "Talk with animals", onSuccess: "You can communicate with the animal. Doom +2.", onFail: "No effect.", success: [{ kind: "doom", amount: 2 }] }
      ]
    },

    // Tier 3
    {
      id: "weird-mirage", name: "Mirage", tier: 3, path: "eldritch", column: 0,
      prerequisites: ["weird-blood-magic"], prerequisiteMode: "any", kind: "ability",
      page: 64, action: "interact", uses: null, doom: 2,
      summary: "Create one solid-seeming illusion that can affect its surroundings (1 HP, CR 1, no Strikes). In combat, while it is Near you (15 ft), enemies must pass a CR 1 Smarts Check to pick the right target or they attack the Mirage. Doom +2.",
      automation: [
        { kind: "custom", note: "Place a Mirage token (1 HP, CR 1, no Strikes); only one at a time. While it is within 15 ft of you, an enemy choosing a target among you rolls Smarts CR 1 and attacks the Mirage on a failure." }
      ]
    },
    {
      id: "weird-spirit-talker", name: "Spirit Talker", tier: 3, path: "spiritualist", column: 1.5,
      prerequisites: ["weird-astral-form"], prerequisiteMode: "any", kind: "ability",
      page: 64, action: "passive", uses: null, doom: 0, upgrades: "weird-astral-form",
      summary: "While in Astral Form you can communicate with spirits of the dead and with enemies roaming the astral plane. Doom +2 per successful communication.",
      automation: [
        { kind: "doom", amount: 2, when: { manual: true, label: "Successful communication" } },
        { kind: "custom", note: "Only while in Astral Form. The Director decides whether a conversation succeeds; tick Doom +2 each time it does." }
      ]
    },
    {
      id: "weird-future-sight", name: "Future Sight", tier: 3, path: "psionic", column: 3,
      prerequisites: ["weird-telepathy"], prerequisiteMode: "any", kind: "ability",
      page: 64, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "OPDQ. Strange Check to have the Director reveal information about the plot; the more successes, the more is revealed. A successful divination costs Doom +2 and deals 1 Soul damage to you.",
      automation: [
        { kind: "check", skill: "strange", cr: null, onSuccess: "The Director reveals plot information, more for more successes. Doom +2 and you take 1 Soul damage.", onFail: "Nothing is revealed.", success: [{ kind: "doom", amount: 2 }, { kind: "damage", amount: 1, type: "soul", target: "self", strike: false }] }
      ]
    },
    {
      id: "weird-unnatural-strength", name: "Unnatural Strength", tier: 3, path: "body-horror", column: 4,
      prerequisites: ["weird-natural-affinity"], prerequisiteMode: "any", kind: "ability",
      page: 65, action: "interact", uses: null, doom: 2,
      summary: "Gain +2 Talent Dice on your next Grit Check. Doom +2. Then roll your Strange Pool and add Doom +1 per Strange symbol rolled.",
      automation: [
        { kind: "poolDice", skill: "grit", d6: 0, d8: 2, when: { manual: true, label: "First Grit Check after using Unnatural Strength" } },
        { kind: "custom", note: "After using it, roll your Strange Pool (not a check) and tick Doom +1 for every Strange symbol rolled. Tick the +2 Talent Dice only on your next Grit Check." }
      ]
    },
    {
      id: "weird-imitate", name: "Imitate", tier: 3, path: "body-horror", column: 5,
      prerequisites: ["weird-natural-affinity"], prerequisiteMode: "any", kind: "ability",
      page: 65, action: "interact", uses: null, doom: 0,
      summary: "CR 1 Strange Check to shapeshift into an uncanny copy of a person or object; exceeding the CR makes the copy more convincing. Under stress or duress, a Strange Check (CR set by the stress) keeps the form; on a failure you revert.",
      automation: [
        { kind: "check", skill: "strange", cr: 1, label: "Shapeshift", onSuccess: "You take the chosen form; each success above CR 1 makes it more convincing.", onFail: "You fail to change." },
        { kind: "check", skill: "strange", cr: null, label: "Hold the form under stress or duress (CR by the stress)", onSuccess: "You keep your disguise.", onFail: "You revert to your normal form." }
      ]
    },

    // Tier 4
    {
      id: "weird-hallucination", name: "Hallucination", tier: 4, path: "eldritch", column: 0,
      prerequisites: ["weird-mirage"], prerequisiteMode: "any", kind: "ability",
      page: 65, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "OPDQ. Opposed Strange Check against everyone within Near Range (15 ft), allies included. Anyone who doesn't match or beat your roll hallucinates: they can't attack you and may only take Interact or Move Actions. Each may make a CR 2 Strange Check at the start of its Combat Turn to break free. The effect ends if you take damage.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Opposed vs everyone within 15 ft", onSuccess: "Everyone within 15 ft who rolled fewer Strange successes than you hallucinates.", onFail: "Targets who matched or beat your roll are unaffected." },
        { kind: "custom", note: "Everyone within 15 ft (friend or foe) rolls Strange against your result. Hallucinating creatures can't attack you and may only Interact or Move; each rolls Strange CR 2 at the start of its Combat Turn to break free. All of it ends as soon as you take damage." }
      ]
    },
    {
      id: "weird-soul-separation", name: "Soul Separation", tier: 4, path: "spiritualist", column: 1.5,
      prerequisites: ["weird-spirit-talker"], prerequisiteMode: "any", kind: "ability",
      page: 65, action: "passive", uses: null, doom: 0, upgrades: "weird-astral-form",
      summary: "While you are in Astral Form your body doesn't go comatose. It can take Move and Interact Actions but can't speak or Attack.",
      automation: [
        { kind: "custom", note: "While in Astral Form, your body stays active: Move and Interact Actions only, no speech and no Attack Actions." }
      ]
    },
    {
      id: "weird-peculiar-artefact", name: "Peculiar Artefact", tier: 4, path: "psionic", column: 3,
      prerequisites: ["weird-future-sight"], prerequisiteMode: "any", kind: "ability",
      page: 65, action: "attack", uses: null, doom: 0,
      summary: "Attack Action: roll a Skill Die. Grit: gain the Warrior's Tough (when hit, roll a Skill Die; Grit cuts the damage by 1) for the next 3 Combat Rounds. Wit: +1 Move Action this Combat Turn and your next. Smarts: learn an enemy's Weakness or get tactical advice from the Director. Heart: enemies won't target or harm you for 1 Combat Round. Strange: 6 Soul damage to all enemies within Medium Range (50 ft), Doom +5. Luck: choose the effect. Outside combat the Director decides the effect.",
      automation: [
        { kind: "doom", amount: 5, when: { manual: true, label: "Peculiar Artefact Strange result" } },
        { kind: "custom", note: "Roll one Skill Die and apply: Grit - for 3 Combat Rounds, when hit roll a Skill Die and reduce the damage by 1 on Grit. Wit - one extra Move Action this turn and next (the action tracker doesn't count it). Smarts - the Director reveals a Weakness or gives advice. Heart - enemies ignore you for 1 Combat Round. Strange - 6 Soul to every enemy within 50 ft and Doom +5. Luck - pick any of these." }
      ]
    },
    {
      id: "weird-intimidating-visage", name: "Intimidating Visage", tier: 4, path: "body-horror", column: 4.5,
      prerequisites: ["weird-unnatural-strength", "weird-imitate"], prerequisiteMode: "any", kind: "ability",
      page: 65, action: "interact", uses: null, doom: 0,
      summary: "Interact Action: a target enemy makes a CR 2 Fear Check or becomes Afraid.",
      automation: [
        { kind: "applyStatus", status: "afraid", target: "enemy", save: { skill: "strange", cr: 2 }, fear: true },
        { kind: "custom", note: "Target the enemy before using. An enemy that is already Afraid and fails becomes Terrified instead (p96)." }
      ]
    },

    // Tier 5
    {
      id: "weird-core-plus-eldritch", name: "+2 Core Points", tier: 5, path: "eldritch", column: 0,
      prerequisites: ["weird-hallucination"], prerequisiteMode: "any", kind: "bonus",
      page: 65, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. This can qualify you for a hybrid Archetype (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "weird-core-plus-spiritualist", name: "+2 Core Points", tier: 5, path: "spiritualist", column: 1.5,
      prerequisites: ["weird-soul-separation"], prerequisiteMode: "any", kind: "bonus",
      page: 65, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. This can qualify you for a hybrid Archetype (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "weird-core-plus-psionic", name: "+2 Core Points", tier: 5, path: "psionic", column: 3,
      prerequisites: ["weird-peculiar-artefact"], prerequisiteMode: "any", kind: "bonus",
      page: 65, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. This can qualify you for a hybrid Archetype (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },
    {
      id: "weird-core-plus-body-horror", name: "+2 Core Points", tier: 5, path: "body-horror", column: 4.5,
      prerequisites: ["weird-intimidating-visage"], prerequisiteMode: "any", kind: "bonus",
      page: 65, action: "passive", uses: null, doom: 0,
      summary: "Add 2 Core Skill Points to one Core Skill, or 1 to each of two Core Skills. This can qualify you for a hybrid Archetype (p78).",
      automation: [],
      choices: { type: "skillPoints", amount: 2, maxPerSkill: 2 }
    },

    // Tier 6
    {
      id: "weird-ungodly-ritual", name: "Ungodly Ritual", tier: 6, path: "eldritch", column: 0,
      prerequisites: ["weird-core-plus-eldritch"], prerequisiteMode: "any", kind: "ability",
      page: 66, action: "attack", uses: null, doom: 2,
      summary: "Attack Action, Doom +2 every use. Roll a Skill Die. Grit: all enemies within Near Range (15 ft) are knocked Prone and take 3 Blunt. Wit: shadow tendrils Grapple an enemy of your choice, and its checks to break free are opposed by your Strange instead of Grit. Smarts: Opposed Strange vs an enemy's Smarts; on a win it is Immobile and Weakened until your next Combat Turn. Heart: Opposed Strange vs an enemy's Heart; on a win it must obey one command that won't harm itself (1 Combat Round in combat). Strange: the ritual backfires; everyone within Long Range (150 ft), you included, passes a CR 2 Strange Check or takes 3 Soul, and Doom +1 per enemy damaged. Luck: choose the effect.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Smarts result: opposed vs the targeted enemy's Smarts", onSuccess: "The enemy is Immobile and Weakened until your next Combat Turn.", onFail: "No effect.", success: [{ kind: "applyStatus", status: "immobile", target: "enemy", until: "attackerNextTurn" }, { kind: "applyStatus", status: "weakened", target: "enemy", until: "attackerNextTurn" }] },
        { kind: "check", skill: "strange", cr: null, label: "Heart result: opposed vs the targeted enemy's Heart", onSuccess: "The enemy must obey one command that won't harm itself (1 Combat Round in combat).", onFail: "No effect." },
        { kind: "check", skill: "strange", cr: 2, label: "Strange result: resist your own backfire", onSuccess: "You avoid the 3 Soul damage.", onFail: "You take 3 Soul damage.", failure: [{ kind: "damage", amount: 3, type: "soul", target: "self", strike: false }] },
        { kind: "applyStatus", status: "prone", target: "enemy", when: { manual: true, label: "Grit result: every enemy within 15 ft" } },
        { kind: "applyStatus", status: "grappled", target: "enemy", when: { manual: true, label: "Wit result: one enemy of your choice" } },
        { kind: "doom", amount: 1, when: { manual: true, label: "Strange result: per enemy damaged" } },
        { kind: "custom", note: "Roll one Skill Die after using it. Grit: Prone + 3 Blunt to every enemy within 15 ft (apply the damage by hand). Wit: Grapple one enemy; to break free it opposes your Strange. Smarts/Heart: the Director rolls the enemy's skill and sets the CR so you need more successes. Strange: everyone else within 150 ft also rolls Strange CR 2 or takes 3 Soul; Doom +1 per enemy damaged. Luck: pick the result." }
      ]
    },
    {
      id: "weird-doppelganger", name: "Doppelgänger", tier: 6, path: "spiritualist", column: 1.5,
      prerequisites: ["weird-core-plus-spiritualist"], prerequisiteMode: "any", kind: "ability",
      page: 66, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "OPDQ. CR 2 Strange Check to create one physical copy of yourself that you control as a companion. The copy has CR 1 and half your current HP, does half damage, wears no armour and has no abilities. Creating it costs Doom +3.",
      automation: [
        { kind: "check", skill: "strange", cr: 2, onSuccess: "Your Doppelgänger appears. Doom +3.", onFail: "No copy appears.", success: [{ kind: "doom", amount: 3 }] },
        { kind: "custom", note: "Doppelgänger companion: half your current HP, CR 1, half damage, no armour, no abilities. You control it like a companion." }
      ]
    },
    {
      id: "weird-psi-blast", name: "Psi Blast", tier: 6, path: "psionic", column: 3,
      prerequisites: ["weird-core-plus-psionic"], prerequisiteMode: "any", kind: "ability",
      page: 66, action: "attack", uses: null, doom: 0,
      summary: "Make a Strike against an enemy using Strange. On a hit, a psychic blast deals 3 Blunt to all enemies within Medium Range (50 ft), and each must pass a CR 2 Strange Check or become Afraid. Doom +2 per enemy hit.",
      attack: { skill: "strange", damage: 3, damageType: "blunt", range: "medium", ranged: true },
      automation: [
        { kind: "onHit", status: "afraid", save: { skill: "strange", cr: 2 } },
        { kind: "onHit", doom: 2, note: "Psi Blast: Doom +2" },
        { kind: "applyStatus", status: "afraid", target: "enemy", save: { skill: "strange", cr: 2 }, when: { manual: true, label: "Blast: every other enemy within 50 ft" } },
        { kind: "doom", amount: 2, when: { manual: true, label: "Blast: each other enemy hit" } },
        { kind: "custom", note: "Target only the enemy you Strike. If it hits, every other enemy within 50 ft is caught in the blast whatever its CR: apply 3 Blunt to each by hand, then post this ability to chat and target them. Click its Afraid button once (every targeted enemy rolls Strange CR 2) and its Doom button once per enemy." }
      ]
    },
    {
      id: "weird-hungry", name: "Hungry", tier: 6, path: "body-horror", column: 4.5,
      prerequisites: ["weird-core-plus-body-horror"], prerequisiteMode: "any", kind: "ability",
      page: 66, action: "attack", uses: null, doom: 2,
      summary: "Attack Action: an Unarmed Strike against an enemy that deals 2 Sharp and heals you 2 wounds. Each use costs Doom +2, and allies who can see you must pass a CR 1 Strange Check or become Afraid. OPDQ: feed on a dead enemy to heal 4 wounds.",
      attack: { skill: "grit", damage: 2, damageType: "sharp", range: "close", unarmed: true },
      automation: [
        { kind: "onHit", heal: 2 },
        { kind: "applyStatus", status: "afraid", target: "ally", save: { skill: "strange", cr: 1 }, when: { manual: true, label: "Each use: every ally who can see you" } },
        { kind: "heal", amount: 4, target: "self", when: { manual: true, label: "Feed on a dead enemy (OPDQ)" } },
        { kind: "custom", note: "After each use, every ally who can see you rolls Strange CR 1 or becomes Afraid (post this ability to chat, target them and use its Afraid button). Once per Doom Quarter you may instead feed on a dead enemy (no Strike) to heal 4 wounds; track that use yourself." }
      ]
    },

    // Tier 7
    {
      id: "weird-beguiler", name: "Beguiler", tier: 7, path: "eldritch", column: 0,
      prerequisites: ["weird-ungodly-ritual"], prerequisiteMode: "any", kind: "ability",
      page: 67, action: "attack", uses: null, doom: 0,
      summary: "Attack Action: Opposed Strange Check vs an enemy's Heart, adding its CR to its successes. On a win it is Beguiled and you control it as a companion. At the start of each of its Combat Turns it makes a Strange Check with CR equal to your successes; success ends the effect. Only one enemy can be Beguiled at a time. Doom +3 on success.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Opposed vs the targeted enemy's Heart + its CR", onSuccess: "The enemy is Beguiled and acts as your companion. Note your successes: that is its CR to break free. Doom +3.", onFail: "No effect.", success: [{ kind: "applyStatus", status: "beguiled", target: "enemy" }, { kind: "doom", amount: 3 }] },
        { kind: "custom", note: "The Director rolls the enemy's Heart, adds its CR to its successes, and sets the CR so you need more. At the start of each of its Combat Turns it rolls Strange against your success count and breaks free on a success. Only one Beguiled enemy at a time." }
      ]
    },
    {
      id: "weird-ghost-whisperer", name: "Ghost Whisperer", tier: 7, path: "spiritualist", column: 1,
      prerequisites: ["weird-doppelganger"], prerequisiteMode: "any", kind: "ability",
      page: 67, action: "interact", uses: null, doom: 0,
      summary: "Strange Check against a Ghost's CR (p182) to convince it to help you. On a success it acts as your companion for the Combat Encounter. Doom +3 per Combat Round the Ghost is present.",
      automation: [
        { kind: "check", skill: "strange", cr: 1, onSuccess: "The Ghost is your companion for the rest of the Combat Encounter.", onFail: "The Ghost won't help." },
        { kind: "doom", amount: 3, when: { manual: true, label: "Each Combat Round the Ghost is with you" } },
        { kind: "custom", note: "A Ghost must be present (standard Ghost p182: CR 1, 16 HP; change the CR for other ghosts). Tick Doom +3 every Combat Round it stays." }
      ]
    },
    {
      id: "weird-poltergeist", name: "Poltergeist", tier: 7, path: "spiritualist", column: 2,
      prerequisites: ["weird-doppelganger"], prerequisiteMode: "any", kind: "ability",
      page: 67, action: "interact", uses: null, doom: 0, upgrades: "weird-astral-form",
      summary: "While in Astral Form you can move items (Strange Check, CR set by the item's size) and throw them at enemies (Strange Check vs the enemy's CR). As an Attack Action you can crash into an enemy with a Strange Check vs its CR to knock it Prone.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Move an item (CR by its size)", onSuccess: "The item moves.", onFail: "The item doesn't move." },
        { kind: "check", skill: "strange", cr: null, label: "Throw an item at a targeted enemy (CR = its CR)", onSuccess: "The item hits; the Director sets the damage.", onFail: "The throw misses." },
        { kind: "check", skill: "strange", cr: null, label: "Crash into a targeted enemy (Attack Action; CR = its CR)", onSuccess: "The enemy is knocked Prone.", onFail: "No effect.", success: [{ kind: "applyStatus", status: "prone", target: "enemy" }] },
        { kind: "custom", note: "Only while in Astral Form. The Director sets each CR: by size for an item, or the enemy's CR for a throw or crash. Crashing takes an Attack Action instead of an Interact Action. Thrown-item damage isn't given." }
      ]
    },
    {
      id: "weird-levitation", name: "Levitation", tier: 7, path: "psionic", column: 3,
      prerequisites: ["weird-psi-blast"], prerequisiteMode: "any", kind: "ability",
      page: 67, action: "interact", uses: null, doom: 0,
      summary: "Interact Action: start levitating up to a height equal to your Move Distance. Doom +2 for every Combat Round you are airborne. Outside combat, Doom +1, with more at the Director's discretion if the flight is sustained.",
      automation: [
        { kind: "doom", amount: 2, when: { manual: true, label: "Each Combat Round airborne" } },
        { kind: "doom", amount: 1, when: { manual: true, label: "Used outside a Combat Encounter" } },
        { kind: "custom", note: "Maximum height = your Move Distance. In combat tick Doom +2 each round you stay airborne; outside combat tick Doom +1, more if the Director rules the flight is sustained." }
      ]
    },
    {
      id: "weird-blood-lust", name: "Blood Lust", tier: 7, path: "body-horror", column: 4.5,
      prerequisites: ["weird-hungry"], prerequisiteMode: "any", kind: "ability",
      page: 67, action: "passive", uses: null, doom: 0,
      summary: "When you damage an enemy without killing it, you must target only that enemy until it dies, chasing it if it Escapes. Your Strikes against it deal double damage, and each successful Strike during Blood Lust costs Doom +1. You may roll Smarts CR 1 at the start of each of your Combat Turns to end it.",
      automation: [
        { kind: "strikeMode", label: "Blood Lust", damageMultiplier: 2, onHit: [{ kind: "onHit", doom: 1, note: "Blood Lust: Doom +1" }] },
        { kind: "check", skill: "smarts", cr: 1, label: "Start of your Combat Turn: break out of Blood Lust", onSuccess: "You break out of Blood Lust.", onFail: "You stay in Blood Lust." },
        { kind: "custom", note: "Mandatory: damaging an enemy that survives starts Blood Lust against it. Pick the Blood Lust mode for weapon Strikes against that enemy (double damage, Doom +1 per hit); apply the same to ability Strikes by hand." }
      ]
    },

    // Tier 8
    {
      id: "weird-strange-tp-eldritch", name: "+1 Strange TP", tier: 8, path: "eldritch", column: 0,
      prerequisites: ["weird-beguiler"], prerequisiteMode: "any", kind: "bonus",
      page: 67, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Strange.",
      automation: [{ kind: "talentPoints", skill: "strange", amount: 1 }]
    },
    {
      id: "weird-strange-tp-spiritualist", name: "+1 Strange TP", tier: 8, path: "spiritualist", column: 1.5,
      prerequisites: ["weird-ghost-whisperer", "weird-poltergeist"], prerequisiteMode: "any", kind: "bonus",
      page: 67, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Strange.",
      automation: [{ kind: "talentPoints", skill: "strange", amount: 1 }]
    },
    {
      id: "weird-strange-tp-psionic", name: "+1 Strange TP", tier: 8, path: "psionic", column: 3,
      prerequisites: ["weird-levitation"], prerequisiteMode: "any", kind: "bonus",
      page: 67, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Strange.",
      automation: [{ kind: "talentPoints", skill: "strange", amount: 1 }]
    },
    {
      id: "weird-strange-tp-body-horror", name: "+1 Strange TP", tier: 8, path: "body-horror", column: 4.5,
      prerequisites: ["weird-blood-lust"], prerequisiteMode: "any", kind: "bonus",
      page: 67, action: "passive", uses: null, doom: 0,
      summary: "+1 Talent Point in Strange.",
      automation: [{ kind: "talentPoints", skill: "strange", amount: 1 }]
    },

    // Tier 9
    {
      id: "weird-necromancer", name: "Necromancer", tier: 9, path: "eldritch", column: 0,
      prerequisites: ["weird-strange-tp-eldritch"], prerequisiteMode: "any", kind: "ability",
      page: 68, action: "interact", uses: null, doom: 3,
      summary: "Strange Check with CR equal to a dead target's CR. Matching the CR revives it briefly (3 Combat Rounds in combat): it can move and attack but has little or no mind. Exceeding the CR makes it closer to its living self, depending on the margin. Doom +3.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "CR = the dead target's CR", onSuccess: "The target rises (3 Combat Rounds in combat), mobile and able to attack; the Director decides how much each success above its CR restores of its living self.", onFail: "The target stays dead." }
      ]
    },
    {
      id: "weird-possession", name: "Possession", tier: 9, path: "spiritualist", column: 1.5,
      prerequisites: ["weird-strange-tp-spiritualist"], prerequisiteMode: "any", kind: "ability",
      page: 68, action: "interact", uses: null, doom: 4, upgrades: "weird-astral-form",
      summary: "Use your Astral Form to possess a living or dead enemy or ally. Conscious target: Opposed Strange vs its Smarts; on a win you control its actions and have all its abilities and attributes, and on each of its Combat Turns it repeats the contest, forcing you out if it wins. Dead enemy: CR 1 Strange Check; it returns with half its Health Points as your puppet. Doom +4.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Conscious target: opposed vs its Smarts", onSuccess: "You possess the target and control its actions, abilities and attributes.", onFail: "The possession fails." },
        { kind: "check", skill: "strange", cr: 1, label: "Dead enemy", onSuccess: "It rises with half its Health Points as your puppet.", onFail: "The possession fails." },
        { kind: "custom", note: "Requires Astral Form. Conscious target: the Director rolls its Smarts and sets the CR so you need more successes; it repeats the contest on each of its Combat Turns and throws you out if it wins." }
      ]
    },
    {
      id: "weird-bullet-time", name: "Bullet Time", tier: 9, path: "psionic", column: 3,
      prerequisites: ["weird-strange-tp-psionic"], prerequisiteMode: "any", kind: "ability",
      page: 68, action: "reaction", uses: null, doom: 3,
      summary: "When targeted by a Strike that fires projectiles, make a Strange Check with CR equal to the attacker's CR. Match the CR: take half damage (rounded down). Exceed it by 1: take no damage. Exceed it by 2 or more: take no damage and the attacker takes half the attack's damage. Doom +3.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "CR = the attacker's CR", onSuccess: "Exactly the CR: half damage (rounded down). CR +1: no damage. CR +2 or more: no damage and the attacker takes half the attack's damage.", onFail: "You take the full damage." },
        { kind: "custom", note: "Use when a projectile Strike targets you, before damage is applied; adjust the damage by hand from your margin over the CR." }
      ]
    },
    {
      id: "weird-freakish-agility", name: "Freakish Agility", tier: 9, path: "body-horror", column: 4.5,
      prerequisites: ["weird-strange-tp-body-horror"], prerequisiteMode: "any", kind: "ability",
      page: 68, action: "interact", uses: null, doom: 4,
      summary: "Until your next Combat Turn: Fast Speed and +1 Wit Talent Point. Doom +4.",
      automation: [
        { kind: "poolDice", skill: "wit", d6: 0, d8: 1, when: { manual: true, label: "Freakish Agility active (until your next Combat Turn)" } },
        { kind: "custom", note: "Until the start of your next Combat Turn your Speed is Fast (40 ft); set it by hand." }
      ]
    },

    // Tier 10
    {
      id: "weird-eldritch-entity", name: "Eldritch Entity", tier: 10, path: "eldritch", column: 0,
      prerequisites: ["weird-necromancer"], prerequisiteMode: "any", kind: "ability",
      page: 68, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "OPDQ. CR 2 Strange Check to summon an Abomination (p180), Night Gaunt (p181) or Shoggoth (p181) under your control; it takes its Combat Turn right after yours. At the start of each Combat Round, a CR 2 Strange Check keeps it on this plane. At the end of each Combat Round, Doom rises by the number of rounds it has been present (+1, then +2, and so on).",
      automation: [
        { kind: "check", skill: "strange", cr: 2, label: "Summon the entity", onSuccess: "The entity arrives under your control and acts right after you.", onFail: "Nothing answers." },
        { kind: "check", skill: "strange", cr: 2, label: "Start of each Combat Round: keep the entity on this plane", onSuccess: "The entity stays.", onFail: "The entity leaves." },
        { kind: "custom", note: "At the end of round N with the entity present, tick Doom +N (1, 2, 3...)." }
      ]
    },
    {
      id: "weird-ethereal-legion", name: "Ethereal Legion", tier: 10, path: "spiritualist", column: 1.5,
      prerequisites: ["weird-possession"], prerequisiteMode: "any", kind: "ability",
      page: 69, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "OPDQ. Create up to 5 fragile illusions. An enemy attacking you must pass a CR 2 Smarts Check or it targets an illusion instead; one successful attack disperses an illusion. With Doppelgänger you may instead have up to 3 Doppelgängers and can move your consciousness into one when you die. Doom +1 per illusion created.",
      automation: [
        { kind: "doom", amount: 1, when: { manual: true, label: "Per illusion created (up to 5)" } },
        { kind: "custom", note: "Track the illusions (max 5). Each enemy attacking you rolls Smarts CR 2 and hits an illusion on a failure, dispersing it. Doom +1 per illusion. Doppelgänger option: up to 3 Doppelgängers instead, and on death you may move into one." }
      ]
    },
    {
      id: "weird-quit-hitting-yourself", name: "Quit Hitting Yourself", tier: 10, path: "psionic", column: 3,
      prerequisites: ["weird-bullet-time"], prerequisiteMode: "any", kind: "ability",
      page: 69, action: "attack", uses: null, doom: 3,
      summary: "Opposed Strange vs Grit against an enemy within Medium Range (50 ft). On a win, that enemy makes a Strike against itself or another enemy (your choice) with any weapon it is using or any ability it has. Doom +3.",
      automation: [
        { kind: "check", skill: "strange", cr: null, label: "Opposed vs the targeted enemy's Grit", onSuccess: "The enemy Strikes itself or another enemy of your choice with one of its weapons or abilities.", onFail: "No effect." },
        { kind: "custom", note: "The Director rolls the enemy's Grit and sets the CR so you need more successes. On a win, the Director makes the enemy's Strike against the target you choose." }
      ]
    },
    {
      id: "weird-beast-mode", name: "Beast Mode", tier: 10, path: "body-horror", column: 4.5,
      prerequisites: ["weird-freakish-agility"], prerequisiteMode: "any", kind: "ability",
      page: 70, action: "interact", uses: { per: "opdq", max: 1 }, doom: 0,
      summary: "OPDQ (the Director may swap this for another limit, such as moonlight only or a Doom Clock milestone). Transform into a creature that fits your character and use its profile: Dryad (p172), Kitsune (p173), Werewolf (p173) or a custom creature agreed with the Director. Doom +2 for each full Combat Turn you spend transformed.",
      automation: [
        { kind: "doom", amount: 2, when: { manual: true, label: "Each full Combat Turn transformed" } },
        { kind: "custom", note: "Use the chosen creature's profile while transformed. Tick Doom +2 at the end of each full Combat Turn you spend as the creature." }
      ]
    }
  ],
  discrepancies: [
    "Text and the p71 diagram agree on every node's path. The diagram's hidden text layer has a stale '+1 STRANGE AD'; followed the visible '+1 Strange TP' and p67 (Talent Point).",
    "Tier 1: the first Ability Point buys the Tier 1 ability of one chosen path (p62). The tree has no lines between paths, and the book doesn't say whether another path's Tier 1 can be bought later, so all four Tier 1 nodes have no prerequisites.",
    "Two merges (Unnatural Strength/Imitate into Intimidating Visage; Ghost Whisperer/Poltergeist into the Spiritualist Tier 8) use 'any': p30 only requires the connected ability below.",
    "Doom tied to a check's result ticks when the check resolves (Madness, Telekinesis, Telepathy +1/+3, Natural Affinity, Astral Form's object, Future Sight, Doppelgänger, Beguiler). Doom with no check or a variable amount (Spirit Talker, Blood Magic, Peculiar Artefact's Strange result, Ungodly Ritual's per-enemy Doom, Psi Blast's other enemies, Ethereal Legion's per-illusion Doom) or tied to time (Astral Form, Ghost Whisperer, Levitation, Eldritch Entity, Beast Mode) is a manual button or reminder.",
    "Opposed checks (Madness, Telekinesis on an enemy, Ungodly Ritual Smarts/Heart, Beguiler, Possession, Quit Hitting Yourself, Hallucination) roll with no CR; the Director sets the CR from the opposing roll, and success effects then apply to the tokens targeted when rolling.",
    "Natural Affinity's plant 'restrain' names no status; Grappled is applied (as for the Restrain weapon property). Telekinesis's throw check applies 3 Blunt (not a Strike) for the 30 ft the book gives. If the Director allows a shorter throw, apply Fall Damage by hand at 1 Blunt per 10 ft (p221).",
    "Peculiar Artefact's Wit result (+1 Move Action this turn and next) is a reminder only: an extraActions rule would raise the tracker's Move allowance on every turn.",
    "Necromancer, Possession, Bullet Time and Quit Hitting Yourself state their Doom after the success text without saying 'when successful'; it is charged on every use. Possession's Doom +4 sits in the dead-target paragraph but is applied to all possessions.",
    "Eldritch Entity Doom is read as escalating (+1 after round 1, +2 after round 2, ...). '1 minute for one round, 2 for two' could also be running totals (a flat +1 per round).",
    "Immobile (Ungodly Ritual, Smarts result) isn't in the status glossary (p219); the system's Immobile status (no Move Actions) is used. 'Until your next Combat Turn' is read as the caster's turn: Immobile and Weakened expire when the Weird's next Combat Turn starts.",
    "Hungry doesn't name its Unarmed Strike's skill (Grit used, as for a normal Unarmed Strike; Strange may be intended with Claws) or say whether the heal needs a hit (applied on a hit). Its ally check is a Strange Check, not called a Fear Check.",
    "Psi Blast: the Strike's range isn't given (Medium used, matching the blast, and treated as a ranged attack). Whether the blast can crit isn't stated.",
    "Blood Lust doesn't say whether its double damage stacks with Critical Hit multipliers.",
    "Telepathy's CR (half the target's Heart, rounded down) can be 0; CR 1 is probably the intended minimum.",
    "Most Weird abilities give no action cost. Interact is assumed (p22), Attack for Quit Hitting Yourself (it makes an enemy Strike), Reaction for Bullet Time, and Free for Blood Magic (an optional follow-up to a successful Strike)."
  ]
};
