import { AnimatePresence, motion } from "framer-motion";
import { type BaseAlertProps } from "../../alertTypes";

export default function MinimalAlert({
  isVisible,
  donorName,
  amount,
  message,
  imageUrl,
}: BaseAlertProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            {imageUrl && (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                src={imageUrl}
                alt="Avatar"
                className="h-24 w-24 rounded-full object-cover shadow-lg"
              />
            )}

            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg font-medium text-white/70 uppercase tracking-widest"
              >
                Donation Received
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-2 text-4xl font-light text-white"
              >
                <span className="font-semibold">{donorName}</span> sent{" "}
                <span className="font-medium text-emerald-400">{amount}</span>
              </motion.div>
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 max-w-lg text-xl italic text-white/80"
              >
                "{message}"
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
