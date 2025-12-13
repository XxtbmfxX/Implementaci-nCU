import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useNavigation } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { 
  Users, 
  Calendar, 
  LogOut, 
  Menu, 
  X,
  BarChart3,
  Shield,
  Stethoscope,
  ClipboardList,
  Loader2
} from 'lucide-react';

export function Layout() {
  const { user, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const navigationState = useNavigation();
  const isNavigating = navigationState.state === 'loading' || navigationState.state === 'submitting';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    ...(user.rol === 'MEDICO' ? [
      { name: 'Citas del Día', icon: ClipboardList, to: '/citas-medico' },
      { name: 'Agenda General', icon: Calendar, to: '/agenda' },
      { name: 'Pacientes', icon: Users, to: '/pacientes' },
    ] : []),
    ...(user.rol === 'SECRETARIA' ? [
      { name: 'Agenda', icon: Calendar, to: '/agenda' },
      { name: 'Pacientes', icon: Users, to: '/pacientes' },
      { name: 'Médicos', icon: Stethoscope, to: '/medicos' },
    ] : []),
    ...(user.rol === 'GERENTE' ? [
      { name: 'Dashboard', icon: BarChart3, to: '/dashboard' },
      { name: 'Médicos', icon: Stethoscope, to: '/medicos' },
      { name: 'Auditoría', icon: Shield, to: '/auditoria' },
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
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
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
              onClick={handleLogout}
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
              {isNavigating && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}