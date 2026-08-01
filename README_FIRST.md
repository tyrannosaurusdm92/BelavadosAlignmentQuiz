# TableGate unified rebuild

Extract all six release archives into the same parent directory. Every archive contains a `TableGate/` root and the paths are non-overlapping. When all six parts are extracted, open `TableGate/tablegate.html` through a local or hosted HTTP server.

Part 1 contains every new or changed file in the rebuild: the merged shell, guarded workspace adapters, current V8 backend source, service worker, direct System Reference and Organizer views, Life Simulator V9 implementation, compiled DOCX specification data, and merge documentation. Parts 2–6 contain only unchanged files recovered from the supplied GitHub source archives.

The authoritative backend target is:

- Deployment: `https://script.google.com/macros/s/AKfycbyTmuPyMg0ueiWAJSEpcrvXlkykD5g4Qo1cb0ybM1WDoTLAW43QG-6mvElxsWFVjx-vpg/exec`
- Apps Script library: `18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr`, version `8`

The old corrupted `js/tablegate` shell was not reused. Only the independently recoverable Creator Forge/tool documents, the nine-system session dependency, and vendor libraries were recovered behind new shell adapters.

Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex · developer of Belavadös Galaxy TTRPG System
