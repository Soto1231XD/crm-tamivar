import type { ReactNode } from 'react';
import { getSoftBadgeStyles } from '@/components/ui/badgeStyles';
import { getHighestPriorityRoleLabel } from '@/shared/auth/role.utils';
import {
  getPropertyStatusStyles,
  getPublicationStatusStyles,
  getStatusStyles,
} from '@/shared/ui/statusStyles';
import { getFullImageUrl } from '@/shared/utils/imageUrl';

export type RecentLeadItem = {
  nombre: string;
  apellido: string;
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
  imagenes?: Array<{
    url?: string;
    titulo?: string;
    principal?: boolean;
  }> | null;
};

export type RecentUserItem = {
  nombres: string;
  apellido_paterno: string;
  correo_electronico: string;
  foto_url?: string | null;
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

const priceFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatDireccion(direccion: RecentPropertyItem['direccion']): string {
  const parts = [direccion.calle, direccion.municipio, direccion.fraccionamiento]
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Sin dirección';
}

export function renderPrice(value: string, isDark = false) {
  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) {
    return (
      <span className={isDark ? 'text-xs font-semibold text-sky-300' : 'text-xs font-semibold text-[#4F5EF8]'}>
        $0.00
      </span>
    );
  }

  const parts = priceFormatter.formatToParts(parsedValue);

  return (
    <span className="text-xs font-semibold">
      {parts.map((part, index) => (
        <span
          key={`${part.type}-${index}`}
          className={
            part.type === 'currency'
              ? isDark
                ? 'text-slate-300'
                : 'text-slate-700'
              : isDark
                ? 'text-sky-300'
                : 'text-[#4F5EF8]'
          }
        >
          {part.value}
        </span>
      ))}
    </span>
  );
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
}

export function getUserRoleLabel(usuario: { rol?: string; roles?: string[] }): string {
  return getHighestPriorityRoleLabel(usuario);
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

export function renderSectionItems(sectionTitle: string, data: DashboardSectionData, isDark = false): ReactNode {
  const itemClasses = isDark
    ? 'overflow-hidden rounded-2xl border border-slate-700/80 bg-[linear-gradient(180deg,#0F172A,#111827)] px-4 py-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.95)] transition-colors hover:bg-[linear-gradient(180deg,#111827,#172554)]'
    : 'overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#FFFFFF,#F8FAFC)] px-4 py-3 transition-colors hover:bg-[linear-gradient(180deg,#FFFFFF,#F1F5F9)]';
  const publicationItemClasses = isDark
    ? 'overflow-hidden rounded-2xl border border-slate-700/80 bg-[linear-gradient(180deg,#0F172A,#131C32)] px-4 py-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.95)] transition-colors hover:bg-[linear-gradient(180deg,#111827,#1E293B)]'
    : 'overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#FFFFFF,#EEF2FF)] px-4 py-3 transition-colors hover:bg-[linear-gradient(180deg,#FFFFFF,#E8EDFF)]';
  const primaryText = isDark ? 'text-slate-100' : 'text-slate-800';
  const secondaryText = isDark ? 'text-slate-300' : 'text-slate-600';
  const tertiaryText = isDark ? 'text-slate-400' : 'text-slate-500';
  const mediaShell = isDark ? 'ring-slate-700/80 bg-slate-800' : 'ring-slate-200 bg-slate-200';
  const mediaPlaceholderText = isDark ? 'text-slate-400' : 'text-slate-500';
  const avatarClasses = isDark
    ? 'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700/80 bg-slate-800 text-xs font-bold text-slate-300'
    : 'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600';

  if (sectionTitle === 'Registros Recientes') {
    return data.registrosRecientes.map((registro, index) => (
      <li key={`${registro.nombre}-${registro.apellido}-${index}`} className={itemClasses}>
        <p className={`text-sm font-semibold ${primaryText}`}>
          {registro.nombre} {registro.apellido}
        </p>
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
      <li key={`${propiedad.tipo_inmueble}-${propiedad.precio}-${index}`} className={itemClasses}>
        <div className="flex items-start gap-3">
          <div className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-inset ${mediaShell}`}>
            {getPropertyImageUrl(propiedad.imagenes) ? (
              <img
                src={getPropertyImageUrl(propiedad.imagenes) ?? ''}
                alt={propiedad.tipo_inmueble}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-[10px] font-medium ${mediaPlaceholderText}`}>
                Sin imagen
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${primaryText}`}>{propiedad.tipo_inmueble}</p>
            <p className={`mt-1 text-xs leading-5 ${secondaryText}`}>{formatDireccion(propiedad.direccion)}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span
                className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                style={getPropertyStatusStyles(propiedad.estatus)}
              >
                {propiedad.estatus}
              </span>
              {renderPrice(propiedad.precio, isDark)}
            </div>
          </div>
        </div>
      </li>
    ));
  }

  if (sectionTitle === 'Usuarios') {
    return data.usuariosRecientes.map((usuario, index) => (
      <li key={`${usuario.correo_electronico}-${index}`} className={itemClasses}>
        <div className="flex items-start gap-3">
          <div className={avatarClasses}>
            {usuario.foto_url ? (
              <img
                src={getFullImageUrl(usuario.foto_url)}
                alt={`${usuario.nombres} ${usuario.apellido_paterno}`.trim()}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{`${usuario.nombres?.[0] || ''}${usuario.apellido_paterno?.[0] || ''}`.toUpperCase() || 'U'}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${primaryText}`}>
              {usuario.nombres} {usuario.apellido_paterno}
            </p>
            <p className={`mt-1 text-xs leading-5 ${secondaryText}`}>{usuario.correo_electronico}</p>
            <div className="mt-2">
              <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold" style={getSoftBadgeStyles('blue')}>
                {getUserRoleLabel(usuario)}
              </span>
            </div>
          </div>
        </div>
      </li>
    ));
  }

  if (sectionTitle === 'Publicaciones') {
    return data.misPublicaciones.map((publicacion, index) => (
      <li key={`${publicacion.titulo}-${publicacion.fecha_creacion}-${index}`} className={publicationItemClasses}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className={`h-28 w-full shrink-0 overflow-hidden rounded-xl ring-1 ring-inset sm:h-16 sm:w-16 ${mediaShell}`}>
            {getPublicationImageUrl(publicacion.imagenes) ? (
              <img
                src={getPublicationImageUrl(publicacion.imagenes) ?? ''}
                alt={publicacion.titulo}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-[10px] font-medium ${mediaPlaceholderText}`}>
                Sin imagen
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className={`break-words text-sm font-semibold leading-5 sm:line-clamp-2 ${primaryText}`}>{publicacion.titulo}</p>
            <p className={`mt-1 text-xs font-medium ${tertiaryText}`}>
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

type ImageItem = { url?: string; principal?: boolean } | null | undefined;

function getImageUrl(images?: ImageItem[] | null): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const principalImage = images.find((image) => image?.principal) ?? images[0];
  if (!principalImage?.url) return null;
  return principalImage.url.startsWith('http')
    ? principalImage.url
    : `${API_URL}/${principalImage.url}`;
}

function getPublicationImageUrl(images?: RecentPublicationItem['imagenes']): string | null {
  return getImageUrl(images);
}

function getPropertyImageUrl(images?: RecentPropertyItem['imagenes']): string | null {
  return getImageUrl(images);
}
