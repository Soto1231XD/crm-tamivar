import * as XLSX from 'xlsx-js-style';
import type { PropertyRecord } from '@/interfaces/property.interface';
import { calculateFinalPrice, formatCurrency, formatDireccion } from './formatters';

// ─── Colores marca Tamivar ────────────────────────────────────────────────────
const BRAND      = '312C85';
const BRAND_DARK = '1C1860';
const CAT_BG     = '7CB342';
const META_BG    = 'EEEDFF';
const EVEN_ROW   = 'F7F6FF';
const BORDER_CLR = 'CDCBDD';

const borderThin = {
  top:    { style: 'thin', color: { rgb: BORDER_CLR } },
  bottom: { style: 'thin', color: { rgb: BORDER_CLR } },
  left:   { style: 'thin', color: { rgb: BORDER_CLR } },
  right:  { style: 'thin', color: { rgb: BORDER_CLR } },
};

const S_TITLE = {
  font:      { bold: true, sz: 14, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
  fill:      { patternType: 'solid', fgColor: { rgb: BRAND } },
  alignment: { horizontal: 'left', vertical: 'center' },
};
const S_META_LABEL = {
  font:      { bold: true, sz: 10, color: { rgb: '4C4A7A' } },
  fill:      { patternType: 'solid', fgColor: { rgb: META_BG } },
  alignment: { horizontal: 'left', vertical: 'center' },
};
const S_META_VALUE = {
  font:      { sz: 10, color: { rgb: '333266' } },
  fill:      { patternType: 'solid', fgColor: { rgb: META_BG } },
  alignment: { horizontal: 'left', vertical: 'center' },
};
const S_HEADER = {
  font:      { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
  fill:      { patternType: 'solid', fgColor: { rgb: BRAND } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top:    { style: 'thin',   color: { rgb: BRAND_DARK } },
    bottom: { style: 'medium', color: { rgb: BRAND_DARK } },
    left:   { style: 'thin',   color: { rgb: BRAND_DARK } },
    right:  { style: 'thin',   color: { rgb: BRAND_DARK } },
  },
};
const S_CATEGORY = {
  font:      { bold: true, sz: 11, color: { rgb: '1A3300' }, name: 'Calibri', italic: true },
  fill:      { patternType: 'solid', fgColor: { rgb: CAT_BG } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top:    { style: 'medium', color: { rgb: '5A8A26' } },
    bottom: { style: 'medium', color: { rgb: '5A8A26' } },
    left:   { style: 'thin',   color: { rgb: '5A8A26' } },
    right:  { style: 'thin',   color: { rgb: '5A8A26' } },
  },
};
function S_DATA(isEven: boolean) {
  return {
    font:      { sz: 10, color: { rgb: '1A1A1A' } },
    fill:      { patternType: 'solid', fgColor: { rgb: isEven ? EVEN_ROW : 'FFFFFF' } },
    alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
    border:    borderThin,
  };
}

function colLetter(index: number): string {
  let result = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function getColumnWidth(values: Array<string | number>): number {
  let max = 10;
  values.forEach((v) => { max = Math.max(max, String(v ?? '').length); });
  return Math.min(Math.max(max + 2, 12), 48);
}

// ─── Helpers de datos ─────────────────────────────────────────────────────────

function getOperationSummary(property: PropertyRecord): string {
  if (!Array.isArray(property.esquema_comercial) || property.esquema_comercial.length === 0) {
    return 'Sin operacion';
  }
  return property.esquema_comercial
    .map((s) => s.tipo_operacion?.trim())
    .filter(Boolean)
    .join(', ');
}

function getPriceSummary(property: PropertyRecord): string {
  if (!Array.isArray(property.esquema_comercial) || property.esquema_comercial.length === 0) {
    return 'Sin precio';
  }
  return property.esquema_comercial
    .map((s) => {
      const { finalPrice } = calculateFinalPrice(s.precio, s.descuento_cantidad);
      return `${s.tipo_operacion}: ${formatCurrency(finalPrice)}`;
    })
    .join(' | ');
}

function getCreatorName(property: PropertyRecord): string {
  return [
    property.creador?.nombres?.trim(),
    property.creador?.apellido_paterno?.trim(),
  ].filter(Boolean).join(' ') || 'Sin asignar';
}

function propertyToRow(p: PropertyRecord): (string | number)[] {
  return [
    p.titulo?.trim() || 'Sin titulo',
    p.tipo_inmueble?.trim() || 'Sin tipo',
    getOperationSummary(p),
    formatDireccion(p.direccion),
    getPriceSummary(p),
    p.exclusiva ? 'Sí' : 'No',
    p.tiene_lona ? 'Sí' : 'No',
    getCreatorName(p),
    p.estatus?.trim() || 'Sin estado',
  ];
}

// ─── Exportación agrupada por categoría ──────────────────────────────────────

export function downloadPropertiesAsExcel(properties: PropertyRecord[]) {
  const headers = [
    'Propiedad',
    'Tipo de inmueble',
    'Operacion',
    'Direccion',
    'Precio (MXN)',
    'Exclusivo',
    'Lona',
    'Registrado por',
    'Estado',
  ];
  const numCols = headers.length;
  const lastColLetter = colLetter(numCols - 1);

  // Agrupar y ordenar por tipo_inmueble
  const groupMap = new Map<string, PropertyRecord[]>();
  for (const p of properties) {
    const key = p.tipo_inmueble?.trim() || 'Sin tipo';
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(p);
  }
  const groups = Array.from(groupMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b, 'es'),
  );

  const generatedAt = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws: Record<string, any> = {};
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];

  const put = (r: number, c: number, v: string | number, s?: object) => {
    ws[`${colLetter(c)}${r + 1}`] = {
      v,
      t: typeof v === 'number' ? 'n' : 's',
      ...(s ? { s } : {}),
    };
  };

  const rowHeights: { hpt: number }[] = [];

  // Filas de cabecera del reporte
  put(0, 0, 'Propiedades exportadas', S_TITLE);
  for (let c = 1; c < numCols; c++) put(0, c, '', S_TITLE);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } });
  rowHeights.push({ hpt: 26 });

  put(1, 0, 'Fecha de exportacion', S_META_LABEL);
  put(1, 1, generatedAt, S_META_VALUE);
  for (let c = 2; c < numCols; c++) put(1, c, '', S_META_VALUE);
  merges.push({ s: { r: 1, c: 1 }, e: { r: 1, c: numCols - 1 } });
  rowHeights.push({ hpt: 18 });

  put(2, 0, 'Total de registros', S_META_LABEL);
  put(2, 1, properties.length, S_META_VALUE);
  for (let c = 2; c < numCols; c++) put(2, c, '', S_META_VALUE);
  merges.push({ s: { r: 2, c: 1 }, e: { r: 2, c: numCols - 1 } });
  rowHeights.push({ hpt: 18 });

  // Fila separadora
  for (let c = 0; c < numCols; c++) put(3, c, '');
  rowHeights.push({ hpt: 8 });

  // Encabezados de columna
  headers.forEach((h, c) => put(4, c, h, S_HEADER));
  rowHeights.push({ hpt: 28 });

  // Secciones por categoría
  let currentRow = 5;
  for (const [categoria, items] of groups) {
    // Fila de categoría
    put(currentRow, 0, categoria, S_CATEGORY);
    for (let c = 1; c < numCols; c++) put(currentRow, c, '', S_CATEGORY);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: numCols - 1 } });
    rowHeights.push({ hpt: 22 });
    currentRow++;

    // Filas de datos
    items.forEach((p, ri) => {
      const row = propertyToRow(p);
      const style = S_DATA(ri % 2 === 0);
      row.forEach((cell, c) => put(currentRow, c, cell, style));
      rowHeights.push({ hpt: 20 });
      currentRow++;
    });
  }

  ws['!ref']    = `A1:${lastColLetter}${currentRow}`;
  ws['!merges'] = merges;
  ws['!rows']   = rowHeights;
  ws['!cols']   = headers.map((h, i) => ({
    wch: getColumnWidth([
      h,
      ...properties.map((p) => propertyToRow(p)[i] ?? ''),
      i === 0 ? 'Propiedades exportadas' : '',
      i === 1 ? generatedAt : '',
    ]),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');
  XLSX.writeFile(wb, 'propiedades-filtradas.xlsx', { compression: true });
}
