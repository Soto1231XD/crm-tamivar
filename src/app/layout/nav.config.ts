import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";
import dashboardIcon from "@/assets/images/Dashboard.png";
import propiedadesIcon from "@/assets/images/Propiedades.png";
import desarrollosIcon from "@/assets/images/edificios.png";
import registrosIcon from "@/assets/images/Registro.png";
import contenidoIcon from "@/assets/images/Contenido.png";
import materialIcon from "@/assets/images/creador-de-contenido.png";
import usuariosIcon from "@/assets/images/Usuarios.png";
import rolIcon from "@/assets/images/Rol.png";
import logsIcon from "@/assets/images/Logs.png";

export const MODULE_ICONS: Record<ModuleKey, string> = {
  dashboard: dashboardIcon,
  Estadísticas: dashboardIcon,
  propiedades: propiedadesIcon,
  desarrollos: desarrollosIcon,
  material: materialIcon,
  registros: registrosIcon,
  registros_leads: registrosIcon,
  solicitudes_leads: registrosIcon,
  blogs: contenidoIcon,
  usuarios: usuariosIcon,
  roles: rolIcon,
  movimientos: logsIcon,
  Operaciones: logsIcon,
  Comisiones: logsIcon,
  CarteraClientes: usuariosIcon,
};

export type NavGroupConfig = {
  label: string;
  icon: string;
  modules: ModuleKey[];
};

export const NAV_GROUP_CONFIGS: NavGroupConfig[] = [
  {
    label: "Clientes",
    icon: registrosIcon,
    modules: ["registros", "registros_leads", "solicitudes_leads", "Operaciones", "CarteraClientes"],
  },
  {
    label: "Contenido",
    icon: contenidoIcon,
    modules: ["blogs", "material"],
  },
  {
    label: "Administración",
    icon: usuariosIcon,
    modules: ["usuarios", "roles", "movimientos"],
  },
];

export const STANDALONE_MODULES = new Set<ModuleKey>([
  "dashboard",
  "Estadísticas",
  "propiedades",
  "desarrollos",
]);
