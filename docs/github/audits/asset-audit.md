# Asset Audit

## Inventory

The final `assets/` tree contains 1,914 media files totaling 269.7 MB.

| Type | Files |
|---|---:|
| `.ico` | 1 |
| `.jpeg` | 2 |
| `.jpg` | 111 |
| `.mp3` | 9 |
| `.png` | 197 |
| `.svg` | 1,594 |


Assets are limited to the approved image, SVG, and audio branches and are divided by `tablegate`, `admins`, `players`, and `sessions`. No JavaScript, CSS, application JSON, or project documentation remains in `assets/`.

## Duplicate and size checks

- Exact-content duplicate groups across the complete project: **0**.
- Exact duplicate records removed during the final consolidation: **42**.
- Largest asset: `assets/images/admins/effects-studio/backgrounds/example-3-myconid-village.jpg` at 10.9 MB.
- Files above 24,000 KB: **0**.
- Largest number of loose files in any one directory: **301**, below the 900-file limit.

## External token limitation

Prior Creator Forge/LifeSimulator registries described 3,486 race portrait token files under a `token_assets` tree. Those image files were not contained in any supplied release shard. The final active registry retains names and categories but marks each missing token `available: false`, clears the local path, and uses an `external-token://` expected-path identifier. This prevents false local references and preserves the ability to mount the external library later.

## Playback/rendering validation

Static checks verified referenced image, SVG, and audio paths exist after reorganization. Integrated browser smoke tests loaded the workspaces with media requests neutralized to keep the harness deterministic. Actual audio playback and GPU-accelerated visual rendering still require a normal browser and user interaction.
