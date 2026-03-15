import type { ReactNode } from 'react';

export type RecentLeadItem = {
  nombre: string;
  apellido: string;
  correo: string;
  estado: string;
};

export type RecentPropertyItem = {
  tipo_inmueble: string;
  direccion: {
    calle: string;
    municipio: string;
    fraccionamiento: string;
  };
  estatus: string;
  precio: string;
};

export type RecentUserItem = {
  nombres: string;
  apellido_paterno: string;
  correo_electronico: string;
  rol?: string;
  roles?: string[];
};

export type RecentPublicationItem = {
  titulo: string;
  fecha_creacion: string;
  fechaPublico?: string | null;
  publicado: boolean;
  imagenes?: Array<{
    url?: string;
    titulo?: string;
    principal?: boolean;
  }> | null;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export function getStatusStyles(estado: string): { backgroundColor: string; color: string } {
  const normalizedEstado = estado.trim().toLowerCase();
  return STATUS_STYLES[normalizedEstado] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function getPropertyStatusStyles(estatus: string): { backgroundColor: string; color: string } {
  const normalizedStatus = estatus.trim().toLowerCase();
  return PROPERTY_STATUS_STYLES[normalizedStatus] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function formatDireccion(direccion: RecentPropertyItem['direccion']): string {
  const parts = [direccion.calle, direccion.municipio, direccion.fraccionamiento].map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Sin dirección';
}

export function renderPrice(value: string) {
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

export function getPublicationStatusStyles(publicado: boolean): { backgroundColor: string; color: string } {
  if (publicado) {
    return { backgroundColor: '#DBFCE7', color: '#4D8236' };
  }
  return { backgroundColor: '#E0E7F4', color: '#000000' };
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getUserRoleLabel(usuario: { rol?: string; roles?: string[] }): string {
  if (typeof usuario.rol === 'string' && usuario.rol.trim()) {
    return usuario.rol.trim();
  }

  if (Array.isArray(usuario.roles) && usuario.roles.length > 0) {
    const firstRole = usuario.roles.find((role) => typeof role === 'string' && role.trim().length > 0);
    if (firstRole) return firstRole.trim();
  }

  return 'Sin rol';
}

type DashboardSectionData = {
  registrosRecientes: RecentLeadItem[];
  propiedadesRecientes: RecentPropertyItem[];
  usuariosRecientes: RecentUserItem[];
  misPublicaciones: RecentPublicationItem[];
};

export function getSectionItemsCount(sectionTitle: string, data: DashboardSectionData): number {
  if (sectionTitle === 'Registros Recientes') return data.registrosRecientes.length;
  if (sectionTitle === 'Propiedades Recientes') return data.propiedadesRecientes.length;
  if (sectionTitle === 'Usuarios') return data.usuariosRecientes.length;
  if (sectionTitle === 'Publicaciones') return data.misPublicaciones.length;
  return 0;
}

export function getSectionEmptyMessage(sectionTitle: string): string {
  if (sectionTitle === 'Registros Recientes') return 'Sin registros recientes';
  if (sectionTitle === 'Propiedades Recientes') return 'Sin propiedades recientes';
  if (sectionTitle === 'Usuarios') return 'Sin usuarios recientes';
  if (sectionTitle === 'Publicaciones') return 'Sin publicaciones recientes';
  return 'Sin información';
}

export function renderSectionItems(sectionTitle: string, data: DashboardSectionData): ReactNode {
  if (sectionTitle === 'Registros Recientes') {
    return data.registrosRecientes.map((registro, index) => (
      <li
        key={`${registro.correo}-${registro.nombre}-${registro.apellido}-${index}`}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
      >
        <p className="text-sm font-semibold text-slate-800">
          {registro.nombre} {registro.apellido}
        </p>
        <p className="mt-1 text-xs text-slate-600">{registro.correo}</p>
        <div className="mt-2">
          <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold" style={getStatusStyles(registro.estado)}>
            {registro.estado}
          </span>
        </div>
      </li>
    ));
  }

  if (sectionTitle === 'Propiedades Recientes') {
    return data.propiedadesRecientes.map((propiedad, index) => (
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
    ));
  }

  if (sectionTitle === 'Usuarios') {
    return data.usuariosRecientes.map((usuario, index) => (
      <li
        key={`${usuario.correo_electronico}-${index}`}
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
            {getUserRoleLabel(usuario)}
          </span>
        </div>
      </li>
    ));
  }

  if (sectionTitle === 'Publicaciones') {
    return data.misPublicaciones.map((publicacion, index) => (
      <li
        key={`${publicacion.titulo}-${publicacion.fecha_creacion}-${index}`}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
      >
        <div className="flex items-start gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200">
            {getPublicationImageUrl(publicacion.imagenes) ? (
              <img
                src={getPublicationImageUrl(publicacion.imagenes) ?? ''}
                alt={publicacion.titulo}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-500">
                Sin imagen
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-slate-800">{publicacion.titulo}</p>
            <p className="mt-1 text-xs text-slate-600">
              {formatDate(publicacion.fechaPublico || publicacion.fecha_creacion)}
            </p>
            <div className="mt-2">
              <span
                className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                style={getPublicationStatusStyles(publicacion.publicado)}
              >
                {publicacion.publicado ? 'Publicado' : 'Borrador'}
              </span>
            </div>
          </div>
        </div>
      </li>
    ));
  }

  return null;
}

function getPublicationImageUrl(images?: RecentPublicationItem['imagenes']): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;

  const principalImage = images.find((image) => image?.principal) ?? images[0];
  if (!principalImage?.url) return null;

  return principalImage.url.startsWith('http')
    ? principalImage.url
    : `${API_URL}/${principalImage.url}`;
}
