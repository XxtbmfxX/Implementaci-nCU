import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import type { Paciente } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { Plus, Search, Edit2, FileText, X, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { validate as validateRut, format as formatRut } from 'rut.js';

export function PacientesView() {
  const { user, hasPermission } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);


  useEffect(() => {
    loadPacientes();
  }, []);

  const loadPacientes = async () => {
    try {
      const response = await apiClient.getPacientes();
      setPacientes(response.data);
    } catch (error) {
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

const isPacienteActivo = (p: Paciente) => {
  const s = (p as any).activo;
  return s === true || s === 1 || s === "ACTIVO" || s === "activo";
};

const handleToggleEstadoPaciente = async (paciente: Paciente) => {
  try {
    const nuevoEstado = !isPacienteActivo(paciente);
    const actualizado = await apiClient.updatePaciente(paciente.id, { activo: nuevoEstado });

    setPacientes(prev =>
      prev.map(p => p.id === paciente.id ? actualizado : p)
    );

    toast.success(`Paciente ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
  } catch (error) {
    console.error(error);
    toast.error("Error al cambiar estado del paciente");
  }
};




  const validatePhoneNumber = (phone: string): boolean => {
    // Formato chileno: +569XXXXXXXX (móvil) o +562XXXXXXXX (fijo)
    const phoneRegex = /^\+56[29]\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSavePaciente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const rut = formData.get('rut') as string;
    const fechaNacimiento = formData.get('fecha_nacimiento') as string;
    const telefono = formData.get('telefono') as string;
    const nombre = formData.get('nombre') as string;
    const apellido = formData.get('apellido') as string;
    const direccion = formData.get('direccion') as string;
    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
    
    // Validar RUT
    if (!validateRut(rut)) {
      toast.error('RUT inválido. Por favor ingrese un RUT válido (ej: 12345678-9)');
      return;
    }
    
    // Validar fecha de nacimiento
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    const edad = Math.floor((hoy.getTime() - fechaNac.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (fechaNac > hoy) {
      toast.error('La fecha de nacimiento no puede ser posterior a hoy');
      return;
    }
    
    if (edad > 100) {
      toast.error('La fecha de nacimiento indica una edad mayor a 100 años. Por favor verifique');
      return;
    }
    
    // Validar teléfono
    if (!validatePhoneNumber(telefono)) {
      toast.error('Teléfono inválido. Formato: +56912345678 (móvil) o +56223456789 (fijo)');
      return;
    }
    
    // Validar nombre
    if (nombre.length < 2 || nombre.length > 50) {
      toast.error('El nombre debe tener entre 2 y 50 caracteres');
      return;
    }
    if (!soloLetras.test(nombre)) {
      toast.error('El nombre solo puede contener letras');
      return;
    }
    
    // Validar apellido
    if (apellido.length < 2 || apellido.length > 50) {
      toast.error('El apellido debe tener entre 2 y 50 caracteres');
      return;
    }
    if (!soloLetras.test(apellido)) {
      toast.error('El apellido solo puede contener letras');
      return;
    }
    
    // Validar dirección
    if (direccion.length < 5 || direccion.length > 100) {
      toast.error('La dirección debe tener entre 5 y 100 caracteres');
      return;
    }

    const data = Object.fromEntries(formData) as any;
    data.activo = true;
    data.rut = formatRut(rut); // Formatear el RUT

    try {
      if (editingPaciente) {
        const updatedPaciente = await apiClient.updatePaciente(editingPaciente.id, data);
        // Actualización optimista
        setPacientes(prev => prev.map(p => p.id === editingPaciente.id ? updatedPaciente : p));
        toast.success('Paciente actualizado correctamente');
      } else {
        const newPaciente = await apiClient.createPaciente(data);
        // Agregar el nuevo paciente a la lista local inmediatamente
        setPacientes(prev => [...prev, newPaciente]);
        toast.success('Paciente creado correctamente');
      }
      setShowModal(false);
      setEditingPaciente(null);
    } catch (error) {
      toast.error('Error al guardar paciente');
      // Recargar en caso de error
      loadPacientes();
    }
  };

  const filteredPacientes = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.rut.includes(searchTerm)
  );

  const canCreateOrEdit = hasPermission('crear_pacientes') || hasPermission('actualizar_pacientes');
  const canViewFichas = user?.rol === 'MEDICO';

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
          <h2 className="text-gray-900">Gestión de Pacientes</h2>
          <p className="text-gray-600 mt-1">Administre la información de los pacientes</p>
        </div>
        {canCreateOrEdit && (
          <button
            onClick={() => {
              setEditingPaciente(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Paciente
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o RUT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-600">RUT</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Contacto</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Previsión</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPacientes.map((paciente) => (
                <tr key={paciente.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{paciente.rut}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {paciente.nombre} {paciente.apellido}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div>{paciente.telefono}</div>
                    <div className="text-xs text-gray-500">{paciente.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{paciente.prevision}</td>
                  <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                    isPacienteActivo(paciente)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}
                    >
                    {isPacienteActivo(paciente) ? 'Activo' : 'Inactivo'}
                  </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {canViewFichas && (
                        <button
                          onClick={() => setSelectedPaciente(paciente)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver Ficha Clínica"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {canCreateOrEdit && (
                        <button
                          onClick={() => {
                            setEditingPaciente(paciente);
                            setShowModal(true);
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
              {/* ACTIVAR / DESACTIVAR */}
                        <button
                          onClick={() => handleToggleEstadoPaciente(paciente)}
                          className={`p-1 rounded ${
                            isPacienteActivo(paciente)
                      ? "text-red-600 hover:bg-red-50"
                      : "text-green-600 hover:bg-green-50"
                  }`}
                  title={
                    isPacienteActivo(paciente) ? "Desactivar" : "Activar"
                  }
                >
                  {isPacienteActivo(paciente) ? (
                    <UserX className="w-4 h-4" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                </button>


                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-gray-900">
                {editingPaciente ? 'Editar Paciente' : 'Nuevo Paciente'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPaciente(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaciente} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-700">RUT</label>
                  <input
                    name="rut"
                    type="text"
                    defaultValue={editingPaciente?.rut}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12345678-9"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Fecha Nacimiento</label>
                  <input
                    name="fecha_nacimiento"
                    type="date"
                    defaultValue={editingPaciente?.fecha_nacimiento}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Nombre</label>
                  <input
                    name="nombre"
                    type="text"
                    defaultValue={editingPaciente?.nombre}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Apellido</label>
                  <input
                    name="apellido"
                    type="text"
                    defaultValue={editingPaciente?.apellido}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Teléfono</label>
                  <input
                    name="telefono"
                    type="tel"
                    defaultValue={editingPaciente?.telefono}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+56912345678"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingPaciente?.email}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Dirección</label>
                  <input
                    name="direccion"
                    type="text"
                    defaultValue={editingPaciente?.direccion}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Previsión</label>
                  <select
                    name="prevision"
                    defaultValue={editingPaciente?.prevision || 'FONASA'}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FONASA">FONASA</option>
                    <option value="ISAPRE">ISAPRE</option>
                    <option value="PARTICULAR">Particular</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPaciente(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingPaciente ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha Clínica (Solo para Médicos) */}
      {selectedPaciente && canViewFichas && (
        <FichaClinicaModal
          paciente={selectedPaciente}
          onClose={() => setSelectedPaciente(null)}
        />
      )}
    </div>
  );
}

function FichaClinicaModal({ paciente, onClose }: { paciente: Paciente; onClose: () => void }) {
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFichas();
  }, []);

  const loadFichas = async () => {
    try {
      const response = await apiClient.getFichasByPaciente(paciente.id);
      setFichas(response.data);
    } catch (error) {
      toast.error('Error al cargar fichas clínicas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-gray-900">Ficha Clínica</h3>
            <p className="text-sm text-gray-600 mt-1">
              {paciente.nombre} {paciente.apellido} - RUT: {paciente.rut}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Cargando fichas...</div>
          ) : fichas.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No hay registros clínicos para este paciente
            </div>
          ) : (
            <div className="space-y-4">
              {fichas.map((ficha) => (
                <div key={ficha.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">
                      {new Date(ficha.fecha).toLocaleDateString('es-CL')}
                    </span>
                    {ficha.bloqueada && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                        Bloqueada
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-700">Anamnesis:</span>
                      <p className="text-gray-900 mt-1">{ficha.anamnesis}</p>
                    </div>
                    <div>
                      <span className="text-gray-700">Examen Físico:</span>
                      <p className="text-gray-900 mt-1">{ficha.examen_fisico}</p>
                    </div>
                    <div>
                      <span className="text-gray-700">Diagnóstico:</span>
                      <p className="text-gray-900 mt-1">{ficha.diagnostico}</p>
                    </div>
                    <div>
                      <span className="text-gray-700">Tratamiento:</span>
                      <p className="text-gray-900 mt-1">{ficha.tratamiento}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}