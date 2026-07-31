# Migration Notes

This build reconstructs the missing front-end entry from the supplied LifeSimulator archive and retains its simulation, population, species/body-form, token, reaction, dialogue, import, and export engines.

All legacy world-builder branding and metadata identifiers were converted to TableGate identifiers. Painterly generator references that were incomplete in the supplied archive were not required by this standalone build. The system-neutral Map Viewer replaces the former physical-world dependency.

Legacy project data is migrated into the TableGate v6 state schema. Existing entity fields remain readable; new records add a `systemProfile`.
