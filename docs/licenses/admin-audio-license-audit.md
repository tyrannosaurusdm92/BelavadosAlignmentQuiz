# TableGate Admin Audio License Audit

Generated for the TableGate V8 frontend update. The six supplied archives contained **102 audio files**, of which **99 are unique by SHA-256** and **3 exact duplicates were omitted**.

## Safe default

Every imported track is cataloged with `enabledByDefault: false`. The archive contained no README, license file, source URL, or attribution manifest. A filename, creator handle, franchise title, or numeric asset ID is only a search hint; it is not proof that redistribution is permitted. Before enabling a track in a public or distributed TableGate build, record its source page, creator, exact license, required attribution, and whether redistribution inside an application is allowed.

## Classification

- **Freesound filename pattern:** search the exact title and numeric ID on Freesound, then copy the creator and license shown on the asset page. Freesound assets can use different Creative Commons licenses, so the site name alone is not enough.
- **Stock-audio creator/asset-ID pattern:** locate the exact stock-audio page and preserve the permitted-use terms. Do not infer a license from the numeric ID.
- **Commercial soundtrack / fan cover / copyrighted-work title:** treat as non-redistributable unless the rights holder or arranger provides an explicit license covering this use.
- **User-supplied archive:** provenance is unknown. Keep disabled until verified.

## Translated names

Russian `#U####` escape sequences were decoded and the user-facing filenames were translated to English. The original filename and decoded source title remain in `json/admins/audio/admin-audio-catalog.json`. `Сила занобы` appears misspelled or context-specific, so it is preserved as **Sila Zanoby** rather than assigned a speculative translation.

## Exact duplicates omitted

- `Jungle Village  DDTTRPG Music  1 Hour (mp3cut.net).mp3` duplicates `admin-audio-village-in-the-jungle` (`ca5f461f0c605987516e608d55ba9d7f2b483ee30c331991f711cb00fa01c8b5`).
- `ultrasonic-scanning-sound-and-victim-search (1).mp3` duplicates `admin-audio-ultrasonic-scanning-sound-and-victim-search` (`8e72d2539308d5cac656d4088b08e4e80b1f84e92fbde092d1506b1b7836469a`).
- `#U0421#U0446#U0435#U043d#U0430, #U0434#U0432#U0438#U0436!.mp3` duplicates `admin-audio-delicious-in-dungeon-main-theme` (`a395ad76ffdf26576ff1844f026bf50353204abb10be650903201e9f393890fb`).

## Implementation files

- `assets/audio/admin/ambience/` — environmental and place-based loops
- `assets/audio/admin/music/` — musical tracks and soundtrack-like material
- `assets/audio/admin/sfx/` — effects and interface/game cues
- `assets/audio/admin/voice/` — spoken or vocal clips
- `json/admins/audio/admin-audio-catalog.json` — full provenance, translation, hash, duration, and license-status catalog
- `docs/manifests/admin-audio-renames.csv` — drag-and-drop rename map

No audio file exceeds the project’s 24,000 KB per-file limit.
