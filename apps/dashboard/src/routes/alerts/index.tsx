import { createFileRoute, Link } from '@tanstack/react-router'
import { useAlerts, useDeleteAlert, useCreateAlert } from '../../features/alerts/hooks/useAlerts'
import { Plus, Edit, Trash2, BellRing, Copy, Play, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { AlertRenderer } from '@overlay/alert-engine'
import { audioManager } from '@overlay/audio-engine'
import { API_URL } from '../../api/client'
import { useAudioAssets } from '../../features/audio/hooks/useAudio'

export const Route = createFileRoute('/alerts/')({
  component: AlertsListPage,
})

function AlertsListPage() {
  const { data: alerts, isLoading, isError } = useAlerts()
  const { data: audioFiles } = useAudioAssets()
  const deleteAlert = useDeleteAlert()
  const createAlert = useCreateAlert()

  const [previewAlert, setPreviewAlert] = useState<any | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  const handleDuplicate = (alert: any) => {
    createAlert.mutate({
      name: `${alert.name} (Copy)`,
      preset: alert.preset
    })
  }

  const handlePreview = async (alert: any) => {
    await audioManager.initialize();
    
    setPreviewAlert(null)
    setTimeout(async () => {
      setPreviewKey(prev => prev + 1)
      setPreviewAlert(alert)
      
      if (alert.preset?.audio?.soundId && audioFiles) {
        const soundFile = audioFiles.find((f: any) => f.id === alert.preset.audio!.soundId);
        if (soundFile) {
          const soundUrl = `${API_URL}${soundFile.url}`;
          await audioManager.preload(soundUrl, soundUrl);
          audioManager.play(soundUrl, alert.preset.audio.volume ?? 0.8);
        }
      }
      
      setTimeout(() => {
        setPreviewAlert(null)
      }, alert.preset?.animation?.duration ?? 5000)
    }, 100)
  }

  return (
    <div className="max-w-6xl space-y-8 relative">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Alerts</h2>
          <p className="text-text-muted mt-1">Manage your custom alert designs and sounds.</p>
        </div>
        <Link
          to="/alerts/presets"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        >
          <Plus size={18} />
          <span>New Alert</span>
        </Link>
      </header>

      {isLoading ? (
        <div className="text-text-muted">Loading alerts...</div>
      ) : isError ? (
        <div className="text-red-400">Failed to load alerts.</div>
      ) : alerts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/5 border-dashed rounded-2xl bg-surface/30">
          <BellRing size={48} className="text-text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
          <p className="text-text-muted mb-6 text-center max-w-sm">You haven't created any custom alerts yet. Start by choosing a preset from the library.</p>
          <Link
            to="/alerts/presets"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            <span>Browse Presets</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {alerts?.map((alert) => (
            <div key={alert.id} className="group bg-surface border border-white/10 rounded-2xl p-5 backdrop-blur-xl hover:border-primary/50 transition-colors flex flex-col shadow-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <BellRing size={20} className="text-primary" />
                  <h3 className="text-lg font-bold truncate flex-1" title={alert.name}>{alert.name}</h3>
                </div>
                
                <hr className="border-white/10 mb-3" />

                <div className="flex items-center gap-2 text-sm text-text-muted mb-6 font-medium">
                  <span className="capitalize text-white">{alert.preset?.theme || 'Custom'}</span>
                  <span>•</span>
                  <span>{((alert.preset?.animation?.duration ?? 5000) / 1000).toFixed(1)}s</span>
                  {alert.preset?.audio?.soundId && (
                    <>
                      <span>•</span>
                      <Volume2 size={14} className="text-primary" />
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-white/10 mt-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(alert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 hover:text-white text-text-muted rounded-lg transition-colors text-xs font-semibold"
                  >
                    <Play size={14} />
                    Preview
                  </button>
                  <Link
                    // @ts-expect-error router typing
                    to={`/alerts/${alert.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 hover:text-white text-text-muted rounded-lg transition-colors text-xs font-semibold"
                  >
                    <Edit size={14} />
                    Edit
                  </Link>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(alert)}
                    disabled={createAlert.isPending}
                    className="p-1.5 hover:bg-white/10 hover:text-white text-text-muted rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this alert?')) {
                        deleteAlert.mutate(alert.id)
                      }
                    }}
                    disabled={deleteAlert.isPending}
                    className="p-1.5 hover:bg-red-500/20 text-text-muted hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewAlert && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="w-[1920px] h-[1080px] absolute" style={{ transform: 'scale(0.6)', transformOrigin: 'center center' }}>
             <AlertRenderer
               key={previewKey}
               isVisible={true}
               currentAlert={{
                 id: 'preview',
                 theme: previewAlert.preset.theme,
                 donorName: 'TestUser',
                 amount: '$100.00',
                 message: 'This is a library preview!',
               }}
             />
          </div>
        </div>
      )}
    </div>
  )
}
