import { motion } from "framer-motion";

export default function CyberpunkFX() {
  return (
    <>
      {/* Glow */}
      <motion.div
        className="
          pointer-events-none
          absolute
          h-40
          w-80
          rounded-full
          bg-fuchsia-500/20
          blur-[80px]
        "
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />

      {/* Scan line */}
      <motion.div
        className="
          pointer-events-none
          absolute
          h-px
          w-[500px]
          bg-fuchsia-400
          shadow-[0_0_20px_#e879f9]
        "
        initial={{ y: -100 }}
        animate={{ y: 250 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Particles */}
      {Array.from({ length: 12 }).map((_, index) => (
        <motion.div
          key={index}
          className="
            absolute
            h-1
            w-1
            rounded-full
            bg-fuchsia-400
            shadow-[0_0_10px_#e879f9]
          "
          initial={{
            opacity: 0,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
            x: Math.random() * 500 - 250,
            y: Math.random() * -250,
          }}
          transition={{
            duration: 1.5 + Math.random(),
            delay: Math.random() * 0.5,
            repeat: Infinity,
          }}
        />
      ))}
    </>
  );
}
