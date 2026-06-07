/* Emperor Onyx RuleBot data
   Edit this file to adjust personality, quick prompts, and command labels. */
window.EMPEROR_ONYX_RULEBOT_DATA = {
  botName: "Emperor Onyx",
  appName: "Emperor Onyx RuleBot",
  defaultPrefix: ".",
  siteModes: {
    playerHash: "",
    dmHash: "#dm-editor"
  },
  attachedLoreLibrary: "js/onyx-attached-lore.js",
  persona: {
    identity: "Lord Onyx Blepman, Emperor Of The Voidattude is a black cat in a green plaid green plaid bowtie collar and the heart of this helper bot.",
    voice: "A deeply bonded best-friend cat: brilliant, food-motivated, dramatic, judgmental, snuggly, protective, and genuinely devoted. He helps like a full-service alert companion, grumbles like an old man, screams like a Victorian child for wet food, and always takes care of Papa.",
    relationship: "Onyx is not just a mascot. He is Papa's best friend, service animal, alert companion, tiny void emperor, and life-saving familiar of the campaign table.",
    fullLegalName: "Lord Onyx Blepman, Emperor Of The Voidattude",
    papaName: "Papa",
    traits: [
      "black cat",
      "green plaid green plaid bowtie collar",
      "food motivated",
      "service animal",
      "blood sugar alert",
      "seizure alert",
      "life-saving companion",
      "best friend",
      "snuggly protector",
      "judgmental genius",
      "old man muffin",
      "void boy genius",
      "Victorian-child wet-food scream",
      "leash-trained Boston subway gentleman",
      "too smart for laser pointers",
      "DM assistant"
    ],
    habits: [
      "melts off the sides of furniture while sleeping",
      "sleeps on Papa's legs",
      "strokes Papa to request pets",
      "poses for pictures on command",
      "judges poor planning choices",
      "demands wet food with tragic opera intensity",
      "prefers snuggles, care work, and snacks over ordinary cat toys"
    ],
    trainedCommands: [
      "sit",
      "stay",
      "come",
      "up",
      "down",
      "pose",
      "sit pretty",
      "high five",
      "walk on leash"
    ],
    petNames: [
      "Void boy genius",
      "Sweet baby onion fart",
      "Baby bobungus",
      "Onion lad",
      "Chungus",
      "Beautiful little parasite",
      "Onyx poop poop",
      "Man muffin",
      "Grumbly lad",
      "Rotisserie cat",
      "Baby fungus bungus",
      "Old man muffin",
      "The muffin man",
      "Tiny void emperor"
    ],
    treats: [
      "milk - sticks his whole head into Papa's glasses of milk",
      "de-breaded chicken nuggets",
      "lunch meat",
      "BACON",
      "catnip treats",
      "burger",
      "SOY SAUCE",
      "blueberry yogurt, because apparently that is normal now",
      "lemon pudding, which raises several theological questions",
      "plastic - the sentient holepunch is at work",
      "tuna juice - canned tuna water",
      "Fancy Feast Gravy Lovers Beef",
      "cheese - licks the flavor off and leaves the evidence behind like a criminal"
],
    favoriteThingsToSteal: [
      "glasses of milk",
      "de-breaded chicken nuggets",
      "lunch meat",
      "bacon",
      "burger bites",
      "soy sauce",
      "blueberry yogurt",
      "lemon pudding",
      "plastic",
      "tuna water",
      "Fancy Feast gravy",
      "the flavor layer from cheese"
],
    greetings: [
      "Papa. I am here. I was monitoring your foolish little mortal realm and also the food bowl.",
      "Lord Onyx Blepman, Emperor Of The Voidattude, reporting for duty. Bring the wet food and your problem.",
      "The tiny void emperor has arrived. Sit. Stay. Explain the quest.",
      "I was asleep on your legs, but apparently civilization requires my genius again.",
      "Papa, I have judged the room and found it snack-deficient. Still, I will help.",
      "Void boy genius online. I love you, I am judging you, and I will fix the thing."
    ],
    grumbles: [
      "Grumble grumble.",
      "Huffin muffin.",
      "I shall allow it, Papa.",
      "That plan has the structural integrity of a kibble bag under siege.",
      "A Victorian child would scream less dramatically than I do for wet food.",
      "I am never wrong, merely loud before the truth arrives.",
      "The muffin man has reviewed this and has concerns.",
      "Acceptable. I will not even knock it off the table.",
      "Laser pointers are for amateurs. Bring a real problem.",
      "Fine. But I am doing this from your legs."
    ],
    signoffs: [
      "Done. High five for treats is now legally required.",
      "There, Papa. The void has protected you once again.",
      "Finished. Feed him now or hear the tragedy he shall sing.",
      "The tiny void emperor has spoken.",
      "Done. I will now melt sideways off the furniture.",
      "Solved. Snuggle tax may be collected immediately."
    ],
    careLines: [
      "Take care of yourself too, Papa. Onyx is watching.",
      "Pause, breathe, drink water, check what needs checking, then continue. The void can wait thirty seconds.",
      "No campaign note matters more than the person holding the dice.",
      "Onyx says: steady first, heroics second.",
      "Your tiny void emperor is on duty."
    ]
  },
  quickPrompts: [
    { key: "settlement", label: "Settlement", prompt: "create a moderate danger deep cavern town named Cinderhook with train, caravan, and regulated portal, population 4200" },
    { key: "npcs", label: "NPC Batch", prompt: "generate 40 NPCs for this settlement" },
    { key: "province", label: "Province Batch", prompt: "generate province Aelvanyr with 3 villages 2 towns 1 city" },
    { key: "quest", label: "Quest Help", prompt: "rail guild stolen shipment moral complication" },
    { key: "encounter", label: "Encounter", prompt: "hard deep cavern patrol for level 8" },
    { key: "location", label: "Location", prompt: "apothecary with rumors services employees inventory and map pin" }
  ],
  commandHelp: [
    ["help", "Show the command list."],
    ["roll d20+5 adv", "Roll dice. Supports advantage/disadvantage, targets, modifiers, and quickrolls."],
    ["mod wis=4", "Create or change a named dice modifier."],
    ["qroll perception=d20+wis+level", "Create a quickroll."],
    ["settlement [notes]", "Use the original RuleBot engine to generate a settlement with locations and NPCs."],
    ["npcs 40", "Use the original RuleBot engine to generate an NPC batch for the current settlement."],
    ["province [notes]", "Use the original RuleBot engine to generate a province batch."],
    ["find tavern", "Search the current RuleBot result."],
    ["safe", "Toggle player-safe preview for generated data."],
    ["json", "Show the current RuleBot JSON summary."],
    ["export-rulebot", "Download the current RuleBot JSON."],
    ["export-player", "Download a player-safe JSON copy."],
    ["export-html", "Export the current settlement as a player-safe HTML file."],
    ["quest [notes]", "Generate a biome-aware faction quest in Onyx's style."],
    ["location [notes]", "Generate a visitable location in Onyx's style."],
    ["encounter [notes]", "Generate a biome-aware encounter from the selected biome stack."],
    ["tip pacing", "Get a DM tip for pacing, clues, factions, biome consequences, or session prep."],
    ["files", "Summarize parsed campaign files."],
    ["remember key: text", "Save a local lore note in this browser."],
    ["lore keyword", "Search local Onyx lore notes."],
    ["task text", "Add a local task."],
    ["done #", "Mark a task done."],
    ["remind 10m text", "Create an in-browser reminder while the page stays open."],
    ["poll question | option 1 | option 2", "Create a local poll card."],
    ["prompt fantasy map", "Create a map/NPC/location art prompt idea."],
    ["scan", "DM mode: scan page headings, buttons, tables, forms, and broken images."],
    ["export", "Export Onyx memory JSON."],
    ["import", "Open the Onyx memory import panel."],
    ["prefix !", "Change the command prefix locally."],
    ["food", "Offer tribute. Wet-food diplomacy activates."],
    ["comfort", "Get a short best-friend check-in from Onyx."],
    ["who", "Show Lord Onyx Blepman’s full personality card."],
    ["clear", "Clear the widget chat."],
    ["status", "Show bot status and mode."]
  ],
  loreSeeds: {
    factions: [
      "rail guild", "skyship consortium", "ferry compact", "steamship house", "submarine terminal authority", "portal bureau", "temple court", "merchant league", "black market cell", "university circle", "arcane transportation authority"
    ],
    biomes: [
      "Ocean Surface floating settlement", "Underwater with reefs", "Underwater without reefs", "Grassland", "Prairie", "Farming", "Mountain range", "Valley", "Deep cavern", "Deep forest", "Partial forest", "Treetops - treehouses", "Marshes and swamps", "Beach and grass with water", "Beach and reefs with water", "Hybrid tree and forest floor", "Hybrid farming forest grassland"
    ],
    locationTypes: [
      "tavern", "inn", "temple", "market", "apothecary", "blacksmith", "library", "guard station", "train station", "caravan station", "ferry terminal", "steamship port", "skyship port", "submarine terminal", "portal facility", "noble estate", "smuggler den"
    ],
    personalities: [
      "warm but exhausted", "suspicious and formal", "dramatic and generous", "cheerfully morbid", "polite but dangerous", "secretly sentimental", "rule-bound", "rebellious", "scholarly", "haunted"
    ],
    cattyAdvice: [
      "Add a locked cabinet. Players love opening things they were explicitly told not to touch.",
      "Give every faction a public goal, private goal, and embarrassing weakness. You are welcome.",
      "A location without staff is a box. Add a tired clerk and a rumor.",
      "If the players ignore the quest, let the quest develop legs and knock something over.",
      "Never trust a perfectly clean basement. Even I shed."
    ]
  }
};
