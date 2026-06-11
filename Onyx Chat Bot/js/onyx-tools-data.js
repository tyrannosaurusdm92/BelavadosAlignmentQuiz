/* Emperor Onyx quest, encounter, file, and dice tool data. */
window.ONYX_TOOLS_DATA = {
  "biomeTree": [
    {
      "category": "Ocean",
      "subcategories": [
        "Ocean Surface floating settlement",
        "Underwater with reefs",
        "Underwater without reefs"
      ]
    },
    {
      "category": "Plains",
      "subcategories": [
        "Grassland",
        "Prairie",
        "Farming"
      ]
    },
    {
      "category": "Mountains",
      "subcategories": [
        "Mountain range",
        "Valley",
        "Deep cavern"
      ]
    },
    {
      "category": "Forest",
      "subcategories": [
        "Deep forest",
        "Partial forest",
        "Treetops - treehouses",
        "Marshes and swamps"
      ]
    },
    {
      "category": "Hybrid",
      "subcategories": [
        "Beach and grass with water",
        "Beach and reefs with water",
        "Hybrid tree and forest floor",
        "Hybrid farming forest grassland"
      ]
    }
  ],
  "biomeProfiles": {
    "Ocean Surface floating settlement": {
      "env": [
        "Town",
        "Road",
        "Wilderness"
      ],
      "hazards": [
        "swaying rope bridges",
        "salt-fog ambush",
        "dockside crowd panic",
        "ship hull fire",
        "contraband inspection"
      ],
      "locations": [
        "retired pirate-ship plaza",
        "ferry office",
        "steamship berth",
        "floating market",
        "harbor watch mast"
      ],
      "questMotifs": [
        "missing cargo",
        "pirate debt",
        "ferry sabotage",
        "rope-bridge chase",
        "harbor treaty dispute"
      ]
    },
    "Underwater with reefs": {
      "env": [
        "Swamp",
        "Wilderness",
        "Underground"
      ],
      "hazards": [
        "reef maze",
        "air-pocket collapse",
        "predator silhouette",
        "glowing coral curse",
        "submarine pressure leak"
      ],
      "locations": [
        "reef shrine",
        "submarine terminal",
        "bubble-glass market",
        "kelp garden",
        "sunken archive"
      ],
      "questMotifs": [
        "stolen pearl ledger",
        "reef spirit bargain",
        "submarine distress signal",
        "missing diver",
        "coral blight"
      ]
    },
    "Underwater without reefs": {
      "env": [
        "Swamp",
        "Wilderness",
        "Underground"
      ],
      "hazards": [
        "open black water",
        "crushing depth",
        "lost beacon",
        "silent current",
        "predator from below"
      ],
      "locations": [
        "deep beacon station",
        "submarine lock",
        "pressure gate",
        "abyssal watch room",
        "salvage cage"
      ],
      "questMotifs": [
        "sunken vault recovery",
        "lost submarine crew",
        "abyssal cult sign",
        "forbidden trench map",
        "deep-current smuggling"
      ]
    },
    "Grassland": {
      "env": [
        "Wilderness",
        "Road"
      ],
      "hazards": [
        "open sightlines",
        "stampede",
        "grassfire",
        "hidden sinkhole",
        "raider outriders"
      ],
      "locations": [
        "caravan yard",
        "windmill farm",
        "road shrine",
        "market tent",
        "watch hill"
      ],
      "questMotifs": [
        "missing caravan",
        "farm tithe dispute",
        "prairie monster trail",
        "rail survey conflict",
        "windmill sabotage"
      ]
    },
    "Prairie": {
      "env": [
        "Wilderness",
        "Road"
      ],
      "hazards": [
        "sudden storm",
        "tall-grass ambush",
        "dry creek trap",
        "territorial herd",
        "long-range pursuers"
      ],
      "locations": [
        "waystation",
        "prairie shrine",
        "ranger post",
        "grain depot",
        "herder camp"
      ],
      "questMotifs": [
        "escort across open land",
        "ranger rivalry",
        "runaway herd",
        "buried boundary marker",
        "old war road"
      ]
    },
    "Farming": {
      "env": [
        "Town",
        "Road",
        "Wilderness"
      ],
      "hazards": [
        "burning granary",
        "poisoned well",
        "scarecrow omen",
        "mud-choked lane",
        "crop blight"
      ],
      "locations": [
        "grainhouse",
        "orchard",
        "dairy yard",
        "farm temple",
        "mill bridge"
      ],
      "questMotifs": [
        "crop theft",
        "family feud",
        "blight cure",
        "tax collector scandal",
        "haunted harvest"
      ]
    },
    "Mountain range": {
      "env": [
        "Mountain",
        "Dungeon",
        "Wilderness"
      ],
      "hazards": [
        "rockslide",
        "thin ledge",
        "ice wind",
        "elevator failure",
        "echoing pass"
      ],
      "locations": [
        "cliff lift",
        "ore bridge",
        "watch fort",
        "skyship mast",
        "switchback shrine"
      ],
      "questMotifs": [
        "lost climbers",
        "mine claim dispute",
        "skyship crash",
        "avalanche warning",
        "mountain spirit oath"
      ]
    },
    "Valley": {
      "env": [
        "Mountain",
        "Wilderness",
        "Road"
      ],
      "hazards": [
        "flooded pass",
        "fog bank",
        "bandit overlook",
        "bridge collapse",
        "echoing horns"
      ],
      "locations": [
        "valley market",
        "river mill",
        "orchard village",
        "caravan gate",
        "watchtower"
      ],
      "questMotifs": [
        "bridge toll war",
        "valley border dispute",
        "missing orchard workers",
        "river curse",
        "sealed pass"
      ]
    },
    "Deep cavern": {
      "env": [
        "Underground",
        "Dungeon",
        "Mountain"
      ],
      "hazards": [
        "gas pocket",
        "unstable lift",
        "fungal spores",
        "blind drop",
        "echo-lured ambush"
      ],
      "locations": [
        "ore elevator",
        "mushroom bazaar",
        "cavern temple",
        "forge hall",
        "subterranean rail stop"
      ],
      "questMotifs": [
        "mine sabotage",
        "fungal plague",
        "lost drill crew",
        "underroad toll",
        "sealed ancestral door"
      ]
    },
    "Deep forest": {
      "env": [
        "Forest",
        "Wilderness"
      ],
      "hazards": [
        "living roots",
        "low visibility",
        "territorial spirits",
        "webbed path",
        "false trail"
      ],
      "locations": [
        "moss shrine",
        "hunter lodge",
        "canopy watch",
        "fallen ruin",
        "herbalist hut"
      ],
      "questMotifs": [
        "missing hunters",
        "spirit bargain",
        "sacred grove trespass",
        "beast migration",
        "cursed trail"
      ]
    },
    "Partial forest": {
      "env": [
        "Forest",
        "Road",
        "Wilderness"
      ],
      "hazards": [
        "broken tree line",
        "ambush at field edge",
        "thorn hedge",
        "smoke drift",
        "wildlife stampede"
      ],
      "locations": [
        "woodcutters camp",
        "half-hidden shrine",
        "road inn",
        "edge market",
        "forager hut"
      ],
      "questMotifs": [
        "logging dispute",
        "lost child",
        "forest boundary feud",
        "fey prank debt",
        "roadside disappearance"
      ]
    },
    "Treetops - treehouses": {
      "env": [
        "Forest",
        "Town",
        "Wilderness"
      ],
      "hazards": [
        "rope bridge snap",
        "falling platform",
        "canopy fog",
        "territorial birds",
        "vertical chase"
      ],
      "locations": [
        "canopy inn",
        "branch market",
        "sky-rope gate",
        "tree shrine",
        "watch nest"
      ],
      "questMotifs": [
        "stolen bridge pins",
        "canopy election dispute",
        "missing glider",
        "treehouse arson",
        "bird-rider warning"
      ]
    },
    "Marshes and swamps": {
      "env": [
        "Swamp",
        "Forest",
        "Wilderness"
      ],
      "hazards": [
        "sinking mud",
        "poison gas",
        "insect swarm",
        "bog lights",
        "flooded trail"
      ],
      "locations": [
        "stilt inn",
        "reed shrine",
        "boat ferry",
        "bog apothecary",
        "sunken causeway"
      ],
      "questMotifs": [
        "swamp fever cure",
        "ferry ghost",
        "bog iron rights",
        "corpse caravan",
        "will-o-wisp bargain"
      ]
    },
    "Beach and grass with water": {
      "env": [
        "Road",
        "Town",
        "Wilderness",
        "Swamp"
      ],
      "hazards": [
        "storm surge",
        "sandbar trap",
        "gull alarm",
        "tide cut-off",
        "smuggler signal"
      ],
      "locations": [
        "beach market",
        "grass bluff inn",
        "ferry dock",
        "salt farm",
        "watch bonfire"
      ],
      "questMotifs": [
        "washed-up evidence",
        "smuggler route",
        "festival sabotage",
        "missing fisher",
        "tide shrine oath"
      ]
    },
    "Beach and reefs with water": {
      "env": [
        "Swamp",
        "Wilderness",
        "Town"
      ],
      "hazards": [
        "razor reef",
        "hidden tidepool predator",
        "slick stones",
        "reef maze",
        "sudden fog"
      ],
      "locations": [
        "reef lighthouse",
        "shell market",
        "diver camp",
        "beach shrine",
        "salvage dock"
      ],
      "questMotifs": [
        "reef salvage claim",
        "lost diver",
        "lighthouse conspiracy",
        "shell tax dispute",
        "reef guardian anger"
      ]
    },
    "Hybrid tree and forest floor": {
      "env": [
        "Forest",
        "Town",
        "Wilderness"
      ],
      "hazards": [
        "split-level ambush",
        "falling cargo net",
        "root maze",
        "canopy alarm",
        "shadowed underwalk"
      ],
      "locations": [
        "root market",
        "branch tavern",
        "forest-floor clinic",
        "lift tree",
        "moss library"
      ],
      "questMotifs": [
        "upper-lower district rivalry",
        "broken lift",
        "root sickness",
        "canopy thief",
        "hidden floor shrine"
      ]
    },
    "Hybrid farming forest grassland": {
      "env": [
        "Forest",
        "Road",
        "Wilderness",
        "Town"
      ],
      "hazards": [
        "field-to-wood ambush",
        "crop blight",
        "wild hedge maze",
        "barn fire",
        "animal panic"
      ],
      "locations": [
        "farm grove",
        "forest mill",
        "grain shrine",
        "orchard tavern",
        "ranger granary"
      ],
      "questMotifs": [
        "blighted grove",
        "ranger farmer feud",
        "grain theft",
        "forest edge monster",
        "harvest treaty"
      ]
    }
  },
  "encounterPresets": [
    {
      "name": "Aarakocra",
      "type": "humanoid",
      "cr": "1/4",
      "hp": 9,
      "ac": 12,
      "init": 0,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🪽",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Aboleth",
      "type": "aberration",
      "cr": "10",
      "hp": 150,
      "ac": 16,
      "init": 0,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🧠",
      "env": [
        "Underground",
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 10; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Acolyte",
      "type": "humanoid",
      "cr": "1/4",
      "hp": 9,
      "ac": 12,
      "init": 0,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🕯️",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Adult Black Dragon",
      "type": "dragon",
      "cr": "14",
      "hp": 241,
      "ac": 18,
      "init": 2,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🐉",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 14; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Adult Blue Dragon",
      "type": "dragon",
      "cr": "16",
      "hp": 316,
      "ac": 19,
      "init": 2,
      "atk": 12,
      "dmg": "6d10+7",
      "icon": "🐉",
      "env": [
        "Wilderness",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 16; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Adult Green Dragon",
      "type": "dragon",
      "cr": "15",
      "hp": 316,
      "ac": 19,
      "init": 2,
      "atk": 12,
      "dmg": "6d10+7",
      "icon": "🐉",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 15; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Adult Red Dragon",
      "type": "dragon",
      "cr": "17",
      "hp": 316,
      "ac": 19,
      "init": 2,
      "atk": 12,
      "dmg": "6d10+7",
      "icon": "🐉",
      "env": [
        "Mountain",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 17; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Adult White Dragon",
      "type": "dragon",
      "cr": "13",
      "hp": 241,
      "ac": 18,
      "init": 2,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🐉",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 13; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Air Elemental",
      "type": "elemental",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🌪️",
      "env": [
        "Mountain",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ancient Black Dragon",
      "type": "dragon",
      "cr": "21",
      "hp": 482,
      "ac": 21,
      "init": 2,
      "atk": 15,
      "dmg": "8d12+10",
      "icon": "🐲",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 21; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ancient Blue Dragon",
      "type": "dragon",
      "cr": "23",
      "hp": 482,
      "ac": 21,
      "init": 2,
      "atk": 15,
      "dmg": "8d12+10",
      "icon": "🐲",
      "env": [
        "Wilderness",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 23; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ancient Green Dragon",
      "type": "dragon",
      "cr": "22",
      "hp": 482,
      "ac": 21,
      "init": 2,
      "atk": 15,
      "dmg": "8d12+10",
      "icon": "🐲",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 22; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ancient Red Dragon",
      "type": "dragon",
      "cr": "24",
      "hp": 482,
      "ac": 21,
      "init": 2,
      "atk": 15,
      "dmg": "8d12+10",
      "icon": "🐲",
      "env": [
        "Mountain",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 24; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ancient White Dragon",
      "type": "dragon",
      "cr": "20",
      "hp": 482,
      "ac": 21,
      "init": 2,
      "atk": 15,
      "dmg": "8d12+10",
      "icon": "🐲",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 20; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Animated Armor",
      "type": "construct",
      "cr": "1",
      "hp": 29,
      "ac": 14,
      "init": -1,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🛡️",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ankheg",
      "type": "monstrosity",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🪲",
      "env": [
        "Wilderness",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ape",
      "type": "beast",
      "cr": "1/2",
      "hp": 18,
      "ac": 11,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🦍",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Archmage",
      "type": "humanoid",
      "cr": "12",
      "hp": 189,
      "ac": 17,
      "init": 0,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🧙",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 12; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Assassin",
      "type": "humanoid",
      "cr": "8",
      "hp": 135,
      "ac": 16,
      "init": 0,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🗡️",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Awakened Shrub",
      "type": "plant",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": -1,
      "atk": 2,
      "dmg": "1",
      "icon": "🌿",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Awakened Tree",
      "type": "plant",
      "cr": "2",
      "hp": 45,
      "ac": 12,
      "init": -1,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🌳",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Axe Beak",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐦",
      "env": [
        "Wilderness",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Baboon",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🐒",
      "env": [
        "Wilderness",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Badger",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🦡",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Balor",
      "type": "fiend",
      "cr": "19",
      "hp": 275,
      "ac": 18,
      "init": 2,
      "atk": 12,
      "dmg": "6d10+7",
      "icon": "🔥",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 19; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Bandit",
      "type": "humanoid",
      "cr": "1/8",
      "hp": 6,
      "ac": 11,
      "init": 0,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🗡️",
      "env": [
        "Town",
        "Road",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Bandit Captain",
      "type": "humanoid",
      "cr": "2",
      "hp": 40,
      "ac": 13,
      "init": 0,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "⚔️",
      "env": [
        "Town",
        "Road",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Banshee",
      "type": "undead",
      "cr": "4",
      "hp": 67,
      "ac": 14,
      "init": -1,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "👻",
      "env": [
        "Dungeon",
        "Forest",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Barbed Devil",
      "type": "fiend",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "😈",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Basilisk",
      "type": "monstrosity",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🦎",
      "env": [
        "Dungeon",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Bat",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🦇",
      "env": [
        "Dungeon",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Bearded Devil",
      "type": "fiend",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "😈",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Behir",
      "type": "monstrosity",
      "cr": "11",
      "hp": 210,
      "ac": 17,
      "init": 2,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🐍",
      "env": [
        "Mountain",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 11; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Black Bear",
      "type": "beast",
      "cr": "1/2",
      "hp": 18,
      "ac": 11,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🐻",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Blink Dog",
      "type": "fey",
      "cr": "1/4",
      "hp": 9,
      "ac": 12,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐕",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Blood Hawk",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🦅",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Boar",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐗",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Bone Devil",
      "type": "fiend",
      "cr": "9",
      "hp": 150,
      "ac": 16,
      "init": 2,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "☠️",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 9; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Brown Bear",
      "type": "beast",
      "cr": "1",
      "hp": 26,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🐻",
      "env": [
        "Forest",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Bugbear",
      "type": "humanoid",
      "cr": "1",
      "hp": 23,
      "ac": 13,
      "init": 0,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🪓",
      "env": [
        "Dungeon",
        "Forest",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Bulette",
      "type": "monstrosity",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🦈",
      "env": [
        "Wilderness",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Camel",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🐫",
      "env": [
        "Wilderness",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Cat",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🐈",
      "env": [
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Centaur",
      "type": "monstrosity",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🏹",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Chain Devil",
      "type": "fiend",
      "cr": "8",
      "hp": 150,
      "ac": 16,
      "init": 2,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "⛓️",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Chimera",
      "type": "monstrosity",
      "cr": "6",
      "hp": 110,
      "ac": 15,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🦁",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 6; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Chuul",
      "type": "aberration",
      "cr": "4",
      "hp": 67,
      "ac": 14,
      "init": 0,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🦞",
      "env": [
        "Swamp",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Clay Golem",
      "type": "construct",
      "cr": "9",
      "hp": 172,
      "ac": 17,
      "init": -1,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🗿",
      "env": [
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 9; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Cloaker",
      "type": "aberration",
      "cr": "8",
      "hp": 150,
      "ac": 16,
      "init": 0,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🦇",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Cloud Giant",
      "type": "giant",
      "cr": "9",
      "hp": 172,
      "ac": 17,
      "init": -1,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "☁️",
      "env": [
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 9; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Cockatrice",
      "type": "monstrosity",
      "cr": "1/2",
      "hp": 18,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🐓",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Commoner",
      "type": "humanoid",
      "cr": "0",
      "hp": 3,
      "ac": 10,
      "init": 0,
      "atk": 2,
      "dmg": "1",
      "icon": "🧍",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Constrictor Snake",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐍",
      "env": [
        "Forest",
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Couatl",
      "type": "celestial",
      "cr": "4",
      "hp": 67,
      "ac": 14,
      "init": 0,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🪽",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Crocodile",
      "type": "beast",
      "cr": "1/2",
      "hp": 18,
      "ac": 11,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🐊",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Cultist",
      "type": "humanoid",
      "cr": "1/8",
      "hp": 6,
      "ac": 11,
      "init": 0,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🕯️",
      "env": [
        "Town",
        "Dungeon",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Darkmantle",
      "type": "monstrosity",
      "cr": "1/2",
      "hp": 18,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🦑",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Death Dog",
      "type": "monstrosity",
      "cr": "1",
      "hp": 26,
      "ac": 13,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🐕‍🦺",
      "env": [
        "Wilderness",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Deer",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🦌",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Deva",
      "type": "celestial",
      "cr": "10",
      "hp": 150,
      "ac": 16,
      "init": 0,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "✨",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 10; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Dire Wolf",
      "type": "beast",
      "cr": "1",
      "hp": 26,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🐺",
      "env": [
        "Forest",
        "Wilderness",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Djinni",
      "type": "elemental",
      "cr": "11",
      "hp": 210,
      "ac": 17,
      "init": 0,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🌬️",
      "env": [
        "Wilderness",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 11; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Doppelganger",
      "type": "monstrosity",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🎭",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Draft Horse",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐎",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Dragon Turtle",
      "type": "dragon",
      "cr": "17",
      "hp": 316,
      "ac": 19,
      "init": 2,
      "atk": 12,
      "dmg": "6d10+7",
      "icon": "🐢",
      "env": [
        "Swamp",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 17; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Dretch",
      "type": "fiend",
      "cr": "1/4",
      "hp": 11,
      "ac": 12,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "👹",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Dryad",
      "type": "fey",
      "cr": "1",
      "hp": 23,
      "ac": 13,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🌺",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Duergar",
      "type": "humanoid",
      "cr": "1",
      "hp": 23,
      "ac": 13,
      "init": 0,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "⛏️",
      "env": [
        "Underground",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Dust Mephit",
      "type": "elemental",
      "cr": "1/2",
      "hp": 18,
      "ac": 12,
      "init": 0,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🌫️",
      "env": [
        "Dungeon",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Eagle",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🦅",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Earth Elemental",
      "type": "elemental",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🪨",
      "env": [
        "Dungeon",
        "Mountain",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Efreeti",
      "type": "elemental",
      "cr": "11",
      "hp": 210,
      "ac": 17,
      "init": 0,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🔥",
      "env": [
        "Dungeon",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 11; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Elephant",
      "type": "beast",
      "cr": "4",
      "hp": 67,
      "ac": 13,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐘",
      "env": [
        "Wilderness",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Elk",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🦌",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Erinyes",
      "type": "fiend",
      "cr": "12",
      "hp": 210,
      "ac": 17,
      "init": 2,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🪽",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 12; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ettercap",
      "type": "monstrosity",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🕷️",
      "env": [
        "Forest",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ettin",
      "type": "giant",
      "cr": "4",
      "hp": 77,
      "ac": 15,
      "init": -1,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "👹",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Fire Elemental",
      "type": "elemental",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🔥",
      "env": [
        "Dungeon",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Fire Giant",
      "type": "giant",
      "cr": "9",
      "hp": 172,
      "ac": 17,
      "init": -1,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🔥",
      "env": [
        "Mountain",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 9; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Flesh Golem",
      "type": "construct",
      "cr": "5",
      "hp": 126,
      "ac": 16,
      "init": -1,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🧟",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Flying Snake",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🐍",
      "env": [
        "Forest",
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Flying Sword",
      "type": "construct",
      "cr": "1/4",
      "hp": 12,
      "ac": 13,
      "init": -1,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🗡️",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Frog",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🐸",
      "env": [
        "Swamp",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Frost Giant",
      "type": "giant",
      "cr": "8",
      "hp": 172,
      "ac": 17,
      "init": -1,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "❄️",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Gargoyle",
      "type": "elemental",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": 0,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🗿",
      "env": [
        "Dungeon",
        "Town",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Gelatinous Cube",
      "type": "ooze",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": -1,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🟩",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ghast",
      "type": "undead",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": -1,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🧟",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ghost",
      "type": "undead",
      "cr": "4",
      "hp": 67,
      "ac": 14,
      "init": -1,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "👻",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ghoul",
      "type": "undead",
      "cr": "1",
      "hp": 26,
      "ac": 13,
      "init": -1,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🧟",
      "env": [
        "Dungeon",
        "Town",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Ape",
      "type": "beast",
      "cr": "7",
      "hp": 110,
      "ac": 14,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🦍",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 7; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Badger",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🦡",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Bat",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🦇",
      "env": [
        "Dungeon",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Boar",
      "type": "beast",
      "cr": "2",
      "hp": 45,
      "ac": 12,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🐗",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Centipede",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐛",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Constrictor Snake",
      "type": "beast",
      "cr": "2",
      "hp": 45,
      "ac": 12,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🐍",
      "env": [
        "Swamp",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Crab",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🦀",
      "env": [
        "Swamp",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Crocodile",
      "type": "beast",
      "cr": "5",
      "hp": 110,
      "ac": 14,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🐊",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Eagle",
      "type": "beast",
      "cr": "1",
      "hp": 26,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🦅",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Elk",
      "type": "beast",
      "cr": "2",
      "hp": 45,
      "ac": 12,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🦌",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Fire Beetle",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🪲",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Frog",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐸",
      "env": [
        "Swamp",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Goat",
      "type": "beast",
      "cr": "1/2",
      "hp": 18,
      "ac": 11,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🐐",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Hyena",
      "type": "beast",
      "cr": "1",
      "hp": 26,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🐕",
      "env": [
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Lizard",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🦎",
      "env": [
        "Swamp",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Octopus",
      "type": "beast",
      "cr": "1",
      "hp": 26,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🐙",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Owl",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🦉",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Poisonous Snake",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐍",
      "env": [
        "Forest",
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Rat",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🐀",
      "env": [
        "Dungeon",
        "Town",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Scorpion",
      "type": "beast",
      "cr": "3",
      "hp": 67,
      "ac": 13,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🦂",
      "env": [
        "Wilderness",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Sea Horse",
      "type": "beast",
      "cr": "1/2",
      "hp": 18,
      "ac": 11,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🐴",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Shark",
      "type": "beast",
      "cr": "5",
      "hp": 110,
      "ac": 14,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🦈",
      "env": [
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Spider",
      "type": "beast",
      "cr": "1",
      "hp": 26,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🕷️",
      "env": [
        "Dungeon",
        "Forest",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Toad",
      "type": "beast",
      "cr": "1",
      "hp": 26,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🐸",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Vulture",
      "type": "beast",
      "cr": "1",
      "hp": 26,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🦅",
      "env": [
        "Wilderness",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Wasp",
      "type": "beast",
      "cr": "1/2",
      "hp": 18,
      "ac": 11,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🐝",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Weasel",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🦦",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Giant Wolf Spider",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🕷️",
      "env": [
        "Dungeon",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Gibbering Mouther",
      "type": "aberration",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": 0,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "👄",
      "env": [
        "Dungeon",
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Glabrezu",
      "type": "fiend",
      "cr": "9",
      "hp": 150,
      "ac": 16,
      "init": 2,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "👹",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 9; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Gladiator",
      "type": "humanoid",
      "cr": "5",
      "hp": 99,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🏛️",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Gnoll",
      "type": "humanoid",
      "cr": "1/2",
      "hp": 16,
      "ac": 12,
      "init": 0,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🐕",
      "env": [
        "Road",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Goat",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🐐",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Goblin",
      "type": "humanoid",
      "cr": "1/4",
      "hp": 9,
      "ac": 12,
      "init": 0,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "👺",
      "env": [
        "Dungeon",
        "Forest",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Goblin Boss",
      "type": "humanoid",
      "cr": "1",
      "hp": 23,
      "ac": 13,
      "init": 0,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "👑",
      "env": [
        "Dungeon",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Gorgon",
      "type": "monstrosity",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🐂",
      "env": [
        "Wilderness",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Gray Ooze",
      "type": "ooze",
      "cr": "1/2",
      "hp": 18,
      "ac": 12,
      "init": -1,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🩶",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Green Hag",
      "type": "fey",
      "cr": "3",
      "hp": 60,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🧙‍♀️",
      "env": [
        "Swamp",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Grick",
      "type": "monstrosity",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🪱",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Griffon",
      "type": "monstrosity",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🦅",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Grimlock",
      "type": "humanoid",
      "cr": "1/4",
      "hp": 9,
      "ac": 12,
      "init": 0,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "👁️",
      "env": [
        "Underground",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Guard",
      "type": "humanoid",
      "cr": "1/8",
      "hp": 6,
      "ac": 11,
      "init": 0,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🛡️",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Guardian Naga",
      "type": "monstrosity",
      "cr": "10",
      "hp": 150,
      "ac": 16,
      "init": 2,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🐍",
      "env": [
        "Dungeon",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 10; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Gynosphinx",
      "type": "monstrosity",
      "cr": "11",
      "hp": 210,
      "ac": 17,
      "init": 2,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🦁",
      "env": [
        "Wilderness",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 11; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Half-Red Dragon Veteran",
      "type": "humanoid",
      "cr": "5",
      "hp": 99,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🐲",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Harpy",
      "type": "monstrosity",
      "cr": "1",
      "hp": 26,
      "ac": 13,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🪽",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Hawk",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🦅",
      "env": [
        "Wilderness",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Hell Hound",
      "type": "fiend",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐕‍🔥",
      "env": [
        "Dungeon",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Hezrou",
      "type": "fiend",
      "cr": "8",
      "hp": 150,
      "ac": 16,
      "init": 2,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "👹",
      "env": [
        "Swamp",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Hill Giant",
      "type": "giant",
      "cr": "5",
      "hp": 126,
      "ac": 16,
      "init": -1,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🪨",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Hippogriff",
      "type": "monstrosity",
      "cr": "1",
      "hp": 26,
      "ac": 13,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🦅",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Hobgoblin",
      "type": "humanoid",
      "cr": "1/2",
      "hp": 16,
      "ac": 12,
      "init": 0,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🛡️",
      "env": [
        "Dungeon",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Homunculus",
      "type": "construct",
      "cr": "0",
      "hp": 4,
      "ac": 11,
      "init": -1,
      "atk": 2,
      "dmg": "1",
      "icon": "🧪",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Horned Devil",
      "type": "fiend",
      "cr": "11",
      "hp": 210,
      "ac": 17,
      "init": 2,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "😈",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 11; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Hunter Shark",
      "type": "beast",
      "cr": "2",
      "hp": 45,
      "ac": 12,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🦈",
      "env": [
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Hydra",
      "type": "monstrosity",
      "cr": "8",
      "hp": 150,
      "ac": 16,
      "init": 2,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🐍",
      "env": [
        "Swamp",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Hyena",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🐕",
      "env": [
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ice Devil",
      "type": "fiend",
      "cr": "14",
      "hp": 210,
      "ac": 17,
      "init": 2,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "❄️",
      "env": [
        "Dungeon",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 14; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Imp",
      "type": "fiend",
      "cr": "1",
      "hp": 26,
      "ac": 13,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "😈",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Invisible Stalker",
      "type": "elemental",
      "cr": "6",
      "hp": 110,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🌫️",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 6; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Iron Golem",
      "type": "construct",
      "cr": "16",
      "hp": 316,
      "ac": 19,
      "init": -1,
      "atk": 12,
      "dmg": "6d10+7",
      "icon": "🤖",
      "env": [
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 16; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Jackal",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🐕",
      "env": [
        "Wilderness",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Killer Whale",
      "type": "beast",
      "cr": "3",
      "hp": 67,
      "ac": 13,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐋",
      "env": [
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Knight",
      "type": "humanoid",
      "cr": "3",
      "hp": 60,
      "ac": 14,
      "init": 0,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "⚔️",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Kobold",
      "type": "humanoid",
      "cr": "1/8",
      "hp": 6,
      "ac": 11,
      "init": 0,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🕯️",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Kraken",
      "type": "monstrosity",
      "cr": "23",
      "hp": 420,
      "ac": 20,
      "init": 2,
      "atk": 15,
      "dmg": "8d12+10",
      "icon": "🐙",
      "env": [
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 23; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Lamia",
      "type": "monstrosity",
      "cr": "4",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐍",
      "env": [
        "Wilderness",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Lemure",
      "type": "fiend",
      "cr": "0",
      "hp": 4,
      "ac": 10,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🫠",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Lich",
      "type": "undead",
      "cr": "21",
      "hp": 420,
      "ac": 20,
      "init": -1,
      "atk": 15,
      "dmg": "8d12+10",
      "icon": "💀",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 21; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Lion",
      "type": "beast",
      "cr": "1",
      "hp": 26,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🦁",
      "env": [
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Lizard",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🦎",
      "env": [
        "Swamp",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Lizardfolk",
      "type": "humanoid",
      "cr": "1/2",
      "hp": 16,
      "ac": 12,
      "init": 0,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🦎",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Mage",
      "type": "humanoid",
      "cr": "6",
      "hp": 99,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🧙",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 6; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Magma Mephit",
      "type": "elemental",
      "cr": "1/2",
      "hp": 18,
      "ac": 12,
      "init": 0,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🔥",
      "env": [
        "Mountain",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Magmin",
      "type": "elemental",
      "cr": "1/2",
      "hp": 18,
      "ac": 12,
      "init": 0,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🔥",
      "env": [
        "Mountain",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Mammoth",
      "type": "beast",
      "cr": "6",
      "hp": 110,
      "ac": 14,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🦣",
      "env": [
        "Wilderness",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 6; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Manticore",
      "type": "monstrosity",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🦂",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Marilith",
      "type": "fiend",
      "cr": "16",
      "hp": 275,
      "ac": 18,
      "init": 2,
      "atk": 12,
      "dmg": "6d10+7",
      "icon": "🐍",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 16; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Mastiff",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🐕",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Medusa",
      "type": "monstrosity",
      "cr": "6",
      "hp": 110,
      "ac": 15,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🐍",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 6; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Merfolk",
      "type": "humanoid",
      "cr": "1/8",
      "hp": 6,
      "ac": 11,
      "init": 0,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🧜",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Merrow",
      "type": "monstrosity",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🧜",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Mimic",
      "type": "monstrosity",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "📦",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Minotaur",
      "type": "monstrosity",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐂",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Mule",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🐴",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Mummy",
      "type": "undead",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": -1,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🧻",
      "env": [
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Mummy Lord",
      "type": "undead",
      "cr": "15",
      "hp": 275,
      "ac": 18,
      "init": -1,
      "atk": 12,
      "dmg": "6d10+7",
      "icon": "👑",
      "env": [
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 15; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Nalfeshnee",
      "type": "fiend",
      "cr": "13",
      "hp": 210,
      "ac": 17,
      "init": 2,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "👹",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 13; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Night Hag",
      "type": "fiend",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🧙‍♀️",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Nightmare",
      "type": "fiend",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐴",
      "env": [
        "Dungeon",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Noble",
      "type": "humanoid",
      "cr": "1/8",
      "hp": 6,
      "ac": 11,
      "init": 0,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "💍",
      "env": [
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ochre Jelly",
      "type": "ooze",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": -1,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🟨",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Octopus",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🐙",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ogre",
      "type": "giant",
      "cr": "2",
      "hp": 51,
      "ac": 14,
      "init": -1,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "👹",
      "env": [
        "Mountain",
        "Wilderness",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Ogre Zombie",
      "type": "undead",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": -1,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🧟",
      "env": [
        "Dungeon",
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Orc",
      "type": "humanoid",
      "cr": "1/2",
      "hp": 16,
      "ac": 12,
      "init": 0,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🪓",
      "env": [
        "Mountain",
        "Road",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Otyugh",
      "type": "aberration",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🦑",
      "env": [
        "Dungeon",
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Owl",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🦉",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Owlbear",
      "type": "monstrosity",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🦉",
      "env": [
        "Wilderness",
        "Forest",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Panther",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐈‍⬛",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Pegasus",
      "type": "celestial",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": 0,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🪽",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Phase Spider",
      "type": "monstrosity",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🕷️",
      "env": [
        "Dungeon",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Pit Fiend",
      "type": "fiend",
      "cr": "20",
      "hp": 420,
      "ac": 20,
      "init": 2,
      "atk": 15,
      "dmg": "8d12+10",
      "icon": "😈",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 20; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Planetar",
      "type": "celestial",
      "cr": "16",
      "hp": 275,
      "ac": 18,
      "init": 0,
      "atk": 12,
      "dmg": "6d10+7",
      "icon": "✨",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 16; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Plesiosaurus",
      "type": "beast",
      "cr": "2",
      "hp": 45,
      "ac": 12,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🦕",
      "env": [
        "Swamp",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Poisonous Snake",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🐍",
      "env": [
        "Forest",
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Polar Bear",
      "type": "beast",
      "cr": "2",
      "hp": 45,
      "ac": 12,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🐻‍❄️",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Pony",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🐴",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Priest",
      "type": "humanoid",
      "cr": "2",
      "hp": 40,
      "ac": 13,
      "init": 0,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🙏",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Pseudodragon",
      "type": "dragon",
      "cr": "1/4",
      "hp": 12,
      "ac": 13,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐉",
      "env": [
        "Forest",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Purple Worm",
      "type": "monstrosity",
      "cr": "15",
      "hp": 275,
      "ac": 18,
      "init": 2,
      "atk": 12,
      "dmg": "6d10+7",
      "icon": "🪱",
      "env": [
        "Underground",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 15; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Quasit",
      "type": "fiend",
      "cr": "1",
      "hp": 26,
      "ac": 13,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "👹",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Rat",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🐀",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Raven",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🐦‍⬛",
      "env": [
        "Town",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Red Dragon Wyrmling",
      "type": "dragon",
      "cr": "4",
      "hp": 77,
      "ac": 15,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐉",
      "env": [
        "Mountain",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Reef Shark",
      "type": "beast",
      "cr": "1/2",
      "hp": 18,
      "ac": 11,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🦈",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Remorhaz",
      "type": "monstrosity",
      "cr": "11",
      "hp": 210,
      "ac": 17,
      "init": 2,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🪱",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 11; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Rhinoceros",
      "type": "beast",
      "cr": "2",
      "hp": 45,
      "ac": 12,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🦏",
      "env": [
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Riding Horse",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐎",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Roc",
      "type": "monstrosity",
      "cr": "11",
      "hp": 210,
      "ac": 17,
      "init": 2,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🦅",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 11; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Roper",
      "type": "monstrosity",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🪨",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Rug of Smothering",
      "type": "construct",
      "cr": "2",
      "hp": 51,
      "ac": 14,
      "init": -1,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🧶",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Rust Monster",
      "type": "monstrosity",
      "cr": "1/2",
      "hp": 18,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🪲",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Saber-Toothed Tiger",
      "type": "beast",
      "cr": "2",
      "hp": 45,
      "ac": 12,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🐅",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Sahuagin",
      "type": "humanoid",
      "cr": "1/2",
      "hp": 16,
      "ac": 12,
      "init": 0,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🔱",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Salamander",
      "type": "elemental",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🔥",
      "env": [
        "Dungeon",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Satyr",
      "type": "fey",
      "cr": "1/2",
      "hp": 16,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🎵",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Scorpion",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🦂",
      "env": [
        "Wilderness",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Scout",
      "type": "humanoid",
      "cr": "1/2",
      "hp": 16,
      "ac": 12,
      "init": 0,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🏹",
      "env": [
        "Forest",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Sea Horse",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🐴",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Shadow",
      "type": "undead",
      "cr": "1/2",
      "hp": 18,
      "ac": 12,
      "init": -1,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🌑",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Shambling Mound",
      "type": "plant",
      "cr": "5",
      "hp": 110,
      "ac": 14,
      "init": -1,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🌿",
      "env": [
        "Swamp",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Shield Guardian",
      "type": "construct",
      "cr": "7",
      "hp": 126,
      "ac": 16,
      "init": -1,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🛡️",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 7; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Shrieker",
      "type": "plant",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": -1,
      "atk": 2,
      "dmg": "1",
      "icon": "🍄",
      "env": [
        "Dungeon",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Silver Dragon Wyrmling",
      "type": "dragon",
      "cr": "2",
      "hp": 51,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🐉",
      "env": [
        "Mountain",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Skeleton",
      "type": "undead",
      "cr": "1/4",
      "hp": 11,
      "ac": 12,
      "init": -1,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "💀",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Solar",
      "type": "celestial",
      "cr": "21",
      "hp": 420,
      "ac": 20,
      "init": 0,
      "atk": 15,
      "dmg": "8d12+10",
      "icon": "☀️",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 21; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Specter",
      "type": "undead",
      "cr": "1",
      "hp": 26,
      "ac": 13,
      "init": -1,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "👻",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Spy",
      "type": "humanoid",
      "cr": "1",
      "hp": 23,
      "ac": 13,
      "init": 0,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🕵️",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Steam Mephit",
      "type": "elemental",
      "cr": "1/4",
      "hp": 11,
      "ac": 12,
      "init": 0,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "💨",
      "env": [
        "Dungeon",
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Stirge",
      "type": "beast",
      "cr": "1/8",
      "hp": 7,
      "ac": 10,
      "init": 2,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🦟",
      "env": [
        "Swamp",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Stone Giant",
      "type": "giant",
      "cr": "7",
      "hp": 126,
      "ac": 16,
      "init": -1,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🪨",
      "env": [
        "Mountain",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 7; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Stone Golem",
      "type": "construct",
      "cr": "10",
      "hp": 172,
      "ac": 17,
      "init": -1,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🗿",
      "env": [
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 10; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Storm Giant",
      "type": "giant",
      "cr": "13",
      "hp": 241,
      "ac": 18,
      "init": -1,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🌩️",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 13; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Succubus/Incubus",
      "type": "fiend",
      "cr": "4",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "😈",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Swarm of Bats",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🦇",
      "env": [
        "Dungeon",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Swarm of Insects",
      "type": "beast",
      "cr": "1/2",
      "hp": 18,
      "ac": 11,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🐝",
      "env": [
        "Forest",
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Swarm of Poisonous Snakes",
      "type": "beast",
      "cr": "2",
      "hp": 45,
      "ac": 12,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🐍",
      "env": [
        "Swamp",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Swarm of Rats",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐀",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Swarm of Ravens",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐦‍⬛",
      "env": [
        "Forest",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Tarrasque",
      "type": "monstrosity",
      "cr": "30",
      "hp": 420,
      "ac": 20,
      "init": 2,
      "atk": 15,
      "dmg": "8d12+10",
      "icon": "🦖",
      "env": [
        "Wilderness",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 30; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Thug",
      "type": "humanoid",
      "cr": "1/2",
      "hp": 16,
      "ac": 12,
      "init": 0,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "👊",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Tiger",
      "type": "beast",
      "cr": "1",
      "hp": 26,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d8+2",
      "icon": "🐅",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Treant",
      "type": "plant",
      "cr": "9",
      "hp": 150,
      "ac": 15,
      "init": -1,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🌳",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 9; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Tribal Warrior",
      "type": "humanoid",
      "cr": "1/8",
      "hp": 6,
      "ac": 11,
      "init": 0,
      "atk": 3,
      "dmg": "1d4+1",
      "icon": "🪓",
      "env": [
        "Wilderness",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Triceratops",
      "type": "beast",
      "cr": "5",
      "hp": 110,
      "ac": 14,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🦕",
      "env": [
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Troll",
      "type": "giant",
      "cr": "5",
      "hp": 126,
      "ac": 16,
      "init": -1,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "👹",
      "env": [
        "Swamp",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Tyrannosaurus Rex",
      "type": "beast",
      "cr": "8",
      "hp": 150,
      "ac": 15,
      "init": 2,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🦖",
      "env": [
        "Wilderness",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Unicorn",
      "type": "celestial",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🦄",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Vampire",
      "type": "undead",
      "cr": "13",
      "hp": 210,
      "ac": 17,
      "init": -1,
      "atk": 10,
      "dmg": "5d10+6",
      "icon": "🧛",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 13; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Vampire Spawn",
      "type": "undead",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": -1,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🧛",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Veteran",
      "type": "humanoid",
      "cr": "3",
      "hp": 60,
      "ac": 14,
      "init": 0,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "⚔️",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Violet Fungus",
      "type": "plant",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": -1,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🍄",
      "env": [
        "Dungeon",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Vrock",
      "type": "fiend",
      "cr": "6",
      "hp": 110,
      "ac": 15,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🪽",
      "env": [
        "Dungeon",
        "Underground"
      ],
      "notes": "Quick-play SRD-style index entry. CR 6; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Vulture",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🦅",
      "env": [
        "Wilderness",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Warhorse",
      "type": "beast",
      "cr": "1/2",
      "hp": 18,
      "ac": 11,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🐎",
      "env": [
        "Town",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Warhorse Skeleton",
      "type": "undead",
      "cr": "1/2",
      "hp": 18,
      "ac": 12,
      "init": -1,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "💀",
      "env": [
        "Dungeon",
        "Road"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Water Elemental",
      "type": "elemental",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🌊",
      "env": [
        "Swamp",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Weasel",
      "type": "beast",
      "cr": "0",
      "hp": 4,
      "ac": 9,
      "init": 2,
      "atk": 2,
      "dmg": "1",
      "icon": "🦦",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 0; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Werebear",
      "type": "humanoid",
      "cr": "5",
      "hp": 99,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🐻",
      "env": [
        "Forest",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Wereboar",
      "type": "humanoid",
      "cr": "4",
      "hp": 60,
      "ac": 14,
      "init": 0,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐗",
      "env": [
        "Forest",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Wererat",
      "type": "humanoid",
      "cr": "2",
      "hp": 40,
      "ac": 13,
      "init": 0,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🐀",
      "env": [
        "Town",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Weretiger",
      "type": "humanoid",
      "cr": "4",
      "hp": 60,
      "ac": 14,
      "init": 0,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐅",
      "env": [
        "Forest",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Werewolf",
      "type": "humanoid",
      "cr": "3",
      "hp": 60,
      "ac": 14,
      "init": 0,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐺",
      "env": [
        "Forest",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "White Dragon Wyrmling",
      "type": "dragon",
      "cr": "2",
      "hp": 51,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🐉",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Wight",
      "type": "undead",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": -1,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "☠️",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Will-o'-Wisp",
      "type": "undead",
      "cr": "2",
      "hp": 45,
      "ac": 13,
      "init": -1,
      "atk": 5,
      "dmg": "2d6+3",
      "icon": "🕯️",
      "env": [
        "Swamp",
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Winter Wolf",
      "type": "monstrosity",
      "cr": "3",
      "hp": 67,
      "ac": 14,
      "init": 2,
      "atk": 5,
      "dmg": "2d8+3",
      "icon": "🐺",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 3; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Wolf",
      "type": "beast",
      "cr": "1/4",
      "hp": 11,
      "ac": 11,
      "init": 2,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🐺",
      "env": [
        "Wilderness",
        "Forest",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Worg",
      "type": "monstrosity",
      "cr": "1/2",
      "hp": 18,
      "ac": 12,
      "init": 2,
      "atk": 4,
      "dmg": "1d6+2",
      "icon": "🐺",
      "env": [
        "Forest",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/2; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Wraith",
      "type": "undead",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": -1,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "👻",
      "env": [
        "Dungeon",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Wyvern",
      "type": "dragon",
      "cr": "6",
      "hp": 126,
      "ac": 16,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🐉",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 6; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Xorn",
      "type": "elemental",
      "cr": "5",
      "hp": 110,
      "ac": 15,
      "init": 0,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "💎",
      "env": [
        "Underground",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 5; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Young Black Dragon",
      "type": "dragon",
      "cr": "7",
      "hp": 126,
      "ac": 16,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🐉",
      "env": [
        "Swamp"
      ],
      "notes": "Quick-play SRD-style index entry. CR 7; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Young Blue Dragon",
      "type": "dragon",
      "cr": "9",
      "hp": 172,
      "ac": 17,
      "init": 2,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🐉",
      "env": [
        "Wilderness",
        "Mountain"
      ],
      "notes": "Quick-play SRD-style index entry. CR 9; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Young Green Dragon",
      "type": "dragon",
      "cr": "8",
      "hp": 172,
      "ac": 17,
      "init": 2,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🐉",
      "env": [
        "Forest"
      ],
      "notes": "Quick-play SRD-style index entry. CR 8; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Young Red Dragon",
      "type": "dragon",
      "cr": "10",
      "hp": 172,
      "ac": 17,
      "init": 2,
      "atk": 8,
      "dmg": "4d8+5",
      "icon": "🐉",
      "env": [
        "Mountain",
        "Dungeon"
      ],
      "notes": "Quick-play SRD-style index entry. CR 10; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Young White Dragon",
      "type": "dragon",
      "cr": "6",
      "hp": 126,
      "ac": 16,
      "init": 2,
      "atk": 7,
      "dmg": "3d8+4",
      "icon": "🐉",
      "env": [
        "Mountain",
        "Wilderness"
      ],
      "notes": "Quick-play SRD-style index entry. CR 6; use owned sourcebooks/official compendium for exact traits."
    },
    {
      "name": "Zombie",
      "type": "undead",
      "cr": "1/4",
      "hp": 11,
      "ac": 12,
      "init": -1,
      "atk": 3,
      "dmg": "1d6+1",
      "icon": "🧟",
      "env": [
        "Dungeon",
        "Swamp",
        "Town"
      ],
      "notes": "Quick-play SRD-style index entry. CR 1/4; use owned sourcebooks/official compendium for exact traits."
    }
  ]
};
