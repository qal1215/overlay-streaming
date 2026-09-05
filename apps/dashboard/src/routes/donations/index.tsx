import { createFileRoute, Link } from '@tanstack/react-router'
import { DollarSign, Clock, List, Settings } from 'lucide-react'

export const Route = createFileRoute('/donations/')({
  component: DonationsDashboardPage,
})

function DonationsDashboardPage() {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Donations</h1>
          <p className="text-text-muted">Manage your donation page and payment settings.</p>
        </div>
        <div className="flex space-x-4">
          <Link 
            to="/donate/$creatorId" 
            params={{ creatorId: 'qal1215' }} // In a real app, grab from auth context
            target="_blank"
            className="px-4 py-2 bg-surface/50 hover:bg-surface border border-white/10 rounded-lg text-white font-medium transition-colors"
          >
            Open Public Page
          </Link>
          <Link 
            to="/donations/settings" 
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white font-medium transition-colors"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl bg-surface/30 border border-white/5 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-text-muted font-medium mb-1">Total Received</p>
              <h2 className="text-3xl font-bold text-white">12,450,000 ₫</h2>
            </div>
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-surface/30 border border-white/5 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-text-muted font-medium mb-1">Total Donations</p>
              <h2 className="text-3xl font-bold text-white">86</h2>
            </div>
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
              <List size={24} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-surface/30 border border-white/5 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-text-muted font-medium mb-1">This Month</p>
              <h2 className="text-3xl font-bold text-white">3,250,000 ₫</h2>
            </div>
            <div className="p-3 bg-green-500/20 text-green-400 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface/30 border border-white/5 rounded-xl backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Recent Donations</h3>
          <Link to="/donations/history" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            View All History
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-text-muted text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Donor</th>
                <th className="p-4 font-medium">Message</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-white font-medium">John</td>
                <td className="p-4 text-text-muted">GG bro</td>
                <td className="p-4 text-white font-medium">100,000 ₫</td>
                <td className="p-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">PAID</span></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-white font-medium">Anonymous</td>
                <td className="p-4 text-text-muted">Love the stream</td>
                <td className="p-4 text-white font-medium">50,000 ₫</td>
                <td className="p-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">PAID</span></td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-white font-medium">Mike</td>
                <td className="p-4 text-text-muted">Keep going</td>
                <td className="p-4 text-white font-medium">200,000 ₫</td>
                <td className="p-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">PAID</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
