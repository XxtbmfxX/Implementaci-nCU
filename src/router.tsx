import { createBrowserRouter, redirect, Navigate } from 'react-router';
import { Layout } from './components/layout';
import { LoginForm } from './components/login-form';
import { RootError } from './components/root-error';
import { DashboardView, dashboardLoader } from './components/dashboard-view';
import { AgendaView, agendaLoader } from './components/agenda-view';
import { PacientesView, pacientesLoader } from './components/pacientes-view';
import { CitasMedicoView, citasMedicoLoader } from './components/citas-medico-view';
import { MedicosView, medicosLoader } from './components/medicos-view';
import { AuditoriaView, auditoriaLoader } from './components/auditoria-view';
import { apiClient } from './lib/api-client';

// Loader para proteger rutas
const protectedLoader = async () => {
  const token = apiClient.getToken();
  if (!token) {
    return redirect('/login');
  }
  // Podríamos validar el token o cargar el usuario aquí si fuera necesario
  // para el layout, pero AuthProvider ya lo hace.
  // Sin embargo, para evitar parpadeos, podríamos esperar al usuario aquí.
  try {
    const user = await apiClient.getCurrentUser();
    return { user };
  } catch (error) {
    return redirect('/login');
  }
};

// Loader para redireccionar según rol en la raíz "/"
const rootIndexLoader = async () => {
  const token = apiClient.getToken();
  if (!token) return redirect('/login');
  
  try {
    const user = await apiClient.getCurrentUser();
    if (user.rol === 'MEDICO') return redirect('/citas-medico');
    if (user.rol === 'SECRETARIA') return redirect('/agenda');
    if (user.rol === 'GERENTE') return redirect('/dashboard');
    return null;
  } catch {
    return redirect('/login');
  }
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/',
    element: <Layout />,
    loader: protectedLoader,
    errorElement: <RootError />,
    children: [
      {
        index: true,
        loader: rootIndexLoader,
        element: <div className="p-4 text-center text-gray-500">Redirigiendo...</div>,
      },
      {
        path: 'dashboard',
        element: <DashboardView />,
        loader: dashboardLoader,
      },
      {
        path: 'agenda',
        element: <AgendaView />,
        loader: agendaLoader,
      },
      {
        path: 'pacientes',
        element: <PacientesView />,
        loader: pacientesLoader,
      },
      {
        path: 'citas-medico',
        element: <CitasMedicoView />,
        loader: citasMedicoLoader,
      },
      {
        path: 'medicos',
        element: <MedicosView />,
        loader: medicosLoader,
      },
      {
        path: 'auditoria',
        element: <AuditoriaView />,
        loader: auditoriaLoader,
      },
    ],
  },
]);
