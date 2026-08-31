import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { audioManager } from '@overlay/audio-engine'

export const Route = createFileRoute('/debug/audio')({
  component: AudioDebugPage,
})

function AudioDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [audioState, setAudioState] = useState<string>('unknown')
  const audioRef = useRef<HTMLAudioElement>(null)

  const log = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${msg}`])
  }

  // Poll AudioContext state
  useEffect(() => {
    const interval = setInterval(() => {
      // @ts-ignore - accessing private context for debug
      const ctx = audioManager.context
      setAudioState(ctx ? ctx.state : 'uninitialized')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const testHtmlAudio = async () => {
    try {
      log("Testing HTML <audio>...")
      if (!audioRef.current) throw new Error("No audio ref")
      
      // We'll try to play a test sound (we'll just use a synthetic beep via blob if no file is present, or a standard remote mp3)
      audioRef.current.src = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
      await audioRef.current.play()
      log("HTML Audio played successfully")
    } catch (e: any) {
      log(`HTML Audio failed: ${e.message}`)
    }
  }

  const testWebAudio = async () => {
    try {
      log("Testing raw Web Audio API...")
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      log(`New Context created: ${ctx.state}`)
      
      if (ctx.state === "suspended") {
        await ctx.resume()
        log(`Context resumed: ${ctx.state}`)
      }
      
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 440
      gain.gain.value = 0.2
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()
      log("Raw Web Audio oscillator started")
      
      setTimeout(() => {
        osc.stop()
        log("Raw Web Audio oscillator stopped")
      }, 500)
    } catch (e: any) {
      log(`Web Audio failed: ${e.message}`)
    }
  }

  const testAudioManagerInit = async () => {
    try {
      log("Initializing AudioManager...")
      await audioManager.initialize()
      log("AudioManager initialized.")
    } catch (e: any) {
      log(`AudioManager init failed: ${e.message}`)
    }
  }

  const testAudioManagerSynth = () => {
    log("Playing synthetic beep via AudioManager...")
    audioManager.play('synthetic:beep')
  }

  return (
    <div className="p-8 text-white font-mono bg-black min-h-screen">
      <h1 className="text-2xl font-bold text-red-500 mb-6">OBS Audio Diagnostics</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl border-b border-white/20 pb-2 mb-4 text-blue-400">Context</h2>
          <div className="mb-8 text-lg">
            AudioManager Context State: <span className={audioState === 'running' ? 'text-green-500' : 'text-yellow-500 font-bold'}>{audioState}</span>
          </div>

          <h2 className="text-xl border-b border-white/20 pb-2 mb-4 text-blue-400">Tests</h2>
          <div className="flex flex-col gap-3">
            <button onClick={testHtmlAudio} className="bg-white/10 hover:bg-white/20 px-4 py-2 text-left rounded border border-white/20">
              1. Test HTML &lt;audio&gt;
            </button>
            <button onClick={testWebAudio} className="bg-white/10 hover:bg-white/20 px-4 py-2 text-left rounded border border-white/20">
              2. Test Raw Web Audio (Oscillator)
            </button>
            <button onClick={testAudioManagerInit} className="bg-white/10 hover:bg-white/20 px-4 py-2 text-left rounded border border-white/20">
              3. Init AudioManager (Resume context)
            </button>
            <button onClick={testAudioManagerSynth} className="bg-white/10 hover:bg-white/20 px-4 py-2 text-left rounded border border-white/20">
              4. Test AudioManager (Synthetic beep)
            </button>
          </div>
          
          <audio ref={audioRef} style={{ display: 'none' }} />
        </div>

        <div>
          <h2 className="text-xl border-b border-white/20 pb-2 mb-4 text-blue-400">On-Screen Console</h2>
          <div className="bg-black/50 border border-white/10 rounded p-4 h-[400px] overflow-y-auto font-mono text-sm flex flex-col gap-1">
            {logs.length === 0 && <div className="text-white/30 italic">No logs yet...</div>}
            {logs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
