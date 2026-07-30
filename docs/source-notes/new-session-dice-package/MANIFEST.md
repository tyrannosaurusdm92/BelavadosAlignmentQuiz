# Manifest

```json
{
  "project": "Multi-System TTRPG Portal",
  "entrypoint": "roleplaying_board.html",
  "internalPages": [
    "portal",
    "dice-roller",
    "world",
    "ttrpg-server"
  ],
  "systemCount": 9,
  "systems": [
    {
      "id": "dnd",
      "name": "D&D 5e / 5.5e",
      "path": "json/systems/dnd_5e_5_5e_complete_character_reference_v3_all_official_races.json",
      "title": "D&D 5e and 5.5e Complete Character Reference Database",
      "schemaVersion": "1.2.0",
      "sha256": "ca4b07516e2c9da832c4b2d3a478d08ecc93521fb18b006a2a38b29053928405",
      "bytes": 1629808,
      "resolver": "d20 tests, advantage/disadvantage, attacks, saves, death saves"
    },
    {
      "id": "pf2e",
      "name": "Pathfinder 2e Remastered",
      "path": "json/systems/how_to_play_pathfinder_2e_remastered_complete_reference_v2.json",
      "title": "Pathfinder Second Edition Remastered Complete How-to-Play and Character Reference Database",
      "schemaVersion": "2.0.0",
      "sha256": "f98e83f8040d748201e7c89e00452f0d4e3f973d60c30ea2fdcca2102c5d9734",
      "bytes": 548561,
      "resolver": "d20 checks with four degrees of success and natural 20/1 degree shifts"
    },
    {
      "id": "coc7e",
      "name": "Call of Cthulhu 7e",
      "path": "json/systems/how_to_play_coc_7e_complete_reference_v2.json",
      "title": "Call of Cthulhu 7th Edition Complete How-to-Play and Investigator Reference Database",
      "schemaVersion": "2.0.0",
      "sha256": "1993f99b314d29f5374f28fcaa0f7ede1964b420dc23cbbb128a47699219510d",
      "bytes": 271196,
      "resolver": "d100 roll-under with Regular, Hard, Extreme, Critical, Fumble, bonus and penalty dice"
    },
    {
      "id": "gurps4e",
      "name": "GURPS 4e Revised",
      "path": "json/systems/gurps_4e_revised_complete_character_reference_v2.json",
      "title": "GURPS Fourth Edition Revised Complete How-to-Play and Character Reference Database",
      "schemaVersion": "2.0.0",
      "sha256": "e90ad9647f67076fe24d9db557b1305aa58acb516724dc8f268d6fa4005fff88",
      "bytes": 566514,
      "resolver": "3d6 roll-under with success/failure margin and critical results"
    },
    {
      "id": "swade",
      "name": "Savage Worlds SWADE",
      "path": "json/systems/savage_worlds_swade_complete_reference_v2.json",
      "title": "Savage Worlds Adventure Edition Complete Play and Character Reference Database",
      "schemaVersion": "2.0.0",
      "sha256": "bd1d7d8eb6b1db53028e81a52492e9f6ce2c8107d3faf388bf0192d40e18f3de",
      "bytes": 477779,
      "resolver": "Trait Die plus Wild Die, Acing, target numbers, raises, and damage"
    },
    {
      "id": "fate",
      "name": "Fate Core",
      "path": "json/systems/fate_core_complete_how_to_play_reference_v2.json",
      "title": "Fate Core Complete How-to-Play and Rules Reference Database",
      "schemaVersion": "2.0.0",
      "sha256": "fed00c11f50c26ba98201542294fe01ffc8ece9e5f81c2ded42604bd885e7029",
      "bytes": 917972,
      "resolver": "4dF plus skill, opposition, shifts, and outcome ladder"
    },
    {
      "id": "daggerheart",
      "name": "Daggerheart",
      "path": "json/systems/how_to_play_daggerheart_complete_reference_v2.json",
      "title": "Complete Heroic Fantasy Roleplaying Reference Database",
      "schemaVersion": "2.0.0",
      "sha256": "91a84a7c4b95ccb8d710c1da067254912066a1ee735206fbfef9a648ec04c32c",
      "bytes": 997612,
      "resolver": "Hope/Fear Duality Dice, critical matching, difficulty, advantage/disadvantage, adversary rolls"
    },
    {
      "id": "blades",
      "name": "Blades in the Dark",
      "path": "json/systems/how_to_play_blades_in_the_dark_complete_reference_v2.json",
      "title": "Blades in the Dark Complete How-to-Play and Table Engine Reference",
      "schemaVersion": "2.0.0",
      "sha256": "66f98a144e33a194f2e8891d045688b296ac601df7460f8cb90e170f0fafda83",
      "bytes": 357692,
      "resolver": "d6 action pools, zero-die rolls, criticals, resistance and stress"
    },
    {
      "id": "pbta",
      "name": "Powered by the Apocalypse",
      "path": "json/systems/how_to_play_powered_by_the_apocalypse_complete_reference_v2.json",
      "title": "Powered by the Apocalypse Complete Play Reference Database",
      "schemaVersion": "2.0.0",
      "sha256": "07897ea312410ff103c954e49495dc07153c2156d67c9a049dde5eae9bcfc62d",
      "bytes": 1141734,
      "resolver": "classic 2d6 move bands plus implementation-specific exact notation"
    }
  ],
  "runtime": {
    "databaseBundle": "json/ttrpg_system_bundle.js",
    "systemManifest": "json/ttrpg_system_manifest.json",
    "engine": "js/multi-system-engine.js",
    "universalDice": [
      "d2 through d1000000",
      "d%",
      "dF",
      "arithmetic and parentheses",
      "kh/kl/dh/dl",
      "reroll and reroll-once",
      "exploding dice",
      "success/failure counting",
      "d66/d666",
      "repeat expressions"
    ]
  },
  "backend": {
    "endpoint": "https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec",
    "libraryUrl": "https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/6",
    "libraryId": "18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr",
    "libraryVersion": 6,
    "assistantAction": "ttrpg_portal_assistant",
    "campaignSaveAction": "ttrpg_portal_campaign_save"
  },
  "placeholderPolicy": "World and TTRPG Server remain placeholder pages. Their feature bodies were not expanded; only shared navigation/backend labeling is current."
}
```
