type ExcelCell = string | number;

type DownloadTableAsExcelParams = {
  title: string;
  sheetName: string;
  fileName: string;
  headers: string[];
  rows: ExcelCell[][];
};

const TITLE_CELL_STYLE =
  "background:#0F172A;color:#FFFFFF;font-weight:700;font-size:18px;padding:14px 16px;border:1px solid #0F172A;text-align:left;";
const META_LABEL_STYLE =
  "background:#E2E8F0;color:#334155;font-weight:700;padding:8px 12px;border:1px solid #CBD5E1;text-align:left;";
const META_VALUE_STYLE =
  "background:#FFFFFF;color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;text-align:left;";
const HEADER_CELL_STYLE =
  "background:#312C85;color:#FFFFFF;font-weight:700;padding:10px 12px;border:1px solid #C7D2FE;text-align:left;";
const ODD_ROW_CELL_STYLE =
  "background:#FFFFFF;color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;text-align:left;vertical-align:top;";
const EVEN_ROW_CELL_STYLE =
  "background:#F8FAFC;color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;text-align:left;vertical-align:top;";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stringifyCellValue(value: ExcelCell): string {
  return typeof value === "number" ? value.toLocaleString("es-MX") : value;
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

  const headerRow = `
    <tr>
      ${headers
        .map(
          (header) =>
            `<td style="${HEADER_CELL_STYLE}">${escapeHtml(header)}</td>`,
        )
        .join("")}
    </tr>`;

  const dataRows = rows
    .map((columns, rowIndex) => {
      const rowStyle = rowIndex % 2 === 0 ? ODD_ROW_CELL_STYLE : EVEN_ROW_CELL_STYLE;

      return `
        <tr>
          ${columns
            .map(
              (column) =>
                `<td style="${rowStyle}">${escapeHtml(
                  stringifyCellValue(column),
                )}</td>`,
            )
            .join("")}
        </tr>`;
    })
    .join("");

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>${escapeHtml(sheetName)}</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                    <x:FitToPage/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
      </head>
      <body>
        <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-family:Segoe UI, Arial, sans-serif;min-width:960px;">
          <tr>
            <td colspan="${headers.length}" style="${TITLE_CELL_STYLE}">
              ${escapeHtml(title)}
            </td>
          </tr>
          <tr>
            <td style="${META_LABEL_STYLE}">Fecha de exportacion</td>
            <td colspan="${Math.max(headers.length - 1, 1)}" style="${META_VALUE_STYLE}">
              ${escapeHtml(generatedAt)}
            </td>
          </tr>
          <tr>
            <td style="${META_LABEL_STYLE}">Total de registros</td>
            <td colspan="${Math.max(headers.length - 1, 1)}" style="${META_VALUE_STYLE}">
              ${rows.length.toLocaleString("es-MX")}
            </td>
          </tr>
          <tr><td colspan="${headers.length}" style="height:10px;background:#FFFFFF;border:none;"></td></tr>
          ${headerRow}
          ${dataRows}
        </table>
      </body>
    </html>`;

  const blob = new Blob([`\ufeff${excelContent}`], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
