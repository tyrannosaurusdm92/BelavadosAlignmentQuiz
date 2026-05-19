/* =========================================================
   /data/alignments.js
   Belavadös Alignment System
   Full Alignment Dataset
========================================================= */

/* =========================================================
   AXIS DEFINITIONS
========================================================= */

export const AXES = {
  altruism: {
    key: "altruism",
    name: "Altruism",
    low: "Selfish",
    neutral: "Neutral",
    high: "Altruistic",
    min: 0,
    max: 3000,
    neutralPoint: 1500
  },

  lawfulness: {
    key: "lawfulness",
    name: "Lawfulness",
    low: "Chaotic",
    neutral: "Neutral",
    high: "Lawful",
    min: 0,
    max: 3000,
    neutralPoint: 1500
  },

  cooperation: {
    key: "cooperation",
    name: "Cooperation",
    low: "Combative",
    neutral: "Neutral",
    high: "Cooperative",
    min: 0,
    max: 3000,
    neutralPoint: 1500
  },

  honor: {
    key: "honor",
    name: "Honor",
    low: "Pragmatic",
    neutral: "Neutral",
    high: "Honorable",
    min: 0,
    max: 3000,
    neutralPoint: 1500
  }
};

/* =========================================================
   AXIS HELPERS
========================================================= */

export const AXIS_THRESHOLDS = {
  LOW: 1000,
  NEUTRAL_LOW: 1001,
  NEUTRAL_HIGH: 1999,
  HIGH: 2000
};

export function getAxisState(value) {
  if (value <= AXIS_THRESHOLDS.LOW) return "low";
  if (value >= AXIS_THRESHOLDS.HIGH) return "high";
  return "neutral";
}

export function clampAxis(value) {
  return Math.max(0, Math.min(3000, value));
}

/* =========================================================
   ALIGNMENT DATA
========================================================= */

export const ALIGNMENTS = [

  /* ======================================================
     LAWFUL ALIGNMENTS
  ====================================================== */

  {
    id: "lawful-renegade",
    name: "Lawful Renegade",
    category: "Lawful",
    title: "The Calculated Opportunist",
    description:
      "A rebel in legal robes. They bend systems to their advantage while appearing loyal to the structure around them.",
    gradients: ["Selfish", "Lawful", "Cooperative", "Pragmatic"],

    axes: {
      altruism: 700,
      lawfulness: 2400,
      cooperation: 2300,
      honor: 800
    },

    dndEquivalent: "Lawful Evil",

    archetypes: [
      "Corrupt Noble",
      "Political Manipulator",
      "Crime Syndicate Advisor"
    ],

    flavor:
      "Believes rules are tools. Loyalty exists only while useful.",

    color: "#8c4b4b",
    rarity: "Rare"
  },

  {
    id: "lawful-drifter",
    name: "Lawful Drifter",
    category: "Lawful",
    title: "The Wandering Codebearer",
    description:
      "Follows rules enough to survive, but never remains rooted for long.",
    gradients: ["Selfish", "Lawful", "Cooperative", "Neutral"],

    axes: {
      altruism: 900,
      lawfulness: 2200,
      cooperation: 2100,
      honor: 1500
    },

    dndEquivalent: "Lawful Neutral",

    archetypes: [
      "Traveling Mercenary",
      "Exiled Officer",
      "Silent Courier"
    ],

    flavor:
      "Structure gives them stability, but attachment feels dangerous.",

    color: "#6c6a7a",
    rarity: "Common"
  },

  {
    id: "lawful-champion",
    name: "Lawful Champion",
    category: "Lawful",
    title: "The Glorious Protector",
    description:
      "Pursues heroism beneath banners, oaths, and public recognition.",
    gradients: ["Selfish", "Lawful", "Cooperative", "Honorable"],

    axes: {
      altruism: 950,
      lawfulness: 2600,
      cooperation: 2400,
      honor: 2500
    },

    dndEquivalent: "Lawful Neutral",

    archetypes: [
      "Knight Celebrity",
      "Arena Hero",
      "Decorated Commander"
    ],

    flavor:
      "Wants to be remembered as noble, even if pride drives them.",

    color: "#d8b15b",
    rarity: "Uncommon"
  },

  {
    id: "lawful-strategist",
    name: "Lawful Strategist",
    category: "Lawful",
    title: "The Grand Architect",
    description:
      "Everything is calculated. Every alliance, every betrayal, every victory.",
    gradients: ["Selfish", "Lawful", "Neutral", "Pragmatic"],

    axes: {
      altruism: 500,
      lawfulness: 2800,
      cooperation: 1500,
      honor: 700
    },

    dndEquivalent: "Lawful Evil",

    archetypes: [
      "Military Genius",
      "Spymaster",
      "Imperial Chancellor"
    ],

    flavor:
      "Believes emotion weakens leadership and outcomes matter most.",

    color: "#4f6172",
    rarity: "Legendary"
  },

  {
    id: "lawful-knave",
    name: "Lawful Knave",
    category: "Lawful",
    title: "The Legal Survivor",
    description:
      "Lives in the cracks of the system without ever fully breaking it.",
    gradients: ["Selfish", "Lawful", "Neutral", "Neutral"],

    axes: {
      altruism: 800,
      lawfulness: 2100,
      cooperation: 1400,
      honor: 1400
    },

    dndEquivalent: "Lawful Neutral",

    archetypes: [
      "Smuggler",
      "Tax Evader",
      "Fixer"
    ],

    flavor:
      "Avoids consequences through precision, charm, and technical obedience.",

    color: "#7d6f63",
    rarity: "Common"
  },

  {
    id: "lawful-avenger",
    name: "Lawful Avenger",
    category: "Lawful",
    title: "The Wrathblade",
    description:
      "Uses order and discipline to justify deeply personal vengeance.",
    gradients: ["Selfish", "Lawful", "Neutral", "Honorable"],

    axes: {
      altruism: 700,
      lawfulness: 2400,
      cooperation: 1300,
      honor: 2400
    },

    dndEquivalent: "Lawful Neutral",

    archetypes: [
      "Duelist",
      "Vengeful Paladin",
      "Oathbound Hunter"
    ],

    flavor:
      "Justice is personal, sacred, and often merciless.",

    color: "#9b3d3d",
    rarity: "Rare"
  },

  {
    id: "lawful-mercenary",
    name: "Lawful Mercenary",
    category: "Lawful",
    title: "The Contract Blade",
    description:
      "A professional warrior loyal to coin, contract, and discipline.",
    gradients: ["Selfish", "Lawful", "Combative", "Pragmatic"],

    axes: {
      altruism: 500,
      lawfulness: 2600,
      cooperation: 700,
      honor: 700
    },

    dndEquivalent: "Lawful Evil",

    archetypes: [
      "Sellsword Captain",
      "Bodyguard",
      "Bounty Hunter"
    ],

    flavor:
      "Never breaks a contract, but never fights for free.",

    color: "#5d4f4f",
    rarity: "Common"
  },

  {
    id: "lawful-marauder",
    name: "Lawful Marauder",
    category: "Lawful",
    title: "The Disciplined Reaver",
    description:
      "Violence carried out with ruthless order and ambition.",
    gradients: ["Selfish", "Lawful", "Combative", "Neutral"],

    axes: {
      altruism: 400,
      lawfulness: 2400,
      cooperation: 600,
      honor: 1500
    },

    dndEquivalent: "Lawful Evil",

    archetypes: [
      "Conqueror",
      "Warlord",
      "Iron Legionnaire"
    ],

    flavor:
      "Believes strength deserves structure and weakness deserves chains.",

    color: "#703838",
    rarity: "Rare"
  },

  {
    id: "lawful-gladiator",
    name: "Lawful Gladiator",
    category: "Lawful",
    title: "The Ritual Duelist",
    description:
      "Combat is sacred tradition. Victory means nothing without honor.",
    gradients: ["Selfish", "Lawful", "Combative", "Honorable"],

    axes: {
      altruism: 850,
      lawfulness: 2500,
      cooperation: 700,
      honor: 2700
    },

    dndEquivalent: "Lawful Neutral",

    archetypes: [
      "Arena Champion",
      "Ceremonial Warrior",
      "Royal Duelist"
    ],

    flavor:
      "A perfect strike matters more than ideology.",

    color: "#c18c3f",
    rarity: "Uncommon"
  },

  /* ======================================================
     NEUTRAL ALIGNMENTS
  ====================================================== */

  {
    id: "true-neutral",
    name: "TRUE NEUTRAL",
    category: "Neutral",
    title: "The Silent Balance",
    description:
      "Neither ruled by ideology nor consumed by passion.",
    gradients: ["Neutral", "Neutral", "Neutral", "Neutral"],

    axes: {
      altruism: 1500,
      lawfulness: 1500,
      cooperation: 1500,
      honor: 1500
    },

    dndEquivalent: "True Neutral",

    archetypes: [
      "Wanderer",
      "Hermit",
      "Observer"
    ],

    flavor:
      "Exists between extremes, adapting without surrendering identity.",

    color: "#888888",
    rarity: "Mythic"
  },

  {
    id: "neutral-guardian",
    name: "Neutral Guardian",
    category: "Neutral",
    title: "The Gentle Protector",
    description:
      "Protects others quietly and compassionately without seeking recognition.",
    gradients: ["Altruistic", "Neutral", "Cooperative", "Honorable"],

    axes: {
      altruism: 2600,
      lawfulness: 1500,
      cooperation: 2400,
      honor: 2600
    },

    dndEquivalent: "Neutral Good",

    archetypes: [
      "Village Protector",
      "Healer",
      "Caretaker"
    ],

    flavor:
      "Kindness is their instinct, not their performance.",

    color: "#77b8a1",
    rarity: "Rare"
  },

  {
    id: "neutral-vigilante",
    name: "Neutral Vigilante",
    category: "Neutral",
    title: "The Midnight Hunter",
    description:
      "Walks the line between justice and vengeance in defense of the helpless.",
    gradients: ["Altruistic", "Neutral", "Combative", "Neutral"],

    axes: {
      altruism: 2300,
      lawfulness: 1500,
      cooperation: 700,
      honor: 1500
    },

    dndEquivalent: "Neutral Good",

    archetypes: [
      "Masked Avenger",
      "Monster Hunter",
      "Urban Shadow"
    ],

    flavor:
      "Protects people directly rather than trusting institutions.",

    color: "#4d5b74",
    rarity: "Rare"
  },

  {
    id: "neutral-strategist",
    name: "Neutral Strategist",
    category: "Neutral",
    title: "The Outcome Thinker",
    description:
      "Morality matters less than results, leverage, and positioning.",
    gradients: ["Selfish", "Neutral", "Neutral", "Pragmatic"],

    axes: {
      altruism: 600,
      lawfulness: 1500,
      cooperation: 1500,
      honor: 700
    },

    dndEquivalent: "Neutral Evil",

    archetypes: [
      "Information Broker",
      "Advisor",
      "Mastermind"
    ],

    flavor:
      "Views morality as a resource, not a truth.",

    color: "#5a6573",
    rarity: "Legendary"
  },

  {
    id: "neutral-ethicist",
    name: "Neutral Ethicist",
    category: "Neutral",
    title: "The Quiet Conscience",
    description:
      "Chooses the path that causes the least suffering.",
    gradients: ["Neutral", "Neutral", "Neutral", "Honorable"],

    axes: {
      altruism: 1600,
      lawfulness: 1500,
      cooperation: 1500,
      honor: 2400
    },

    dndEquivalent: "True Neutral",

    archetypes: [
      "Scholar",
      "Philosopher",
      "Monastic Teacher"
    ],

    flavor:
      "Believes morality exists in thoughtful restraint.",

    color: "#7ba58b",
    rarity: "Rare"
  },

  {
    id: "neutral-scoundrel",
    name: "Neutral Scoundrel",
    category: "Neutral",
    title: "The Aimless Fighter",
    description:
      "Fights for coin, thrill, pride, or survival without ideological loyalty.",
    gradients: ["Neutral", "Neutral", "Combative", "Neutral"],

    axes: {
      altruism: 1500,
      lawfulness: 1500,
      cooperation: 600,
      honor: 1500
    },

    dndEquivalent: "True Neutral",

    archetypes: [
      "Pit Fighter",
      "Drifter",
      "Tavern Bruiser"
    ],

    flavor:
      "Violence is often simpler than conviction.",

    color: "#8b6d54",
    rarity: "Common"
  },

  /* ======================================================
     CHAOTIC ALIGNMENTS
  ====================================================== */

  {
    id: "chaotic-renegade",
    name: "Chaotic Renegade",
    category: "Chaotic",
    title: "The Rebel Opportunist",
    description:
      "A team-friendly anarchist whose loyalty depends on the moment.",
    gradients: ["Selfish", "Chaotic", "Cooperative", "Pragmatic"],

    axes: {
      altruism: 700,
      lawfulness: 500,
      cooperation: 2200,
      honor: 700
    },

    dndEquivalent: "Chaotic Neutral",

    archetypes: [
      "Revolutionary",
      "Pirate Captain",
      "Smuggler Leader"
    ],

    flavor:
      "Freedom matters more than consistency.",

    color: "#b95c42",
    rarity: "Rare"
  },

  {
    id: "chaotic-knave",
    name: "Chaotic Knave",
    category: "Chaotic",
    title: "The Living Wildcard",
    description:
      "Acts on impulse, chaos, curiosity, or instinct.",
    gradients: ["Selfish", "Chaotic", "Neutral", "Neutral"],

    axes: {
      altruism: 700,
      lawfulness: 300,
      cooperation: 1500,
      honor: 1500
    },

    dndEquivalent: "Chaotic Neutral",

    archetypes: [
      "Trickster",
      "Wild Mage",
      "Street Criminal"
    ],

    flavor:
      "Thrives in unpredictability and rejects expectations.",

    color: "#9054b5",
    rarity: "Common"
  },

  {
    id: "chaotic-avenger",
    name: "Chaotic Avenger",
    category: "Chaotic",
    title: "The Burning Fury",
    description:
      "Justice driven by rage, grief, and deeply personal wounds.",
    gradients: ["Selfish", "Chaotic", "Neutral", "Honorable"],

    axes: {
      altruism: 900,
      lawfulness: 300,
      cooperation: 1200,
      honor: 2400
    },

    dndEquivalent: "Chaotic Neutral",

    archetypes: [
      "Revenant",
      "Vengeful Hero",
      "Broken Paladin"
    ],

    flavor:
      "Will burn entire kingdoms to avenge a single scar.",

    color: "#a62f2f",
    rarity: "Legendary"
  },

  {
    id: "chaotic-marauder",
    name: "Chaotic Marauder",
    category: "Chaotic",
    title: "The Worldbreaker",
    description:
      "Destruction without loyalty, structure, or restraint.",
    gradients: ["Selfish", "Chaotic", "Combative", "Neutral"],

    axes: {
      altruism: 200,
      lawfulness: 100,
      cooperation: 300,
      honor: 1500
    },

    dndEquivalent: "Chaotic Evil",

    archetypes: [
      "Raider",
      "Destroyer",
      "Berserker"
    ],

    flavor:
      "Chaos itself becomes identity.",

    color: "#7a1c1c",
    rarity: "Legendary"
  },

  {
    id: "chaotic-guardian",
    name: "Chaotic Guardian",
    category: "Chaotic",
    title: "The Wildhearted Protector",
    description:
      "Rejects oppressive systems but fiercely protects people.",
    gradients: ["Altruistic", "Chaotic", "Cooperative", "Honorable"],

    axes: {
      altruism: 2600,
      lawfulness: 400,
      cooperation: 2400,
      honor: 2600
    },

    dndEquivalent: "Chaotic Good",

    archetypes: [
      "Freedom Fighter",
      "Outlaw Hero",
      "Rebel Protector"
    ],

    flavor:
      "Laws are optional. Compassion is sacred.",

    color: "#53b87d",
    rarity: "Rare"
  },

  {
    id: "chaotic-crusader",
    name: "Chaotic Crusader",
    category: "Chaotic",
    title: "The Flame of Liberation",
    description:
      "Fights tyranny through passion, disruption, and fearless conviction.",
    gradients: ["Altruistic", "Chaotic", "Combative", "Honorable"],

    axes: {
      altruism: 2600,
      lawfulness: 200,
      cooperation: 700,
      honor: 2600
    },

    dndEquivalent: "Chaotic Good",

    archetypes: [
      "Revolutionary Hero",
      "Liberator",
      "Holy Rebel"
    ],

    flavor:
      "Would rather die free than live obedient.",

    color: "#d05a35",
    rarity: "Legendary"
  }

];

/* =========================================================
   LOOKUP MAP
========================================================= */

export const ALIGNMENT_MAP = {};

ALIGNMENTS.forEach((alignment) => {
  ALIGNMENT_MAP[alignment.id] = alignment;
});

/* =========================================================
   CATEGORY GROUPS
========================================================= */

export const ALIGNMENT_CATEGORIES = {
  lawful: ALIGNMENTS.filter(a => a.category === "Lawful"),
  neutral: ALIGNMENTS.filter(a => a.category === "Neutral"),
  chaotic: ALIGNMENTS.filter(a => a.category === "Chaotic")
};

/* =========================================================
   SHORT QUIZ D&D CONVERSION
========================================================= */

export const DND_ALIGNMENT_MAP = {
  "Lawful Good": [
    "lawful-guardian",
    "lawful-crusader",
    "lawful-sentinel"
  ],

  "Neutral Good": [
    "neutral-guardian",
    "neutral-sentinel",
    "neutral-crusader"
  ],

  "Chaotic Good": [
    "chaotic-guardian",
    "chaotic-crusader",
    "chaotic-sentinel"
  ],

  "Lawful Neutral": [
    "lawful-arbiter",
    "lawful-defender",
    "lawful-strategist"
  ],

  "True Neutral": [
    "true-neutral",
    "neutral-arbiter",
    "neutral-adapter"
  ],

  "Chaotic Neutral": [
    "chaotic-knave",
    "chaotic-drifter",
    "chaotic-renegade"
  ],

  "Lawful Evil": [
    "lawful-mercenary",
    "lawful-renegade",
    "lawful-marauder"
  ],

  "Neutral Evil": [
    "neutral-strategist",
    "neutral-mercenary",
    "neutral-marauder"
  ],

  "Chaotic Evil": [
    "chaotic-marauder",
    "chaotic-mercenary",
    "chaotic-knave"
  ]
};

/* =========================================================
   SCORE PROFILE GENERATOR
========================================================= */

export function generateAlignmentProfile(scores) {
  return {
    altruism: getAxisState(scores.altruism),
    lawfulness: getAxisState(scores.lawfulness),
    cooperation: getAxisState(scores.cooperation),
    honor: getAxisState(scores.honor)
  };
}

/* =========================================================
   ALIGNMENT MATCHER
========================================================= */

export function findClosestAlignment(scores) {
  let closest = null;
  let closestDistance = Infinity;

  ALIGNMENTS.forEach((alignment) => {
    const distance =
      Math.abs(scores.altruism - alignment.axes.altruism) +
      Math.abs(scores.lawfulness - alignment.axes.lawfulness) +
      Math.abs(scores.cooperation - alignment.axes.cooperation) +
      Math.abs(scores.honor - alignment.axes.honor);

    if (distance < closestDistance) {
      closestDistance = distance;
      closest = alignment;
    }
  });

  return closest;
}

/* =========================================================
   RANDOM ALIGNMENT
========================================================= */

export function getRandomAlignment() {
  return ALIGNMENTS[
    Math.floor(Math.random() * ALIGNMENTS.length)
  ];
}

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  AXES,
  ALIGNMENTS,
  ALIGNMENT_MAP,
  ALIGNMENT_CATEGORIES,
  DND_ALIGNMENT_MAP,

  getAxisState,
  generateAlignmentProfile,
  findClosestAlignment,
  getRandomAlignment,
  clampAxis
};
