import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { API_URL } from '../../../api/client'
import { Heart, Loader2, Copy, CheckCircle2, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/donate/$creatorId/')({
  component: PublicDonationPage,
})

function PublicDonationPage() {
  const { creatorId } = Route.useParams()
  const navigate = Route.useNavigate()
  const [pageInfo, setPageInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [amount, setAmount] = useState<number>(0)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  
  useEffect(() => {
    fetch(`${API_URL}/public/creators/${creatorId}/donation-page`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setPageInfo(data)
        setAmount(data.donation.minAmount)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [creatorId])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/public/creators/${creatorId}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          donorName: name || undefined,
          message: message || undefined
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Redirect to the new payment polling route
      navigate({ to: `/donate/$creatorId/payment/$donationId`, params: { creatorId, donationId: data.id } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !pageInfo) return <div className="min-h-screen bg-background flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500 w-12 h-12" /></div>
  
  if (error && !pageInfo) return <div className="min-h-screen bg-background flex items-center justify-center text-red-500">{error}</div>

  // IDLE State - Donation Form
  return (
    <div className="min-h-screen bg-background py-12 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md mx-auto relative z-10">
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-4 p-1 shadow-xl shadow-purple-500/20">
            <div className="w-full h-full rounded-full bg-surface overflow-hidden flex items-center justify-center">
              {pageInfo.creator.avatarUrl ? (
                <img src={pageInfo.creator.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">{pageInfo.creator.displayName.charAt(0)}</span>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">{pageInfo.creator.displayName}</h1>
          <p className="text-blue-400 font-medium mt-1">Support the stream</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-muted mb-3">Choose Amount</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {pageInfo.donation.presetAmounts.map((preset: number) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`py-3 rounded-xl font-bold transition-all border ${
                    amount === preset 
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                      : 'bg-white/5 border-white/5 text-white hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {preset.toLocaleString('vi-VN')}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                min={pageInfo.donation.minAmount}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 pl-12 text-2xl font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">₫</div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={pageInfo.donation.allowAnonymous ? "Anonymous" : "Your Name"}
                required={!pageInfo.donation.allowAnonymous}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {pageInfo.donation.allowMessage && (
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Optional message for the creator"
                  rows={3}
                  maxLength={255}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || amount < pageInfo.donation.minAmount}
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Heart size={20} className="fill-white" />}
            <span>Support {pageInfo.creator.displayName}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
