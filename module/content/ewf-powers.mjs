export default [
  {
    id: "ewf-earth-spike", name: "Earth Spike", page: 95, skill: "grit",
    action: "attack", uses: { per: "opdq", max: 1 }, doom: 0,
    summary: "Once per Doom Quarter, every enemy within Near Range (15 ft) makes a CR 2 Wit Check. Each one that fails takes 5 Pierce damage and is knocked Prone and Maimed.",
    automation: [
      { kind: "applyStatus", status: "prone", target: "enemy", save: { skill: "wit", cr: 2 } },
      { kind: "applyStatus", status: "maimed", target: "enemy", when: { manual: true, label: "Enemies that failed the CR 2 Wit Check" } },
      { kind: "custom", note: "Target every enemy within Near Range (15 ft), then Use: each rolls the CR 2 Wit Check and is knocked Prone if it fails. Then target only the enemies that failed and click the Maimed button on the card. Each of them also takes 5 Pierce damage (Pierce skips armour rolls), applied by hand. No effect is given for a successful check." }
    ]
  },
  {
    id: "ewf-wind-walker", name: "Wind Walker", page: 95, skill: "wit",
    action: "move", uses: { per: "opdq", max: 1 }, doom: 0,
    summary: "Once per Doom Quarter, use a Move Action to teleport up to 60 ft. Every enemy within 5 ft of where you started or where you arrive is knocked Prone.",
    automation: [
      { kind: "applyStatus", status: "prone", target: "enemy" },
      { kind: "custom", note: "Target the enemies within 5 ft of your starting point and of your destination, then Use to knock them Prone (no save). Move your token up to 60 ft." }
    ]
  },
  {
    id: "ewf-lightning-arc", name: "Lightning Arc", page: 95, skill: "smarts",
    action: "attack", uses: { per: "opdq", max: 1 }, doom: 0,
    summary: "Once per Doom Quarter, use an Attack Action to Strike for 5 Shock damage at Medium Range (50 ft). If you hit and another enemy is within 20 ft, roll a CR 1 Smarts Check; on success the lightning chains to that enemy and damages it too. The chain can reach up to 5 more enemies.",
    automation: [
      { kind: "onHit", note: "Lightning Arc: if another enemy is within 20 ft, post the power to chat (speech-bubble icon), target that enemy and click the CR 1 Smarts roll button to chain to it." },
      {
        kind: "check", skill: "smarts", cr: 1, label: "Chain to the next enemy",
        onSuccess: "The targeted enemy takes 5 Shock damage (Grit CR 1 or Stunned); the arc can jump again from it.",
        onFail: "The chain stops.",
        success: [
          { kind: "damage", amount: 5, type: "shock", target: "enemy", strike: true },
          { kind: "applyStatus", status: "stunned", target: "enemy", save: { skill: "grit", cr: 1 } }
        ]
      },
      { kind: "custom", note: "Chain: after a hit, post this power to chat (speech-bubble icon), target one more enemy within 20 ft of the last one hit and click the Smarts roll button. Repeat for each jump, up to 5 extra enemies; the chain roll doesn't spend the power's use." }
    ],
    attack: { skill: "smarts", damage: 5, damageType: "shock", range: "medium", ranged: true }
  },
  {
    id: "ewf-pyrokinesis", name: "Pyrokinesis", page: 95, skill: "heart",
    action: "attack", uses: { per: "opdq", max: 1 }, doom: 0,
    summary: "You can control fire: put out flames, produce a small flame, make a burning source burn harder, or anything else the Director allows. Once per Doom Quarter, use an Attack Action to hurl a fireball: 3 Fire damage, Long Range (150 ft).",
    automation: [
      { kind: "custom", note: "Fire control has no stated use limit or action cost; the Director rules on each use. Rolling this power makes the once-per-Doom-Quarter fireball Strike." }
    ],
    attack: { skill: "heart", damage: 3, damageType: "fire", range: "long", ranged: true }
  },
  {
    id: "ewf-regenerate", name: "Regenerate", page: 95, skill: "luck",
    action: "passive", uses: null, doom: 0,
    summary: "When you roll 3 Luck symbols on a Death's Door Check, you regenerate: you regain consciousness and heal 4 wounds.",
    automation: [
      { kind: "deathsDoorRegenerate", luck: 3, heal: 4 }
    ]
  },
  {
    id: "ewf-decay", name: "Decay", page: 95, skill: "strange",
    action: "attack", uses: { per: "opdq", max: 1 }, doom: 0,
    summary: "Once per Doom Quarter, use an Attack Action to drain an enemy within Near Range (15 ft): it takes 6 Soul damage and you heal 3 wounds.",
    automation: [
      { kind: "onHit", heal: 3 }
    ],
    attack: { skill: "strange", damage: 6, damageType: "soul", range: "near" }
  }
];
