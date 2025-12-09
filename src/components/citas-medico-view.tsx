import { useState, useEffect } from 'react';
import { apiClient, Cita } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { Calendar as CalendarIcon, Clock, User, FileText, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function CitasMedicoView() {
  const { user } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [apuntes, setApuntes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCitasDelDia();
  }, []);

  const loadCitasDelDia = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const response = await apiClient.getCitas({ fecha: hoy, medico_id: user?.id });
      const citasHoy = response.data.filter(c => 
        c.estado === 'CONFIRMADA' || c.estado === 'EN_ATENCION' || c.estado === 'PENDIENTE'
      );
      setCitas(citasHoy);
    } catch (error) {
      toast.error('Error al cargar citas del día');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarAtencion = async (citaId: string) => {
    try {
      await apiClient.updateCita(citaId, { estado: 'EN_ATENCION' });
      setCitas(prev => prev.map(c => 
        c.id === citaId ? { ...c, estado: 'EN_ATENCION' as const } : c
      ));
      toast.success('Atención iniciada');
    } catch (error) {
      toast.error('Error al iniciar atención');
    }
  };

  const handleGuardarApuntes = (citaId: string, texto: string) => {
    setApuntes(prev => ({ ...prev, [citaId]: texto }));
    toast.success('Apuntes guardados localmente');
  };

  const handleCompletarAtencion = async (cita: Cita) => {
    const apuntesCita = apuntes[cita.id];
    
    if (!apuntesCita || apuntesCita.trim().length === 0) {
      toast.error('Debe agregar apuntes antes de completar la atención');
      return;
    }

    try {
      // Crear ficha clínica con los apuntes
      await apiClient.createFicha({
        paciente_id: cita.paciente_id,
        medico_id: user?.id || '',
        fecha: new Date().toISOString().split('T')[0],
        anamnesis: apuntesCita,
        examen_fisico: '',
        diagnostico: '',
        tratamiento: '',
        observaciones: 'Apuntes registrados durante la atención',
      });

      // Actualizar estado de la cita
      await apiClient.updateCita(cita.id, { estado: 'COMPLETADA' });
      
      setCitas(prev => prev.map(c => 
        c.id === cita.id ? { ...c, estado: 'COMPLETADA' as const } : c
      ));
      
      setApuntes(prev => {
        const newApuntes = { ...prev };
        delete newApuntes[cita.id];
        return newApuntes;
      });
      
      setSelectedCita(null);
      toast.success('Atención completada y ficha clínica creada');
    } catch (error) {
      toast.error('Error al completar atención');
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      CONFIRMADA: 'bg-green-100 text-green-800',
      EN_ATENCION: 'bg-blue-100 text-blue-800',
      COMPLETADA: 'bg-gray-100 text-gray-800',
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando citas...</div>
      </div>
    );
  }

  const citasOrdenadas = [...citas].sort((a, b) => 
    a.hora_inicio.localeCompare(b.hora_inicio)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Citas del Día</h2>
        <p className="text-gray-600 mt-1">
          Gestione sus atenciones y registre apuntes clínicos
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total del día</p>
          <p className="text-2xl text-gray-900 mt-1">{citas.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">En atención</p>
          <p className="text-2xl text-blue-900 mt-1">
            {citas.filter(c => c.estado === 'EN_ATENCION').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Completadas</p>
          <p className="text-2xl text-green-900 mt-1">
            {citas.filter(c => c.estado === 'COMPLETADA').length}
          </p>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna izquierda: Lista de citas */}
        <div className="space-y-4">
          <h3 className="text-gray-900">Agenda</h3>
          {citasOrdenadas.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              No hay citas programadas para hoy
            </div>
          ) : (
            <div className="space-y-3">
              {citasOrdenadas.map((cita) => (
                <div
                  key={cita.id}
                  onClick={() => setSelectedCita(cita)}
                  className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCita?.id === cita.id
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {cita.hora_inicio} - {cita.hora_fin}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getEstadoColor(cita.estado)}`}>
                      {cita.estado.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {cita.paciente?.nombre} {cita.paciente?.apellido}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {cita.tipo_consulta}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna derecha: Apuntes */}
        <div className="space-y-4">
          {selectedCita ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-gray-900">Apuntes de Atención</h3>
                {selectedCita.estado === 'CONFIRMADA' && (
                  <button
                    onClick={() => handleIniciarAtencion(selectedCita.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Iniciar Atención
                  </button>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h4 className="text-sm text-gray-700 mb-2">Información del Paciente</h4>
                  <p className="text-gray-900">
                    {selectedCita.paciente?.nombre} {selectedCita.paciente?.apellido}
                  </p>
                  <p className="text-sm text-gray-600">RUT: {selectedCita.paciente?.rut}</p>
                  <p className="text-sm text-gray-600">
                    Previsión: {selectedCita.paciente?.prevision}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="text-gray-700">Tipo:</span> {selectedCita.tipo_consulta}
                  </p>
                  {selectedCita.motivo_categoria && (
                    <p className="text-sm text-gray-600">
                      <span className="text-gray-700">Categoría:</span>{' '}
                      {selectedCita.motivo_categoria}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Apuntes Clínicos
                  </label>
                  <textarea
                    value={apuntes[selectedCita.id] || ''}
                    onChange={(e) => setApuntes(prev => ({ 
                      ...prev, 
                      [selectedCita.id]: e.target.value 
                    }))}
                    placeholder="Registre aquí sus observaciones, síntomas, diagnóstico preliminar, tratamiento indicado, etc."
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={selectedCita.estado === 'COMPLETADA'}
                  />
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleGuardarApuntes(selectedCita.id, apuntes[selectedCita.id] || '')}
                      disabled={selectedCita.estado === 'COMPLETADA'}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      Guardar Apuntes
                    </button>
                    
                    {selectedCita.estado === 'EN_ATENCION' && (
                      <button
                        onClick={() => handleCompletarAtencion(selectedCita)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Completar Atención
                      </button>
                    )}
                  </div>

                  {selectedCita.estado === 'COMPLETADA' && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Atención completada - Ficha clínica registrada
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Seleccione una cita para registrar apuntes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
