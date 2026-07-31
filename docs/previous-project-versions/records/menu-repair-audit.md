# Character-sheet hamburger menu repair

The previous bubble-navigation override constrained some sheet menus to a narrow 260-pixel vertical column. Long section labels became unreadable and the floating draggable bubble could intercept attempts to navigate.

The repair is injected into all nine character sheets before they are embedded:

- Fate Core
- GURPS Fourth Edition
- Call of Cthulhu Seventh Edition
- Daggerheart
- Pathfinder Second Edition Remastered
- Powered by the Apocalypse
- Savage Worlds Adventure Edition
- Blades in the Dark
- D&D 5e / 5.5e

## New behavior

- Hamburger opens a viewport-centered dialog/drawer instead of a narrow column.
- Desktop/tablet use a roomy two-column jump grid when space allows.
- Small screens use an accessible bottom sheet.
- Menu background, border, spacing, and large touch targets remain visually integrated with each sheet.
- Backdrop click and Escape close the menu.
- Page scrolling locks only while the menu is open.
- The old bubble drag handler is suppressed while preserving the hamburger button.
- Jump controls are rebuilt from each sheet's section selector, so navigation remains specific to the sheet.
- ARIA expanded state and dialog labeling are updated.

The injected style ID is `tablegateMenuRepairStyles`; the behavioral patch is `tablegateMenuRepairScript`.
