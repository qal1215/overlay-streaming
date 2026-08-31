import { createFileRoute } from '@tanstack/react-router'
import { useAudioAssets, useUploadAudio, useDeleteAudio } from '../../features/audio/hooks/useAudio'
import { Music, Upload, Trash2, Play, Pause, Volume2, Cloud } from 'lucide-react'
import { useState, useRef } from 'react'

import { audioManager } from '@overlay/audio-engine'
import { API_URL } from '../../api/client'

export const Route = createFileRoute('/audio/')({
  component: AudioLibraryPage,
})

function AudioLibraryPage() {
  const { data: audioFiles, isLoading } = useAudioAssets()
  const uploadAudio = useUploadAudio()
  const deleteAudio = useDeleteAudio()
  
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePlayPause = async (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (url.startsWith('synthetic:')) {
        await audioManager.initialize();
        audioManager.play(url); // The engine will look it up in SYNTH_REGISTRY
        
        // Stop playing state after a fixed duration since synthetic sounds don't have natural onEnded events
        setPlayingId(id);
        setTimeout(() => setPlayingId(null), 600);
      } else if (audioRef.current) {
        audioRef.current.src = url.startsWith('http') ? url : `${API_URL}${url}`
        audioRef.current.play()
        setPlayingId(id)
      }
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.")
      return
    }

    try {
      await uploadAudio.mutateAsync(file)
    } catch (err: any) {
      alert(err.message || "Failed to upload file")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'System Default'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Hidden Global Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingId(null)} 
        className="hidden" 
      />

      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Audio Library</h2>
          <p className="text-text-muted mt-1">Manage your sound effects and alerts audio.</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            accept="audio/mpeg, audio/wav, audio/ogg" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAudio.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <Upload size={18} />
            <span>{uploadAudio.isPending ? 'Uploading...' : 'Upload Audio (Max 5MB)'}</span>
          </button>
        </div>
      </header>

      {/* Cloudflare Asset Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-4">
        <Cloud className="text-blue-400 mt-1 shrink-0" size={24} />
        <div>
          <h4 className="font-semibold text-blue-100">Cloudflare R2 Storage Active</h4>
          <p className="text-sm text-blue-200/70 mt-1">
            Uploaded assets are seamlessly stored in your R2 bucket. In production, these will be served via your custom CDN domain for ultra-low latency.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-text-muted">Loading audio library...</div>
      ) : audioFiles?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/5 border-dashed rounded-2xl bg-surface/30">
          <Music size={48} className="text-text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No audio found</h3>
          <p className="text-text-muted mb-6 text-center max-w-sm">Upload some sound effects to use in your alerts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audioFiles?.map((audio) => {
            const isPlaying = playingId === audio.id
            const isSystem = audio.creator_id === 'system'

            return (
              <div key={audio.id} className="bg-surface border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 overflow-hidden">
                  <button 
                    onClick={() => handlePlayPause(audio.id, audio.url)}
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                  </button>
                  <div className="overflow-hidden">
                    <h4 className="font-semibold truncate text-sm" title={audio.name}>{audio.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-text-muted bg-white/5 px-2 py-0.5 rounded font-mono">
                        {formatSize(audio.size)}
                      </span>
                      {isSystem && (
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded uppercase font-bold">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isSystem && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this audio file?')) {
                        deleteAudio.mutate(audio.id)
                      }
                    }}
                    disabled={deleteAudio.isPending}
                    className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete audio"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
