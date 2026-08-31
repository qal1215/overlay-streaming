import { AnimatePresence, motion } from "framer-motion";
import { type BaseAlertProps } from "../../alertTypes";
import CyberpunkFX from "./CyberpunkFX";

export default function CyberpunkAlert({
  isVisible,
  donorName,
  amount,
  message,
  imageUrl,
}: BaseAlertProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-50 flex items-end justify-center pb-24"
      style={{ perspective: 1200 }}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{
              opacity: 0,
              rotateX: -90,
              y: 120,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              rotateX: 0,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              rotateX: 35,
              y: -60,
              scale: 0.9,
              filter: "blur(8px)",
            }}
            transition={{
              type: "spring",
              damping: 16,
              stiffness: 140,
              mass: 0.8,
            }}
            className="relative flex w-[550px] flex-col items-center"
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {/* FX */}
            <CyberpunkFX />

            {/* IMAGE */}
            {imageUrl && (
              <motion.img
                src={imageUrl}
                alt=""
                initial={{
                  opacity: 0,
                  scale: 0.5,
                  rotate: -10,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                }}
                className="
                  absolute
                  -top-32
                  h-32
                  w-32
                  object-contain
                  drop-shadow-[0_0_30px_rgba(232,121,249,0.9)]
                "
              />
            )}

            {/* LABEL */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="
                font-mono
                text-sm
                font-bold
                tracking-[0.5em]
                text-fuchsia-400
                drop-shadow-[0_0_10px_rgba(232,121,249,0.9)]
              "
            >
              INCOMING TRANSMISSION
            </motion.div>

            {/* TITLE */}
            <motion.h2
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="
                mt-2
                font-mono
                text-4xl
                font-black
                uppercase
                tracking-[0.15em]
                text-purple-400
                drop-shadow-[0_0_20px_rgba(168,85,247,0.9)]
              "
            >
              DONATION
            </motion.h2>

            {/* DONOR */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="
                mt-4
                font-mono
                text-2xl
                font-bold
                tracking-widest
                text-white
                drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]
              "
            >
              {donorName}
            </motion.div>

            {/* AMOUNT */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 2,
                filter: "blur(12px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              transition={{
                delay: 0.35,
                type: "spring",
                stiffness: 180,
              }}
              className="
                mt-1
                font-mono
                text-7xl
                font-black
                text-fuchsia-400
                drop-shadow-[0_0_30px_rgba(232,121,249,1)]
              "
            >
              {amount}
            </motion.div>

            {/* MESSAGE */}
            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="
                  mt-5
                  font-mono
                  text-lg
                  text-purple-200
                  drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]
                "
              >
                <span className="mr-2 text-fuchsia-400">{">"}</span>
                {message}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                  }}
                >
                  _
                </motion.span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
