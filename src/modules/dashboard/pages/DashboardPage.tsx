import { PageHeader } from '../../../shared/components/common/PageHeader';
import { useAuth } from '../../../shared/context/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vista inicial del CRM. Desde aqui se mostraran metricas por modulo y por rol."
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Usuario actual: {user?.fullName}</p>
        <p className="mt-2 text-sm text-slate-600">Roles activos: {user?.roles.join(', ')}</p>
      </div>
    </div>
  );
}

