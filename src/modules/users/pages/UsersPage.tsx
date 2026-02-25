import { PageHeader } from '../../../shared/components/common/PageHeader';

export function UsersPage() {
  return (
    <div>
      <PageHeader title="Usuarios" description="Modulo para gestion de usuarios, roles y permisos." />
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Aqui ira el catalogo de usuarios.</p>
      </div>
    </div>
  );
}

