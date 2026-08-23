import { RotatingPanel, type RotatingPanelRef } from '#/components/rotatingPanel'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'

export const Route = createFileRoute('/rotatingPanel')({
  component: RouteComponent,
})

function RouteComponent() {
  const panelRef = useRef<RotatingPanelRef>(null)

  return <div>
    <RotatingPanel
      ref={panelRef}
      config={{
        width: 600,
        height: 600,

        faces: [
          {
            id: "follower",
            background: "#d9dee7",
            content: {
              type: "text",
              text: "LIKE & SUBSCRIBE",
            },
          },
          {
            id: "discord",
            content: {
              type: "image",
              src: "https://1000logos.net/wp-content/uploads/2021/06/Discord-logo.png",
            },
          },
          {
            id: "pubg",
            content: {
              type: "image",
              src: "https://images.seeklogo.com/logo-png/35/1/pubg-logo-png_seeklogo-352312.png",
            }
          },
          {
            id: "youtube",
            content: {
              type: "image",
              src: "https://static.vecteezy.com/system/resources/previews/023/986/704/non_2x/youtube-logo-youtube-logo-transparent-youtube-icon-transparent-free-free-png.png",
            }
          }
        ],

        rotation: {
          axis: "x",
          duration: 600,
        },

        autoRotate: {
          enabled: true,
          interval: 3000,
          direction: 1,
        },
      }}
    />

    <div>
      <button
        onClick={() => panelRef.current?.previous()}
      >
        Previous
      </button>

      <button
        onClick={() => panelRef.current?.next()}
      >
        Next
      </button>
    </div>
  </div>
}
