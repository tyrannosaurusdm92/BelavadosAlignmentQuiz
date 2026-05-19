// /data/questions-short.js

export const questionsShort = {
  version: "short",

  metaQuestions: [
    {
      id: "class_selection",
      type: "single_choice",
      prompt:
        "Before the gears of fate turn… what kind of adventurer are you most aligned with?",
      options: [
        { text: "Barbarian — instinct and fury guide me", class: "barbarian" },
        { text: "Bard — I shape the world through voice and charm", class: "bard" },
        { text: "Cleric — I serve something greater than myself", class: "cleric" },
        { text: "Fighter — discipline and steel define me", class: "fighter" },
        { text: "Rogue — I survive through wit and shadow", class: "rogue" },
        { text: "Wizard — knowledge is the only true power", class: "wizard" },
        { text: "Warlock — power is a contract I understand", class: "warlock" },
        { text: "Ranger — I walk alone, but not aimlessly", class: "ranger" },
        { text: "Paladin — my oath is my spine", class: "paladin" },
        { text: "Druid — balance speaks louder than law", class: "druid" }
      ]
    },

    {
      id: "familiar_alignment",
      type: "single_choice",
      prompt:
        "Which philosophy most closely resembles how you’ve played or imagined your past characters?",
      options: [
        { text: "Lawful Good — duty and compassion must coexist" },
        { text: "Neutral Good — do what helps, ignore the rest" },
        { text: "Chaotic Good — freedom first, but kindness matters" },
        { text: "Lawful Neutral — order matters more than morality" },
        { text: "True Neutral — balance above all else" },
        { text: "Chaotic Neutral — I follow no path but my own" },
        { text: "Lawful Evil — structure is a tool for control" },
        { text: "Neutral Evil — I take what benefits me" },
        { text: "Chaotic Evil — destruction is its own language" }
      ]
    }
  ],

  questions: [
    {
      id: "q1",
      type: "scenario",
      prompt:
        "A starving village steals grain from your supplies. No one else will know if you punish them… or let it go.",
      options: [
        {
          text: "Forgive them and share what remains",
          effects: { altruism: 3, lawfulness: -1, cooperation: 1, honor: 2 }
        },
        {
          text: "Demand repayment through work or service",
          effects: { altruism: 1, lawfulness: 2, cooperation: 1, honor: 1 }
        },
        {
          text: "Take back what was stolen and leave them be",
          effects: { altruism: -2, lawfulness: 2, cooperation: -1, honor: 0 }
        },
        {
          text: "Punish the leaders as a warning",
          effects: { altruism: -2, lawfulness: 3, cooperation: -2, honor: -1 }
        }
      ]
    },

    {
      id: "q2",
      type: "scenario",
      prompt:
        "Your party leader gives a plan you strongly disagree with. The danger is real.",
      options: [
        {
          text: "Follow anyway — unity matters",
          effects: { cooperation: 3, lawfulness: 2, honor: 1 }
        },
        {
          text: "Argue your case but accept final decision",
          effects: { cooperation: 2, honor: 2, lawfulness: 1 }
        },
        {
          text: "Quietly adjust the plan without telling them",
          effects: { cooperation: -1, honor: -2, lawfulness: 1 }
        },
        {
          text: "Refuse and act independently",
          effects: { cooperation: -3, lawfulness: -2, altruism: 0 }
        }
      ]
    },

    {
      id: "q3",
      type: "scenario",
      prompt:
        "A captured enemy begs for mercy. Sparing them may cost future lives.",
      options: [
        {
          text: "Spare them — every life matters",
          effects: { altruism: 3, honor: 2, lawfulness: 0 }
        },
        {
          text: "Spare them but bind them",
          effects: { altruism: 2, lawfulness: 2, honor: 1 }
        },
        {
          text: "Interrogate then release them",
          effects: { altruism: 0, lawfulness: 1, honor: -1 }
        },
        {
          text: "Execute them — mercy is a risk",
          effects: { altruism: -3, lawfulness: 2, honor: -2 }
        }
      ]
    },

    {
      id: "q4",
      type: "scenario",
      prompt:
        "You discover a powerful artifact that could reshape the world… but it is unstable and dangerous.",
      options: [
        {
          text: "Destroy it immediately",
          effects: { altruism: 2, lawfulness: 3, honor: 2 }
        },
        {
          text: "Secure it for study and control",
          effects: { lawfulness: 2, cooperation: 1, honor: 1 }
        },
        {
          text: "Use it carefully for personal gain",
          effects: { altruism: -2, honor: -2, lawfulness: -1 }
        },
        {
          text: "Hide it and decide later",
          effects: { cooperation: -1, lawfulness: -1, honor: -1 }
        }
      ]
    },

    {
      id: "q5",
      type: "scenario",
      prompt:
        "A noble offers you wealth to carry out a morally questionable task.",
      options: [
        {
          text: "Refuse outright",
          effects: { honor: 3, altruism: 2 }
        },
        {
          text: "Refuse unless the task is justified",
          effects: { honor: 2, lawfulness: 1 }
        },
        {
          text: "Accept but plan to mitigate harm",
          effects: { honor: 0, altruism: 1 }
        },
        {
          text: "Accept without hesitation",
          effects: { altruism: -2, honor: -2, lawfulness: 0 }
        }
      ]
    },

    {
      id: "q6",
      type: "scenario",
      prompt:
        "You are given authority over a small group of survivors in a hostile land.",
      options: [
        {
          text: "Lead with strict rules and structure",
          effects: { lawfulness: 3, cooperation: 2, honor: 1 }
        },
        {
          text: "Lead through consensus and discussion",
          effects: { cooperation: 3, altruism: 2, lawfulness: 0 }
        },
        {
          text: "Let everyone act freely unless danger arises",
          effects: { lawfulness: -2, cooperation: -1 }
        },
        {
          text: "Take what you need to ensure survival",
          effects: { altruism: -3, honor: -2 }
        }
      ]
    },

    {
      id: "q7",
      type: "scenario",
      prompt:
        "A friend lies to protect you, but the truth comes out later.",
      options: [
        {
          text: "Forgive them immediately",
          effects: { cooperation: 3, honor: 2, altruism: 1 }
        },
        {
          text: "Confront them but remain allies",
          effects: { honor: 2, cooperation: 2 }
        },
        {
          text: "Trust them less moving forward",
          effects: { cooperation: -1, honor: 0 }
        },
        {
          text: "Cut ties completely",
          effects: { cooperation: -3, honor: -2 }
        }
      ]
    }
  ]
};
