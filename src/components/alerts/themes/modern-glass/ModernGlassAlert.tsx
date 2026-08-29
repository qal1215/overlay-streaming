import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type BaseAlertProps } from "../../types";
import { audioManager } from "#/lib/AudioManager";

export default function ModernGlassAlert({
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
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center pt-24">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="
              relative flex min-w-[400px] max-w-[600px] flex-col overflow-hidden rounded-3xl 
              border border-white/20 bg-white/10 p-6 
              shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl
            "
          >
            {/* Elegant glowing orb behind the glass */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-blue-500/30 blur-[50px]" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-purple-500/30 blur-[50px]" />

            <div className="relative z-10 flex items-center gap-6">
              {imageUrl ? (
                <motion.img
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  src={imageUrl}
                  alt="Avatar"
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg">
                  <span className="text-3xl font-bold text-white">🎉</span>
                </div>
              )}

              <div className="flex flex-col">
                <div className="text-sm font-semibold tracking-wider text-blue-200 uppercase">
                  New Supporter
                </div>
                <div className="text-2xl font-bold text-white">
                  {donorName}
                </div>
                <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                  {amount}
                </div>
              </div>
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.2 }}
                className="relative z-10 mt-6 border-t border-white/10 pt-4"
              >
                <p className="text-lg text-white/90 leading-relaxed">
                  {message}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
