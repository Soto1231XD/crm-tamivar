import type { MovementRecord } from "@/interfaces/movement.interface";

const MODULE_LABELS: Record<string, string> = {
  auth: "Autenticacion",
  users: "Usuarios",
  roles: "Roles",
  properties: "Propiedades",
  registros: "Registros",
  blogs: "Blogs",
  dashboard: "Dashboard",
  movimientos: "Movimientos",
};

const HEADER_CELL_STYLE =
  "background:#E2E8F0;font-weight:700;color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;";
const VALUE_CELL_STYLE =
  "color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;";

export function normalizeMovementText(value?: string | null): string {
  if (!value) return "";

  return value
    .replaceAll("CreÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³", "Creo")
    .replaceAll("EditÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³", "Edito")
    .replaceAll("ActualizÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³", "Actualizo")
    .replaceAll("EliminÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³", "Elimino")
    .replaceAll("RealizÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³", "Realizo")
    .replaceAll("realizÃƒÆ’Ã‚Â³", "realizo")
    .replaceAll("ÃƒÆ’Ã‚Â¡", "a")
    .replaceAll("ÃƒÆ’Ã‚Â©", "e")
    .replaceAll("ÃƒÆ’Ã‚Â­", "i")
    .replaceAll("ÃƒÆ’Ã‚Â³", "o")
    .replaceAll("ÃƒÆ’Ã‚Âº", "u")
    .replaceAll("ÃƒÆ’Ã‚Â±", "n");
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getMethodBadgeClass(method: string): string {
  const normalized = method.toUpperCase();

  if (normalized === "GET") return "bg-sky-100 text-sky-700";
  if (normalized === "POST") return "bg-emerald-100 text-emerald-700";
  if (normalized === "PATCH") return "bg-amber-100 text-amber-700";
  if (normalized === "DELETE") return "bg-rose-100 text-rose-700";

  return "bg-slate-100 text-slate-700";
}

export function getStatusBadgeClass(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (statusCode >= 400 && statusCode < 500) {
    return "bg-amber-100 text-amber-700";
  }
  if (statusCode >= 500) {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-100 text-slate-700";
}

export function getModuleLabel(module?: string | null): string {
  if (!module) return "Sin modulo";
  return MODULE_LABELS[module] ?? module;
}

export function getActionLabel(action?: string | null): string {
  if (!action) return "Accion";

  const normalized = action.trim().toLowerCase();
  if (normalized === "crear") return "Creación";
  if (normalized === "editar") return "Edición";
  if (normalized === "actualizar") return "Actualización";
  if (normalized === "eliminar") return "Eliminación";

  return action;
}

export function getMethodLabel(method: string): string {
  const normalized = method.toUpperCase();
  if (normalized === "POST") return "Creación";
  if (normalized === "PATCH") return "Edición";
  if (normalized === "PUT") return "Actualización";
  if (normalized === "DELETE") return "Eliminación";
  if (normalized === "GET") return "Consulta";
  return method;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getMovementDetailText(movement: MovementRecord): string {
  return movement.usuario?.nombres
    ? `${movement.usuario.nombres} realizo un movimiento en ${getModuleLabel(
        movement.modulo,
      ).toLowerCase()}.`
    : "Movimiento ejecutado por el sistema.";
}

export function downloadMovementsAsExcel(movements: MovementRecord[]) {
  const rows = [
    [
      "ID",
      "Fecha",
      "Usuario",
      "Correo",
      "Tipo",
      "Modulo",
      "Movimiento",
      "Detalle",
      "Ruta",
      "Status",
    ],
    ...movements.map((movement) => [
      String(movement.id ?? ""),
      formatDate(movement.creado_en),
      movement.usuario?.nombres ?? "Sistema",
      movement.usuario?.correo_electronico ?? "Sin correo asociado",
      getMethodLabel(movement.metodo),
      getModuleLabel(movement.modulo),
      normalizeMovementText(movement.descripcion) || "Accion realizada",
      getMovementDetailText(movement),
      movement.ruta ?? "",
      String(movement.statusCode ?? ""),
    ]),
  ];

  const tableRows = rows
    .map(
      (columns, rowIndex) => `
        <tr>
          ${columns
            .map(
              (column) =>
                `<td style="${rowIndex === 0 ? HEADER_CELL_STYLE : VALUE_CELL_STYLE}">${escapeHtml(column)}</td>`,
            )
            .join("")}
        </tr>`,
    )
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
                  <x:Name>Movimientos</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1" cellspacing="0" cellpadding="0">
          ${tableRows}
        </table>
      </body>
    </html>`;

  const blob = new Blob([`\ufeff${excelContent}`], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "movimientos-filtrados.xls";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
