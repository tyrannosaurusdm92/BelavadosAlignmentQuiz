(() => {
  'use strict';

  const root = document.getElementById('dicebotChatbotAssistant');
  const DATABASES = window.TTRPG_SYSTEM_DATABASES || {};
  if (!root || !Object.keys(DATABASES).length) return;

  const CONFIG = (() => {
    try { return JSON.parse(root.querySelector('.dicebot-chatbot-config')?.textContent || '{}'); }
    catch (_) { return {}; }
  })();

  const DICE_STYLE_SETS = [{"number":1,"slug":"plain-ivory","name":"Plain Ivory","description":"plain satin ivory with charcoal ink","css":"dice-designs/sets/01-plain-ivory.css","className":"dice-set--plain-ivory","base":"#efe6d2","base2":"#d6c8a8","ink":"#24201a","edge":"#8b7a57","glow":"#ffffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":2,"slug":"plain-onyx","name":"Plain Onyx","description":"plain black onyx with white ink","css":"dice-designs/sets/02-plain-onyx.css","className":"dice-set--plain-onyx","base":"#08090c","base2":"#1b1e26","ink":"#f6f3e8","edge":"#44495a","glow":"#b7c2ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":3,"slug":"plain-crimson-gold","name":"Plain Crimson Gold","description":"simple red body with gold numerals","css":"dice-designs/sets/03-plain-crimson-gold.css","className":"dice-set--plain-crimson-gold","base":"#730b0b","base2":"#b31919","ink":"#ffd978","edge":"#8f5d16","glow":"#ffedb2","dice":["d4","d6","d8","d10","d12","d20"]},{"number":4,"slug":"royal-red-gold","name":"Royal Red Gold","description":"deep royal red with gold engraved trim","css":"dice-designs/sets/04-royal-red-gold.css","className":"dice-set--royal-red-gold","base":"#6d000c","base2":"#a71925","ink":"#f7c84b","edge":"#c28b15","glow":"#ffe5a1","dice":["d4","d6","d8","d10","d12","d20"]},{"number":5,"slug":"sapphire-silver","name":"Sapphire Silver","description":"sapphire blue with silver inlay","css":"dice-designs/sets/05-sapphire-silver.css","className":"dice-set--sapphire-silver","base":"#052d70","base2":"#0c66d2","ink":"#e7f2ff","edge":"#7fa9cf","glow":"#d7ecff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":6,"slug":"emerald-copper","name":"Emerald Copper","description":"emerald enamel with copper edging","css":"dice-designs/sets/06-emerald-copper.css","className":"dice-set--emerald-copper","base":"#063b26","base2":"#138a5f","ink":"#ffc38e","edge":"#b56b38","glow":"#a7ffd1","dice":["d4","d6","d8","d10","d12","d20"]},{"number":7,"slug":"amethyst-brass","name":"Amethyst Brass","description":"purple amethyst with antique brass numbers","css":"dice-designs/sets/07-amethyst-brass.css","className":"dice-set--amethyst-brass","base":"#321052","base2":"#7926b3","ink":"#f4c970","edge":"#ad7c31","glow":"#e9c8ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":8,"slug":"obsidian-ruby","name":"Obsidian Ruby","description":"black obsidian with ruby cuts","css":"dice-designs/sets/08-obsidian-ruby.css","className":"dice-set--obsidian-ruby","base":"#040407","base2":"#220b10","ink":"#ff5e75","edge":"#961b2b","glow":"#ffb3c0","dice":["d4","d6","d8","d10","d12","d20"]},{"number":9,"slug":"moonstone-blue-silver","name":"Moonstone Blue Silver","description":"opalescent pale blue with silver","css":"dice-designs/sets/09-moonstone-blue-silver.css","className":"dice-set--moonstone-blue-silver","base":"#dfefff","base2":"#8bb7e6","ink":"#5a6f86","edge":"#bfcad6","glow":"#ffffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":10,"slug":"jade-gold","name":"Jade Gold","description":"jade gemstone with gold numerals","css":"dice-designs/sets/10-jade-gold.css","className":"dice-set--jade-gold","base":"#0d5a4a","base2":"#2fb587","ink":"#ffd568","edge":"#b48a1e","glow":"#a7ffe4","dice":["d4","d6","d8","d10","d12","d20"]},{"number":11,"slug":"black-gold-metal","name":"Black Gold Metal","description":"black metal with gold bevels","css":"dice-designs/sets/11-black-gold-metal.css","className":"dice-set--black-gold-metal","base":"#050505","base2":"#1a1710","ink":"#f4c044","edge":"#a27719","glow":"#ffe99c","dice":["d4","d6","d8","d10","d12","d20"]},{"number":12,"slug":"silver-ancient","name":"Silver Ancient","description":"ancient brushed silver with dark engraved numbers","css":"dice-designs/sets/12-silver-ancient.css","className":"dice-set--silver-ancient","base":"#b8b8ad","base2":"#e8e8de","ink":"#20201d","edge":"#8f8f86","glow":"#ffffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":13,"slug":"purple-metal-silver","name":"Purple Metal Silver","description":"purple metal with silver runic edges","css":"dice-designs/sets/13-purple-metal-silver.css","className":"dice-set--purple-metal-silver","base":"#2d1748","base2":"#6b3ca3","ink":"#e5e7f3","edge":"#9da1b4","glow":"#f1edff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":14,"slug":"bronze-dragon-scale","name":"Bronze Dragon Scale","description":"bronze dragon-scale texture","css":"dice-designs/sets/14-bronze-dragon-scale.css","className":"dice-set--bronze-dragon-scale","base":"#4a2b0f","base2":"#9b6122","ink":"#ffe0a0","edge":"#c98731","glow":"#ffbd5c","dice":["d4","d6","d8","d10","d12","d20"]},{"number":15,"slug":"red-dragon-scale-gold","name":"Red Dragon Scale Gold","description":"red dragon scales with gold numbers","css":"dice-designs/sets/15-red-dragon-scale-gold.css","className":"dice-set--red-dragon-scale-gold","base":"#5f0505","base2":"#b21d12","ink":"#ffd861","edge":"#a86916","glow":"#ff9c68","dice":["d4","d6","d8","d10","d12","d20"]},{"number":16,"slug":"blue-dragon-scale-silver","name":"Blue Dragon Scale Silver","description":"blue dragon scales with silver numerals","css":"dice-designs/sets/16-blue-dragon-scale-silver.css","className":"dice-set--blue-dragon-scale-silver","base":"#061a45","base2":"#0a57a8","ink":"#edf8ff","edge":"#7aa4cc","glow":"#8eeaff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":17,"slug":"storm-galaxy-gold","name":"Storm Galaxy Gold","description":"dark galaxy storm with gold ink","css":"dice-designs/sets/17-storm-galaxy-gold.css","className":"dice-set--storm-galaxy-gold","base":"#07091d","base2":"#27378a","ink":"#ffd86e","edge":"#a89036","glow":"#a7b8ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":18,"slug":"nebula-night-silver","name":"Nebula Night Silver","description":"midnight nebula with silver numbers","css":"dice-designs/sets/18-nebula-night-silver.css","className":"dice-set--nebula-night-silver","base":"#090016","base2":"#311062","ink":"#dfe7ff","edge":"#7a82aa","glow":"#c393ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":19,"slug":"aurora-glass","name":"Aurora Glass","description":"aurora translucent glass","css":"dice-designs/sets/19-aurora-glass.css","className":"dice-set--aurora-glass","base":"#0b2240","base2":"#36d5c4","ink":"#f5fbff","edge":"#79d7da","glow":"#b9fff4","dice":["d4","d6","d8","d10","d12","d20"]},{"number":20,"slug":"ocean-swirl-gold","name":"Ocean Swirl Gold","description":"ocean blue and white swirl acrylic","css":"dice-designs/sets/20-ocean-swirl-gold.css","className":"dice-set--ocean-swirl-gold","base":"#0b6ea8","base2":"#9bdcff","ink":"#ffd967","edge":"#b58a23","glow":"#ffffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":21,"slug":"blue-white-acrylic-gold","name":"Blue White Acrylic Gold","description":"blue-white acrylic with gold font","css":"dice-designs/sets/21-blue-white-acrylic-gold.css","className":"dice-set--blue-white-acrylic-gold","base":"#6bc7ff","base2":"#ffffff","ink":"#e0a82c","edge":"#b78d20","glow":"#ffffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":22,"slug":"pink-flower-resin","name":"Pink Flower Resin","description":"pink floral resin look","css":"dice-designs/sets/22-pink-flower-resin.css","className":"dice-set--pink-flower-resin","base":"#ff9cc7","base2":"#f7d6ef","ink":"#7a2657","edge":"#e98abb","glow":"#fff1f8","dice":["d4","d6","d8","d10","d12","d20"]},{"number":23,"slug":"lemon-honey-resin","name":"Lemon Honey Resin","description":"transparent lemon honey resin","css":"dice-designs/sets/23-lemon-honey-resin.css","className":"dice-set--lemon-honey-resin","base":"#ffd84e","base2":"#fff3ad","ink":"#745000","edge":"#e0a000","glow":"#fff7b0","dice":["d4","d6","d8","d10","d12","d20"]},{"number":24,"slug":"arctic-ice-cyan","name":"Arctic Ice Cyan","description":"icy translucent cyan with white frost","css":"dice-designs/sets/24-arctic-ice-cyan.css","className":"dice-set--arctic-ice-cyan","base":"#8eeaff","base2":"#d7fbff","ink":"#faffff","edge":"#7edbed","glow":"#ffffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":25,"slug":"dark-ice-silver","name":"Dark Ice Silver","description":"dark ice blue with silver","css":"dice-designs/sets/25-dark-ice-silver.css","className":"dice-set--dark-ice-silver","base":"#061222","base2":"#163f74","ink":"#e4eefb","edge":"#7899b7","glow":"#96d7ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":26,"slug":"forest-moss-copper","name":"Forest Moss Copper","description":"deep moss gemstone with copper","css":"dice-designs/sets/26-forest-moss-copper.css","className":"dice-set--forest-moss-copper","base":"#1b3d1b","base2":"#4e7a34","ink":"#ffbd83","edge":"#9b5d2f","glow":"#caff9e","dice":["d4","d6","d8","d10","d12","d20"]},{"number":27,"slug":"red-green-gold-swirl","name":"Red Green Gold Swirl","description":"red green gold marbled swirl","css":"dice-designs/sets/27-red-green-gold-swirl.css","className":"dice-set--red-green-gold-swirl","base":"#7b1514","base2":"#19885e","ink":"#ffd36d","edge":"#bd8527","glow":"#ffb86e","dice":["d4","d6","d8","d10","d12","d20"]},{"number":28,"slug":"teal-wizard-silver","name":"Teal Wizard Silver","description":"teal wizard sharp-edge style","css":"dice-designs/sets/28-teal-wizard-silver.css","className":"dice-set--teal-wizard-silver","base":"#008e94","base2":"#20d8d2","ink":"#eefcff","edge":"#6fd2d2","glow":"#b9fff7","dice":["d4","d6","d8","d10","d12","d20"]},{"number":29,"slug":"warlock-violet-black","name":"Warlock Violet Black","description":"violet warlock pastel over black","css":"dice-designs/sets/29-warlock-violet-black.css","className":"dice-set--warlock-violet-black","base":"#8153d2","base2":"#d3a5ff","ink":"#20051e","edge":"#d5b4ff","glow":"#f3d8ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":30,"slug":"paladin-white-gold","name":"Paladin White Gold","description":"white paladin enamel with gold","css":"dice-designs/sets/30-paladin-white-gold.css","className":"dice-set--paladin-white-gold","base":"#f7f1df","base2":"#ffffff","ink":"#8a6415","edge":"#d6a62c","glow":"#fff4bf","dice":["d4","d6","d8","d10","d12","d20"]},{"number":31,"slug":"dwarf-green-glass","name":"Dwarf Green Glass","description":"dwarf-cut green glass","css":"dice-designs/sets/31-dwarf-green-glass.css","className":"dice-set--dwarf-green-glass","base":"#0e8c39","base2":"#45d96b","ink":"#eaffef","edge":"#79a867","glow":"#d6ffdc","dice":["d4","d6","d8","d10","d12","d20"]},{"number":32,"slug":"african-jade","name":"African Jade","description":"deep jade stone with gold marks","css":"dice-designs/sets/32-african-jade.css","className":"dice-set--african-jade","base":"#0f594e","base2":"#2f8f73","ink":"#e8c26e","edge":"#8b6b24","glow":"#a5ffdc","dice":["d4","d6","d8","d10","d12","d20"]},{"number":33,"slug":"saphrium-glass","name":"Saphrium Glass","description":"bright aqua blue glass","css":"dice-designs/sets/33-saphrium-glass.css","className":"dice-set--saphrium-glass","base":"#12b7ff","base2":"#8af1ff","ink":"#f3fbff","edge":"#56c3e7","glow":"#c9ffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":34,"slug":"tranquility-polyhedral","name":"Tranquility Polyhedral","description":"soft lavender aqua tranquility resin","css":"dice-designs/sets/34-tranquility-polyhedral.css","className":"dice-set--tranquility-polyhedral","base":"#7964c9","base2":"#5bd4d4","ink":"#f4f1ff","edge":"#94e1df","glow":"#e7daff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":35,"slug":"liquid-core-galaxy","name":"Liquid Core Galaxy","description":"liquid-core galaxy illusion","css":"dice-designs/sets/35-liquid-core-galaxy.css","className":"dice-set--liquid-core-galaxy","base":"#17101f","base2":"#456cff","ink":"#f3f7ff","edge":"#7964ff","glow":"#ffa7f7","dice":["d4","d6","d8","d10","d12","d20"]},{"number":36,"slug":"glitter-rainbow","name":"Glitter Rainbow","description":"rainbow glitter dice","css":"dice-designs/sets/36-glitter-rainbow.css","className":"dice-set--glitter-rainbow","base":"#f55d8a","base2":"#55d6ff","ink":"#fff5aa","edge":"#e8c454","glow":"#ffffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":37,"slug":"scorched-rainbow","name":"Scorched Rainbow","description":"scorched rainbow metal","css":"dice-designs/sets/37-scorched-rainbow.css","className":"dice-set--scorched-rainbow","base":"#37220f","base2":"#cf3b22","ink":"#ffe28a","edge":"#ac7126","glow":"#ff7ce7","dice":["d4","d6","d8","d10","d12","d20"]},{"number":38,"slug":"hollow-purple-neon","name":"Hollow Purple Neon","description":"hollow purple neon inlay","css":"dice-designs/sets/38-hollow-purple-neon.css","className":"dice-set--hollow-purple-neon","base":"#170524","base2":"#5c1893","ink":"#dba9ff","edge":"#7334a2","glow":"#ff4dff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":39,"slug":"gothic-mystic-starhorn","name":"Gothic Mystic Starhorn","description":"gothic black cyan starhorn","css":"dice-designs/sets/39-gothic-mystic-starhorn.css","className":"dice-set--gothic-mystic-starhorn","base":"#061117","base2":"#113a48","ink":"#8ff6ff","edge":"#19859a","glow":"#b9ffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":40,"slug":"norse-draugr-iron","name":"Norse Draugr Iron","description":"draugr iron with aged runes","css":"dice-designs/sets/40-norse-draugr-iron.css","className":"dice-set--norse-draugr-iron","base":"#2b2b27","base2":"#66665c","ink":"#d7d1bd","edge":"#80785f","glow":"#f6ead0","dice":["d4","d6","d8","d10","d12","d20"]},{"number":41,"slug":"queen-treasure-blue-gold","name":"Queen Treasure Blue Gold","description":"royal treasure blue with gold filigree","css":"dice-designs/sets/41-queen-treasure-blue-gold.css","className":"dice-set--queen-treasure-blue-gold","base":"#004b82","base2":"#0b8cb8","ink":"#ffd75c","edge":"#b68b24","glow":"#c4f3ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":42,"slug":"arcane-gold-blue","name":"Arcane Gold Blue","description":"arcane gold and blue layered metal","css":"dice-designs/sets/42-arcane-gold-blue.css","className":"dice-set--arcane-gold-blue","base":"#0c2348","base2":"#155c99","ink":"#f0c05a","edge":"#ae7b1b","glow":"#8fe7ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":43,"slug":"ancient-bone-ink","name":"Ancient Bone Ink","description":"bone-white dice with dark ink carvings","css":"dice-designs/sets/43-ancient-bone-ink.css","className":"dice-set--ancient-bone-ink","base":"#d6c9a7","base2":"#f1e3bd","ink":"#211910","edge":"#8c7850","glow":"#fff9df","dice":["d4","d6","d8","d10","d12","d20"]},{"number":44,"slug":"paper-parchment-sepia","name":"Paper Parchment Sepia","description":"paper parchment with sepia numerals","css":"dice-designs/sets/44-paper-parchment-sepia.css","className":"dice-set--paper-parchment-sepia","base":"#c9b27a","base2":"#efe1b2","ink":"#3a2412","edge":"#9c7a3f","glow":"#fff0bc","dice":["d4","d6","d8","d10","d12","d20"]},{"number":45,"slug":"candy-opal-pastel","name":"Candy Opal Pastel","description":"pink and cyan candy opal","css":"dice-designs/sets/45-candy-opal-pastel.css","className":"dice-set--candy-opal-pastel","base":"#ff8fd3","base2":"#85e7ff","ink":"#ffffff","edge":"#eaa8ff","glow":"#fffaff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":46,"slug":"coral-rose-gold","name":"Coral Rose Gold","description":"coral resin with rose gold numbers","css":"dice-designs/sets/46-coral-rose-gold.css","className":"dice-set--coral-rose-gold","base":"#f0646a","base2":"#ffc7b6","ink":"#ffe1ca","edge":"#c77a57","glow":"#fff2e8","dice":["d4","d6","d8","d10","d12","d20"]},{"number":47,"slug":"void-plasma-cyan","name":"Void Plasma Cyan","description":"black void plasma with cyan numbers","css":"dice-designs/sets/47-void-plasma-cyan.css","className":"dice-set--void-plasma-cyan","base":"#02040a","base2":"#092033","ink":"#6ffaff","edge":"#0f9eb7","glow":"#8ffeff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":48,"slug":"solar-brass","name":"Solar Brass","description":"solar orange brass layered metal","css":"dice-designs/sets/48-solar-brass.css","className":"dice-set--solar-brass","base":"#c95b14","base2":"#ffb13b","ink":"#fff1a7","edge":"#b57b21","glow":"#ffd04d","dice":["d4","d6","d8","d10","d12","d20"]},{"number":49,"slug":"lunar-steel","name":"Lunar Steel","description":"moonlit gray steel","css":"dice-designs/sets/49-lunar-steel.css","className":"dice-set--lunar-steel","base":"#5e6978","base2":"#c5d1dd","ink":"#ffffff","edge":"#8493a3","glow":"#dce8ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":50,"slug":"mermaid-aqua-gold","name":"Mermaid Aqua Gold","description":"mermaid aqua resin with gold","css":"dice-designs/sets/50-mermaid-aqua-gold.css","className":"dice-set--mermaid-aqua-gold","base":"#04a0a0","base2":"#7fffe6","ink":"#ffd76a","edge":"#bd8b22","glow":"#c2fff6","dice":["d4","d6","d8","d10","d12","d20"]},{"number":51,"slug":"dragonfly-teal-violet","name":"Dragonfly Teal Violet","description":"iridescent teal violet dragonfly","css":"dice-designs/sets/51-dragonfly-teal-violet.css","className":"dice-set--dragonfly-teal-violet","base":"#008a9b","base2":"#7d42d9","ink":"#f0fff9","edge":"#52e6d8","glow":"#d9b0ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":52,"slug":"bloodstone-red-black","name":"Bloodstone Red Black","description":"bloodstone red black polished stone","css":"dice-designs/sets/52-bloodstone-red-black.css","className":"dice-set--bloodstone-red-black","base":"#4c0509","base2":"#a31824","ink":"#f0d0c7","edge":"#842532","glow":"#ffb4a8","dice":["d4","d6","d8","d10","d12","d20"]},{"number":53,"slug":"lava-obsidian-orange","name":"Lava Obsidian Orange","description":"molten lava inside obsidian","css":"dice-designs/sets/53-lava-obsidian-orange.css","className":"dice-set--lava-obsidian-orange","base":"#140806","base2":"#ff5b14","ink":"#ffd19c","edge":"#b94c17","glow":"#ff8a35","dice":["d4","d6","d8","d10","d12","d20"]},{"number":54,"slug":"frosted-lavender","name":"Frosted Lavender","description":"frosted lavender resin","css":"dice-designs/sets/54-frosted-lavender.css","className":"dice-set--frosted-lavender","base":"#ac8de6","base2":"#eee5ff","ink":"#ffffff","edge":"#b6a5d9","glow":"#f8efff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":55,"slug":"smoke-quartz-white","name":"Smoke Quartz White","description":"smoky quartz with white numbers","css":"dice-designs/sets/55-smoke-quartz-white.css","className":"dice-set--smoke-quartz-white","base":"#45434d","base2":"#aba9b0","ink":"#f7f5ff","edge":"#77757f","glow":"#ffffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":56,"slug":"copper-verdigris","name":"Copper Verdigris","description":"aged copper with turquoise verdigris","css":"dice-designs/sets/56-copper-verdigris.css","className":"dice-set--copper-verdigris","base":"#8a4c20","base2":"#31a79c","ink":"#ffcf9e","edge":"#b96d32","glow":"#8ffff6","dice":["d4","d6","d8","d10","d12","d20"]},{"number":57,"slug":"clockwork-steampunk","name":"Clockwork Steampunk","description":"clockwork brass and dark teal","css":"dice-designs/sets/57-clockwork-steampunk.css","className":"dice-set--clockwork-steampunk","base":"#4a331a","base2":"#0f5968","ink":"#ffd184","edge":"#ac7528","glow":"#88e5f4","dice":["d4","d6","d8","d10","d12","d20"]},{"number":58,"slug":"celestial-navy-gold","name":"Celestial Navy Gold","description":"navy celestial stars with gold","css":"dice-designs/sets/58-celestial-navy-gold.css","className":"dice-set--celestial-navy-gold","base":"#020f30","base2":"#0f3f75","ink":"#ffe07d","edge":"#b08a30","glow":"#b3d5ff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":59,"slug":"ivory-lotus-mint","name":"Ivory Lotus Mint","description":"ivory lotus mint engraving","css":"dice-designs/sets/59-ivory-lotus-mint.css","className":"dice-set--ivory-lotus-mint","base":"#f6ead7","base2":"#b9e8d2","ink":"#426a5b","edge":"#d6b772","glow":"#ffffff","dice":["d4","d6","d8","d10","d12","d20"]},{"number":60,"slug":"black-ice-blue-gold","name":"Black Ice Blue Gold","description":"black ice with blue layers and gold ink","css":"dice-designs/sets/60-black-ice-blue-gold.css","className":"dice-set--black-ice-blue-gold","base":"#050d18","base2":"#0f6cad","ink":"#ffd76a","edge":"#80642d","glow":"#7ecfff","dice":["d4","d6","d8","d10","d12","d20"]}];
  const DICE_AUDIO_SOUNDS = [{"id":"sound-01","name":"Dice Throw 38476","url":"dice-main/assets/roll-audio/freesound_community-dice-throw-38476.mp3","iframeUrl":"assets/roll-audio/freesound_community-dice-throw-38476.mp3"},{"id":"sound-02","name":"Rpg Dice Rolling 95182","url":"dice-main/assets/roll-audio/freesound_community-rpg-dice-rolling-95182.mp3","iframeUrl":"assets/roll-audio/freesound_community-rpg-dice-rolling-95182.mp3"},{"id":"sound-03","name":"Dice Roll 201898","url":"dice-main/assets/roll-audio/u_ngsgp0r6zb-dice-roll-201898.mp3","iframeUrl":"assets/roll-audio/u_ngsgp0r6zb-dice-roll-201898.mp3"},{"id":"sound-04","name":"Dice 142528","url":"dice-main/assets/roll-audio/u_qpfzpydtro-dice-142528.mp3","iframeUrl":"assets/roll-audio/u_qpfzpydtro-dice-142528.mp3"}];

  const SYSTEMS = {
    dnd: {
      id:'dnd', title:'D&D 5e / 5.5e', short:'D&D', databaseKey:'dnd', defaultVariant:'5.5e',
      variants:[
        {id:'5.5e',label:'5.5e · Updated 2024 rules / SRD 5.2.1',note:'Updated fifth-edition procedures are the campaign baseline.'},
        {id:'5e',label:'5e · Original 2014 rules / SRD 5.1',note:'Original 2014 fifth-edition procedures are the campaign baseline.'}
      ],
      core:'Roll 1d20, add the relevant modifier and proficiency when applicable, and meet or exceed DC or AC.',
      quickRolls:[['d20','1d20'],['Advantage','attack with advantage +0'],['Disadvantage','attack with disadvantage +0'],['Initiative','initiative +0'],['Death Save','death save'],['Damage','2d6+3'],['d100','1d100']],
      topics:[['Core tests','d20 tests'],['Advantage','advantage and disadvantage'],['Combat','combat turn actions'],['Spells','spellcasting'],['Death saves','death saving throws']],
      roots:['metadata','rules_reference','official_character_options','character_engine','spells'],
      topicPaths:{
        'advantage':['rules_reference.how_to_play_research_guide.core_mechanics.advantage_disadvantage'],
        'death save':['rules_reference.how_to_play_research_guide.damage_healing_and_death.death_saves'],
        'surprise':['rules_reference.how_to_play_research_guide.combat.surprise_comparison'],
        'grapple':['rules_reference.how_to_play_research_guide.combat.grapple_and_shove_comparison'],
        'exhaustion':['rules_reference.how_to_play_research_guide.resting_and_exhaustion.exhaustion'],
        'spellcasting':['rules_reference.how_to_play_research_guide.spellcasting']
      }
    },
    pf2e: {
      id:'pf2e', title:'Pathfinder 2e Remastered', short:'Pathfinder', databaseKey:'pf2e', defaultVariant:'remastered',
      variants:[{id:'remastered',label:'Remastered rules baseline',note:'Pathfinder Second Edition Remastered terminology and procedures are active.'}],
      core:'Roll 1d20 plus modifiers against a DC. Results use critical success, success, failure, and critical failure, with natural 20/1 shifting the degree.',
      quickRolls:[['Check +7 vs 20','check +7 vs DC 20'],['Strike +8 vs 22','strike +8 vs AC 22'],['Save +6 vs 18','save +6 vs DC 18'],['Flat Check 11','flat check DC 11'],['Damage','2d8+4'],['d100','1d100']],
      topics:[['Degrees','degrees of success'],['Three actions','three action economy'],['Conditions','conditions'],['Dying','dying and wounded'],['Magic','spellcasting remaster']],
      roots:['metadata','thirty_second_summary','core_resolution_system','modes_of_play','encounter_mode','exploration_mode','conditions','damage_healing_and_death','magic','skills','classes','official_character_options','spell_reference_database','character_engine'],
      topicPaths:{
        'degrees':['core_resolution_system.degrees_of_success','core_resolution_system.natural_die_adjustments'],
        'three action':['encounter_mode.turn_structure'],
        'dying':['damage_healing_and_death.zero_hp_and_dying'],
        'conditions':['conditions.entries'],
        'magic':['magic']
      }
    },
    coc7e: {
      id:'coc7e', title:'Call of Cthulhu 7th Edition', short:'Call of Cthulhu', databaseKey:'coc7e', defaultVariant:'7e',
      variants:[{id:'7e',label:'Call of Cthulhu 7th Edition',note:'Percentile roll-under procedures and 7e success levels are active.'}],
      core:'Roll percentile dice equal to or below a characteristic or skill. Lower results can produce Hard, Extreme, or Critical success.',
      quickRolls:[['Skill 60','skill 60'],['Bonus Die','skill 60 bonus 1'],['Penalty Die','skill 60 penalty 1'],['Sanity 55','sanity 55'],['Luck 50','luck 50'],['Damage','1d6+1']],
      topics:[['Success levels','success levels'],['Bonus dice','bonus and penalty dice'],['Pushed rolls','pushed rolls'],['Sanity','sanity rules'],['Combat','combat maneuvers']],
      roots:['metadata','compact_reference','rules_reference','investigator_engine','keeper_engine','player_aids','equipment_reference','data_models'],
      topicPaths:{
        'success level':['player_aids.new_player_reference.success_levels'],
        'bonus':['legacy_reference_archive.original_v1.percentile_dice','indexes.examples_by_topic.bonus_penalty'],
        'pushed':['legacy_reference_archive.original_v1.pushed_rolls'],
        'sanity':['rules_reference'],
        'luck':['rules_reference']
      }
    },
    gurps4e: {
      id:'gurps4e', title:'GURPS Fourth Edition Revised', short:'GURPS', databaseKey:'gurps4e', defaultVariant:'4e-revised',
      variants:[{id:'4e-revised',label:'Fourth Edition Revised baseline',note:'3d6 roll-under and point-built character procedures are active.'}],
      core:'Roll 3d6 at or below effective skill, attribute, self-control number, resistance value, or active defense. Margin matters.',
      quickRolls:[['Skill 12','skill 12'],['Skill 15','skill 15'],['Defense 10','defense 10'],['Reaction','reaction roll'],['Damage 2d+1','2d6+1'],['Hit Location','3d6']],
      topics:[['Success rolls','success rolls'],['Criticals','critical success and failure'],['Combat','combat sequence'],['Damage','damage and injury'],['Character points','character points']],
      roots:['metadata','beginner_start_here','rules_reference','character_engine','catalogs','quick_reference','edition_identity'],
      topicPaths:{
        'success roll':['rules_reference.core_mechanics.success_roll'],
        'critical':['rules_reference.core_mechanics.success_roll.automatic_and_critical_results'],
        'combat':['rules_reference.combat'],
        'reaction':['rules_reference.core_mechanics.reaction_rolls'],
        'damage':['rules_reference']
      }
    },
    swade: {
      id:'swade', title:'Savage Worlds Adventure Edition', short:'SWADE', databaseKey:'swade', defaultVariant:'swade',
      variants:[{id:'swade',label:'SWADE core baseline',note:'Trait dice, Wild Dice, Aces, Target Number 4, and Raises are active.'}],
      core:'Roll the Trait die and, for a Wild Card, a d6 Wild Die. Dice Ace; keep the better total, apply modifiers, and compare with the target number.',
      quickRolls:[['d8 Wild','trait d8 wild'],['d10 +2','trait d10 +2 wild'],['Unskilled','unskilled wild'],['Extra d8','trait d8 extra'],['Damage','damage 2d6+1'],['Soak d8','soak d8 wild']],
      topics:[['Basic roll','trait roll wild die'],['Acing','acing dice'],['Raises','raises'],['Bennies','bennies'],['Combat','combat actions']],
      roots:['metadata','rules_reference','character_engine','official_core_character_options','gear_and_vehicles','powers','adversary_and_encounter_engine','probability_reference'],
      topicPaths:{
        'wild die':['rules_reference.complete_how_to_play_guide.the_basic_roll.wild_die'],
        'acing':['rules_reference.complete_how_to_play_guide.the_basic_roll.acing'],
        'raise':['rules_reference.complete_how_to_play_guide.the_basic_roll.raises'],
        'bennies':['rules_reference.complete_how_to_play_guide'],
        'damage':['rules_reference.complete_how_to_play_guide.combat.damage']
      }
    },
    fate: {
      id:'fate', title:'Fate Core', short:'Fate Core', databaseKey:'fate', defaultVariant:'core',
      variants:[{id:'core',label:'Fate Core baseline',note:'Four Fate dice, the ladder, aspects, invokes, and four actions are active.'}],
      core:'Roll four Fate dice, add a skill and modifiers, then compare the result with passive or active opposition. The difference is shifts.',
      quickRolls:[['4dF','4dF'],['Skill +2','fate +2'],['Vs Fair +2','fate +3 vs 2'],['Invoke +2','4dF+4'],['Create Advantage','fate +2 vs 2'],['d6 Conversion','4dF']],
      topics:[['Core resolution','core resolution'],['Aspects','aspects and fate points'],['Four actions','overcome create advantage attack defend'],['Stress','stress and consequences'],['Ladder','fate ladder']],
      roots:['metadata','rules_reference','aspect_reference','skill_reference','stunt_reference','opposition_reference','probability_reference','character_engine','scene_scenario_campaign_engine'],
      topicPaths:{
        'core resolution':['rules_reference.how_to_play_research_guide.core_resolution'],
        'aspect':['rules_reference.how_to_play_research_guide.aspects_and_fate_points','aspect_reference'],
        'stress':['rules_reference.how_to_play_research_guide'],
        'ladder':['rules_reference.how_to_play_research_guide.core_resolution'],
        'four action':['rules_reference.how_to_play_research_guide']
      }
    },
    daggerheart: {
      id:'daggerheart', title:'Daggerheart', short:'Daggerheart', databaseKey:'daggerheart', defaultVariant:'core',
      variants:[{id:'core',label:'Finalized core rules baseline',note:'Finalized Duality Dice procedures are active; obsolete beta rules are excluded.'}],
      core:'Roll a Hope d12 and Fear d12, add the trait and modifiers, and compare with Difficulty. Matching Duality Dice are a Critical Success.',
      quickRolls:[['Duality +2 vs 15','action +2 vs difficulty 15'],['Advantage','action +2 advantage 1 vs 15'],['Disadvantage','action +2 disadvantage 1 vs 15'],['Attack','attack +3 vs 14'],['Adversary +4','adversary attack +4 vs 13'],['Damage','2d8+3']],
      topics:[['Duality Dice','duality dice'],['Five outcomes','action roll outcomes'],['Hope and Fear','hope and fear resources'],['Damage','damage thresholds'],['Combat','combat spotlight']],
      roots:['metadata','rules_reference','character_engine','official_character_options','domain_card_database','equipment_database','game_master_database','teaching_and_play_support'],
      topicPaths:{
        'duality':['rules_reference.complete_how_to_play_guide.action_rolls'],
        'outcome':['rules_reference.complete_how_to_play_guide.action_rolls.outcomes'],
        'advantage':['rules_reference.complete_how_to_play_guide.advantage_and_disadvantage'],
        'hope':['rules_reference.complete_how_to_play_guide'],
        'damage':['rules_reference.complete_how_to_play_guide.damage']
      }
    },
    blades: {
      id:'blades', title:'Blades in the Dark', short:'Blades', databaseKey:'blades', defaultVariant:'core',
      variants:[{id:'core',label:'Blades in the Dark core baseline',note:'Action pools, position/effect, stress, resistance, and clocks are active.'}],
      core:'Roll a pool of d6s and read the highest die. Two or more 6s are a critical; 6 is full, 4–5 mixed, and 1–3 bad. At zero dice, roll 2d6 and keep the lower.',
      quickRolls:[['1 Die','action pool 1 risky standard'],['2 Dice','action pool 2 risky standard'],['3 Dice','action pool 3 risky standard'],['Zero Dice','action pool 0 risky limited'],['Resistance 3','resistance pool 3'],['Fortune 2','fortune pool 2']],
      topics:[['Action roll','action roll'],['Position/effect','position and effect'],['Resistance','resistance roll'],['Stress','stress trauma vice'],['Clocks','progress clocks']],
      roots:['metadata','rules_reference','game_engine','gm_engine','player_assistant','official_character_options','official_crew_options','quick_reference_tables','deep_cuts_v1_2'],
      topicPaths:{
        'action roll':['rules_reference.complete_core_guide.action_roll'],
        'position':['rules_reference.complete_core_guide.action_roll.position'],
        'resistance':['rules_reference.complete_core_guide.consequences_resistance_harm_and_armor.resistance'],
        'stress':['rules_reference.complete_core_guide'],
        'clock':['rules_reference.complete_core_guide']
      }
    },
    pbta: {
      id:'pbta', title:'Powered by the Apocalypse', short:'PbtA', databaseKey:'pbta', defaultVariant:'classic-2d6',
      variants:[
        {id:'classic-2d6',label:'Classic 2d6 move baseline',note:'Use classic 10+/7–9/6− bands only when the selected game or move actually uses them.'},
        {id:'implementation-specific',label:'Implementation-specific resolution',note:'The selected PbtA game’s own move text and dice procedure control; no universal roll is assumed.'}
      ],
      core:'PbtA is a design family, not one universal dice engine. Many classic implementations roll 2d6 plus a stat: 10+ strong, 7–9 mixed, and 6− a miss, but the move text controls.',
      quickRolls:[['Move +0','move +0'],['Move +1','move +1'],['Move +2','move +2'],['Move -1','move -1'],['2d6','2d6'],['Custom Dice','1d20']],
      topics:[['Conversation','conversation of play'],['Move triggers','move triggers'],['Classic 2d6','classic 2d6 resolution'],['GM moves','gm moves principles agenda'],['Playbooks','playbooks']],
      roots:['metadata','rules_reference','play_engine','facilitator_engine','representative_implementations','design_and_conversion_reference','glossary','faq'],
      topicPaths:{
        'classic 2d6':['rules_reference.baseline_researched_guide.classic_2d6_resolution'],
        'move trigger':['rules_reference.baseline_researched_guide'],
        'conversation':['rules_reference.baseline_researched_guide.the_conversation_of_play'],
        'gm move':['facilitator_engine','rules_reference.baseline_researched_guide'],
        'playbook':['play_engine','representative_implementations']
      }
    }
  };

  const BOT_MODES = {
    rules:{label:'Rules Bot',description:'Finds and explains rules from the active system reference.'},
    roller:{label:'Roll Interpreter',description:'Prioritizes dice procedures, outcomes, targets, and roll syntax.'},
    campaign:{label:'Campaign Guide',description:'Applies the active system reference to the saved campaign premise, tone, scene, and house rules.'},
    character:{label:'Character Helper',description:'Prioritizes character creation, options, advancement, equipment, and abilities.'},
    facilitator:{label:'Facilitator Assistant',description:'Prioritizes adjudication, encounters, pacing, consequences, NPCs, and session flow.'},
    connected:{label:'Connected Backend Bot',description:'Sends system, campaign, roll, and local reference context to the configured Apps Script backend.'}
  };

  const STORAGE = {
    system:'ttrpg.portal.system.v3', variants:'ttrpg.portal.variants.v3', bot:'ttrpg.portal.bot.v3',
    campaign:'ttrpg.portal.campaign.v3', style:'ttrpg.portal.diceStyle.v3', audio:'ttrpg.portal.diceAudio.v3'
  };
  const nativeStore = (() => { try { return window.localStorage; } catch (_) { return null; } })();
  const safeStore = {
    get(key) { try { return window.safeStore?.get?.(key) ?? nativeStore?.getItem(key) ?? null; } catch (_) { return null; } },
    set(key,value) { try { if (window.safeStore?.set) window.safeStore.set(key,String(value)); else nativeStore?.setItem(key,String(value)); } catch (_) {} }
  };

  const q = (selector, base=document) => base.querySelector(selector);
  const qa = (selector, base=document) => [...base.querySelectorAll(selector)];
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[ch]);
  const normalize = value => String(value == null ? '' : value).toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9+%.-]+/g,' ').replace(/\s+/g,' ').trim();
  const titlePath = path => String(path||'').split('.').slice(-3).join(' · ').replace(/[_\[\]]+/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
  const truncate = (value,limit=900) => { const s=String(value??''); return s.length>limit ? `${s.slice(0,limit-1)}…` : s; };
  const randomInt = (min,max) => {
    const range=max-min+1;
    if (window.crypto?.getRandomValues) {
      const maxUint=0x100000000, cutoff=maxUint-(maxUint%range), arr=new Uint32Array(1); let value;
      do { window.crypto.getRandomValues(arr); value=arr[0]; } while (value>=cutoff);
      return min+(value%range);
    }
    return min+Math.floor(Math.random()*range);
  };
  const signed = value => Number(value)>=0 ? `+${Number(value)}` : String(Number(value));
  const compare = (value,operator,target) => operator==='<'?value<target:operator==='<='?value<=target:operator==='>'?value>target:operator==='>='?value>=target:value===target;
  const getPath = (obj,path) => String(path||'').replace(/\[(\d+)\]/g,'.$1').split('.').filter(Boolean).reduce((v,k)=>v==null?undefined:v[k],obj);

  let savedVariants={};
  try { savedVariants=JSON.parse(safeStore.get(STORAGE.variants)||'{}')||{}; } catch (_) {}
  let savedCampaign={};
  try { savedCampaign=JSON.parse(safeStore.get(STORAGE.campaign)||'{}')||{}; } catch (_) {}
  const initialSystem=SYSTEMS[safeStore.get(STORAGE.system)] ? safeStore.get(STORAGE.system) : (CONFIG.defaultSystem || 'dnd');
  const state = {
    system:initialSystem,
    variants:savedVariants,
    bot:BOT_MODES[safeStore.get(STORAGE.bot)] ? safeStore.get(STORAGE.bot) : 'rules',
    campaign:{name:'',premise:'',tone:'',party:'',scene:'',houseRules:'',implementation:'',...savedCampaign},
    indexes:{}, frameReady:false, lastRoll:null
  };

  const els = {
    frame:q('[data-dice-main-frame]'), row:q('[data-dice-row]'), log:q('[data-chat-log]'), status:q('[data-chat-status]'),
    form:q('[data-chat-form]'), input:q('[data-chat-input]'), stageTitle:q('[data-dice-stage-title]'),
    token:q('[data-dicebot-token-stage]'), tokenImg:q('[data-dicebot-active-token-img]'), tokenName:q('[data-dicebot-active-token-name]'), tokenStatus:q('[data-dicebot-active-token-status]'),
    styleSelect:q('[data-dice-style-select]'), audioSelect:q('[data-dice-audio-select]'), previewGrid:q('[data-dice-style-preview-grid]'),
    previewCount:q('[data-dice-style-preview-count]'), styleMeter:q('[data-dice-style-meter]'), audioStatus:q('[data-dice-audio-status]'),
    quickRolls:q('[data-system-quick-rolls]'), topicButtons:q('[data-system-topic-buttons]'), referenceStatus:q('[data-system-reference-status]'),
    systemHeading:q('[data-system-heading]'), systemDescription:q('[data-system-description]'), botDescription:q('[data-bot-description]'),
    campaignStatus:q('[data-campaign-status]'), expressionInput:q('[data-universal-expression]'), expressionTarget:q('[data-universal-target]')
  };

  function profile(){ return SYSTEMS[state.system] || SYSTEMS.dnd; }
  function database(){ return DATABASES[profile().databaseKey] || {}; }
  function variant(){
    const p=profile(); const id=state.variants[p.id] || p.defaultVariant;
    return p.variants.find(item=>item.id===id) || p.variants[0];
  }
  function activeBotLabel(){ return `${profile().short} ${BOT_MODES[state.bot].label}`; }
  function campaignSummary(){
    const c=state.campaign;
    const parts=[];
    if(c.name)parts.push(`Campaign: ${c.name}`);
    if(c.premise)parts.push(`Premise: ${c.premise}`);
    if(c.tone)parts.push(`Tone: ${c.tone}`);
    if(c.party)parts.push(`Party: ${c.party}`);
    if(c.scene)parts.push(`Current scene: ${c.scene}`);
    if(c.houseRules)parts.push(`House rules: ${c.houseRules}`);
    if(c.implementation)parts.push(`Implementation: ${c.implementation}`);
    return parts.join('\n');
  }

  function addMessage(kind,html,meta){
    if(!els.log)return;
    const msg=document.createElement('article');
    msg.className=`dicebot-chatbot-msg ${kind}${kind==='bot'?' with-token':''}`;
    const label=meta || (kind==='user'?'You':activeBotLabel());
    msg.innerHTML=(kind==='bot'?`<img class="bot-token-avatar" alt="" src="dice-main/assets/icon.png">`:'')+`<span class="meta">${esc(label)}</span><div class="bot-message-body">${html}</div>`;
    els.log.appendChild(msg); els.log.scrollTop=els.log.scrollHeight;
  }
  function setStatus(text){ if(els.status)els.status.textContent=text; }
  function setToken(status,rolling=false){
    if(els.tokenName)els.tokenName.textContent=activeBotLabel();
    if(els.tokenStatus)els.tokenStatus.textContent=status;
    if(els.tokenImg){els.tokenImg.src='dice-main/assets/icon.png';els.tokenImg.alt=`${activeBotLabel()} token`;}
    els.token?.classList.toggle('rolling',Boolean(rolling));
  }

  function selectedTheme(){
    const slug=els.styleSelect?.value || safeStore.get(STORAGE.style) || DICE_STYLE_SETS[0]?.slug;
    return DICE_STYLE_SETS.find(item=>item.slug===slug)||DICE_STYLE_SETS[0];
  }
  function selectedAudio(){
    const url=els.audioSelect?.value || safeStore.get(STORAGE.audio) || DICE_AUDIO_SOUNDS[0]?.url;
    return DICE_AUDIO_SOUNDS.find(item=>item.url===url)||DICE_AUDIO_SOUNDS[0];
  }
  function sendRendererConfig(){
    if(!els.frame?.contentWindow)return;
    els.frame.contentWindow.postMessage({type:'DICEBOT_DICE_MAIN_CONFIG',payload:{stylePool:[selectedTheme()],soundPool:[selectedAudio()]}},'*');
  }
  function renderStylePreview(){
    const theme=selectedTheme(); if(!theme||!els.previewGrid)return;
    const dice=['d4','d6','d8','d10','d12','d20'];
    els.previewGrid.innerHTML=dice.map(type=>`<span class="dnd-preview-die" title="${esc(theme.name)} ${type}" style="--dnd-base:${esc(theme.base)};--dnd-base2:${esc(theme.base2)};--dnd-ink:${esc(theme.ink)};--dnd-edge:${esc(theme.edge)};--dnd-glow:${esc(theme.glow)}"><b>${type.slice(1)}</b><small>${type}</small></span>`).join('');
    if(els.previewCount)els.previewCount.textContent=`${theme.name} · universal polyhedral set`;
    if(els.styleMeter)els.styleMeter.textContent=`${theme.name}: ${theme.description}. Applies to every system.`;
  }
  function syncAppearance(){
    if(els.styleSelect){const saved=safeStore.get(STORAGE.style);if(saved&&DICE_STYLE_SETS.some(i=>i.slug===saved))els.styleSelect.value=saved;}
    if(els.audioSelect){const saved=safeStore.get(STORAGE.audio);if(saved&&DICE_AUDIO_SOUNDS.some(i=>i.url===saved))els.audioSelect.value=saved;}
    renderStylePreview(); if(els.audioStatus)els.audioStatus.textContent=`${selectedAudio()?.name||'Selected sound'} applies to the next roll.`; sendRendererConfig();
  }

  function saveCampaign(){
    safeStore.set(STORAGE.campaign,JSON.stringify(state.campaign));
    if(els.campaignStatus)els.campaignStatus.textContent=state.campaign.name?`${state.campaign.name} saved locally.`:'Campaign context saved locally.';
    renderCampaignSummary();
  }
  function syncCampaignFields(source){
    const field=source?.getAttribute?.('data-campaign-field'); if(!field)return;
    state.campaign[field]=source.value;
    qa(`[data-campaign-field="${CSS.escape(field)}"]`).forEach(el=>{if(el!==source&&el.value!==source.value)el.value=source.value;});
    saveCampaign();
  }
  function renderCampaignSummary(){
    const summary=campaignSummary();
    qa('[data-campaign-summary]').forEach(el=>{el.textContent=summary||'No campaign context saved yet. Add a name, premise, party, scene, or house rules so the dice bots can answer for this campaign.';});
  }
  async function syncCampaignBackend(){
    saveCampaign();
    if(els.campaignStatus)els.campaignStatus.textContent='Syncing campaign context…';
    try{
      const response=await window.RoleplayingBackend.request(CONFIG.campaignSaveAction||'ttrpg_portal_campaign_save',{system:state.system,variant:variant().id,campaign:state.campaign});
      if(els.campaignStatus)els.campaignStatus.textContent=response?.ok===false?'Backend returned an error; local copy retained.':'Campaign context sent to the configured backend.';
    }catch(error){if(els.campaignStatus)els.campaignStatus.textContent=`Backend sync unavailable; local copy retained. ${error.message}`;}
  }

  function populateSystemSelects(){
    const options=Object.values(SYSTEMS).map(p=>`<option value="${p.id}">${esc(p.title)}</option>`).join('');
    qa('[data-ttrpg-system-select]').forEach(select=>{select.innerHTML=options;select.value=state.system;});
  }
  function populateVariantSelects(){
    const p=profile(), active=variant().id;
    const options=p.variants.map(v=>`<option value="${v.id}">${esc(v.label)}</option>`).join('');
    qa('[data-ttrpg-variant-select]').forEach(select=>{select.innerHTML=options;select.value=active;select.disabled=p.variants.length<2;});
  }
  function renderSystemCards(){
    qa('[data-system-card]').forEach(card=>card.classList.toggle('is-active',card.getAttribute('data-system-id')===state.system));
  }
  function updateDocumentTitle(pageId){
    const page=pageId||q('[data-page]:not([hidden])')?.getAttribute('data-page')||'portal';
    if(page==='portal')document.title=`${profile().title} · TTRPG Portal`;
    else if(page==='dice-roller')document.title=`${profile().title} · Dice Roller`;
    else document.title=`${page==='ttrpg-server'?'TTRPG Server':'World'} · Multi-System TTRPG Portal`;
  }
  function renderSystemUI(announce=false){
    populateSystemSelects(); populateVariantSelects(); renderSystemCards();
    const p=profile(), v=variant(), db=database(), schema=db.metadata?.schema_version||db.schema_version||'reference';
    qa('[data-active-system-name]').forEach(el=>el.textContent=p.title);
    qa('[data-active-system-variant]').forEach(el=>el.textContent=v.label);
    qa('[data-active-system-note]').forEach(el=>el.textContent=v.note);
    qa('[data-active-system-core]').forEach(el=>el.textContent=p.core);
    if(els.systemHeading)els.systemHeading.textContent=`${p.title} Dice Bots`;
    if(els.systemDescription)els.systemDescription.textContent=`${p.core} The assistant searches the supplied ${p.title} database and includes saved campaign context.`;
    if(els.referenceStatus)els.referenceStatus.textContent=`Schema ${schema} · complete supplied reference loaded`;
    if(els.botDescription)els.botDescription.textContent=BOT_MODES[state.bot].description;
    if(els.input)els.input.placeholder=`${p.short} examples: ${p.quickRolls.slice(0,3).map(item=>item[1]).join('; ')}; or ask a rules/campaign question…`;
    if(els.quickRolls)els.quickRolls.innerHTML=p.quickRolls.map(([label,command])=>`<button data-quick-roll="${esc(command)}" type="button">${esc(label)}</button>`).join('');
    if(els.topicButtons)els.topicButtons.innerHTML=p.topics.map(([label,query])=>`<button data-system-query="${esc(query)}" type="button">${esc(label)}</button>`).join('');
    setToken(`${v.id} reference ready`);
    updateDocumentTitle();
    qa('[data-portal-title]').forEach(el=>el.textContent='Multi-System TTRPG Portal');
    if(announce)addMessage('bot',`<p>System changed to <b>${esc(p.title)}</b>.</p><p>${esc(v.note)}</p><p>${esc(p.core)}</p>`,`${p.short} system loaded`);
    document.dispatchEvent(new CustomEvent('ttrpg:systemchange',{detail:{system:state.system,variant:v.id}}));
  }
  function setSystem(id,announce=true){
    if(!SYSTEMS[id])return;
    const changed=state.system!==id;
    state.system=id;
    if(changed)state.lastRoll=null;
    safeStore.set(STORAGE.system,id);
    if(!state.variants[id])state.variants[id]=SYSTEMS[id].defaultVariant;
    safeStore.set(STORAGE.variants,JSON.stringify(state.variants));
    renderSystemUI(announce);
  }
  function setVariant(id,announce=true){
    const p=profile(); if(!p.variants.some(v=>v.id===id))return;
    state.variants[p.id]=id; safeStore.set(STORAGE.variants,JSON.stringify(state.variants)); renderSystemUI(false);
    if(announce)addMessage('bot',`<p>Rules variant changed to <b>${esc(variant().label)}</b>.</p><p>${esc(variant().note)}</p>`,`${p.short} rules variant`);
  }
  function setBotMode(id,announce=true){
    if(!BOT_MODES[id])return;
    state.bot=id; safeStore.set(STORAGE.bot,id);
    qa('[data-ttrpg-bot-mode]').forEach(select=>select.value=id);
    if(els.botDescription)els.botDescription.textContent=BOT_MODES[id].description;
    setToken(`${BOT_MODES[id].label} ready`);
    if(announce)addMessage('bot',`<b>${esc(BOT_MODES[id].label)}</b> active. ${esc(BOT_MODES[id].description)}`,'Dice Bot changed');
  }

  function parseSuffix(suffix){
    const result={keep:null,reroll:null,explode:null,success:null,failure:null};
    const patterns=[
      ['keep',/(kh|kl|dh|dl)(\d+)/ig],['reroll',/(ro|r)(<=|>=|=|<|>)(-?\d+)/ig],
      ['explode',/(!{1,2})(?:(<=|>=|=|<|>)(-?\d+))?/ig],['success',/cs(<=|>=|=|<|>)(-?\d+)/ig],['failure',/cf(<=|>=|=|<|>)(-?\d+)/ig]
    ];
    for(const [kind,re] of patterns){const m=re.exec(suffix);if(!m)continue;
      if(kind==='keep')result.keep={mode:m[1].toLowerCase(),count:Number(m[2])};
      else if(kind==='reroll')result.reroll={once:m[1].toLowerCase()==='ro',op:m[2],target:Number(m[3])};
      else if(kind==='explode')result.explode={compound:m[1]==='!!',op:m[2]||null,target:m[3]==null?null:Number(m[3])};
      else result[kind]={op:m[1],target:Number(m[2])};
    }
    return result;
  }
  function rawRollForSides(sides){
    if(sides==='F'){const raw=randomInt(1,6);return {raw,value:raw<=2?-1:raw<=4?0:1,rendererSides:6};}
    const n=Number(sides); return {raw:randomInt(1,n),value:null,rendererSides:n};
  }
  function rollDieChain(sides,suffix){
    const values=[],rawValues=[],rendererSides=[]; let rerolls=0, explosions=0;
    const makeRoll=()=>{const r=rawRollForSides(sides);const value=r.value==null?r.raw:r.value;return {...r,value};};
    let roll=makeRoll();
    while(suffix.reroll && compare(roll.value,suffix.reroll.op,suffix.reroll.target) && rerolls<100){roll=makeRoll();rerolls++;if(suffix.reroll.once)break;}
    values.push(roll.value);rawValues.push(roll.raw);rendererSides.push(roll.rendererSides);
    const shouldExplode=value=>suffix.explode && (suffix.explode.op?compare(value,suffix.explode.op,suffix.explode.target):value===Number(sides));
    while(shouldExplode(values[values.length-1])&&explosions<100){const next=makeRoll();values.push(next.value);rawValues.push(next.raw);rendererSides.push(next.rendererSides);explosions++;}
    return {values,rawValues,rendererSides,total:values.reduce((a,b)=>a+b,0),rerolls,explosions};
  }
  function evaluateArithmetic(expression){
    const source=String(expression).trim();
    if(!/^[0-9eE+\-*/().\s]+$/.test(source))throw new Error('Only dice, numbers, parentheses, and + − × ÷ arithmetic are allowed.');
    const value=Function(`"use strict";return (${source})`)();
    if(!Number.isFinite(value))throw new Error('The arithmetic result is not finite.');
    return value;
  }
  function parseAndRollGeneric(input,options={}){
    let original=String(input||'').trim();
    const repeatMatch=original.match(/^\s*(?:repeat\s+)?(\d+)\s*(?:x|times|:)\s*(.+)$/i);
    const repeat=repeatMatch?Math.max(1,Math.min(50,Number(repeatMatch[1]))):1;
    if(repeatMatch)original=repeatMatch[2].trim();
    if(/^d66$/i.test(original)||/^d666$/i.test(original)){
      const count=original.length-1,dice=Array.from({length:count},()=>randomInt(1,6));
      return {kind:'generic',label:original.toUpperCase(),total:Number(dice.join('')),outcome:`Table result ${dice.join('')}`,dice:dice.map(v=>({sides:6,value:v,kept:true,label:'d6 digit'})),rendererExpression:`${count}d6`,requestedResults:dice,details:[`Digits: ${dice.join(', ')}`]};
    }
    const normalized=original.replace(/[−–—]/g,'-').replace(/\bplus\b/ig,'+').replace(/\bminus\b/ig,'-').replace(/\btimes\b/ig,'*').replace(/÷/g,'/').replace(/d%/ig,'d100').replace(/\bkeep\s+(?:the\s+)?highest\s+(\d+)/ig,'kh$1').replace(/\bkeep\s+(?:the\s+)?lowest\s+(\d+)/ig,'kl$1').replace(/\bdrop\s+(?:the\s+)?highest\s+(\d+)/ig,'dh$1').replace(/\bdrop\s+(?:the\s+)?lowest\s+(\d+)/ig,'dl$1');
    const tokenRe=/(\d*)d(F|\d+)((?:(?:kh|kl|dh|dl)\d+|(?:ro|r)(?:<=|>=|=|<|>)-?\d+|!{1,2}(?:(?:<=|>=|=|<|>)-?\d+)?|c[sf](?:<=|>=|=|<|>)-?\d+)*)/ig;
    const runs=[]; let totalDice=0;
    for(let r=0;r<repeat;r++){
      const termResults=[]; let rendererSupported=true; const requestedResults=[]; const rendererParts=[];
      let replaced=normalized.replace(tokenRe,(token,countText,sidesText,suffixText)=>{
        const count=Math.max(1,Number(countText||1)); totalDice+=count;
        if(totalDice>Number(CONFIG.diceLimit||500))throw new Error(`This portal allows at most ${CONFIG.diceLimit||500} base dice in one request.`);
        const sides=sidesText.toUpperCase()==='F'?'F':Number(sidesText);
        if(sides!=='F'&&(sides<2||sides>Number(CONFIG.maxSides||1000000)))throw new Error(`Die sides must be between 2 and ${CONFIG.maxSides||1000000}.`);
        const suffix=parseSuffix(suffixText||''); const chains=Array.from({length:count},()=>rollDieChain(sides,suffix));
        let indices=chains.map((_,i)=>i); const keep=suffix.keep; const k=keep?Math.max(0,Math.min(count,keep.count)):0;
        if(keep?.mode==='kh')indices=[...indices].sort((a,b)=>chains[b].total-chains[a].total).slice(0,k);
        if(keep?.mode==='kl')indices=[...indices].sort((a,b)=>chains[a].total-chains[b].total).slice(0,k);
        if(keep?.mode==='dh'){const drop=new Set([...indices].sort((a,b)=>chains[b].total-chains[a].total).slice(0,k));indices=indices.filter(i=>!drop.has(i));}
        if(keep?.mode==='dl'){const drop=new Set([...indices].sort((a,b)=>chains[a].total-chains[b].total).slice(0,k));indices=indices.filter(i=>!drop.has(i));}
        let subtotal;
        if(suffix.success){subtotal=indices.filter(i=>compare(chains[i].total,suffix.success.op,suffix.success.target)).length;}
        else subtotal=indices.reduce((sum,i)=>sum+chains[i].total,0);
        const failures=suffix.failure?indices.filter(i=>compare(chains[i].total,suffix.failure.op,suffix.failure.target)).length:0;
        if(suffix.failure)subtotal-=failures;
        for(const chain of chains){
          requestedResults.push(...chain.rawValues);
          for(const side of chain.rendererSides){if(![4,6,8,10,12,20,100].includes(side))rendererSupported=false;rendererParts.push(`1d${side}`);}
        }
        termResults.push({token,count,sides,suffix,chains,kept:indices,subtotal,failures});
        return `(${subtotal})`;
      });
      if(!termResults.length)return null;
      const leftover=replaced.replace(/[0-9eE+\-*/().\s]/g,'');
      if(leftover)throw new Error(`Unsupported expression text: ${leftover.slice(0,30)}`);
      const total=evaluateArithmetic(replaced);
      runs.push({total,termResults,rendererSupported,rendererExpression:rendererParts.join('+'),requestedResults});
    }
    const totals=runs.map(x=>x.total), allDice=[];
    runs.forEach((run,runIndex)=>run.termResults.forEach(term=>term.chains.forEach((chain,index)=>allDice.push({sides:term.sides,value:chain.total,faces:chain.values,kept:term.kept.includes(index),label:repeat>1?`Run ${runIndex+1}`:term.token}))));
    return {kind:'generic',label:repeat>1?`${repeat} × ${original}`:original,total:repeat>1?totals.reduce((a,b)=>a+b,0):totals[0],outcome:repeat>1?`Individual totals: ${totals.join(', ')}`:'',dice:allDice,details:runs.flatMap((run,i)=>run.termResults.map(term=>`${repeat>1?`Run ${i+1} · `:''}${term.token}: ${term.chains.map((c,j)=>`${term.kept.includes(j)?'':'dropped '}${c.values.join('!')}`).join(', ')} → ${term.subtotal}`)),rendererExpression:runs.every(x=>x.rendererSupported)?runs.map(x=>x.rendererExpression).filter(Boolean).join('+'):'',requestedResults:runs.flatMap(x=>x.requestedResults),rendererSupported:runs.every(x=>x.rendererSupported)};
  }

  function extractSignedModifier(text){const matches=String(text||'').match(/[+−–—-]\s*\d+/g);return matches?.length?Number(matches[0].replace(/[−–—\s]/g,'-')):0;}
  function extractTarget(text,labels=['dc','ac','tn','target','difficulty','vs','opposition']){
    for(const label of labels){const re=new RegExp(`\\b${label.replace(/\s+/g,'\\s+')}\\s*[:=]?\\s*(\\d+)`,'i');const m=String(text).match(re);if(m)return Number(m[1]);}
    return null;
  }
  function makeRenderer(dice){
    const supported=dice.every(d=>[4,6,8,10,12,20,100].includes(Number(d.rendererSides||d.sides))&&Number(d.raw??d.value)>=1);
    return {rendererSupported:supported,rendererExpression:supported?dice.map(d=>`1d${Number(d.rendererSides||d.sides)}`).join('+'):'',requestedResults:supported?dice.map(d=>Number(d.raw??d.value)):[]};
  }
  function rollExploding(sides){
    const rolls=[];let value;
    do{value=randomInt(1,sides);rolls.push(value);}while(value===sides&&rolls.length<101);
    return {rolls,total:rolls.reduce((a,b)=>a+b,0),first:rolls[0]};
  }
  function degreeShift(degree,amount){const levels=['critical failure','failure','success','critical success'];return levels[Math.max(0,Math.min(3,levels.indexOf(degree)+amount))];}

  function resolveDnd(text){
    const n=normalize(text); if(!/(attack|check|save|initiative|death save|concentration|advantage|disadvantage|d20 test)/.test(n))return null;
    const mod=extractSignedModifier(text); let expr=`1d20${signed(mod)}`;
    if(/advantage|\badv\b/.test(n))expr=`2d20kh1${signed(mod)}`;
    if(/disadvantage|\bdis\b/.test(n))expr=`2d20kl1${signed(mod)}`;
    const generic=parseAndRollGeneric(expr); const d20=generic.dice.find(d=>Number(d.sides)===20&&d.kept)?.value;
    const target=extractTarget(text); const details=[]; let outcome='D20 Test result';
    if(n.includes('death save')){outcome=d20===20?'Natural 20: regain 1 HP.':d20===1?'Natural 1: two failed death saves.':d20>=10?'Death save success.':'Death save failure.';}
    else if(target!=null)outcome=generic.total>=target?`Success against ${target}.`:`Failure against ${target}.`;
    if((n.includes('attack'))&&d20===20)details.push('Natural 20: critical hit under the normal attack rules.');
    if((n.includes('attack'))&&d20===1)details.push('Natural 1: attack misses under the normal attack rules.');
    return {...generic,kind:'dnd',label:text,total:generic.total,outcome,details:[...generic.details,...details],context:{target,natural:d20}};
  }
  function resolvePf2e(text){
    const n=normalize(text); if(!/(check|strike|attack|save|flat check|initiative|skill)/.test(n))return null;
    const mod=n.includes('flat check')?0:extractSignedModifier(text); const generic=parseAndRollGeneric(`1d20${signed(mod)}`); const natural=generic.dice[0]?.value;
    const dc=extractTarget(text,['dc','ac','vs','target']); if(dc==null)return {...generic,kind:'pf2e',label:text,outcome:'Pathfinder check total; add a DC to calculate the degree of success.',context:{natural}};
    let degree=generic.total>=dc+10?'critical success':generic.total>=dc?'success':generic.total<=dc-10?'critical failure':'failure';
    if(natural===20)degree=degreeShift(degree,1);if(natural===1)degree=degreeShift(degree,-1);
    return {...generic,kind:'pf2e',label:text,outcome:`${degree.replace(/\b\w/g,c=>c.toUpperCase())} against DC ${dc}.`,details:[...generic.details,`Natural ${natural}; total ${generic.total}; DC ${dc}.`],context:{dc,natural,degree}};
  }
  function resolveCoc(text){
    const n=normalize(text); const targetMatch=String(text).match(/\b(?:skill|sanity|luck|characteristic|check)\s*[:=]?\s*(\d{1,3})\b/i);
    if(!targetMatch&&!/(bonus die|penalty die|percentile check)/.test(n))return null;
    const target=Math.max(1,Math.min(100,Number(targetMatch?.[1]||50)));
    const bonus=Number(String(text).match(/\bbonus(?:\s+die|\s+dice)?\s*(\d+)?/i)?.[1]||(/\bbonus\b/.test(n)?1:0));
    const penalty=Number(String(text).match(/\bpenalty(?:\s+die|\s+dice)?\s*(\d+)?/i)?.[1]||(/\bpenalty\b/.test(n)?1:0));
    const net=Math.max(-2,Math.min(2,bonus-penalty)), units=randomInt(0,9), tens=Array.from({length:1+Math.abs(net)},()=>randomInt(0,9));
    const candidates=tens.map(t=>{const value=t*10+units;return value===0?100:value;}); const result=net>0?Math.min(...candidates):net<0?Math.max(...candidates):candidates[0];
    let outcome;if(result===1)outcome='Critical Success';else if(result===100||(target<50&&result>=96))outcome='Fumble';else if(result<=Math.floor(target/5))outcome='Extreme Success';else if(result<=Math.floor(target/2))outcome='Hard Success';else if(result<=target)outcome='Regular Success';else outcome='Failure';
    const dice=[...tens.map(v=>({sides:10,rendererSides:10,raw:v===0?10:v,value:v,label:'Tens die',kept:true})),{sides:10,rendererSides:10,raw:units===0?10:units,value:units,label:'Units die',kept:true}]; const renderer=makeRenderer(dice);
    return {kind:'coc7e',label:text,total:result,outcome:`${outcome} against ${target}.`,dice,details:[`Tens candidates: ${candidates.join(', ')}${net>0?' · lowest selected':net<0?' · highest selected':''}.`,`Hard ≤ ${Math.floor(target/2)}; Extreme ≤ ${Math.floor(target/5)}.`],...renderer,context:{target,net,candidates}};
  }
  function resolveGurps(text){
    const n=normalize(text); if(n.includes('reaction roll')){const generic=parseAndRollGeneric('3d6');return {...generic,kind:'gurps4e',label:text,outcome:'Reaction roll total; consult the active reaction table and modifiers.',context:{reaction:true}};}
    const m=String(text).match(/\b(?:skill|attribute|defense|self[- ]?control|resistance|check)\s*[:=]?\s*(\d+)\b/i); if(!m)return null;
    const target=Number(m[1]),generic=parseAndRollGeneric('3d6'),total=generic.total,margin=target-total; let outcome;
    if(total<=4||(total===5&&target>=15)||(total===6&&target>=16))outcome='Critical Success';
    else if(total===18||(total===17&&target<=15)||total>=target+10)outcome='Critical Failure';
    else outcome=total<=target?`Success by ${margin}`:`Failure by ${Math.abs(margin)}`;
    return {...generic,kind:'gurps4e',label:text,outcome:`${outcome} against effective ${target}.`,details:[...generic.details,`Margin: ${margin>=0?'+':''}${margin}.`],context:{target,margin}};
  }
  function resolveSwade(text){
    const n=normalize(text); if(n.includes('damage')){let expr=(String(text).match(/\d*d\d+(?:\s*[+-]\s*\d+)?/i)||['2d6'])[0].replace(/\s+/g,'');expr=expr.replace(/d(\d+)/ig,'d$1!');const generic=parseAndRollGeneric(expr);return {...generic,kind:'swade',label:text,outcome:'Damage dice Ace. Damage does not receive a Wild Die.',details:[...generic.details,'Compare damage with Toughness to determine Shaken, Raises, and Wounds.']};}
    const die=String(text).match(/\bd(4|6|8|10|12)\b/i); if(!die&&!/(unskilled|trait|soak)/.test(n))return null;
    const sides=Number(die?.[1]||4),mod=n.includes('unskilled')?-2:extractSignedModifier(text),isExtra=/\bextra\b|no wild/.test(n),trait=rollExploding(sides),wild=isExtra?null:rollExploding(6),chosen=!wild||trait.total>=wild.total?trait:wild,total=chosen.total+mod,target=extractTarget(text,['tn','target','vs','parry'])??4;
    const criticalFailure=Boolean(wild&&trait.first===1&&wild.first===1); const success=!criticalFailure&&total>=target,raises=success?Math.floor((total-target)/4):0;
    const outcome=criticalFailure?'Critical Failure':success?(raises?`Success with ${raises} Raise${raises===1?'':'s'}`:'Success'):'Failure';
    const dice=[];for(const v of trait.rolls)dice.push({sides,rendererSides:sides,raw:v,value:v,label:'Trait die',kept:chosen===trait});if(wild)for(const v of wild.rolls)dice.push({sides:6,rendererSides:6,raw:v,value:v,label:'Wild Die',kept:chosen===wild});const renderer=makeRenderer(dice);
    return {kind:'swade',label:text,total,outcome:`${outcome} against ${target}.`,dice,details:[`Trait ${trait.rolls.join('!')} = ${trait.total}${wild?`; Wild ${wild.rolls.join('!')} = ${wild.total}`:''}.`,`Modifier ${signed(mod)} applied after choosing the better die.`],...renderer,context:{target,raises,criticalFailure}};
  }
  function resolveFate(text){
    const n=normalize(text); if(!(/\bfate\b/.test(n)||/\d+d[fF]/.test(text)))return null;
    const mod=extractSignedModifier(text),generic=parseAndRollGeneric(`4dF${signed(mod)}`),target=extractTarget(text,['vs','opposition','difficulty']); let outcome='Fate roll total';
    if(target!=null){const shifts=generic.total-target;outcome=shifts<0?`Fail by ${Math.abs(shifts)} shift${Math.abs(shifts)===1?'':'s'}`:shifts===0?'Tie':shifts>=3?`Succeed with style by ${shifts} shifts`:`Succeed by ${shifts} shift${shifts===1?'':'s'}`;}
    return {...generic,kind:'fate',label:text,outcome:target==null?outcome:`${outcome} against opposition ${target}.`,context:{target,shifts:target==null?null:generic.total-target}};
  }
  function resolveDaggerheart(text){
    const n=normalize(text); if(/\badversary\b/.test(n)){const mod=extractSignedModifier(text),adv=/advantage/.test(n),dis=/disadvantage/.test(n),expr=adv?'2d20kh1':dis?'2d20kl1':'1d20';const generic=parseAndRollGeneric(`${expr}${signed(mod)}`),target=extractTarget(text,['vs','difficulty','evasion']);return {...generic,kind:'daggerheart-adversary',label:text,outcome:target==null?'Adversary roll total.':generic.total>=target?`Adversary succeeds against ${target}.`:`Adversary fails against ${target}.`,context:{target}};}
    if(!/(action|attack|reaction|duality|spellcast)/.test(n))return null;
    const mod=extractSignedModifier(text),difficulty=extractTarget(text,['difficulty','vs','evasion','dc']);
    const adv=Number(String(text).match(/\badvantage\s*(\d+)?/i)?.[1]||(/\badvantage\b/.test(n)?1:0)),dis=Number(String(text).match(/\bdisadvantage\s*(\d+)?/i)?.[1]||(/\bdisadvantage\b/.test(n)?1:0)),net=adv-dis;
    const hope=randomInt(1,12),fear=randomInt(1,12),extra=Array.from({length:Math.abs(net)},()=>randomInt(1,6)),extraTotal=extra.reduce((a,b)=>a+b,0)*(net<0?-1:1),total=hope+fear+mod+extraTotal,critical=hope===fear,duality=hope>fear?'Hope':'Fear';
    let outcome;if(critical)outcome='Critical Success · gain 1 Hope and clear 1 Stress';else if(difficulty==null)outcome=`Roll with ${duality}`;else outcome=`${total>=difficulty?'Success':'Failure'} with ${duality}`;
    const dice=[{sides:12,rendererSides:12,raw:hope,value:hope,label:'Hope Die',kept:true},{sides:12,rendererSides:12,raw:fear,value:fear,label:'Fear Die',kept:true},...extra.map(v=>({sides:6,rendererSides:6,raw:v,value:v,label:net>0?'Advantage':'Disadvantage',kept:true}))];const renderer=makeRenderer(dice);
    const resource=critical?'Gain 1 Hope.':duality==='Hope'?'Gain 1 Hope.':'GM gains 1 Fear.';
    return {kind:'daggerheart',label:text,total,outcome:difficulty==null?outcome:`${outcome} against Difficulty ${difficulty}.`,dice,details:[`Hope ${hope}; Fear ${fear}; modifier ${signed(mod)}${extra.length?`; ${net>0?'advantage':'disadvantage'} ${extra.join(', ')} (${extraTotal>=0?'+':''}${extraTotal})`:''}.`,resource,critical?'Matching Duality Dice count as a roll with Hope.':''],...renderer,context:{difficulty,hope,fear,duality,critical}};
  }
  function resolveBlades(text){
    const n=normalize(text); const m=String(text).match(/\b(?:action|resistance|fortune|engagement|pool)\s*(?:pool)?\s*[:=]?\s*(-?\d+)\b/i)||String(text).match(/\b(-?\d+)\s*(?:dice|d)\b/i);if(!m)return null;
    const pool=Number(m[1]),zero=pool<=0,count=zero?2:Math.min(20,pool),rolls=Array.from({length:count},()=>randomInt(1,6)),highest=zero?Math.min(...rolls):Math.max(...rolls),sixes=rolls.filter(v=>v===6).length,critical=!zero&&sixes>=2;
    let outcome=critical?'Critical':highest===6?'Full success':highest>=4?'Mixed or partial result':'Bad or weak result';
    const resistance=/\bresistance\b/.test(n);if(resistance)outcome=critical?'Critical resistance: clear 1 stress':`Resistance stress cost: ${6-highest}`;
    const position=['controlled','risky','desperate'].find(x=>n.includes(x))||null,effect=['zero','limited','standard','great','extreme'].find(x=>n.includes(x))||null;
    const dice=rolls.map(v=>({sides:6,rendererSides:6,raw:v,value:v,label:zero?'Zero-die fallback':'Pool d6',kept:v===highest}));const renderer=makeRenderer(dice);
    return {kind:'blades',label:text,total:highest,outcome,dice,details:[`Pool ${pool}: [${rolls.join(', ')}]; ${zero?'kept lower':'kept highest'} ${highest}.`,position?`Position: ${position}.`:'',effect?`Effect: ${effect}.`:'',position==='desperate'?'Mark 1 XP in the attribute containing the rolled action.':''].filter(Boolean),...renderer,context:{pool,position,effect,critical,resistance}};
  }
  function resolvePbta(text){
    const n=normalize(text); if(!/\bmove\b|pbta/.test(n))return null;
    if(variant().id==='implementation-specific'&&!/\d+d\d+/.test(n))return {kind:'pbta',label:text,total:null,outcome:'No universal roll made.',dice:[],details:['This campaign is set to implementation-specific resolution. Enter the exact dice expression from the selected game or change to the classic 2d6 baseline.'],rendererSupported:false,rendererExpression:'',requestedResults:[]};
    const mod=extractSignedModifier(text),generic=parseAndRollGeneric(`2d6${signed(mod)}`),outcome=generic.total>=10?'Strong hit (10+)':generic.total>=7?'Weak hit or mixed result (7–9)':'Miss (6−)';
    return {...generic,kind:'pbta',label:text,outcome,details:[...generic.details,'The exact move text controls choices, costs, and consequences. A natural 12 or snake eyes has no universal special meaning.'],context:{band:outcome}};
  }

  const SYSTEM_RESOLVERS={dnd:resolveDnd,pf2e:resolvePf2e,coc7e:resolveCoc,gurps4e:resolveGurps,swade:resolveSwade,fate:resolveFate,daggerheart:resolveDaggerheart,blades:resolveBlades,pbta:resolvePbta};
  function resolveSystemRoll(text){return SYSTEM_RESOLVERS[state.system]?.(text)||null;}

  function resultHtml(result){
    const dice=(result.dice||[]).map(d=>`<span class="dicebot-chatbot-pill">${esc(d.label||`d${d.sides}`)}: ${esc(Array.isArray(d.faces)?d.faces.join('!'):d.value)}${d.kept===false?' · dropped':''}</span>`).join(' ');
    const details=(result.details||[]).filter(Boolean).map(item=>`<li>${esc(item)}</li>`).join('');
    const total=result.total==null?'':`<b>${esc(result.label)} → ${esc(result.total)}</b>`;
    return `<div class="dicebot-chatbot-roll">${total}${result.outcome?`<h4>${esc(result.outcome)}</h4>`:''}<div>${dice}</div>${details?`<ul>${details}</ul>`:''}<small>${esc(profile().title)} · ${esc(variant().label)}${state.campaign.name?` · ${esc(state.campaign.name)}`:''}</small></div>`;
  }
  function renderTextDice(result){
    if(!els.row)return;const dice=result.dice||[];
    els.row.innerHTML=dice.slice(0,30).map(d=>`<span class="dicebot-die d${esc(d.sides)}${d.kept===false?' dropped':''}" data-sides="d${esc(d.sides)}" title="${esc(d.label||'die')}">${esc(d.value)}</span>`).join('')+(dice.length>30?`<span class="dicebot-die-more">+${dice.length-30} more</span>`:'')+(result.total==null?'':`<strong class="dnd-roll-total">Result ${esc(result.total)}</strong>`);
  }
  function animateRenderer(result){
    const count=result.requestedResults?.length||0,limit=Number(CONFIG.rendererDiceLimit||20);
    if(!result.rendererSupported||!result.rendererExpression||count>limit||!els.frame?.contentWindow){if(els.stageTitle)els.stageTitle.textContent=count>limit?`Text result shown; the 3D table renders up to ${limit} dice.`:'Text result shown; this roll uses a non-polyhedral or special readout.';return;}
    els.frame.contentWindow.postMessage({type:'DICEBOT_DICE_MAIN_ROLL',payload:{expression:result.rendererExpression,displayExpression:result.label,requestedResults:result.requestedResults,displayTotal:Number.isFinite(Number(result.total))?Number(result.total):null,stylePool:[selectedTheme()],soundPool:[selectedAudio()]}},'*');
  }
  function performRoll(text){
    let result;
    try{result=resolveSystemRoll(text)||parseAndRollGeneric(text);}catch(error){addMessage('bot',`<p><b>Roll error:</b> ${esc(error.message)}</p>`,'Roll error');setStatus(error.message);return null;}
    if(!result)return null;
    addMessage('user',esc(text),'Roll request');addMessage('bot',resultHtml(result),`${profile().short} roll result`);renderTextDice(result);state.lastRoll={system:state.system,variant:variant().id,label:result.label,total:result.total,outcome:result.outcome,context:result.context||null};
    setStatus(`${profile().short} roll complete${result.total==null?'':`: ${result.total}`}.`);if(els.stageTitle)els.stageTitle.textContent=`Rolling ${text}…`;setToken(`Rolling ${text}`,true);setTimeout(()=>setToken(result.outcome||`Result ${result.total}`,false),900);animateRenderer(result);return result;
  }

  function flattenReference(value,path='',output=[],depth=0){
    if(value==null||depth>10)return output;
    if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'){const text=String(value).trim();if(text)output.push({path,text:truncate(text,2400),normalized:normalize(`${path} ${text}`)});return output;}
    if(Array.isArray(value)){const primitive=value.every(item=>['string','number','boolean'].includes(typeof item));if(primitive){const text=value.slice(0,80).join('; ');if(text)output.push({path,text:truncate(text,2400),normalized:normalize(`${path} ${text}`)});}else value.slice(0,300).forEach((item,index)=>flattenReference(item,`${path}[${index}]`,output,depth+1));return output;}
    Object.entries(value).slice(0,600).forEach(([key,item])=>flattenReference(item,path?`${path}.${key}`:key,output,depth+1));return output;
  }
  function ensureIndex(){
    if(state.indexes[state.system])return state.indexes[state.system];
    const db=database(),subset={};for(const rootName of profile().roots){if(db[rootName]!=null)subset[rootName]=db[rootName];}
    state.indexes[state.system]=flattenReference(subset);return state.indexes[state.system];
  }
  function formatValue(value){
    if(value==null)return '';
    if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return `<p>${esc(truncate(value,1200))}</p>`;
    const rows=[];
    const visit=(item,path='',depth=0)=>{
      if(rows.length>=12||item==null||depth>6)return;
      if(typeof item==='string'||typeof item==='number'||typeof item==='boolean'){
        rows.push({path:path||'value',text:truncate(item,520)});return;
      }
      if(Array.isArray(item)){
        item.slice(0,14).forEach((entry,index)=>visit(entry,path?`${path}[${index}]`:`item ${index+1}`,depth+1));return;
      }
      Object.entries(item).slice(0,24).forEach(([key,entry])=>visit(entry,path?`${path}.${key}`:key,depth+1));
    };
    visit(value);
    if(!rows.length)return `<p>${esc(truncate(JSON.stringify(value),1200))}</p>`;
    return `<dl>${rows.map(row=>`<dt>${esc(titlePath(row.path))}</dt><dd>${esc(row.text)}</dd>`).join('')}</dl>${rows.length>=12?'<small>Showing a focused excerpt. Ask a narrower follow-up for more of this section.</small>':''}`;
  }
  function preferredSections(query){
    const n=normalize(query),sections=[];
    for(const [key,paths] of Object.entries(profile().topicPaths||{})){if(n.includes(normalize(key)))for(const path of paths){const value=getPath(database(),path);if(value!=null)sections.push({path,value});}}
    return sections;
  }
  function modeBias(){
    return state.bot==='character'?['character','class','playbook','skill','equipment','ancestry','species','race','advancement']:
      state.bot==='facilitator'?['gm','keeper','facilitator','adjudication','encounter','npc','opposition','campaign','scene']:
      state.bot==='roller'?['dice','roll','resolution','probability','success','critical','target','modifier']:
      state.bot==='campaign'?['campaign','scene','session','table','adventure','tone','safety']:['rules','reference','quick','guide'];
  }
  function localReferenceAnswer(query){
    const sections=preferredSections(query);
    if(sections.length){
      const html=sections.slice(0,3).map(({path,value})=>`<article class="dnd-rule-answer"><h4>${esc(titlePath(path))}</h4>${formatValue(value)}<small>${esc(path)} · ${esc(profile().title)}</small></article>`).join('');
      return {html:campaignWrapped(html,query),snippets:sections.slice(0,3).map(({path,value})=>({path,text:truncate(JSON.stringify(value),900)}))};
    }
    const stop=new Set('the a an and or to of for in on with is are was were how what does do tell explain rule rules about my your this that from when can i me please our campaign system'.split(' '));
    const tokens=normalize(query).split(' ').filter(t=>t.length>2&&!stop.has(t));const phrase=normalize(query),bias=modeBias();
    const ranked=ensureIndex().map(entry=>{let score=0;for(const token of tokens)if(entry.normalized.includes(token))score+=token.length+5;if(phrase.length>4&&entry.normalized.includes(phrase))score+=55;if(bias.some(part=>entry.path.toLowerCase().includes(part)))score+=5;return {...entry,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.text.length-b.text.length).slice(0,6);
    if(!ranked.length)return {html:campaignWrapped(`<p>I could not find a supported entry for <b>${esc(query)}</b> in the supplied ${esc(profile().title)} reference. Try a named rule, move, action, skill, condition, class/playbook, spell/power, or exact dice expression.</p>`,query),snippets:[]};
    const html=ranked.map(entry=>`<article class="dnd-rule-answer"><h4>${esc(titlePath(entry.path))}</h4><p>${esc(truncate(entry.text,800))}</p><small>${esc(entry.path)}</small></article>`).join('');
    return {html:campaignWrapped(html,query),snippets:ranked.map(entry=>({path:entry.path,text:truncate(entry.text,700)}))};
  }
  function campaignWrapped(html,query=''){
    if(state.bot!=='campaign'&&!/\b(campaign|party|crew|scene|house rule|our game|our table)\b/i.test(String(query||'')))return html;
    const summary=campaignSummary();if(!summary)return `<article class="dnd-rule-answer"><h4>Campaign context</h4><p>No campaign details are saved yet. The system answer below uses only the active reference.</p></article>${html}`;
    return `<article class="dnd-rule-answer"><h4>${esc(state.campaign.name||'Campaign context')}</h4><p>${esc(truncate(summary,1200)).replace(/\n/g,'<br>')}</p><small>Saved campaign context is advisory. Explicit house rules may override the baseline at this table.</small></article>${html}`;
  }
  async function connectedAnswer(question,local){
    const request=window.RoleplayingBackend.request(CONFIG.backendAction||'ttrpg_portal_assistant',{question,system:{id:state.system,title:profile().title,variant:variant()},botMode:state.bot,campaign:state.campaign,lastRoll:state.lastRoll?.system===state.system?state.lastRoll:null,referenceSnippets:local.snippets,source:{title:database().metadata?.title,schemaVersion:database().metadata?.schema_version}});
    const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('Backend request timed out.')),12000));const result=await Promise.race([request,timeout]);const answer=result?.answer||result?.message||result?.text||result?.data?.answer;if(!answer)throw new Error('Backend returned no assistant answer.');return String(answer);
  }
  async function answerQuestion(text){
    addMessage('user',esc(text),'Question');setStatus(`Searching the supplied ${profile().title} reference…`);setToken(`Searching ${profile().short} reference`,true);const local=localReferenceAnswer(text);
    if(state.bot==='connected'){
      try{const connected=await connectedAnswer(text,local);addMessage('bot',`<article class="dnd-rule-answer"><h4>Connected backend answer</h4><p>${esc(connected).replace(/\n/g,'<br>')}</p><small>${esc(profile().title)} · ${esc(variant().label)} · campaign context included</small></article>${local.html}`,'Connected Dice Bot');setStatus('Connected answer received; local reference matches are included.');}
      catch(error){addMessage('bot',`<p><b>Backend unavailable:</b> ${esc(error.message)}</p>${local.html}`,'Local reference fallback');setStatus('Backend unavailable; answered from the supplied local reference.');}
    }else{addMessage('bot',local.html,activeBotLabel());setStatus(`Answer loaded from the supplied ${profile().title} reference.`);}
    setToken(`${profile().short} answer ready`,false);
  }
  function looksLikeQuestion(text){const n=normalize(text);return /^(what|how|why|when|where|who|explain|tell|lookup|look up|find|rule|rules|can|does|is|are)\b/.test(n)||/[?]$/.test(String(text).trim());}
  async function handleInput(text){const value=String(text||'').trim();if(!value)return;if(looksLikeQuestion(value))return answerQuestion(value);const result=performRoll(value);if(!result)return answerQuestion(value);}

  function bind(){
    document.addEventListener('change',event=>{
      const t=event.target;
      if(t.matches?.('[data-ttrpg-system-select]'))setSystem(t.value,true);
      else if(t.matches?.('[data-ttrpg-variant-select]'))setVariant(t.value,true);
      else if(t.matches?.('[data-ttrpg-bot-mode]'))setBotMode(t.value,true);
      else if(t.matches?.('[data-campaign-field]'))syncCampaignFields(t);
    });
    document.addEventListener('input',event=>{if(event.target.matches?.('[data-campaign-field]'))syncCampaignFields(event.target);});
    document.addEventListener('click',event=>{
      const target=event.target.closest?.('button');if(!target)return;
      if(target.matches('[data-system-card]')){setSystem(target.getAttribute('data-system-id'),true);if(target.hasAttribute('data-open-dice'))window.RoleplayingPortal?.openPage?.('dice-roller');}
      else if(target.matches('[data-quick-roll]'))handleInput(target.getAttribute('data-quick-roll'));
      else if(target.matches('[data-system-query]'))answerQuestion(target.getAttribute('data-system-query'));
      else if(target.matches('[data-save-campaign]'))saveCampaign();
      else if(target.matches('[data-sync-campaign]'))syncCampaignBackend();
      else if(target.matches('[data-roll-universal]')){const expr=els.expressionInput?.value?.trim();if(expr){const targetValue=els.expressionTarget?.value?.trim();const result=performRoll(expr);if(result&&targetValue!==''&&Number.isFinite(Number(targetValue))&&Number.isFinite(Number(result.total))){const targetNumber=Number(targetValue);const met=Number(result.total)>=targetNumber;addMessage('bot',`<div class="dicebot-chatbot-roll"><h4>${met?'Target met':'Target not met'}</h4><p>${esc(result.total)} ${met?'≥':'<'} ${esc(targetNumber)}</p><small>Universal target comparison; the active system resolver still controls any system-specific degree, margin, or consequence rules.</small></div>`,'Target comparison');setStatus(`${profile().short} roll ${met?'met':'did not meet'} target ${targetNumber}.`);}}}
      else if(target.matches('[data-clear-button]')){if(els.log)els.log.innerHTML='';if(els.row)els.row.innerHTML='';setStatus(`${profile().title} assistant history cleared.`);}
    });
    els.form?.addEventListener('submit',event=>{event.preventDefault();const value=els.input?.value||'';if(els.input)els.input.value='';handleInput(value);});
    els.styleSelect?.addEventListener('change',()=>{safeStore.set(STORAGE.style,els.styleSelect.value);renderStylePreview();sendRendererConfig();});
    els.audioSelect?.addEventListener('change',()=>{safeStore.set(STORAGE.audio,els.audioSelect.value);if(els.audioStatus)els.audioStatus.textContent=`${selectedAudio()?.name} applies to the next roll.`;sendRendererConfig();});
    window.addEventListener('message',event=>{const data=event.data||{};if(data.type==='DICEBOT_DICE_MAIN_READY'){state.frameReady=true;sendRendererConfig();if(els.stageTitle)els.stageTitle.textContent='Universal 3D dice table ready.';}if(data.type==='DICEBOT_DICE_MAIN_RESULT'&&els.stageTitle)els.stageTitle.textContent=`3D roll complete · ${data.displayTotal??'special result shown in Dice Bot'}`;if(data.type==='DICEBOT_DICE_MAIN_ERROR'&&els.stageTitle)els.stageTitle.textContent=`3D table: ${data.message||'text result retained'}`;});
    document.addEventListener('roleplaying:pagechange',event=>{updateDocumentTitle(event.detail?.page);if(event.detail?.page==='dice-roller')setTimeout(sendRendererConfig,80);});
  }

  function init(){
    qa('[data-campaign-field]').forEach(el=>{const field=el.getAttribute('data-campaign-field');el.value=state.campaign[field]||'';});
    qa('[data-ttrpg-bot-mode]').forEach(select=>{select.innerHTML=Object.entries(BOT_MODES).map(([id,m])=>`<option value="${id}">${esc(m.label)}</option>`).join('');select.value=state.bot;});
    syncAppearance();bind();renderCampaignSummary();renderSystemUI(false);setBotMode(state.bot,false);
    addMessage('bot',`<p><b>Multi-system reference engine loaded.</b></p><p>Active system: <b>${esc(profile().title)}</b> · ${esc(variant().label)}.</p><p>Use the system selector, save campaign context, roll a system shortcut, enter universal dice notation, or ask the selected Dice Bot a rules or campaign question.</p>`,'TTRPG Portal ready');
    setStatus(`${Object.keys(SYSTEMS).length} system references loaded.`);
    window.TTRPGPortal=Object.freeze({systems:SYSTEMS,databases:DATABASES,getSystem:()=>state.system,setSystem,roll:performRoll,ask:answerQuestion,getCampaign:()=>({...state.campaign}),setCampaign:data=>{state.campaign={...state.campaign,...data};saveCampaign();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
