# Life Simulator V9 implementation

The supplied era-agnostic DOCX is implemented as code and compiled data rather than kept as prose-only documentation.

## Implemented contracts

- One-to-three biome layers with positive weights totaling exactly 100%.
- Exact immutable B01–B22 protected percentage tables compiled into `json/admins/lifesimulator/universal-spec-v9.json`.
- All 61 mapped specific biome paths from the DOCX table, each resolving to a protected baseline.
- Weighted blends that retain `sourceProfileId`, `baselinePercent`, `generatedPercent`, contribution weights, and `adjustmentReason` on generated records.
- Scale label and settlement form as independent fields.
- Protected pin colors: Capital `#DC143C`, City `#32FF32`, Town `#FFA500`, Village `#000080`.
- Required scale labels: hamlet, village, tiny town, small town, large town, township, city, metropolis, capital, spaceship, space station, and custom.
- Any era profile, any rules adapter, or explicit no-system mode.
- Functional-location allocation using largest-remainder rounding and the protected scale baselines.
- First-class settings, rules profiles, era profiles, settlements, organizations, scenarios, branches, and adjustment logs.
- Infrastructure/form validation for underwater, mobile, spacecraft, and orbital habitats.
- Full and public-filtered JSON export.
- localStorage compatibility plus IndexedDB full-project persistence.

## Runtime files

- `js/admins/creator-forge/lifesimulator/universal-spec-v9.js`
- `css/admins/creator-forge/lifesimulator/universal-spec-v9.css`
- `json/admins/lifesimulator/universal-spec-v9.json`
- `docs/specifications/TableGate_Life_Simulator_Universal_Setting_System_Era_Agnostic.docx`

The V9 builder is inserted as an eleventh Creator Forge view. It previews the blended protected distribution before generation and preserves the existing Life Simulator project, people, location, map, transit, simulation, dialogue, and export features.
