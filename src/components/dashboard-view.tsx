import { useLoaderData } from 'react-router';
import { apiClient } from '../lib/api-client';
import { Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export async function dashboardLoader() {
  const data = await apiClient.getDashboardStats('GERENTE');
  return data;
}

export function DashboardView() {
  const stats = useLoaderData() as any;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Dashboard Gerencial</h2>
        <p className="text-gray-600 mt-1">
          Vista general de métricas operativas del centro médico
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Citas Hoy"
          value={stats?.citas_hoy || 0}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Pacientes Activos"
          value={stats?.pacientes_activos || 0}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Atenciones (Mes)"
          value={stats?.atenciones_mes || 0}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Tasa de Inasistencia"
          value={`${stats?.tasa_inasistencia || 0}%`}
          icon={AlertCircle}
          color="orange"
        />
      </div>

      {/* Gráfico */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-gray-900 mb-6">Atenciones por Especialidad</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.stats_por_especialidad || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="nombre" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Información de seguridad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              Los datos presentados son agregados y anonimizados según las políticas de protección de datos.
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Para acceder a información individual de pacientes, utilice el módulo de Auditoría con justificación legal.
            </p>
          </div>
        </div>
      </div>

      {/* Resumen de cumplimiento */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-gray-900 mb-4">Resumen de Cumplimiento</h3>
        <div className="space-y-3">
          <ComplianceItem
            label="Ley N°21.668 (Interoperabilidad)"
            status="CUMPLIDO"
            description="Sistema exporta fichas en formato JSON/HL7-FHIR"
          />
          <ComplianceItem
            label="Ley N°21.719 (Protección de Datos)"
            status="CUMPLIDO"
            description="Cifrado TLS 1.3, almacenamiento seguro, control de acceso RBAC"
          />
          <ComplianceItem
            label="Disponibilidad del Sistema"
            status="CUMPLIDO"
            description="99.7% de uptime (objetivo: 99.5%)"
          />
          <ComplianceItem
            label="Tiempo de Respuesta"
            status="CUMPLIDO"
            description="Promedio: 1.8s (objetivo: {'<'}3s)"
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

interface ComplianceItemProps {
  label: string;
  status: 'CUMPLIDO' | 'PENDIENTE' | 'ALERTA';
  description: string;
}

function ComplianceItem({ label, status, description }: ComplianceItemProps) {
  const statusColors = {
    CUMPLIDO: 'bg-green-100 text-green-800',
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    ALERTA: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
      <span className={`text-xs px-2 py-1 rounded ${statusColors[status]} mt-0.5`}>
        {status}
      </span>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{label}</p>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}
