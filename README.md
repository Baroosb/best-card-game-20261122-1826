# best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Baroosb/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Baroosb/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Emberfall Duel** — an original card duel for the browser. You face the Warden across a tavern table: each clash you commit one card from your hand of five, the Warden commits one of his, and the higher Might wins — the loser takes the difference as damage. Four suits turn on a ring of strengths (Ember burns Thorn, Thorn pierces Tide, Tide douses Ember, and steady Stone answers to none), worth +2 Might when yours beats his. Aegis cards halve the damage you take; Surge cards double the damage you deal. First duelist to lose all 20 Life falls. The Warden watches your habits — he counts the suits you favour and loads counters — so vary your hand, bait his high cards out on clashes you can afford to lose, and strike when his guard is spent. Static files only: open game/index.html in a desktop browser and play, no network, no build step. The hand-in program (main.ts, Node 22) copies game/ and screenshots/ to the output directory and writes the judge's dossier with the kit's vendored library.

## Run it

```sh
python3 -m http.server 8080 --directory game
# then open http://localhost:8080 in a desktop browser
# hand-in check: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=5hnf181h&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
