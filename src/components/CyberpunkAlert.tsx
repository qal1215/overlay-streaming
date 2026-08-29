import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CyberpunkAlertProps {
  isVisible: boolean;
  donorName: string;
  amount: string;
  message: string;
  onComplete: () => void;
}

export default function CyberpunkAlert({
  isVisible,
  donorName,
  amount,
  message,
  onComplete,
}: CyberpunkAlertProps) {
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isVisible) {
      // Auto-hide after 5 seconds
      timeoutId = setTimeout(() => {
        onComplete();
      }, 5000);
    }
    return () => clearTimeout(timeoutId);
  }, [isVisible, onComplete]);

  return (
    // Perspective wrapper for the 3D rotation effect
    <div 
      className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center pb-24" 
      style={{ perspective: 1200 }}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ 
              opacity: 0, 
              rotateX: -90, 
              y: 100, 
              scale: 0.8,
              transformOrigin: "bottom center" 
            }}
            animate={{ 
              opacity: 1, 
              rotateX: 0, 
              y: 0, 
              scale: 1,
              transformOrigin: "bottom center"
            }}
            exit={{ 
              opacity: 0, 
              rotateX: 45, 
              y: -50, 
              scale: 0.9,
              filter: "blur(10px)"
            }}
            transition={{ 
              type: "spring", 
              damping: 15, 
              stiffness: 120,
              mass: 1 
            }}
            className="relative overflow-hidden border border-purple-500/50 bg-black/90 p-8 shadow-[0_0_40px_rgba(168,85,247,0.5),inset_0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-xl"
            style={{ 
              width: 550,
              // Cyberpunk cut-corner shape
              clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)",
            }}
          >
            {/* Cyberpunk Glitchy Scanning Line */}
            <motion.div 
              className="absolute left-0 right-0 h-[2px] bg-fuchsia-400 shadow-[0_0_15px_#e879f9]"
              initial={{ top: "-10%", opacity: 0.8 }}
              animate={{ top: "110%", opacity: 0.2 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            />
            
            {/* Background Tech Grid */}
            <div 
              className="absolute inset-0 opacity-10" 
              style={{ 
                backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
              }} 
            />

            <div className="relative z-10 flex flex-col items-center text-center font-mono">
              <div className="mb-1 text-sm font-bold tracking-[0.4em] text-fuchsia-500/80">
                INCOMING TRANSMISSION
              </div>
              <h2 className="mb-4 text-3xl font-black uppercase tracking-[0.1em] text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                Donation Alert
              </h2>
              
              <div className="my-2 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white tracking-widest">{donorName}</span>
                <span className="mt-1 text-5xl font-black text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,0.9)]">
                  {amount}
                </span>
              </div>
              
              {message && (
                <div className="mt-6 w-full border-t border-purple-500/30 pt-4">
                  <p className="text-lg text-purple-200">
                    <span className="text-fuchsia-500 mr-2">{">"}</span>
                    {message}
                    <motion.span 
                      animate={{ opacity: [1, 0, 1] }} 
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      _
                    </motion.span>
                  </p>
                </div>
              )}
            </div>

            {/* Corner Tech Accents */}
            <div className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-fuchsia-500" />
            <div className="absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-fuchsia-500" />
            <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-fuchsia-500" />
            
            {/* Barcode/Tech visual noise */}
            <div className="absolute bottom-2 right-6 text-[10px] text-purple-500/50 font-mono tracking-widest">
              SYS.SEC.OVERRIDE//0984
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
