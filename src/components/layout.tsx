import { ReactNode, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  BarChart3,
  Shield,
  Stethoscope,
  ClipboardList
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const navigation = [
    ...(user.rol === 'MEDICO' ? [
      { name: 'Citas del Día', icon: ClipboardList, view: 'citas-medico', roles: ['MEDICO'] },
      { name: 'Agenda General', icon: Calendar, view: 'citas', roles: ['MEDICO'] },
      { name: 'Pacientes', icon: Users, view: 'pacientes', roles: ['MEDICO'] },
    ] : []),
    ...(user.rol === 'SECRETARIA' ? [
      { name: 'Agenda', icon: Calendar, view: 'agenda', roles: ['SECRETARIA'] },
      { name: 'Pacientes', icon: Users, view: 'pacientes', roles: ['SECRETARIA'] },
    ] : []),
    ...(user.rol === 'GERENTE' ? [
      { name: 'Dashboard', icon: BarChart3, view: 'dashboard', roles: ['GERENTE'] },
      { name: 'Médicos', icon: Stethoscope, view: 'medicos', roles: ['GERENTE'] },
      { name: 'Auditoría', icon: Shield, view: 'auditoria', roles: ['GERENTE'] },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-gray-900">Gestión Clínica</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onViewChange(item.view);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="mb-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-900">{user.nombre}</p>
              <p className="text-xs text-gray-500">{user.rol}</p>
              {user.especialidad && (
                <p className="text-xs text-gray-500 mt-1">{user.especialidad}</p>
              )}
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('es-CL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}