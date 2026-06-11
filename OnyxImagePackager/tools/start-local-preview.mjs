#!/usr/bin/env node
import http from 'node:http';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const port = Number(process.env.PORT || 5177);
const requestedLocalAssetRoot = process.env.ONYX_MAP_ASSET_DIR || 'C:\\Users\\Public\\Pictures\\map_assets';
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml'
};

function resolveMaybeWindows(input, base = root) {
  const value = String(input || '').trim();
  if (/^[A-Za-z]:[\\/]/.test(value)) return path.normalize(value);
  if (path.isAbsolute(value)) return path.normalize(value);
  return path.resolve(base, value);
}

const localAssetRoot = resolveMaybeWindows(requestedLocalAssetRoot);

function send404(res, message = 'OnyxImagePackager cannot find that file.') {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(message);
}

function corsHeaders(type) {
  return {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders('text/plain; charset=utf-8'));
      res.end();
      return;
    }
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    const rawPath = decodeURIComponent(url.pathname === '/' ? '/OnyxImagePackager.html' : url.pathname);

    if (rawPath.startsWith('/local-map-assets/')) {
      const rel = rawPath.slice('/local-map-assets/'.length).replace(/^\/+/, '');
      const filePath = path.resolve(localAssetRoot, rel);
      const rootCheck = path.resolve(localAssetRoot).toLowerCase();
      if (!filePath.toLowerCase().startsWith(rootCheck)) throw new Error('Out of bounds local asset path');
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) throw new Error('Local asset is not a file');
      res.writeHead(200, corsHeaders(mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream'));
      if (req.method === 'HEAD') res.end();
      else createReadStream(filePath).pipe(res);
      return;
    }

    const filePath = path.resolve(root, `.${rawPath}`);
    if (!filePath.startsWith(root)) throw new Error('Out of bounds project path');
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error('Project asset is not a file');
    res.writeHead(200, corsHeaders(mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream'));
    if (req.method === 'HEAD') res.end();
    else createReadStream(filePath).pipe(res);
  } catch (err) {
    send404(res);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`OnyxImagePackager is previewing at http://127.0.0.1:${port}/`);
  console.log(`Local map_assets image bridge: http://127.0.0.1:${port}/local-map-assets/`);
  console.log(`Serving real images from: ${localAssetRoot}`);
});
