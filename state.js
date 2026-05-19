// ======================================================
// state.js
// Belavadös Alignment Quiz State Management System
// Dark Fantasy Steampunk Alignment Engine
// ======================================================

const QuizState = (() => {
    // ==================================================
    // INTERNAL STATE
    // ==================================================

    const DEFAULT_AXIS_VALUE = 1500;
    const MIN_AXIS = 0;
    const MAX_AXIS = 3000;

    const initialState = {
        initialized: false,

        // quiz mode
        mode: null, // "short" or "deep"

        // page routing
        currentPage: "home",
        previousPage: null,

        // question tracking
        currentQuestionIndex: 0,
        totalQuestions: 0,

        // selected data
        selectedClass: null,
        selectedAlignment5E: null,

        // answers
        answers: [],

        // axis values
        axes: {
            altruism: DEFAULT_AXIS_VALUE,
            lawfulness: DEFAULT_AXIS_VALUE,
            cooperation: DEFAULT_AXIS_VALUE,
            honor: DEFAULT_AXIS_VALUE
        },

        // final calculated data
        finalAlignment: null,
        finalTitle: null,
        finalDescription: null,
        finalBreakdown: null,

        // progression
        completed: false,

        // history stack for navigation
        history: [],

        // metadata
        startedAt: null,
        completedAt: null,

        // ui state
        ui: {
            loading: false,
            transitioning: false,
            animationsEnabled: true
        }
    };

    let state = structuredClone(initialState);

    // ==================================================
    // UTILITY FUNCTIONS
    // ==================================================

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function pushHistory() {
        state.history.push({
            currentPage: state.currentPage,
            currentQuestionIndex: state.currentQuestionIndex
        });
    }

    function emitStateUpdate() {
        document.dispatchEvent(
            new CustomEvent("quizStateUpdated", {
                detail: deepClone(state)
            })
        );
    }

    // ==================================================
    // RESET FUNCTIONS
    // ==================================================

    function resetQuiz() {
        state = structuredClone(initialState);

        emitStateUpdate();

        console.log(
            "%c[STATE]",
            "color: #c89b3c;",
            "Quiz state reset."
        );
    }

    function resetQuestionsOnly() {
        state.currentQuestionIndex = 0;
        state.answers = [];

        state.axes = {
            altruism: DEFAULT_AXIS_VALUE,
            lawfulness: DEFAULT_AXIS_VALUE,
            cooperation: DEFAULT_AXIS_VALUE,
            honor: DEFAULT_AXIS_VALUE
        };

        state.finalAlignment = null;
        state.finalTitle = null;
        state.finalDescription = null;
        state.finalBreakdown = null;

        state.completed = false;
        state.completedAt = null;

        emitStateUpdate();
    }

    // ==================================================
    // INITIALIZATION
    // ==================================================

    function initializeQuiz(mode = "short") {
        resetQuiz();

        state.initialized = true;
        state.mode = mode;
        state.startedAt = Date.now();

        emitStateUpdate();

        console.log(
            "%c[STATE]",
            "color: #c89b3c;",
            `Initialized ${mode} quiz mode.`
        );
    }

    // ==================================================
    // MODE MANAGEMENT
    // ==================================================

    function setQuizMode(mode) {
        if (!["short", "deep"].includes(mode)) {
            console.error("Invalid quiz mode:", mode);
            return;
        }

        state.mode = mode;

        emitStateUpdate();
    }

    function getQuizMode() {
        return state.mode;
    }

    // ==================================================
    // PAGE NAVIGATION
    // ==================================================

    function setCurrentPage(pageName) {
        state.previousPage = state.currentPage;

        pushHistory();

        state.currentPage = pageName;

        emitStateUpdate();
    }

    function goBack() {
        if (!state.history.length) return null;

        const previous = state.history.pop();

        state.currentPage = previous.currentPage;
        state.currentQuestionIndex = previous.currentQuestionIndex;

        emitStateUpdate();

        return previous.currentPage;
    }

    function goHome() {
        resetQuiz();

        state.currentPage = "home";

        emitStateUpdate();
    }

    function getCurrentPage() {
        return state.currentPage;
    }

    // ==================================================
    // QUESTION TRACKING
    // ==================================================

    function setTotalQuestions(count) {
        state.totalQuestions = count;

        emitStateUpdate();
    }

    function nextQuestion() {
        state.currentQuestionIndex++;

        emitStateUpdate();
    }

    function previousQuestion() {
        if (state.currentQuestionIndex > 0) {
            state.currentQuestionIndex--;
        }

        emitStateUpdate();
    }

    function setQuestionIndex(index) {
        state.currentQuestionIndex = index;

        emitStateUpdate();
    }

    function getCurrentQuestionIndex() {
        return state.currentQuestionIndex;
    }

    function getProgressPercent() {
        if (!state.totalQuestions) return 0;

        return Math.floor(
            (state.currentQuestionIndex / state.totalQuestions) * 100
        );
    }

    function isLastQuestion() {
        return state.currentQuestionIndex >= state.totalQuestions - 1;
    }

    // ==================================================
    // CLASS + ALIGNMENT SELECTION
    // ==================================================

    function setSelectedClass(className) {
        state.selectedClass = className;

        emitStateUpdate();
    }

    function getSelectedClass() {
        return state.selectedClass;
    }

    function setSelectedAlignment5E(alignment) {
        state.selectedAlignment5E = alignment;

        emitStateUpdate();
    }

    function getSelectedAlignment5E() {
        return state.selectedAlignment5E;
    }

    // ==================================================
    // ANSWER STORAGE
    // ==================================================

    function saveAnswer(questionId, answerData) {
        const existingIndex = state.answers.findIndex(
            answer => answer.questionId === questionId
        );

        const payload = {
            questionId,
            answer: answerData,
            timestamp: Date.now()
        };

        if (existingIndex !== -1) {
            state.answers[existingIndex] = payload;
        } else {
            state.answers.push(payload);
        }

        emitStateUpdate();
    }

    function getAnswer(questionId) {
        return state.answers.find(
            answer => answer.questionId === questionId
        );
    }

    function getAllAnswers() {
        return deepClone(state.answers);
    }

    // ==================================================
    // AXIS MANAGEMENT
    // ==================================================

    function setAxis(axisName, value) {
        if (!(axisName in state.axes)) {
            console.error(`Invalid axis: ${axisName}`);
            return;
        }

        state.axes[axisName] = clamp(
            value,
            MIN_AXIS,
            MAX_AXIS
        );

        emitStateUpdate();
    }

    function modifyAxis(axisName, amount) {
        if (!(axisName in state.axes)) {
            console.error(`Invalid axis: ${axisName}`);
            return;
        }

        state.axes[axisName] = clamp(
            state.axes[axisName] + amount,
            MIN_AXIS,
            MAX_AXIS
        );

        emitStateUpdate();
    }

    function bulkModifyAxes(modifiers = {}) {
        Object.entries(modifiers).forEach(([axis, value]) => {
            if (axis in state.axes) {
                state.axes[axis] = clamp(
                    state.axes[axis] + value,
                    MIN_AXIS,
                    MAX_AXIS
                );
            }
        });

        emitStateUpdate();
    }

    function getAxis(axisName) {
        return state.axes[axisName];
    }

    function getAllAxes() {
        return deepClone(state.axes);
    }

    // ==================================================
    // ALIGNMENT CALCULATION HELPERS
    // ==================================================

    function getAxisCategory(axisName) {
        const value = state.axes[axisName];

        switch (axisName) {
            case "altruism":
                if (value >= 2000) return "Altruistic";
                if (value <= 1000) return "Selfish";
                return "Neutral";

            case "lawfulness":
                if (value >= 2000) return "Lawful";
                if (value <= 1000) return "Chaotic";
                return "Neutral";

            case "cooperation":
                if (value >= 2000) return "Cooperative";
                if (value <= 1000) return "Combative";
                return "Neutral";

            case "honor":
                if (value >= 2000) return "Honorable";
                if (value <= 1000) return "Pragmatic";
                return "Neutral";

            default:
                return "Neutral";
        }
    }

    function getAxisBreakdown() {
        return {
            altruism: {
                value: state.axes.altruism,
                category: getAxisCategory("altruism")
            },

            lawfulness: {
                value: state.axes.lawfulness,
                category: getAxisCategory("lawfulness")
            },

            cooperation: {
                value: state.axes.cooperation,
                category: getAxisCategory("cooperation")
            },

            honor: {
                value: state.axes.honor,
                category: getAxisCategory("honor")
            }
        };
    }

    // ==================================================
    // FINAL RESULT STORAGE
    // ==================================================

    function setFinalResult(resultData = {}) {
        state.finalAlignment = resultData.alignment || null;
        state.finalTitle = resultData.title || null;
        state.finalDescription = resultData.description || null;
        state.finalBreakdown = resultData.breakdown || null;

        state.completed = true;
        state.completedAt = Date.now();

        emitStateUpdate();
    }

    function getFinalResult() {
        return {
            alignment: state.finalAlignment,
            title: state.finalTitle,
            description: state.finalDescription,
            breakdown: state.finalBreakdown
        };
    }

    // ==================================================
    // UI STATE
    // ==================================================

    function setLoading(isLoading) {
        state.ui.loading = isLoading;

        emitStateUpdate();
    }

    function setTransitioning(isTransitioning) {
        state.ui.transitioning = isTransitioning;

        emitStateUpdate();
    }

    function setAnimations(enabled) {
        state.ui.animationsEnabled = enabled;

        emitStateUpdate();
    }

    // ==================================================
    // GETTERS
    // ==================================================

    function getState() {
        return deepClone(state);
    }

    function isQuizCompleted() {
        return state.completed;
    }

    function hasStartedQuiz() {
        return !!state.startedAt;
    }

    // ==================================================
    // PUBLIC API
    // ==================================================

    return {
        // initialization
        initializeQuiz,
        resetQuiz,
        resetQuestionsOnly,

        // mode
        setQuizMode,
        getQuizMode,

        // navigation
        setCurrentPage,
        getCurrentPage,
        goBack,
        goHome,

        // question tracking
        setTotalQuestions,
        nextQuestion,
        previousQuestion,
        setQuestionIndex,
        getCurrentQuestionIndex,
        getProgressPercent,
        isLastQuestion,

        // class + alignment
        setSelectedClass,
        getSelectedClass,
        setSelectedAlignment5E,
        getSelectedAlignment5E,

        // answers
        saveAnswer,
        getAnswer,
        getAllAnswers,

        // axes
        setAxis,
        modifyAxis,
        bulkModifyAxes,
        getAxis,
        getAllAxes,
        getAxisCategory,
        getAxisBreakdown,

        // final results
        setFinalResult,
        getFinalResult,

        // ui
        setLoading,
        setTransitioning,
        setAnimations,

        // state
        getState,
        isQuizCompleted,
        hasStartedQuiz
    };
})();

// ======================================================
// GLOBAL ACCESS
// ======================================================

window.QuizState = QuizState;

// ======================================================
// DEBUGGING HELPERS
// ======================================================

window.debugQuizState = () => {
    console.log(QuizState.getState());
};

console.log(
    "%cBelavadös State Engine Loaded",
    "color: #c89b3c; font-weight: bold;"
);
