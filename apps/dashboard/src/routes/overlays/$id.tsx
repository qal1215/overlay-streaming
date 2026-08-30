import { createFileRoute, Link } from '@tanstack/react-router'
import { useOverlay, useUpdateOverlay } from '../../hooks/useOverlays'
import { ArrowLeft, Save, Layout, Type, Image as ImageIcon, Bell, Layers, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Rnd } from 'react-rnd'
import type { OverlayComponent } from '@overlay/schema'

export const Route = createFileRoute('/overlays/$id')({
  component: OverlayEditorPage,
})

function OverlayEditorPage() {
  const { id } = Route.useParams()
  const { data: overlay, isLoading } = useOverlay(id)
  const updateOverlay = useUpdateOverlay()
  
  const [name, setName] = useState('')
  const [components, setComponents] = useState<OverlayComponent[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // A ref for the canvas wrapper to calculate scale if we wanted responsive scaling,
  // but for now we just rely on CSS transform scale(0.5)
  const SCALE = 0.5; 

  useEffect(() => {
    if (overlay) {
      setName(overlay.name)
      // Ensure components is an array (might be null if just created without components)
      setComponents(overlay.components || [])
    }
  }, [overlay])

  if (isLoading) return <div className="p-8">Loading editor...</div>
  if (!overlay) return <div className="p-8">Overlay not found</div>

  const handleSave = () => {
    updateOverlay.mutate({ id, data: { name, components } })
  }

  const handleAddComponent = (type: OverlayComponent['type']) => {
    const newComp: OverlayComponent = {
      id: crypto.randomUUID(),
      type,
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      zIndex: components.length,
      config: type === 'text' ? { text: 'New Text', fontSize: 48, color: '#ffffff' } 
             : type === 'image' ? { url: 'https://placehold.co/600x400' }
             : type === 'alert' ? { text: 'Alert Area' } : {}
    }
    setComponents([...components, newComp])
    setSelectedId(newComp.id)
  }

  const updateComponent = (compId: string, updates: Partial<OverlayComponent>) => {
    setComponents(prev => prev.map(c => c.id === compId ? { ...c, ...updates } : c))
  }

  const updateComponentConfig = (compId: string, configUpdates: any) => {
    setComponents(prev => prev.map(c => c.id === compId ? { ...c, config: { ...c.config, ...configUpdates } } : c))
  }

  const removeComponent = (compId: string) => {
    setComponents(prev => prev.filter(c => c.id !== compId))
    if (selectedId === compId) setSelectedId(null)
  }

  const moveZIndex = (compId: string, direction: 'up' | 'down') => {
    const idx = components.findIndex(c => c.id === compId)
    if (idx === -1) return
    const newComps = [...components]
    if (direction === 'up' && idx < newComps.length - 1) {
      // Swap with next
      const temp = newComps[idx].zIndex
      newComps[idx].zIndex = newComps[idx + 1].zIndex
      newComps[idx + 1].zIndex = temp
      // Also swap array positions for predictable rendering order
      const item = newComps.splice(idx, 1)[0]
      newComps.splice(idx + 1, 0, item)
    } else if (direction === 'down' && idx > 0) {
      // Swap with prev
      const temp = newComps[idx].zIndex
      newComps[idx].zIndex = newComps[idx - 1].zIndex
      newComps[idx - 1].zIndex = temp
      const item = newComps.splice(idx, 1)[0]
      newComps.splice(idx - 1, 0, item)
    }
    setComponents(newComps)
  }

  const selectedComponent = components.find(c => c.id === selectedId)

  return (
    <div className="h-full flex flex-col -m-8">
      {/* Editor Topbar */}
      <header className="h-14 border-b border-white/10 bg-surface flex items-center justify-between px-4 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <Link to="/overlays" className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-lg font-bold text-white px-2 py-1 rounded hover:bg-white/5 focus:bg-white/5 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-xs text-text-muted mr-4 bg-black/20 px-2 py-1 rounded">
            {overlay.resolution_width} × {overlay.resolution_height}
          </div>
          <button
            onClick={handleSave}
            disabled={updateOverlay.isPending}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {updateOverlay.isPending ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </header>

      {/* Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Component Palette & Layers */}
        <aside className="w-64 border-r border-white/10 bg-surface/80 p-4 overflow-y-auto flex flex-col z-10 backdrop-blur-md">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Add Component</h3>
          <div className="grid grid-cols-2 gap-2 mb-8">
            <button onClick={() => handleAddComponent('alert')} className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group">
              <Bell size={20} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Alerts</span>
            </button>
            <button onClick={() => handleAddComponent('text')} className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group">
              <Type size={20} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Text</span>
            </button>
            <button onClick={() => handleAddComponent('image')} className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group">
              <ImageIcon size={20} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Image</span>
            </button>
          </div>

          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers size={14} /> Layers
          </h3>
          <div className="flex-1 overflow-y-auto space-y-1">
            {[...components].reverse().map(comp => (
              <button
                key={comp.id}
                onClick={() => setSelectedId(comp.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedId === comp.id ? 'bg-primary/20 text-white' : 'hover:bg-white/5 text-text-muted'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {comp.type === 'alert' && <Bell size={14} />}
                  {comp.type === 'text' && <Type size={14} />}
                  {comp.type === 'image' && <ImageIcon size={14} />}
                  <span className="truncate capitalize">{comp.type}</span>
                </div>
              </button>
            ))}
            {components.length === 0 && (
              <div className="text-xs text-text-muted italic text-center py-4">No components added.</div>
            )}
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-black relative flex items-center justify-center overflow-auto"
              onClick={() => setSelectedId(null)}>
          
          <div 
            className="bg-black/40 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-sm"
            style={{ 
              width: `${overlay.resolution_width}px`, 
              height: `${overlay.resolution_height}px`,
              transform: `scale(${SCALE})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Grid Pattern Background for Canvas */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
            
            {/* Render Components */}
            {components.map(comp => (
              <Rnd
                key={comp.id}
                scale={SCALE}
                bounds="parent"
                position={{ x: comp.position.x, y: comp.position.y }}
                size={{ width: comp.size.width, height: comp.size.height }}
                onDragStop={(e, d) => {
                  updateComponent(comp.id, { position: { x: Math.round(d.x), y: Math.round(d.y) } })
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateComponent(comp.id, {
                    size: { width: parseInt(ref.style.width), height: parseInt(ref.style.height) },
                    position: { x: Math.round(position.x), y: Math.round(position.y) }
                  })
                }}
                onClick={(e: any) => {
                  e.stopPropagation();
                  setSelectedId(comp.id);
                }}
                style={{ zIndex: comp.zIndex }}
                className={`${selectedId === comp.id ? 'ring-2 ring-primary border-transparent' : 'border border-dashed border-white/20 hover:border-white/50'} transition-colors cursor-move`}
              >
                {/* Visual Representation based on type */}
                <div className="w-full h-full relative group">
                  {comp.type === 'alert' && (
                    <div className="w-full h-full bg-emerald-500/20 flex flex-col items-center justify-center border border-emerald-500/50">
                      <Bell size={32} className="text-emerald-400 mb-2 opacity-50" />
                      <span className="text-emerald-400 font-bold uppercase tracking-wider text-xl">{comp.config.text as string || 'Alert Area'}</span>
                    </div>
                  )}
                  {comp.type === 'text' && (
                    <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden text-center"
                         style={{ color: comp.config.color as string, fontSize: `${comp.config.fontSize}px` }}>
                      {(comp.config.text as string) || 'Double click to edit'}
                    </div>
                  )}
                  {comp.type === 'image' && (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center overflow-hidden">
                       <img src={comp.config.url as string} alt="Overlay component" className="w-full h-full object-contain pointer-events-none" />
                    </div>
                  )}
                </div>
              </Rnd>
            ))}
          </div>
        </main>
        
        {/* Right Sidebar - Properties */}
        <aside className="w-80 border-l border-white/10 bg-surface/80 p-5 overflow-y-auto flex flex-col z-10 backdrop-blur-md">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-6">Properties</h3>
          
          {selectedComponent ? (
            <div className="space-y-6">
              {/* Type Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="uppercase text-sm font-bold text-white tracking-widest">{selectedComponent.type}</span>
                </div>
                <div className="flex gap-1">
                   <button onClick={() => moveZIndex(selectedComponent.id, 'up')} className="p-1.5 hover:bg-white/10 rounded text-text-muted hover:text-white" title="Bring Forward">
                     <ArrowUp size={14} />
                   </button>
                   <button onClick={() => moveZIndex(selectedComponent.id, 'down')} className="p-1.5 hover:bg-white/10 rounded text-text-muted hover:text-white" title="Send Backward">
                     <ArrowDown size={14} />
                   </button>
                   <button onClick={() => removeComponent(selectedComponent.id)} className="p-1.5 hover:bg-red-500/20 rounded text-red-400" title="Delete">
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>

              {/* Transform */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-text-muted uppercase">Transform</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-text-muted absolute ml-2 mt-2">X</span>
                    <input type="number" value={selectedComponent.position.x} 
                           onChange={e => updateComponent(selectedComponent.id, { position: { ...selectedComponent.position, x: parseInt(e.target.value) }})}
                           className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted absolute ml-2 mt-2">Y</span>
                    <input type="number" value={selectedComponent.position.y} 
                           onChange={e => updateComponent(selectedComponent.id, { position: { ...selectedComponent.position, y: parseInt(e.target.value) }})}
                           className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted absolute ml-2 mt-2">W</span>
                    <input type="number" value={selectedComponent.size.width} 
                           onChange={e => updateComponent(selectedComponent.id, { size: { ...selectedComponent.size, width: parseInt(e.target.value) }})}
                           className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted absolute ml-2 mt-2">H</span>
                    <input type="number" value={selectedComponent.size.height} 
                           onChange={e => updateComponent(selectedComponent.id, { size: { ...selectedComponent.size, height: parseInt(e.target.value) }})}
                           className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white" />
                  </div>
                </div>
              </div>

              {/* Specific Configs */}
              {selectedComponent.type === 'text' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-muted uppercase">Text Content</label>
                    <textarea 
                      value={selectedComponent.config.text as string} 
                      onChange={e => updateComponentConfig(selectedComponent.id, { text: e.target.value })}
                      className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-muted uppercase">Font Size</label>
                    <input 
                      type="number" 
                      value={selectedComponent.config.fontSize as number} 
                      onChange={e => updateComponentConfig(selectedComponent.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-muted uppercase">Color</label>
                    <input 
                      type="color" 
                      value={selectedComponent.config.color as string} 
                      onChange={e => updateComponentConfig(selectedComponent.id, { color: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                  </div>
                </div>
              )}

              {selectedComponent.type === 'image' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase">Image URL</label>
                  <input 
                    type="text" 
                    value={selectedComponent.config.url as string} 
                    onChange={e => updateComponentConfig(selectedComponent.id, { url: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="https://..."
                  />
                </div>
              )}
              
            </div>
          ) : (
            <div className="text-sm text-text-muted italic">Select a component on the canvas to view and edit its properties.</div>
          )}
        </aside>
      </div>
    </div>
  )
}
