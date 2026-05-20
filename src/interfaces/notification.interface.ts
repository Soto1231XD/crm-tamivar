export type AppNotification = {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  modulo: string;
  referencia_id?: number | null;
  referencia_tipo?: string | null;
  programada_para?: string | null;
  leida_en?: string | null;
  creada_en: string;
  actualizada_en?: string;
  meta?: Record<string, unknown> | null;
};

export type NotificationCountResponse = {
  count: number;
};

export type PushPublicKeyResponse = {
  publicKey: string | null;
  enabled: boolean;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: string | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};
