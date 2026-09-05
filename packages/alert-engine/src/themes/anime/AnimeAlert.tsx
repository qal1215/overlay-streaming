import { AnimatePresence, motion } from "framer-motion";
import { type BaseAlertProps } from "../../alertTypes";

export default function AnimeAlert({
  isVisible,
  donorName,
  amount,
  message,
  imageUrl,
}: BaseAlertProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex h-full w-full items-center justify-center"
          >
            {/* Speedlines Effect */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.3 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIyIiBmaWxsPSJ3aGl0ZSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwKSIvPjwvc3ZnPg==')] bg-cover opacity-30"
              style={{ clipPath: "polygon(0 40%, 100% 20%, 100% 80%, 0 60%)" }}
            />

            {/* Main slanted box */}
            <motion.div
              initial={{ x: -1000, transform: 'skewX(-15deg)' }}
              animate={{ x: 0, transform: 'skewX(-15deg)' }}
              exit={{ x: 1000, transform: 'skewX(-15deg)' }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
              className="relative z-10 flex w-full max-w-4xl bg-red-600 shadow-[20px_20px_0_rgba(0,0,0,0.8)]"
            >
              {/* Inner white border */}
              <div className="flex w-full items-center gap-8 border-4 border-white p-8">
                {imageUrl && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex-shrink-0"
                    style={{ transform: 'skewX(15deg)' }} // un-skew
                  >
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-[8px_8px_0_rgba(0,0,0,1)]"
                    />
                  </motion.div>
                )}

                <div className="flex flex-col text-white" style={{ transform: 'skewX(15deg)' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-black uppercase tracking-widest text-black drop-shadow-[2px_2px_0_#fff]"
                  >
                    Kansei Dorifto?!
                  </motion.div>

                  <div className="mt-1 flex items-baseline gap-4">
                    <span className="text-4xl font-bold">{donorName}</span>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: [2, 1] }}
                      transition={{ delay: 0.4 }}
                      className="text-7xl font-black text-yellow-300 drop-shadow-[4px_4px_0_#000]"
                    >
                      {amount}
                    </motion.span>
                  </div>

                  {message && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 border-l-8 border-yellow-300 pl-4 text-2xl font-bold italic"
                    >
                      {message}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Impact Lines/Stars */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 2, 0] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute z-20 h-full w-full bg-[radial-gradient(circle,white_0%,transparent_60%)] opacity-50 mix-blend-overlay"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
