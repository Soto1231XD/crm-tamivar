import * as XLSX from "xlsx-js-style";
import type { Empleado } from "../../services/empleados.api";

// ── Paleta de colores ────────────────────────────────────────────────────────
const NAVY   = "1F3864";
const BLUE   = "2E4B8F";
const LBLUE  = "D6DCF0";
const WHITE  = "FFFFFF";
const EVN    = "EEF2FA";
const BORDER = "BBBBBB";

// ── Helpers de estilo ────────────────────────────────────────────────────────
type Border = { style: string; color: { rgb: string } };
const tb: Border = { style: "thin",   color: { rgb: BORDER } };
const mb: Border = { style: "medium", color: { rgb: NAVY   } };

const bAll  = { top: tb, bottom: tb, left: tb, right: tb };
const bMed  = { top: mb, bottom: mb, left: mb, right: mb };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = Record<string, any>;

const sTITLE: S = {
  font:      { bold: true, sz: 16, color: { rgb: WHITE }, name: "Calibri" },
  fill:      { patternType: "solid", fgColor: { rgb: NAVY } },
  alignment: { horizontal: "center", vertical: "center" },
};
const sMETA_L: S = {
  font:      { bold: true, sz: 10, color: { rgb: "333266" }, name: "Calibri" },
  fill:      { patternType: "solid", fgColor: { rgb: LBLUE } },
  alignment: { horizontal: "left", vertical: "center" },
  border:    bAll,
};
const sMETA_V: S = {
  font:      { sz: 10, color: { rgb: "333266" }, name: "Calibri" },
  fill:      { patternType: "solid", fgColor: { rgb: LBLUE } },
  alignment: { horizontal: "left", vertical: "center" },
  border:    bAll,
};
const sSEC: S = {
  font:      { bold: true, sz: 11, color: { rgb: WHITE }, name: "Calibri" },
  fill:      { patternType: "solid", fgColor: { rgb: BLUE } },
  alignment: { horizontal: "left", vertical: "center" },
  border:    bMed,
};
const sCOL: S = {
  font:      { bold: true, sz: 10, color: { rgb: WHITE }, name: "Calibri" },
  fill:      { patternType: "solid", fgColor: { rgb: BLUE } },
  alignment: { horizontal: "center", vertical: "center" },
  border:    bAll,
};
const sOBS: S = {
  font:      { bold: true, sz: 11, color: { rgb: WHITE }, name: "Calibri" },
  fill:      { patternType: "solid", fgColor: { rgb: NAVY } },
  alignment: { horizontal: "left", vertical: "center" },
  border:    bMed,
};

function sData(even: boolean): S {
  return {
    font:      { sz: 10, name: "Calibri" },
    fill:      { patternType: "solid", fgColor: { rgb: even ? EVN : WHITE } },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border:    bAll,
  };
}
function sChk(even: boolean): S {
  return {
    fill:      { patternType: "solid", fgColor: { rgb: even ? EVN : WHITE } },
    alignment: { horizontal: "center", vertical: "center" },
    border:    bAll,
  };
}
function sEmpty(): S {
  return { fill: { patternType: "solid", fgColor: { rgb: WHITE } } };
}

// ── Columnas (índices 0-7 = A-H) ─────────────────────────────────────────────
// A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7
const COLS = "ABCDEFGH";
const W = [2, 42, 6, 6, 2, 50, 6, 6]; // wch

// ── Datos ────────────────────────────────────────────────────────────────────
const EXPEDIENTE = [
  "INE / Identificación oficial",
  "CURP",
  "RFC",
  "Acta de nacimiento",
  "Comprobante de domicilio",
  "Número de Seguro Social (NSS)",
  "(2) Fotografías tamaño infantil",
  "Firma de formato de Uso de Imagen",
  "Responsiva firmada por equipo de Teléfono",
  "Responsiva por uso de Vehículo",
  "Responsiva por uso de Computadora",
  "Responsiva por uso de Tarjeta",
  "Solicitud de empleo / CV",
  "Pruebas psicométricas",
];

const CONSTANCIAS = [
  "Constancia anual de antigüedad y periodo de vacaciones (Art. 81 LFT)",
  "Constancia de uso anticipado de vacaciones",
  "Constancia de permiso de falta sin goce de sueldo",
  "Constancia de permiso de falta con goce de sueldo y recuperación de horas laborales",
];

const PRESTACIONES = [
  "Días de descanso",
  "Vacaciones y prima vacacional",
  "Aguinaldo",
];

const OBLIGACIONES = [
  "III.       El trabajador cuenta con los útiles, instrumentos y materiales necesarios para la ejecución de su trabajo.",
  "VII.       Expedición quincenal de constancia de días trabajados y salario percibido.",
  "XVI.       Instalar y operar la oficina de acuerdo a las NOM en materia de seguridad, salud y medio ambiente de trabajo, a efecto de prevenir accidentes y enfermedades laborales.",
  "XVIII.    Fijar visiblemente y difundir en el trabajo las NOM en materia de seguridad, salud y medio ambiente de trabajo.",
  "XXV.      Contribuir al fomento de las actividades culturales y del deporte entre los trabajadores y proporcionarles los equipos y útiles indispensables.",
  "XXVI BIS.   Afiliar al centro de trabajo al Instituto del Fondo Nacional para el Consumo de los Trabajadores (FONACOT).",
  "XXVII BIS.  Otorgar permiso de paternidad de cinco días laborales con goce de sueldo por el nacimiento u adopción de un infante.",
  "XXVIII.  Participar en la integración y funcionamiento de las comisiones que deban formarse en cada centro de trabajo.",
];

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

// ── Generador ─────────────────────────────────────────────────────────────────
export function generarAuditoriaLaboral(empleado: Empleado): void {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim().toUpperCase();
  const hoy    = new Date();
  const fecha  = `${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws: Record<string, any> = {};
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  const rows: { hpt: number }[] = [];

  let r = 0;

  const put = (row: number, col: number, v: string, s?: S) => {
    ws[`${COLS[col]}${row + 1}`] = { v, t: "s", ...(s ? { s } : {}) };
  };
  const mg = (r1: number, c1: number, r2: number, c2: number) =>
    merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
  const hpt = (h: number) => rows.push({ hpt: h });

  // ── r=0: Título ──────────────────────────────────────────────────────────
  put(r, 0, "AUDITORÍA LABORAL", sTITLE);
  for (let c = 1; c < 8; c++) put(r, c, "", sTITLE);
  mg(r, 0, r, 7); hpt(32); r++;

  // ── r=1: Trabajador ──────────────────────────────────────────────────────
  put(r, 0, "Trabajador:", sMETA_L);
  put(r, 1, nombre, sMETA_V);
  mg(r, 1, r, 3);
  put(r, 4, "", sEmpty());
  put(r, 5, "Puesto:", sMETA_L);
  put(r, 6, empleado.puesto, sMETA_V);
  mg(r, 6, r, 7);
  hpt(20); r++;

  // ── r=2: Área / Fecha ────────────────────────────────────────────────────
  put(r, 0, "Área:", sMETA_L);
  put(r, 1, empleado.area, sMETA_V);
  mg(r, 1, r, 3);
  put(r, 4, "", sEmpty());
  put(r, 5, "Fecha de auditoría:", sMETA_L);
  put(r, 6, fecha, sMETA_V);
  mg(r, 6, r, 7);
  hpt(20); r++;

  // ── r=3: Spacer ──────────────────────────────────────────────────────────
  for (let c = 0; c < 8; c++) put(r, c, "", sEmpty()); hpt(8); r++;

  // ── r=4: Cabeceras de sección ─────────────────────────────────────────────
  put(r, 0, "", sEmpty());
  put(r, 1, "I.   EXPEDIENTE DEL TRABAJADOR", sSEC);
  mg(r, 1, r, 3);
  put(r, 4, "", sEmpty());
  put(r, 5, "III.  PRESTACIONES", sSEC);
  mg(r, 5, r, 7);
  hpt(22); r++;

  // ── r=5: Cabeceras de columna ────────────────────────────────────────────
  put(r, 0, "", sEmpty());
  put(r, 1, "DOCUMENTO / DESCRIPCIÓN", sCOL);
  put(r, 2, "SÍ", sCOL);
  put(r, 3, "NO", sCOL);
  put(r, 4, "", sEmpty());
  put(r, 5, "CONCEPTO", sCOL);
  put(r, 6, "SÍ", sCOL);
  put(r, 7, "NO", sCOL);
  hpt(22); r++;

  // ── r=6-19: Expediente (izq) + Prestaciones/Obligaciones (der) ───────────
  // Right side: prestaciones[0-2] en r=6-8, sección header en r=9, obligaciones[0-7] en r=10-17
  const dataStart = r;
  const totalLeft = EXPEDIENTE.length; // 14

  for (let i = 0; i < totalLeft; i++) {
    const even = i % 2 === 0;
    // Izquierda
    put(r, 0, "", sEmpty());
    put(r, 1, EXPEDIENTE[i], sData(even));
    put(r, 2, "", sChk(even));
    put(r, 3, "", sChk(even));
    put(r, 4, "", sEmpty());

    // Derecha: r=6-8 prestaciones, r=9 sección header obligaciones, r=10-17 obligaciones
    const rIdx = r - dataStart; // 0-13
    if (rIdx < PRESTACIONES.length) {
      put(r, 5, PRESTACIONES[rIdx], sData(even));
      put(r, 6, "", sChk(even));
      put(r, 7, "", sChk(even));
    } else if (rIdx === PRESTACIONES.length) {
      // Cabecera sección obligaciones
      put(r, 5, "IV.  OBLIGACIONES DEL PATRÓN (ART. LFT)", sSEC);
      mg(r, 5, r, 7);
    } else {
      const oi = rIdx - PRESTACIONES.length - 1; // índice en OBLIGACIONES
      if (oi < OBLIGACIONES.length) {
        put(r, 5, OBLIGACIONES[oi], sData(even));
        put(r, 6, "", sChk(even));
        put(r, 7, "", sChk(even));
      } else {
        put(r, 5, "", sData(even));
        put(r, 6, "", sChk(even));
        put(r, 7, "", sChk(even));
      }
    }

    // Alto de fila: obligaciones largas necesitan más espacio
    const oi = rIdx - PRESTACIONES.length - 1;
    hpt(oi >= 0 && oi < OBLIGACIONES.length ? 42 : 22);
    r++;
  }

  // ── Spacer ────────────────────────────────────────────────────────────────
  for (let c = 0; c < 8; c++) put(r, c, "", sEmpty()); hpt(10); r++;

  // ── Sección II: Constancias ───────────────────────────────────────────────
  put(r, 0, "", sEmpty());
  put(r, 1, "II.  CONSTANCIAS LABORALES", sSEC);
  mg(r, 1, r, 7);
  put(r, 4, "", sEmpty());
  for (let c = 5; c < 8; c++) put(r, c, "", sSEC);
  hpt(22); r++;

  // Col headers constancias
  put(r, 0, "", sEmpty());
  put(r, 1, "DOCUMENTO / DESCRIPCIÓN", sCOL);
  put(r, 2, "SÍ", sCOL);
  put(r, 3, "NO", sCOL);
  put(r, 4, "", sEmpty());
  for (let c = 5; c < 8; c++) put(r, c, "", sEmpty());
  hpt(20); r++;

  CONSTANCIAS.forEach((txt, i) => {
    const even = i % 2 === 0;
    put(r, 0, "", sEmpty());
    put(r, 1, txt, sData(even));
    put(r, 2, "", sChk(even));
    put(r, 3, "", sChk(even));
    for (let c = 4; c < 8; c++) put(r, c, "", sEmpty());
    hpt(38); r++;
  });

  // ── Spacer ────────────────────────────────────────────────────────────────
  for (let c = 0; c < 8; c++) put(r, c, "", sEmpty()); hpt(10); r++;

  // ── Observaciones ─────────────────────────────────────────────────────────
  put(r, 0, "OBSERVACIONES", sOBS);
  mg(r, 0, r, 7);
  for (let c = 1; c < 8; c++) put(r, c, "", sOBS);
  hpt(22); r++;

  const obsField = (label: string, value: string, h: number) => {
    put(r, 0, label, sMETA_L);
    mg(r, 0, r, 1);
    put(r, 2, value, sMETA_V);
    mg(r, 2, r, 7);
    for (let c = 1; c < 8; c++) if (c !== 2) put(r, c, "", c <= 1 ? sMETA_L : sMETA_V);
    hpt(h); r++;
  };

  obsField("Área / Departamento:", empleado.area, 20);
  obsField("Fecha de auditoría:", fecha, 20);
  obsField("Jornada laboral:", "", 20);
  obsField("Observaciones generales:", "", 60);

  // ── Cierre ────────────────────────────────────────────────────────────────
  ws["!ref"]    = `A1:H${r}`;
  ws["!merges"] = merges;
  ws["!cols"]   = W.map(wch => ({ wch }));
  ws["!rows"]   = rows;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nombre.slice(0, 31));
  XLSX.writeFile(wb, `Auditoria_Laboral_${nombre.replace(/\s+/g, "_")}.xlsx`);
}
