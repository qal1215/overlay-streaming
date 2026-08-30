import { createFileRoute } from '@tanstack/react-router'
import { useCreatorConfig, useTestAlert, useUpdateCreatorConfig } from '../hooks/useCreator'
import { Palette, Volume2, Play, ExternalLink } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: OverviewPage,
})

const THEMES = [
  { id: 'cyberpunk', name: 'Cyberpunk', color: 'from-fuchsia-500 to-cyan-500' },
  { id: 'minimal', name: 'Minimal', color: 'from-gray-700 to-gray-500' },
  { id: 'modern-glass', name: 'Modern Glass', color: 'from-blue-500 to-purple-500' },
  { id: 'gaming', name: 'Gaming', color: 'from-red-500 to-orange-500' },
  { id: 'anime', name: 'Anime', color: 'from-pink-400 to-rose-400' },
  { id: 'retro', name: 'Retro 80s', color: 'from-indigo-500 to-pink-500' },
];

function OverviewPage() {
  const { data: config, isLoading, isError } = useCreatorConfig()
  const updateConfig = useUpdateCreatorConfig()
  const testAlert = useTestAlert()

  if (isLoading) return <div>Loading config...</div>
  if (isError || !config) return <div>Error loading config</div>

  const handleTestAlert = () => {
    testAlert.mutate(config.theme)
  }

  return (
    <div className="max-w-5xl space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Overview</h2>
          <p className="text-text-muted mt-1">Manage your active overlay and test alerts.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium">Live Connection</span>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Stats (Placeholder) */}
        <div className="lg:col-span-3 grid grid-cols-3 gap-6">
          <div className="bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-text-muted text-sm font-medium mb-2">Overlay Status</h3>
            <div className="text-2xl font-bold flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              Online
            </div>
          </div>
          <div className="bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-text-muted text-sm font-medium mb-2">Donations Today</h3>
            <div className="text-2xl font-bold">$245.20</div>
          </div>
          <div className="bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-text-muted text-sm font-medium mb-2">Alerts Played</h3>
            <div className="text-2xl font-bold">128</div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="lg:col-span-2 bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Active Theme</h3>
            </div>
            {updateConfig.isPending && <span className="text-xs text-primary animate-pulse">Saving...</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => updateConfig.mutate({ theme: t.id })}
                className={`relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${
                  config.theme === t.id 
                    ? 'ring-2 ring-primary bg-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${t.color} opacity-80`} />
                <span className="block font-medium mt-1">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions & Audio */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
            <h3 className="text-lg font-semibold mb-2">Quick Action</h3>
            <p className="text-sm text-text-muted mb-6">Send a test alert to your OBS overlay.</p>
            <button
              onClick={handleTestAlert}
              disabled={testAlert.isPending}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            >
              <Play className="w-4 h-4 fill-current" />
              {testAlert.isPending ? 'Sending...' : 'Test Alert'}
            </button>
          </div>

          <div className="bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-text-muted" />
              <h3 className="text-md font-semibold">Master Volume</h3>
            </div>
            <div className="flex justify-between items-center text-sm text-text-muted mb-2">
              <span>Volume</span>
              <span>{Math.round(config.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.volume}
              onChange={(e) => updateConfig.mutate({ volume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
