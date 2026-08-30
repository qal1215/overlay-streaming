import { createFileRoute, Link } from '@tanstack/react-router'
import { useAlert, useUpdateAlert } from '../../features/alerts/hooks/useAlerts'
import { ArrowLeft, Save, Play, MonitorPlay, Type, Settings, Volume2, Mic } from 'lucide-react'
import { useState, useEffect } from 'react'

// Import the actual AlertRenderer from our overlay engine for a 1:1 Live Preview!
import { AlertRenderer } from '@overlay/alert-engine'
import type { AlertPreset, AlertTheme } from '@overlay/schema'

export const Route = createFileRoute('/alerts/$id')({
  component: AlertEditorPage,
})

function AlertEditorPage() {
  const { id } = Route.useParams()
  const { data: alertData, isLoading } = useAlert(id)
  const updateAlert = useUpdateAlert()
  
  const [name, setName] = useState('')
  const [preset, setPreset] = useState<AlertPreset | null>(null)
  const [activeTab, setActiveTab] = useState<'visual' | 'animation' | 'audio' | 'tts'>('visual')
  const [previewKey, setPreviewKey] = useState(0) // Used to force re-render/replay animation
  
  // Local state for the preview overlay
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)

  useEffect(() => {
    if (alertData) {
      setName(alertData.name)
      setPreset(alertData.preset)
    }
  }, [alertData])

  if (isLoading || !preset) return <div className="p-8">Loading editor...</div>

  const handleSave = () => {
    updateAlert.mutate({ id, data: { name, preset } })
  }

  const handlePlayPreview = () => {
    setIsPreviewVisible(false)
    setTimeout(() => {
      setPreviewKey(prev => prev + 1)
      setIsPreviewVisible(true)
      
      // Auto hide after 5 seconds to simulate an alert timeline
      setTimeout(() => {
        setIsPreviewVisible(false)
      }, 5000)
    }, 100)
  }

  const updatePreset = (section: keyof AlertPreset, field: string, value: any) => {
    setPreset(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [field]: value
        }
      }
    })
  }

  const updateTheme = (theme: AlertTheme) => {
    setPreset(prev => prev ? { ...prev, theme } : prev)
  }

  return (
    <div className="h-full flex flex-col -m-8">
      {/* Editor Topbar */}
      <header className="h-14 border-b border-white/10 bg-surface flex items-center justify-between px-4 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <Link to="/alerts" className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-lg font-bold text-white px-2 py-1 rounded hover:bg-white/5 focus:bg-white/5 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPreview}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Play size={16} />
            Test Alert
          </button>
          <button
            onClick={handleSave}
            disabled={updateAlert.isPending}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          >
            <Save size={16} />
            {updateAlert.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Config Panel */}
        <aside className="w-80 border-r border-white/10 bg-surface/80 backdrop-blur-xl flex flex-col z-10">
          <div className="flex items-center border-b border-white/10 p-2">
            <TabButton active={activeTab === 'visual'} onClick={() => setActiveTab('visual')} icon={<MonitorPlay size={16}/>} label="Visual" />
            <TabButton active={activeTab === 'animation'} onClick={() => setActiveTab('animation')} icon={<Settings size={16}/>} label="Motion" />
            <TabButton active={activeTab === 'audio'} onClick={() => setActiveTab('audio')} icon={<Volume2 size={16}/>} label="Audio" />
            <TabButton active={activeTab === 'tts'} onClick={() => setActiveTab('tts')} icon={<Mic size={16}/>} label="TTS" />
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'visual' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-muted">Base Theme</label>
                  <select 
                    value={preset.theme}
                    onChange={(e) => updateTheme(e.target.value as AlertTheme)}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="cyberpunk">Cyberpunk Neon</option>
                    <option value="minimal">Minimalist Clean</option>
                    <option value="modern-glass">Modern Glass</option>
                    <option value="gaming">Hardcore Gaming</option>
                    <option value="anime">Anime Kawaii</option>
                    <option value="retro">Retro 80s</option>
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-muted">Layout Style</label>
                  <select 
                    value={preset.visual?.layout || 'centered'}
                    onChange={(e) => updatePreset('visual', 'layout', e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="centered">Centered</option>
                    <option value="side">Side Banner</option>
                    <option value="banner">Top Banner</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-muted">Primary Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={preset.visual?.primaryColor || '#3b82f6'}
                      onChange={(e) => updatePreset('visual', 'primaryColor', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={preset.visual?.primaryColor || '#3b82f6'}
                      onChange={(e) => updatePreset('visual', 'primaryColor', e.target.value)}
                      className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'animation' && (
              <div className="space-y-6">
                 <div className="space-y-3">
                  <label className="text-sm font-medium text-text-muted">Enter Animation</label>
                  <select 
                    value={preset.animation?.enterStyle || 'fade'}
                    onChange={(e) => updatePreset('animation', 'enterStyle', e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="fade">Fade In</option>
                    <option value="slide">Slide In</option>
                    <option value="bounce">Bounce</option>
                    <option value="zoom">Zoom In</option>
                    <option value="glitch">Glitch Effect</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-text-muted">Exit Animation</label>
                  <select 
                    value={preset.animation?.exitStyle || 'fade'}
                    onChange={(e) => updatePreset('animation', 'exitStyle', e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="fade">Fade Out</option>
                    <option value="slide">Slide Out</option>
                    <option value="bounce">Bounce Out</option>
                    <option value="zoom">Zoom Out</option>
                    <option value="glitch">Glitch Out</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
               <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-sm font-medium text-text-muted flex justify-between">
                      <span>Volume</span>
                      <span>{Math.round((preset.audio?.volume ?? 0.8) * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={preset.audio?.volume ?? 0.8}
                      onChange={(e) => updatePreset('audio', 'volume', parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                 </div>
               </div>
            )}

            {activeTab === 'tts' && (
              <div className="space-y-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={preset.tts?.enabled || false}
                    onChange={(e) => updatePreset('tts', 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-background text-primary focus:ring-primary/50"
                  />
                  <span className="text-sm font-medium">Enable Text-to-Speech</span>
                </label>

                {preset.tts?.enabled && (
                  <>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-text-muted">Message Template</label>
                      <input 
                        type="text" 
                        value={preset.tts?.template || '{name} donated {amount}! {message}'}
                        onChange={(e) => updatePreset('tts', 'template', e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        placeholder="{name} says {message}"
                      />
                      <p className="text-xs text-text-muted">Variables: {`{name}, {amount}, {message}`}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Live Preview Canvas */}
        <main className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-black relative flex items-center justify-center overflow-hidden">
          
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          {/* Centered Canvas Bounds (Simulating a 1920x1080 OBS source scaled down) */}
          <div className="relative border border-white/10 bg-black/40 shadow-2xl overflow-hidden rounded-lg flex items-center justify-center" 
               style={{ width: '960px', height: '540px' }}>
            <span className="absolute top-4 left-4 text-xs font-mono text-white/30">PREVIEW (1920x1080 Scaled)</span>
            
            {/* The Actual AlertRenderer! */}
            <div className="w-[1920px] h-[1080px] absolute" style={{ transform: 'scale(0.5)', transformOrigin: 'center center' }}>
              <AlertRenderer
                key={previewKey}
                isVisible={isPreviewVisible}
                currentAlert={{
                  id: 'preview',
                  theme: preset.theme,
                  donorName: 'TestUser',
                  amount: '$50.00',
                  message: 'This is a live preview of your custom alert!',
                }}
              />
            </div>
          </div>
          
        </main>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-2 px-1 gap-1 rounded-md transition-colors ${
        active ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
    </button>
  )
}
