import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";

export const MODULE_ICON_SIZES: Partial<Record<ModuleKey, string>> = {
  rh_empleados: "h-7 w-7",
  rh_becarios: "h-8 w-8",
};
import dashboardIcon from "@/assets/images/Dashboard.png";
import propiedadesIcon from "@/assets/images/Propiedades.png";
import desarrollosIcon from "@/assets/images/edificios.png";
import registrosIcon from "@/assets/images/Registro.png";
import contenidoIcon from "@/assets/images/Contenido.png";
import materialIcon from "@/assets/images/creador-de-contenido.png";
import usuariosIcon from "@/assets/images/Usuarios.png";
import rolIcon from "@/assets/images/Rol.png";
import logsIcon from "@/assets/images/Logs.png";
import leadsIcon from "@/assets/icons/leads.png";
import mapaIcon from "@/assets/icons/maps.png";
import empleadoIcon from "@/assets/icons/employee (1).png";
import becarioIcon from "@/assets/icons/graduation.png";
import candidatoIcon from "@/assets/icons/candidat.png";
import eventoIcon from "@/assets/icons/party.png";
import archivoIcon from "@/assets/icons/docuement.png";
import recursosHumanosIcon from "@/assets/icons/mano.png";

export const MODULE_ICONS: Record<ModuleKey, string> = {
  dashboard: dashboardIcon,
  Estadísticas: dashboardIcon,
  propiedades: propiedadesIcon,
  desarrollos: desarrollosIcon,
  material: materialIcon,
  registros: registrosIcon,
  registros_leads: registrosIcon,
  asesor_externo: leadsIcon,
  blogs: contenidoIcon,
  usuarios: usuariosIcon,
  roles: rolIcon,
  movimientos: logsIcon,
  Operaciones: logsIcon,
  Comisiones: logsIcon,
  CarteraClientes: usuariosIcon,
  evaluacion: usuariosIcon,
  recomendaciones: usuariosIcon,
  mapa: mapaIcon,
  rh_empleados: empleadoIcon,
  rh_candidatos: candidatoIcon,
  rh_becarios: becarioIcon,
  rh_eventos: eventoIcon,
  rh_archivo: archivoIcon,
};

export type NavGroupConfig = {
  label: string;
  icon: string;
  iconClassName?: string;
  modules: ModuleKey[];
};

export const NAV_GROUP_CONFIGS: NavGroupConfig[] = [
  {
    label: "Leads",
    icon: leadsIcon,
    modules: ["registros", "registros_leads", "asesor_externo", "Estadísticas"],
  },
  {
    label: "Clientes",
    icon: registrosIcon,
    modules: ["Operaciones", "CarteraClientes"],
  },
  {
    label: "Contenido",
    icon: contenidoIcon,
    modules: ["blogs", "material"],
  },
  {
    label: "Evaluación",
    icon: usuariosIcon,
    modules: ["evaluacion"],
  },
  {
    label: "Recursos Humanos",
    icon: recursosHumanosIcon,
    iconClassName: "h-9 w-9",
    modules: ["rh_empleados", "rh_becarios", "rh_candidatos", "rh_eventos", "rh_archivo"],
  },
  {
    label: "Administración",
    icon: usuariosIcon,
    modules: ["usuarios", "roles", "movimientos"],
  },
];

export const STANDALONE_MODULES = new Set<ModuleKey>([
  "dashboard",
  "propiedades",
  "desarrollos",
  "mapa",
]);
