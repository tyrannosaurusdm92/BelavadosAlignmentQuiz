// merged-quiz.js
// Belavadös DnD 5e Homebrew Alignment Quiz (Merged Version)

document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // DOM ELEMENTS
    // =========================
    const currentQuestionEl = document.getElementById("current-question");
    const totalQuestionsEl = document.getElementById("total-questions");
    const progressBar = document.getElementById("progress-bar");

    const categoryEl = document.getElementById("question-category");
    const titleEl = document.getElementById("question-title");
    const contextEl = document.getElementById("question-context");

    const answerButtons = document.querySelectorAll(".answer-card");

    const prevButton = document.getElementById("previous-question");
    const homeButton = document.getElementById("home-page");

    // =========================
    // AXIS TRACKING
    // =========================
    const scores = {
        altruism: 0,
        lawfulness: 0,
        cooperation: 0,
        honor: 0
    };

    // =========================
    // ORIGINAL SHORT QUESTIONS
    // =========================
    const baseQuestions = [
        {
            category: "Philosophical Conflict",
            title: `A starving settlement steals medicine from a wealthy imperial city.
The city demands the thieves be returned for execution.
What matters most to you?`,
            context: `The imperial governor claims the law must remain absolute or civilization collapses.
The settlement argues survival justified the theft.
Your companions are divided, and both sides ask for your judgment.`,
            answers: [
                {
                    text: "Return the thieves peacefully.",
                    desc: "Law must remain consistent even when painful. Stability protects more lives long term.",
                    effect: { altruism: 0, lawfulness: 2, cooperation: 1, honor: 1 }
                },
                {
                    text: "Protect the settlement and defy the city.",
                    desc: "Compassion matters more than institutional authority.",
                    effect: { altruism: 2, lawfulness: -2, cooperation: 1, honor: 0 }
                },
                {
                    text: "Negotiate restitution instead of punishment.",
                    desc: "Balance survival, accountability, and future stability.",
                    effect: { altruism: 1, lawfulness: 1, cooperation: 2, honor: 1 }
                },
                {
                    text: "Exploit the conflict for personal leverage.",
                    desc: "Both sides are vulnerable. Power belongs to those willing to seize it.",
                    effect: { altruism: -2, lawfulness: -1, cooperation: -1, honor: -2 }
                }
            ]
        },

        {
            category: "Loyalty & Betrayal",
            title: `A lifelong ally confesses to committing atrocities during wartime.
Revealing the truth would destroy the fragile peace they helped create.`,
            context: `You alone hold the truth. The ally asks for silence, claiming it is necessary for stability.`,
            answers: [
                {
                    text: "Expose them publicly regardless of consequences.",
                    desc: "Truth must be absolute.",
                    effect: { altruism: 1, lawfulness: 2, cooperation: -1, honor: 2 }
                },
                {
                    text: "Protect the peace and bury the truth.",
                    desc: "Stability matters more than revelation.",
                    effect: { altruism: 1, lawfulness: -2, cooperation: 2, honor: -1 }
                },
                {
                    text: "Demand private atonement without public revelation.",
                    desc: "Justice without collapse.",
                    effect: { altruism: 1, lawfulness: 1, cooperation: 2, honor: 1 }
                },
                {
                    text: "Use the knowledge to secure influence over them.",
                    desc: "Truth is power.",
                    effect: { altruism: -1, lawfulness: -1, cooperation: -2, honor: -2 }
                }
            ]
        },

        {
            category: "Authority & Rebellion",
            title: `A tyrannical kingdom maintains peace, prosperity, and safety through brutal surveillance and oppression.`,
            context: `Crime is nearly nonexistent, but freedom is heavily restricted.`,
            answers: [
                {
                    text: "Stability is preferable to uncontrolled chaos.",
                    desc: "Order is worth the cost.",
                    effect: { altruism: 0, lawfulness: 2, cooperation: 1, honor: 1 }
                },
                {
                    text: "Freedom matters more than enforced safety.",
                    desc: "Oppression cannot be justified.",
                    effect: { altruism: 2, lawfulness: -2, cooperation: 0, honor: 1 }
                },
                {
                    text: "Reform the system gradually from within.",
                    desc: "Change without collapse.",
                    effect: { altruism: 1, lawfulness: 1, cooperation: 2, honor: 2 }
                },
                {
                    text: "Seize power personally and control both sides.",
                    desc: "Only strength ensures order.",
                    effect: { altruism: -1, lawfulness: 1, cooperation: -1, honor: 0 }
                }
            ]
        },

        {
            category: "Sacrifice & Survival",
            title: `Your party can only save either a village of strangers or one beloved companion.`,
            context: `There is no time for both. The decision must be immediate.`,
            answers: [
                {
                    text: "Save the village regardless of personal pain.",
                    desc: "Many lives outweigh one.",
                    effect: { altruism: 2, lawfulness: 1, cooperation: 1, honor: 1 }
                },
                {
                    text: "Save your companion.",
                    desc: "Personal bonds define meaning.",
                    effect: { altruism: -1, lawfulness: 0, cooperation: 2, honor: 1 }
                },
                {
                    text: "Attempt an impossible plan to save both.",
                    desc: "Refuse to accept loss.",
                    effect: { altruism: 1, lawfulness: -1, cooperation: 2, honor: 1 }
                },
                {
                    text: "Preserve whoever provides greater future advantage.",
                    desc: "Survival is strategic.",
                    effect: { altruism: -2, lawfulness: 0, cooperation: -1, honor: -1 }
                }
            ]
        },

        {
            category: "Truth & Deception",
            title: `A devastating truth would shatter public morale during wartime.`,
            context: `Leaders ask you to decide whether to reveal it.`,
            answers: [
                {
                    text: "The truth must always be revealed.",
                    desc: "Honesty is non-negotiable.",
                    effect: { altruism: 1, lawfulness: 2, cooperation: -1, honor: 2 }
                },
                {
                    text: "Hope is more important than honesty.",
                    desc: "Morale is survival.",
                    effect: { altruism: 1, lawfulness: -2, cooperation: 2, honor: -1 }
                },
                {
                    text: "Reveal only what is necessary.",
                    desc: "Controlled truth preserves balance.",
                    effect: { altruism: 1, lawfulness: 1, cooperation: 2, honor: 1 }
                },
                {
                    text: "Manipulate public perception strategically.",
                    desc: "Truth is a tool.",
                    effect: { altruism: -1, lawfulness: -1, cooperation: -1, honor: -2 }
                }
            ]
        }
    ];

    // =========================
    // SECOND QUESTION SET (NORMALIZED)
    // =========================
    const extraQuestions = [
        {
            category: "Survival Dilemma",
            title: "A starving village steals grain from your supplies. No one else will know if you punish them… or let it go.",
            context: "",
            answers: [
                {
                    text: "Forgive them and share what remains",
                    desc: "",
                    effect: { altruism: 3, lawfulness: -1, cooperation: 1, honor: 2 }
                },
                {
                    text: "Demand repayment through work or service",
                    desc: "",
                    effect: { altruism: 1, lawfulness: 2, cooperation: 1, honor: 1 }
                },
                {
                    text: "Take back what was stolen and leave them be",
                    desc: "",
                    effect: { altruism: -2, lawfulness: 2, cooperation: -1, honor: 0 }
                },
                {
                    text: "Punish the leaders as a warning",
                    desc: "",
                    effect: { altruism: -2, lawfulness: 3, cooperation: -2, honor: -1 }
                }
            ]
        },

        {
            category: "Leadership",
            title: "Your party leader gives a plan you strongly disagree with. The danger is real.",
            context: "",
            answers: [
                {
                    text: "Follow anyway — unity matters",
                    desc: "",
                    effect: { cooperation: 3, lawfulness: 2, honor: 1 }
                },
                {
                    text: "Argue your case but accept final decision",
                    desc: "",
                    effect: { cooperation: 2, honor: 2, lawfulness: 1 }
                },
                {
                    text: "Quietly adjust the plan without telling them",
                    desc: "",
                    effect: { cooperation: -1, honor: -2, lawfulness: 1 }
                },
                {
                    text: "Refuse and act independently",
                    desc: "",
                    effect: { cooperation: -3, lawfulness: -2 }
                }
            ]
        },

        {
            category: "Mercy",
            title: "A captured enemy begs for mercy. Sparing them may cost future lives.",
            context: "",
            answers: [
                {
                    text: "Spare them — every life matters",
                    desc: "",
                    effect: { altruism: 3, honor: 2 }
                },
                {
                    text: "Spare them but bind them",
                    desc: "",
                    effect: { altruism: 2, lawfulness: 2, honor: 1 }
                },
                {
                    text: "Interrogate then release them",
                    desc: "",
                    effect: { altruism: 0, lawfulness: 1, honor: -1 }
                },
                {
                    text: "Execute them — mercy is a risk",
                    desc: "",
                    effect: { altruism: -3, lawfulness: 2, honor: -2 }
                }
            ]
        },

        {
            category: "Power",
            title: "You discover a powerful artifact that could reshape the world… but it is unstable and dangerous.",
            context: "",
            answers: [
                {
                    text: "Destroy it immediately",
                    desc: "",
                    effect: { altruism: 2, lawfulness: 3, honor: 2 }
                },
                {
                    text: "Secure it for study and control",
                    desc: "",
                    effect: { lawfulness: 2, cooperation: 1, honor: 1 }
                },
                {
                    text: "Use it carefully for personal gain",
                    desc: "",
                    effect: { altruism: -2, honor: -2, lawfulness: -1 }
                },
                {
                    text: "Hide it and decide later",
                    desc: "",
                    effect: { cooperation: -1, lawfulness: -1, honor: -1 }
                }
            ]
        },

        {
            category: "Morality",
            title: "A noble offers you wealth to carry out a morally questionable task.",
            context: "",
            answers: [
                {
                    text: "Refuse outright",
                    desc: "",
                    effect: { honor: 3, altruism: 2 }
                },
                {
                    text: "Refuse unless the task is justified",
                    desc: "",
                    effect: { honor: 2, lawfulness: 1 }
                },
                {
                    text: "Accept but plan to mitigate harm",
                    desc: "",
                    effect: { honor: 0, altruism: 1 }
                },
                {
                    text: "Accept without hesitation",
                    desc: "",
                    effect: { altruism: -2, honor: -2 }
                }
            ]
        },

        {
            category: "Leadership of Survivors",
            title: "You are given authority over a small group of survivors in a hostile land.",
            context: "",
            answers: [
                {
                    text: "Lead with strict rules and structure",
                    desc: "",
                    effect: { lawfulness: 3, cooperation: 2, honor: 1 }
                },
                {
                    text: "Lead through consensus and discussion",
                    desc: "",
                    effect: { cooperation: 3, altruism: 2 }
                },
                {
                    text: "Let everyone act freely unless danger arises",
                    desc: "",
                    effect: { lawfulness: -2, cooperation: -1 }
                },
                {
                    text: "Take what you need to ensure survival",
                    desc: "",
                    effect: { altruism: -3, honor: -2 }
                }
            ]
        },

        {
            category: "Trust",
            title: "A friend lies to protect you, but the truth comes out later.",
            context: "",
            answers: [
                {
                    text: "Forgive them immediately",
                    desc: "",
                    effect: { cooperation: 3, honor: 2, altruism: 1 }
                },
                {
                    text: "Confront them but remain allies",
                    desc: "",
                    effect: { honor: 2, cooperation: 2 }
                },
                {
                    text: "Trust them less moving forward",
                    desc: "",
                    effect: { cooperation: -1 }
                },
                {
                    text: "Cut ties completely",
                    desc: "",
                    effect: { cooperation: -3, honor: -2 }
                }
            ]
        }
    ];

    // =========================
    // MERGED QUESTIONS
    // =========================
    const questions = [...baseQuestions, ...extraQuestions];

    // =========================
    // STATE
    // =========================
    let currentIndex = 0;
    totalQuestionsEl.textContent = questions.length;

    function loadQuestion(index) {
        const q = questions[index];

        categoryEl.textContent = q.category;
        titleEl.textContent = q.title;
        contextEl.textContent = q.context || "";

        answerButtons.forEach((btn, i) => {
            const answer = q.answers[i];
            btn.querySelector(".answer-title").textContent = answer.text;
            btn.querySelector(".answer-description").textContent = answer.desc || "";

            btn.onclick = () => selectAnswer(answer.effect);
        });

        currentQuestionEl.textContent = index + 1;

        const progress = ((index + 1) / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function selectAnswer(effect) {
        scores.altruism += effect.altruism || 0;
        scores.lawfulness += effect.lawfulness || 0;
        scores.cooperation += effect.cooperation || 0;
        scores.honor += effect.honor || 0;

        nextQuestion();
    }

    function nextQuestion() {
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            loadQuestion(currentIndex);
        } else {
            showResults();
        }
    }

    function prevQuestion() {
        if (currentIndex > 0) {
            currentIndex--;
            loadQuestion(currentIndex);
        }
    }

    prevButton.addEventListener("click", prevQuestion);

    homeButton.addEventListener("click", () => {
        window.location.href = "index.html";
    });

    function showResults() {
        categoryEl.textContent = "Evaluation Complete";
        titleEl.textContent = "Your alignment has been calculated.";

        contextEl.textContent =
            `Altruism: ${scores.altruism}
Lawfulness: ${scores.lawfulness}
Cooperation: ${scores.cooperation}
Honor: ${scores.honor}`;

        document.querySelector(".answers-container").style.display = "none";
    }

    loadQuestion(currentIndex);
});
