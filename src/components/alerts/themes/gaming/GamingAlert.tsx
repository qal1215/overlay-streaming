import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type BaseAlertProps } from "../../types";
import { audioManager } from "#/lib/AudioManager";

export default function GamingAlert({
  isVisible,
  donorName,
  amount,
  message,
  imageUrl,
  soundUrl,
  onComplete,
}: BaseAlertProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timeoutId = setTimeout(onComplete, 5000);
    return () => clearTimeout(timeoutId);
  }, [isVisible, onComplete]);

  useEffect(() => {
    if (!isVisible || !soundUrl) return;
    audioManager.play(soundUrl);
  }, [isVisible, soundUrl]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
            transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
            className="relative flex flex-col items-center"
          >
            {/* Dynamic starburst background effect */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-20 z-0 opacity-40"
              style={{
                background: "conic-gradient(from 0deg, transparent 0 30deg, #fbbf24 30deg 60deg, transparent 60deg 90deg, #ef4444 90deg 120deg, transparent 120deg 150deg, #3b82f6 150deg 180deg, transparent 180deg 210deg, #fbbf24 210deg 240deg, transparent 240deg 270deg, #ef4444 270deg 300deg, transparent 300deg 330deg, #3b82f6 330deg 360deg)",
                maskImage: "radial-gradient(circle, black 20%, transparent 70%)",
                WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 70%)"
              }}
            />

            {/* Impact Text */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.7 }}
              className="relative z-10 -mb-4 rounded-xl bg-yellow-400 px-6 py-2 text-2xl font-black italic tracking-tighter text-black shadow-[4px_4px_0px_#b45309] border-2 border-black rotate-[-2deg]"
            >
              NEW HIGH SCORE!
            </motion.div>

            {/* Main Box */}
            <div className="relative z-10 flex flex-col items-center rounded-2xl border-4 border-black bg-gradient-to-b from-blue-500 to-blue-700 p-8 text-center shadow-[8px_8px_0px_#000000]">
              <div className="text-4xl font-black uppercase text-white drop-shadow-[2px_2px_0_#000]">
                {donorName}
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1.5, 1] }}
                transition={{ delay: 0.3, type: "spring" }}
                className="my-4 text-7xl font-black text-yellow-300 drop-shadow-[4px_4px_0_#ef4444] [-webkit-text-stroke:2px_black]"
              >
                {amount}
              </motion.div>
              
              {message && (
                <div className="mt-2 max-w-sm rounded-lg border-2 border-black bg-white p-3 text-xl font-bold text-black shadow-[4px_4px_0_#000]">
                  "{message}"
                </div>
              )}
            </div>
            
            {/* Image floating */}
            {imageUrl && (
              <motion.img
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                src={imageUrl}
                alt=""
                className="absolute -right-16 -bottom-10 h-32 w-32 rounded-full border-4 border-black shadow-[4px_4px_0_#000]"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
