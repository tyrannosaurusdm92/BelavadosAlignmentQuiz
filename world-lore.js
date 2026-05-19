// world-lore.js
// Belavadös Alignment System - Core Lore + UI Data Layer
// Dark fantasy steampunk alignment quiz support file

export const WORLD_LORE = {
  systemName: "Belavadös Alignment System",

  theme: {
    style: "dark-fantasy-steampunk",
    tone: "philosophical, immersive, morally complex",
    uiNotes:
      "No images or audio assumed. Use typography, spacing, and structured cards for immersion."
  },

  modes: {
    short: {
      name: "Quick Alignment Scan",
      description:
        "Select your class and familiar D&D 5e alignment. The system infers your Belavadös profile.",
      questionCount: "low",
      focus: "archetype mapping + fast classification"
    },

    deep: {
      name: "Belavadös Cognitive Alignment Evaluation",
      description:
        "A full philosophical breakdown across four moral axes: Altruism, Lawfulness, Cooperation, and Honor.",
      questionCount: "high",
      focus: "psychological modeling + identity evolution"
    }
  },

  axes: {
    altruism: {
      name: "Altruism",
      range: [0, 3000],
      midpoint: 1500,
      description:
        "Measures compassion, empathy, generosity, sacrifice, and concern for others.",
      lowLabel: "Self-interested / detached",
      highLabel: "Self-sacrificing / protective"
    },

    lawfulness: {
      name: "Lawfulness",
      range: [0, 3000],
      midpoint: 1500,
      description:
        "Measures relationship with structure, authority, rules, discipline, and systems.",
      lowLabel: "Chaotic / independent",
      highLabel: "Structured / ordered"
    },

    cooperation: {
      name: "Cooperation",
      range: [0, 3000],
      midpoint: 1500,
      description:
        "Measures teamwork, loyalty, social bonding, and group dependency vs independence.",
      lowLabel: "Solitary / autonomous",
      highLabel: "Collaborative / bonded"
    },

    honor: {
      name: "Honor",
      range: [0, 3000],
      midpoint: 1500,
      description:
        "Measures integrity, honesty, accountability, restraint, and personal ethics under pressure.",
      lowLabel: "Pragmatic / manipulative",
      highLabel: "Principled / accountable"
    }
  },

  // Used by scoring.js + result rendering fallback text
  alignmentSystemRules: {
    summary:
      "Alignment is not static. It is a shifting psychological profile influenced by decisions, trauma, loyalty, and ideology.",
    keyPrinciple:
      "No alignment is fixed; all identities are emergent behavioral patterns.",
    interpretation:
      "Results should be treated as narrative archetypes, not rigid moral labels."
  },

  classPhilosophyHint: {
    barbarian:
      "Instinct, survival, emotional intensity, and freedom through force.",
    bard:
      "Social adaptation, emotional intelligence, persuasion, identity performance.",
    cleric:
      "Divine ideology shaping morality, duty, and moral conviction.",
    druid:
      "Natural balance, equilibrium, transformation, and ecological morality.",
    fighter:
      "Martial identity shaped by discipline, training, and personal code.",
    monk:
      "Self-mastery, restraint, internal discipline, philosophical control.",
    paladin:
      "Oath-bound morality where conviction defines reality.",
    ranger:
      "Independence balanced with protection and survival instinct.",
    rogue:
      "Survival ethics, opportunism, secrecy, and personal code.",
    sorcerer:
      "Instinctual power and emotional magic expression.",
    warlock:
      "Morality shaped by external patron influence and compromise.",
    wizard:
      "Structured intellect, study, discipline, and theoretical control.",
    artificer:
      "Creation, logic, invention, and structured innovation.",
    blood_hunter:
      "Sacrifice, corruption, endurance, and moral cost of power."
  },

  // Used by SHORT MODE only (fast mapping layer)
  shortModeMapping: {
    dndAlignments: {
      "lawful good": "Lawful Guardian / Lawful Crusader",
      "neutral good": "Neutral Guardian / Neutral Defender",
      "chaotic good": "Chaotic Guardian / Chaotic Crusader",

      "lawful neutral": "Lawful Arbiter / Lawful Strategist",
      "true neutral": "TRUE NEUTRAL / Neutral Arbiter",
      "chaotic neutral": "Chaotic Knave / Chaotic Drifter",

      "lawful evil": "Lawful Renegade / Lawful Marauder",
      "neutral evil": "Neutral Ravager / Neutral Scoundrel",
      "chaotic evil": "Chaotic Marauder / Chaotic Renegade"
    },

    fallback:
      "Your identity fractures into multiple Belavadös archetypes depending on context."
  },

  // UI helper: what to show in result cards
  resultCardGuidance: {
    titleStyle: "Alignment Name",
    subtitleStyle: "Archetype Interpretation",
    descriptionStyle: "Narrative explanation + behavioral implications",
    includeAxes: true,
    includeClassInfluence: true
  },

  // FULL LORE (your system preserved for deep mode / codex / tooltip expansion)
  fullLore: `
The Belavadös Alignment System is founded on the belief that morality is not a fixed identity assigned at birth, nor a simplistic label that permanently defines a person’s nature. Instead, alignment is understood as a living reflection of philosophy, instinct, discipline, emotional behavior, social loyalty, personal conviction, and moral choice...

[TRUNCATED IN THIS VIEW ONLY FOR RESPONSE LIMITS — SEE NOTE BELOW]
`
};

/**
 * Optional helper functions for your quiz engine
 */

export function getAxisMidpoint(axis) {
  return WORLD_LORE.axes[axis]?.midpoint ?? 1500;
}

export function getDndMapping(alignment) {
  const key = alignment?.toLowerCase();
  return WORLD_LORE.shortModeMapping.dndAlignments[key] || WORLD_LORE.shortModeMapping.fallback;
}

export function getClassHint(className) {
  const key = className?.toLowerCase();
  return WORLD_LORE.classPhilosophyHint[key] || "A unique moral archetype shaped by experience.";
}
