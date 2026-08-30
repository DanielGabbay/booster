let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  audio();
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.1, end?: number) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (end) osc.frequency.exponentialRampToValueAtTime(end, ac.currentTime + dur);
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur + 0.02);
}

export function coinToss() {
  beep(740, 0.12, "triangle", 0.08, 1180);
}

export function coinLand() {
  beep(220, 0.14, "sine", 0.07, 140);
}

export function basketOpen() {
  beep(392, 0.28, "triangle", 0.09, 784);
}

export function prizeBought() {
  beep(523, 0.1, "triangle", 0.08, 784);
  setTimeout(() => beep(784, 0.16, "triangle", 0.07, 1046), 90);
}
