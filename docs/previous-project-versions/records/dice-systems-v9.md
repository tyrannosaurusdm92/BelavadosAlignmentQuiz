# TableGate Nine-System Dice Reference

Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex developer of Belavadös Galaxy TTRPG System

The rules implementation is centralized in `js/tablegate-nine-systems.js`. The main session, private runner dice, replacement roleplaying board, and dice bots all call this same engine.

| System | Default dice | Implemented interpretation |
| --- | --- | --- |
| Fate Core | `4d6` represented as four Fate faces | Converts 1–2 to minus, 3–4 to blank, and 5–6 to plus; adds the approach or skill; reports the Fate ladder and optional opposition |
| GURPS Fourth Edition | `3d6` | Roll-under effective skill or attribute, margin of success/failure, and GURPS critical-success/critical-failure thresholds |
| Call of Cthulhu Seventh Edition | `1d100`; extra tens dice for bonus/penalty | Critical, Extreme, Hard, Regular, failure, and fumble tiers against the selected percentile skill |
| Daggerheart | `2d12` | Separates Hope and Fear, adds the modifier, recognizes doubles as a critical success, and compares against difficulty |
| Pathfinder Second Edition Remastered | `1d20` | Four degrees of success against a DC plus the natural-20/natural-1 one-step adjustment |
| Powered by the Apocalypse | `2d6` | Strong hit on 10+, weak hit on 7–9, and miss with advancement on 6 or less |
| Savage Worlds Adventure Edition | trait die plus Wild d6 | Keeps the higher completed die, continues every ace, compares with target number 4 by default, and counts raises |
| Blades in the Dark | action pool d6s | Keeps the highest; zero pool rolls two and keeps the lower; identifies critical, full, partial, and bad outcomes |
| D&D 5e / 5.5e | `1d20` or `2d20` | Normal, advantage, and disadvantage natural die selection, modifier, DC/AC comparison, natural 20, and natural 1 |

## Filled-sheet inference

The engine flattens the selected saved character's `sheetState` or `state` and looks for numeric fields related to the requested action. Explicit text such as `modifier +3`, `DC 18`, `target 12`, `pool 3`, or `d8` wins over inferred sheet fields. The bot never replaces the saved character with a blank template.

## One-result rule

TableGate resolves one result and then reuses it. It does not independently reroll for the bot, animation, message, or popup. `requestedResults` supplies the exact faces to the Three.js renderer.

SWADE aces are the exception only in number of backend calls: maximum results trigger additional authoritative single-die calls until a non-maximum face appears. The combined chain becomes the one shared roll event.

## Rules authority

The engine provides mechanical assistance and concise outcome bands. Campaign rulings, edition options, setting rules, playbook-specific text, consequences, position/effect, and licensed rules wording remain under the campaign runner's authority and the user's own permitted source material.
