import { downloadTableAsExcel } from '@/components/ui/excelExport';
import type { PropertyRecord } from '@/interfaces/property.interface';
import { calculateFinalPrice, formatCurrency, formatDireccion } from './formatters';

function getOperationSummary(property: PropertyRecord): string {
  if (!Array.isArray(property.esquema_comercial) || property.esquema_comercial.length === 0) {
    return 'Sin operacion';
  }

  return property.esquema_comercial
    .map((scheme) => scheme.tipo_operacion?.trim())
    .filter(Boolean)
    .join(', ');
}

function getPriceSummary(property: PropertyRecord): string {
  if (!Array.isArray(property.esquema_comercial) || property.esquema_comercial.length === 0) {
    return 'Sin precio';
  }

  return property.esquema_comercial
    .map((scheme) => {
      const { finalPrice } = calculateFinalPrice(
        scheme.precio,
        scheme.descuento_cantidad,
      );

      return `${scheme.tipo_operacion}: ${formatCurrency(finalPrice)}`;
    })
    .join(' | ');
}

function getCreatorName(property: PropertyRecord): string {
  const parts = [
    property.creador?.nombres?.trim(),
    property.creador?.apellido_paterno?.trim(),
  ].filter(Boolean);

  return parts.join(' ') || 'Sin asignar';
}

export function downloadPropertiesAsExcel(properties: PropertyRecord[]) {
  const headers = [
    'Propiedad',
    'Tipo de inmueble',
    'Operacion',
    'Direccion',
    'Precio (MXN)',
    'Registrado por',
    'Estado',
  ];

  const rows = properties.map((property) => [
    property.titulo?.trim() || 'Sin titulo',
    property.tipo_inmueble?.trim() || 'Sin tipo',
    getOperationSummary(property),
    formatDireccion(property.direccion),
    getPriceSummary(property),
    getCreatorName(property),
    property.estatus?.trim() || 'Sin estado',
  ]);

  downloadTableAsExcel({
    title: 'Propiedades exportadas',
    sheetName: 'Propiedades',
    fileName: 'propiedades-filtradas.xls',
    headers,
    rows,
  });
}
