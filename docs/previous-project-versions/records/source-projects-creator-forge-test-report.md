# TableGate v8 Test Report

Test date: 2026-07-28

## Static application checks

- 48 JavaScript files parsed successfully with `node --check`, plus the root service worker.
- 67 JSON files parsed successfully.
- `tablegate.html` is the only HTML file.
- 56 local script, stylesheet, and image references in the HTML resolve to existing files.
- 317 statically detectable `byId()` / `getElementById()` references resolve to elements in `tablegate.html`.
- No duplicate HTML IDs were found.
- Root structure contains only `tablegate.html`, `service-worker.js`, `css`, `js`, `json`, `assets`, and `docs`.
- No `.bat`, `.cmd`, or `.ps1` launcher files were found.
- No legacy world-builder name was found in the build.
- Front-facing HTML and runtime UI code contain none of the prohibited inspiration names.

## Transit-engine execution test

A direct Node VM test created and exercised a project transit network. It verified:

- eight starter transit types;
- renaming `Airship` to `Skyship` without changing the underlying model;
- three-character and six-character hex normalization;
- a custom `Street Car` type;
- map placement for three stops;
- two differently colored routes and two frequency services;
- a planned journey requiring one transfer;
- a separate journey with a 45-minute NPC/trade/service visit;
- fixed gateway duration calculation;
- route-distance and travel-time summary;
- simulation-based in-service vehicle progress.

Observed execution values:

```json
{
  "defaults": 8,
  "renamedType": "Skyship",
  "customType": "Street Car",
  "stops": 3,
  "routes": 2,
  "services": 2,
  "transfers": 1,
  "visitMinutes": 45,
  "totalMinutes": 185,
  "portalMinutes": 5,
  "vehicleStatus": "in-service",
  "vehicleProgress": 0.476
}
```

## Rules-system integrity

The nine files under `json/systems` were compared against `ttrpg(15).zip`. Every SHA-256 hash matched:

| System file | SHA-256 |
| --- | --- |
| `dnd_5e_5_5e_complete_character_reference_v3_all_official_races.json` | `ca4b07516e2c9da832c4b2d3a478d08ecc93521fb18b006a2a38b29053928405` |
| `fate_core_complete_how_to_play_reference_v2.json` | `fed00c11f50c26ba98201542294fe01ffc8ece9e5f81c2ded42604bd885e7029` |
| `gurps_4e_revised_complete_character_reference_v2.json` | `e90ad9647f67076fe24d9db557b1305aa58acb516724dc8f268d6fa4005fff88` |
| `how_to_play_blades_in_the_dark_complete_reference_v2.json` | `66f98a144e33a194f2e8891d045688b296ac601df7460f8cb90e170f0fafda83` |
| `how_to_play_coc_7e_complete_reference_v2.json` | `1993f99b314d29f5374f28fcaa0f7ede1964b420dc23cbbb128a47699219510d` |
| `how_to_play_daggerheart_complete_reference_v2.json` | `91a84a7c4b95ccb8d710c1da067254912066a1ee735206fbfef9a648ec04c32c` |
| `how_to_play_pathfinder_2e_remastered_complete_reference_v2.json` | `f98e83f8040d748201e7c89e00452f0d4e3f973d60c30ea2fdcca2102c5d9734` |
| `how_to_play_powered_by_the_apocalypse_complete_reference_v2.json` | `07897ea312410ff103c954e49495dc07153c2156d67c9a049dde5eae9bcfc62d` |
| `savage_worlds_swade_complete_reference_v2.json` | `bd1d7d8eb6b1db53028e81a52492e9f6ce2c8107d3faf388bf0192d40e18f3de` |

## Distribution archive validation

- The release was split into two ZIP archives using the shared top-level folder `TableGate`.
- Part 1 contains the application, service worker, CSS, JavaScript, JSON, and documentation.
- Part 2 contains the asset library.
- Both ZIPs passed full compressed-data integrity testing.
- Both ZIPs are below the required 80,000 KB maximum.
- A clean merge extraction produced 1,747 files and 129,087,028 uncompressed bytes.
- The merged extraction matched the build source byte-for-byte with zero missing, extra, or different files.
- The merged package retained exactly one HTML file: `tablegate.html`.

## Browser automation limitation

The container's available Chromium binary did not terminate correctly even for a blank headless page, and a usable Playwright-managed browser was not installed. No browser-render pass is claimed. The static DOM/reference audits, JavaScript and JSON parsing, direct engine execution, archive integrity tests, and manual-source inspection are the recorded verification methods.
