document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       BELAVADÖS DEEP ALIGNMENT SYSTEM
       ========================================================= */

    const TOTAL_QUESTIONS = 40;
    let currentIndex = 0;

    const score = {
        altruism: 0,
        lawfulness: 0,
        honor: 0,
        cooperation: 0
    };

    /* =========================================================
       QUESTIONS DATASET (MERGED)
       ========================================================= */

    const questionsDeepModule = {
        version: "deep",
        meta: {
            mode: "Belavadös Deep Alignment Evaluation",
            description:
                "Moral stress response and ethical contradiction evaluation system."
        },
        questions: [
            {
                id: "d1_identity_pressure",
                category: "Crisis Ethics",
                title:
                    "A steam-fog district collapses. Laws forbid entry, but civilians are trapped inside.",
                context:
                    "Officials demand compliance. Lives are at risk.",
                answers: [
                    {
                        text: "Break in and rescue civilians.",
                        desc: "Human life outweighs law.",
                        effect: { altruism: 3, lawfulness: -3, honor: 2 }
                    },
                    {
                        text: "Organize lawful rescue.",
                        desc: "Structure and coordination.",
                        effect: { altruism: 2, lawfulness: 2, cooperation: 3 }
                    },
                    {
                        text: "Follow orders.",
                        desc: "Stability prevents collapse.",
                        effect: { lawfulness: 3, altruism: -2 }
                    },
                    {
                        text: "Exploit chaos for gain.",
                        desc: "Opportunity in disorder.",
                        effect: { altruism: -3, honor: -2 }
                    }
                ]
            },
            {
                id: "d2_loyalty_vs_truth",
                category: "Loyalty Conflict",
                title:
                    "An ally admits a betrayal that saved your life but violated law.",
                context: "Truth vs gratitude conflict emerges.",
                answers: [
                    {
                        text: "Keep their secret.",
                        desc: "Loyalty above law.",
                        effect: { honor: 2, cooperation: 3 }
                    },
                    {
                        text: "Report them.",
                        desc: "Law above personal ties.",
                        effect: { lawfulness: 3 }
                    },
                    {
                        text: "Confront privately.",
                        desc: "Balanced accountability.",
                        effect: { honor: 2, cooperation: 1 }
                    },
                    {
                        text: "Use it as leverage.",
                        desc: "Power over morality.",
                        effect: { honor: -3, cooperation: -2 }
                    }
                ]
            }
        ]
    };

    /* Expand to 40 questions */
    function generateFillerQuestion(index) {
        const themes = [
            "Morality vs Necessity",
            "Justice Under Pressure",
            "Power and Consequence",
            "Truth in Crisis",
            "Sacrifice and Control",
            "Order vs Humanity"
        ];

        return {
            category: themes[index % themes.length],
            title:
                "A complex moral dilemma emerges where every choice creates consequences.",
            context:
                "Multiple factions demand your decision.",
            answers: [
                {
                    text: "Prioritize law and order.",
                    desc: "Stability above all.",
                    effect: { lawfulness: 2 }
                },
                {
                    text: "Prioritize human life.",
                    desc: "Compassion first.",
                    effect: { altruism: 3 }
                },
                {
                    text: "Balance both sides.",
                    desc: "Compromise solution.",
                    effect: { altruism: 1, lawfulness: 1 }
                },
                {
                    text: "Exploit instability.",
                    desc: "Chaos creates advantage.",
                    effect: { honor: -3 }
                }
            ]
        };
    }

    const questionsDeep = [...questionsDeepModule.questions];

    while (questionsDeep.length < TOTAL_QUESTIONS) {
        questionsDeep.push(generateFillerQuestion(questionsDeep.length));
    }

    /* =========================================================
       DOM ELEMENTS
    ========================================================= */

    const titleEl = document.getElementById("question-title");
    const categoryEl = document.getElementById("question-category");
    const contextEl = document.getElementById("question-context");

    const progressBar = document.getElementById("progress-bar");
    const currentQEl = document.getElementById("current-question");

    const answerButtons = document.querySelectorAll(".answer-card");
    const prevBtn = document.getElementById("previous-question");

    /* =========================================================
       RENDER QUESTION
    ========================================================= */

    function renderQuestion(index) {
        const q = questionsDeep[index];

        categoryEl.textContent = q.category;
        titleEl.textContent = q.title;
        contextEl.textContent = q.context || "";

        currentQEl.textContent = index + 1;

        progressBar.style.width =
            `${((index + 1) / TOTAL_QUESTIONS) * 100}%`;

        answerButtons.forEach((btn, i) => {
            btn.querySelector(".answer-title").textContent =
                q.answers[i].text;
            btn.querySelector(".answer-description").textContent =
                q.answers[i].desc;

            btn.onclick = () => selectAnswer(i);
        });
    }

    /* =========================================================
       ANSWERS
    ========================================================= */

    function selectAnswer(answerIndex) {
        const selected = questionsDeep[currentIndex].answers[answerIndex];

        for (const key in selected.effect) {
            score[key] += selected.effect[key];
        }

        nextQuestion();
    }

    function nextQuestion() {
        if (currentIndex < TOTAL_QUESTIONS - 1) {
            currentIndex++;
            renderQuestion(currentIndex);
        } else {
            finishQuiz();
        }
    }

    function prevQuestion() {
        if (currentIndex > 0) {
            currentIndex--;
            renderQuestion(currentIndex);
        }
    }

    prevBtn.addEventListener("click", prevQuestion);

    /* =========================================================
       FINISH
    ========================================================= */

    function finishQuiz() {
        titleEl.textContent = "Alignment Evaluation Complete";
        categoryEl.textContent = "Final Result";

        contextEl.textContent =
            `Altruism: ${score.altruism}, Lawfulness: ${score.lawfulness}, Honor: ${score.honor}, Cooperation: ${score.cooperation}`;

        document.querySelector(".answers-container").innerHTML = `
            <div class="final-screen">
                Your moral profile has been recorded into the Belavadös system.
            </div>
        `;
    }

    /* =========================================================
       INIT
    ========================================================= */

    renderQuestion(currentIndex);

});
