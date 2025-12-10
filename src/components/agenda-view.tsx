import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import type { Cita, Paciente, User } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { Plus, Calendar as CalendarIcon, Clock, User, X, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type PeriodoVista = 'dia' | 'semana' | 'mes';

export function AgendaView() {
  const { user } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoVista>('dia');
  const [showModal, setShowModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  useEffect(() => {
    loadData();
  }, [periodo]);

  const getDateRange = () => {
    const hoy = new Date();
    const fin = new Date(hoy);

    if (periodo === 'dia') {
      // Solo hoy
      return { inicio: hoy.toISOString().split('T')[0], fin: hoy.toISOString().split('T')[0] };
    } else if (periodo === 'semana') {
      // Desde hoy hasta 7 días adelante
      fin.setDate(fin.getDate() + 7);
      return { inicio: hoy.toISOString().split('T')[0], fin: fin.toISOString().split('T')[0] };
    } else {
      // Desde hoy hasta fin de mes
      fin.setMonth(fin.getMonth() + 1);
      return { inicio: hoy.toISOString().split('T')[0], fin: fin.toISOString().split('T')[0] };
    }
  };

  const loadData = async () => {
    try {
      const [citasRes, pacientesRes, medicosRes] = await Promise.all([
        apiClient.getCitas({}),
        apiClient.getPacientes(),
        (apiClient as any).getMedicos(),
      ]);
      
      // Filtrar citas según el período seleccionado
      const { inicio, fin } = getDateRange();
      const citasFiltradas = citasRes.data.filter((cita: Cita) => {
        return cita.fecha >= inicio && cita.fecha <= fin;
      });
      
      setCitas(citasFiltradas);
      setPacientes(pacientesRes.data);
      setMedicos(medicosRes.data || medicosRes || []);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

//Validacion horario citas

const handleSaveCita = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const fecha = formData.get('fecha') as string;

  // Validar fecha: no antes de hoy, no más de 1 año en el futuro
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaSeleccionada = new Date(fecha);
  const unAnoAdelante = new Date();
  unAnoAdelante.setFullYear(unAnoAdelante.getFullYear() + 1);

  if (fechaSeleccionada < hoy) {
    toast.error('La fecha de la cita no puede ser anterior a hoy');
    return;
  }

  if (fechaSeleccionada > unAnoAdelante) {
    toast.error('La fecha de la cita no puede ser mayor a 1 año desde hoy');
    return;
  }

  // Obtener datos del form
  const paciente_id = formData.get('paciente_id') as string;
  const medico_id = user?.rol === 'MEDICO' ? user.id : (formData.get('medico_id') as string);
  const hora_inicio = formData.get('hora_inicio') as string;
  const hora_fin = formData.get('hora_fin') as string;
  const tipo_consulta = formData.get('tipo_consulta') as string;
  const motivo_categoria = formData.get('motivo_categoria') as string;

  // Validaciones básicas de presencia
  if (!paciente_id) {
    toast.error('Seleccione un paciente');
    return;
  }
  if (!medico_id) {
    toast.error('Seleccione un médico');
    return;
  }
  if (!hora_inicio || !hora_fin) {
    toast.error('Seleccione hora de inicio y hora de término');
    return;
  }

  // Helper: convierte "HH:MM" -> minutos desde medianoche (number)
  const timeToMinutes = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
  };

  const inicioMin = timeToMinutes(hora_inicio);
  const finMin = timeToMinutes(hora_fin);

  // 1) Validar que inicio < fin
  if (inicioMin >= finMin) {
    toast.error('La hora de inicio debe ser anterior a la hora de término');
    return;
  }

  // 2) Validar traslapes con otras citas del mismo médico en la misma fecha (mejorado)
try {
  // convierte "HH:MM" -> minutos desde medianoche
  const timeToMinutes = (t: string) => {
    if (!t) return NaN;
    const parts = t.trim().split(':').map(Number);
    if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return NaN;
    return parts[0] * 60 + parts[1];
  };

  // Buffer en minutos entre citas (cambiar a 0 para sin buffer)
  const BUFFER_MINUTES = 0; // p.ej. 10 si quieres dejar 10 minutos de margen

  const inicioMin = timeToMinutes(hora_inicio);
  const finMin = timeToMinutes(hora_fin);

  if (Number.isNaN(inicioMin) || Number.isNaN(finMin)) {
    toast.error('Formato de hora inválido');
    return;
  }

  // Trae todas las citas del médico para la fecha (mock-api-client soporta params)
  const citasResp = await apiClient.getCitas({ medico_id, fecha });
  const citasDelMedico: Cita[] = citasResp.data || [];

  // Considerar solo citas que ocupan agenda (descartar canceladas/completadas)
  const citasActivas = citasDelMedico.filter(c => c.estado !== 'CANCELADA' && c.estado !== 'COMPLETADA');

  // Excluir la propia cita si estamos editando
  const otrasCitas = citasActivas.filter(c => (selectedCita ? c.id !== selectedCita.id : true));

  // comprobar traslapes con buffer:
  // nueva.inicio < (existente.fin + buffer) && nueva.fin > (existente.inicio - buffer)
  const existeTraslape = otrasCitas.some((cita) => {
    const cInicio = timeToMinutes(cita.hora_inicio);
    const cFin = timeToMinutes(cita.hora_fin);
    if (Number.isNaN(cInicio) || Number.isNaN(cFin)) return false; // skip malformed
    return (inicioMin < (cFin + BUFFER_MINUTES)) && (finMin > (cInicio - BUFFER_MINUTES));
  });

  if (existeTraslape) {
    toast.error('El médico ya tiene una cita en ese horario (traslape). Elija otro horario.');
    return;
  }
} catch (err) {
  console.error('Error validando traslapes:', err);
  toast.error('Error validando disponibilidad del médico');
  return;
}


  // Todo ok — construir payload y guardar
  const data = {
    paciente_id,
    medico_id,
    fecha,
    hora_inicio,
    hora_fin,
    tipo_consulta,
    motivo_categoria,
  };

  try {
    if (selectedCita) {
      await apiClient.updateCita(selectedCita.id, data);
      toast.success('Cita actualizada correctamente');
    } else {
      await apiClient.createCita(data as any);
      toast.success('Cita creada correctamente');
    }
    setShowModal(false);
    setSelectedCita(null);
    loadData();
  } catch (error) {
    console.error('Error al guardar cita:', error);
    toast.error('Error al guardar cita');
  }
};


  const getEstadoColor = (estado: string) => {
    const colors = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      CONFIRMADA: 'bg-green-100 text-green-800',
      EN_ATENCION: 'bg-blue-100 text-blue-800',
      COMPLETADA: 'bg-gray-100 text-gray-800',
      CANCELADA: 'bg-red-100 text-red-800',
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const horariosDisponibles = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando agenda...</div>
      </div>
    );
  }

  const citasOrdenadas = [...citas].sort((a, b) => 
    a.hora_inicio.localeCompare(b.hora_inicio)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">
            {user?.rol === 'SECRETARIA' ? 'Gestión de Agenda' : 'Mis Citas'}
          </h2>
          <p className="text-gray-600 mt-1">
            Administre las citas y la disponibilidad médica
          </p>
        </div>
        {user?.rol === 'SECRETARIA' && (
          <button
            onClick={() => {
              setSelectedCita(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Cita
          </button>
        )}
      </div>

      {/* Pestañas de período */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
        <button
          onClick={() => setPeriodo('dia')}
          className={`px-4 py-2 rounded-md transition-colors ${
            periodo === 'dia'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => setPeriodo('semana')}
          className={`px-4 py-2 rounded-md transition-colors ${
            periodo === 'semana'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => setPeriodo('mes')}
          className={`px-4 py-2 rounded-md transition-colors ${
            periodo === 'mes'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Este Mes
        </button>
        <div className="ml-auto flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {citas.length} {citas.length === 1 ? 'cita' : 'citas'} programadas
          </span>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {citasOrdenadas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay citas programadas para este período
          </div>
        ) : (
          citasOrdenadas.map((cita) => (
            <div key={cita.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span>{new Date(cita.fecha).toLocaleDateString('es-CL')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{cita.hora_inicio} - {cita.hora_fin}</span>
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
                    <span className="text-gray-500">- RUT: {cita.paciente?.rut}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-700">Tipo:</span> {cita.tipo_consulta}
                  </div>
                  
                  {user?.rol === 'SECRETARIA' && cita.medico && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="text-gray-700">Médico:</span> {cita.medico.nombre}
                    </div>
                  )}
                  
                  {cita.motivo_categoria && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="text-gray-700">Categoría:</span> {cita.motivo_categoria}
                    </div>
                  )}
                </div>

                {user?.rol === 'SECRETARIA' && (
                  <div className="flex items-center gap-2">
                    {cita.estado === 'PENDIENTE' && (
                      <button
                        onClick={() => handleConfirmarCita(cita.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                        title="Confirmar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {cita.estado !== 'CANCELADA' && cita.estado !== 'COMPLETADA' && (
                      <button
                        onClick={() => handleCancelarCita(cita.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nueva/Editar Cita */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-gray-900">
                {selectedCita ? 'Editar Cita' : 'Nueva Cita'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedCita(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCita} className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-700">Paciente</label>
                <select
                  name="paciente_id"
                  defaultValue={selectedCita?.paciente_id}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un paciente</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellido} - {p.rut}
                    </option>
                  ))}
                </select>
              </div>

              {user?.rol === 'SECRETARIA' && (
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Médico</label>
                  <select
                    name="medico_id"
                    defaultValue={selectedCita?.medico_id || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione un médico</option>
                    {medicos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm mb-1 text-gray-700">Fecha</label>
                <input
                  name="fecha"
                  type="date"
                  defaultValue={
                    selectedCita?.fecha ||
                    (() => {
                      const d = new Date();
                      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                      return d.toISOString().split("T")[0];
                    })()
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Hora Inicio</label>
                  <select
                    name="hora_inicio"
                    defaultValue={selectedCita?.hora_inicio}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {horariosDisponibles.map((hora) => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Hora Fin</label>
                  <select
                    name="hora_fin"
                    defaultValue={selectedCita?.hora_fin}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {horariosDisponibles.map((hora) => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Tipo de Consulta</label>
                <select
                  name="tipo_consulta"
                  defaultValue={selectedCita?.tipo_consulta || 'Consulta Medicina General'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Consulta Medicina General">Consulta Medicina General</option>
                  <option value="Control">Control</option>
                  <option value="Procedimiento">Procedimiento</option>
                  <option value="Urgencia">Urgencia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Categoría del Motivo</label>
                <select
                  name="motivo_categoria"
                  defaultValue={selectedCita?.motivo_categoria || 'Primera Vez'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Primera Vez">Primera Vez</option>
                  <option value="Control">Control</option>
                  <option value="Seguimiento">Seguimiento</option>
                  <option value="Urgencia">Urgencia</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCita(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {selectedCita ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}