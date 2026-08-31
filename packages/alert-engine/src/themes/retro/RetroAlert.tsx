import { AnimatePresence, motion } from "framer-motion";
import { type BaseAlertProps } from "../../alertTypes";

export default function RetroAlert({
  isVisible,
  donorName,
  amount,
  message,
  imageUrl,
}: BaseAlertProps) {
  return (
    <>
      {/* Import Pixel Font */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .font-retro { font-family: 'Press Start 2P', monospace; }
          .scanlines {
            background: linear-gradient(
              to bottom,
              rgba(255,255,255,0),
              rgba(255,255,255,0) 50%,
              rgba(0,0,0,0.2) 50%,
              rgba(0,0,0,0.2)
            );
            background-size: 100% 4px;
          }
        `}
      </style>

      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-8">
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ type: "spring", damping: 12, stiffness: 100 }}
              className="font-retro relative flex flex-col items-center bg-blue-900 border-4 border-white p-6 shadow-[10px_10px_0_#000] text-white"
            >
              {/* CRT Scanlines Overlay */}
              <div className="scanlines pointer-events-none absolute inset-0 z-20 opacity-50 mix-blend-overlay" />

              <div className="relative z-10 text-center flex flex-col items-center">
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-yellow-300 text-sm mb-4"
                >
                  1UP DETECTED
                </motion.div>

                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Avatar"
                    className="h-24 w-24 object-cover border-4 border-white mb-4 shadow-[4px_4px_0_#000]"
                    style={{ imageRendering: "pixelated" }}
                  />
                )}

                <div className="text-xl leading-loose">
                  <span className="text-green-400">{donorName}</span>
                  <br />
                  INSERTED{" "}
                  <span className="text-yellow-400 text-2xl">{amount}</span>
                </div>

                {message && (
                  <div className="mt-6 border-t-4 border-white/50 pt-4 text-xs leading-relaxed max-w-md bg-black/50 p-4 border-2">
                    {message}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
