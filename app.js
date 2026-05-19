# /js/app.js

```javascript
import { initializeState, state, setMode, resetQuiz } from './state.js';
import { renderHomePage, renderQuestionPage, renderResultsPage, showLoadingScreen } from './ui.js';
import { shortQuestions } from '../data/questions-short.js';
import { deepQuestions } from '../data/questions-deep.js';
import { calculateAlignmentResult } from './scoring.js';
import { saveQuizState, loadQuizState, clearQuizState } from './storage.js';
import { fadeTransition } from './transitions.js';

const app = document.getElementById('app');

async function bootApplication() {
    showLoadingScreen(app);

    await new Promise(resolve => setTimeout(resolve, 1200));

    initializeState();

    const saved = loadQuizState();

    if (saved) {
        Object.assign(state, saved);
    }

    renderHome();
}

export function renderHome() {
    fadeTransition(app, () => {
        renderHomePage(app, {
            onSelectShort: () => startQuiz('short'),
            onSelectDeep: () => startQuiz('deep')
        });
    });
}

export function startQuiz(mode) {
    resetQuiz();
    setMode(mode);

    state.questions = mode === 'short'
        ? shortQuestions
        : deepQuestions;

    renderCurrentQuestion();
}

export function renderCurrentQuestion() {
    const question = state.questions[state.currentQuestionIndex];

    if (!question) {
        finishQuiz();
        return;
    }

    fadeTransition(app, () => {
        renderQuestionPage(app, {
            question,
            current: state.currentQuestionIndex + 1,
            total: state.questions.length,
            onAnswer: handleAnswer,
            onPrevious: previousQuestion,
            onHome: returnHome,
            mode: state.mode
        });
    });

    saveQuizState(state);
}

function handleAnswer(answer) {
    state.answers.push(answer);

    if (answer.axes) {
        Object.keys(answer.axes).forEach(axis => {
            state.axisScores[axis] += answer.axes[axis];
        });
    }

    state.currentQuestionIndex += 1;

    renderCurrentQuestion();
}

function previousQuestion() {
    if (state.currentQuestionIndex <= 0) {
        renderHome();
        return;
    }

    state.currentQuestionIndex -= 1;

    const removed = state.answers.pop();

    if (removed?.axes) {
        Object.keys(removed.axes).forEach(axis => {
            state.axisScores[axis] -= removed.axes[axis];
        });
    }

    renderCurrentQuestion();
}

function finishQuiz() {
    const result = calculateAlignmentResult(state);

    state.result = result;

    clearQuizState();

    fadeTransition(app, () => {
        renderResultsPage(app, {
            result,
            onRestart: renderHome
        });
    });
}

function returnHome() {
    resetQuiz();
    clearQuizState();
    renderHome();
}

bootApplication();
```

---

# /js/state.js

```javascript
export const state = {
    mode: null,
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    result: null,

    axisScores: {
        altruism: 1500,
        lawfulness: 1500,
        cooperation: 1500,
        honor: 1500
    }
};

export function initializeState() {
    state.mode = null;
    state.currentQuestionIndex = 0;
    state.questions = [];
    state.answers = [];
    state.result = null;

    state.axisScores = {
        altruism: 1500,
        lawfulness: 1500,
        cooperation: 1500,
        honor: 1500
    };
}

export function resetQuiz() {
    initializeState();
}

export function setMode(mode) {
    state.mode = mode;
}
```

---

# /js/router.js

```javascript
export function navigateTo(viewRenderer) {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    viewRenderer();
}
```

---

# /js/scoring.js

```javascript
import { alignmentOutcomes } from '../data/outcomes.js';

function determineAxis(value, positive, neutral, negative) {
    if (value >= 1900) return positive;
    if (value <= 1100) return negative;
    return neutral;
}

export function calculateAlignmentResult(state) {
    const scores = state.axisScores;

    const altruism = determineAxis(
        scores.altruism,
        'Altruistic',
        'Neutral',
        'Selfish'
    );

    const lawfulness = determineAxis(
        scores.lawfulness,
        'Lawful',
        'Neutral',
        'Chaotic'
    );

    const cooperation = determineAxis(
        scores.cooperation,
        'Cooperative',
        'Neutral',
        'Combative'
    );

    const honor = determineAxis(
        scores.honor,
        'Honorable',
        'Neutral',
        'Pragmatic'
    );

    const key = `${lawfulness} ${findArchetype(altruism, cooperation, honor)}`;

    const outcome = alignmentOutcomes[key] || alignmentOutcomes['TRUE NEUTRAL'];

    return {
        title: outcome.title,
        description: outcome.description,
        scores,
        profile: {
            altruism,
            lawfulness,
            cooperation,
            honor
        }
    };
}

function findArchetype(altruism, cooperation, honor) {
    const map = {
        'Selfish-Cooperative-Pragmatic': 'Renegade',
        'Selfish-Cooperative-Neutral': 'Drifter',
        'Selfish-Cooperative-Honorable': 'Champion',

        'Selfish-Neutral-Pragmatic': 'Strategist',
        'Selfish-Neutral-Neutral': 'Knave',
        'Selfish-Neutral-Honorable': 'Avenger',

        'Selfish-Combative-Pragmatic': 'Mercenary',
        'Selfish-Combative-Neutral': 'Marauder',
        'Selfish-Combative-Honorable': 'Gladiator',

        'Neutral-Cooperative-Pragmatic': 'Operator',
        'Neutral-Cooperative-Neutral': 'Collaborator',
        'Neutral-Cooperative-Honorable': 'Harmonizer',

        'Neutral-Neutral-Pragmatic': 'Adapter',
        'Neutral-Neutral-Neutral': 'TRUE NEUTRAL',
        'Neutral-Neutral-Honorable': 'Ethicist',

        'Neutral-Combative-Pragmatic': 'Ravager',
        'Neutral-Combative-Neutral': 'Scoundrel',
        'Neutral-Combative-Honorable': 'Warrior',

        'Altruistic-Cooperative-Pragmatic': 'Coordinator',
        'Altruistic-Cooperative-Neutral': 'Mediator',
        'Altruistic-Cooperative-Honorable': 'Guardian',

        'Altruistic-Neutral-Pragmatic': 'Defender',
        'Altruistic-Neutral-Neutral': 'Arbiter',
        'Altruistic-Neutral-Honorable': 'Sentinel',

        'Altruistic-Combative-Pragmatic': 'Enforcer',
        'Altruistic-Combative-Neutral': 'Vigilante',
        'Altruistic-Combative-Honorable': 'Crusader'
    };

    return map[`${altruism}-${cooperation}-${honor}`] || 'TRUE NEUTRAL';
}
```

---

# /js/ui.js

```javascript
export function showLoadingScreen(container) {
    container.innerHTML = `
        <section class="loading-screen">
            <div class="gear-spinner"></div>
            <h1>Belavadös Alignment Engine</h1>
            <p>Calibrating psychological matrices...</p>
        </section>
    `;
}

export function renderHomePage(container, handlers) {
    container.innerHTML = `
        <section class="home-screen dark-fantasy-panel">
            <div class="hero-banner">
                <h1>Belavadös Alignment System</h1>
                <p>
                    Morality is not static. Identity is forged through action,
                    instinct, loyalty, discipline, sacrifice, and ambition.
                </p>
            </div>

            <div class="mode-grid">
                <button id="short-mode" class="mode-card brass-panel">
                    <h2>Short Assessment</h2>
                    <p>
                        Fast alignment calibration using class identity and classic D&D alignment familiarity.
                    </p>
                </button>

                <button id="deep-mode" class="mode-card crimson-panel">
                    <h2>Deep Psychological Assessment</h2>
                    <p>
                        Full philosophical and behavioral evaluation using Belavadös axis analysis.
                    </p>
                </button>
            </div>
        </section>
    `;

    document.getElementById('short-mode').onclick = handlers.onSelectShort;
    document.getElementById('deep-mode').onclick = handlers.onSelectDeep;
}

export function renderQuestionPage(container, props) {
    const choices = props.question.answers.map((answer, index) => `
        <button class="answer-button" data-index="${index}">
            ${answer.text}
        </button>
    `).join('');

    container.innerHTML = `
        <section class="question-wrapper dark-fantasy-panel">

            <header class="quiz-header">
                <div>
                    <h2>${props.mode === 'short' ? 'Short Alignment Scan' : 'Deep Alignment Evaluation'}</h2>
                    <p>Question ${props.current} of ${props.total}</p>
                </div>

                <div class="progress-shell">
                    <div class="progress-fill" style="width:${(props.current / props.total) * 100}%"></div>
                </div>
            </header>

            <article class="question-card brass-panel">
                <h3>${props.question.prompt}</h3>
                <div class="answers-grid">
                    ${choices}
                </div>
            </article>

            <footer class="navigation-row">
                <button id="previous-btn" class="nav-btn">Previous Page</button>
                <button id="home-btn" class="nav-btn danger-btn">Home Page</button>
            </footer>
        </section>
    `;

    document.querySelectorAll('.answer-button').forEach(button => {
        button.addEventListener('click', () => {
            const selected = props.question.answers[button.dataset.index];
            props.onAnswer(selected);
        });
    });

    document.getElementById('previous-btn').onclick = props.onPrevious;
    document.getElementById('home-btn').onclick = props.onHome;
}

export function renderResultsPage(container, props) {
    const scores = props.result.scores;

    container.innerHTML = `
        <section class="results-screen dark-fantasy-panel">

            <div class="result-banner crimson-panel">
                <h1>${props.result.title}</h1>
                <p>${props.result.description}</p>
            </div>

            <div class="axis-grid">
                <div class="axis-card">
                    <h3>Altruism</h3>
                    <p>${scores.altruism}</p>
                </div>

                <div class="axis-card">
                    <h3>Lawfulness</h3>
                    <p>${scores.lawfulness}</p>
                </div>

                <div class="axis-card">
                    <h3>Cooperation</h3>
                    <p>${scores.cooperation}</p>
                </div>

                <div class="axis-card">
                    <h3>Honor</h3>
                    <p>${scores.honor}</p>
                </div>
            </div>

            <div class="profile-breakdown brass-panel">
                <h2>Psychological Profile</h2>

                <ul>
                    <li><strong>Altruism:</strong> ${props.result.profile.altruism}</li>
                    <li><strong>Lawfulness:</strong> ${props.result.profile.lawfulness}</li>
                    <li><strong>Cooperation:</strong> ${props.result.profile.cooperation}</li>
                    <li><strong>Honor:</strong> ${props.result.profile.honor}</li>
                </ul>
            </div>

            <button id="restart-btn" class="restart-btn">
                Return To Home
            </button>
        </section>
    `;

    document.getElementById('restart-btn').onclick = props.onRestart;
}
```

---

# /js/transitions.js

```javascript
export function fadeTransition(container, callback) {
    container.classList.add('fade-out');

    setTimeout(() => {
        callback();

        container.classList.remove('fade-out');
        container.classList.add('fade-in');

        setTimeout(() => {
            container.classList.remove('fade-in');
        }, 400);

    }, 250);
}
```

---

# /js/storage.js

```javascript
const STORAGE_KEY = 'belavados_alignment_state';

export function saveQuizState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadQuizState() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    return JSON.parse(raw);
}

export function clearQuizState() {
    localStorage.removeItem(STORAGE_KEY);
}
```

---

# /data/questions-short.js

```javascript
export const shortQuestions = [
    {
        prompt: 'Which D&D class best represents your character?',
        answers: [
            {
                text: 'Paladin',
                axes: {
                    altruism: 250,
                    lawfulness: 350,
                    cooperation: 150,
                    honor: 350
                }
            },
            {
                text: 'Rogue',
                axes: {
                    altruism: -250,
                    lawfulness: -150,
                    cooperation: -100,
                    honor: -100
                }
            },
            {
                text: 'Wizard',
                axes: {
                    altruism: 0,
                    lawfulness: 200,
                    cooperation: -50,
                    honor: 100
                }
            },
            {
                text: 'Barbarian',
                axes: {
                    altruism: -100,
                    lawfulness: -300,
                    cooperation: 50,
                    honor: 50
                }
            }
        ]
    },

    {
        prompt: 'Which classic alignment do you usually play?',
        answers: [
            {
                text: 'Lawful Good',
                axes: {
                    altruism: 300,
                    lawfulness: 300,
                    cooperation: 200,
                    honor: 300
                }
            },
            {
                text: 'Chaotic Neutral',
                axes: {
                    altruism: -50,
                    lawfulness: -300,
                    cooperation: -100,
                    honor: -150
                }
            },
            {
                text: 'True Neutral',
                axes: {
                    altruism: 0,
                    lawfulness: 0,
                    cooperation: 0,
                    honor: 0
                }
            },
            {
                text: 'Neutral Evil',
                axes: {
                    altruism: -350,
                    lawfulness: -50,
                    cooperation: -150,
                    honor: -250
                }
            }
        ]
    }
];
```

---

# /data/questions-deep.js

```javascript
export const deepQuestions = [
    {
        prompt: 'A starving village steals from a corrupt noble. What do you do?',
        answers: [
            {
                text: 'Protect the villagers and expose the noble.',
                axes: {
                    altruism: 300,
                    lawfulness: -100,
                    cooperation: 150,
                    honor: 200
                }
            },
            {
                text: 'Punish the thieves. Theft is still theft.',
                axes: {
                    altruism: -100,
                    lawfulness: 300,
                    cooperation: 50,
                    honor: 100
                }
            },
            {
                text: 'Exploit both sides for profit.',
                axes: {
                    altruism: -300,
                    lawfulness: -50,
                    cooperation: -100,
                    honor: -300
                }
            },
            {
                text: 'Negotiate a compromise between both parties.',
                axes: {
                    altruism: 200,
                    lawfulness: 150,
                    cooperation: 250,
                    honor: 150
                }
            }
        ]
    },

    {
        prompt: 'Your ally breaks a sacred oath during battle.',
        answers: [
            {
                text: 'Defend them publicly but confront them privately.',
                axes: {
                    altruism: 200,
                    lawfulness: 100,
                    cooperation: 300,
                    honor: 100
                }
            },
            {
                text: 'Expose their betrayal immediately.',
                axes: {
                    altruism: -50,
                    lawfulness: 250,
                    cooperation: -100,
                    honor: 300
                }
            },
            {
                text: 'Ignore it if it helped secure victory.',
                axes: {
                    altruism: -100,
                    lawfulness: -150,
                    cooperation: 50,
                    honor: -250
                }
            },
            {
                text: 'Use the secret as leverage later.',
                axes: {
                    altruism: -250,
                    lawfulness: -50,
                    cooperation: -200,
                    honor: -350
                }
            }
        ]
    }
];
```

---

# /data/outcomes.js

```javascript
export const alignmentOutcomes = {
    'Lawful Crusader': {
        title: 'Lawful Crusader',
        description: 'A warrior of divine duty guided by discipline, compassion, and unwavering conviction.'
    },

    'Chaotic Vigilante': {
        title: 'Chaotic Vigilante',
        description: 'A feared protector who breaks rules to defend the vulnerable.'
    },

    'Neutral Guardian': {
        title: 'Neutral Guardian',
        description: 'A compassionate protector who values peace, safety, and emotional balance.'
    },

    'TRUE NEUTRAL': {
        title: 'TRUE NEUTRAL',
        description: 'The unmoved center between ideology, chaos, compassion, and ambition.'
    }
};
```

---

# /data/alignments.js

```javascript
export const alignmentAxes = {
    altruism: {
        low: 'Selfish',
        neutral: 'Neutral',
        high: 'Altruistic'
    },

    lawfulness: {
        low: 'Chaotic',
        neutral: 'Neutral',
        high: 'Lawful'
    },

    cooperation: {
        low: 'Combative',
        neutral: 'Neutral',
        high: 'Cooperative'
    },

    honor: {
        low: 'Pragmatic',
        neutral: 'Neutral',
        high: 'Honorable'
    }
};
```

---

# /data/classes.js

```javascript
export const classProfiles = {
    Barbarian: {
        lawfulness: -300,
        honor: 50
    },

    Paladin: {
        altruism: 300,
        lawfulness: 350,
        honor: 300
    },

    Rogue: {
        altruism: -200,
        cooperation: -100
    },

    Wizard: {
        lawfulness: 150,
        cooperation: -50
    }
};
```

---

# /data/world-lore.js

```javascript
export const worldLore = {
    introduction: `
        The Belavadös Alignment System views morality as a living psychological structure.
        Every action reshapes identity.
    `,

    philosophy: `
        Alignment is not destiny.
        It is accumulation.
    `
};
```
