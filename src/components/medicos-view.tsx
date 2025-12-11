import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import type { User } from '../lib/api-client';
import { Plus, Search, Edit2, X, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const SOLO_LETRAS_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const PHONE_CHILE_REGEX = /^\+56[29]\d{8}$/; // +569xxxxxxxx o +562xxxxxxxx


function formatHorario(medico: User) {
  // medico.horario puede no existir aún (por eso el any)
  const bloques: any[] = (medico as any).horario ?? [];
  if (!bloques.length) return null;

  // Agrupar por día
  const grouped: Record<number, { inicio: string; fin: string }[]> = {};
  for (const b of bloques) {
    if (typeof b?.dia !== 'number') continue;
    grouped[b.dia] = grouped[b.dia] || [];
    grouped[b.dia].push({ inicio: b.inicio, fin: b.fin });
  }

  // Construir líneas ordenadas por día (Lun..Dom)
  const lines: string[] = [];
  for (let i = 1; i <= 6; i++) { // Lunes (1) .. Sábado (6)
    if (grouped[i]?.length) {
      const ranges = grouped[i]
        .map(r => `${r.inicio}–${r.fin}`)
        .join(', ');
      lines.push(`${DAY_NAMES[i]}: ${ranges}`);
    }
  }
  // incluir Domingo si existe (0)
  if (grouped[0]?.length) {
    const ranges = grouped[0].map((r: any) => `${r.inicio}–${r.fin}`).join(', ');
    lines.unshift(`${DAY_NAMES[0]}: ${ranges}`); // al principio
  }

  // Si no hay líneas (por si los dias eran distintos), mostrar todo en un fallback
  if (!lines.length) {
    // ordenar por dia original y mostrar
    const flat = bloques
      .slice()
      .sort((a, b) => (a.dia - b.dia) || a.inicio.localeCompare(b.inicio))
      .map(b => `${DAY_NAMES[b.dia]} ${b.inicio}–${b.fin}`);
    return (
      <div className="text-sm text-gray-600">
        {flat.map((l, idx) => (<div key={idx}>{l}</div>))}
      </div>
    );
  }

  // Retornar JSX compacto: cada 2-3 items en una línea para no romper la tabla
  return (
    <div className="text-sm text-gray-600 space-y-0.5">
      {lines.map((ln, idx) => (
        <div key={idx} className="whitespace-nowrap">
          {ln}
        </div>
      ))}
    </div>
  );
}

export function MedicosView() {
  const [medicos, setMedicos] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedico, setEditingMedico] = useState<User | null>(null);

  // Lista de especialidades
const SPECIALIDADES = [
  'Medicina General',
  'Pediatría',
  'Ginecología',
  'Cardiología',
  'Dermatología',
];

// Estado para editar/crear horario dentro del modal
const [medicoHorario, setMedicoHorario] = useState<{ dia: number; inicio: string; fin: string; id?: string }[]>([]);

// Cuando se abre el modal para editar, precargar horario del medico
useEffect(() => {
  if (showModal && editingMedico) {
    // mapear para asegurarnos de ids únicos locales (útil para React keys)
    const mapped = (editingMedico as any).horario?.map((h: any, idx: number) => ({ ...h, id: String(idx) })) ?? [];
    setMedicoHorario(mapped);
  } else if (showModal && !editingMedico) {
    // nuevo medico -> horario vacío por defecto
    setMedicoHorario([]);
  }
}, [showModal, editingMedico]);

// Helpers para manipular horario
const addHorarioBlock = () => {
  setMedicoHorario(prev => [...prev, { dia: 1, inicio: '09:00', fin: '13:00', id: String(Date.now()) }]);
};
const removeHorarioBlock = (id?: string) => {
  setMedicoHorario(prev => prev.filter(h => h.id !== id));
};
const updateHorarioField = (id?: string, field?: 'dia' | 'inicio' | 'fin', value?: any) => {
  setMedicoHorario(prev => prev.map(h => h.id === id ? { ...h, [field!]: value } : h));
};


  useEffect(() => {
    loadMedicos();
  }, []);

  const loadMedicos = async () => {
    try {
      const response = await apiClient.getMedicos();
      setMedicos(response.data);
    } catch (error) {
      toast.error('Error al cargar médicos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMedico = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const email = formData.get('email') as string;
    const nombre = formData.get('nombre') as string;
    const especialidad = formData.get('especialidad') as string;
    const telefono = formData.get('telefono') as string;

    // Validaciones (consistentes con PacientesView)
    // Nombre: 2-50 caracteres y solo letras/espacios
    if (!nombre || nombre.length < 2 || nombre.length > 50) {
      toast.error('El nombre debe tener entre 2 y 50 caracteres');
      return;
    }
    if (!SOLO_LETRAS_REGEX.test(nombre)) {
      toast.error('El nombre solo puede contener letras');
      return;
    }

    // Email simple
    if (!email || !email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    // Especialidad (si es select ya estará validada, pero la comprobamos)
    if (!especialidad || especialidad.length < 2) {
      toast.error('Seleccione una especialidad válida');
      return;
    }

    // Teléfono (mismo formato que pacientes)
    if (!PHONE_CHILE_REGEX.test(telefono)) {
      toast.error('Teléfono inválido. Formato: +56912345678 (móvil) o +56212345678 (fijo)');
      return;
    }

    // Validar bloques de horario si existen (medicoHorario debe existir como estado)
    // Cada bloque debe tener inicio < fin
    if ((medicoHorario ?? []).some((h: any) => !h.inicio || !h.fin || h.inicio >= h.fin)) {
      toast.error('Cada bloque de horario debe tener hora de inicio y fin, con inicio < fin');
      return;
    }

    const data: any = {
      email,
      nombre,
      especialidad,
      telefono,
      rol: 'MEDICO' as const,
      horario: (medicoHorario ?? []).map((h: any) => ({ dia: Number(h.dia), inicio: h.inicio, fin: h.fin })),
    };

    try {
      if (editingMedico) {
        const updatedMedico = await apiClient.updateMedico(editingMedico.id, data);
        setMedicos(prev => prev.map(m => m.id === editingMedico.id ? updatedMedico : m));
        toast.success('Médico actualizado correctamente');
      } else {
        await apiClient.createMedico(data);
        loadMedicos();
        toast.success('Médico creado correctamente');
      }
      setShowModal(false);
      setEditingMedico(null);
      setMedicoHorario([]);
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar médico');
    }
  };



  const handleToggleEstado = async (medico: User) => {
    try {
      const nuevoEstado = !(medico as any).activo;
      await apiClient.updateMedico(medico.id, { activo: nuevoEstado } as any);
      setMedicos(prev => prev.map(m => 
        m.id === medico.id ? { ...m, activo: nuevoEstado } as any : m
      ));
      toast.success(`Médico ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      toast.error('Error al cambiar estado del médico');
    }
  };

  const filteredMedicos = medicos.filter(m =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.especialidad && m.especialidad.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Gestión de Médicos</h2>
          <p className="text-gray-600 mt-1">Administre los médicos del centro de salud</p>
        </div>
        <button
          onClick={() => {
            setEditingMedico(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Médico
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total de Médicos</p>
          <p className="text-2xl text-gray-900 mt-1">{medicos.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Médicos Activos</p>
          <p className="text-2xl text-green-900 mt-1">
            {medicos.filter(m => (m as any).activo !== false).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Especialidades</p>
          <p className="text-2xl text-blue-900 mt-1">
            {new Set(medicos.map(m => m.especialidad).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o especialidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Email</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Especialidad</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Teléfono</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Horario</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMedicos.map((medico) => {
                const activo = (medico as any).activo !== false;
                return (
                  <tr key={medico.id} className={`hover:bg-gray-50 ${!activo ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-900">{medico.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{medico.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {medico.especialidad || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(medico as any).telefono || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatHorario(medico) ?? <span className="text-gray-400">-</span>}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingMedico(medico);
                            setShowModal(true);
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleEstado(medico)}
                          className={`p-1 rounded ${
                            activo
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={activo ? 'Desactivar' : 'Activar'}
                        >
                          {activo ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-gray-900">
                {editingMedico ? 'Editar Médico' : 'Nuevo Médico'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingMedico(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedico} className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-700">Nombre Completo</label>
                <input
                  name="nombre"
                  type="text"
                  defaultValue={editingMedico?.nombre}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dr. Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingMedico?.email}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="medico@clinica.cl"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-gray-700">Teléfono</label>
                  <input
                    name="telefono"
                    type="tel"
                    defaultValue={(editingMedico as any)?.telefono}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+56912345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Especialidad</label>
                <select
                  name="especialidad"
                  defaultValue={editingMedico?.especialidad || SPECIALIDADES[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SPECIALIDADES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Horario dinámico */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">Horario de trabajo</label>

                <div className="space-y-2">
                  {medicoHorario.length === 0 && (
                    <div className="text-sm text-gray-500">No hay bloques de horario definidos.</div>
                  )}

                  {medicoHorario.map((h) => (
                    <div key={h.id} className="grid grid-cols-3 gap-2 items-center">
                      <select
                        value={String(h.dia)}
                        onChange={(e) => updateHorarioField(h.id, 'dia', Number(e.target.value))}
                        className="px-2 py-2 border border-gray-300 rounded-md"
                      >
                        <option value={1}>Lunes</option>
                        <option value={2}>Martes</option>
                        <option value={3}>Miércoles</option>
                        <option value={4}>Jueves</option>
                        <option value={5}>Viernes</option>
                        <option value={6}>Sábado</option>
                        <option value={0}>Domingo</option>
                      </select>

                      <select
                        value={h.inicio}
                        onChange={(e) => updateHorarioField(h.id, 'inicio', e.target.value)}
                        className="px-2 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        {[
                          "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
                          "12:00","12:30","14:00","14:30","15:00","15:30","16:00","16:30",
                          "17:00","17:30","18:00","18:30"
                        ].map(hora => (
                          <option key={hora} value={hora}>{hora}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <select
                          value={h.fin}
                          onChange={(e) => updateHorarioField(h.id, "fin", e.target.value)}
                          className="px-2 py-2 border border-gray-300 rounded-md"
                          required
                        >
                          {[
                            "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
                            "12:00","12:30","14:00","14:30","15:00","15:30","16:00","16:30",
                            "17:00","17:30","18:00","18:30"
                          ].map(hora => (
                            <option key={hora} value={hora}>{hora}</option>
                          ))}
                        </select>
                      </div>
                        <button
                          type="button"
                          onClick={() => removeHorarioBlock(h.id)}
                          className="px-2 py-1 bg-red-50 text-red-700 rounded"
                          title="Eliminar bloque"
                        >
                          Eliminar
                        </button>
                      </div>
                  ))}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={addHorarioBlock}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      + Añadir bloque de horario
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Define día y rango (ej: Lunes 09:00–13:00). Puedes añadir varios bloques.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMedico(null);
                    setMedicoHorario([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingMedico ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
