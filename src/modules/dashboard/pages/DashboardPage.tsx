import { useEffect, useMemo, useState } from 'react';
import { ROLE_LABELS, getPrimaryRole, getUserDisplayName } from '../../../shared/constants/roles';
import { useAuth } from '../../../shared/context/AuthContext';
import { getDashboardSummary, getRecentPropertiesFallback } from '../services/dashboard.api';

const superAdminCards = [
  'Propiedades Disponibles',
  'Registros',
  'Propiedades vendidas',
  'Blogs',
  'Usuarios del sistema',
] as const;

const superAdminSections = ['Registros Recientes', 'Propiedades Recientes', 'Usuarios', 'Mis publicaciones'] as const;

const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  contactado: { backgroundColor: '#DBEAFE', color: '#1480F0' },
  'en seguimiento': { backgroundColor: '#F3E8FF', color: '#C455DB' },
  cancelado: { backgroundColor: '#FEF3C7', color: '#CA5874' },
  'cita agendada': { backgroundColor: '#CD8774', color: '#2F0905' },
  'en espera': { backgroundColor: '#DBFCE7', color: '#4D8236' },
  'en proceso': { backgroundColor: '#C455DB', color: '#F3E8FF' },
  cerrado: { backgroundColor: '#C3B28A', color: '#050505' },
};

const PROPERTY_STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  disponible: { backgroundColor: '#D0FAE5', color: '#4D8236' },
  apartado: { backgroundColor: '#FEF9C2', color: '#E4AE1F' },
  vendido: { backgroundColor: '#B3B3B5', color: '#000000' },
  preventa: { backgroundColor: '#DBEAFE', color: '#1480F0' },
  baja: { backgroundColor: '#FEF3C7', color: '#CA5874' },
};

export function DashboardPage() {
  const { user, accessToken } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles ?? []);
  const displayName = getUserDisplayName(user);
  const [summary, setSummary] = useState({
    propiedadesDisponibles: 0,
    registros: 0,
    usuariosSistema: 0,
    registrosRecientes: [] as Array<{
      nombre: string;
      apellido: string;
      correo: string;
      estado: string;
    }>,
    propiedadesRecientes: [] as Array<{
      tipo_inmueble: string;
      direccion: {
        calle: string;
        municipio: string;
        fraccionamiento: string;
      };
      estatus: string;
      precio: string;
    }>,
    usuariosRecientes: [] as Array<{
      nombres: string;
      apellido_paterno: string;
      correo_electronico: string;
      rol: string;
    }>,
    misPublicaciones: [] as Array<{
      titulo: string;
      fecha_creacion: string;
      publicado: boolean;
    }>,
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    if (primaryRole !== 'SUPER_ADMIN' || !accessToken) {
      return;
    }

    let isActive = true;
    setIsLoadingSummary(true);
    setSummaryError('');

    getDashboardSummary(accessToken)
      .then(async (data) => {
        if (!isActive) return;

        const propiedadesRecientes = Array.isArray(data.propiedades_recientes)
          ? data.propiedades_recientes
          : [];

        const propiedadesRecientesFinal =
          propiedadesRecientes.length > 0 ? propiedadesRecientes : await getRecentPropertiesFallback();

        if (!isActive) return;

        setSummary({
          propiedadesDisponibles: data.propiedades_disponibles,
          registros: data.registros,
          usuariosSistema: data.usuarios_sistema,
          registrosRecientes: Array.isArray(data.registros_recientes) ? data.registros_recientes : [],
          propiedadesRecientes: propiedadesRecientesFinal,
          usuariosRecientes: Array.isArray(data.usuarios_recientes) ? data.usuarios_recientes : [],
          misPublicaciones: Array.isArray(data.mis_publicaciones) ? data.mis_publicaciones : [],
        });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setSummaryError(error instanceof Error ? error.message : 'No fue posible cargar estadisticas.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoadingSummary(false);
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, primaryRole]);

  const cardValues = useMemo(
    () => ({
      'Propiedades Disponibles': summary.propiedadesDisponibles,
      Registros: summary.registros,
      'Propiedades vendidas': '-',
      Blogs: '-',
      'Usuarios del sistema': summary.usuariosSistema,
    }),
    [summary.propiedadesDisponibles, summary.registros, summary.usuariosSistema],
  );
  const registrosRecientes = Array.isArray(summary.registrosRecientes) ? summary.registrosRecientes : [];
  const propiedadesRecientes = Array.isArray(summary.propiedadesRecientes) ? summary.propiedadesRecientes : [];
  const usuariosRecientes = Array.isArray(summary.usuariosRecientes) ? summary.usuariosRecientes : [];
  const misPublicaciones = Array.isArray(summary.misPublicaciones) ? summary.misPublicaciones : [];

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-700 bg-welcome-800 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-white">{`Bienvenido, ${displayName}`}</h2>
        <p className="mt-2 text-sm text-slate-200">{primaryRole ? ROLE_LABELS[primaryRole] : 'Sin rol asignado'}</p>
      </section>

      {primaryRole === 'SUPER_ADMIN' ? (
        <section className="space-y-3">
          {summaryError ? <p className="text-sm text-red-600">{summaryError}</p> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {superAdminCards.map((title) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {isLoadingSummary ? '...' : cardValues[title]}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {superAdminSections.map((sectionTitle) => (
              <article key={sectionTitle} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">{sectionTitle}</h3>
                <ul className="mt-4 space-y-2">
                  {sectionTitle === 'Registros Recientes'
                    ? registrosRecientes.length > 0
                      ? registrosRecientes.map((registro) => (
                          <li
                            key={`${registro.correo}-${registro.nombre}-${registro.apellido}`}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <p className="text-sm font-semibold text-slate-800">
                              {registro.nombre} {registro.apellido}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">{registro.correo}</p>
                            <div className="mt-2">
                              <span
                                className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                                style={getStatusStyles(registro.estado)}
                              >
                                {registro.estado}
                              </span>
                            </div>
                          </li>
                        ))
                      : [
                          <li
                            key="sin-registros"
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                          >
                            Sin registros recientes
                          </li>,
                        ]
                    : sectionTitle === 'Propiedades Recientes'
                      ? propiedadesRecientes.length > 0
                        ? propiedadesRecientes.map((propiedad, index) => (
                            <li
                              key={`${propiedad.tipo_inmueble}-${propiedad.precio}-${index}`}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <p className="text-sm font-semibold text-slate-800">{propiedad.tipo_inmueble}</p>
                              <p className="mt-1 text-xs text-slate-600">{formatDireccion(propiedad.direccion)}</p>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span
                                  className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                                  style={getPropertyStatusStyles(propiedad.estatus)}
                                >
                                  {propiedad.estatus}
                                </span>
                                {renderPrice(propiedad.precio)}
                              </div>
                            </li>
                          ))
                        : [
                            <li
                              key="sin-propiedades"
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                            >
                              Sin propiedades recientes
                            </li>,
                          ]
                    : sectionTitle === 'Usuarios'
                      ? usuariosRecientes.length > 0
                        ? usuariosRecientes.map((usuario) => (
                            <li
                              key={usuario.correo_electronico}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <p className="text-sm font-semibold text-slate-800">
                                {usuario.nombres} {usuario.apellido_paterno}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">{usuario.correo_electronico}</p>
                              <div className="mt-2">
                                <span
                                  className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                                  style={{ backgroundColor: '#DBEAFE', color: '#1480F0' }}
                                >
                                  {usuario.rol}
                                </span>
                              </div>
                            </li>
                          ))
                        : [
                            <li
                              key="sin-usuarios"
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                            >
                              Sin usuarios recientes
                            </li>,
                          ]
                    : sectionTitle === 'Mis publicaciones'
                      ? misPublicaciones.length > 0
                        ? misPublicaciones.map((publicacion, index) => (
                            <li
                              key={`${publicacion.titulo}-${publicacion.fecha_creacion}-${index}`}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <p className="text-sm font-semibold text-slate-800">{publicacion.titulo}</p>
                              <p className="mt-1 text-xs text-slate-600">
                                {formatDate(publicacion.fecha_creacion)}
                              </p>
                              <div className="mt-2">
                                <span
                                  className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                                  style={getPublicationStatusStyles(publicacion.publicado)}
                                >
                                  {publicacion.publicado ? 'Publicado' : 'Borrador'}
                                </span>
                              </div>
                            </li>
                          ))
                        : [
                            <li
                              key="sin-publicaciones"
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                            >
                              Sin publicaciones recientes
                            </li>,
                          ]
                    : null}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function getStatusStyles(estado: string): { backgroundColor: string; color: string } {
  const normalizedEstado = estado.trim().toLowerCase();
  return STATUS_STYLES[normalizedEstado] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

function getPropertyStatusStyles(estatus: string): { backgroundColor: string; color: string } {
  const normalizedStatus = estatus.trim().toLowerCase();
  return PROPERTY_STATUS_STYLES[normalizedStatus] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

function formatDireccion(direccion: { calle: string; municipio: string; fraccionamiento: string }): string {
  const parts = [direccion.calle, direccion.municipio, direccion.fraccionamiento]
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Sin direccion';
}

function renderPrice(value: string) {
  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) {
    return <span className="text-xs font-semibold text-[#4F5EF8]">$0.00</span>;
  }

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  });
  const parts = formatter.formatToParts(parsedValue);

  return (
    <span className="text-xs font-semibold">
      {parts.map((part, index) => (
        <span key={`${part.type}-${index}`} className={part.type === 'currency' ? 'text-slate-700' : 'text-[#4F5EF8]'}>
          {part.value}
        </span>
      ))}
    </span>
  );
}

function getPublicationStatusStyles(publicado: boolean): { backgroundColor: string; color: string } {
  if (publicado) {
    return { backgroundColor: '#DBFCE7', color: '#4D8236' };
  }
  return { backgroundColor: '#E0E7F4', color: '#000000' };
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
