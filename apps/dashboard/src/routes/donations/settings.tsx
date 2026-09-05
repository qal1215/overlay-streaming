import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Save, BellRing, CheckCircle2 } from 'lucide-react'
import { API_URL } from '../../api/client'

export const Route = createFileRoute('/donations/settings')({
  component: DonationSettingsPage,
})

function DonationSettingsPage() {
  const [testStatus, setTestStatus] = useState<string | null>(null)

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
                  <input type="text" defaultValue="970422" className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Account Number</label>
                  <input type="password" defaultValue="123456789" className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Account Name</label>
                <input type="text" defaultValue="QAL1215" className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
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
            <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white font-bold transition-all shadow-lg shadow-purple-500/20">
              <Save size={20} />
              <span>Save Changes</span>
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
