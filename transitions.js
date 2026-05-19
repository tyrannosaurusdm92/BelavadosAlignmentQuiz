/* ========================================================================
   transitions.js
   Belavadös Alignment Quiz Transition System
   Dark Fantasy Steampunk UI Motion Controller
   ======================================================================== */

const TRANSITION_DURATION = 450;
const MODAL_DURATION = 280;
const LOADING_DURATION = 1600;

const transitionState = {
    active: false,
    queue: [],
    currentView: null,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
};

/* ========================================================================
   Core Transition Helpers
   ======================================================================== */

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function nextFrame() {
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

function safeElement(elementOrSelector) {
    if (!elementOrSelector) return null;

    if (typeof elementOrSelector === "string") {
        return document.querySelector(elementOrSelector);
    }

    return elementOrSelector;
}

function removeAnimationClasses(element) {
    if (!element) return;

    const classesToRemove = [
        "fade-in",
        "fade-out",
        "slide-in-left",
        "slide-in-right",
        "slide-out-left",
        "slide-out-right",
        "scale-in",
        "scale-out",
        "blur-in",
        "blur-out",
        "steam-rise",
        "ember-pulse",
        "gear-spin",
        "page-enter",
        "page-exit",
        "result-reveal",
        "question-enter",
        "question-exit",
        "nav-glow",
        "shake",
        "flash-gold"
    ];

    element.classList.remove(...classesToRemove);
}

/* ========================================================================
   Generic Animation Engine
   ======================================================================== */

export async function animateElement(
    target,
    animationClass,
    duration = TRANSITION_DURATION
) {
    const element = safeElement(target);

    if (!element) return;

    if (transitionState.reducedMotion) {
        return;
    }

    removeAnimationClasses(element);

    await nextFrame();

    element.classList.add(animationClass);

    return new Promise(resolve => {
        setTimeout(() => {
            element.classList.remove(animationClass);
            resolve();
        }, duration);
    });
}

/* ========================================================================
   View Transition Controller
   ======================================================================== */

export async function transitionView({
    from,
    to,
    enterAnimation = "page-enter",
    exitAnimation = "page-exit",
    duration = TRANSITION_DURATION
}) {
    const fromEl = safeElement(from);
    const toEl = safeElement(to);

    if (!toEl) return;

    if (transitionState.active) {
        transitionState.queue.push(arguments[0]);
        return;
    }

    transitionState.active = true;

    try {

        if (fromEl && !transitionState.reducedMotion) {
            removeAnimationClasses(fromEl);
            fromEl.classList.add(exitAnimation);

            await wait(duration * 0.6);

            fromEl.classList.add("hidden");
            fromEl.classList.remove(exitAnimation);
        }

        toEl.classList.remove("hidden");

        if (!transitionState.reducedMotion) {
            removeAnimationClasses(toEl);

            await nextFrame();

            toEl.classList.add(enterAnimation);

            await wait(duration);

            toEl.classList.remove(enterAnimation);
        }

        transitionState.currentView = toEl.id || null;

    } finally {
        transitionState.active = false;

        if (transitionState.queue.length > 0) {
            const nextTransition = transitionState.queue.shift();
            transitionView(nextTransition);
        }
    }
}

/* ========================================================================
   Quiz Question Transitions
   ======================================================================== */

export async function transitionQuestion({
    oldCard,
    newCard,
    direction = "forward"
}) {
    const oldEl = safeElement(oldCard);
    const newEl = safeElement(newCard);

    if (!newEl) return;

    const outClass =
        direction === "forward"
            ? "slide-out-left"
            : "slide-out-right";

    const inClass =
        direction === "forward"
            ? "slide-in-right"
            : "slide-in-left";

    if (oldEl) {
        oldEl.classList.add(outClass);

        await wait(250);

        oldEl.classList.add("hidden");
        oldEl.classList.remove(outClass);
    }

    newEl.classList.remove("hidden");

    await nextFrame();

    newEl.classList.add(inClass);

    await wait(350);

    newEl.classList.remove(inClass);

    scrollToTopSmooth();
}

/* ========================================================================
   Result Reveal Animation
   ======================================================================== */

export async function revealResult(resultContainer) {
    const container = safeElement(resultContainer);

    if (!container) return;

    container.classList.remove("hidden");

    if (transitionState.reducedMotion) return;

    const title = container.querySelector(".result-title");
    const subtitle = container.querySelector(".result-subtitle");
    const description = container.querySelector(".result-description");
    const stats = container.querySelectorAll(".axis-stat");
    const lore = container.querySelector(".result-lore");

    if (title) {
        await animateElement(title, "scale-in", 350);
    }

    if (subtitle) {
        await animateElement(subtitle, "fade-in", 300);
    }

    if (description) {
        await animateElement(description, "blur-in", 450);
    }

    if (stats.length > 0) {
        for (const stat of stats) {
            stat.classList.add("fade-in");
            await wait(80);
        }

        await wait(350);

        stats.forEach(stat => stat.classList.remove("fade-in"));
    }

    if (lore) {
        await animateElement(lore, "steam-rise", 550);
    }
}

/* ========================================================================
   Loading Screen Controller
   ======================================================================== */

export async function playLoadingSequence({
    loadingScreen = "#loading-screen",
    targetView = null,
    duration = LOADING_DURATION
} = {}) {

    const loader = safeElement(loadingScreen);

    if (!loader) return;

    loader.classList.remove("hidden");

    const gears = loader.querySelectorAll(".gear");
    const sparks = loader.querySelectorAll(".spark");

    gears.forEach(gear => gear.classList.add("gear-spin"));
    sparks.forEach(spark => spark.classList.add("ember-pulse"));

    await wait(duration);

    gears.forEach(gear => gear.classList.remove("gear-spin"));
    sparks.forEach(spark => spark.classList.remove("ember-pulse"));

    await animateElement(loader, "fade-out", 300);

    loader.classList.add("hidden");

    if (targetView) {
        const view = safeElement(targetView);

        if (view) {
            view.classList.remove("hidden");
            await animateElement(view, "fade-in", 350);
        }
    }
}

/* ========================================================================
   Progress Bar Animations
   ======================================================================== */

export function animateProgressBar({
    progressBar,
    percentage
}) {
    const bar = safeElement(progressBar);

    if (!bar) return;

    const safePercent = Math.max(0, Math.min(100, percentage));

    requestAnimationFrame(() => {
        bar.style.width = `${safePercent}%`;
    });

    if (safePercent >= 100) {
        bar.classList.add("flash-gold");

        setTimeout(() => {
            bar.classList.remove("flash-gold");
        }, 800);
    }
}

/* ========================================================================
   Navigation Effects
   ======================================================================== */

export function pulseNavigationButton(button) {
    const btn = safeElement(button);

    if (!btn) return;

    btn.classList.remove("nav-glow");

    requestAnimationFrame(() => {
        btn.classList.add("nav-glow");
    });

    setTimeout(() => {
        btn.classList.remove("nav-glow");
    }, 500);
}

export async function shakeInvalidInput(target) {
    const element = safeElement(target);

    if (!element) return;

    element.classList.add("shake");

    await wait(450);

    element.classList.remove("shake");
}

/* ========================================================================
   Modal & Overlay Transitions
   ======================================================================== */

export async function openModal(modal) {
    const modalEl = safeElement(modal);

    if (!modalEl) return;

    modalEl.classList.remove("hidden");

    await nextFrame();

    modalEl.classList.add("fade-in");
    modalEl.classList.add("scale-in");

    await wait(MODAL_DURATION);

    modalEl.classList.remove("fade-in");
    modalEl.classList.remove("scale-in");
}

export async function closeModal(modal) {
    const modalEl = safeElement(modal);

    if (!modalEl) return;

    modalEl.classList.add("fade-out");
    modalEl.classList.add("scale-out");

    await wait(MODAL_DURATION);

    modalEl.classList.remove("fade-out");
    modalEl.classList.remove("scale-out");

    modalEl.classList.add("hidden");
}

/* ========================================================================
   Home Screen Effects
   ======================================================================== */

export function initializeHomeEffects() {

    const brassPanels = document.querySelectorAll(".brass-panel");
    const steamCards = document.querySelectorAll(".steam-card");
    const quizButtons = document.querySelectorAll(".quiz-mode-btn");

    brassPanels.forEach(panel => {
        panel.addEventListener("mouseenter", () => {
            panel.classList.add("ember-pulse");
        });

        panel.addEventListener("mouseleave", () => {
            panel.classList.remove("ember-pulse");
        });
    });

    steamCards.forEach(card => {
        card.addEventListener("mouseenter", () => {
            card.classList.add("steam-rise");
        });

        card.addEventListener("mouseleave", () => {
            card.classList.remove("steam-rise");
        });
    });

    quizButtons.forEach(button => {
        button.addEventListener("mouseenter", () => {
            button.classList.add("flash-gold");
        });

        button.addEventListener("mouseleave", () => {
            button.classList.remove("flash-gold");
        });
    });
}

/* ========================================================================
   Scroll Utilities
   ======================================================================== */

export function scrollToTopSmooth() {
    window.scrollTo({
        top: 0,
        behavior: transitionState.reducedMotion ? "auto" : "smooth"
    });
}

/* ========================================================================
   Screen Fade Utilities
   ======================================================================== */

export async function fadeIn(target, duration = 350) {
    const element = safeElement(target);

    if (!element) return;

    element.classList.remove("hidden");

    await animateElement(element, "fade-in", duration);
}

export async function fadeOut(target, duration = 350) {
    const element = safeElement(target);

    if (!element) return;

    await animateElement(element, "fade-out", duration);

    element.classList.add("hidden");
}

/* ========================================================================
   Question Choice Effects
   ======================================================================== */

export function bindChoiceHoverEffects() {

    const choices = document.querySelectorAll(
        ".answer-option, .choice-btn"
    );

    choices.forEach(choice => {

        choice.addEventListener("mouseenter", () => {
            choice.classList.add("ember-pulse");
        });

        choice.addEventListener("mouseleave", () => {
            choice.classList.remove("ember-pulse");
        });

        choice.addEventListener("click", async () => {

            choice.classList.add("flash-gold");

            await wait(220);

            choice.classList.remove("flash-gold");
        });
    });
}

/* ========================================================================
   Cinematic Result Entrance
   ======================================================================== */

export async function cinematicResultEntrance({
    resultCard,
    alignmentName,
    axisBars = []
}) {

    const card = safeElement(resultCard);

    if (!card) return;

    card.classList.remove("hidden");

    await animateElement(card, "scale-in", 500);

    const title = card.querySelector(".alignment-name");

    if (title) {
        title.textContent = alignmentName;
        await animateElement(title, "flash-gold", 700);
    }

    for (const bar of axisBars) {

        const element = safeElement(bar);

        if (!element) continue;

        element.style.width = "0%";

        await wait(120);

        const target = element.dataset.value || "50";

        requestAnimationFrame(() => {
            element.style.width = `${target}%`;
        });
    }
}

/* ========================================================================
   Background Ambience Motion
   ======================================================================== */

export function initializeAmbientAnimations() {

    const embers = document.querySelectorAll(".floating-ember");
    const steam = document.querySelectorAll(".steam-column");

    embers.forEach((ember, index) => {
        ember.style.animationDelay = `${index * 0.4}s`;
        ember.classList.add("ember-pulse");
    });

    steam.forEach((column, index) => {
        column.style.animationDelay = `${index * 0.8}s`;
        column.classList.add("steam-rise");
    });
}

/* ========================================================================
   Transition Cleanup
   ======================================================================== */

export function clearAllTransitions() {

    const animatedElements = document.querySelectorAll(`
        .fade-in,
        .fade-out,
        .slide-in-left,
        .slide-in-right,
        .slide-out-left,
        .slide-out-right,
        .scale-in,
        .scale-out,
        .blur-in,
        .blur-out,
        .steam-rise,
        .ember-pulse,
        .gear-spin,
        .page-enter,
        .page-exit,
        .result-reveal,
        .question-enter,
        .question-exit,
        .nav-glow,
        .shake,
        .flash-gold
    `);

    animatedElements.forEach(removeAnimationClasses);
}

/* ========================================================================
   Route Transition Integration
   ======================================================================== */

export async function transitionRoute({
    currentRoute,
    nextRoute
}) {

    const currentEl = document.querySelector(
        `[data-route="${currentRoute}"]`
    );

    const nextEl = document.querySelector(
        `[data-route="${nextRoute}"]`
    );

    await transitionView({
        from: currentEl,
        to: nextEl,
        enterAnimation: "fade-in",
        exitAnimation: "fade-out"
    });
}

/* ========================================================================
   Startup Initialization
   ======================================================================== */

export function initializeTransitions() {

    initializeAmbientAnimations();
    initializeHomeEffects();
    bindChoiceHoverEffects();

    document.body.classList.add("transitions-ready");
}

/* ========================================================================
   Export Default
   ======================================================================== */

export default {
    animateElement,
    transitionView,
    transitionQuestion,
    revealResult,
    playLoadingSequence,
    animateProgressBar,
    pulseNavigationButton,
    shakeInvalidInput,
    openModal,
    closeModal,
    fadeIn,
    fadeOut,
    cinematicResultEntrance,
    transitionRoute,
    initializeTransitions,
    clearAllTransitions,
    scrollToTopSmooth
};
