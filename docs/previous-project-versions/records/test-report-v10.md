# TableGate 10.0.0 Test Report

## Result

TableGate 10.0.0 passed the reproducible static release suite and the Chromium browser contract suite.

- Static release audit: **18 passed, 0 failed**
- Chromium browser contract suite: **16 passed, 0 failed**
- Supplied backend source preserved byte-for-byte
- Backend catalog: **223 unique actions and 223 matching handlers**
- Knowledge pack: **244 JSON files across 9 systems**, totaling **208,836,941 bytes**
- JavaScript syntax: **131 files passed**
- JSON parsing: all packaged JSON files passed
- Local HTML, CSS, service-worker, manifest, and icon references resolved
- No nested ZIP, 7z, RAR, TAR, GZip, BZip2, or XZ archives are present in the project tree
- No individual project file exceeds the 23 MiB GitHub compatibility threshold

Machine-readable results are in:

- `docs/audits/AUTOMATED_TEST_REPORT_v10.json`
- `docs/audits/BROWSER_CONTRACT_TEST_v10.json`
- `docs/audits/BACKEND_ROUTE_COVERAGE_v10.json`
- `docs/audits/KNOWLEDGE_PACK_AUDIT_v10.json`
- `docs/manifests/FILE_MANIFEST_v10.json`
- `docs/manifests/CODE_USAGE_MANIFEST_v10.json`

The test sources are included at:

- `tests/static_release_audit.py`
- `tests/browser_contract_test.py`

## Browser coverage

The Chromium suite loads the production API compatibility module, the production backend route catalog and Backend Center, and the production knowledge catalog and Knowledge Browser. It verifies:

1. legacy server actions translate to the supplied tablegate actions;
2. legacy response shapes are normalized for the existing UI;
3. password recovery uses the backend's one-time-code flow;
4. system-document operations resolve an attached backend system;
5. the existing Projects and ProjectItems routes persist synchronized workspace data;
6. rules assistance calls the supplied `searchKnowledge` route;
7. all 223 backend actions are visible and executable through the Backend Center;
8. all 244 knowledge files are visible and packaged JSON previews load;
9. the mobile viewport has no major horizontal overflow;
10. no uncaught exception or substantive console error occurs during the suite.

A browser screenshot is retained at `docs/audits/browser_backend_center_v10.png`.

## Backend integrity

`backend/tablegate_backend_v3.gs` is an exact copy of the uploaded backend. Its SHA-256 is:

`8a439d64e740e7f5e8eaf3cdcaa018b2966e7a999cd232742986c3be91accc67`

No replacement backend, proxy backend, alternate database, or mock backend is shipped. Frontend compatibility is implemented in `js/messenger-core.js` by translating legacy names and composing existing supplied routes.

## Live deployment limitation

The isolated build environment could not establish a live connection to the supplied Google Apps Script deployment. The browser suite therefore used browser-only intercepted responses shaped from the supplied Backend V3 source. This validates frontend request translation, UI behavior, persistence composition, route exposure, and responsive behavior, but it does not prove deployment-specific Google account authorization, Drive permissions, quotas, or Apps Script execution permissions.

After uploading, perform this deployment smoke check:

1. serve the extracted `TableGate/` folder over HTTPS or localhost;
2. open `TableGate.html` and confirm the backend health check succeeds;
3. register or sign in with a test account;
4. create a test TableGate, channel, role, invite, project, asset, character, calendar item, and knowledge entry;
5. upload and retrieve a small attachment through the supplied backend;
6. make a public session dice roll and an authorized private chat roll;
7. test password recovery using the emailed one-time code;
8. open Backend Center and run non-destructive `health`, `capabilities`, and list routes;
9. ingest one small Knowledge Pack file and verify it appears in backend knowledge search;
10. delete the test records and inspect the backend audit log.

## Re-running tests

From the extracted `TableGate/` directory:

```bash
python tests/static_release_audit.py
python tests/browser_contract_test.py
```

The browser test requires Python Playwright and an installed Chromium-compatible browser. The static audit requires Python 3 and Node.js.
