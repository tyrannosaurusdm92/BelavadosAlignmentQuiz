// =============================================
// Belavadös Alignment Quiz - scoring.js
// =============================================
// Full scoring engine for both:
// 1. Short Quiz Mode
// 2. Deep Quiz Mode
//
// This file assumes the following already exist:
// - window.ALIGNMENTS
// - window.CLASSES
// - window.SHORT_QUESTIONS
// - window.DEEP_QUESTIONS
// - state.js handling current answers
//
// The system calculates 4 primary axes:
// - Altruism
// - Lawfulness
// - Cooperation
// - Honor
//
// Range:
// 0 - 3000
// Neutral midpoint:
// 1500
// =============================================

const AXIS_MIN = 0;
const AXIS_MAX = 3000;
const AXIS_NEUTRAL = 1500;

const AXES = [
  'altruism',
  'lawfulness',
  'cooperation',
  'honor'
];

// =============================================
// BASE STATE
// =============================================

export function createBaseScores() {
  return {
    altruism: AXIS_NEUTRAL,
    lawfulness: AXIS_NEUTRAL,
    cooperation: AXIS_NEUTRAL,
    honor: AXIS_NEUTRAL
  };
}

// =============================================
// VALUE HELPERS
// =============================================

export function clampAxis(value) {
  return Math.max(AXIS_MIN, Math.min(AXIS_MAX, value));
}

export function normalizeScores(scores) {
  const normalized = {};

  AXES.forEach(axis => {
    normalized[axis] = clampAxis(scores[axis]);
  });

  return normalized;
}

export function axisDistance(value) {
  return value - AXIS_NEUTRAL;
}

export function getAxisIntensity(value) {
  const distance = Math.abs(axisDistance(value));

  if (distance < 250) return 'balanced';
  if (distance < 600) return 'moderate';
  if (distance < 1000) return 'strong';

  return 'extreme';
}

// =============================================
// SHORT QUIZ SCORING
// =============================================
// The short quiz uses:
// - Selected class
// - Traditional D&D alignment
//
// Then combines those together.
// =============================================

const DND_ALIGNMENT_PRESETS = {
  lawful_good: {
    altruism: 700,
    lawfulness: 800,
    cooperation: 500,
    honor: 800
  },

  neutral_good: {
    altruism: 800,
    lawfulness: 0,
    cooperation: 450,
    honor: 700
  },

  chaotic_good: {
    altruism: 700,
    lawfulness: -800,
    cooperation: 350,
    honor: 650
  },

  lawful_neutral: {
    altruism: 0,
    lawfulness: 850,
    cooperation: 300,
    honor: 300
  },

  true_neutral: {
    altruism: 0,
    lawfulness: 0,
    cooperation: 0,
    honor: 0
  },

  chaotic_neutral: {
    altruism: 0,
    lawfulness: -850,
    cooperation: -300,
    honor: -100
  },

  lawful_evil: {
    altruism: -850,
    lawfulness: 850,
    cooperation: 150,
    honor: -600
  },

  neutral_evil: {
    altruism: -900,
    lawfulness: 0,
    cooperation: -500,
    honor: -700
  },

  chaotic_evil: {
    altruism: -1000,
    lawfulness: -1000,
    cooperation: -850,
    honor: -1000
  }
};

// =============================================
// CLASS BIASES
// =============================================
// These are NOT absolute.
// They simply push players toward archetypes.
// =============================================

const CLASS_BIASES = {
  barbarian: {
    altruism: -100,
    lawfulness: -500,
    cooperation: -50,
    honor: 100
  },

  bard: {
    altruism: 150,
    lawfulness: -150,
    cooperation: 500,
    honor: 50
  },

  cleric: {
    altruism: 500,
    lawfulness: 450,
    cooperation: 200,
    honor: 400
  },

  druid: {
    altruism: 250,
    lawfulness: -50,
    cooperation: 100,
    honor: 150
  },

  fighter: {
    altruism: 0,
    lawfulness: 250,
    cooperation: 100,
    honor: 200
  },

  monk: {
    altruism: 150,
    lawfulness: 700,
    cooperation: -100,
    honor: 500
  },

  paladin: {
    altruism: 700,
    lawfulness: 850,
    cooperation: 400,
    honor: 850
  },

  ranger: {
    altruism: 150,
    lawfulness: -200,
    cooperation: -100,
    honor: 250
  },

  rogue: {
    altruism: -450,
    lawfulness: -350,
    cooperation: -300,
    honor: -250
  },

  sorcerer: {
    altruism: 50,
    lawfulness: -350,
    cooperation: 0,
    honor: -50
  },

  warlock: {
    altruism: -300,
    lawfulness: -200,
    cooperation: -150,
    honor: -400
  },

  wizard: {
    altruism: 0,
    lawfulness: 300,
    cooperation: -50,
    honor: 50
  },

  artificer: {
    altruism: 150,
    lawfulness: 500,
    cooperation: 300,
    honor: 150
  },

  blood_hunter: {
    altruism: -100,
    lawfulness: -150,
    cooperation: -250,
    honor: 50
  }
};

// =============================================
// APPLY MODIFIER
// =============================================

function applyModifier(scores, modifier) {
  if (!modifier) return scores;

  const updated = { ...scores };

  AXES.forEach(axis => {
    updated[axis] += modifier[axis] || 0;
  });

  return updated;
}

// =============================================
// SHORT QUIZ CALCULATOR
// =============================================

export function calculateShortQuiz({
  selectedClass,
  selectedAlignment
}) {
  let scores = createBaseScores();

  const classBias = CLASS_BIASES[selectedClass];
  const alignmentBias = DND_ALIGNMENT_PRESETS[selectedAlignment];

  scores = applyModifier(scores, classBias);
  scores = applyModifier(scores, alignmentBias);

  scores = normalizeScores(scores);

  const result = determineBelavadosAlignment(scores);

  return {
    mode: 'short',
    scores,
    result,
    profile: generateProfile(scores)
  };
}

// =============================================
// DEEP QUIZ CALCULATOR
// =============================================
// Each answer should contain:
// {
//   altruism: number,
//   lawfulness: number,
//   cooperation: number,
//   honor: number
// }
// =============================================

export function calculateDeepQuiz(answers = []) {
  let scores = createBaseScores();

  answers.forEach(answer => {
    scores = applyModifier(scores, answer);
  });

  scores = normalizeScores(scores);

  const result = determineBelavadosAlignment(scores);

  return {
    mode: 'deep',
    scores,
    result,
    profile: generateProfile(scores)
  };
}

// =============================================
// AXIS INTERPRETATION
// =============================================

function getMoralAxis(value) {
  if (value <= 1000) return 'Selfish';
  if (value >= 2000) return 'Altruistic';

  return 'Neutral';
}

function getLawAxis(value) {
  if (value <= 1000) return 'Chaotic';
  if (value >= 2000) return 'Lawful';

  return 'Neutral';
}

function getCooperationAxis(value) {
  if (value <= 1000) return 'Combative';
  if (value >= 2000) return 'Cooperative';

  return 'Neutral';
}

function getHonorAxis(value) {
  if (value <= 1000) return 'Pragmatic';
  if (value >= 2000) return 'Honorable';

  return 'Neutral';
}

// =============================================
// ALIGNMENT LOOKUP TABLE
// =============================================

const ALIGNMENT_MATRIX = {
  // =========================================
  // LAWFUL
  // =========================================

  'Selfish-Lawful-Cooperative-Pragmatic': 'Lawful Renegade',
  'Selfish-Lawful-Cooperative-Neutral': 'Lawful Drifter',
  'Selfish-Lawful-Cooperative-Honorable': 'Lawful Champion',

  'Selfish-Lawful-Neutral-Pragmatic': 'Lawful Strategist',
  'Selfish-Lawful-Neutral-Neutral': 'Lawful Knave',
  'Selfish-Lawful-Neutral-Honorable': 'Lawful Avenger',

  'Selfish-Lawful-Combative-Pragmatic': 'Lawful Mercenary',
  'Selfish-Lawful-Combative-Neutral': 'Lawful Marauder',
  'Selfish-Lawful-Combative-Honorable': 'Lawful Gladiator',

  'Altruistic-Lawful-Cooperative-Pragmatic': 'Lawful Coordinator',
  'Altruistic-Lawful-Cooperative-Neutral': 'Lawful Mediator',
  'Altruistic-Lawful-Cooperative-Honorable': 'Lawful Guardian',

  'Altruistic-Lawful-Neutral-Pragmatic': 'Lawful Defender',
  'Altruistic-Lawful-Neutral-Neutral': 'Lawful Arbiter',
  'Altruistic-Lawful-Neutral-Honorable': 'Lawful Sentinel',

  'Altruistic-Lawful-Combative-Pragmatic': 'Lawful Enforcer',
  'Altruistic-Lawful-Combative-Neutral': 'Lawful Vigilante',
  'Altruistic-Lawful-Combative-Honorable': 'Lawful Crusader',

  // =========================================
  // NEUTRAL
  // =========================================

  'Selfish-Neutral-Cooperative-Pragmatic': 'Neutral Renegade',
  'Selfish-Neutral-Cooperative-Neutral': 'Neutral Drifter',
  'Selfish-Neutral-Cooperative-Honorable': 'Neutral Champion',

  'Selfish-Neutral-Neutral-Pragmatic': 'Neutral Strategist',
  'Selfish-Neutral-Neutral-Neutral': 'Neutral Knave',
  'Selfish-Neutral-Neutral-Honorable': 'Neutral Avenger',

  'Selfish-Neutral-Combative-Pragmatic': 'Neutral Mercenary',
  'Selfish-Neutral-Combative-Neutral': 'Neutral Marauder',
  'Selfish-Neutral-Combative-Honorable': 'Neutral Gladiator',

  'Neutral-Neutral-Cooperative-Pragmatic': 'Neutral Operator',
  'Neutral-Neutral-Cooperative-Neutral': 'Neutral Collaborator',
  'Neutral-Neutral-Cooperative-Honorable': 'Neutral Harmonizer',

  'Neutral-Neutral-Neutral-Pragmatic': 'Neutral Adapter',
  'Neutral-Neutral-Neutral-Neutral': 'TRUE NEUTRAL',
  'Neutral-Neutral-Neutral-Honorable': 'Neutral Ethicist',

  'Neutral-Neutral-Combative-Pragmatic': 'Neutral Ravager',
  'Neutral-Neutral-Combative-Neutral': 'Neutral Scoundrel',
  'Neutral-Neutral-Combative-Honorable': 'Neutral Warrior',

  'Altruistic-Neutral-Cooperative-Pragmatic': 'Neutral Coordinator',
  'Altruistic-Neutral-Cooperative-Neutral': 'Neutral Mediator',
  'Altruistic-Neutral-Cooperative-Honorable': 'Neutral Guardian',

  'Altruistic-Neutral-Neutral-Pragmatic': 'Neutral Defender',
  'Altruistic-Neutral-Neutral-Neutral': 'Neutral Arbiter',
  'Altruistic-Neutral-Neutral-Honorable': 'Neutral Sentinel',

  'Altruistic-Neutral-Combative-Pragmatic': 'Neutral Enforcer',
  'Altruistic-Neutral-Combative-Neutral': 'Neutral Vigilante',
  'Altruistic-Neutral-Combative-Honorable': 'Neutral Crusader',

  // =========================================
  // CHAOTIC
  // =========================================

  'Selfish-Chaotic-Cooperative-Pragmatic': 'Chaotic Renegade',
  'Selfish-Chaotic-Cooperative-Neutral': 'Chaotic Drifter',
  'Selfish-Chaotic-Cooperative-Honorable': 'Chaotic Champion',

  'Selfish-Chaotic-Neutral-Pragmatic': 'Chaotic Strategist',
  'Selfish-Chaotic-Neutral-Neutral': 'Chaotic Knave',
  'Selfish-Chaotic-Neutral-Honorable': 'Chaotic Avenger',

  'Selfish-Chaotic-Combative-Pragmatic': 'Chaotic Mercenary',
  'Selfish-Chaotic-Combative-Neutral': 'Chaotic Marauder',
  'Selfish-Chaotic-Combative-Honorable': 'Chaotic Gladiator',

  'Altruistic-Chaotic-Cooperative-Pragmatic': 'Chaotic Coordinator',
  'Altruistic-Chaotic-Cooperative-Neutral': 'Chaotic Mediator',
  'Altruistic-Chaotic-Cooperative-Honorable': 'Chaotic Guardian',

  'Altruistic-Chaotic-Neutral-Pragmatic': 'Chaotic Defender',
  'Altruistic-Chaotic-Neutral-Neutral': 'Chaotic Arbiter',
  'Altruistic-Chaotic-Neutral-Honorable': 'Chaotic Sentinel',

  'Altruistic-Chaotic-Combative-Pragmatic': 'Chaotic Enforcer',
  'Altruistic-Chaotic-Combative-Neutral': 'Chaotic Vigilante',
  'Altruistic-Chaotic-Combative-Honorable': 'Chaotic Crusader'
};

// =============================================
// DETERMINE ALIGNMENT
// =============================================

export function determineBelavadosAlignment(scores) {
  const morality = getMoralAxis(scores.altruism);
  const law = getLawAxis(scores.lawfulness);
  const cooperation = getCooperationAxis(scores.cooperation);
  const honor = getHonorAxis(scores.honor);

  const key = `${morality}-${law}-${cooperation}-${honor}`;

  const alignment = ALIGNMENT_MATRIX[key] || 'TRUE NEUTRAL';

  return {
    name: alignment,

    axes: {
      morality,
      law,
      cooperation,
      honor
    },

    key
  };
}

// =============================================
// PROFILE GENERATION
// =============================================

export function generateProfile(scores) {
  return {
    altruism: {
      value: scores.altruism,
      label: getMoralAxis(scores.altruism),
      intensity: getAxisIntensity(scores.altruism)
    },

    lawfulness: {
      value: scores.lawfulness,
      label: getLawAxis(scores.lawfulness),
      intensity: getAxisIntensity(scores.lawfulness)
    },

    cooperation: {
      value: scores.cooperation,
      label: getCooperationAxis(scores.cooperation),
      intensity: getAxisIntensity(scores.cooperation)
    },

    honor: {
      value: scores.honor,
      label: getHonorAxis(scores.honor),
      intensity: getAxisIntensity(scores.honor)
    }
  };
}

// =============================================
// RESULT DETAILS
// =============================================

export function buildDetailedResult(resultData, alignmentData = {}) {
  const { result, scores, profile } = resultData;

  const alignmentInfo = alignmentData[result.name] || {};

  return {
    title: result.name,

    subtitle: result.key,

    description:
      alignmentInfo.description ||
      'A complex soul shaped by philosophy, instinct, and experience.',

    scores,

    profile,

    lore:
      alignmentInfo.lore ||
      'Your actions create ripples throughout Belavadös.',

    traits: generateTraits(profile),

    dominantAxis: getDominantAxis(scores),

    weakestAxis: getWeakestAxis(scores)
  };
}

// =============================================
// TRAIT GENERATION
// =============================================

function generateTraits(profile) {
  const traits = [];

  Object.entries(profile).forEach(([axis, data]) => {
    if (data.intensity === 'extreme') {
      traits.push(`Extremely ${data.label}`);
    }

    if (data.intensity === 'strong') {
      traits.push(`Strongly ${data.label}`);
    }
  });

  if (traits.length === 0) {
    traits.push('Balanced Personality');
  }

  return traits;
}

// =============================================
// DOMINANT AXIS
// =============================================

function getDominantAxis(scores) {
  let dominant = null;
  let highest = -1;

  AXES.forEach(axis => {
    const intensity = Math.abs(scores[axis] - AXIS_NEUTRAL);

    if (intensity > highest) {
      highest = intensity;
      dominant = axis;
    }
  });

  return dominant;
}

// =============================================
// WEAKEST AXIS
// =============================================

function getWeakestAxis(scores) {
  let weakest = null;
  let lowest = Infinity;

  AXES.forEach(axis => {
    const intensity = Math.abs(scores[axis] - AXIS_NEUTRAL);

    if (intensity < lowest) {
      lowest = intensity;
      weakest = axis;
    }
  });

  return weakest;
}

// =============================================
// PERCENTAGE HELPERS
// =============================================

export function axisToPercent(value) {
  return Math.round((value / AXIS_MAX) * 100);
}

export function getAlignmentColor(alignmentName) {
  if (alignmentName.includes('Lawful')) {
    return '#4f7cff';
  }

  if (alignmentName.includes('Chaotic')) {
    return '#ff5e5e';
  }

  return '#c9b27d';
}

// =============================================
// SAVE /
