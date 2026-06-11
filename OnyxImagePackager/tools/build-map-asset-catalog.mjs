#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const assetDir = path.join(root, 'assets', 'map_assets');
const outPrimary = path.join(root, 'json', 'map_assets_catalog.json');
const outCopy = path.join(assetDir, 'map_assets_catalog.json');
const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

const keywordGroups = {
  terrain: ['terrain','ground','land','dirt','soil','grass','meadow','prairie','field','farm','sand','beach','shore','mud','moss','rock','stone','cliff','mountain','hill','valley','cave','cavern','floor','tile','plateau'],
  water: ['water','ocean','sea','river','lake','pond','stream','creek','shore','coast','wave','waterfall','canal','underwater','submerged'],
  reef: ['reef','coral','kelp','shell','anemone','seagrass','lagoon'],
  plants: ['plant','tree','forest','woods','bush','shrub','leaf','leaves','flower','grass','moss','root','log','stump','reed','swamp','marsh','vine','canopy','palm','orchard'],
  building: ['building','house','home','hut','cottage','cabin','tower','castle','wall','gate','roof','temple','shrine','market','shop','barn','inn','tavern','mill','dome','platform','treehouse','ruin'],
  path: ['path','road','trail','street','bridge','stairs','ladder','ramp','plank','pier','dock','walkway','fence','rail'],
  object: ['object','prop','crate','barrel','cart','wagon','well','sign','statue','lamp','lantern','torch','boat','ship','anchor','crystal','ore','table','bench','rockpile','chest']
};

function normalize(text) {
  return String(text || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/[^a-z0-9\s.]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tagFile(relPath) {
  const text = normalize(relPath);
  const categories = [];
  const tags = new Set();
  for (const [category, words] of Object.entries(keywordGroups)) {
    for (const word of words) {
      if (text.includes(normalize(word))) {
        if (!categories.includes(category)) categories.push(category);
        tags.add(category);
        tags.add(normalize(word).replace(/\s+/g, '-'));
      }
    }
  }
  if (!categories.length) categories.push('object');
  return { categories, tags: Array.from(tags) };
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else if (entry.isFile() && imageExts.has(path.extname(entry.name).toLowerCase())) {
      const stat = await fs.stat(full);
      const relToAsset = path.relative(assetDir, full).split(path.sep).join('/');
      const relToRoot = path.relative(root, full).split(path.sep).join('/');
      const tagged = tagFile(relToAsset);
      files.push({
        name: entry.name,
        path: relToRoot,
        relativePath: relToAsset,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        categories: tagged.categories,
        tags: tagged.tags
      });
    }
  }
  return files;
}

try {
  await fs.mkdir(path.dirname(outPrimary), { recursive: true });
  await fs.mkdir(assetDir, { recursive: true });
  const assets = await walk(assetDir);
  const catalog = {
    app: 'Emperor Onyx Map Request Packager',
    generatedAt: new Date().toISOString(),
    assetRoot: 'assets/map_assets',
    count: assets.length,
    assets
  };
  const text = JSON.stringify(catalog, null, 2);
  await fs.writeFile(outPrimary, text, 'utf8');
  await fs.writeFile(outCopy, text, 'utf8');
  console.log(`Emperor Onyx cataloged ${assets.length} image assets.`);
  console.log(`Wrote ${path.relative(root, outPrimary)}`);
  console.log(`Wrote ${path.relative(root, outCopy)}`);
} catch (error) {
  console.error('Emperor Onyx refused the catalog because:', error.message);
  process.exit(1);
}
