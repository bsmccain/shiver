// SHIVER Core Rulebook Fatal Flaws (p.79). Each Archetype a character hybridises into costs a unique Fatal Flaw;
// they can also be carried over from earlier stories. randomiser = the Skill Die symbol that picks it at random.
export default [
  {
    id: "ff-scared-stiff", name: "Scared Stiff", page: 79, randomiser: "grit",
    summary: "Gain 2 extra Fears. When either of them makes you Afraid or Terrified, your Speed drops to Slow until you are Stable again.",
    automation: [
      { kind: "custom", note: "Add 2 more Fears to your character." },
      { kind: "custom", note: "When one of those 2 Fears makes you Afraid or Terrified, your Speed is Slow (20 ft) until your Fear Status is Stable again. Set it by hand." }
    ]
  },
  {
    id: "ff-painful-memories", name: "Painful Memories", page: 79, randomiser: "smarts",
    summary: "Each failed Fear Check deals you 1 Soul damage. In Combat, each Combat Round you stay Afraid or Terrified deals you 1 more Soul damage.",
    automation: [
      { kind: "onFearFail", damage: 1, type: "soul" },
      { kind: "roundFearDamage", amount: 1, type: "soul" }
    ]
  },
  {
    id: "ff-easy-target", name: "Easy Target", page: 79, randomiser: "wit",
    summary: "While you are Afraid or Terrified, enemies may make 1 extra attack against you on their Turn.",
    automation: [
      { kind: "custom", note: "Director: while this character is Afraid or Terrified, each enemy may make 1 extra attack against them on its Turn." }
    ]
  },
  {
    id: "ff-scarred", name: "Scarred", page: 79, randomiser: "heart",
    summary: "Take 2 extra Background Flaws of your choice (pp. 80-94).",
    automation: [
      { kind: "custom", note: "Pick 2 more Background Flaws (pp. 80-94) and add them to your character." }
    ]
  },
  {
    id: "ff-the-shakes", name: "The Shakes", page: 79, randomiser: "luck",
    summary: "While Afraid or Terrified, your Wit Dice Pool is cut to just 1 Skill Die.",
    automation: [
      { kind: "poolCap", skill: "wit", d6: 1, total: true, when: { fear: { gte: 1 }, label: "While Afraid or Terrified" } }
    ]
  },
  {
    id: "ff-the-curse", name: "The Curse", page: 79, randomiser: "strange",
    summary: "Every Doom Clock increase you cause is doubled.",
    automation: [
      { kind: "doomModifier", multiplyIncrease: 2 }
    ]
  }
];
