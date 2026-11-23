// sound.js — every sound is a small WebAudio tone shaped in code.
// No audio files, nothing to load, nothing from the network.

let context = null;
let muted = false;

function audioContext() {
  if (context == null) {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (Ctor == null) return null;
    context = new Ctor();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(freq, { type = 'sine', seconds = 0.12, gain = 0.12, delay = 0, slideTo = null } = {}) {
  if (muted) return;
  const ctx = audioContext();
  if (ctx == null) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }

export const sfx = {
  click() { tone(660, { type: 'triangle', seconds: 0.06, gain: 0.06 }); },
  deal() { tone(340, { type: 'triangle', seconds: 0.07, gain: 0.07, slideTo: 520 }); },
  flip() { tone(880, { type: 'sine', seconds: 0.08, gain: 0.06, slideTo: 1320 }); },
  hit(big = false) {
    tone(big ? 130 : 180, { type: 'sawtooth', seconds: 0.18, gain: 0.1, slideTo: 60 });
    if (big) tone(90, { type: 'square', seconds: 0.26, gain: 0.08, delay: 0.03, slideTo: 45 });
  },
  tie() { tone(440, { type: 'square', seconds: 0.1, gain: 0.05 }); tone(440, { type: 'square', seconds: 0.1, gain: 0.05, delay: 0.12 }); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, { type: 'triangle', seconds: 0.22, gain: 0.09, delay: i * 0.11 })); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, { type: 'triangle', seconds: 0.24, gain: 0.09, delay: i * 0.12 })); },
};
