import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCreateAlert } from '../../hooks/useAlerts'
import type { AlertPreset, AlertTheme } from '@overlay/schema'

export const Route = createFileRoute('/alerts/presets')({
  component: AlertPresetsPage,
})

const PRESETS: { id: string; name: string; theme: AlertTheme; color: string; description: string }[] = [
  { id: '1', name: 'Cyberpunk Neon', theme: 'cyberpunk', color: 'from-fuchsia-500 to-cyan-500', description: 'High-tech low-life styling with glitch effects.' },
  { id: '2', name: 'Minimalist Clean', theme: 'minimal', color: 'from-gray-700 to-gray-500', description: 'Simple, elegant, and non-intrusive.' },
  { id: '3', name: 'Modern Glass', theme: 'modern-glass', color: 'from-blue-500 to-purple-500', description: 'Frosted glassmorphism with smooth gradients.' },
  { id: '4', name: 'Hardcore Gaming', theme: 'gaming', color: 'from-red-500 to-orange-500', description: 'Aggressive angles and bold colors.' },
  { id: '5', name: 'Anime Kawaii', theme: 'anime', color: 'from-pink-400 to-rose-400', description: 'Cute, bubbly, and vibrant.' },
  { id: '6', name: 'Retro 80s', theme: 'retro', color: 'from-indigo-500 to-pink-500', description: 'Synthwave vibes with scanlines.' },
]

function AlertPresetsPage() {
  const createAlert = useCreateAlert()
  const navigate = useNavigate()

  const handleSelectPreset = async (presetDef: typeof PRESETS[0]) => {
    // Generate default preset object
    const preset: Partial<AlertPreset> = {
      theme: presetDef.theme,
    }
    
    const result = await createAlert.mutateAsync({ name: `${presetDef.name} Alert`, preset })
    if (result?.id) {
      navigate({ to: `/alerts/${result.id}` })
    }
  }

  return (
    <div className="max-w-6xl space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Alert Library</h2>
        <p className="text-text-muted mt-1">Choose a starting preset to customize your alert.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRESETS.map((p) => (
          <div key={p.id} className="group relative bg-surface border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col h-[280px]">
            {/* Visual Preview Header */}
            <div className={`h-32 bg-gradient-to-br ${p.color} opacity-80 relative flex items-center justify-center`}>
               <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/30 flex items-center justify-center">
                  <span className="text-white font-bold text-xl block">!</span>
               </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold mb-2">{p.name}</h3>
              <p className="text-sm text-text-muted line-clamp-2">{p.description}</p>
              
              <div className="mt-auto pt-4">
                <button
                  onClick={() => handleSelectPreset(p)}
                  disabled={createAlert.isPending}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Use Preset
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
