/*
  Belavadös JSON Library Pulls for Emperor Onyx.
  Split out of emperor_onyx_rulebot.html so HTML stays structural only.
  Loaded data becomes available on window.BELAVADOS_JSON and through the belavados-json-ready event.
*/
(function(){
  'use strict';
  const FALLBACK_PULLS = {
    races: "json/belavados_races.json",
    alignments: "json/belavados_alignments.json",
    provinces: "json/belavados_provinces.json",
    factions: "json/belavados_factions.json",
    transportation: "json/belavados_transportation.json",
    interactiveLocations: "json/belavados_interactive_locations.json",
    npcs: "json/belavados_npcs.json",
    timeConversion: "json/belavados_time_conversion.json",
    pantheon: "json/belavados_pantheon.json",
    biomes: "json/belavados_biomes.json",
    encounterDirectory: "json/belavados_encounter_directory.json",
    questHooks: "json/belavados_quest_hooks.json",
    campaignTimeline: "json/belavados_campaign_timeline.json",
    constellations: "json/belavados_night_sky.json",
    chatLogs: "json/belavados_chat_logs.json"
  };

  window.BELAVADOS_JSON_PULLS = window.BELAVADOS_JSON_PULLS || FALLBACK_PULLS;
  window.BELAVADOS_JSON = window.BELAVADOS_JSON || {};
  window.BELAVADOS_JSON_ERRORS = window.BELAVADOS_JSON_ERRORS || {};

  async function loadPullMap(){
    try{
      const response = await fetch('json/onyx_json_pulls.json', { cache:'no-store' });
      if(response.ok){
        const fromJson = await response.json();
        if(fromJson && typeof fromJson === 'object') window.BELAVADOS_JSON_PULLS = fromJson;
      }
    }catch(error){
      console.warn('[Onyx JSON Pull Map Fallback]', error);
    }
    return window.BELAVADOS_JSON_PULLS;
  }

  window.BELAVADOS_JSON_READY = loadPullMap().then((pulls) => Promise.allSettled(
    Object.entries(pulls).map(async ([key, url]) => {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const data = await response.json();
        window.BELAVADOS_JSON[key] = data;
        return { key, url, ok: true, data };
      } catch (error) {
        console.warn(`[Onyx JSON Pull Failed] ${key}: ${url}`, error);
        window.BELAVADOS_JSON_ERRORS[key] = { key, url, ok: false, message: error.message || String(error) };
        return { key, url, ok: false, error: error.message || String(error) };
      }
    })
  )).then((results) => {
    const loaded = Object.keys(window.BELAVADOS_JSON);
    const failed = Object.keys(window.BELAVADOS_JSON_ERRORS);
    window.dispatchEvent(new CustomEvent('belavados-json-ready', { detail: { loaded, failed, data: window.BELAVADOS_JSON, errors: window.BELAVADOS_JSON_ERRORS, results } }));
    console.info('[Onyx JSON Library Ready]', { loaded, failed, data: window.BELAVADOS_JSON, errors: window.BELAVADOS_JSON_ERRORS });
    return { loaded, failed, data: window.BELAVADOS_JSON, errors: window.BELAVADOS_JSON_ERRORS, results };
  });
})();
