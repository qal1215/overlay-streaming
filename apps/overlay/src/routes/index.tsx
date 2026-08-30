import { FlipPanel } from '#/components/flipPanel'
import { OverlayComponent } from '#/components/flush'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <OverlayComponent >
        <p className="text-lg">
          Edit <code>src/routes/index.tsx</code> to get started.
        </p>
      </OverlayComponent>

      <FlipPanel
        front={
          <div>
            <div className="text-sm text-gray-400">
              NEW DONATION
            </div>

            <div className="text-2xl font-bold">
              $20.00
            </div>
          </div>
        }
        back={
          <div>
            <div className="text-sm text-gray-400">
              MESSAGE
            </div>

            <div className="text-xl font-bold">
              Let's go! 🔥
            </div>
          </div>
        }
      />
    </div>
  )
}
