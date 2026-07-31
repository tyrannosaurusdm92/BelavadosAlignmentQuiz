# Multi-Part Delivery

The release is split to keep every ZIP below 80,000 KB.

- Part 1 contains `tablegate.html`, `service-worker.js`, `css`, `js`, `json`, and `docs`.
- Part 2 contains the `assets` folder.

Both ZIPs contain the same top-level folder name: `TableGate`. Extract both into the same parent directory and allow folders to merge. No file in Part 2 replaces the single HTML page or JavaScript application.
