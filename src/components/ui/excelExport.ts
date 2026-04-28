import * as XLSX from "xlsx";

type ExcelCell = string | number;

type DownloadTableAsExcelParams = {
  title: string;
  sheetName: string;
  fileName: string;
  headers: string[];
  rows: ExcelCell[][];
};

function stringifyCellValue(value: ExcelCell): string | number {
  return typeof value === "number" ? Number(value.toLocaleString("en-US").replace(/,/g, "")) : value;
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

export function downloadTableAsExcel({
  title,
  sheetName,
  fileName,
  headers,
  rows,
}: DownloadTableAsExcelParams) {
  const generatedAt = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const worksheetData: Array<Array<string | number>> = [
    [title],
    ["Fecha de exportacion", generatedAt],
    ["Total de registros", rows.length],
    [],
    headers,
    ...rows.map((columns) => columns.map(stringifyCellValue)),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = headers.map((header, index) => ({
    wch: getColumnWidth([
      header,
      ...rows.map((row) => row[index] ?? ""),
      index === 0 ? title : "",
      index === 1 ? generatedAt : "",
    ]),
  }));

  const lastColumnIndex = Math.max(headers.length - 1, 0);
  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: lastColumnIndex },
    },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, ensureXlsxFileName(fileName), {
    compression: true,
  });
}
