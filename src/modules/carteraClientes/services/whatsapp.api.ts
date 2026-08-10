import { apiRequest } from "@/shared/apiRequest";

export interface SendResult {
  sid: string;
  status: string;
}

export interface CampaignResult {
  total: number;
  sent: number;
  failed: number;
  detail: { phone: string; ok: boolean; sid: string | null; error: string | null }[];
}

export const sendWhatsapp = (to: string, body: string) =>
  apiRequest<SendResult>("/whatsapp/send", { method: "POST", data: { to, body } });

export const sendCampaign = (recipients: string[], body: string) =>
  apiRequest<CampaignResult>("/whatsapp/campaign", { method: "POST", data: { recipients, body } });

export const sendBirthday = (to: string, nombre: string) =>
  apiRequest<SendResult>("/whatsapp/send-birthday", { method: "POST", data: { to, nombre } });

export const sendFestividad = (to: string, nombre: string, mensaje: string) =>
  apiRequest<SendResult>("/whatsapp/send-festividad", { method: "POST", data: { to, nombre, mensaje } });

export interface FestividadCampaignResult {
  total: number;
  sent: number;
  failed: number;
  detail: { phone: string; ok: boolean; sid: string | null; error: string | null }[];
}

export const sendFestividadCampaign = (
  recipients: { telefono: string; nombre: string }[],
  mensaje: string,
) =>
  apiRequest<FestividadCampaignResult>("/whatsapp/campaign-festividad", {
    method: "POST",
    data: { recipients, mensaje },
  });
