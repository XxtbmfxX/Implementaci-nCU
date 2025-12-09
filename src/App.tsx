import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth-context';
import { LoginForm } from './components/login-form';
import { Layout } from './components/layout';
import { PacientesView } from './components/pacientes-view';
import { AgendaView } from './components/agenda-view';
import { DashboardView } from './components/dashboard-view';
import { AuditoriaView } from './components/auditoria-view';
import { CitasMedicoView } from './components/citas-medico-view';
import { MedicosView } from './components/medicos-view';
import { Toaster } from 'sonner@2.0.3';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('');

  // Set default view based on role
  if (user && !currentView) {
    if (user.rol === 'MEDICO') {
      setCurrentView('citas-medico');
    } else if (user.rol === 'SECRETARIA') {
      setCurrentView('agenda');
    } else if (user.rol === 'GERENTE') {
      setCurrentView('dashboard');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'pacientes':
        return <PacientesView />;
      case 'agenda':
      case 'citas':
        return <AgendaView />;
      case 'dashboard':
        return <DashboardView />;
      case 'auditoria':
        return <AuditoriaView />;
      case 'citas-medico':
        return <CitasMedicoView />;
      case 'medicos':
        return <MedicosView />;
      default:
        return <PacientesView />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <AppContent />
    </AuthProvider>
  );
}