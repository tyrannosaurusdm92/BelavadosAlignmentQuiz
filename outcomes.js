// outcomes.js
// Belavadös Alignment System — Full Outcome Database
// Supports both SHORT + DEEP quiz modes

export const OUTCOMES = [
  // =========================
  // ⚖️ NEUTRAL ALIGNMENTS
  // =========================

  {
    id: "neutral_renegade",
    name: "Neutral Renegade",
    category: "Neutral",
    components: ["Selfish", "Neutral", "Cooperative", "Pragmatic"],
    target: {
      altruism: [600, 1400],
      lawfulness: [1200, 1800],
      cooperation: [1600, 2400],
      honor: [600, 1400],
    },
    simpleDescription:
      "Works with others only when needed 🤝🕶️. Smart, ruthless, and tolerated when useful.",
    deepLore:
      "A Neutral Renegade operates through calculated alliances rather than loyalty. They do not reject cooperation, but they treat it as a tool. Their moral identity is defined by efficiency and survival logic rather than emotional conviction.",
  },

  {
    id: "neutral_drifter",
    name: "Neutral Drifter",
    category: "Neutral",
    components: ["Selfish", "Neutral", "Cooperative", "Neutral"],
    target: {
      altruism: [600, 1400],
      lawfulness: [1200, 1800],
      cooperation: [1600, 2400],
      honor: [1400, 2000],
    },
    simpleDescription:
      "A wanderer who avoids attachment 🌫️🤝 but rarely causes harm.",
    deepLore:
      "Neutral Drifters move through systems without committing to them. They maintain social flexibility and avoid emotional entanglement, existing as observers rather than participants in moral conflict.",
  },

  {
    id: "neutral_champion",
    name: "Neutral Champion",
    category: "Neutral",
    components: ["Selfish", "Neutral", "Cooperative", "Honorable"],
    target: {
      altruism: [600, 1400],
      lawfulness: [1200, 1800],
      cooperation: [1600, 2400],
      honor: [2000, 3000],
    },
    simpleDescription:
      "A hero until the applause fades 🌟🎭.",
    deepLore:
      "Neutral Champions embody conditional heroism. They perform noble acts sincerely, yet their motivation is partially tied to recognition, legacy, or personal validation.",
  },

  {
    id: "true_neutral",
    name: "TRUE NEUTRAL",
    category: "Neutral",
    components: ["Neutral", "Neutral", "Neutral", "Neutral"],
    target: {
      altruism: [1200, 1800],
      lawfulness: [1200, 1800],
      cooperation: [1200, 1800],
      honor: [1200, 1800],
    },
    simpleDescription:
      "The unmoved center 🌀🪨. Balanced, unreadable, and unpredictable.",
    deepLore:
      "True Neutral individuals resist ideological anchoring. They respond to situations rather than beliefs, maintaining equilibrium even under extreme moral pressure.",
  },

  {
    id: "neutral_ethicist",
    name: "Neutral Ethicist",
    category: "Neutral",
    components: ["Neutral", "Neutral", "Neutral", "Honorable"],
    target: {
      altruism: [1200, 1800],
      lawfulness: [1200, 1800],
      cooperation: [1200, 1800],
      honor: [2000, 3000],
    },
    simpleDescription:
      "A quiet moral compass 🧭🌱.",
    deepLore:
      "Neutral Ethicists act according to harm-minimization principles. They do not impose morality but consistently choose paths that reduce suffering.",
  },

  // =========================
  // ⚔️ CHAOTIC ALIGNMENTS
  // =========================

  {
    id: "chaotic_renegade",
    name: "Chaotic Renegade",
    category: "Chaotic",
    components: ["Selfish", "Chaotic", "Cooperative", "Pragmatic"],
    target: {
      altruism: [600, 1400],
      lawfulness: [0, 800],
      cooperation: [1600, 2400],
      honor: [600, 1400],
    },
    simpleDescription:
      "Helps… until it stops being useful 🔥🤝.",
    deepLore:
      "Chaotic Renegades form unstable alliances driven by opportunity rather than loyalty. They are adaptable survivors who resist structure while still engaging socially when beneficial.",
  },

  {
    id: "chaotic_knave",
    name: "Chaotic Knave",
    category: "Chaotic",
    components: ["Selfish", "Chaotic", "Neutral", "Neutral"],
    target: {
      altruism: [600, 1400],
      lawfulness: [0, 800],
      cooperation: [800, 1600],
      honor: [800, 1600],
    },
    simpleDescription:
      "Pure unpredictability 🎲😈.",
    deepLore:
      "Chaotic Knaves operate on impulse, curiosity, and opportunism. They resist planning and ideology, preferring immediate experience over long-term consequence.",
  },

  {
    id: "chaotic_crusader",
    name: "Chaotic Crusader",
    category: "Chaotic",
    components: ["Altruistic", "Chaotic", "Combative", "Honorable"],
    target: {
      altruism: [2000, 3000],
      lawfulness: [0, 800],
      cooperation: [1600, 3000],
      honor: [2000, 3000],
    },
    simpleDescription:
      "A freedom fighter wrapped in fire 🔥🦅.",
    deepLore:
      "Chaotic Crusaders fight for moral conviction rather than law. Their sense of justice is deeply personal and often overrides institutional authority.",
  },

  // =========================
  // 🏛️ LAWFUL ALIGNMENTS
  // =========================

  {
    id: "lawful_strategist",
    name: "Lawful Strategist",
    category: "Lawful",
    components: ["Selfish", "Lawful", "Neutral", "Pragmatic"],
    target: {
      altruism: [600, 1400],
      lawfulness: [2000, 3000],
      cooperation: [800, 1600],
      honor: [800, 1600],
    },
    simpleDescription:
      "A master planner 🎯📊.",
    deepLore:
      "Lawful Strategists operate within systems of structure and foresight. They believe order is the most reliable path to control and success.",
  },

  {
    id: "lawful_guardian",
    name: "Lawful Guardian",
    category: "Lawful",
    components: ["Altruistic", "Lawful", "Cooperative", "Honorable"],
    target: {
      altruism: [2000, 3000],
      lawfulness: [2000, 3000],
      cooperation: [2000, 3000],
      honor: [2000, 3000],
    },
    simpleDescription:
      "The steadfast protector 🛡️🌟.",
    deepLore:
      "Lawful Guardians embody ideal civic virtue. They uphold structure not for control, but for protection and collective stability.",
  },

  {
    id: "lawful_knave",
    name: "Lawful Knave",
    category: "Lawful",
    components: ["Selfish", "Lawful", "Neutral", "Neutral"],
    target: {
      altruism: [600, 1400],
      lawfulness: [2000, 3000],
      cooperation: [800, 1600],
      honor: [800, 1600],
    },
    simpleDescription:
      "Follows rules just enough to survive ⚖️🤏.",
    deepLore:
      "Lawful Knaves exploit systems while maintaining surface-level compliance. They understand structure deeply enough to bend it safely.",
  },

  {
    id: "lawful_crusader",
    name: "Lawful Crusader",
    category: "Lawful",
    components: ["Altruistic", "Lawful", "Combative", "Honorable"],
    target: {
      altruism: [2000, 3000],
      lawfulness: [2000, 3000],
      cooperation: [1600, 3000],
      honor: [2000, 3000],
    },
    simpleDescription:
      "A warrior of duty ⚔️🔥.",
    deepLore:
      "Lawful Crusaders believe justice must be enforced through structured authority. Their morality is inseparable from discipline and order.",
  },

  // =========================
  // DEFAULT FALLBACK (IMPORTANT)
  // =========================

  {
    id: "undefined_alignment",
    name: "Unresolved Identity",
    category: "Undefined",
    components: ["Unknown"],
    target: {
      altruism: [0, 3000],
      lawfulness: [0, 3000],
      cooperation: [0, 3000],
      honor: [0, 3000],
    },
    simpleDescription:
      "Your identity resists classification 🌀.",
    deepLore:
      "Your choices reflect a paradoxical or unstable moral identity that does not cleanly map to any archetype.",
  },
];

// ======================================================
// 🔧 HELPER FUNCTION (USED BY BOTH QUIZ MODES)
// ======================================================

export function getOutcome(scores) {
  const { altruism, lawfulness, cooperation, honor } = scores;

  let bestMatch = null;
  let bestScore = -Infinity;

  for (const outcome of OUTCOMES) {
    const match =
      altruism >= outcome.target.altruism[0] &&
      altruism <= outcome.target.altruism[1] &&
      lawfulness >= outcome.target.lawfulness[0] &&
      lawfulness <= outcome.target.lawfulness[1] &&
      cooperation >= outcome.target.cooperation[0] &&
      cooperation <= outcome.target.cooperation[1] &&
      honor >= outcome.target.honor[0] &&
      honor <= outcome.target.honor[1];

    if (match) return outcome;

    // soft scoring fallback
    const score =
      (1 - Math.abs(altruism - mean(outcome.target.altruism)) / 3000) +
      (1 - Math.abs(lawfulness - mean(outcome.target.lawfulness)) / 3000) +
      (1 - Math.abs(cooperation - mean(outcome.target.cooperation)) / 3000) +
      (1 - Math.abs(honor - mean(outcome.target.honor)) / 3000);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = outcome;
    }
  }

  return bestMatch || OUTCOMES[OUTCOMES.length - 1];
}

function mean([min, max]) {
  return (min + max) / 2;
}
