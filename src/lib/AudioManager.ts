export class AudioManager {
  private context?: AudioContext;
  private cache = new Map<string, AudioBuffer>();
  private static instance: AudioManager;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async initialize() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  async preload(id: string, url: string) {
    if (!this.context) await this.initialize();
    if (this.cache.has(id)) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.arrayBuffer();
      const buffer = await this.context!.decodeAudioData(data);
      this.cache.set(id, buffer);
      console.log(`[AudioManager] Preloaded audio: ${id}`);
    } catch (error) {
      console.error(`[AudioManager] Failed to preload audio: ${id}`, error);
    }
  }

  play(id: string, volume: number = 0.8) {
    if (!this.context || this.context.state === "suspended") {
      console.warn(`[AudioManager] Cannot play ${id} - AudioContext not initialized or suspended. Did you call initialize()?`);
      return;
    }

    const buffer = this.cache.get(id);
    if (!buffer) {
      console.warn(`[AudioManager] Sound not preloaded: ${id}`);
      return;
    }

    try {
      const source = this.context.createBufferSource();
      source.buffer = buffer;

      const gainNode = this.context.createGain();
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.context.destination);

      source.start(0);
    } catch (error) {
      console.error(`[AudioManager] Failed to play sound: ${id}`, error);
    }
  }
}

export const audioManager = AudioManager.getInstance();
