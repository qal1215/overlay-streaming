import { RotatingPanel, type RotatingPanelRef } from '#/components/rotatingPanel'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'

export const Route = createFileRoute('/rotatingPanel')({
  validateSearch: (search) => ({
    isOverlay: search.isOverlay === true || search.isOverlay === 'true',
  }),

  component: RouteComponent,
})

function RouteComponent() {
  const { isOverlay } = Route.useSearch()

  const panelRef = useRef<RotatingPanelRef>(null)

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: 'transparent',
      }}
    >
      <RotatingPanel
        ref={panelRef}
        config={{
          width: 600,
          height: 600,

          faces: [
            /*
             * ==================================================
             * FACE 1 — FOLLOWER
             * ==================================================
             */

            {
              id: 'follower',

              background:
                'linear-gradient(135deg, #19191a 0%, #252528 100%)',

              content: {
                type: 'custom',

                component: (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',

                      display: 'flex',
                      flexDirection: 'column',

                      alignItems: 'center',
                      justifyContent: 'center',

                      gap: 20,

                      color: '#ffffff',

                      fontFamily:
                        'Inter, system-ui, sans-serif',

                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 56,
                        fontWeight: 800,
                        letterSpacing: -2,
                      }}
                    >
                      LIKE
                    </div>

                    <div
                      style={{
                        fontSize: 56,
                        fontWeight: 800,
                        letterSpacing: -2,
                      }}
                    >
                      & SUBSCRIBE
                    </div>

                    <div
                      style={{
                        marginTop: 10,

                        fontSize: 18,
                        fontWeight: 500,

                        color: '#a1a1aa',
                      }}
                    >
                      Support the stream ❤️
                    </div>
                  </div>
                ),
              },
            },

            /*
             * ==================================================
             * FACE 2 — DISCORD
             * ==================================================
             */

            {
              id: 'discord',

              background:
                'linear-gradient(135deg, #5865F2 0%, #404EED 100%)',

              content: {
                type: 'custom',

                component: (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',

                      display: 'flex',
                      flexDirection: 'column',

                      alignItems: 'center',
                      justifyContent: 'center',

                      gap: 24,

                      color: '#ffffff',

                      fontFamily:
                        'Inter, system-ui, sans-serif',

                      textAlign: 'center',
                    }}
                  >
                    <img
                      src="https://1000logos.net/wp-content/uploads/2021/06/Discord-logo.png"
                      alt="Discord"
                      draggable={false}
                      style={{
                        width: 180,
                        height: 180,

                        objectFit: 'contain',

                        filter:
                          'brightness(0) invert(1)',
                      }}
                    />

                    <div
                      style={{
                        fontSize: 42,
                        fontWeight: 800,
                      }}
                    >
                      JOIN MY DISCORD
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        opacity: 0.8,
                      }}
                    >
                      Chat • Community • Gaming
                    </div>
                  </div>
                ),
              },
            },

            /*
             * ==================================================
             * FACE 3 — PUBG
             * ==================================================
             */

            {
              id: 'pubg',

              background:
                'linear-gradient(135deg, #151515 0%, #272727 100%)',

              content: {
                type: 'custom',

                component: (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',

                      display: 'flex',
                      flexDirection: 'column',

                      alignItems: 'center',
                      justifyContent: 'center',

                      gap: 20,

                      color: '#ffffff',

                      fontFamily:
                        'Inter, system-ui, sans-serif',

                      textAlign: 'center',
                    }}
                  >
                    <img
                      src="https://images.seeklogo.com/logo-png/35/1/pubg-logo-png_seeklogo-352312.png"
                      alt="PUBG"
                      draggable={false}
                      style={{
                        width: 300,
                        maxHeight: 180,

                        objectFit: 'contain',
                      }}
                    />

                    <div
                      style={{
                        fontSize: 38,
                        fontWeight: 800,

                        letterSpacing: 2,
                      }}
                    >
                      BATTLEGROUNDS
                    </div>

                    <div
                      style={{
                        fontSize: 18,

                        color: '#a1a1aa',
                      }}
                    >
                      Chicken Dinner? Maybe next time.
                    </div>
                  </div>
                ),
              },
            },

            /*
             * ==================================================
             * FACE 4 — YOUTUBE
             * ==================================================
             */

            {
              id: 'youtube',

              background:
                'linear-gradient(135deg, #ff0000 0%, #c90000 100%)',

              content: {
                type: 'custom',

                component: (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',

                      display: 'flex',
                      flexDirection: 'column',

                      alignItems: 'center',
                      justifyContent: 'center',

                      gap: 24,

                      color: '#ffffff',

                      fontFamily:
                        'Inter, system-ui, sans-serif',

                      textAlign: 'center',
                    }}
                  >
                    <img
                      src="https://static.vecteezy.com/system/resources/previews/023/986/704/non_2x/youtube-logo-youtube-logo-transparent-youtube-icon-transparent-free-free-png.png"
                      alt="YouTube"
                      draggable={false}
                      style={{
                        width: 180,
                        height: 180,

                        objectFit: 'contain',
                      }}
                    />

                    <div
                      style={{
                        fontSize: 48,
                        fontWeight: 800,
                      }}
                    >
                      SUBSCRIBE
                    </div>

                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 600,

                        opacity: 0.9,
                      }}
                    >
                      @qal1215
                    </div>
                  </div>
                ),
              },
            },
          ],

          /*
           * ==================================================
           * ROTATION
           * ==================================================
           */

          rotation: {
            axis: 'x',

            /*
             * 600ms gives a noticeable but smooth
             * streamer-overlay style rotation.
             */
            duration: 2000,
          },

          /*
           * ==================================================
           * AUTO ROTATION
           * ==================================================
           */

          autoRotate: {
            enabled: true,

            /*
             * Start of next rotation:
             *
             * 0s    → Face 1
             * 3s    → Face 2
             * 6s    → Face 3
             * 9s    → Face 4
             * 12s   → Face 1
             */
            interval: 5000,

            direction: 1,
          },
        }}
      />

      {/* ======================================================
          CONTROLS
      ====================================================== */}

      {!isOverlay && (
        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          <button
            onClick={() =>
              panelRef.current?.previous()
            }
          >
            Previous
          </button>

          <button
            onClick={() =>
              panelRef.current?.next()
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
