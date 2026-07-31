# Hamburger Navigation Menu Repair

## Problem corrected

A global overflow-safety rule applied `max-width: 100%` to the floating menu panel. Because that panel lived inside the 75-pixel draggable bubble, some browsers calculated the menu width from the bubble and collapsed the interface into a narrow, tall column.

## New behavior

- Pressing the hamburger opens a true responsive drawer rather than a bubble-constrained popup.
- Desktop layouts use a 410-pixel side drawer with a dimmed backdrop.
- Phone layouts use a near-full-width scrollable menu with safe 10-pixel side insets and room left for the floating hamburger.
- A sticky title bar and large close button remain visible while the menu scrolls.
- Quick-navigation buttons are generated from each sheet’s actual navigation sections.
- The original jump dropdown, Sheet Design dropdown, custom colors, background controls, and reset controls remain intact.
- The draggable hamburger position remains saved per sheet.
- Escape, backdrop click, close button, and section selection all close the menu correctly.
- ARIA expanded/hidden states and keyboard focus are synchronized.

## Coverage

The repair was applied to all nine character sheets and tested in Chromium at 1280×900 and 390×844. All 18 layout/interaction cases passed with no horizontal overflow and no page-specific menu collapse.
