export interface ClienteCartera {
  id: number;
  nombre: string;
  cumple_dia: number | null;
  cumple_mes: number | null;
  telefono: string | null;
  tipo: string | null;
  propiedad: string | null;
  ubicacion: string | null;
  referencia: string | null;
  telefono_referencia: string | null;
  sms_post_venta: string | null;
  creado_en: string;
  actualizado_en: string;
}
