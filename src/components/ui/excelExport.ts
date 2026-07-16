import * as XLSX from "xlsx-js-style";
import { embedChartsAsNewSheet } from "./xlsxChartEmbed";

type ExcelCell = string | number;

export type DownloadTableAsExcelParams = {
  title: string;
  sheetName: string;
  fileName: string;
  headers: string[];
  rows: ExcelCell[][];
};

function stringifyCellValue(value: ExcelCell): string | number {
  return typeof value === "number"
    ? Number(value.toLocaleString("en-US").replace(/,/g, ""))
    : value;
}

function ensureXlsxFileName(fileName: string): string {
  const normalized = fileName.trim();
  if (!normalized) return "exportacion.xlsx";
  return normalized.toLowerCase().endsWith(".xlsx")
    ? normalized
    : normalized.replace(/\.xls$/i, "") + ".xlsx";
}

function getColumnWidth(values: Array<string | number>): number {
  let maxLength = 10;
  values.forEach((value) => {
    const nextLength = String(value ?? "").length;
    maxLength = Math.max(maxLength, nextLength);
  });
  return Math.min(Math.max(maxLength + 2, 12), 48);
}

function colLetter(index: number): string {
  let result = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

// ─── Colores marca Tamivar ────────────────────────────────────────────────
const BRAND       = "312C85";
const BRAND_DARK  = "1C1860";
const META_BG     = "EEEDFF";
const EVEN_ROW    = "F7F6FF";
const BORDER_CLR  = "CDCBDD";

const borderThin = {
  top:    { style: "thin", color: { rgb: BORDER_CLR } },
  bottom: { style: "thin", color: { rgb: BORDER_CLR } },
  left:   { style: "thin", color: { rgb: BORDER_CLR } },
  right:  { style: "thin", color: { rgb: BORDER_CLR } },
};

const S_TITLE = {
  font:      { bold: true, sz: 14, color: { rgb: "FFFFFF" }, name: "Calibri" },
  fill:      { patternType: "solid", fgColor: { rgb: BRAND } },
  alignment: { horizontal: "left", vertical: "center" },
};

const S_META_LABEL = {
  font:      { bold: true, sz: 10, color: { rgb: "4C4A7A" } },
  fill:      { patternType: "solid", fgColor: { rgb: META_BG } },
  alignment: { horizontal: "left", vertical: "center" },
};

const S_META_VALUE = {
  font:      { sz: 10, color: { rgb: "333266" } },
  fill:      { patternType: "solid", fgColor: { rgb: META_BG } },
  alignment: { horizontal: "left", vertical: "center" },
};

const S_HEADER = {
  font:      { bold: true, sz: 10, color: { rgb: "FFFFFF" }, name: "Calibri" },
  fill:      { patternType: "solid", fgColor: { rgb: BRAND } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    top:    { style: "thin",   color: { rgb: BRAND_DARK } },
    bottom: { style: "medium", color: { rgb: BRAND_DARK } },
    left:   { style: "thin",   color: { rgb: BRAND_DARK } },
    right:  { style: "thin",   color: { rgb: BRAND_DARK } },
  },
};

function S_DATA(isEven: boolean) {
  return {
    font:      { sz: 10, color: { rgb: "1A1A1A" } },
    fill:      { patternType: "solid", fgColor: { rgb: isEven ? EVEN_ROW : "FFFFFF" } },
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
    border:    borderThin,
  };
}

// ─── Construcción interna del workbook ───────────────────────────────────────

function buildWorkbook({ title, sheetName, headers, rows }: DownloadTableAsExcelParams): XLSX.WorkBook {
  const generatedAt = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const numCols  = headers.length;
  const lastCol  = colLetter(numCols - 1);
  const dataRows = rows.length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws: Record<string, any> = {};

  const put = (r: number, c: number, v: string | number, s?: object) => {
    ws[`${colLetter(c)}${r + 1}`] = {
      v,
      t: typeof v === "number" ? "n" : "s",
      ...(s ? { s } : {}),
    };
  };

  // Fila 0 — Título
  put(0, 0, title, S_TITLE);
  for (let c = 1; c < numCols; c++) put(0, c, "", S_TITLE);

  // Fila 1 — Fecha de exportación
  put(1, 0, "Fecha de exportación", S_META_LABEL);
  put(1, 1, generatedAt, S_META_VALUE);
  for (let c = 2; c < numCols; c++) put(1, c, "", S_META_VALUE);

  // Fila 2 — Total de registros
  put(2, 0, "Total de registros", S_META_LABEL);
  put(2, 1, dataRows, S_META_VALUE);
  for (let c = 2; c < numCols; c++) put(2, c, "", S_META_VALUE);

  // Fila 3 — Separador vacío
  for (let c = 0; c < numCols; c++) put(3, c, "");

  // Fila 4 — Encabezados
  headers.forEach((h, c) => put(4, c, h, S_HEADER));

  // Filas 5+ — Datos
  rows.forEach((row, ri) => {
    const style = S_DATA(ri % 2 === 0);
    row.forEach((cell, c) => {
      const v = stringifyCellValue(cell);
      put(5 + ri, c, v, style);
    });
  });

  ws["!ref"] = `A1:${lastCol}${5 + dataRows}`;

  ws["!cols"] = headers.map((header, i) => ({
    wch: getColumnWidth([
      header,
      ...rows.map((row) => row[i] ?? ""),
      i === 0 ? title : "",
      i === 1 ? generatedAt : "",
    ]),
  }));

  ws["!rows"] = [
    { hpt: 26 }, // título
    { hpt: 18 }, // fecha
    { hpt: 18 }, // total
    { hpt: 8  }, // separador
    { hpt: 28 }, // encabezados
    ...rows.map(() => ({ hpt: 20 })),
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    { s: { r: 1, c: 1 }, e: { r: 1, c: numCols - 1 } },
    { s: { r: 2, c: 1 }, e: { r: 2, c: numCols - 1 } },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  return workbook;
}

// ─── API pública ──────────────────────────────────────────────────────────────

export function downloadTableAsExcel(params: DownloadTableAsExcelParams) {
  XLSX.writeFile(buildWorkbook(params), ensureXlsxFileName(params.fileName), { compression: true });
}

/**
 * Genera el xlsx con datos, incrusta las imágenes PNG como una hoja adicional
 * y descarga el archivo resultante.
 */
export async function downloadTableAsExcelWithCharts(
  params: DownloadTableAsExcelParams,
  chartSheetName: string,
  pngBase64Images: string[],
): Promise<void> {
  const xlsxBytes = XLSX.write(buildWorkbook(params), {
    type: "array",
    bookType: "xlsx",
    compression: true,
  }) as Uint8Array;

  const blob = await embedChartsAsNewSheet(xlsxBytes, chartSheetName, pngBase64Images);

  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href    = url;
  a.download = ensureXlsxFileName(params.fileName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
