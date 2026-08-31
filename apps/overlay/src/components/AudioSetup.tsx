import React, { useState, useEffect } from 'react';
import { audioManager } from '@overlay/audio-engine';

export function AudioSetup() {
  const [needsUnlock, setNeedsUnlock] = useState(false);

  useEffect(() => {
    // Check if the context is suspended and needs unlocking
    const checkStatus = () => {
      // By calling isReady() we can see if it's already running.
      // If it's not ready, we assume it's suspended (or will be upon first access).
      if (!audioManager.isReady()) {
        setNeedsUnlock(true);
      }
    };
    
    // We do a small delay to let the initial render pass, just in case
    // it was already unlocked by some other interaction.
    setTimeout(checkStatus, 100);
  }, []);

  if (!needsUnlock) return null;

  const handleUnlock = async () => {
    const success = await audioManager.unlock();
    if (success) {
      setNeedsUnlock(false);
    }
  };

  return (
    <div 
      className="absolute top-4 left-4 z-[9999] bg-black/80 text-white p-4 rounded-xl border border-white/20 shadow-2xl flex flex-col items-center gap-2 max-w-sm backdrop-blur-md"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm">Audio is locked</h3>
          <p className="text-xs text-white/60">OBS must allow audio to play.</p>
        </div>
      </div>
      <button 
        onClick={handleUnlock}
        className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
      >
        Click here to Enable Audio
      </button>
    </div>
  );
}
