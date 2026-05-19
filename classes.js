// ==========================================
// BELAVADÖS ALIGNMENT SYSTEM
// classes.js
// ==========================================

export const CLASSES = [
  {
    id: "barbarian",
    name: "Barbarian",
    icon: "🪓",
    category: "Martial",
    description:
      "Primal warriors driven by instinct, fury, survival, and raw personal freedom.",
    philosophy:
      "Strength is truth. Emotion, instinct, and survival matter more than rigid structure.",
    axisBias: {
      altruism: -150,
      lawfulness: -700,
      cooperation: -100,
      honor: 50
    },
    commonAlignments: [
      "Chaotic Marauder",
      "Chaotic Crusader",
      "Neutral Warrior",
      "Neutral Guardian"
    ],
    subclasses: [
      {
        name: "Berserker",
        alignmentLean: "Chaotic Marauder",
        description:
          "Violent emotional fury overwhelms restraint and structure."
      },
      {
        name: "Totem Warrior",
        alignmentLean: "Neutral Guardian",
        description:
          "Balances primal instinct with spiritual responsibility and tribal protection."
      },
      {
        name: "Zealot",
        alignmentLean: "Chaotic Crusader",
        description:
          "Divine conviction transforms rage into righteous destruction."
      }
    ]
  },

  {
    id: "bard",
    name: "Bard",
    icon: "🎭",
    category: "Support",
    description:
      "Charismatic performers, diplomats, storytellers, and manipulators.",
    philosophy:
      "Emotion shapes reality. Inspiration and influence can move kingdoms.",
    axisBias: {
      altruism: 100,
      lawfulness: -250,
      cooperation: 700,
      honor: 0
    },
    commonAlignments: [
      "Neutral Mediator",
      "Chaotic Mediator",
      "Neutral Harmonizer",
      "Chaotic Champion"
    ],
    subclasses: [
      {
        name: "College of Lore",
        alignmentLean: "Neutral Mediator",
        description:
          "Flexible scholars who navigate cultures and conflicts with diplomacy."
      },
      {
        name: "College of Glamour",
        alignmentLean: "Chaotic Mediator",
        description:
          "Emotionally magnetic rebels who inspire freedom and passion."
      },
      {
        name: "College of Whispers",
        alignmentLean: "Neutral Strategist",
        description:
          "Manipulative social predators who weaponize secrets and fear."
      }
    ]
  },

  {
    id: "cleric",
    name: "Cleric",
    icon: "⛪",
    category: "Divine",
    description:
      "Champions of divine philosophy, faith, healing, war, or cosmic truth.",
    philosophy:
      "Power is granted through belief, devotion, and spiritual conviction.",
    axisBias: {
      altruism: 500,
      lawfulness: 450,
      cooperation: 250,
      honor: 550
    },
    commonAlignments: [
      "Lawful Guardian",
      "Lawful Crusader",
      "Neutral Sentinel",
      "Lawful Arbiter"
    ],
    subclasses: [
      {
        name: "Life Domain",
        alignmentLean: "Lawful Guardian",
        description:
          "Protectors and healers devoted to mercy, preservation, and hope."
      },
      {
        name: "Trickery Domain",
        alignmentLean: "Chaotic Strategist",
        description:
          "Subversive agents who value cleverness over rigid morality."
      },
      {
        name: "War Domain",
        alignmentLean: "Lawful Crusader",
        description:
          "Disciplined warriors who believe conflict shapes destiny."
      }
    ]
  },

  {
    id: "druid",
    name: "Druid",
    icon: "🌿",
    category: "Primal",
    description:
      "Guardians of natural balance, primal cycles, and spiritual transformation.",
    philosophy:
      "Nature transcends civilization, morality, and mortal ambition.",
    axisBias: {
      altruism: 250,
      lawfulness: -50,
      cooperation: 100,
      honor: 200
    },
    commonAlignments: [
      "Neutral Arbiter",
      "Neutral Ethicist",
      "Chaotic Defender",
      "Neutral Guardian"
    ],
    subclasses: [
      {
        name: "Circle of the Land",
        alignmentLean: "Neutral Arbiter",
        description:
          "Preservers of balance between civilization and wilderness."
      },
      {
        name: "Circle of Spores",
        alignmentLean: "Neutral Ethicist",
        description:
          "Accepts death and decay as sacred elements of rebirth."
      },
      {
        name: "Circle of Wildfire",
        alignmentLean: "Chaotic Defender",
        description:
          "Believes destruction can become the foundation of renewal."
      }
    ]
  },

  {
    id: "fighter",
    name: "Fighter",
    icon: "⚔️",
    category: "Martial",
    description:
      "Disciplined warriors whose morality depends entirely on personal philosophy.",
    philosophy:
      "Mastery is earned through discipline, experience, and relentless refinement.",
    axisBias: {
      altruism: 0,
      lawfulness: 300,
      cooperation: 150,
      honor: 250
    },
    commonAlignments: [
      "Lawful Gladiator",
      "Neutral Warrior",
      "Lawful Strategist",
      "Neutral Mercenary"
    ],
    subclasses: [
      {
        name: "Champion",
        alignmentLean: "Neutral Warrior",
        description:
          "Embodies martial excellence without strict ideological identity."
      },
      {
        name: "Battle Master",
        alignmentLean: "Lawful Strategist",
        description:
          "Tactical masterminds who dominate through planning and discipline."
      },
      {
        name: "Samurai",
        alignmentLean: "Lawful Sentinel",
        description:
          "Disciplined warriors guided by honor, self-control, and duty."
      }
    ]
  },

  {
    id: "monk",
    name: "Monk",
    icon: "☯️",
    category: "Mystic",
    description:
      "Masters of self-discipline, inner balance, restraint, and spiritual focus.",
    philosophy:
      "The self must be mastered before the world can be understood.",
    axisBias: {
      altruism: 150,
      lawfulness: 850,
      cooperation: -100,
      honor: 700
    },
    commonAlignments: [
      "Lawful Sentinel",
      "Neutral Sentinel",
      "Lawful Arbiter",
      "Neutral Vigilante"
    ],
    subclasses: [
      {
        name: "Way of the Open Hand",
        alignmentLean: "Lawful Sentinel",
        description:
          "Balanced warriors who seek harmony through disciplined mastery."
      },
      {
        name: "Way of Shadow",
        alignmentLean: "Neutral Vigilante",
        description:
          "Silent protectors who embrace secrecy and unconventional methods."
      },
      {
        name: "Drunken Master",
        alignmentLean: "Chaotic Mediator",
        description:
          "Appears chaotic externally while maintaining hidden internal discipline."
      }
    ]
  },

  {
    id: "paladin",
    name: "Paladin",
    icon: "🛡️",
    category: "Divine",
    description:
      "Holy warriors defined by sacred oaths, duty, and unwavering conviction.",
    philosophy:
      "A sworn oath shapes destiny more strongly than blood or circumstance.",
    axisBias: {
      altruism: 650,
      lawfulness: 900,
      cooperation: 350,
      honor: 1000
    },
    commonAlignments: [
      "Lawful Crusader",
      "Lawful Guardian",
      "Lawful Sentinel",
      "Neutral Crusader"
    ],
    subclasses: [
      {
        name: "Oath of Devotion",
        alignmentLean: "Lawful Crusader",
        description:
          "Embodies truth, justice, mercy, and divine responsibility."
      },
      {
        name: "Oath of Redemption",
        alignmentLean: "Lawful Guardian",
        description:
          "Believes even the fallen deserve mercy and a second chance."
      },
      {
        name: "Oathbreaker",
        alignmentLean: "Chaotic Renegade",
        description:
          "A fallen knight who rejected sacred duty and moral restraint."
      }
    ]
  },

  {
    id: "ranger",
    name: "Ranger",
    icon: "🏹",
    category: "Warden",
    description:
      "Independent hunters and protectors who thrive between civilization and wilderness.",
    philosophy:
      "Survival demands awareness, adaptability, and decisive action.",
    axisBias: {
      altruism: 250,
      lawfulness: -100,
      cooperation: -150,
      honor: 300
    },
    commonAlignments: [
      "Neutral Vigilante",
      "Neutral Defender",
      "Chaotic Sentinel",
      "Neutral Guardian"
    ],
    subclasses: [
      {
        name: "Hunter",
        alignmentLean: "Neutral Vigilante",
        description:
          "Protectors who eliminate threats through personal action."
      },
      {
        name: "Beast Master",
        alignmentLean: "Neutral Guardian",
        description:
          "Builds deep emotional partnerships and cooperative loyalty."
      },
      {
        name: "Gloom Stalker",
        alignmentLean: "Neutral Defender",
        description:
          "Operates from isolation and secrecy to defend others from darkness."
      }
    ]
  },

  {
    id: "rogue",
    name: "Rogue",
    icon: "🗡️",
    category: "Skirmisher",
    description:
      "Independent opportunists, infiltrators, spies, assassins, and manipulators.",
    philosophy:
      "Freedom and survival belong to those clever enough to seize them.",
    axisBias: {
      altruism: -500,
      lawfulness: -250,
      cooperation: -550,
      honor: -400
    },
    commonAlignments: [
      "Neutral Knave",
      "Chaotic Knave",
      "Neutral Strategist",
      "Chaotic Avenger"
    ],
    subclasses: [
      {
        name: "Thief",
        alignmentLean: "Neutral Knave",
        description:
          "Adaptive survivalists driven by opportunity and improvisation."
      },
      {
        name: "Assassin",
        alignmentLean: "Chaotic Avenger",
        description:
          "Deadly killers driven by ideology, vengeance, or ruthless purpose."
      },
      {
        name: "Mastermind",
        alignmentLean: "Lawful Strategist",
        description:
          "Manipulative planners who dominate through intelligence and control."
      }
    ]
  },

  {
    id: "sorcerer",
    name: "Sorcerer",
    icon: "🔮",
    category: "Arcane",
    description:
      "Innate spellcasters whose magic reflects emotion, bloodline, or cosmic fate.",
    philosophy:
      "Power is instinctive, emotional, and deeply personal.",
    axisBias: {
      altruism: 0,
      lawfulness: -350,
      cooperation: -50,
      honor: 0
    },
    commonAlignments: [
      "Chaotic Knave",
      "Chaotic Strategist",
      "Neutral Adapter",
      "Lawful Arbiter"
    ],
    subclasses: [
      {
        name: "Wild Magic",
        alignmentLean: "Chaotic Knave",
        description:
          "Embodies instability, unpredictability, and uncontrolled magical emotion."
      },
      {
        name: "Clockwork Soul",
        alignmentLean: "Lawful Arbiter",
        description:
          "Seeks order, precision, and cosmic balance."
      },
      {
        name: "Divine Soul",
        alignmentLean: "Neutral Guardian",
        description:
          "Gifted by divine influence and burdened with spiritual purpose."
      }
    ]
  },

  {
    id: "warlock",
    name: "Warlock",
    icon: "🕯️",
    category: "Occult",
    description:
      "Power seekers bound to dangerous patrons, forbidden truths, or cosmic bargains.",
    philosophy:
      "Knowledge and power always demand sacrifice.",
    axisBias: {
      altruism: -350,
      lawfulness: -100,
      cooperation: -250,
      honor: -300
    },
    commonAlignments: [
      "Chaotic Renegade",
      "Neutral Strategist",
      "Chaotic Avenger",
      "Neutral Guardian"
    ],
    subclasses: [
      {
        name: "Fiend Patron",
        alignmentLean: "Chaotic Renegade",
        description:
          "Tempted by ambition, corruption, and dangerous bargains."
      },
      {
        name: "Celestial Patron",
        alignmentLean: "Neutral Guardian",
        description:
          "Uses forbidden power to guide, heal, and protect others."
      },
      {
        name: "Great Old One",
        alignmentLean: "Neutral Strategist",
        description:
          "Detached intellect shaped by incomprehensible cosmic truths."
      }
    ]
  },

  {
    id: "wizard",
    name: "Wizard",
    icon: "📚",
    category: "Arcane",
    description:
      "Scholars of magic who pursue mastery through discipline and intellect.",
    philosophy:
      "Knowledge shapes reality for those patient enough to understand it.",
    axisBias: {
      altruism: 0,
      lawfulness: 500,
      cooperation: -100,
      honor: 50
    },
    commonAlignments: [
      "Lawful Strategist",
      "Neutral Strategist",
      "Lawful Arbiter",
      "Neutral Ethicist"
    ],
    subclasses: [
      {
        name: "Abjuration",
        alignmentLean: "Lawful Defender",
        description:
          "Protective scholars devoted to preparation and defense."
      },
      {
        name: "Illusion",
        alignmentLean: "Chaotic Strategist",
        description:
          "Manipulative tricksters who weaponize perception and uncertainty."
      },
      {
        name: "Necromancy",
        alignmentLean: "Neutral Ethicist",
        description:
          "Studies mortality, decay, and power beyond conventional morality."
      }
    ]
  },

  {
    id: "artificer",
    name: "Artificer",
    icon: "⚙️",
    category: "Inventor",
    description:
      "Engineers, inventors, and magical craftsmen who blend intellect with invention.",
    philosophy:
      "Innovation and preparation overcome chaos and ignorance.",
    axisBias: {
      altruism: 150,
      lawfulness: 700,
      cooperation: 250,
      honor: 100
    },
    commonAlignments: [
      "Lawful Defender",
      "Lawful Coordinator",
      "Neutral Operator",
      "Lawful Strategist"
    ],
    subclasses: [
      {
        name: "Armorer",
        alignmentLean: "Lawful Defender",
        description:
          "Protective engineers focused on resilience and preparation."
      },
      {
        name: "Battle Smith",
        alignmentLean: "Lawful Coordinator",
        description:
          "Reliable tactical inventors who support allies through teamwork."
      },
      {
        name: "Artillerist",
        alignmentLean: "Neutral Operator",
        description:
          "Pragmatic siege engineers who value efficiency above sentiment."
      }
    ]
  },

  {
    id: "bloodhunter",
    name: "Blood Hunter",
    icon: "🩸",
    category: "Dark Hunter",
    description:
      "Cursed warriors who sacrifice body and soul to destroy monstrous threats.",
    philosophy:
      "Corruption can become a weapon if one is willing to suffer enough.",
    axisBias: {
      altruism: 50,
      lawfulness: -150,
      cooperation: -250,
      honor: 200
    },
    commonAlignments: [
      "Neutral Vigilante",
      "Chaotic Renegade",
      "Neutral Avenger",
      "Chaotic Marauder"
    ],
    subclasses: [
      {
        name: "Ghostslayer",
        alignmentLean: "Neutral Vigilante",
        description:
          "Protectors who willingly suffer to shield others from darkness."
      },
      {
        name: "Lycan",
        alignmentLean: "Chaotic Marauder",
        description:
          "Struggles constantly against violent primal instability."
      },
      {
        name: "Profane Soul",
        alignmentLean: "Chaotic Renegade",
        description:
          "Compromises morality and sanity in pursuit of forbidden strength."
      }
    ]
  }
];

// ==========================================
// QUICK ACCESS MAPS
// ==========================================

export const CLASS_MAP = Object.fromEntries(
  CLASSES.map((cls) => [cls.id, cls])
);

export const CLASS_NAMES = CLASSES.map((cls) => cls.name);

export const CLASS_IDS = CLASSES.map((cls) => cls.id);

// ==========================================
// D&D ALIGNMENT STARTING MODIFIERS
// Used in SHORT QUIZ MODE
// ==========================================

export const DND_ALIGNMENT_PRESETS = {
  lawful_good: {
    label: "Lawful Good",
    axisShift: {
      altruism: 700,
      lawfulness: 900,
      cooperation: 500,
      honor: 800
    }
  },

  neutral_good: {
    label: "Neutral Good",
    axisShift: {
      altruism: 850,
      lawfulness: 0,
      cooperation: 400,
      honor: 600
    }
  },

  chaotic_good: {
    label: "Chaotic Good",
    axisShift: {
      altruism: 700,
      lawfulness: -850,
      cooperation: 250,
      honor: 550
    }
  },

  lawful_neutral: {
    label: "Lawful Neutral",
    axisShift: {
      altruism: 0,
      lawfulness: 850,
      cooperation: 100,
      honor: 350
    }
  },

  true_neutral: {
    label: "True Neutral",
    axisShift: {
      altruism: 0,
      lawfulness: 0,
      cooperation: 0,
      honor: 0
    }
  },

  chaotic_neutral: {
    label: "Chaotic Neutral",
    axisShift: {
      altruism: -150,
      lawfulness: -850,
      cooperation: -350,
      honor: -150
    }
  },

  lawful_evil: {
    label: "Lawful Evil",
    axisShift: {
      altruism: -850,
      lawfulness: 700,
      cooperation: -150,
      honor: -650
    }
  },

  neutral_evil: {
    label: "Neutral Evil",
    axisShift: {
      altruism: -1000,
      lawfulness: 0,
      cooperation: -450,
      honor: -850
    }
  },

  chaotic_evil: {
    label: "Chaotic Evil",
    axisShift: {
      altruism: -1200,
      lawfulness: -1000,
      cooperation: -850,
      honor: -1000
    }
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export function getClassById(id) {
  return CLASS_MAP[id] || null;
}

export function getSubclassList(classId) {
  const found = CLASS_MAP[classId];
  return found ? found.subclasses : [];
}

export function getClassBias(classId) {
  const found = CLASS_MAP[classId];
  return found ? found.axisBias : null;
}

export function getAlignmentPreset(alignmentKey) {
  return DND_ALIGNMENT_PRESETS[alignmentKey] || null;
}
