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

  async initialize() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  setMasterVolume(volume: number) {
    // Clamp volume between 0.0 and 1.0
    this.masterVolume = Math.max(0, Math.min(1, volume));
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

  play(id: string, localVolume: number = 1.0) {
    if (!this.context || this.context.state === "suspended") {
      console.warn(`[AudioManager] Cannot play ${id} - AudioContext not initialized or suspended. Did you call initialize()?`);
      return;
    }

    const buffer = this.cache.get(id);
    if (!buffer) {
      console.warn(`[AudioManager] Sound not preloaded: ${id}. Playing synthetic beep for testing.`);
      // Synthetic fallback for testing
      try {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.context.currentTime); // A4 note
        oscillator.frequency.exponentialRampToValueAtTime(880, this.context.currentTime + 0.1);
        
        const finalVolume = localVolume * this.masterVolume;
        gainNode.gain.setValueAtTime(finalVolume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.5);
      } catch (e) {
        console.error("Synthetic beep failed", e);
      }
      return;
    }

    try {
      const source = this.context.createBufferSource();
      source.buffer = buffer;

      const gainNode = this.context.createGain();
      gainNode.gain.value = localVolume * this.masterVolume;

      source.connect(gainNode);
      gainNode.connect(this.context.destination);

      source.start(0);
    } catch (error) {
      console.error(`[AudioManager] Failed to play sound: ${id}`, error);
    }
  }
}

export const audioManager = AudioManager.getInstance();
