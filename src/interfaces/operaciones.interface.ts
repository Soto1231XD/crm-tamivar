export interface OperacionProceso {
  id: number;
  propietario: string;
  cliente: string;
  propiedad: string;
  fecha_inicio: string | null;
  estatus: string | null;
  etapa_expediente: string | null;
  etapa_documentos: string | null;
  etapa_avaluo: string | null;
  etapa_inscripcion: string | null;
  etapa_notaria: string | null;
  etapa_constancia: string | null;
  etapa_firma: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface OperacionFiniquitada {
  id: number;
  propietario: string;
  cliente: string;
  propiedad: string;
  fecha_firma: string | null;
  monto_operacion: string | null;
  estatus_pago: string | null;
  creado_en: string;
  actualizado_en: string;
  comision?: Comision | null;
}

export interface Comision {
  id: number;
  finiquitada_id: number | null;
  fecha: string | null;
  propiedad: string | null;
  comision_total: string | null;
  comision_tamivar: string | null;
  comision_extra: string | null;
  vendedor: string | null;
  contacto_vendedor: string | null;
  comprador: string | null;
  contacto_comprador: string | null;
  referido: string | null;
  contacto_referido: string | null;
  asesor_tamivar: string | null;
  monto_operacion: string | null;
  ganancias_mensuales: string | null;
  ganancias_anuales: string | null;
  creado_en: string;
  actualizado_en: string;
  finiquitada?: Pick<OperacionFiniquitada, "id" | "propietario" | "cliente" | "fecha_firma">;
}
