import { PageHeader } from '../../../shared/components/common/PageHeader';

export function HrPage() {
  return (
    <div>
      <PageHeader title="Recursos Humanos" description="Modulo para procesos internos de RH." />
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Aqui iran vistas internas de RH.</p>
      </div>
    </div>
  );
}

