# TableGate Merge Validation Report

Validation completed on 2026-08-01.

## Passed

- JavaScript syntax validation for every executable JS file
- JSON validation for dossier and manifests
- Static dossier-scope validation
- Browser smoke test:
  - full profile social home and parent navigation bridge
  - Owner, Administrator, Moderator, Player, and Visitor separation
  - channel messaging and direct messaging
  - membership and Player approval review
  - free Group Finder post creation
  - free TableGate group creation and channel creation
  - safety reporting and responsive mobile navigation
- Extended browser feature test:
  - anonymous safety report entry point
  - local public event and venue discovery
  - private incident journal and incident entry flow
- Frontend/backend route audit: all literal frontend route calls resolve to the supplied V8 route registry or its borrowed state-sync actions
- Uploaded backend and the Integrated build's backend reference are byte-identical: 56a06a380ffa50c716518ce9a9edfdb7dd202f92ebde8f1389d14a883d151291
- No backend source is included in the deliverable
- No executable content-authoring or homebrew-system creation studio remains
- No loose folder exceeds 900 files and no file exceeds 24,000,000 bytes

## Network limitation

The Apps Script deployment could not be live-network tested from the build environment. The supplied endpoint and library configuration are preserved, and local browser tests used the shell's Demo API or controlled endpoint responses.
