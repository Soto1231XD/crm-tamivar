import { PageHeader } from '../../../shared/components/common/PageHeader';

export function PropertiesPage() {
  return (
    <div>
      <PageHeader title="Propiedades" description="Modulo para inventario/listado de inmuebles." />
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Aqui ira la tabla de propiedades reutilizable.</p>
      </div>
    </div>
  );
}

