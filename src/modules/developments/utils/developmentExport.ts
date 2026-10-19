import { downloadTableAsExcel } from '@/components/ui/excelExport';
import type { DevelopmentRecord } from '@/interfaces/development.interface';

function getPriceSummary(development: DevelopmentRecord): string {
  const modelSchemes = (development.modelos ?? []).flatMap((m) =>
    (m.esquema_comercial ?? []).map((s) => ({
      operacion: s.tipo_operacion,
      precio: Number(s.precio),
      modelo: m.nombre,
    })),
  );

  if (modelSchemes.length === 0) return 'Sin precio';

  return modelSchemes
    .filter((s) => s.precio > 0)
    .map((s) => `${s.modelo} (${s.operacion}): $${s.precio.toLocaleString('es-MX')}`)
    .join(' | ') || 'Sin precio';
}

function getOperationSummary(development: DevelopmentRecord): string {
  const ops = Array.from(
    new Set(
      (development.modelos ?? [])
        .flatMap((m) => m.esquema_comercial ?? [])
        .map((s) => s.tipo_operacion?.trim())
        .filter(Boolean),
    ),
  );
  return ops.length > 0 ? ops.join(', ') : 'Sin operación';
}

function getModelosSummary(development: DevelopmentRecord): string {
  if (!development.modelos?.length) return 'Sin modelos';
  return development.modelos.map((m) => m.nombre).join(', ');
}

function getEntregaSummary(development: DevelopmentRecord): string {
  if (development.entrega_inmediata) return 'Inmediata';
  if (development.fecha_entrega) return development.fecha_entrega.slice(0, 7);
  return 'Por definir';
}

export function downloadDevelopmentsAsExcel(developments: DevelopmentRecord[]) {
  const headers = [
    'Desarrollo',
    'Estado',
    'Operación',
    'Modelos',
    'Precio (MXN)',
    'Entrega',
    'Fraccionamiento',
    'Municipio',
    'Estado/Prov.',
  ];

  const rows = developments.map((d) => [
    d.titulo?.trim() || 'Sin título',
    d.estatus?.trim() || 'Sin estado',
    getOperationSummary(d),
    getModelosSummary(d),
    getPriceSummary(d),
    getEntregaSummary(d),
    d.direccion?.fraccionamiento?.trim() || '-',
    d.direccion?.municipio?.trim() || '-',
    d.direccion?.estado?.trim() || '-',
  ]);

  downloadTableAsExcel({
    title: 'Desarrollos exportados',
    sheetName: 'Desarrollos',
    fileName: 'desarrollos-filtrados.xlsx',
    headers,
    rows,
  });
}
