# Belavadös Life Simulator Test Report

## Revision target
- Race and bloodline generation locked to `Belavados_DnD_Races_Alignment_Pantheon_Compendium_images_replaced.docx`.
- NPC JSON exports include scheduled-activity emojis and image assets.

## Automated checks run

| Check | Result | Detail |
|---|---:|---|
| Race JSON parses | PASS | data/belavados_race_categories.json loaded successfully |
| Race categories equal compendium category index | PASS | found 22 |
| Race entries equal compendium entries | PASS | found 156 |
| Every category count matches compendium index | PASS | all 22 category counts matched |
| Previous additive/invented elf bloodline entries removed | PASS | none found |
| Bloodlines are explicit parsed compendium lists only | PASS | [('Kaluseban', 6), ('Geisamahi', 1), ('Dragonborn', 9)] |
| Dragonborn parentage lineages parsed | PASS | Dragonborn lineages: 9 |
| JavaScript syntax | PASS | node --check passed for core and randomizer |
| Core includes activityImage | PASS | activityImage |
| Core includes activityVisual | PASS | activityVisual |
| Core includes scheduleActivityAssetManifest | PASS | scheduleActivityAssetManifest |
| Core includes ACTIVITY_ASSET_MANIFEST | PASS | ACTIVITY_ASSET_MANIFEST |
| Core includes sanitizeRaceCache | PASS | sanitizeRaceCache |
| Core includes matchRaceBloodline | PASS | matchRaceBloodline |
| Core includes chooseRaceBloodline | PASS | chooseRaceBloodline |
| Activity SVG asset directory exists | PASS | 325 files |
| Emoji SVG assets preserve Unicode emoji | PASS | sleeping icon contains expected emoji |
| Activity asset exists: sleeprest__sleeping.svg | PASS | sleeprest__sleeping.svg |
| Activity asset exists: morningroutine__making_breakfast.svg | PASS | morningroutine__making_breakfast.svg |
| Activity asset exists: traveltransit__boarding_a_train.svg | PASS | traveltransit__boarding_a_train.svg |
| Activity asset exists: socialrelationshipactivities__spending_time_with_spouse.svg | PASS | socialrelationshipactivities__spending_time_with_spouse.svg |
| Activity asset exists: unmapped_imported_activity.svg | PASS | unmapped_imported_activity.svg |
| Transit asset preserved: transit-assets/train.png | PASS | transit-assets/train.png |
| Transit asset preserved: transit-assets/steamship.png | PASS | transit-assets/steamship.png |
| Transit asset preserved: transit-assets/skyship.png | PASS | transit-assets/skyship.png |
| Transit asset preserved: transit-assets/Submarine.png | PASS | transit-assets/Submarine.png |

## Notes
- Browser smoke testing through local HTTP/file URLs was not completed because this environment blocks Chromium navigation to local URLs. Static syntax, JSON, asset, and code-path checks passed.
