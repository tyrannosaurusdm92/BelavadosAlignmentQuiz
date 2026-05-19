// /js/router.js

import { state, resetQuiz, setMode } from './state.js';
import { shortQuestions } from '../data/questions-short.js';
import { deepQuestions } from '../data/questions-deep.js';

import {
    renderHomePage,
    renderQuestionPage,
    renderResultsPage,
    showLoadingScreen,
    renderErrorPage
} from './ui.js';

import {
    calculateAlignmentResult
} from './scoring.js';

import {
    saveQuizState,
    loadQuizState,
    clearQuizState
} from './storage.js';

import {
    fadeTransition
} from './transitions.js';

const appContainer = document.getElementById('app');



/* ======================================================
   ROUTER STATE
====================================================== */

const routes = {
    home: 'home',
    shortQuiz: 'short-quiz',
    deepQuiz: 'deep-quiz',
    result: 'result',
    loading: 'loading'
};



/* ======================================================
   INITIALIZATION
====================================================== */

export async function initializeRouter() {

    routeTo(routes.loading);

    await new Promise(resolve => setTimeout(resolve, 1200));

    const savedState = loadQuizState();

    if (savedState) {
        Object.assign(state, savedState);

        if (state.result) {
            routeTo(routes.result);
            return;
        }

        if (state.mode === 'short') {
            routeTo(routes.shortQuiz);
            return;
        }

        if (state.mode === 'deep') {
            routeTo(routes.deepQuiz);
            return;
        }
    }

    routeTo(routes.home);
}



/* ======================================================
   MAIN ROUTER
====================================================== */

export function routeTo(routeName) {

    switch (routeName) {

        case routes.loading:
            renderLoadingView();
            break;

        case routes.home:
            renderHomeView();
            break;

        case routes.shortQuiz:
            renderQuizView('short');
            break;

        case routes.deepQuiz:
            renderQuizView('deep');
            break;

        case routes.result:
            renderResultsView();
            break;

        default:
            renderErrorView();
            break;
    }
}



/* ======================================================
   LOADING VIEW
====================================================== */

function renderLoadingView() {

    fadeTransition(appContainer, () => {

        showLoadingScreen(appContainer);

    });
}



/* ======================================================
   HOME VIEW
====================================================== */

function renderHomeView() {

    fadeTransition(appContainer, () => {

        renderHomePage(appContainer, {

            onSelectShort: () => {
                startQuiz('short');
            },

            onSelectDeep: () => {
                startQuiz('deep');
            }

        });

    });
}



/* ======================================================
   START QUIZ
====================================================== */

export function startQuiz(mode) {

    resetQuiz();

    setMode(mode);

    state.questions = mode === 'short'
        ? shortQuestions
        : deepQuestions;

    state.currentQuestionIndex = 0;

    state.answers = [];

    saveQuizState(state);

    if (mode === 'short') {
        routeTo(routes.shortQuiz);
    } else {
        routeTo(routes.deepQuiz);
    }
}



/* ======================================================
   QUIZ VIEW
====================================================== */

function renderQuizView(mode) {

    const currentQuestion =
        state.questions[state.currentQuestionIndex];

    if (!currentQuestion) {

        finalizeQuiz();
        return;
    }

    fadeTransition(appContainer, () => {

        renderQuestionPage(appContainer, {

            question: currentQuestion,

            current: state.currentQuestionIndex + 1,

            total: state.questions.length,

            mode,

            onAnswer: answer => {
                processAnswer(answer);
            },

            onPrevious: () => {
                previousQuestion();
            },

            onHome: () => {
                returnHome();
            }

        });

    });
}



/* ======================================================
   ANSWER PROCESSING
====================================================== */

function processAnswer(answer) {

    state.answers.push(answer);

    if (answer.axes) {

        Object.keys(answer.axes).forEach(axis => {

            state.axisScores[axis] += answer.axes[axis];

        });
    }

    state.currentQuestionIndex += 1;

    saveQuizState(state);

    if (state.mode === 'short') {
        routeTo(routes.shortQuiz);
    } else {
        routeTo(routes.deepQuiz);
    }
}



/* ======================================================
   PREVIOUS QUESTION
====================================================== */

function previousQuestion() {

    if (state.currentQuestionIndex <= 0) {

        routeTo(routes.home);
        return;
    }

    state.currentQuestionIndex -= 1;

    const removedAnswer = state.answers.pop();

    if (removedAnswer?.axes) {

        Object.keys(removedAnswer.axes).forEach(axis => {

            state.axisScores[axis] -= removedAnswer.axes[axis];

        });
    }

    saveQuizState(state);

    if (state.mode === 'short') {
        routeTo(routes.shortQuiz);
    } else {
        routeTo(routes.deepQuiz);
    }
}



/* ======================================================
   FINALIZE QUIZ
====================================================== */

function finalizeQuiz() {

    const result = calculateAlignmentResult(state);

    state.result = result;

    saveQuizState(state);

    routeTo(routes.result);
}



/* ======================================================
   RESULTS VIEW
====================================================== */

function renderResultsView() {

    fadeTransition(appContainer, () => {

        renderResultsPage(appContainer, {

            result: state.result,

            onRestart: () => {

                clearQuizState();

                resetQuiz();

                routeTo(routes.home);
            },

            onHome: () => {

                clearQuizState();

                resetQuiz();

                routeTo(routes.home);
            }

        });

    });
}



/* ======================================================
   HOME RESET
====================================================== */

function returnHome() {

    clearQuizState();

    resetQuiz();

    routeTo(routes.home);
}



/* ======================================================
   ERROR VIEW
====================================================== */

function renderErrorView() {

    fadeTransition(appContainer, () => {

        renderErrorPage(appContainer, {
            title: 'ROUTING FAILURE',
            message:
                'The alignment engine lost its pathway through the brass archives.',
            onReturnHome: () => {
                routeTo(routes.home);
            }
        });

    });
}



/* ======================================================
   BROWSER HISTORY SUPPORT
====================================================== */

window.addEventListener('popstate', () => {

    if (state.result) {
        routeTo(routes.result);
        return;
    }

    if (state.mode === 'short') {
        routeTo(routes.shortQuiz);
        return;
    }

    if (state.mode === 'deep') {
        routeTo(routes.deepQuiz);
        return;
    }

    routeTo(routes.home);
});



/* ======================================================
   PUBLIC NAVIGATION HELPERS
====================================================== */

export function goToHome() {
    routeTo(routes.home);
}

export function goToResults() {
    routeTo(routes.result);
}

export function goToShortQuiz() {
    routeTo(routes.shortQuiz);
}

export function goToDeepQuiz() {
    routeTo(routes.deepQuiz);
}
