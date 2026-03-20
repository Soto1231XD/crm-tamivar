export const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  'en seguimiento': { backgroundColor: '#F3E8FF', color: '#C455DB' },
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

export const ALL_STATES = 'Todos los estados';
export const ALL_PRIORITIES = 'Todas las prioridades';
export const ALL_PROPERTIES = 'Todas las propiedades';

export const LEAD_STATUS_OPTIONS = [
  'En seguimiento',
  'Cancelado',
  'Cita agendada',
  'En proceso',
  'Cerrado',
] as const;

export const LEAD_PRIORITY_OPTIONS = ['Urgente', 'Normal', 'Bajo Interes'] as const;

export const PAGE_SIZE = 10;
