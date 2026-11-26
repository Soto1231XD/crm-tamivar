import ExcelJS from "exceljs";
import type { Empleado } from "../../services/empleados.api";
import { getFullImageUrl } from "@/shared/utils/imageUrl";
import logoUrl from "@/assets/images/cv-logo.png";

// ── Paleta (ARGB para ExcelJS: FF + hex) ────────────────────────────────────
const NAVY   = "FF1F3864";
const BLUE   = "FF2E4B8F";
const LBLUE  = "FFD6DCF0";
const WHITE  = "FFFFFFFF";
const LGRAY  = "FFF5F7FB";
const BORDER = "FFBBBBBB";

// ── Bordes ───────────────────────────────────────────────────────────────────
const tThin = { style: "thin"   as const, color: { argb: BORDER } };
const tMed  = { style: "medium" as const, color: { argb: NAVY   } };
const bAll  = { top: tThin, bottom: tThin, left: tThin, right: tThin };
const bMed  = { top: tMed,  bottom: tMed,  left: tMed,  right: tMed  };

type EC = any; 

function applyTitle(c: EC) {
  c.font      = { bold: true, size: 16, color: { argb: WHITE }, name: "Calibri" };
  c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY  } };
  c.alignment = { horizontal: "center", vertical: "middle" };
  c.border    = bMed;
}
function applySec(c: EC) {
  c.font      = { bold: true, size: 11, color: { argb: WHITE }, name: "Calibri" };
  c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE  } };
  c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  c.border    = bMed;
}
function applyLbl(c: EC) {
  c.font      = { bold: true, size: 10, color: { argb: NAVY  }, name: "Calibri" };
  c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: LBLUE } };
  c.alignment = { horizontal: "left", vertical: "middle" };
  c.border    = bAll;
}
function applyVal(c: EC, center = false) {
  c.font      = { size: 10, name: "Calibri" };
  c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
  c.alignment = { horizontal: center ? "center" : "left", vertical: "middle", wrapText: true };
  c.border    = bAll;
}
function applyNombre(c: EC) {
  c.font      = { bold: true, size: 13, color: { argb: NAVY  }, name: "Calibri" };
  c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: LGRAY } };
  c.alignment = { horizontal: "center", vertical: "middle" };
  c.border    = bAll;
}
function applyCol(c: EC) {
  c.font      = { bold: true, size: 10, color: { argb: WHITE }, name: "Calibri" };
  c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE  } };
  c.alignment = { horizontal: "center", vertical: "middle" };
  c.border    = bAll;
}
function applyImg(c: EC) {
  c.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: LGRAY } };
  c.border = bMed;
}

const MESES = ["enero","febrero","marzo","abril","mayo","junio",
               "julio","agosto","septiembre","octubre","noviembre","diciembre"];

async function fetchBase64(url: string): Promise<{ data: string; ext: "png" | "jpeg" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext: "png" | "jpeg" = blob.type.includes("png") ? "png" : "jpeg";
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve({ data: (reader.result as string).split(",")[1], ext });
      reader.onerror = () => reject(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Centra la imagen (manteniendo proporción) en un canvas de tamaño fijo.
// Fondo blanco. Se usa con placement por rango para centrado perfecto.
function centerImageInCanvas(
  base64: string,
  ext: "png" | "jpeg",
  canvasW: number,
  canvasH: number,
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) { resolve(null); return; }
      const scale = Math.min(canvasW / iw, canvasH / ih);
      const dw = Math.round(iw * scale);
      const dh = Math.round(ih * scale);
      const canvas = document.createElement("canvas");
      canvas.width  = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.drawImage(
        img,
        Math.round((canvasW - dw) / 2),
        Math.round((canvasH - dh) / 2),
        dw, dh,
      );
      resolve(canvas.toDataURL("image/jpeg", 0.9).split(",")[1]);
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/${ext === "png" ? "png" : "jpeg"};base64,${base64}`;
  });
}

export async function generarCaratulaExpediente(empleado: Empleado): Promise<void> {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim().toUpperCase();
  const hoy   = new Date();
  const fecha = `${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`;

  let fechaIngreso = empleado.fecha_ingreso ?? "";
  if (fechaIngreso) {
    const fi = new Date(fechaIngreso + "T12:00:00");
    fechaIngreso = `${fi.getDate()} de ${MESES[fi.getMonth()]} de ${fi.getFullYear()}`;
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(nombre.slice(0, 31));

  const colWidths = [22, 20, 12, 2, 20, 18, 10];
  colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  const cl  = (r: number, c: number) => ws.getCell(r, c);
  const mg  = (r1: number, c1: number, r2: number, c2: number) => ws.mergeCells(r1, c1, r2, c2);
  const rh  = (r: number, h: number) => { ws.getRow(r).height = h; };

  const lblMg = (r: number, c1: number, c2: number, text: string) => {
    if (c1 !== c2) mg(r, c1, r, c2);
    const c = cl(r, c1); c.value = text; applyLbl(c);
  };

  const valMg = (r: number, c1: number, c2: number, v: string | number) => {
    if (c1 !== c2) mg(r, c1, r, c2);
    const c = cl(r, c1); c.value = v; applyVal(c);
  };

  let r = 1;

  // ── Rows 1-8: Área de imágenes ────────────────────────────────────────────
  mg(1, 1, 8, 3);
  applyImg(cl(1, 1));
  // Foto empleado: E1:G8 (cols 5-7)
  mg(1, 5, 8, 7);
  applyImg(cl(1, 5));
  for (let row = 1; row <= 8; row++) rh(row, 20);
  r = 9;

  // ── r=9: Separador ────────────────────────────────────────────────────────
  rh(r, 6); r++;

  // ── r=10: Título ──────────────────────────────────────────────────────────
  mg(r, 1, r, 7);
  const tit = cl(r, 1); tit.value = "CARÁTULA DEL EXPEDIENTE"; applyTitle(tit);
  rh(r, 32); r++;

  // ── r=11: Empresa ─────────────────────────────────────────────────────────
  mg(r, 1, r, 7);
  const emp = cl(r, 1);
  emp.value     = "SOLUCIONES TAMIVAR, S.A. DE C.V.";
  emp.font      = { bold: true, size: 11, color: { argb: NAVY }, name: "Calibri" };
  emp.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: LGRAY } };
  emp.alignment = { horizontal: "center", vertical: "middle" };
  emp.border    = bAll;
  rh(r, 22); r++;

  // ── r=12: Fecha elaboración ───────────────────────────────────────────────
  lblMg(r, 1, 2, "Fecha de elaboración:");
  valMg(r, 3, 7, fecha);
  rh(r, 18); r++;

  // ── r=13: Spacer ──────────────────────────────────────────────────────────
  rh(r, 8); r++;

  // ── r=14: I. DATOS PERSONALES ────────────────────────────────────────────
  mg(r, 1, r, 7);
  const s1 = cl(r, 1); s1.value = "I.   DATOS PERSONALES DEL TRABAJADOR"; applySec(s1);
  rh(r, 22); r++;

  // ── r=15: NOMBRE ─────────────────────────────────────────────────────────
  lblMg(r, 1, 1, "NOMBRE COMPLETO:");
  mg(r, 2, r, 7);
  const nom = cl(r, 2); nom.value = nombre; applyNombre(nom);
  rh(r, 26); r++;

  // ── r=16: NO. TALENTO | FECHA INGRESO ────────────────────────────────────
  lblMg(r, 1, 1, "NO. DE TALENTO:");
  valMg(r, 2, 3, String(empleado.id));
  lblMg(r, 5, 5, "FECHA DE INGRESO:");
  valMg(r, 6, 7, fechaIngreso);
  rh(r, 20); r++;

  // ── r=17: PUESTO | ÁREA ───────────────────────────────────────────────────
  lblMg(r, 1, 1, "PUESTO:");
  valMg(r, 2, 3, empleado.puesto);
  lblMg(r, 5, 5, "ÁREA / DEPARTAMENTO:");
  valMg(r, 6, 7, empleado.area);
  rh(r, 20); r++;

  // ── r=18: SUELDO MENSUAL | PERIODICIDAD ──────────────────────────────────
  lblMg(r, 1, 1, "SUELDO MENSUAL:");
  const sueldoFmt = `$${parseFloat(empleado.sueldo || "0").toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;
  valMg(r, 2, 3, sueldoFmt);
  lblMg(r, 5, 5, "PERIODICIDAD DE PAGO:");
  valMg(r, 6, 7, empleado.periodicidad_sueldo);
  rh(r, 20); r++;

  // ── r=19: NSS | CIUDAD DE ORIGEN ─────────────────────────────────────────
  lblMg(r, 1, 1, "N.S.S.:");
  valMg(r, 2, 3, empleado.nss ?? "");
  lblMg(r, 5, 5, "CIUDAD DE ORIGEN:");
  valMg(r, 6, 7, "");
  rh(r, 20); r++;

  // ── r=20: CURP | ESTADO CIVIL ─────────────────────────────────────────────
  lblMg(r, 1, 1, "C.U.R.P.:");
  valMg(r, 2, 3, empleado.curp ?? "");
  lblMg(r, 5, 5, "ESTADO CIVIL:");
  valMg(r, 6, 7, "");
  rh(r, 20); r++;

  // ── r=21: RFC | FECHA DE NACIMIENTO ──────────────────────────────────────
  lblMg(r, 1, 1, "R.F.C.:");
  valMg(r, 2, 3, empleado.rfc ?? "");
  lblMg(r, 5, 5, "FECHA DE NACIMIENTO:");
  valMg(r, 6, 7, "");
  rh(r, 20); r++;

  // ── r=22: CORREO ELECTRÓNICO ──────────────────────────────────────────────
  lblMg(r, 1, 1, "CORREO ELECTRÓNICO:");
  valMg(r, 2, 7, empleado.correo ?? "");
  rh(r, 20); r++;

  // ── r=23: DOMICILIO ───────────────────────────────────────────────────────
  lblMg(r, 1, 1, "DOMICILIO:");
  valMg(r, 2, 7, empleado.direccion ?? "");
  rh(r, 26); r++;

  // ── r=24: TELÉFONO | LIC. DE MANEJO ──────────────────────────────────────
  lblMg(r, 1, 1, "NO. DE CELULAR:");
  valMg(r, 2, 3, empleado.telefono ?? "");
  lblMg(r, 5, 5, "LIC. DE MANEJO:");
  const motCell = cl(r, 6); motCell.value = "MOTO"; applyCol(motCell);
  const autCell = cl(r, 7); autCell.value = "AUTO"; applyCol(autCell);
  rh(r, 20); r++;

  // ── r=25: Spacer ──────────────────────────────────────────────────────────
  rh(r, 8); r++;

  // ── r=26: II. OTROS DATOS ─────────────────────────────────────────────────
  mg(r, 1, r, 7);
  const s2 = cl(r, 1); s2.value = "II.  OTROS DATOS"; applySec(s2);
  rh(r, 22); r++;

  // ── r=27: CRÉDITO INFONAVIT | NO CTA BANCARIA ────────────────────────────
  lblMg(r, 1, 1, "CRÉDITO INFONAVIT:");
  valMg(r, 2, 3, "");
  lblMg(r, 5, 5, "NO. CTA BANCARIA:");
  valMg(r, 6, 7, "");
  rh(r, 20); r++;

  // ── r=28: BANCO | GRADO ESCOLAR ───────────────────────────────────────────
  lblMg(r, 1, 1, "BANCO:");
  valMg(r, 2, 3, "");
  lblMg(r, 5, 5, "GRADO ESCOLAR:");
  valMg(r, 6, 7, "");
  rh(r, 20); r++;

  // ── r=29: TIPO DE SANGRE | MEDICAMENTO ───────────────────────────────────
  lblMg(r, 1, 1, "TIPO DE SANGRE:");
  valMg(r, 2, 3, empleado.tipo_sangre ?? "");
  lblMg(r, 5, 5, "MEDICAMENTO CONTROLADO:");
  valMg(r, 6, 7, "");
  rh(r, 20); r++;

  // ── r=30: PADECIMIENTO | TALLA ────────────────────────────────────────────
  lblMg(r, 1, 1, "PADECIMIENTO MÉDICO:");
  valMg(r, 2, 3, "");
  lblMg(r, 5, 5, "PLAYERA TALLA:");
  valMg(r, 6, 7, "");
  rh(r, 20); r++;

  // ── r=31: CÓNYUGE | NO. DE HIJOS ─────────────────────────────────────────
  lblMg(r, 1, 1, "NOMBRE DE CÓNYUGE:");
  valMg(r, 2, 3, "");
  lblMg(r, 5, 5, "NO. DE HIJOS:");
  valMg(r, 6, 7, "");
  rh(r, 20); r++;

  // ── r=32: EDADES ──────────────────────────────────────────────────────────
  lblMg(r, 1, 1, "EDADES DE LOS HIJOS:");
  valMg(r, 2, 7, "");
  rh(r, 20); r++;

  // ── r=33: Spacer ──────────────────────────────────────────────────────────
  rh(r, 8); r++;

  // ── r=34: III. NO. DE EMERGENCIA ─────────────────────────────────────────
  mg(r, 1, r, 7);
  const s3 = cl(r, 1); s3.value = "III. NO. DE EMERGENCIA"; applySec(s3);
  rh(r, 22); r++;

  // ── r=35: Encabezados columnas ────────────────────────────────────────────
  mg(r, 1, r, 3);
  const hNom = cl(r, 1); hNom.value = "NOMBRE";      applyCol(hNom);
  const hPar = cl(r, 5); hPar.value = "PARENTESCO";  applyCol(hPar);
  mg(r, 6, r, 7);
  const hNum = cl(r, 6); hNum.value = "NÚMERO";      applyCol(hNum);
  rh(r, 20); r++;

  // ── r=36: Contacto 1 ──────────────────────────────────────────────────────
  mg(r, 1, r, 3);
  const e1N = cl(r, 1); e1N.value = empleado.contacto_emergencia_nombre    ?? ""; applyVal(e1N, true);
  const e1P = cl(r, 5); e1P.value = "";                                            applyVal(e1P, true);
  mg(r, 6, r, 7);
  const e1T = cl(r, 6); e1T.value = empleado.contacto_emergencia_telefono  ?? ""; applyVal(e1T, true);
  rh(r, 22); r++;

  // ── r=37: Contacto 2 (en blanco) ──────────────────────────────────────────
  mg(r, 1, r, 3);
  const e2N = cl(r, 1); e2N.value = ""; applyVal(e2N, true);
  const e2P = cl(r, 5); e2P.value = ""; applyVal(e2P, true);
  mg(r, 6, r, 7);
  const e2T = cl(r, 6); e2T.value = ""; applyVal(e2T, true);
  rh(r, 22);

  // ── Imágenes ──────────────────────────────────────────────────────────────
  // Logo (A1:C8)
  const logoData = await fetchBase64(logoUrl);
  if (logoData) {
    const logoId = wb.addImage({ base64: logoData.data, extension: logoData.ext });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ws as any).addImage(logoId, "A1:C8");
  }

  // Foto del empleado — centrada en canvas del tamaño exacto de E1:G8
  if (empleado.foto_url) {
    const fotoData = await fetchBase64(getFullImageUrl(empleado.foto_url));
    if (fotoData) {
      // cols E-G: (20+18+10)ch → px = ch*7+5 cada una → 145+131+75 = 351
      // filas 1-8: 8 × 15pt × (96/72) ≈ 160 px  — × 3 para evitar pixelado
      const centered = await centerImageInCanvas(fotoData.data, fotoData.ext, 1053, 480);
      if (centered) {
        const fotoId = wb.addImage({ base64: centered, extension: "jpeg" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ws as any).addImage(fotoId, "E1:G8");
      }
    }
  }

  // ── Descarga ──────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = `Caratula_Expediente_${nombre.replace(/\s+/g, "_")}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
