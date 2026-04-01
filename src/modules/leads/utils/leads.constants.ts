export const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  agendado: { backgroundColor: '#CD8774', color: '#2F0905' },
  'en seguimiento': { backgroundColor: '#F3E8FF', color: '#C455DB' },
  'en espera': { backgroundColor: '#A8E5AC', color: '#12714F' },
  contactado: { backgroundColor: '#85CAE0', color: '#0355A1' },
  cancelado: { backgroundColor: '#FEF3C7', color: '#CA5874' },
  'cita agendada': { backgroundColor: '#CD8774', color: '#2F0905' },
  'en proceso': { backgroundColor: '#C455DB', color: '#F3E8FF' },
  cerrado: { backgroundColor: '#C3B28A', color: '#050505' },
};

export const PRIORITY_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  urgente: { backgroundColor: '#FEF3C7', color: '#CA5874' },
  normal: { backgroundColor: '#DBFCE7', color: '#4D8236' },
  'bajo interes': { backgroundColor: '#8E8E93', color: '#000000' },
};

export const OPERATION_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  venta: { backgroundColor: '#A8E5AC', color: '#12714F' },
  renta: { backgroundColor: '#85CAE0', color: '#0355A1' },
  'sub-renta': { backgroundColor: '#C455DB', color: '#F3E8FF' },
  compra: { backgroundColor: '#B50200', color: '#FFAF9D' },
  broker: { backgroundColor: '#793600', color: '#E9AE74' },
  inversion: { backgroundColor: '#1D5969', color: '#91C6D2' },
  asesoria: { backgroundColor: '#000000', color: '#FFFFFF' },
};

export const CHANNEL_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  youtube: { backgroundColor: '#B50200', color: '#FFAF9D' },
  'sitio web': { backgroundColor: '#1D5969', color: '#91C6D2' },
  facebook: { backgroundColor: '#85CAE0', color: '#0355A1' },
  tiktok: { backgroundColor: '#C455DB', color: '#F3E8FF' },
  instagram: { backgroundColor: '#FEE798', color: '#7C6D30' },
};

export const PAYMENT_METHOD_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  efectivo: { backgroundColor: '#A8E5AC', color: '#12714F' },
  'recursos propios': { backgroundColor: '#A8E5AC', color: '#12714F' },
  infonavit: { backgroundColor: '#B50200', color: '#FFAF9D' },
  cofinavit: { backgroundColor: '#85CAE0', color: '#0355A1' },
  fovissste: { backgroundColor: '#C455DB', color: '#F3E8FF' },
  'credito bancario': { backgroundColor: '#D3EDB9', color: '#419975' },
};

export const LEAD_SOURCE_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  organico: { backgroundColor: '#A8E5AC', color: '#12714F' },
  campana: { backgroundColor: '#B50200', color: '#FFAF9D' },
};

export const ALL_STATES = 'Todos los estados';
export const ALL_PRIORITIES = 'Todas las prioridades';
export const ALL_PROPERTIES = 'Todas las propiedades';

export const VISIT_STATUS_OPTIONS = ['Agendado', 'Cancelado', 'Cerrado'] as const;

export const LEAD_STATUS_OPTIONS = [
  'En seguimiento',
  'Cancelado',
  'Cita agendada',
  'En proceso',
  'Cerrado',
] as const;

export const LEAD_PRIORITY_OPTIONS = ['Urgente', 'Normal', 'Bajo Interes'] as const;

export const PAGE_SIZE = 10;
