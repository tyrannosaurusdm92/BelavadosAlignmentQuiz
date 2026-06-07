
(function(){
  'use strict';
  const LS = window.LifeSim;
  LS.generateSchedules = (npcs, locations, config) => {
    const days = ['Moonday','Tideday','Forgeway','Rootday','Starday','Lantern Eve','Market Rest'];
    const schedules = npcs.map(n => {
      const visits = n.visitLocationNames || [];
      const weekly = days.map(day => ({
        day,
        morning: `Home duties at ${n.residence}`,
        midday: `Work as ${n.profession} at ${n.workplace}`,
        evening: visits.length ? `Visits ${LS.choose(visits)}` : 'Walks the public district',
        night: LS.choose(['home by second bell','late guild errand','quiet shrine visit','keeps watch over household','moonlit walk'])
      }));
      n.schedule = {timezone:config.timeZone, summary:`${n.name} normally works at ${n.workplace}, returns to ${n.residence}, and follows ${config.timeZone} transit boards.`, weekly};
      return {id:LS.uid('sch'), npcId:n.id, npcName:n.name, timezone:config.timeZone, weekly};
    });
    return schedules;
  };
})();
