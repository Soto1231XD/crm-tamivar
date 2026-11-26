import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType,
  FONT, MESES_UP, enteroALetras,
  descargar,
} from "./_shared";
import { BorderStyle } from "docx";

export interface ContratoConfidencialidadData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  genero?: string | null;
  curp?: string | null;
  fecha_contrato: string;
  anios_vigencia: number;
}

const SZ  = 24;
const LN  = 276;
const noB   = { style: BorderStyle.NONE,   size: 0, color: "auto"   };

const r = (text: string, bold = false) =>
  new TextRun({ text, font: FONT, size: SZ, bold });

const jP = (text: string, after = 160) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [r(text)],
  });

const jPR = (runs: TextRun[], after = 160) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: runs,
  });

const cP = (text: string, bold = false, after = 120) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [r(text, bold)],
  });

const clauseT = (text: string) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 200, after: 80 },
    children: [r(text, true)],
  });

const indenP = (text: string) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after: 120 },
    indent: { left: 360 },
    children: [r(text)],
  });

const gap = (after = 200) =>
  new Paragraph({ spacing: { before: 0, after }, children: [] });

function diaALetras(d: number): string {
  const nums = [
    "","UNO","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE",
    "DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISÉIS","DIECISIETE","DIECIOCHO","DIECINUEVE",
    "VEINTE","VEINTIÚN","VEINTIDÓS","VEINTITRÉS","VEINTICUATRO","VEINTICINCO","VEINTISÉIS",
    "VEINTISIETE","VEINTIOCHO","VEINTINUEVE","TREINTA","TREINTA Y UNO",
  ];
  return nums[d] ?? String(d);
}

function fechaApertura(iso: string): { diaLetr: string; mes: string; anio: number } {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { diaLetr: diaALetras(d), mes: MESES_UP[m - 1], anio: y };
}

export async function generarContratoConfidencialidad(d: ContratoConfidencialidadData) {
  const fem          = !d.genero || d.genero.toLowerCase() === "femenino";
  const receptora    = fem ? "LA RECEPTORA" : "EL RECEPTOR";
  const nombreCompleto = `${d.nombre} ${d.apellido_paterno} ${d.apellido_materno}`.trim().toUpperCase();
  const { diaLetr, mes, anio } = fechaApertura(d.fecha_contrato);
  const aniosLetr    = `${d.anios_vigencia} (${enteroALetras(d.anios_vigencia)})`;
  const idReceptora  = d.curp ? d.curp.toUpperCase() : "";

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 } } },
      children: [

        // ── Título ───────────────────────────────────────────────────────────
        cP("CONTRATO DE CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS PERSONALES", true, 240),

        // ── Apertura ─────────────────────────────────────────────────────────
        jPR([
          r(`En la ciudad de CANCÚN, a los `),
          r(`${diaLetr} DÍAS del mes de ${mes} del año ${anio}`, true),
          r(`, comparecen por una parte `),
          r(`"SOLUCIONES TAMIVAR", SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE`, true),
          r(`, representada en este acto por su Administrador Único el C. `),
          r("HENRY FERNANDO TAMAY SANCHEZ", true),
          r(`, en lo sucesivo denominada `),
          r('"LA DIVULGANTE"', true),
          r(`, y por la otra `),
          r(nombreCompleto, true),
          r(`, en adelante referid${fem ? "a" : "o"} como `),
          r(`"${receptora}"`, true),
          r(`, quienes de manera libre y voluntaria acuerdan sujetarse a las siguientes cláusulas:`),
        ], 240),

        // ── CLÁUSULAS ────────────────────────────────────────────────────────
        cP("CLÁUSULAS", true, 160),

        clauseT("PRIMERA: DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL."),
        jPR([
          r(`Para efectos del presente instrumento, se entenderá por `),
          r('"Información Confidencial"', true),
          r(` toda aquella información técnica, financiera, comercial, estratégica, así como secretos industriales, procesos, bases de datos, know-how y cualquier dato personal sensible o patrimonial que sea revelado por `),
          r('"LA DIVULGANTE"', true),
          r(`, ya sea de forma verbal, escrita, electrónica o mediante cualquier otro soporte tangible o intangible.`),
        ]),

        clauseT("SEGUNDA: OBLIGACIONES DE NO DIVULGACIÓN."),
        jPR([
          r(`"${receptora}"`, true),
          r(` se obliga de manera irrevocable a mantener la más estricta reserva y confidencialidad sobre la información suministrada, comprometiéndose expresamente a:`),
        ]),
        indenP(`Abstención de uso: No utilizar la información para fines distintos al objeto de la relación laboral o de servicio comercial que vincula a las partes.`),
        indenP(`Custodia y salvaguarda: Adoptar las medidas de seguridad administrativas, técnicas y físicas necesarias para garantizar que ningún tercero no autorizado tenga acceso a la misma.`),
        indenP(`Prohibición de reproducción: No duplicar, copiar ni extraer información sin el consentimiento previo y por escrito de "LA DIVULGANTE".`),

        clauseT("TERCERA: TRATAMIENTO DE DATOS PERSONALES."),
        jPR([
          r(`En cumplimiento de la normativa vigente en materia de Protección de Datos Personales, `),
          r(`"${receptora}"`, true),
          r(` asume la figura de `),
          r('"Encargado del Tratamiento"', true),
          r(` (según corresponda), obligándose a tratar los datos personales de conformidad con las instrucciones de `),
          r('"LA DIVULGANTE"', true),
          r(` y garantizando el ejercicio de los derechos de acceso, rectificación, cancelación y oposición de los titulares.`),
        ]),

        clauseT("CUARTA: EXCEPCIONES A LA CONFIDENCIALIDAD."),
        jP(`No se considerará violación al presente acuerdo cuando:`),
        indenP(`La información sea de dominio público sin mediar culpa o negligencia de "${receptora}".`),
        indenP(`Exista un mandato legal o requerimiento judicial de autoridad competente, en cuyo caso "${receptora}" deberá notificar de inmediato a "LA DIVULGANTE" para que esta pueda ejercer las acciones de defensa pertinentes.`),

        clauseT("QUINTA: INCUMPLIMIENTO Y RESPONSABILIDAD CIVIL."),
        jPR([
          r(`El quebrantamiento de cualquiera de las cláusulas del presente contrato facultará a `),
          r('"LA DIVULGANTE"', true),
          r(` para rescindir cualquier relación comercial o laboral vigente y para ejercer las acciones legales por la vía civil, administrativa o penal. `),
          r(`"${receptora}"`, true),
          r(` será responsable del resarcimiento de daños y perjuicios, así como de las sanciones pecuniarias derivadas del incumplimiento.`),
        ]),

        clauseT("SEXTA: VIGENCIA."),
        jPR([
          r(`Las obligaciones de confidencialidad aquí pactadas surtirán efectos a partir de la firma del presente y subsistirán por un periodo de `),
          r(`${aniosLetr} años`, true),
          r(` posteriores a la terminación de la relación jurídica entre las partes.`),
        ]),

        clauseT("SÉPTIMA: JURISDICCIÓN Y COMPETENCIA."),
        jP(`Para la interpretación y cumplimiento del presente contrato, las partes se someten a la jurisdicción de los Juzgados y Tribunales Competentes de la Ciudad de Cancún, Estado de Quintana Roo, renunciando expresamente a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.`),

        // ── Firmas ───────────────────────────────────────────────────────────
        gap(280),
        cP("Firmas de conformidad:", false, 200),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFFFFF" },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  cP('"LA DIVULGANTE"', true, 0),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 480, after: 60 },
                    border: { top: { style: BorderStyle.SINGLE, size: 4, color: "000000" } },
                    children: [],
                  }),
                  cP("ADMINISTRADOR ÚNICO", false, 0),
                  cP('"SOLUCIONES TAMIVAR", S.A. DE C.V.', false, 60),
                  cP("Identificación: STA240724718", false, 0),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFFFFF" },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  cP(`"${receptora}"`, true, 0),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 480, after: 60 },
                    border: { top: { style: BorderStyle.SINGLE, size: 4, color: "000000" } },
                    children: [],
                  }),
                  cP(nombreCompleto, true, 0),
                  cP("POR SU PROPIO Y PERSONAL DERECHO.", false, 60),
                  ...(idReceptora ? [cP(`Identificación: ${idReceptora}`, false, 0)] : []),
                ],
              }),
            ],
          })],
        }),

      ],
    }],
  });

  descargar(doc, `Contrato_Confidencialidad_${nombreCompleto.replace(/\s+/g, "_")}_${d.fecha_contrato.slice(0, 10)}.docx`);
}
