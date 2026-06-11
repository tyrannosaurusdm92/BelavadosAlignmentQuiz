"use strict";

/**
 * 3D dice roller web app
 * Original dice engine by Sarah Rosanna Busch.
 * Reworked UI: chat-command dice bot, no swipe rolling and no numpad/manual dice-entry roller.
 */

var main = (function() {
    var that = {};
    var elem = {};
    var box = null;

    var state = {
        pendingLabel: "",
        pendingNotation: "",
        pendingOriginalCommand: "",
        maxDice: 20
    };

    that.init = function() {
        elem.container = document.getElementById("diceRoller");
        elem.result = document.getElementById("result");
        elem.center = document.getElementById("center_div");
        elem.instructions = document.getElementById("instructions");
        elem.diceLimit = document.getElementById("diceLimit");
        elem.chatLog = document.getElementById("chatLog");
        elem.chatForm = document.getElementById("chatForm");
        elem.chatInput = document.getElementById("chatInput");
        elem.helpBtn = document.getElementById("helpBtn");

        box = new DICE.dice_box(elem.container);
        box.setDice("1d20");

        elem.chatForm.addEventListener("submit", function(ev) {
            ev.preventDefault();
            handleUserMessage(elem.chatInput.value);
        });

        elem.helpBtn.addEventListener("click", function() {
            addBotMessage(
                "Try: <code>roll 1d20</code>, <code>roll initiative</code>, <code>roll 2d20+4</code>, " +
                "<code>1d6</code>, <code>3d12+4</code>, or <code>roll 1d6, 3d12+4</code>."
            );
            elem.chatInput.focus();
        });

        addBotMessage(
            "Ready. I only roll from chat commands now. Try <code>roll 1d20</code> or <code>roll initiative</code>."
        );
        elem.chatInput.focus();
    };

    function handleUserMessage(rawMessage) {
        var message = (rawMessage || "").trim();
        if (!message) return;

        addUserMessage(message);
        elem.chatInput.value = "";
        elem.diceLimit.hidden = true;

        var parsed = parseChatCommand(message);
        if (!parsed.ok) {
            addBotMessage(parsed.message);
            elem.result.textContent = parsed.plainMessage || "I could not find a dice roll in that message.";
            return;
        }

        var checked = validateNotation(parsed.notation);
        if (!checked.ok) {
            addBotMessage(checked.message);
            elem.result.textContent = checked.plainMessage || "That roll could not be used.";
            return;
        }

        if (box.rolling) {
            addBotMessage("I'm still rolling the last command. Please send the next roll after the dice stop.");
            return;
        }

        state.pendingLabel = parsed.label;
        state.pendingNotation = checked.notation;
        state.pendingOriginalCommand = message;

        box.setDice(checked.notation);
        addBotMessage("Rolling <strong>" + escapeHtml(parsed.label) + "</strong>: <code>" + escapeHtml(checked.displayNotation) + "</code>");
        box.start_throw(beforeRoll, afterRoll);
    }

    function parseChatCommand(message) {
        var cleaned = normalizeCommand(message);
        var lower = cleaned.toLowerCase();

        if (lower === "help" || lower === "?" || lower === "/help") {
            return {
                ok: false,
                plainMessage: "Help shown.",
                message: "Commands I understand: <code>roll 1d20</code>, <code>roll initiative</code>, <code>roll 2d20+4</code>, <code>1d6</code>, and <code>3d12+4</code>."
            };
        }

        if (/\binitiative\b/i.test(cleaned)) {
            var initiativeMod = findTrailingModifier(cleaned);
            return {
                ok: true,
                label: "initiative",
                notation: "1d20" + (initiativeMod || "")
            };
        }

        cleaned = cleaned.replace(/^\s*\/roll\s+/i, "");
        cleaned = cleaned.replace(/^\s*roll\s+/i, "");
        cleaned = cleaned.replace(/^\s*please\s+/i, "");
        cleaned = cleaned.replace(/^\s*can you\s+/i, "");
        cleaned = cleaned.replace(/^\s*could you\s+/i, "");
        cleaned = cleaned.replace(/^\s*roll\s+/i, "");

        var notation = extractNotation(cleaned);
        if (!notation) {
            return {
                ok: false,
                plainMessage: "I could not find a dice roll in that message.",
                message: "I couldn't find a dice roll there. Try <code>roll 1d20</code>, <code>roll initiative</code>, <code>2d20+4</code>, <code>1d6</code>, or <code>3d12+4</code>."
            };
        }

        return {
            ok: true,
            label: notation,
            notation: notation
        };
    }

    function normalizeCommand(message) {
        return String(message)
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
            .replace(/\s+/g, " ")
            .trim();
    }

    function extractNotation(text) {
        var compact = text
            .toLowerCase()
            .replace(/\s*(?:,|\band\b)\s*/gi, "+")
            .replace(/\s+/g, "");

        var diceTerm = "\\d*d(?:100|20|12|10|8|6|4)";
        var firstDice = compact.search(new RegExp(diceTerm, "i"));
        if (firstDice < 0) return "";

        compact = compact.slice(firstDice);

        // Supported shape: dice + optional extra dice + optional final numeric modifier.
        // Examples: d20, 1d20, 2d20+4, 1d6+3d12+4, 1d20-1.
        var expression = new RegExp("^(?:" + diceTerm + ")(?:\\+(?:" + diceTerm + "))*(?:[+-]\\d+)?", "i");
        var match = compact.match(expression);
        if (!match) return "";

        return match[0]
            .replace(/\+\+/g, "+")
            .replace(/\+-/g, "-");
    }

    function findTrailingModifier(text) {
        var match = text.replace(/\s+/g, "").match(/([+-]\d+)$/);
        return match ? match[1] : "";
    }

    function validateNotation(notation) {
        var expandedNotation = expandD100(notation);
        var parsed = DICE.parse_notation(expandedNotation);

        if (parsed.error || parsed.set.length === 0) {
            return {
                ok: false,
                plainMessage: "That dice command is not supported.",
                message: "I can only roll supported dice: <code>d4</code>, <code>d6</code>, <code>d8</code>, <code>d10</code>, <code>d12</code>, <code>d20</code>, and <code>d100</code>."
            };
        }

        if (parsed.set.length > state.maxDice) {
            elem.diceLimit.hidden = false;
            return {
                ok: false,
                plainMessage: "Too many dice. Limit: 20 dice per roll.",
                message: "That's too many dice for one 3D roll. Please roll 20 dice or fewer at a time."
            };
        }

        return {
            ok: true,
            notation: expandedNotation,
            displayNotation: notation
        };
    }

    function expandD100(inputVal) {
        // The dice engine uses a d100 tens die plus a d9 ones die for percentile rolls.
        return inputVal.replace(/(\d*)d100/gi, function(fullMatch, countText) {
            var count = parseInt(countText || "1", 10);
            var extras = [];
            for (var i = 0; i < count; i++) extras.push("d9");
            return fullMatch + "+" + extras.join("+");
        });
    }

    function beforeRoll() {
        elem.instructions.style.display = "none";
        elem.result.textContent = "Rolling " + state.pendingLabel + "...";
        return null;
    }

    function afterRoll(notation) {
        if (notation.result[0] < 0) {
            elem.result.innerHTML = "Oops, your dice fell off the table. Refresh and roll again.";
            addBotMessage("Oops, your dice fell off the table. Please try that roll again.");
            return;
        }

        var totalLine = notation.resultString;
        elem.result.textContent = totalLine;
        addBotMessage(
            "Result for <strong>" + escapeHtml(state.pendingLabel) + "</strong>: <code>" + escapeHtml(totalLine) + "</code>"
        );
    }

    function addUserMessage(message) {
        addMessage("user", escapeHtml(message));
    }

    function addBotMessage(html) {
        addMessage("bot", html);
    }

    function addMessage(type, html) {
        var row = document.createElement("div");
        row.className = "chatMessage " + type;

        var label = document.createElement("div");
        label.className = "chatName";
        label.textContent = type === "user" ? "You" : "Dice Bot";

        var bubble = document.createElement("div");
        bubble.className = "chatBubble";
        bubble.innerHTML = html;

        row.appendChild(label);
        row.appendChild(bubble);
        elem.chatLog.appendChild(row);
        elem.chatLog.scrollTop = elem.chatLog.scrollHeight;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Kept as harmless no-ops so old inline calls or browser autofill quirks cannot trigger rolls.
    that.setInput = function() {};
    that.clearInput = function() {};
    that.input = function() {};

    return that;
}());
