import { SYNTH_REGISTRY } from './synths';

export class AudioManager {
  private context?: AudioContext;
  private cache = new Map<string, AudioBuffer>();
  private static instance: AudioManager;
  private masterVolume: number = 0.8;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  // Legacy fallback for backward compatibility
  async initialize(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === "suspended") {
      ctx.resume().catch(err => {
        console.warn("[AudioManager] Failed to resume AudioContext in initialize.", err);
      });
    }
  }

  async unlock(): Promise<boolean> {
    const ctx = this.getContext();
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn("[AudioManager] Unlock failed:", err);
      }
    }
    return ctx.state === "running";
  }

  isReady(): boolean {
    return this.context !== undefined && this.context.state === "running";
  }

  setMasterVolume(volume: number) {
    // Clamp volume between 0.0 and 1.0
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  async preload(source: string | { type: "asset"; url: string } | { type: "synthetic"; preset: string }, urlFallback?: string) {
    const ctx = this.getContext();
    let id: string;
    let urlToFetch: string | undefined;

    if (typeof source === "string") {
      id = source;
      urlToFetch = urlFallback || source;
    } else if (source.type === "asset") {
      id = source.url;
      urlToFetch = source.url;
    } else {
      id = `synthetic:${source.preset}`;
      return; // No fetch for synthetic
    }

    if (this.cache.has(id)) return;
    if (id.startsWith('synthetic:')) return; 

    if (!urlToFetch) return;

    try {
      const response = await fetch(urlToFetch);
      console.log(`[AudioManager] Fetch: ${response.status}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.arrayBuffer();
      const buffer = await ctx.decodeAudioData(data);
      this.cache.set(id, buffer);
      console.log(`[AudioManager] Preloaded audio: ${id}`);
    } catch (error) {
      console.error(`[AudioManager] Failed to preload audio: ${id}`, error);
    }
  }

  play(source: string | { type: "asset"; url: string } | { type: "synthetic"; preset: string }, localVolume: number = 1.0) {
    const ctx = this.getContext();
    
    let id: string;
    if (typeof source === "string") {
      id = source;
    } else if (source.type === "asset") {
      id = source.url;
    } else {
      id = `synthetic:${source.preset}`;
    }

    if (ctx.state === "suspended") {
      console.warn(`[AudioManager] Web Audio API suspended. Falling back to HTML5 Audio for: ${id}`);
      if (!id.startsWith('synthetic:')) {
        const audio = new Audio(id);
        audio.volume = localVolume * this.masterVolume;
        // Append to DOM for OBS "Control Audio via OBS" support
        document.body.appendChild(audio);
        audio.play()
          .then(() => {
            // Remove from DOM when done
            audio.onended = () => audio.remove();
          })
          .catch(e => {
            console.error("[AudioManager] HTML5 Audio fallback failed:", e);
            audio.remove();
          });
      }
      return;
    }

    const synthFunc = SYNTH_REGISTRY[id];
    if (synthFunc) {
      synthFunc(ctx, this.masterVolume, localVolume);
      return;
    }

    const buffer = this.cache.get(id);
    if (!buffer) {
      console.warn(`[AudioManager] Sound not preloaded: ${id}. Playing fallback synthetic beep.`);
      SYNTH_REGISTRY['synthetic:beep'](ctx, this.masterVolume, localVolume);
      return;
    }

    try {
      console.log(`[AudioManager] Playing audio: ${id}`);
      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = buffer;

      const gainNode = ctx.createGain();
      gainNode.gain.value = localVolume * this.masterVolume;

      sourceNode.connect(gainNode);
      gainNode.connect(ctx.destination);

      sourceNode.start(0);
    } catch (error) {
      console.error(`[AudioManager] Failed to play sound: ${id}`, error);
    }
  }
}

export const audioManager = AudioManager.getInstance();
