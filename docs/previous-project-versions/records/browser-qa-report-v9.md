# Browser and DOM QA Report

Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex developer of Belavadös Galaxy TTRPG System

Test date: 2026-07-30

## Browser-behavior harness

The standards-oriented DOM/browser harness executed the actual production files:

- `js/tablegate-nine-systems.js`
- `tools/session-dice/js/tablegate-session-bridge.js`
- `js/session-dice-integration.js`
- `css/v5-integrations.css`
- the embedded replacement Session Dice document

Result: **29 of 29 checks passed**.

It verified:

- nine system options and four bot actions per system
- system help and automatic sheet-to-system selection
- completed saved-sheet installation, visible identity, and state preservation
- nested sheet-state message forwarding
- character, campaign, channel, and color metadata on bot roll requests
- exact requested face delivery to the 3D renderer
- player-color 3D material generation
- assertive live-region popup behavior and bot system naming
- phone and tablet responsive breakpoints
- removal of the former sheet filler page and copy

## Full application DOM integration

The mocked authenticated application session in `run_tablegate_tests.mjs` executed the actual script order from `TableGate.html`. It verified the campaign runner view, permission gates, Effects Studio isolation, replacement dice view, nine systems, filled-sheet hydration, user color control, tutorials, Docs, and player read-only/denied states.

## Cloud browser restriction

A visible Chrome session was connected. The browser safety layer rejected workspace-local HTTP and self-contained data URLs before page execution. No production site was deployed because the requested delivery is a set of local release archives and the user did not authorize external publication.

This report does not claim a live cloud-browser page pass. The restriction affects only whether the workspace build can be displayed in that remote browser. Structural, JavaScript, JSON, deterministic rules, iframe bridge, responsive, DOM integration, archive, and reconstruction tests run inside the workspace.
