// duel.js — the match itself: two duelists, 20 Life each, a shared
// 44-card deck, and clashes settled by Might. This module owns the
// state and the rules; it knows nothing about the DOM.

import { buildDeck, shuffle, mightOf } from './cards.js';
import { chooseWardenCard } from './ai.js';

export const START_LIFE = 20;
export const HAND_SIZE = 5;
export const MAX_CLASHES = 40;

export function createMatch(random = Math.random) {
  const match = {
    deck: shuffle(buildDeck(), random),
    discard: [],
    playerHand: [],
    wardenHand: [],
    playerLife: START_LIFE,
    wardenLife: START_LIFE,
    clash: 0,
    over: false,
    winner: null, // 'player' | 'warden'
    playerSuits: [], // player's played suits, oldest first (sigils: null)
    playerValues: [],
    stats: { won: 0, lost: 0, tied: 0, biggestHit: 0 },
    random,
  };
  drawUpTo(match, match.playerHand);
  drawUpTo(match, match.wardenHand);
  return match;
}

// Draw until the hand is full. When the deck runs out the discard pile
// is shuffled back in, so a long duel never starves.
function drawUpTo(match, hand) {
  while (hand.length < HAND_SIZE) {
    if (match.deck.length === 0) {
      if (match.discard.length === 0) return;
      match.deck = shuffle(match.discard, match.random);
      match.discard = [];
    }
    hand.push(match.deck.pop());
  }
}

function takeFromHand(hand, cardId) {
  const index = hand.findIndex((c) => c.id === cardId);
  if (index === -1) throw new Error(`card ${cardId} is not in hand`);
  return hand.splice(index, 1)[0];
}

// Play one clash: the player commits the card with `playerCardId`, the
// Warden answers from his own hand, and the difference in Might is
// dealt as damage — doubled by the winner's Surge, halved by the
// loser's Aegis, and a dead tie scorches both duelists for 1.
export function playClash(match, playerCardId) {
  if (match.over) throw new Error('the duel is already over');

  const playerCard = takeFromHand(match.playerHand, playerCardId);
  const { card: wardenCard, tell } = chooseWardenCard({
    hand: match.wardenHand,
    wardenLife: match.wardenLife,
    playerLife: match.playerLife,
    playerSuits: match.playerSuits,
    playerValues: match.playerValues,
  }, match.random);
  takeFromHand(match.wardenHand, wardenCard.id);

  const playerMight = mightOf(playerCard, wardenCard);
  const wardenMight = mightOf(wardenCard, playerCard);
  match.clash += 1;

  let outcome;
  let damageToPlayer = 0;
  let damageToWarden = 0;

  if (playerMight === wardenMight) {
    outcome = 'tie';
    damageToPlayer = 1;
    damageToWarden = 1;
    match.stats.tied += 1;
  } else if (playerMight > wardenMight) {
    outcome = 'player';
    damageToWarden = settleDamage(playerMight - wardenMight, playerCard, wardenCard);
    match.stats.won += 1;
    match.stats.biggestHit = Math.max(match.stats.biggestHit, damageToWarden);
  } else {
    outcome = 'warden';
    damageToPlayer = settleDamage(wardenMight - playerMight, wardenCard, playerCard);
    match.stats.lost += 1;
  }

  match.playerLife = Math.max(0, match.playerLife - damageToPlayer);
  match.wardenLife = Math.max(0, match.wardenLife - damageToWarden);

  match.playerSuits.push(playerCard.suit);
  match.playerValues.push(playerCard.value);
  match.discard.push(playerCard, wardenCard);

  settleMatchEnd(match);
  if (!match.over) {
    drawUpTo(match, match.playerHand);
    drawUpTo(match, match.wardenHand);
  }

  return {
    playerCard, wardenCard, playerMight, wardenMight,
    outcome, damageToPlayer, damageToWarden, tell,
    matchOver: match.over, winner: match.winner,
  };
}

// The winner's Surge doubles the blow; the loser's Aegis halves it
// (rounded down, but a landed blow always deals at least 1).
function settleDamage(base, winnerCard, loserCard) {
  let damage = base;
  if (winnerCard.sigil === 'surge') damage *= 2;
  if (loserCard.sigil === 'aegis') damage = Math.max(1, Math.floor(damage / 2));
  return damage;
}

function settleMatchEnd(match) {
  if (match.playerLife <= 0 || match.wardenLife <= 0) {
    match.over = true;
    // A double fall goes to the Warden: the house keeps the table.
    match.winner = match.wardenLife <= 0 && match.playerLife > 0 ? 'player' : 'warden';
    return;
  }
  if (match.clash >= MAX_CLASHES) {
    match.over = true;
    match.winner = match.playerLife > match.wardenLife ? 'player' : 'warden';
  }
}
