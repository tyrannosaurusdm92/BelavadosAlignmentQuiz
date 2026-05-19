// =============================================
// Belavadös Alignment Quiz - ui.js
// =============================================
// Full UI rendering and interaction layer
// Supports:
// - Homepage
// - Short Quiz
// - Deep Quiz
// - Navigation
// - Progress Tracking
// - Result Rendering
// - Axis Visualization
// - Theme Styling Hooks
// =============================================

import {
  calculateShortQuiz,
  calculateDeepQuiz,
  buildDetailedResult,
  axisToPercent,
  getAlignmentColor
} from './scoring.js';

// =============================================
// ROOT ELEMENTS
// =============================================

const app = document.getElementById('app');

// =============================================
// UI STATE
// =============================================

const uiState = {
  mode: null,
  currentQuestion: 0,
  answers: [],
  shortSelections: {
    selectedClass: null,
    selectedAlignment: null
  },
  currentQuestions: [],
  currentResult: null
};

// =============================================
// INITIALIZE
// =============================================

export function initializeUI() {
  renderHomepage();
}

// =============================================
// HOMEPAGE
// =============================================

export function renderHomepage() {
  app.innerHTML = `
    <section class="homepage-screen fade-in">

      <div class="hero-panel brass-panel">

        <h1 class="main-title">
          Belavadös Alignment System
        </h1>

        <p class="main-subtitle">
          Morality is not destiny.
          It is a living reflection of instinct,
          loyalty, discipline, and sacrifice.
        </p>

        <div class="mode-selection-grid">

          <button class="mode-card short-mode-btn">
            <h2>Short Alignment Quiz</h2>

            <p>
              Select your class and traditional
              D&D alignment for a rapid result.
            </p>

            <span class="mode-length">2 Questions</span>
          </button>

          <button class="mode-card deep-mode-btn">
            <h2>Deep Alignment Analysis</h2>

            <p>
              Explore your philosophy, instincts,
              loyalty, morality, and behavioral identity.
            </p>

            <span class="mode-length">Full Personality Evaluation</span>
          </button>

        </div>

      </div>

    </section>
  `;

  document
    .querySelector('.short-mode-btn')
    .addEventListener('click', startShortQuiz);

  document
    .querySelector('.deep-mode-btn')
    .addEventListener('click', startDeepQuiz);
}

// =============================================
// START SHORT QUIZ
// =============================================

export function startShortQuiz() {
  uiState.mode = 'short';
  uiState.currentQuestion = 0;

  renderShortClassSelection();
}

// =============================================
// CLASS SELECTION
// =============================================

function renderShortClassSelection() {
  const classes = window.CLASSES || [];

  app.innerHTML = `
    <section class="quiz-screen fade-in">

      ${renderNavigation()}

      <div class="question-wrapper brass-panel">

        <h2 class="question-title">
          Select Your Class
        </h2>

        <div class="selection-grid class-grid">
          ${classes
            .map(
              item => `
                <button
                  class="selection-card class-card"
                  data-class="${item.id}"
                >
                  <span class="selection-name">
                    ${item.name}
                  </span>
                </button>
              `
            )
            .join('')}
        </div>

      </div>

    </section>
  `;

  document.querySelectorAll('.class-card').forEach(card => {
    card.addEventListener('click', event => {
      uiState.shortSelections.selectedClass =
        event.currentTarget.dataset.class;

      renderShortAlignmentSelection();
    });
  });

  attachHomeButton();
}

// =============================================
// DND ALIGNMENT SELECTION
// =============================================

function renderShortAlignmentSelection() {
  const alignments = [
    'lawful_good',
    'neutral_good',
    'chaotic_good',
    'lawful_neutral',
    'true_neutral',
    'chaotic_neutral',
    'lawful_evil',
    'neutral_evil',
    'chaotic_evil'
  ];

  app.innerHTML = `
    <section class="quiz-screen fade-in">

      ${renderNavigation(true)}

      <div class="question-wrapper brass-panel">

        <h2 class="question-title">
          Which traditional alignment
          do you identify with most?
        </h2>

        <div class="selection-grid alignment-grid">

          ${alignments
            .map(
              alignment => `
                <button
                  class="selection-card alignment-card"
                  data-alignment="${alignment}"
                >
                  ${formatAlignmentName(alignment)}
                </button>
              `
            )
            .join('')}

        </div>

      </div>

    </section>
  `;

  document.querySelectorAll('.alignment-card').forEach(card => {
    card.addEventListener('click', event => {
      uiState.shortSelections.selectedAlignment =
        event.currentTarget.dataset.alignment;

      finishShortQuiz();
    });
  });

  attachHomeButton();
  attachBackButton(renderShortClassSelection);
}

// =============================================
// FINISH SHORT QUIZ
// =============================================

function finishShortQuiz() {
  const result = calculateShortQuiz(
    uiState.shortSelections
  );

  uiState.currentResult = result;

  renderResults(result);
}

// =============================================
// START DEEP QUIZ
// =============================================

export function startDeepQuiz() {
  uiState.mode = 'deep';
  uiState.currentQuestion = 0;
  uiState.answers = [];

  uiState.currentQuestions =
    window.DEEP_QUESTIONS || [];

  renderDeepQuestion();
}

// =============================================
// RENDER QUESTION
// =============================================

function renderDeepQuestion() {
  const question =
    uiState.currentQuestions[uiState.currentQuestion];

  if (!question) {
    finishDeepQuiz();
    return;
  }

  const progress =
    ((uiState.currentQuestion + 1) /
      uiState.currentQuestions.length) *
    100;

  app.innerHTML = `
    <section class="quiz-screen fade-in">

      ${renderNavigation(uiState.currentQuestion > 0)}

      <div class="progress-wrapper">
        ${renderProgressBar(progress)}
      </div>

      <div class="question-wrapper brass-panel">

        <span class="question-counter">
          Question ${uiState.currentQuestion + 1}
          / ${uiState.currentQuestions.length}
        </span>

        <h2 class="question-title">
          ${question.question}
        </h2>

        <div class="answers-list">

          ${question.answers
            .map(
              (answer, index) => `
                <button
                  class="answer-button"
                  data-index="${index}"
                >
                  ${answer.text}
                </button>
              `
            )
            .join('')}

        </div>

      </div>

    </section>
  `;

  document.querySelectorAll('.answer-button').forEach(button => {
    button.addEventListener('click', event => {
      const index = Number(
        event.currentTarget.dataset.index
      );

      selectDeepAnswer(index);
    });
  });

  attachHomeButton();
  attachBackButton(goToPreviousQuestion);
}

// =============================================
// ANSWER SELECTION
// =============================================

function selectDeepAnswer(answerIndex) {
  const question =
    uiState.currentQuestions[uiState.currentQuestion];

  const selectedAnswer = question.answers[answerIndex];

  uiState.answers[uiState.currentQuestion] = {
    altruism:
      selectedAnswer.altruism || 0,

    lawfulness:
      selectedAnswer.lawfulness || 0,

    cooperation:
      selectedAnswer.cooperation || 0,

    honor:
      selectedAnswer.honor || 0
  };

  uiState.currentQuestion += 1;

  renderDeepQuestion();
}

// =============================================
// PREVIOUS QUESTION
// =============================================

function goToPreviousQuestion() {
  if (uiState.currentQuestion <= 0) {
    renderHomepage();
    return;
  }

  uiState.currentQuestion -= 1;

  renderDeepQuestion();
}

// =============================================
// FINISH DEEP QUIZ
// =============================================

function finishDeepQuiz() {
  const result = calculateDeepQuiz(uiState.answers);

  uiState.currentResult = result;

  renderResults(result);
}

// =============================================
// RESULTS SCREEN
// =============================================

export function renderResults(resultData) {
  const detailed = buildDetailedResult(
    resultData,
    window.ALIGNMENTS || {}
  );

  const color = getAlignmentColor(detailed.title);

  app.innerHTML = `
    <section class="results-screen fade-in">

      ${renderNavigation(true)}

      <div class="result-card brass-panel">

        <span class="result-label">
          Your Belavadös Alignment
        </span>

        <h1
          class="result-title"
          style="color:${color}"
        >
          ${detailed.title}
        </h1>

        <p class="result-description">
          ${detailed.description}
        </p>

        <div class="axis-grid">

          ${renderAxisCard(
            'Altruism',
            detailed.profile.altruism
          )}

          ${renderAxisCard(
            'Lawfulness',
            detailed.profile.lawfulness
          )}

          ${renderAxisCard(
            'Cooperation',
            detailed.profile.cooperation
          )}

          ${renderAxisCard(
            'Honor',
            detailed.profile.honor
          )}

        </div>

        <div class="traits-section">

          <h3>Dominant Traits</h3>

          <div class="traits-list">
            ${detailed.traits
              .map(
                trait => `
                  <span class="trait-pill">
                    ${trait}
                  </span>
                `
              )
              .join('')}
          </div>

        </div>

        <div class="result-actions">

          <button class="restart-btn">
            Return Home
          </button>

          <button class="retry-btn">
            Retake Quiz
          </button>

        </div>

      </div>

    </section>
  `;

  document
    .querySelector('.restart-btn')
    .addEventListener('click', renderHomepage);

  document
    .querySelector('.retry-btn')
    .addEventListener('click', () => {
      if (uiState.mode === 'short') {
        startShortQuiz();
      } else {
        startDeepQuiz();
      }
    });

  attachHomeButton();
  attachBackButton(() => {
    if (uiState.mode === 'short') {
      renderShortAlignmentSelection();
    } else {
      goToPreviousQuestion();
    }
  });
}

// =============================================
// AXIS CARD
// =============================================

function renderAxisCard(label, data) {
  const percentage = axisToPercent(data.value);

  return `
    <div class="axis-card">

      <div class="axis-header">
        <span>${label}</span>
        <span>${data.label}</span>
      </div>

      <div class="axis-bar-wrapper">
        <div
          class="axis-bar-fill"
          style="width:${percentage}%"
        ></div>
      </div>

      <span class="axis-value">
        ${data.value} / 3000
      </span>

    </div>
  `;
}

// =============================================
// PROGRESS BAR
// =============================================

function renderProgressBar(progress) {
  return `
    <div class="progress-bar-shell">

      <div
        class="progress-bar-fill"
        style="width:${progress}%"
      ></div>

    </div>
  `;
}

// =============================================
// NAVIGATION
// =============================================

function renderNavigation(showBack = false) {
  return `
    <nav class="navigation-bar brass-panel">

      <button class="home-btn">
        Home Page
      </button>

      ${
        showBack
          ? `
            <button class="back-btn">
              Previous Page
            </button>
          `
          : ''
      }

    </nav>
  `;
}

// =============================================
// BUTTON HELPERS
// =============================================

function attachHomeButton() {
  const homeButton = document.querySelector('.home-btn');

  if (!homeButton) return;

  homeButton.addEventListener('click', () => {
    renderHomepage();
  });
}

function attachBackButton(callback) {
  const backButton = document.querySelector('.back-btn');

  if (!backButton) return;

  backButton.addEventListener('click', callback);
}

// =============================================
// FORMAT HELPERS
// =============================================

function formatAlignmentName(name) {
  return name
    .split('_')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ');
}

// =============================================
// LOADING SCREEN
// =============================================

export function renderLoadingScreen(text = 'Loading...') {
  app.innerHTML = `
    <section class="loading-screen fade-in">

      <div class="loading-panel brass-panel">

        <div class="spinner"></div>

        <p>${text}</p>

      </div>

    </section>
  `;
}

// =============================================
// ERROR SCREEN
// =============================================

export function renderErrorScreen(message) {
  app.innerHTML = `
    <section class="error-screen fade-in">

      <div class="error-panel brass-panel">

        <h2>System Fault</h2>

        <p>${message}</p>

        <button class="restart-btn">
          Return Home
        </button>

      </div>

    </section>
  `;

  document
    .querySelector('.restart-btn')
    .addEventListener('click', renderHomepage);
}

// =============================================
// THEME UTILITIES
// =============================================

export function applyAlignmentTheme(alignmentName) {
  document.body.classList.remove(
    'theme-lawful',
    'theme-neutral',
    'theme-chaotic'
  );

  if (alignmentName.includes('Lawful')) {
    document.body.classList.add('theme-lawful');
    return;
  }

  if (alignmentName.includes('Chaotic')) {
    document.body.classList.add('theme-chaotic');
    return;
  }

  document.body.classList.add('theme-neutral');
}

// =============================================
// ANIMATION HELPERS
// =============================================

export function pulseElement(selector) {
  const element = document.querySelector(selector);

  if (!element) return;

  element.classList.add('pulse-animation');

  setTimeout(() => {
    element.classList.remove('pulse-animation');
  }, 1000);
}

// =============================================
// GLOBAL EXPORTS
// =============================================

window.BELAVADOS_UI = {
  initializeUI,
  renderHomepage,
  startShortQuiz,
  startDeepQuiz,
  renderResults,
  renderLoadingScreen,
  renderErrorScreen,
  applyAlignmentTheme,
  pulseElement
};
