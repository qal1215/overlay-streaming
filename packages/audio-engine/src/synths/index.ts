export type SynthFunction = (context: AudioContext, masterVolume: number, localVolume: number) => void;

export const playBeep: SynthFunction = (context, masterVolume, localVolume) => {
  try {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, context.currentTime); // A4 note
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.1);
    
    const finalVolume = localVolume * masterVolume;
    gainNode.gain.setValueAtTime(finalVolume, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
  } catch (e) {
    console.error("Synthetic beep failed", e);
  }
};

export const playSuccess: SynthFunction = (context, masterVolume, localVolume) => {
  try {
    const osc1 = context.createOscillator();
    const osc2 = context.createOscillator();
    const gainNode = context.createGain();
    
    osc1.type = 'sine';
    osc2.type = 'triangle';
    
    // Play a happy major third interval jump (C5 -> E5 -> G5 fast arpeggio effect)
    osc1.frequency.setValueAtTime(523.25, context.currentTime); // C5
    osc2.frequency.setValueAtTime(523.25, context.currentTime); 
    
    osc1.frequency.setValueAtTime(659.25, context.currentTime + 0.1); // E5
    osc2.frequency.setValueAtTime(659.25, context.currentTime + 0.1); 
    
    osc1.frequency.setValueAtTime(783.99, context.currentTime + 0.2); // G5
    osc2.frequency.setValueAtTime(783.99, context.currentTime + 0.2);
    
    const finalVolume = localVolume * masterVolume;
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(finalVolume, context.currentTime + 0.05);
    gainNode.gain.setValueAtTime(finalVolume, context.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.6);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(context.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(context.currentTime + 0.6);
    osc2.stop(context.currentTime + 0.6);
  } catch (e) {
    console.error("Synthetic success failed", e);
  }
};

export const playError: SynthFunction = (context, masterVolume, localVolume) => {
  try {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.type = 'sawtooth';
    // Dissonant low buzz
    oscillator.frequency.setValueAtTime(150, context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(100, context.currentTime + 0.3);
    
    const finalVolume = localVolume * masterVolume;
    gainNode.gain.setValueAtTime(finalVolume, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start();
    oscillator.stop(context.currentTime + 0.4);
  } catch (e) {
    console.error("Synthetic error failed", e);
  }
};

export const SYNTH_REGISTRY: Record<string, SynthFunction> = {
  'synthetic:beep': playBeep,
  'synthetic:success': playSuccess,
  'synthetic:error': playError,
};
