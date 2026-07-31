function hasEvery(source, required = []) { return required.every(value => source.has(value)); }
function hasAny(source, required = []) { return required.length === 0 || required.some(value => source.has(value)); }

export function reactionIsAvailable(reaction, context) {
  const capabilities = new Set(context.capabilities || []);
  const infrastructure = new Set(context.infrastructure || []);
  const req = reaction.availability || {};
  if (!hasEvery(capabilities, req.capabilities || [])) return false;
  if (!hasEvery(infrastructure, req.allInfrastructure || [])) return false;
  if (!hasAny(infrastructure, req.anyInfrastructure || [])) return false;
  return true;
}

export function resolveTechnologyProfile(profiles, technologyId) {
  const profile = profiles.find(p => p.id === technologyId);
  if (!profile) throw new Error(`Unknown technology profile: ${technologyId}`);
  return profile;
}

export function resolveTransportMode({profile, route, npc, requestedModeId}) {
  const infrastructure = new Set(route?.infrastructure || profile.infrastructure || []);
  const candidates = profile.modes.filter(mode =>
    mode.requiredInfrastructure.every(req => infrastructure.has(req)) &&
    (!route?.allowedModeIds || route.allowedModeIds.includes(mode.id))
  );
  if (requestedModeId) {
    const exact = candidates.find(mode => mode.id === requestedModeId);
    if (exact) return exact;
  }
  if (npc?.preferredModeIds) {
    for (const id of npc.preferredModeIds) {
      const preferred = candidates.find(mode => mode.id === id);
      if (preferred) return preferred;
    }
  }
  return candidates.sort((a,b) => (b.speedFactor - a.speedFactor))[0]
    || profile.modes.find(mode => mode.id === 'walking')
    || profile.modes[0];
}

export function renderTransportReactionLabel(reaction, mode) {
  const phase = reaction.intent;
  const generic = reaction.label;
  const replacements = {
    'boarding_transportation': `Boarding ${mode.label}`,
    'waiting_for_transportation': `Waiting for ${mode.label}`,
    'disembarking_transportation': `Leaving ${mode.label}`,
    'operating_a_vehicle': `Operating ${mode.label}`,
    'driving_a_vehicle': `Operating ${mode.label}`,
    'piloting_a_vehicle': `Piloting ${mode.label}`,
  };
  return replacements[phase] || generic;
}
