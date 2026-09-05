import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Save, BellRing, Copy, Key, Check } from 'lucide-react'
import { API_URL } from '../../api/client'

export const Route = createFileRoute('/donations/settings')({
  component: DonationSettingsPage,
})

function DonationSettingsPage() {
  const [testStatus, setTestStatus] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const creatorId = 'qal1215'; // Hardcoded for dashboard MVP, usually from auth context

  useEffect(() => {
    fetch(`${API_URL}/admin/creator/${creatorId}/donation-settings`, {
      headers: {
        'Authorization': 'default_admin_secret_dev'
      }
    })
      .then(res => res.json())
      .then(data => {
        setSettings(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleTestAlert = async () => {
    setTestStatus('Testing...')
    try {
      const res = await fetch(`${API_URL}/admin/creator/qal1215/test-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Test Donor",
          amount: 50000,
          currency: "VND",
          message: "This is a test donation alert!",
          type: "donation"
        })
      });
      if (res.ok) {
        setTestStatus('Success!')
        setTimeout(() => setTestStatus(null), 3000)
      } else {
        setTestStatus('Failed')
      }
    } catch (e) {
      setTestStatus('Error')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // In a real app, we'd grab values from controlled inputs.
    // For MVP, we assume the state is already updated via onChange.
    try {
      await fetch(`${API_URL}/admin/creator/${creatorId}/donation-settings`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'default_admin_secret_dev'
        },
        body: JSON.stringify({
          creatorId,
          donationSettings: settings.donationSettings,
          paymentAccount: settings.paymentAccount
        })
      });
      alert('Saved successfully!');
    } catch (e) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const handleGenerateSecret = async () => {
    if (!confirm('This will replace your current secret. Are you sure?')) return;
    
    try {
      const res = await fetch(`${API_URL}/admin/creator/${creatorId}/donation-settings/generate-sepay-secret`, {
        method: 'POST',
        headers: {
          'Authorization': 'default_admin_secret_dev'
        }
      });
      const data = await res.json();
      if (data.secret) {
        setGeneratedSecret(data.secret);
        setSettings({ ...settings, sepayWebhookConfigured: true });
      }
    } catch (e) {
      alert('Failed to generate secret');
    }
  }

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Donation Settings</h1>
        <p className="text-text-muted">Configure your payment details and donation page rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-surface/30 border border-white/5 rounded-xl backdrop-blur-sm p-6">
            <h2 className="text-xl font-bold text-white mb-6">Payment Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Payment Provider</label>
                <select className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  <option value="sepay">SePay (VietQR)</option>
                  <option value="payos" disabled>PayOS (Coming Soon)</option>
                  <option value="stripe" disabled>Stripe (Coming Soon)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Bank Name / BIN</label>
                  <input type="text" 
                    value={settings.paymentAccount.bank} 
                    onChange={e => setSettings({...settings, paymentAccount: {...settings.paymentAccount, bank: e.target.value}})}
                    className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Account Number</label>
                  <input type="text" 
                    value={settings.paymentAccount.accountNumber}
                    onChange={e => setSettings({...settings, paymentAccount: {...settings.paymentAccount, accountNumber: e.target.value}})}
                    className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Account Name</label>
                <input type="text" 
                  value={settings.paymentAccount.accountName}
                  onChange={e => setSettings({...settings, paymentAccount: {...settings.paymentAccount, accountName: e.target.value}})}
                  className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">SePay Integration</h3>
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Webhook URL</label>
                <div className="flex space-x-2">
                  <input type="text" readOnly value={settings.sepayWebhookUrl || ''} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white/70 font-mono text-sm" />
                  <button onClick={() => { navigator.clipboard.writeText(settings.sepayWebhookUrl || ''); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }} className="px-4 py-2 bg-surface border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                    {copiedUrl ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-white" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Webhook Secret</label>
                {generatedSecret ? (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                    <p className="text-green-400 text-sm font-bold mb-2">Store this secret securely. It will not be shown again.</p>
                    <div className="flex space-x-2">
                      <input type="text" readOnly value={generatedSecret} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm" />
                      <button onClick={() => { navigator.clipboard.writeText(generatedSecret); setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); }} className="px-4 py-2 bg-surface border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                        {copiedSecret ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-white" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-lg mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${settings.sepayWebhookConfigured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        <Key size={18} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{settings.sepayWebhookConfigured ? 'Configured' : 'Not configured'}</p>
                        <p className="text-text-muted text-xs">A secret is required to verify SePay payments</p>
                      </div>
                    </div>
                    <button onClick={handleGenerateSecret} type="button" className="px-4 py-2 bg-surface border border-white/10 rounded-lg text-white text-sm hover:bg-white/5 transition-colors">
                      {settings.sepayWebhookConfigured ? 'Rotate Secret' : 'Generate Secret'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface/30 border border-white/5 rounded-xl backdrop-blur-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Donation Page Rules</h2>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="form-checkbox text-blue-500 rounded border-white/10 bg-surface w-5 h-5" />
                <span className="text-white font-medium">Enable Donations</span>
              </label>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Minimum Amount (VND)</label>
                <input type="number" defaultValue="10000" className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Preset Amounts (Comma separated)</label>
                <input type="text" defaultValue="20000, 50000, 100000, 200000" className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              
              <div className="flex space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="form-checkbox text-blue-500 rounded border-white/10 bg-surface" />
                  <span className="text-text-muted text-sm">Allow Messages</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="form-checkbox text-blue-500 rounded border-white/10 bg-surface" />
                  <span className="text-text-muted text-sm">Allow Anonymous</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 rounded-lg text-white font-bold transition-all shadow-lg shadow-purple-500/20">
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

        </div>

        <div className="space-y-6">
          <div className="bg-surface/30 border border-white/5 rounded-xl backdrop-blur-sm p-6">
            <h2 className="text-xl font-bold text-white mb-4">Donation Alerts</h2>
            <p className="text-text-muted text-sm mb-6">
              When a donation is paid, it will trigger an alert via your configured alert presets. You can map the "donation" trigger in your Alerts Settings.
            </p>
            <button 
              onClick={handleTestAlert}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-surface/50 hover:bg-surface border border-white/10 rounded-lg text-white font-medium transition-colors"
            >
              <BellRing size={18} className={testStatus === 'Testing...' ? 'animate-bounce text-blue-400' : (testStatus === 'Success!' ? 'text-green-400' : 'text-blue-400')} />
              <span>{testStatus || 'Send Test Alert'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
