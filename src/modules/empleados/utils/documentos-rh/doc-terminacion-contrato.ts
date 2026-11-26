import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType,
  FONT, MESES_ES, MESES_UP, enteroALetras,
  descargar, parseLocalDate,
} from "./_shared";
import { BorderStyle } from "docx";

export interface TerminacionContratoData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  puesto: string;
  domicilio: string;
  fecha_contrato: string;      
  fecha_notificacion: string;  
  fecha_efectiva: string;      
  entrega_items: string[];     
}

const SZ  = 22;
const LN  = 276;
const thinB = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const noB   = { style: BorderStyle.NONE,   size: 0, color: "auto"   };

const DIAS_SEMANA = ["DOMINGO","LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES","SÁBADO"];

function diaEnLetras(d: number): string {
  const tabla: Record<number, string> = {
    1: "primero", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco", 6: "seis",
    7: "siete", 8: "ocho", 9: "nueve", 10: "diez", 11: "once", 12: "doce",
    13: "trece", 14: "catorce", 15: "quince", 16: "dieciséis", 17: "diecisiete",
    18: "dieciocho", 19: "diecinueve", 20: "veinte", 21: "veintiuno",
    22: "veintidós", 23: "veintitrés", 24: "veinticuatro", 25: "veinticinco",
    26: "veintiséis", 27: "veintisiete", 28: "veintiocho", 29: "veintinueve",
    30: "treinta", 31: "treinta y uno",
  };
  return tabla[d] ?? String(d);
}

// "primero de julio del año dos mil veinticinco"
function fmtFechaLarga(iso: string): string {
  const f = parseLocalDate(iso);
  return `${diaEnLetras(f.getDate())} de ${MESES_ES[f.getMonth()]} del año ${enteroALetras(f.getFullYear()).toLowerCase()}`;
}

// "30 DE NOVIEMBRE DEL AÑO 2025"
function fmtFechaMedia(iso: string): string {
  const f = parseLocalDate(iso);
  return `${f.getDate()} DE ${MESES_UP[f.getMonth()]} DEL AÑO ${f.getFullYear()}`;
}

// "MARTES 16 DE NOVIEMBRE DEL AÑO 2025"
function fmtFechaConDia(iso: string): string {
  const f = parseLocalDate(iso);
  return `${DIAS_SEMANA[f.getDay()]} ${f.getDate()} DE ${MESES_UP[f.getMonth()]} DEL AÑO ${f.getFullYear()}`;
}

const jPR = (runs: TextRun[], after = 160) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: runs,
  });

const lP = (text: string, after = 120) =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [new TextRun({ text, font: FONT, size: SZ })],
  });

const cP = (text: string, bold = false, after = 120) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [new TextRun({ text, font: FONT, size: SZ, bold })],
  });

const r2 = (text: string, bold = false) =>
  new TextRun({ text, font: FONT, size: SZ, bold });

const gap = (after = 200) =>
  new Paragraph({ spacing: { before: 0, after }, children: [] });

export function generarTerminacionContrato(d: TerminacionContratoData): void {
  const nombre = `${d.nombre} ${d.apellido_paterno} ${d.apellido_materno}`.trim().toUpperCase();
  const puesto = d.puesto.toUpperCase();

  const fechaContratoLarga = fmtFechaLarga(d.fecha_contrato);
  const fechaNotificacion  = fmtFechaMedia(d.fecha_notificacion);
  const fechaEfectiva      = fmtFechaConDia(d.fecha_efectiva);

  const entregaItems = d.entrega_items.filter(i => i.trim());

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: [

        // Título
        cP("NOTIFICACIÓN DE TERMINACIÓN DE CONTRATO", true, 320),

        // Destinatario
        lP(`ESTIMADO:   ${nombre}`, 60),
        lP(d.domicilio.toUpperCase(), 60),
        lP("PRESENTE.", 280),

        // Párrafo principal
        jPR([
          r2("Por medio de la presente y con arreglo en lo dispuesto por la Cláusula Cuarta Titulada "),
          r2('"Vigencia"', true),
          r2(", del "),
          r2("Contrato de Prestación de Servicios de Gestión y Administración Inmobiliaria", true),
          r2(" celebrado entre usted "),
          r2(`C. ${nombre}`, true),
          r2(" y por otra parte "),
          r2('"SOLUCIONES TAMIVAR", S.A. DE C.V.', true),
          r2(" por conducto de su representante legal "),
          r2("C. HENRY FERNANDO TAMAY SANCHEZ", true),
          r2(`, en fecha ${fechaContratoLarga}, tengo a bien hacer de tu conocimiento que es mi libre y entera voluntad dar por terminada la prestación de los servicios que nos unía desde fecha ${fechaContratoLarga}, por lo que atento a lo dispuesto por la cláusula señalada, el presente aviso se hace constar en fecha `),
          r2(fechaNotificacion, true),
          r2(", surtiendo plenamente sus efectos y en consecuencia terminándose la relación contractual en fecha "),
          r2(fechaEfectiva, true),
          r2(", para lo cual en el transcurso del tiempo de la presente notificación a la fecha en la que surta sus efectos la terminación definitiva de la relación contractual, deberás entregar lo siguiente:"),
        ], 160),

        // Lista numerada de entregables
        ...entregaItems.map((item, i) =>
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: LN, lineRule: "auto", before: 0, after: 100 },
            indent: { left: 360 },
            children: [new TextRun({ text: `${i + 1}.  ${item}`, font: FONT, size: SZ })],
          })
        ),

        gap(160),

        // Párrafo de notificación
        jPR([
          r2("SE NOTIFICA LA PRESENTE TERMINACIÓN DE CONTRATO", true),
          r2(", POR LO QUE EN ESTE ACTO EL C. "),
          r2(nombre, true),
          r2(" SE DA POR NOTIFICADO Y PARA TAL EFECTO SE IDENTIFICA CON SU __________________________________________________________, QUIEN _________________________________________________, EN LA CIUDAD DE CANCÚN, ESTADO DE QUINTANA ROO, A LOS "),
          r2(fechaNotificacion, true),
        ], 320),

        // Tabla firmas principales (2 columnas)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  cP(`"EL PRESTADOR Y/O ${puesto}"`, true, 0),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 480, after: 60 },
                    border: { top: thinB },
                    children: [],
                  }),
                  cP(`C. ${nombre}`, true, 0),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  cP('"EL BROKER INMOBILIARIO"', true, 0),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 480, after: 60 },
                    border: { top: thinB },
                    children: [],
                  }),
                  cP('"SOLUCIONES TAMIVAR", S.A. DE C.V.', false, 0),
                  cP("C. HENRY FERNANDO TAMAY SANCHEZ,", true, 0),
                ],
              }),
            ],
          })],
        }),

        gap(240),

        // Tabla testigos (2 columnas)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 480, after: 60 },
                    border: { top: thinB },
                    children: [],
                  }),
                  cP('"TESTIGO"  C.', false, 0),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 480, after: 60 },
                    border: { top: thinB },
                    children: [],
                  }),
                  cP('"TESTIGO"  C.', false, 0),
                ],
              }),
            ],
          })],
        }),

      ],
    }],
  });

  descargar(doc, `Terminacion_Contrato_${nombre.replace(/\s+/g, "_")}_${d.fecha_notificacion.slice(0, 10)}.docx`);
}
