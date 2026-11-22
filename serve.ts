// Tiny static server for local play-testing only (never part of the entry's grading):
// serves game/ at http://localhost:8080 so the game can be played in desktop Chrome
// exactly as a static host would serve it. Node 22+, standard library only.
//
//   node serve.ts [port]
// Then open http://localhost:8080/ (or http://localhost:8080/?shot=play&seed=1
// to stage a screenshot scene).

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(join(here, 'game'));
const port = Number.parseInt(process.argv[2] ?? '8080', 10) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const file = resolve(join(root, rel));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found\n');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`Serving game/ at http://localhost:${port}/`);
});
