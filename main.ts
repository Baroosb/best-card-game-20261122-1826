// Emberfall Duel — hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (index.html plus its ES
// modules and stylesheet; it plays offline in a desktop browser and loads
// nothing from the network). This program copies game/ and screenshots/
// into the output directory and writes the dossier the judge reads, using
// the kit's vendored buildDossier, exactly as the bounty requires.
//
// In the grader the output directory is /output; anywhere else it is
// $MAKEFUN_OUTPUT_DIR. Run it with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps, mirrored so a hand-in this program writes is never one
// the scorer would refuse: at most 4 screenshots of 256 KiB each, at most
// 993 files and 48 MiB under game/, no game/ path over 1,000 bytes, and
// the dossier's source text capped at 160 KiB.
const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, GATE_CAPS));
