export type StatusStyle = {
  backgroundColor: string;
  color: string;
};

const DEFAULT_STYLE: StatusStyle = {
  backgroundColor: '#E2E8F0',
  color: '#334155',
};

const STATUS_STYLES: Record<string, StatusStyle> = {
  agendado: { backgroundColor: '#FEF3C7', color: '#B45309' },
  'en seguimiento': { backgroundColor: '#F3E8FF', color: '#7E22CE' },
  'en espera': { backgroundColor: '#DCFCE7', color: '#166534' },
  contactado: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  cancelado: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
  'cita agendada': { backgroundColor: '#FDE68A', color: '#92400E' },
  'cita cerrada': { backgroundColor: '#E0F2FE', color: '#0369A1' },
  'en proceso': { backgroundColor: '#EDE9FE', color: '#6D28D9' },
  cerrado: { backgroundColor: '#DCFCE7', color: '#166534' },
  activo: { backgroundColor: '#DCFCE7', color: '#166534' },
  disponible: { backgroundColor: '#DCFCE7', color: '#166534' },
  apartado: { backgroundColor: '#FEF9C3', color: '#A16207' },
  vendido: { backgroundColor: '#F3F4F6', color: '#374151' },
  baja: { backgroundColor: '#FEE2E2', color: '#991B1B' },
};

const PRIORITY_STYLES: Record<string, StatusStyle> = {
  urgente: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
  normal: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  'bajo interes': { backgroundColor: '#F3F4F6', color: '#4B5563' },
};

const OPERATION_STYLES: Record<string, StatusStyle> = {
  venta: { backgroundColor: '#DCFCE7', color: '#166534' },
  renta: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  preventa: { backgroundColor: '#EDE9FE', color: '#6D28D9' },
  'sub-renta': { backgroundColor: '#EDE9FE', color: '#6D28D9' },
  compra: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
  broker: { backgroundColor: '#FFEDD5', color: '#9A3412' },
  inversion: { backgroundColor: '#CFFAFE', color: '#0F766E' },
  asesoria: { backgroundColor: '#E2E8F0', color: '#0F172A' },
};

const CHANNEL_STYLES: Record<string, StatusStyle> = {
  youtube: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
  'sitio web': { backgroundColor: '#CFFAFE', color: '#0F766E' },
  facebook: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  tiktok: { backgroundColor: '#EDE9FE', color: '#6D28D9' },
  instagram: { backgroundColor: '#FEF3C7', color: '#B45309' },
};

const PAYMENT_METHOD_STYLES: Record<string, StatusStyle> = {
  efectivo: { backgroundColor: '#DCFCE7', color: '#166534' },
  'recursos propios': { backgroundColor: '#DCFCE7', color: '#166534' },
  infonavit: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
  cofinavit: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  fovissste: { backgroundColor: '#EDE9FE', color: '#6D28D9' },
  'credito bancario': { backgroundColor: '#DCFCE7', color: '#166534' },
  issfam: { backgroundColor: '#E0F2FE', color: '#0369A1' },
  otro: { backgroundColor: '#F3F4F6', color: '#4B5563' },
};

const LEAD_SOURCE_STYLES: Record<string, StatusStyle> = {
  organico: { backgroundColor: '#DCFCE7', color: '#166534' },
  campana: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
};

const PUBLICATION_STYLES = {
  published: { backgroundColor: '#DCFCE7', color: '#166534' },
  draft: { backgroundColor: '#FEF3C7', color: '#B45309' },
} as const;

export function normalizeStatusKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getStatusStyles(value: string): StatusStyle {
  return STATUS_STYLES[normalizeStatusKey(value)] ?? DEFAULT_STYLE;
}

export function getPropertyStatusStyles(value: string): StatusStyle {
  return STATUS_STYLES[normalizeStatusKey(value)] ?? DEFAULT_STYLE;
}

export function getPriorityStyles(value: string): StatusStyle {
  return PRIORITY_STYLES[normalizeStatusKey(value)] ?? DEFAULT_STYLE;
}

export function getOperationStyles(value: string): StatusStyle {
  return OPERATION_STYLES[normalizeStatusKey(value)] ?? DEFAULT_STYLE;
}

export function getChannelStyles(value: string): StatusStyle {
  return CHANNEL_STYLES[normalizeStatusKey(value)] ?? DEFAULT_STYLE;
}

export function getPaymentMethodStyles(value: string): StatusStyle {
  return PAYMENT_METHOD_STYLES[normalizeStatusKey(value)] ?? DEFAULT_STYLE;
}

export function getLeadSourceStyles(value: string): StatusStyle {
  return LEAD_SOURCE_STYLES[normalizeStatusKey(value)] ?? DEFAULT_STYLE;
}

export function getPublicationStatusStyles(publicado?: boolean | null): StatusStyle {
  return publicado ? PUBLICATION_STYLES.published : PUBLICATION_STYLES.draft;
}
