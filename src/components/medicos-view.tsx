import { useState, useEffect } from 'react';
import { apiClient, User } from '../lib/api-client';
import { Plus, Search, Edit2, X, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function MedicosView() {
  const [medicos, setMedicos] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedico, setEditingMedico] = useState<User | null>(null);

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
    
    // Validaciones
    if (!email.includes('@')) {
      toast.error('Email inválido');
      return;
    }
    
    if (nombre.length < 3 || nombre.length > 100) {
      toast.error('El nombre debe tener entre 3 y 100 caracteres');
      return;
    }
    
    if (especialidad.length < 3 || especialidad.length > 100) {
      toast.error('La especialidad debe tener entre 3 y 100 caracteres');
      return;
    }

    const data = {
      email,
      nombre,
      especialidad,
      telefono,
      rol: 'MEDICO' as const,
    };

    try {
      if (editingMedico) {
        const updatedMedico = await apiClient.updateMedico(editingMedico.id, data);
        setMedicos(prev => prev.map(m => m.id === editingMedico.id ? updatedMedico : m));
        toast.success('Médico actualizado correctamente');
      } else {
        const newMedico = await apiClient.createMedico(data);
        setMedicos(prev => [...prev, newMedico]);
        toast.success('Médico creado correctamente');
      }
      setShowModal(false);
      setEditingMedico(null);
    } catch (error) {
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
                <label className="block text-sm mb-1 text-gray-700">Especialidad</label>
                <input
                  name="especialidad"
                  type="text"
                  defaultValue={editingMedico?.especialidad}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Medicina General"
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Nota:</strong> Se generará una contraseña temporal que debe ser cambiada en el primer acceso.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMedico(null);
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
