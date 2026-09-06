import { createRootRoute, Link, Outlet, Navigate, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, Layers, Bell, Volume2, Image, Settings, Tv, LogOut, Heart } from 'lucide-react'
import { useDevAdminAuth } from '../hooks/useAuth'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { isAuthenticated, logout } = useDevAdminAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isPublicRoute = pathname === '/login' || pathname.startsWith('/donate');
  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/login" />;
  }

  if (pathname === '/login' || pathname.startsWith('/donate')) {
    return (
      <div className="flex h-screen bg-background text-text overflow-hidden relative">
        <div className="absolute top-0 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-background -z-10 pointer-events-none" />
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-text">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-surface/50 backdrop-blur-xl flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            QAL Overlay
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-1">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Overview" />
            <NavItem to="/donations" icon={<Heart size={20} />} label="Donations" />
            <NavItem to="/overlays" icon={<Layers size={20} />} label="Overlays" />
            <NavItem to="/alerts" icon={<Bell size={20} />} label="Alerts" />
            <NavItem to="/audio" icon={<Volume2 size={20} />} label="Audio" />
            <NavItem to="/assets" icon={<Image size={20} />} label="Assets" />
            <NavItem to="/obs" icon={<Tv size={20} />} label="OBS Setup" />
          </div>
          
          <div className="px-4 mt-8 space-y-1">
            <div className="text-xs font-semibold text-text-muted mb-2 px-3 uppercase tracking-wider">System</div>
            <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-white/5 transition-colors text-left"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Abstract Background */}
        <div className="absolute top-0 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-background -z-10 pointer-events-none" />
        
        <header className="h-16 border-b border-white/10 bg-surface/30 backdrop-blur-md flex items-center px-8 z-10">
          <div className="flex items-center text-sm text-text-muted">
            <span>Dashboard</span>
            <span className="mx-2">/</span>
            <span className="text-text">Active Page</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 z-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-text hover:bg-white/5 transition-colors"
      activeProps={{
        className: 'bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary',
      }}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  )
}
