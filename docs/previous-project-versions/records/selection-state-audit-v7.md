# Character Selection State Audit — v7

The D&D sheet previously allowed dependent race-option state to survive after the main race changed. This could leave a prior option such as “Lorwyn Changeling” visible even when another race was selected.

v7 repairs the state transition itself:

- Edition changes clear race, write-in race, race option, write-in option, and prior generated-stat signature.
- Race changes clear the former race write-in when it is no longer applicable and always clear race option and option write-in.
- Race-option changes clear the prior option write-in unless the new selection is explicitly a write-in.
- Imported race and option values are validated against the active edition catalog before rendering.
- Invalid imported choices are converted to an explicit DM-approved write-in instead of allowing the browser to display the first unrelated option.

A browser audit loaded all nine sheets, changed their primary identity choice or descriptor twice, and confirmed that the saved state reflected the second value. The D&D regression test began with Changeling / Lorwyn Changeling, changed the race to Harengon, and confirmed that the saved race, visible identity summary, race option, and option write-in were all correct.
