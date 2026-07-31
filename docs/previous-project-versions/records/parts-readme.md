# Four-Part Release Reconstruction

The release is delivered as four ZIP archives because each requested archive must remain above 80,000 KB and below 100,000 KB.

1. Download all four parts.
2. Extract each archive into the same parent directory.
3. Allow the shared `TableGate_Campaign_Studio_v5` folder to merge. The parts contain disjoint project files and do not overwrite one another.
4. Host the merged folder using a static HTTPS server.
5. Open `TableGate_Campaign_Studio_v5/tablegate.html`.

Do not try to concatenate the ZIP files. Each is an independent, valid archive. The external package manifest and SHA-256 file list every part and verify reconstruction.
