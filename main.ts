// The Marlowe Job — make.fun entry program (Node 22+, standard library only).
//
// This program hands the game in: it copies the playable static game in game/ and the
// screenshots in screenshots/ from beside this file into the output directory, then writes
// output/dossier.json with the vendored make.fun library, which summarises the game for the
// judge. The grader runs it twice in a sandbox with no network; both runs must write the
// same bytes, so there is no timestamp, no randomness and no environment-dependent output
// here — the copy is a plain recursive copy and the dossier is built from the files alone.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps match the gate's own limits (see the competition's rules): the dossier is
// capped at 160 KiB of source text, screenshots at 4 files of 256 KiB each, and game/ at
// 993 files and 48 MiB in all — the whole of /output shares the platform's 1,000-entry,
// 64 MiB cap, so the game, its screenshots and the dossier must leave each other room.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
