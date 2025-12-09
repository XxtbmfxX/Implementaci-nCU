import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import type { AuditLog } from '../lib/api-client';
import { Shield, Search, Calendar, User, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function AuditoriaView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const response = await apiClient.getAuditLogs({ page: 1, limit: 50 });
      setLogs(response.data);
    } catch (error) {
      toast.error('Error al cargar logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.detalles.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccionColor = (accion: string) => {
    const colors = {
      CREAR: 'bg-green-100 text-green-800',
      ACTUALIZAR: 'bg-blue-100 text-blue-800',
      ELIMINAR: 'bg-red-100 text-red-800',
      LEER: 'bg-gray-100 text-gray-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-orange-100 text-orange-800',
    };
    return colors[accion as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando logs de auditoría...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Auditoría del Sistema</h2>
          <p className="text-gray-600 mt-1">
            Registro completo de acciones y accesos al sistema
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Shield className="w-5 h-5" />
          <span>Registro indeleble - Cumplimiento RNF-S4</span>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por acción, entidad o detalles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-900">
              Estos logs son inmutables y se conservan por 15 años según regulación vigente.
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Todo acceso y modificación queda registrado con fecha, hora, usuario y acción realizada.
            </p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Fecha/Hora</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Usuario</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Acción</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Entidad</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div>{new Date(log.fecha).toLocaleDateString('es-CL')}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.fecha).toLocaleTimeString('es-CL')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>Usuario ID: {log.usuario_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${getAccionColor(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <div>{log.entidad}</div>
                          <div className="text-xs text-gray-500">ID: {log.entidad_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.detalles}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total de Eventos</p>
          <p className="text-2xl text-gray-900 mt-1">{logs.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Modificaciones Hoy</p>
          <p className="text-2xl text-gray-900 mt-1">
            {logs.filter(l => 
              new Date(l.fecha).toDateString() === new Date().toDateString() &&
              l.accion === 'ACTUALIZAR'
            ).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Accesos Sensibles</p>
          <p className="text-2xl text-gray-900 mt-1">
            {logs.filter(l => l.entidad === 'FICHA_CLINICA').length}
          </p>
        </div>
      </div>
    </div>
  );
}
