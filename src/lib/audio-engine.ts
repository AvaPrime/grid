import { camelot } from "./camelot";
import type { Track } from "./types";

type Voice = {
  stop: (when: number) => void;
};

/**
 * Browser-only preview engine. Each track is a seeded groove in its own
 * key/BPM/genre — no copyrighted audio.
 */
class GridEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private playing = false;
  private timer: number | null = null;
  private nextNote = 0;
  private step = 0;
  private track: Track | null = null;
  private startedAt = 0;
  private offset = 0;
  private voices: Voice[] = [];

  private ensure() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 4200;
    filter.Q.value = 0.7;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    filter.connect(comp);
    comp.connect(master);
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.filter = filter;
  }

  getContext() {
    this.ensure();
    return this.ctx!;
  }

  isPlaying() {
    return this.playing;
  }

  currentTrack() {
    return this.track;
  }

  async resume() {
    this.ensure();
    if (this.ctx!.state === "suspended") await this.ctx!.resume();
  }

  load(track: Track, offset = 0) {
    this.track = track;
    this.offset = offset;
    this.step = Math.floor((offset / (60 / track.bpm)) * 4) % 32;
    if (this.filter) {
      const open = 1800 + track.energy * 420;
      this.filter.frequency.value = open;
    }
  }

  async play(track?: Track, offset?: number) {
    this.ensure();
    await this.resume();
    if (track) this.load(track, offset ?? 0);
    if (!this.track) return;
    this.playing = true;
    this.nextNote = this.ctx!.currentTime + 0.04;
    this.startedAt = performance.now() - (offset ?? this.offset) * 1000;
    this.scheduler();
  }

  pause() {
    this.playing = false;
    if (this.timer != null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.cut(0.04);
    if (this.track) {
      this.offset = this.progressSeconds();
    }
  }

  stop() {
    this.pause();
    this.offset = 0;
    this.step = 0;
  }

  seek(seconds: number) {
    const was = this.playing;
    this.pause();
    this.offset = Math.max(0, seconds);
    if (this.track) {
      this.step = Math.floor((this.offset / (60 / this.track.bpm)) * 4) % 32;
    }
    if (was) void this.play(this.track ?? undefined, this.offset);
  }

  progressSeconds() {
    if (!this.playing) return this.offset;
    return (performance.now() - this.startedAt) / 1000;
  }

  private scheduler = () => {
    if (!this.playing || !this.ctx || !this.track) return;
    const secondsPerStep = 60 / this.track.bpm / 4;
    const horizon = this.ctx.currentTime + 0.12;
    while (this.nextNote < horizon) {
      this.scheduleStep(this.step, this.nextNote);
      this.nextNote += secondsPerStep;
      this.step = (this.step + 1) % 32;
    }
    this.timer = window.setTimeout(this.scheduler, 25);
  };

  private scheduleStep(step: number, time: number) {
    const track = this.track!;
    const genre = track.genre.toLowerCase();
    const isBreaks = genre.includes("drum") || genre.includes("breaks");
    const isAmbient = genre.includes("downtempo");
    const freq = camelot(track.camelot)?.hz ?? 220;

    if (!isAmbient) {
      const kickOn = isBreaks ? step % 8 === 0 || step % 8 === 3 || step % 16 === 10 : step % 4 === 0;
      if (kickOn) this.kick(time, 0.7 + (track.energy / 20));
      if (!isBreaks && step % 4 === 2) this.hat(time, 0.08, 6000);
      if (isBreaks && (step % 2 === 0)) this.hat(time, 0.05, 8000);
      if (step % 4 === 2 && isBreaks) this.snare(time);
      if (!isBreaks && (step % 8 === 4)) this.hat(time, 0.12, 9000);
    } else if (step % 8 === 0) {
      this.hat(time, 0.04, 4000);
    }

    const bassSteps = isBreaks ? [0, 6, 10, 16, 22] : [0, 4, 8, 12, 16, 20, 24, 28];
    if (bassSteps.includes(step)) {
      const deg = [0, 0, 7, 0, 5, 0, 3, 0][Math.floor(step / 4)] ?? 0;
      this.bass(time, freq * Math.pow(2, deg / 12) / 2, 0.18);
    }

    if (step % 16 === 0) {
      this.pad(time, freq, 60 / track.bpm);
    }
  }

  private dest() {
    return this.filter!;
  }

  private kick(time: number, gain: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(g);
    g.connect(this.dest());
    osc.start(time);
    osc.stop(time + 0.3);
    this.voices.push(osc);
  }

  private hat(time: number, gain: number, freq: number) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, 2200, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.dest());
    src.start(time);
    src.stop(time + 0.08);
  }

  private snare(time: number) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, 4000, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.dest());
    src.start(time);
    src.stop(time + 0.18);
  }

  private bass(time: number, freq: number, gain: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
    osc.connect(g);
    g.connect(this.dest());
    osc.start(time);
    osc.stop(time + 0.32);
  }

  private pad(time: number, freq: number, beat: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.05, time + beat * 0.5);
    g.gain.linearRampToValueAtTime(0.0001, time + beat * 4);
    for (const detune of [-6, 0, 7]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * Math.pow(2, detune / 12);
      osc.connect(g);
      osc.start(time);
      osc.stop(time + beat * 4);
    }
    g.connect(this.dest());
  }

  private cut(fade: number) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.0001, now + fade);
    this.master.gain.setValueAtTime(0.22, now + fade + 0.02);
  }
}

export const gridEngine = new GridEngine();
