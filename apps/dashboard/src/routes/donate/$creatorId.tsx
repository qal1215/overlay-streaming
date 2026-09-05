import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { API_URL } from '../../api/client'
import { Heart, Loader2, Copy, CheckCircle2, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/donate/$creatorId')({
  component: PublicDonationPage,
})

function PublicDonationPage() {
  const { creatorId } = Route.useParams()
  const [pageInfo, setPageInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [amount, setAmount] = useState<number>(0)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  
  const [payment, setPayment] = useState<any>(null)
  const [donationStatus, setDonationStatus] = useState<string>('IDLE') // IDLE, PENDING, PAID, EXPIRED
  
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

  useEffect(() => {
    if (donationStatus !== 'PENDING' || !payment) return;
    
    // Polling logic
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/public/donations/${payment.id}`);
        const data = await res.json();
        
        if (data.status === 'PAID') {
          setDonationStatus('PAID');
          clearInterval(interval);
        } else if (data.status === 'EXPIRED') {
          setDonationStatus('EXPIRED');
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 3000); // Poll every 3 seconds
    
    // Stop polling after 30 minutes client-side max
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (donationStatus === 'PENDING') setDonationStatus('EXPIRED');
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [donationStatus, payment]);

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
      
      setPayment(data);
      setDonationStatus('PENDING');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !pageInfo) return <div className="min-h-screen bg-background flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500 w-12 h-12" /></div>
  
  if (error && !pageInfo) return <div className="min-h-screen bg-background flex items-center justify-center text-red-500">{error}</div>

  if (donationStatus === 'PAID') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface/80 border border-green-500/30 rounded-2xl p-8 backdrop-blur-xl text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Donation Sent!</h1>
            <p className="text-text-muted">Thank you for supporting {pageInfo.creator.displayName}</p>
          </div>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            {amount.toLocaleString('vi-VN')} ₫
          </div>
          <button 
            onClick={() => { setDonationStatus('IDLE'); setPayment(null); setAmount(pageInfo.donation.minAmount); setName(''); setMessage(''); }}
            className="w-full py-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all mt-4"
          >
            Donate Again
          </button>
        </div>
      </div>
    );
  }

  if (donationStatus === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface/80 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <AlertCircle size={40} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Expired</h1>
            <p className="text-text-muted">This donation request has timed out.</p>
          </div>
          <button 
            onClick={() => { setDonationStatus('IDLE'); setPayment(null); }}
            className="w-full py-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (donationStatus === 'PENDING' && payment) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-md mx-auto relative z-10">
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 text-center border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">Complete Payment</h2>
              <p className="text-text-muted mt-1 text-sm">Scan with your banking app</p>
            </div>
            
            <div className="p-8 flex justify-center bg-white">
              <img 
                src={payment.payment.qrUrl} 
                alt="VietQR Code" 
                className="w-64 h-64 object-contain"
              />
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-text-muted">Amount</span>
                <span className="text-white font-bold text-lg">{payment.amount.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-text-muted">Bank</span>
                <span className="text-white font-medium">{payment.payment.bank}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-text-muted">Account</span>
                <div className="text-right">
                  <div className="text-white font-medium">{payment.payment.accountNumber}</div>
                  <div className="text-xs text-text-muted uppercase">{payment.payment.accountName}</div>
                </div>
              </div>
              <div className="flex flex-col py-2 border-b border-white/5">
                <span className="text-text-muted mb-1 text-sm">Transfer Description (Important)</span>
                <div className="flex items-center justify-between bg-black/30 rounded-lg p-3 border border-white/5">
                  <span className="text-white font-mono text-lg font-bold tracking-wider">{payment.payment.content}</span>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors p-2" onClick={() => navigator.clipboard.writeText(payment.payment.content)}>
                    <Copy size={18} />
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-center space-x-3 text-blue-400 bg-blue-500/10 py-3 rounded-lg border border-blue-500/20">
                <Loader2 size={18} className="animate-spin" />
                <span className="font-medium">Waiting for payment...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
