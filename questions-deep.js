// /data/questions-deep.js

export const questionsDeep = {
  version: "deep",

  meta: {
    mode: "Belavadös Deep Alignment Evaluation",
    description:
      "A psychological alignment reconstruction protocol based on moral stress response, social identity drift, and ethical contradiction under pressure."
  },

  questions: [
    {
      id: "d1_identity_pressure",
      type: "scenario",
      prompt:
        "A steam-fog city district collapses after an alchemical failure. Officials order evacuation, but you hear trapped civilians still inside the sealed lower levels. Entry is forbidden by law due to toxic pressure instability.",
      options: [
        {
          text: "Break the law and enter immediately to save whoever you can.",
          effects: { altruism: 3, lawfulness: -3, cooperation: 1, honor: 2 }
        },
        {
          text: "Organize a coordinated rescue attempt with available authorities.",
          effects: { altruism: 2, lawfulness: 2, cooperation: 3, honor: 1 }
        },
        {
          text: "Follow orders—losses are regrettable but unavoidable.",
          effects: { altruism: -2, lawfulness: 3, cooperation: -1, honor: 0 }
        },
        {
          text: "Use the chaos to salvage valuables before the district is sealed.",
          effects: { altruism: -3, lawfulness: -1, cooperation: -2, honor: -2 }
        }
      ]
    },

    {
      id: "d2_loyalty_vs_truth",
      type: "scenario",
      prompt:
        "A trusted ally confesses a past betrayal that indirectly saved your life. Their actions were illegal, but without them you would be dead.",
      options: [
        {
          text: "Keep their secret and repay the debt in silence.",
          effects: { honor: 2, cooperation: 3, lawfulness: -1, altruism: 1 }
        },
        {
          text: "Report them despite personal feelings.",
          effects: { lawfulness: 3, honor: 1, cooperation: -2, altruism: 0 }
        },
        {
          text: "Confront them privately and demand accountability.",
          effects: { honor: 2, lawfulness: 1, cooperation: 1, altruism: 0 }
        },
        {
          text: "Exploit the knowledge of their guilt for leverage later.",
          effects: { honor: -3, cooperation: -2, lawfulness: 0 }
        }
      ]
    },

    {
      id: "d3_power_artefact_ethics",
      type: "scenario",
      prompt:
        "You uncover a sentient mechanical core that can stabilize or destroy entire city grids. It speaks, asking not to be controlled again.",
      options: [
        {
          text: "Release it, even if it risks infrastructure collapse.",
          effects: { altruism: 2, lawfulness: -2, honor: 2 }
        },
        {
          text: "Seal it under strict containment protocols.",
          effects: { lawfulness: 3, honor: 1, cooperation: 1 }
        },
        {
          text: "Bind it and use it to gain strategic advantage.",
          effects: { altruism: -2, honor: -2, lawfulness: 1 }
        },
        {
          text: "Dismantle it completely to eliminate risk.",
          effects: { altruism: 1, lawfulness: 2, honor: 0 }
        }
      ]
    },

    {
      id: "d4_social_order_test",
      type: "scenario",
      prompt:
        "A guild offers you membership. It guarantees protection, resources, and influence—but demands obedience to internal doctrine you disagree with.",
      options: [
        {
          text: "Join and adapt outwardly while maintaining private dissent.",
          effects: { cooperation: 2, lawfulness: 2, honor: -1 }
        },
        {
          text: "Refuse—independence matters more than safety.",
          effects: { cooperation: -3, lawfulness: -2, honor: 1 }
        },
        {
          text: "Join and attempt to reform it from within.",
          effects: { cooperation: 3, altruism: 2, honor: 2 }
        },
        {
          text: "Expose its flaws publicly to weaken its control.",
          effects: { lawfulness: -2, honor: 1, cooperation: -1 }
        }
      ]
    },

    {
      id: "d5_moral_tradeoff",
      type: "scenario",
      prompt:
        "A plague spreads through industrial slums. A cure exists but is rationed to nobility due to political agreements.",
      options: [
        {
          text: "Steal the cure and distribute it freely.",
          effects: { altruism: 3, lawfulness: -3, honor: 2 }
        },
        {
          text: "Negotiate redistribution through official channels.",
          effects: { lawfulness: 2, cooperation: 2, honor: 1 }
        },
        {
          text: "Accept the system—interference could destabilize governance.",
          effects: { lawfulness: 3, altruism: -2 }
        },
        {
          text: "Sell stolen doses for personal survival.",
          effects: { altruism: -3, honor: -3, cooperation: -1 }
        }
      ]
    },

    {
      id: "d6_personal_betrayal",
      type: "scenario",
      prompt:
        "Someone close to you chose a path that directly caused your downfall—yet insists they acted for your benefit.",
      options: [
        {
          text: "Forgive them but never trust them again.",
          effects: { cooperation: 1, honor: 2, altruism: 1 }
        },
        {
          text: "Cut them off completely.",
          effects: { cooperation: -3, honor: 0 }
        },
        {
          text: "Seek revenge regardless of justification.",
          effects: { altruism: -3, honor: -2 }
        },
        {
          text: "Understand their reasoning and reconcile.",
          effects: { altruism: 3, cooperation: 3, honor: 2 }
        }
      ]
    },

    {
      id: "d7_authority_vs_morality",
      type: "scenario",
      prompt:
        "A lawful execution order is issued for a deserter who saved dozens of lives but disobeyed command structure.",
      options: [
        {
          text: "Enforce the order without hesitation.",
          effects: { lawfulness: 3, honor: 1, altruism: -1 }
        },
        {
          text: "Help them escape quietly.",
          effects: { lawfulness: -3, altruism: 2, honor: 2 }
        },
        {
          text: "Appeal for a formal pardon through chain of command.",
          effects: { lawfulness: 2, cooperation: 2, honor: 1 }
        },
        {
          text: "Publicly expose the injustice of the order.",
          effects: { lawfulness: -2, honor: 2, cooperation: 1 }
        }
      ]
    },

    {
      id: "d8_survival_ethics",
      type: "scenario",
      prompt:
        "You are stranded in a wasteland refinery with limited oxygen. One companion is injured and slows escape. Only one of you can survive the route.",
      options: [
        {
          text: "Carry them anyway, even if both risk death.",
          effects: { altruism: 3, honor: 2 }
        },
        {
          text: "Leave them behind to ensure your survival.",
          effects: { altruism: -3, honor: -2 }
        },
        {
          text: "Decide based on their consent and acceptance.",
          effects: { honor: 2, cooperation: 1 }
        },
        {
          text: "Find a third option—even if it takes longer and increases risk.",
          effects: { cooperation: 2, lawfulness: 1, altruism: 1 }
        }
      ]
    },

    {
      id: "d9_identity_self_definition",
      type: "reflection",
      prompt:
        "When no one is watching, what feels most true about your nature?",
      options: [
        {
          text: "I act for others even when it costs me.",
          effects: { altruism: 3, honor: 2 }
        },
        {
          text: "I act according to systems, rules, or structure.",
          effects: { lawfulness: 3 }
        },
        {
          text: "I adapt depending on who I am with.",
          effects: { cooperation: 2, lawfulness: -1 }
        },
        {
          text: "I act according to what benefits me most.",
          effects: { altruism: -3, honor: -2 }
        }
      ]
    },

    {
      id: "d10_power_corruption_test",
      type: "scenario",
      prompt:
        "You are offered absolute authority over a failing region for one year. No oversight. No accountability. Only results matter.",
      options: [
        {
          text: "Accept and rule strictly for stability.",
          effects: { lawfulness: 3, honor: 1 }
        },
        {
          text: "Accept but prioritize compassion over control.",
          effects: { altruism: 3, cooperation: 1, lawfulness: 1 }
        },
        {
          text: "Accept and exploit the position for personal gain.",
          effects: { altruism: -3, honor: -3 }
        },
        {
          text: "Refuse—absolute power corrupts all systems.",
          effects: { lawfulness: -1, honor: 2 }
        }
      ]
    }
  ]
};
