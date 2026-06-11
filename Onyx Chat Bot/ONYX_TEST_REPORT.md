# Emperor Onyx RuleBot Test Report

Generated: 2026-06-08

## Summary

The Onyx Helper Bot package was inspected, patched, and tested with static checks, Node-based functional checks, JSON validation, and local HTTP JSON fetch validation.

## Fixes Applied

- Corrected the JSON directory pull for constellations/night sky from the missing `json/belavados_constellations.json` to the existing `json/belavados_night_sky.json`.
- Fixed RuleBot engine argument order so `Bot.respond(lore, command, state)` receives the command correctly.
- Fixed quest generation so `hook` is defined before being used and JSON quest hooks can be selected safely.
- Fixed command dice results so `numericRolls` are preserved for the GitHub dice animation payload.
- Added `tryLaunchGithubDiceTable()` so chat and panel dice commands use the included GitHub-style 3D dice overlay first, with the solid CSS dice overlay as fallback.
- Added structured JSON lore search over gods, factions, quest hooks, races, provinces, biomes, time conversion, night sky, and alignment data.
- Added natural lore routing so questions like “tell me about the gods,” “show factions,” and “what quests do you know?” search lore instead of falling through to generic help.
- Added broad overflow/buffer CSS hardening so long words, JSON-like terms, tables, cards, chat messages, buttons, and module text wrap instead of flowing out.
- Added `tests/onyx_functionality_test_node.js` for repeatable regression testing.

## Test Results

### Existing smoke test

```json
{
  "ok": true,
  "generatorUiRemoved": true,
  "naturalDiceChatPresent": true,
  "draggableGlobalNavPresent": true,
  "responsiveCssPresent": true,
  "rulebotEngineStillLoads": true,
  "encounterPresets": 278,
  "jsonEncounterDirectory": 511,
  "provinces": 28,
  "diceOverlayPresent": true
}
```

### New functionality regression test

```json
{
  "ok": true,
  "jsonPulls": 15,
  "provinces": 28,
  "gods": 22,
  "factions": 326,
  "questHooks": 797,
  "encounterRecords": 511,
  "diceExpressions": [
    "2d20+5",
    "3d6+2",
    "1d8"
  ],
  "githubDiceNotation": "1d20+1d20",
  "structuredLoreExamples": {
    "gods": [
      "Nebyrr",
      "Raeshkul"
    ],
    "factions": [
      "Mythraelyn Harbor Compact",
      "Thornwillow-Model Civic Guard"
    ],
    "quests": [
      "Question the Root-Hidden Quarantine",
      "Question the Ledger-Bound Quarantine"
    ]
  },
  "overflowPatch": true
}
```

### Local HTTP JSON validation

All 15 JSON paths listed in `window.BELAVADOS_JSON_PULLS` were served from a local HTTP server and parsed successfully.

## Important Limitation

This environment could not render a real browser WebGL canvas, so the live visual dice animation was not visually verified here. The command parser, dice payload generation, file paths, source loading, and fallback integration were tested. Final visual confirmation should be done in Chrome/Edge/Firefox by opening `emperor_onyx_rulebot.html` through a local server or GitHub Pages and trying:

- `roll d20+5 with advantage`
- `roll 2d20+4, 3d6+2 and 1d8`
- `tell me about the gods`
- `show factions in Mythraelyn`
- `lore quest hooks Astraevos`
