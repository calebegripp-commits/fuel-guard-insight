import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Upload,
  ShieldCheck,
  Car,
  Users,
  AlertTriangle,
  BarChart3,
  Fuel,
  Database,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Importação' },
  { to: '/status', icon: Database, label: 'Status dos Dados' },
  { to: '/auditoria', icon: ShieldCheck, label: 'Auditoria' },
  { to: '/veiculos', icon: Car, label: 'Veículos' },
  { to: '/motoristas', icon: Users, label: 'Motoristas' },
  { to: '/alertas', icon: AlertTriangle, label: 'Alertas' },
] as const;

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
          <Fuel className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground">FleetAudit</h1>
          <p className="text-[10px] text-muted-foreground">Auditoria de Frotas</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary glow-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="glass-card rounded-lg p-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-sidebar-foreground">Dados Demo</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Importe seus dados para análise real
          </p>
        </div>
      </div>
    </aside>
  );
}
