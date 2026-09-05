import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/donations/history')({
  component: DonationHistoryPage,
})

function DonationHistoryPage() {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Donation History</h1>
        <p className="text-text-muted">A complete record of all your received donations.</p>
      </div>

      <div className="bg-surface/30 border border-white/5 rounded-xl backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-white/5 flex gap-4">
          <input 
            type="text" 
            placeholder="Search donor or message..." 
            className="flex-1 bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <select className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <option>All Statuses</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Expired</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-text-muted text-sm uppercase tracking-wider bg-black/20">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Donor</th>
                <th className="p-4 font-medium">Message</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-text-muted">Sep 5, 2026</td>
                <td className="p-4 text-white font-medium">John</td>
                <td className="p-4 text-text-muted">GG</td>
                <td className="p-4 text-white font-medium">100,000 ₫</td>
                <td className="p-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">PAID</span></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-text-muted">Sep 5, 2026</td>
                <td className="p-4 text-white font-medium">Anonymous</td>
                <td className="p-4 text-text-muted">❤️</td>
                <td className="p-4 text-white font-medium">50,000 ₫</td>
                <td className="p-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">PAID</span></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-text-muted">Sep 4, 2026</td>
                <td className="p-4 text-white font-medium">Mike</td>
                <td className="p-4 text-text-muted">Nice!</td>
                <td className="p-4 text-white font-medium">200,000 ₫</td>
                <td className="p-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">PAID</span></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors opacity-60">
                <td className="p-4 text-text-muted">Sep 4, 2026</td>
                <td className="p-4 text-white font-medium">Spammer</td>
                <td className="p-4 text-text-muted">test test test</td>
                <td className="p-4 text-white font-medium">10,000 ₫</td>
                <td className="p-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">EXPIRED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
