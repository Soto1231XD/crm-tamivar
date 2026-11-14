import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  AlignmentType,
  UnderlineType,
  TabStopType,
} from "docx";
import type { Empleado } from "../../services/empleados.api";
import type { Vacacion } from "../../services/vacaciones.api";
import type { PermisoEmpleado } from "../../services/permisos.api";
import type { NominaEmpleado } from "../../services/nominas.api";
import { calcularDerechoVacaciones } from "../../services/vacaciones.api";

export {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, UnderlineType, TabStopType,
};
export type { Empleado, Vacacion, PermisoEmpleado, NominaEmpleado };
export { calcularDerechoVacaciones };

export const FONT = "Arial";
export const SIZE_BODY = 20;  
export const SIZE_TITLE = 22;  
export const SIZE_HEAD = 24;   

export const MESES_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];
export const MESES_UP = MESES_ES.map((m) => m.toUpperCase());

export function fechaLarga(d: Date): string {
  return `${d.getDate()} DE ${MESES_UP[d.getMonth()]} DEL ${d.getFullYear()}`;
}

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function calcAntiguedadExacta(fechaIngreso: string) {
  const ing = parseLocalDate(fechaIngreso);
  const hoy = new Date();
  let años  = hoy.getFullYear() - ing.getFullYear();
  let meses = hoy.getMonth()    - ing.getMonth();
  let dias  = hoy.getDate()     - ing.getDate();
  if (dias < 0)  { meses--; dias  += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate(); }
  if (meses < 0) { años--;  meses += 12; }
  return { años: Math.max(0, años), meses: Math.max(0, meses), dias: Math.max(0, dias) };
}

export function enteroALetras(n: number): string {
  if (n === 0) return "CERO";
  const uns  = ["","UNO","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE"];
  const spec = ["DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE",
                "DIECISÉIS","DIECISIETE","DIECIOCHO","DIECINUEVE"];
  const decs = ["","","VEINTE","TREINTA","CUARENTA","CINCUENTA",
                "SESENTA","SETENTA","OCHENTA","NOVENTA"];
  const cents = ["","CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS",
                "SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];
  if (n < 10)  return uns[n];
  if (n < 20)  return spec[n - 10];
  if (n === 20) return "VEINTE";
  if (n < 30)  return "VEINTI" + uns[n - 20].toLowerCase();
  if (n < 100) { const d = Math.floor(n/10), u = n%10; return decs[d] + (u ? " Y " + uns[u] : ""); }
  if (n === 100) return "CIEN";
  if (n < 1000) { const c = Math.floor(n/100), r = n%100; return cents[c] + (r ? " " + enteroALetras(r) : ""); }
  if (n < 2000) return "MIL" + (n%1000 ? " " + enteroALetras(n%1000) : "");
  const miles = Math.floor(n/1000), r = n%1000;
  return enteroALetras(miles) + " MIL" + (r ? " " + enteroALetras(r) : "");
}

export function montoALetras(monto: number): string {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  return `${enteroALetras(entero)} PESOS ${String(centavos).padStart(2,"0")}/100 M.N.`;
}

export function formatMonto(n: number) {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function run(text: string, opts: { bold?: boolean; under?: boolean; size?: number } = {}): TextRun {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? SIZE_BODY,
    bold: opts.bold,
    underline: opts.under ? { type: UnderlineType.SINGLE } : undefined,
  });
}

export function para(
  children: TextRun[],
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED,
  after = 120,
): Paragraph {
  return new Paragraph({ alignment: align, spacing: { after }, children });
}

export const blank = () => new Paragraph({ spacing: { after: 160 } });

export async function descargar(doc: Document, nombre: string) {
  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: nombre });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
