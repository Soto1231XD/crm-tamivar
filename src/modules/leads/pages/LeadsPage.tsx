import { PageHeader } from '../../../shared/components/common/PageHeader';

export function LeadsPage() {
  return (
    <div>
      <PageHeader title="Registros" description="Modulo para leads/registros de clientes interesados." />
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Aqui ira la tabla de registros reutilizable.</p>
      </div>
    </div>
  );
}

