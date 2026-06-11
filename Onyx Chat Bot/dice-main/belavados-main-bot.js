"use strict";

/**
 * Belavadös bot bridge for Sarah Rosanna Busch's 3D Dice Roller.
 * This removes swipe as the required trigger and exposes a message/API-driven roll method.
 * The chatbot computes D&D notation, then asks this roller to animate those exact die results.
 * Merged with the no-swipe dice-chat recode: this file is still the iframe bridge,
 * but it accepts simple string rolls, queued programmatic rolls, and parent bot payloads.
 */

window.onkeydown = function(e) {
  if (e.code === "Enter" || e.code === "Escape") {
    e.preventDefault();
  }
};

var main = (function() {
  var that = {};
  var elem = {};
  var box = null;
  var queue = [];
  var rolling = false;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }

  function setResult(html) {
    if (elem.result) elem.result.innerHTML = html;
  }

  function setInputValue(value) {
    if (!elem.textInput) return;
    elem.textInput.value = String(value || '1d20');
    elem.textInput.size = Math.max(1, elem.textInput.value.length);
  }

  function notify(payload) {
    try {
      window.parent && window.parent.postMessage(payload, '*');
    } catch (err) {}
  }

  function expressionFromCommand(input) {
    var value = String(input == null ? '' : input).trim();
    if (!value) return '1d20';
    value = value.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
    if (/^(help|\?|\/help)$/i.test(value)) return '1d20';
    if (/initiative/i.test(value)) {
      var mod = (value.replace(/\s+/g, '').match(/([+-]\d+)$/) || [,''])[1];
      return '1d20' + (mod || '');
    }
    value = value.replace(/^\s*\/roll\s+/i, '').replace(/^\s*roll\s+/i, '').replace(/^\s*please\s+/i, '').replace(/^\s*(can|could) you\s+/i, '');
    var compact = value.toLowerCase().replace(/\s*(?:,|and)\s*/gi, '+').replace(/\s+/g, '');
    var first = compact.search(/\d*d(?:100|20|12|10|8|6|4)/i);
    if (first >= 0) compact = compact.slice(first);
    var match = compact.match(/^(?:\d*d(?:100|20|12|10|8|6|4))(?:\+(?:\d*d(?:100|20|12|10|8|6|4)))*(?:[+-]\d+)?/i);
    return (match ? match[0] : compact || '1d20').replace(/\+\+/g, '+').replace(/\+-/g, '-');
  }

  function normalizePayload(input) {
    if (typeof input === 'string') return { expression: expressionFromCommand(input), displayExpression: input };
    if (input && typeof input === 'object') {
      if (input.command && !input.expression) input.expression = expressionFromCommand(input.command);
      return input;
    }
    return { expression: '1d20' };
  }

  function runNextQueued() {
    if (rolling || !queue.length) return;
    that.rollInput(queue.shift());
  }

  that.init = function() {
    elem.container = $t.id('diceRoller');
    elem.result = $t.id('result');
    elem.textInput = $t.id('textInput');
    elem.numPad = $t.id('numPad');
    elem.instructions = $t.id('instructions');
    elem.center_div = $t.id('center_div');
    elem.diceLimit = $t.id('diceLimit');

    box = new DICE.dice_box(elem.container);
    setInputValue(elem.textInput && elem.textInput.value ? elem.textInput.value : '1d20');
    box.setDice(elem.textInput.value);

    if (elem.textInput) {
      $t.bind(elem.textInput, 'input', function() {
        setInputValue(elem.textInput.value);
        box.setDice(elem.textInput.value || '1d20');
      });
    }

    setResult('<b>3D dice table ready.</b><br><small>The chatbot rolls this table automatically.</small>');
    notify({ type: 'BELAVADOS_DICE_MAIN_READY' });
    while (queue.length) that.rollInput(queue.shift());
  };

  that.rollInput = function(rawPayload) {
    var payload = normalizePayload(rawPayload);
    if (!box) {
      queue.push(payload);
      return;
    }
    if (rolling) {
      queue.push(payload);
      return;
    }

    var expression = String(payload.expression || '1d20').replace(/\s+/g, '');
    if (!expression) expression = '1d20';
    var requested = Array.isArray(payload.requestedResults) ? payload.requestedResults.map(Number).filter(Number.isFinite) : null;
    var displayExpression = payload.displayExpression || expression;
    var displayTotal = Number.isFinite(Number(payload.displayTotal)) ? Number(payload.displayTotal) : null;
    var repeat = payload.repeatLabel || '';

    setInputValue(expression);
    var parsed = DICE.parse_notation(expression);
    if (!parsed || !parsed.set || !parsed.set.length) {
      setResult('<b>Cannot render this notation in the 3D table.</b><br><small>' + esc(displayExpression) + '</small>');
      notify({ type: 'BELAVADOS_DICE_MAIN_ERROR', expression: displayExpression, message: 'No supported dice in expression.' });
      runNextQueued();
      return;
    }
    if (parsed.set.length > 20) {
      if (elem.diceLimit) elem.diceLimit.style.display = 'block';
      setResult('<b>Too many dice for this 3D table.</b><br><small>Showing text result in chat instead.</small>');
      notify({ type: 'BELAVADOS_DICE_MAIN_ERROR', expression: displayExpression, message: 'Too many dice for 3D renderer.' });
      runNextQueued();
      return;
    }

    if (elem.diceLimit) elem.diceLimit.style.display = 'none';
    box.setDice(expression);
    rolling = true;
    setResult('<b>Rolling ' + esc(displayExpression) + '…</b>' + (repeat ? '<br><small>' + esc(repeat) + '</small>' : ''));

    box.start_throw(function(notation) {
      return requested && requested.length ? requested : null;
    }, function(notation) {
      rolling = false;
      var tableLine = notation && notation.resultString ? notation.resultString : '';
      var totalLine = displayTotal === null ? tableLine : '<b>Bot total: ' + esc(displayTotal) + '</b>';
      setResult(totalLine + '<br><small>3D table: ' + esc(tableLine) + '</small>');
      notify({
        type: 'BELAVADOS_DICE_MAIN_RESULT',
        expression: displayExpression,
        renderedExpression: expression,
        displayTotal: displayTotal,
        notation: notation || null
      });
      setTimeout(runNextQueued, 80);
    });
  };

  that.setInput = function() { box && box.setDice(elem.textInput.value || '1d20'); };
  that.clearInput = function() { if (elem.textInput) elem.textInput.value = ''; };
  that.input = function(value) { if (elem.textInput) elem.textInput.value += String(value || ''); };

  window.addEventListener('message', function(event) {
    var data = event.data || {};
    if (!data || data.type !== 'BELAVADOS_DICE_MAIN_ROLL') return;
    that.rollInput(data.payload || data);
  });

  window.BelavadosDiceMain = {
    roll: function(expression, requestedResults, displayTotal) {
      that.rollInput({ expression: expression, requestedResults: requestedResults, displayTotal: displayTotal });
    },
    command: function(commandText) {
      that.rollInput({ command: commandText, displayExpression: commandText });
    }
  };

  return that;
}());
