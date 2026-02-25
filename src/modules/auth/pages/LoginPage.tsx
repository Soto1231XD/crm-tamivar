import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { useAuth } from '../../../shared/context/AuthContext';
import type { Role } from '../../../shared/types/rbac';

const rolePresets: Array<{ label: string; roles: Role[] }> = [
  { label: 'Super Admin', roles: ['SUPER_ADMIN'] },
  { label: 'Admin', roles: ['ADMIN'] },
  { label: 'Marketing', roles: ['MARKETING'] },
  { label: 'Recursos Humanos', roles: ['RH'] },
  { label: 'Asesor de Ventas', roles: ['ASESOR_VENTAS'] },
  { label: 'Coordinador de Ventas', roles: ['COORDINADOR_VENTAS'] },
  { label: 'RH + Propiedades + Registros', roles: ['RH', 'ASESOR_VENTAS'] },
];

export function LoginPage() {
  const { setRoles } = useAuth();
  const navigate = useNavigate();

  const cards = useMemo(
    () =>
      rolePresets.map((preset) => (
        <article key={preset.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{preset.label}</h2>
          <p className="mt-2 text-xs text-slate-600">Acceso demo para pruebas de vistas por roles.</p>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              setRoles(preset.roles);
              navigate('/');
            }}
          >
            Entrar con este rol
          </Button>
        </article>
      )),
    [navigate, setRoles],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-6">
      <div className="w-full max-w-5xl rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        <h1 className="text-3xl font-black text-slate-900">CRM TAMIVAR</h1>
        <p className="mt-2 text-sm text-slate-600">Login demo con presets por rol.</p>
        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards}</section>
      </div>
    </div>
  );
}
