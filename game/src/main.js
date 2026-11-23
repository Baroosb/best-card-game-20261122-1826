// main.js — Emberfall Duel's conductor: screens, the staged theatre
// of a clash (commit, reveal, settle), keyboard play, and sound cues.
// The rules live in duel.js, the Warden in ai.js, the deck in
// cards.js, and every pixel in render.js; this file only wires them.

import { createMatch, playClash } from './duel.js';
import {
  $, glyphSvg, cardElement, cardBackElement, renderPlayerHand,
  renderWardenHand, renderLives, setBanner, clashNarration,
  floatDamage, spawnEmbers,
} from './render.js';
import { SUITS } from './cards.js';
import { sfx, setMuted, isMuted } from './sound.js';

let match = null;
let locked = false;
let screen = 'title';

function showScreen(name) {
  screen = name;
  $('screen-title').hidden = name !== 'title';
  $('screen-table').hidden = name !== 'table';
  $('screen-end').hidden = name !== 'end';
}

function paintTitleCards() {
  const glyphs = ['ember', 'stone', 'tide'];
  document.querySelectorAll('.mini-card .mini-glyph').forEach((slot, i) => {
    const suit = SUITS[glyphs[i]];
    slot.innerHTML = glyphSvg(suit.glyph, suit.colour);
  });
}

function renderTable() {
  renderPlayerHand($('player-hand'), match.playerHand, onPick);
  renderWardenHand($('warden-hand'), match.wardenHand.length);
  renderLives(match);
  $('round-label').textContent = match.over ? 'THE DUEL IS DONE' : `CLASH ${match.clash + 1}`;
  $('deck-count').textContent = `Deck ${match.deck.length}`;
  $('player-hand').classList.toggle('locked', locked);
}

function startMatch() {
  match = createMatch();
  locked = false;
  $('clash-player').replaceChildren();
  $('clash-warden').replaceChildren();
  setBanner('');
  $('warden-tell').textContent = 'The Warden shuffles, watching you.';
  $('player-hint').textContent = 'Pick a card to clash.';
  showScreen('table');
  renderTable();
  sfx.deal();
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One clash, staged: your card slides to the table, his lands face
// down, flips — then Might, damage and the Warden's tell land.
async function onPick(cardId) {
  if (locked || match == null || match.over) return;
  locked = true;
  $('player-hand').classList.add('locked');

  const result = playClash(match, cardId);
  renderPlayerHand($('player-hand'), match.playerHand, onPick);
  renderWardenHand($('warden-hand'), match.wardenHand.length);
  $('player-hand').classList.add('locked');

  $('clash-player').replaceChildren(cardElement(result.playerCard));
  $('clash-warden').replaceChildren(cardBackElement());
  setBanner('');
  sfx.deal();
  await wait(430);

  $('clash-player').replaceChildren(cardElement(result.playerCard, { might: result.playerMight }));
  const his = cardElement(result.wardenCard, { might: result.wardenMight });
  his.classList.add('revealed');
  $('clash-warden').replaceChildren(his);
  sfx.flip();
  await wait(260);

  const playerEl = $('clash-player').firstElementChild;
  const wardenEl = $('clash-warden').firstElementChild;
  if (result.outcome === 'player') {
    playerEl?.classList.add('winner');
    wardenEl?.classList.add('shake');
    floatDamage($('warden-life-text'), result.damageToWarden, 'warden');
    sfx.hit(result.damageToWarden >= 6);
  } else if (result.outcome === 'warden') {
    wardenEl?.classList.add('winner');
    playerEl?.classList.add('shake');
    floatDamage($('player-life-text'), result.damageToPlayer, 'player');
    sfx.hit(result.damageToPlayer >= 6);
  } else {
    floatDamage($('warden-life-text'), result.damageToWarden, 'warden');
    floatDamage($('player-life-text'), result.damageToPlayer, 'player');
    sfx.tie();
  }
  setBanner(clashNarration(result));
  $('warden-tell').textContent = result.tell;
  renderLives(match);
  $('round-label').textContent = `CLASH ${match.clash}`;
  $('deck-count').textContent = `Deck ${match.deck.length}`;

  await wait(1550);
  $('clash-player').replaceChildren();
  $('clash-warden').replaceChildren();
  setBanner('');

  if (result.matchOver) {
    await wait(350);
    showEnd(result.winner);
  } else {
    locked = false;
    renderTable();
  }
}

function showEnd(winner) {
  // Clear any embers still drifting from an earlier victory.
  $('screen-end').querySelectorAll('.ember-bit').forEach((bit) => bit.remove());
  const won = winner === 'player';
  const title = $('end-title');
  title.textContent = won ? 'VICTORY' : 'FALLEN';
  title.className = `end-title ${won ? 'win' : 'lose'}`;
  $('end-detail').textContent = won
    ? 'The Warden bows his head. The table is yours.'
    : 'The Warden sweeps the table. He will remember your habits.';
  const s = match.stats;
  $('end-stats').innerHTML =
    `Clashes won ${s.won} · lost ${s.lost} · tied ${s.tied}<br>` +
    `Biggest hit ${s.biggestHit} · Your life left ${match.playerLife} · His ${match.wardenLife}`;
  showScreen('end');
  if (won) {
    sfx.win();
    spawnEmbers($('screen-end'));
  } else {
    sfx.lose();
  }
}

function toggleHelp(force) {
  const overlay = $('help-overlay');
  overlay.hidden = force != null ? !force : !overlay.hidden;
}

function toggleMute() {
  setMuted(!isMuted());
  $('btn-mute').textContent = isMuted() ? '✕' : '♪';
  if (!isMuted()) sfx.click();
}

function wireControls() {
  $('btn-start').addEventListener('click', () => { sfx.click(); startMatch(); });
  $('btn-again').addEventListener('click', () => { sfx.click(); startMatch(); });
  $('btn-help').addEventListener('click', () => { sfx.click(); toggleHelp(true); });
  $('btn-help2').addEventListener('click', () => { sfx.click(); toggleHelp(true); });
  $('btn-close-help').addEventListener('click', () => { sfx.click(); toggleHelp(false); });
  $('btn-mute').addEventListener('click', toggleMute);

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'h') { toggleHelp(); return; }
    if (key === 'm') { toggleMute(); return; }
    if (!$('help-overlay').hidden) {
      if (key === 'escape') toggleHelp(false);
      return;
    }
    if (screen === 'title' && (key === 'enter' || key === ' ')) { event.preventDefault(); startMatch(); return; }
    if (screen === 'end' && key === 'r') { startMatch(); return; }
    if (screen === 'table' && match != null && !locked) {
      const n = Number.parseInt(key, 10);
      if (n >= 1 && n <= match.playerHand.length) {
        void onPick(match.playerHand[n - 1].id);
      }
    }
  });
}

paintTitleCards();
wireControls();
showScreen('title');

// A small read-only handle so the maker's own screenshot script (and
// curious players in devtools) can see the duel's phase.
window.emberfall = {
  state: () => ({
    screen,
    locked,
    over: match?.over ?? false,
    winner: match?.winner ?? null,
    playerLife: match?.playerLife ?? null,
    wardenLife: match?.wardenLife ?? null,
    clash: match?.clash ?? 0,
  }),
};
