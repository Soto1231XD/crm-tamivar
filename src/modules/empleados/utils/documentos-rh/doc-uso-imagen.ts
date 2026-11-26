import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType,
  FONT, MESES_UP, descargar,
} from "./_shared";
import { BorderStyle } from "docx";
import type { Empleado } from "../../services/empleados.api";

const SZ  = 22;
const LN  = 276;
const noB = { style: BorderStyle.NONE, size: 0, color: "auto" };
const thinB = { style: BorderStyle.SINGLE, size: 4, color: "000000" };

const cP = (text: string, bold = false, size = SZ, after = 120) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [new TextRun({ text, font: FONT, size, bold })],
  });

const jP = (text: string, after = 140) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [new TextRun({ text, font: FONT, size: SZ })],
  });

const lP = (text: string, after = 100) =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    indent: { left: 360 },
    children: [new TextRun({ text: `– ${text}`, font: FONT, size: SZ })],
  });

const field = (label: string, value: string, after = 120) =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [
      new TextRun({ text: `${label}: `, font: FONT, size: SZ, bold: true }),
      new TextRun({ text: value, font: FONT, size: SZ }),
    ],
  });

const gap = (after = 160) =>
  new Paragraph({ spacing: { before: 0, after }, children: [] });

function fechaHoy(): string {
  const h = new Date();
  return `${h.getDate()} DE ${MESES_UP[h.getMonth()]} DEL AÑO ${h.getFullYear()}`;
}

export function generarAutorizacionUsoImagen(empleado: Empleado): void {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim().toUpperCase();
  const puesto = empleado.puesto.toUpperCase();
  const rfc    = (empleado.rfc ?? "").toUpperCase();

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: [

        // Encabezado empresa
        cP("SOLUCIONES TAMIVAR, SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE", true, 22, 80),

        gap(120),

        // Título
        cP("AUTORIZACION DE USO DE IMAGEN LABORAL", true, 26, 280),

        // Campos dinámicos
        field("FECHA", fechaHoy()),
        field("NOMBRE DEL TRABAJADOR", nombre),
        field("PUESTO", puesto),
        field("RFC", rfc),

        gap(200),

        // Párrafo principal
        jP(`Por medio del presente documento, y en cumplimiento a lo dispuesto por los artículos 6° y 16° de la Constitución Política de los Estados Unidos Mexicanos, así como lo establecido en los artículos 87° al 92° y demás relativos a la Ley Federal del Derecho de Autor, y 3°, 8°, 15°, 16°, 22° en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, el/la que suscribe:`),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: LN, lineRule: "auto", before: 0, after: 140 },
          children: [
            new TextRun({ text: nombre, font: FONT, size: SZ, bold: true }),
            new TextRun({ text: ", otorgo mi consentimiento expreso más amplio que en derecho proceda, libre, informado y por escrito a ", font: FONT, size: SZ }),
            new TextRun({ text: "SOLUCIONES TAMIVAR, S.A. DE C.V.", font: FONT, size: SZ, bold: true }),
            new TextRun({ text: ", para que utilice mi retrato, imagen, voz y/o nombre en materiales gráficos, audiovisuales o cualquier otro medio electrónico, digital o impreso, con fines de carácter laboral, institucional, promocional, publicitario, informativo o de capacitación interna o externa de la empresa.", font: FONT, size: SZ }),
          ],
        }),

        jP("La autorización comprende el uso de la imagen en:"),

        lP("Fotografías individuales o grupales."),
        lP("Videos institucionales o promocionales."),
        lP("Publicaciones en redes sociales oficiales de la empresa."),
        lP("Página web corporativa."),
        lP("Material impreso (folletos, carteles, informes, entre otros)."),

        gap(140),

        jP("Esta autorización no implica remuneración adicional y se limita al ámbito de las actividades y fines mencionados. Así mismo, expresamente señalo mi conformidad a que la presente autorización será irrevocablemente vigente durante el plazo de vigencia de la relación laboral y, por un plazo mínimo de seis meses aun y cuando finalice mi relación laboral por cualquier motivo y/o circunstancia."),

        gap(300),

        // Tabla de firmas
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
          rows: [new TableRow({
            children: [
              // Firma trabajador
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
                  cP("FIRMA DEL TRABAJADOR", true, 20, 40),
                  cP(nombre, false, 20, 0),
                ],
              }),
              // Firma Henry Tamay
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
                  cP("LIC. HENRY FERNANDO TAMAY SANCHEZ.", true, 20, 40),
                  cP("ADMINISTRADOR ÚNICO.", false, 20, 40),
                  cP("SOLUCIONES TAMIVAR, S.A. DE C.V.", false, 20, 0),
                ],
              }),
            ],
          })],
        }),

      ],
    }],
  });

  descargar(doc, `Uso_Imagen_${nombre.replace(/\s+/g, "_")}.docx`);
}
