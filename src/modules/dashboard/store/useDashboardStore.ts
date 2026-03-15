import { create } from 'zustand';
import { getLeads } from '../../leads/services/leads.api';
import { getProperties } from '../../properties/services/properties.api';
import { getSystemRoles } from '../../systemRoles/services/systemRoles.api';
import type {
  RecentLeadItem,
  RecentPropertyItem,
  RecentPublicationItem,
  RecentUserItem,
} from '../dashboard.utils';
import { getDashboardSummary, getRecentPropertiesFallback } from '../services/dashboard.api';

export type DashboardRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MARKETING'
  | 'RH'
  | 'ASESOR_VENTAS'
  | 'COORDINADOR_VENTAS';

export type DashboardSummaryState = {
  propiedadesDisponibles: number;
  propiedadesVendidas: number;
  registros: number;
  blogs: number;
  rolesSistema: number;
  usuariosSistema: number;
  registrosRecientes: RecentLeadItem[];
  misRegistrosRecientes: RecentLeadItem[];
  propiedadesRecientes: RecentPropertyItem[];
  usuariosRecientes: RecentUserItem[];
  misPublicaciones: RecentPublicationItem[];
};

type DashboardStore = {
  summary: DashboardSummaryState;
  isLoading: boolean;
  error: string | null;
  fetchSummary: (accessToken: string, primaryRole: DashboardRole, userId?: number | null) => Promise<void>;
  reset: () => void;
};

const INITIAL_SUMMARY: DashboardSummaryState = {
  propiedadesDisponibles: 0,
  propiedadesVendidas: 0,
  registros: 0,
  blogs: 0,
  rolesSistema: 0,
  usuariosSistema: 0,
  registrosRecientes: [],
  misRegistrosRecientes: [],
  propiedadesRecientes: [],
  usuariosRecientes: [],
  misPublicaciones: [],
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  summary: INITIAL_SUMMARY,
  isLoading: false,
  error: null,

  fetchSummary: async (accessToken, primaryRole, userId) => {
    set({ isLoading: true, error: null });
    try {
      const [data, properties, roles, leads] = await Promise.all([
        getDashboardSummary(accessToken),
        getProperties(),
        getSystemRoles(accessToken),
        getLeads(),
      ]);

      const propiedadesRecientes = Array.isArray(data.propiedades_recientes) ? data.propiedades_recientes : [];
      const propiedadesDisponiblesActivas = Array.isArray(properties)
        ? properties.filter((property) => normalizePropertyStatus(property.estatus) === 'disponible').length
        : 0;
      const propiedadesVendidas = Array.isArray(properties)
        ? properties.filter((property) => normalizePropertyStatus(property.estatus) === 'vendido').length
        : 0;
      const propiedadesRecientesFinal =
        propiedadesRecientes.length > 0 ? propiedadesRecientes : await getRecentPropertiesFallback();

      const ownLeads =
        primaryRole === 'ASESOR_VENTAS' && userId
          ? leads.filter((lead) => lead.creador?.id === userId)
          : [];

      const ownRecentLeads = ownLeads
        .slice()
        .sort((left, right) => {
          const leftDate = left.creado_en ? new Date(left.creado_en).getTime() : 0;
          const rightDate = right.creado_en ? new Date(right.creado_en).getTime() : 0;
          return rightDate - leftDate;
        })
        .slice(0, 5)
        .map((lead) => ({
          nombre: lead.nombres,
          apellido: lead.apellidos,
          correo: lead.correo_electronico ?? 'Sin correo',
          estado: lead.estado ?? 'Sin estado',
        }));

      set({
        summary: {
          propiedadesDisponibles: propiedadesDisponiblesActivas,
          propiedadesVendidas,
          registros: primaryRole === 'ASESOR_VENTAS' ? ownLeads.length : data.registros,
          blogs: Array.isArray(data.mis_publicaciones) ? data.mis_publicaciones.length : 0,
          rolesSistema: Array.isArray(roles) ? roles.length : 0,
          usuariosSistema: data.usuarios_sistema,
          registrosRecientes: Array.isArray(data.registros_recientes) ? data.registros_recientes : [],
          misRegistrosRecientes: ownRecentLeads,
          propiedadesRecientes: propiedadesRecientesFinal,
          usuariosRecientes: Array.isArray(data.usuarios_recientes) ? data.usuarios_recientes : [],
          misPublicaciones: Array.isArray(data.mis_publicaciones) ? data.mis_publicaciones : [],
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No fue posible cargar estadisticas.',
        isLoading: false,
      });
    }
  },

  reset: () => set({ summary: INITIAL_SUMMARY, isLoading: false, error: null }),
}));

function normalizePropertyStatus(status?: string | null): string {
  return typeof status === 'string' ? status.trim().toLowerCase() : '';
}
