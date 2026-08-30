import { useState, useEffect } from 'react';
import { Settings, Volume2, Palette, Play, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import './index.css';

const THEMES = [
  { id: 'cyberpunk', name: 'Cyberpunk', color: 'from-fuchsia-500 to-cyan-500' },
  { id: 'minimal', name: 'Minimal', color: 'from-gray-700 to-gray-500' },
  { id: 'modern-glass', name: 'Modern Glass', color: 'from-blue-500 to-purple-500' },
  { id: 'gaming', name: 'Gaming', color: 'from-red-500 to-orange-500' },
  { id: 'anime', name: 'Anime', color: 'from-pink-400 to-rose-400' },
  { id: 'retro', name: 'Retro 80s', color: 'from-indigo-500 to-pink-500' },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const OVERLAY_URL = 'http://localhost:3000/?creatorId=default_creator';
const CREATOR_ID = 'default_creator';

function App() {
  const [theme, setTheme] = useState('cyberpunk');
  const [volume, setVolume] = useState(0.8);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/creator/${CREATOR_ID}/config`);
        if (res.ok) {
          const data = await res.json();
          setTheme(data.theme || 'cyberpunk');
          setVolume(data.volume ?? 0.8);
        }
      } catch (err) {
        console.error("Failed to fetch config", err);
      } finally {
        setInitialized(true);
      }
    };
    fetchConfig();
  }, []);

  const saveConfig = async (newTheme: string, newVolume: number) => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/creator/${CREATOR_ID}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme, volume: newVolume }),
      });
    } catch (err) {
      console.error("Failed to save config", err);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const handleThemeChange = (t: string) => {
    setTheme(t);
    saveConfig(t, volume);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    // Real app would debounce this, but for local dev it's okay.
    saveConfig(theme, v);
  };

  const handleTestAlert = async () => {
    setTesting(true);
    try {
      await fetch(`${API_URL}/api/admin/creator/${CREATOR_ID}/test-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
    } catch (err) {
      console.error("Failed to trigger test alert", err);
    } finally {
      setTimeout(() => setTesting(false), 500);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(OVERLAY_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!initialized) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Abstract Background */}
      <div className="absolute top-0 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background -z-10 animate-pulse" />
      
      <div className="max-w-5xl mx-auto p-8 relative z-10">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Creator Dashboard
            </h1>
            <p className="text-text-muted mt-2">Manage your streaming overlay settings in real-time.</p>
          </div>
          <div className="flex items-center gap-3 bg-surface border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium">Live Connection</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Theme Selector */}
            <div className="bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Alert Theme</h2>
                {saving && <span className="ml-auto text-xs text-emerald-400 animate-pulse">Saving...</span>}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${
                      theme === t.id 
                        ? 'ring-2 ring-primary bg-white/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${t.color} opacity-80`} />
                    <span className="block font-medium mt-2">{t.name}</span>
                    {theme === t.id && (
                      <CheckCircle2 className="absolute bottom-4 right-4 w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Settings */}
            <div className="bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Volume2 className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Audio Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm text-text-muted">
                  <span>Master Volume</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10" />
              
              <h2 className="text-xl font-semibold mb-2">Actions</h2>
              <p className="text-sm text-text-muted mb-6">Trigger a mock donation alert to see it live on your overlay.</p>
              
              <button
                onClick={handleTestAlert}
                disabled={testing}
                className="w-full py-3 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
              >
                <Play className="w-5 h-5 fill-current" />
                {testing ? 'Sending...' : 'Test Alert'}
              </button>
            </div>

            {/* Integration */}
            <div className="bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-text-muted" />
                <h2 className="text-lg font-semibold">OBS Integration</h2>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-text-muted">Browser Source URL</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={OVERLAY_URL}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  <button
                    onClick={copyUrl}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-white" />}
                  </button>
                </div>
                <a 
                  href={OVERLAY_URL} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover mt-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Browser
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
