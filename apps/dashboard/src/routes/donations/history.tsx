import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { API_URL } from '../../api/client'

export const Route = createFileRoute('/donations/history')({
  component: DonationHistoryPage,
})

function DonationHistoryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const creatorId = 'qal1215'; // Hardcoded for MVP

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/admin/creator/${creatorId}/donations?status=${statusFilter}&limit=100`, {
      headers: {
        'Authorization': 'default_admin_secret_dev'
      }
    })
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateString));
  };

  const filteredDonations = data?.donations?.filter((d: any) => 
    (d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     d.message?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-text-muted text-sm uppercase tracking-wider bg-black/20">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Donor & Message</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Details</th>
                <th className="p-4 font-medium">Status & Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && <tr><td colSpan={5} className="p-8 text-center text-text-muted">Loading...</td></tr>}
              {!loading && filteredDonations.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-text-muted">No donations found.</td></tr>
              )}
              {!loading && filteredDonations.map((d: any) => (
                <tr key={d.id} className={`hover:bg-white/5 transition-colors ${d.status === 'EXPIRED' ? 'opacity-60' : ''}`}>
                  <td className="p-4 text-text-muted text-sm">{formatDate(d.created_at)}</td>
                  <td className="p-4">
                    <div className="text-white font-medium">{d.donor_name || 'Anonymous'}</div>
                    <div className="text-text-muted text-sm truncate max-w-xs">{d.message || '-'}</div>
                  </td>
                  <td className="p-4 text-white font-medium">{formatCurrency(d.amount)}</td>
                  <td className="p-4 text-sm text-text-muted">
                    <div><span className="font-medium text-white/50">Ref:</span> {d.payment_reference}</div>
                    {d.provider_transaction_id && <div><span className="font-medium text-white/50">Txn:</span> {d.provider_transaction_id}</div>}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2 items-start">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        d.status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                        d.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {d.status}
                      </span>
                      {d.status === 'PAID' && (
                        <span className={`px-2 py-1 text-[10px] font-medium rounded ${
                          d.processed_status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
                          d.processed_status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          Alert: {d.processed_status || 'PENDING'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
