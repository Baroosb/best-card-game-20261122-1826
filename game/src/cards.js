// cards.js — the Emberfall deck: four suits on a ring of strengths,
// two sigil cards, and the Might arithmetic every clash is settled by.
//
// Suits (told apart by colour AND shape, never by text alone):
//   EMBER  flame   — burns THORN
//   THORN  leaf    — pierces TIDE
//   TIDE   wave    — douses EMBER
//   STONE  diamond — stands outside the ring: no bonus given or taken,
//                    but its values run 2..10 instead of 1..9.
// Sigils (no suit, so the ring never touches them):
//   AEGIS  value 2 — halves the damage its holder takes that clash.
//   SURGE  value 6 — doubles the damage its holder deals that clash.

export const RING_BONUS = 2;

export const SUITS = {
  ember: { key: 'ember', name: 'EMBER', glyph: 'flame', colour: '#e2543e' },
  thorn: { key: 'thorn', name: 'THORN', glyph: 'leaf', colour: '#43a355' },
  tide: { key: 'tide', name: 'TIDE', glyph: 'wave', colour: '#4a86e8' },
  stone: { key: 'stone', name: 'STONE', glyph: 'diamond', colour: '#9aa0a8' },
};

// BEATS[x] is the suit that x defeats on the ring. Stone is absent on
// purpose: it neither beats nor is beaten.
export const BEATS = { ember: 'thorn', thorn: 'tide', tide: 'ember' };

export const SIGILS = {
  aegis: { key: 'aegis', name: 'AEGIS', glyph: 'shield', value: 2, note: 'Halves damage you take' },
  surge: { key: 'surge', name: 'SURGE', glyph: 'bolt', value: 6, note: 'Doubles damage you deal' },
};

let nextCardId = 1;

function suitCard(suitKey, value) {
  return { id: nextCardId++, kind: 'suit', suit: suitKey, sigil: null, value };
}

function sigilCard(sigilKey) {
  return { id: nextCardId++, kind: 'sigil', suit: null, sigil: sigilKey, value: SIGILS[sigilKey].value };
}

// A fresh 44-card deck: the three ring suits at values 1..9, Stone at
// 2..10, and four copies of each sigil.
export function buildDeck() {
  const deck = [];
  for (const suitKey of ['ember', 'thorn', 'tide']) {
    for (let value = 1; value <= 9; value++) deck.push(suitCard(suitKey, value));
  }
  for (let value = 2; value <= 10; value++) deck.push(suitCard('stone', value));
  for (let i = 0; i < 4; i++) deck.push(sigilCard('aegis'));
  for (let i = 0; i < 4; i++) deck.push(sigilCard('surge'));
  return deck;
}

// Fisher–Yates, in place; returns the same array for chaining.
export function shuffle(deck, random = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Does suit A take the ring bonus against suit B?
export function suitBeats(suitA, suitB) {
  return suitA != null && suitB != null && BEATS[suitA] === suitB;
}

// A card's Might against a specific opposing card: its printed value,
// plus the ring bonus when its suit beats the opposing card's suit.
// Sigils have no suit, so neither side takes a bonus in a sigil clash.
export function mightOf(card, opposingCard) {
  let might = card.value;
  if (card.kind === 'suit' && opposingCard.kind === 'suit' && suitBeats(card.suit, opposingCard.suit)) {
    might += RING_BONUS;
  }
  return might;
}

export function cardName(card) {
  if (card.kind === 'sigil') return SIGILS[card.sigil].name;
  return `${SUITS[card.suit].name} ${card.value}`;
}
