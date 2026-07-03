import type { AppNotification } from "@/interfaces/notification.interface";
import type { BrowserNotificationPermissionState } from "@/modules/notifications/utils/browserNotifications";
import type { PushSubscriptionStatus } from "@/modules/notifications/utils/pushNotifications";
import { MODULE_LABELS } from "@/shared/auth/navigation.util";
import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";

export function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/modulos/registros-visitas")) return MODULE_LABELS.registros;
  if (pathname.startsWith("/modulos/registros-leads")) return MODULE_LABELS.registros_leads;
  if (pathname.startsWith("/modulos/solicitudes-leads")) return MODULE_LABELS.solicitudes_leads;
  if (pathname.startsWith("/modulos/")) {
    const rawModule = pathname.replace("/modulos/", "").split("/")[0] as ModuleKey;
    return MODULE_LABELS[rawModule] ?? "Módulo";
  }
  return "Dashboard";
}

export function getPushStatusLabel(
  permission: BrowserNotificationPermissionState,
  status: PushSubscriptionStatus,
): string {
  if (status === "subscribed") return "Activo";
  if (permission === "denied") return "Bloqueado";
  if (status === "unavailable") return "No disponible";
  if (permission === "granted") return "Conectando";
  return "Pendiente";
}

export function getPushStatusBadgeClass(
  permission: BrowserNotificationPermissionState,
  status: PushSubscriptionStatus,
): string {
  if (status === "subscribed") return "bg-emerald-100 text-emerald-700";
  if (permission === "denied") return "bg-rose-100 text-rose-700";
  if (status === "unavailable") return "bg-slate-200 text-slate-600";
  if (permission === "granted") return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
}

export function getNotificationIcon(notification: AppNotification): string {
  if (notification.tipo === "lead_asignado") return "L";
  if (notification.tipo === "recordatorio_cita_24h") return "24";
  if (notification.tipo === "recordatorio_cita_5h") return "5";
  return "N";
}

export function getNotificationIconClass(notification: AppNotification): string {
  if (notification.tipo === "lead_asignado") return "bg-emerald-100 text-emerald-700";
  if (notification.tipo === "recordatorio_cita_24h") return "bg-sky-100 text-sky-700";
  if (notification.tipo === "recordatorio_cita_5h") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export function getNotificationTypeLabel(notification: AppNotification): string {
  if (notification.tipo === "lead_asignado") return "Lead";
  if (notification.tipo === "recordatorio_cita_24h") return "24h";
  if (notification.tipo === "recordatorio_cita_5h") return "5h";
  return "General";
}

export function getNotificationActionLabel(notification: AppNotification): string {
  if (notification.modulo === "registros_leads") return "Abrir lead";
  if (notification.modulo === "registros") return "Abrir visita";
  return "Abrir";
}

export function getNotificationModuleLabel(module: string): string {
  if (module === "registros_leads") return "Registros leads";
  if (module === "registros") return "Registros visitas";
  return module;
}

export function getNotificationMomentLabel(notification: AppNotification): string {
  const referenceDate = notification.programada_para ?? notification.creada_en;
  if (!referenceDate) return "";
  if (notification.tipo.startsWith("recordatorio_cita_")) {
    return `Programada para ${formatNotificationDate(referenceDate)}`;
  }
  return formatNotificationDate(referenceDate);
}

function formatNotificationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
