import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAlerts, useDeleteAlert } from '../../features/alerts/hooks/useAlerts'
import { Plus, Edit, Trash2, BellRing } from 'lucide-react'

export const Route = createFileRoute('/alerts/')({
  component: AlertsListPage,
})

function AlertsListPage() {
  const { data: alerts, isLoading, isError } = useAlerts()
  const deleteAlert = useDeleteAlert()

  return (
    <div className="max-w-6xl space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Alerts</h2>
          <p className="text-text-muted mt-1">Manage your custom alert designs and sounds.</p>
        </div>
        <Link
          to="/alerts/presets"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          <span>Create Alert</span>
        </Link>
      </header>

      {isLoading ? (
        <div className="text-text-muted">Loading alerts...</div>
      ) : isError ? (
        <div className="text-red-400">Failed to load alerts.</div>
      ) : alerts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/5 border-dashed rounded-2xl bg-surface/30">
          <BellRing size={48} className="text-text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
          <p className="text-text-muted mb-6 text-center max-w-sm">You haven't created any custom alerts yet. Start by choosing a preset from the library.</p>
          <Link
            to="/alerts/presets"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            <span>Browse Presets</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {alerts?.map((alert) => (
            <div key={alert.id} className="group bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl hover:border-primary/50 transition-colors flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold truncate pr-4" title={alert.name}>{alert.name}</h3>
                  <div className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-bold uppercase whitespace-nowrap">
                    {alert.preset?.theme || 'Custom'}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-text-muted mb-8">
                  <div className="flex justify-between">
                    <span>Layout</span>
                    <span className="text-text capitalize">{alert.preset?.visual?.layout || 'Centered'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TTS</span>
                    <span className="text-text">{alert.preset?.tts?.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10 mt-auto">
                {/* @ts-expect-error tanstack-router dynamic paths are sometimes overly strict */}
                <Link
                  to={`/alerts/${alert.id}`}
                  className="flex flex-col items-center justify-center gap-1 py-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                  <span className="text-xs font-medium">Edit</span>
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this alert?')) {
                      deleteAlert.mutate(alert.id)
                    }
                  }}
                  disabled={deleteAlert.isPending}
                  className="flex flex-col items-center justify-center gap-1 py-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  <span className="text-xs font-medium">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
