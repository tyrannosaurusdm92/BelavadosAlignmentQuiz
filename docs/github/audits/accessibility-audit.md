# Accessibility Audit

## Method

The unified shell and five integrated workspaces were parsed for document language, title, viewport metadata, image alternative-text attributes, accessible button names, form-control labels, and duplicate IDs. This is a structural heuristic audit; it is not a substitute for manual keyboard, screen-reader, zoom, motion, contrast, and cognitive-accessibility testing.

| Surface | Lang/title/viewport | Images missing alt | Blank buttons | Unlabeled form controls | Duplicate IDs |
|---|---|---:|---:|---:|---:|
| tablegate-shell | yes | 0 | 0 | 0 | 0 |
| campaign-hub | yes | 0 | 0 | 0 | 0 |
| effects-studio | yes | 0 | 0 | 0 | 0 |
| paint-by-number | yes | 0 | 0 | 0 | 0 |
| session-dice | yes | 0 | 0 | 0 | 0 |
| creator-forge | yes | 0 | 0 | 0 | 0 |

## Confirmed provisions

- The primary document declares `lang="en"`, a title, responsive viewport metadata, and dark color-scheme metadata.
- Authentication fields use visible labels, appropriate input types, autocomplete hints, required states, show-password controls, and a dedicated forgot-password action.
- Major navigation regions, dialogs, map controls, and generated tool frames include labels/titles in the retained implementations.
- Responsive CSS is loaded for the unified shell, and integrated workspaces include their original responsive rules.
- Status and roll-result interfaces use live-region semantics in several active modules.

## Findings requiring manual follow-up

The heuristic counts above can include false positives where a visible label is connected through application-specific scripting instead of native HTML. Conversely, automated parsing cannot prove reading order, focus trapping, color contrast, touch target size, motion safety, or screen-reader quality. Those items should be manually verified on portrait mobile, landscape mobile, tablet, and desktop after deployment.

The boot and brand images intentionally use empty `alt` text because adjacent visible text already identifies TableGate. Empty `alt` is not counted as missing; only absent attributes are reported.
