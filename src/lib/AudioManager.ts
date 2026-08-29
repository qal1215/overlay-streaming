class AudioManager {
  private static instance: AudioManager;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public play(soundUrl: string, volume: number = 0.8) {
    if (!soundUrl) return;

    try {
      const audio = new Audio(soundUrl);
      audio.volume = volume;
      audio.play().catch((e) => {
        console.warn("AudioManager: Browser autoplay restriction prevented audio from playing.", e);
      });
    } catch (error) {
      console.error("AudioManager: Failed to play sound", error);
    }
  }
}

export const audioManager = AudioManager.getInstance();
