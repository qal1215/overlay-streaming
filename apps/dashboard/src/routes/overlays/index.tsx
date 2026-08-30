import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useOverlays, useCreateOverlay, useDuplicateOverlay, useDeleteOverlay } from '../../hooks/useOverlays'
import { Plus, Edit, Copy, Trash2, LayoutTemplate } from 'lucide-react'

export const Route = createFileRoute('/overlays/')({
  component: OverlaysListPage,
})

function OverlaysListPage() {
  const { data: overlays, isLoading, isError } = useOverlays()
  const createOverlay = useCreateOverlay()
  const duplicateOverlay = useDuplicateOverlay()
  const deleteOverlay = useDeleteOverlay()
  const navigate = useNavigate()

  const handleCreate = async () => {
    const result = await createOverlay.mutateAsync({ name: 'New Overlay' })
    if (result?.id) {
      navigate({ to: `/overlays/${result.id}` })
    }
  }

  return (
    <div className="max-w-6xl space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Overlays</h2>
          <p className="text-text-muted mt-1">Manage and edit your streaming overlays.</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={createOverlay.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Plus size={18} />
          <span>{createOverlay.isPending ? 'Creating...' : 'Create Overlay'}</span>
        </button>
      </header>

      {isLoading ? (
        <div className="text-text-muted">Loading overlays...</div>
      ) : isError ? (
        <div className="text-red-400">Failed to load overlays.</div>
      ) : overlays?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/5 border-dashed rounded-2xl bg-surface/30">
          <LayoutTemplate size={48} className="text-text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No overlays found</h3>
          <p className="text-text-muted mb-6 text-center max-w-sm">You haven't created any overlays yet. Start by creating a new one to add alerts and widgets to your stream.</p>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            <span>Create Overlay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {overlays?.map((overlay) => (
            <div key={overlay.id} className="group bg-surface border border-white/5 rounded-2xl p-6 backdrop-blur-xl hover:border-primary/50 transition-colors flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold truncate pr-4" title={overlay.name}>{overlay.name}</h3>
                  <div className="px-2 py-1 bg-white/5 rounded text-xs font-medium text-text-muted whitespace-nowrap">
                    {overlay.resolution_width} × {overlay.resolution_height}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-text-muted mb-8">
                  <div className="flex justify-between">
                    <span>Components</span>
                    <span className="text-text">{overlay.components?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated</span>
                    <span className="text-text">
                      {overlay.updated_at ? new Date(overlay.updated_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 mt-auto">
                <Link
                  to="/overlays/$id"
                  params={{ id: overlay.id }}
                  className="flex flex-col items-center justify-center gap-1 py-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                  <span className="text-xs font-medium">Edit</span>
                </Link>
                <button
                  onClick={() => duplicateOverlay.mutate(overlay.id)}
                  disabled={duplicateOverlay.isPending}
                  className="flex flex-col items-center justify-center gap-1 py-2 text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Copy size={16} />
                  <span className="text-xs font-medium">Duplicate</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this overlay?')) {
                      deleteOverlay.mutate(overlay.id)
                    }
                  }}
                  disabled={deleteOverlay.isPending}
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
