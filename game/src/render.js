// render.js — everything the player sees: parchment cards with suit
// glyphs drawn as inline SVG (colour and shape, never text alone),
// the two hands, the life bars, and the theatre of a clash — slide,
// flip, glow, shake and floating damage.

import { SUITS, SIGILS, cardName } from './cards.js';

export const $ = (id) => document.getElementById(id);

// Suit and sigil glyphs, drawn in a 24x24 box. Filled paths, except
// the Tide wave, which reads better as two stroked crests.
const GLYPH_PATHS = {
  flame: '<path d="M12 1.8c1.9 3.6 6.1 5.6 6.1 10.4a6.1 6.1 0 1 1-12.2 0C5.9 7.4 10.1 5.4 12 1.8z"/><path d="M12 22.2a3.4 3.4 0 0 1-3.4-3.4c0-2.1 1.9-3.2 3.4-5.4 1.5 2.2 3.4 3.3 3.4 5.4A3.4 3.4 0 0 1 12 22.2z" fill="#fdf6df"/>',
  leaf: '<path d="M20.5 3.5C11 3.5 4.5 10 4.5 19.5 13.5 19.5 20.5 12.5 20.5 3.5z"/><path d="M5 20.5C8 14 13 9 19 6" stroke="#fdf6df" stroke-width="1.6" fill="none"/>',
  wave: '<path d="M1.5 9.5c3.2-4 6.3-4 9.5 0s6.3 4 9.5 0" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M1.5 16.5c3.2-4 6.3-4 9.5 0s6.3 4 9.5 0" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  diamond: '<path d="M12 2.5 21.5 12 12 21.5 2.5 12z"/><path d="M12 7 17 12l-5 5-5-5z" fill="#fdf6df"/>',
  shield: '<path d="M12 2.2 20 5.4v6.1c0 5-3.4 8.4-8 10.3-4.6-1.9-8-5.3-8-10.3V5.4z"/><path d="M12 5.4 17 7.4v4.1c0 3.4-2.1 5.9-5 7.3-2.9-1.4-5-3.9-5-7.3V7.4z" fill="#fdf6df"/>',
  bolt: '<path d="M13.2 1.8 4.6 13.6h5.6L8.6 22.2l8.8-12.2h-5.8z"/>',
};

export function glyphSvg(glyphKey, colour) {
  const body = GLYPH_PATHS[glyphKey];
  const stroked = glyphKey === 'wave';
  return `<svg viewBox="0 0 24 24" ${stroked ? `stroke="${colour}"` : `fill="${colour}"`} aria-hidden="true">${body}</svg>`;
}

function glyphFor(card) {
  if (card.kind === 'sigil') {
    const sigil = SIGILS[card.sigil];
    return glyphSvg(sigil.glyph, '#a37f16');
  }
  const suit = SUITS[card.suit];
  return glyphSvg(suit.glyph, suit.colour);
}

function nameFor(card) {
  return card.kind === 'sigil' ? SIGILS[card.sigil].name : SUITS[card.suit].name;
}

// One card face. With `might` set (a revealed clash card) the card
// carries its settled Might as a pill; a sigil in hand instead shows
// what it does, so a new player learns the sigils by holding them.
export function cardElement(card, { might = null } = {}) {
  const el = document.createElement('div');
  el.className = card.kind === 'sigil' ? 'card sigil' : `card suit-${card.suit}`;
  el.dataset.cardId = String(card.id);

  const top = document.createElement('span');
  top.className = 'corner';
  top.textContent = String(card.value);
  const bottom = top.cloneNode(true);
  bottom.className = 'corner corner-br';

  const glyph = document.createElement('div');
  glyph.className = 'glyph';
  glyph.innerHTML = glyphFor(card);

  const name = document.createElement('div');
  name.className = 'suit-name';
  name.textContent = nameFor(card);

  el.append(top, bottom, glyph, name);

  if (might != null) {
    const pill = document.createElement('div');
    pill.className = 'might';
    pill.textContent = `MIGHT ${might}`;
    el.append(pill);
  } else if (card.kind === 'sigil') {
    const note = document.createElement('div');
    note.className = 'sigil-note';
    note.textContent = SIGILS[card.sigil].note;
    el.append(note);
  }
  return el;
}

export function cardBackElement() {
  const el = document.createElement('div');
  el.className = 'card-back';
  return el;
}

// The player's hand as buttons; `onPick` receives the card id.
export function renderPlayerHand(container, hand, onPick) {
  container.replaceChildren();
  hand.forEach((card, i) => {
    const el = cardElement(card);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = el.className + ' dealt';
    btn.style.animationDelay = `${i * 70}ms`;
    btn.innerHTML = el.innerHTML;
    btn.dataset.cardId = String(card.id);
    btn.setAttribute('aria-label', `Play ${cardName(card)}`);
    btn.addEventListener('click', () => onPick(card.id));
    container.append(btn);
  });
}

export function renderWardenHand(container, count) {
  container.replaceChildren();
  for (let i = 0; i < count; i++) container.append(cardBackElement());
}

export function renderLives(match) {
  for (const [who, life] of [['player', match.playerLife], ['warden', match.wardenLife]]) {
    const bar = $(`${who}-life-bar`);
    const text = $(`${who}-life-text`);
    const pct = Math.max(0, (life / 20) * 100);
    bar.style.width = `${pct}%`;
    bar.classList.toggle('hurt', life <= 10 && life > 5);
    bar.classList.toggle('crit', life <= 5);
    text.textContent = String(life);
  }
}

export function setBanner(text) {
  const banner = $('clash-banner');
  banner.textContent = text;
  banner.classList.remove('pop');
  void banner.offsetWidth; // restart the pop animation
  banner.classList.add('pop');
}

// The sentence under the clash that says what just happened, naming
// both cards and calling out a Surge doubling or an Aegis save.
export function clashNarration(result) {
  const { playerCard, wardenCard, playerMight, wardenMight, outcome } = result;
  const mine = `${cardName(playerCard)} (Might ${playerMight})`;
  const his = `${cardName(wardenCard)} (Might ${wardenMight})`;
  if (outcome === 'tie') return `Dead even — ${mine} against ${his}. Sparks scorch you both for 1.`;

  const winnerCard = outcome === 'player' ? playerCard : wardenCard;
  const loserCard = outcome === 'player' ? wardenCard : playerCard;
  const baseDiff = Math.abs(playerMight - wardenMight);
  let extras = '';
  if (winnerCard.sigil === 'surge') extras += ' SURGE doubles the blow!';
  if (loserCard.sigil === 'aegis' && baseDiff >= 2) extras += ' AEGIS blunts it.';

  if (outcome === 'player') {
    return `Your ${mine} beats his ${his} — ${result.damageToWarden} damage!${extras}`;
  }
  return `His ${his} beats your ${mine} — you take ${result.damageToPlayer}.${extras}`;
}

// A floating "-N" over a duelist's side of the table.
export function floatDamage(anchorEl, amount, side) {
  const span = document.createElement('span');
  span.className = `dmg-float on-${side}`;
  span.textContent = `-${amount}`;
  const rect = anchorEl.getBoundingClientRect();
  const host = $('screen-table').getBoundingClientRect();
  span.style.left = `${rect.left - host.left + rect.width / 2 - 16}px`;
  span.style.top = `${rect.top - host.top - 6}px`;
  $('screen-table').append(span);
  span.addEventListener('animationend', () => span.remove());
}

// A drift of rising embers for the victory screen.
export function spawnEmbers(container, count = 26) {
  for (let i = 0; i < count; i++) {
    const bit = document.createElement('div');
    bit.className = 'ember-bit';
    const size = 5 + Math.random() * 8;
    bit.style.width = `${size}px`;
    bit.style.height = `${size}px`;
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.bottom = `${Math.random() * 20}%`;
    bit.style.animationDuration = `${2.4 + Math.random() * 2.2}s`;
    bit.style.animationDelay = `${Math.random() * 0.9}s`;
    container.append(bit);
    bit.addEventListener('animationend', () => bit.remove());
  }
}
