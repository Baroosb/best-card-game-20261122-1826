// ai.js — the Warden. He is meant to be read and countered, not to be
// a dice roll: he studies the suits the player favours, loads counters
// against them, guards his high cards while he is comfortable, spends
// an Aegis when he fears a heavy blow, and only rarely bluffs. Every
// pick comes with the tell the table shows, so the player can learn
// his habits and bait him.

import { mightOf, suitBeats } from './cards.js';

// The suit the player has leaned on most across their last few plays,
// weighted so recent plays count double. Null when there is no history.
function predictPlayerSuit(history) {
  if (history.length === 0) return null;
  const weight = new Map();
  history.slice(-5).forEach((suit, i, arr) => {
    if (suit == null) return;
    weight.set(suit, (weight.get(suit) ?? 0) + (i === arr.length - 1 ? 2 : 1));
  });
  let best = null;
  let bestWeight = 0;
  for (const [suit, w] of weight) {
    if (w > bestWeight) { best = suit; bestWeight = w; }
  }
  return best;
}

// The player's typical recent value — what the Warden expects to face.
function predictPlayerValue(history) {
  if (history.length === 0) return 5;
  const recent = history.slice(-4);
  return recent.reduce((sum, v) => sum + v, 0) / recent.length;
}

// Score one candidate card against the predicted player card.
// Returns { score, reason } — reason names the habit that drove it and
// becomes the Warden's tell when this card is the pick.
function scoreCandidate(card, ctx) {
  const fakePlayerCard = { kind: ctx.predictedSuit ? 'suit' : 'sigil', suit: ctx.predictedSuit, sigil: null, value: Math.round(ctx.predictedValue) };
  const myMight = mightOf(card, fakePlayerCard);
  const theirMight = mightOf(fakePlayerCard, card);
  const margin = myMight - theirMight;

  // Lethal: if this can finish the player, take it above all else.
  if (margin > 0 && margin >= ctx.playerLife) {
    const dealt = card.sigil === 'surge' ? margin * 2 : margin;
    if (dealt >= ctx.playerLife) return { score: 1000 + margin, reason: 'lethal' };
  }

  // Desperation: behind and bleeding, swing the biggest thing held.
  if (ctx.wardenLife <= 6) return { score: 500 + myMight, reason: 'desperate' };

  if (margin > 0) {
    // A win. Prefer the CHEAPEST winning card — bank the big ones —
    // unless it carries the ring bonus, which is a read worth rewarding.
    let score = 100 - margin * 4 - card.value * 0.5;
    let reason = 'steady';
    if (card.kind === 'suit' && ctx.predictedSuit && suitBeats(card.suit, ctx.predictedSuit)) {
      score += 26;
      reason = 'counter';
    }
    if (card.sigil === 'surge') { score += 14; reason = 'surge'; }
    return { score, reason };
  }

  // A likely loss: sacrifice the cheapest card, or blunt it with Aegis
  // when a heavy blow is expected.
  if (card.sigil === 'aegis' && ctx.predictedValue >= 7) {
    return { score: 60, reason: 'guard' };
  }
  return { score: -card.value * 3 + margin, reason: 'sacrifice' };
}

const TELLS = {
  counter: 'The Warden smirks — he has been counting your suits.',
  surge: 'The Warden leans in, hungry for a heavy hit.',
  guard: 'The Warden raises a guard; he fears your next blow.',
  desperate: "The Warden's hand trembles. He is desperate now.",
  lethal: 'The Warden smells the end of the duel.',
  sacrifice: 'The Warden gives that one away cheaply.',
  steady: 'The Warden plays it cool and steady.',
  bluff: "The Warden's face gives nothing away.",
};

// Pick the Warden's card for this clash.
// state: { hand, wardenLife, playerLife, playerSuits, playerValues }
export function chooseWardenCard(state, random = Math.random) {
  const ctx = {
    predictedSuit: predictPlayerSuit(state.playerSuits),
    predictedValue: predictPlayerValue(state.playerValues),
    wardenLife: state.wardenLife,
    playerLife: state.playerLife,
  };

  const scored = state.hand.map((card) => ({ card, ...scoreCandidate(card, ctx) }));
  scored.sort((a, b) => b.score - a.score);

  // One time in seven he bluffs with something that is not his best —
  // unless it is the end of the duel either way.
  const top = scored[0];
  if (scored.length > 2 && top.reason !== 'lethal' && top.reason !== 'desperate' && random() < 0.15) {
    const others = scored.slice(1);
    const pick = others[Math.floor(random() * others.length)];
    return { card: pick.card, tell: TELLS.bluff };
  }
  return { card: top.card, tell: TELLS[top.reason] };
}
