export async function loadReactionPackage(baseUrl, registry) {
  const core = await fetch(`${baseUrl}/core/reactions.json`).then(r => r.json());
  registry.registerCore(core.reactions);
  return core;
}

export async function loadExpansion(baseUrl, namespace, registry, {enable = true} = {}) {
  const root = `${baseUrl}/expansions/${namespace}`;
  const [manifest, reactionFile] = await Promise.all([
    fetch(`${root}/manifest.json`).then(r => r.json()),
    fetch(`${root}/reactions.json`).then(r => r.json()),
  ]);
  registry.registerExpansion(manifest, reactionFile.reactions);
  if (enable) registry.enableExpansion(namespace);
  const module = await import(`${root}/register.js`);
  if (module.afterRegister) module.afterRegister(registry, manifest);
  return manifest;
}
