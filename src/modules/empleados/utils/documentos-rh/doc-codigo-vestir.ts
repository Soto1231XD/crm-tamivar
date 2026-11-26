import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, UnderlineType,
  FONT, descargar,
} from "./_shared";
import { BorderStyle, ImageRun, VerticalAlign } from "docx";
import cvLogoUrl from "@/assets/images/cv-logo.png";
import cvUniformeUrl from "@/assets/images/cv-uniforme.jpg";
import cvFormalUrl from "@/assets/images/cv-formal.jpg";

const SZ   = 22;
const LN   = 276;
const noB  = { style: BorderStyle.NONE,   size: 0, color: "auto" };
const thinB = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const boxB  = { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" };

// Ancho total de contenido: márgenes 1134 DXA c/lado → 12240 - 2268 = 9972 DXA
const TOTAL = 9972;
const COL_TXT = 5700;
const COL_IMG = TOTAL - COL_TXT; // 4272

const jP = (text: string, after = 120) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [new TextRun({ text, font: FONT, size: SZ })],
  });

const secTitle = (num: string, title: string) =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: LN, lineRule: "auto", before: 0, after: 100 },
    children: [
      new TextRun({ text: `${num}. `, font: FONT, size: SZ, bold: true }),
      new TextRun({ text: title, font: FONT, size: SZ, bold: true }),
    ],
  });

const gap = (after = 160) =>
  new Paragraph({ spacing: { before: 0, after }, children: [] });

const cP = (text: string, bold = false, after = 80) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [new TextRun({ text, font: FONT, size: SZ, bold })],
  });

function sectionTable(
  titleNum: string,
  titleText: string,
  paras: string[],
  img: ImageRun,
): Table {
  const shading = { type: ShadingType.CLEAR, fill: "F4F4F4", color: "auto" };

  return new Table({
    width: { size: TOTAL, type: WidthType.DXA },
    columnWidths: [COL_TXT, COL_IMG],
    borders: {
      top: boxB, bottom: boxB, left: boxB, right: boxB,
      insideHorizontal: noB, insideVertical: noB,
    },
    rows: [
      new TableRow({
        children: [
          // Columna texto
          new TableCell({
            width: { size: COL_TXT, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            shading,
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              secTitle(titleNum, titleText),
              ...paras.map(p => jP(p, 100)),
            ],
          }),
          // Columna imagen
          new TableCell({
            width: { size: COL_IMG, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            shading,
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [img],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export async function generarCodigoVestir(nombreCompleto: string): Promise<void> {
  const [logoData, uniformeData, formalData] = await Promise.all([
    fetch(cvLogoUrl).then(r => r.arrayBuffer()),
    fetch(cvUniformeUrl).then(r => r.arrayBuffer()),
    fetch(cvFormalUrl).then(r => r.arrayBuffer()),
  ]);

  // Imagen logo: 300×161 → mostrar a 210×113
  const imgLogo = new ImageRun({
    data: logoData, type: "png",
    transformation: { width: 210, height: 113 },
  });
  // Fotos sección: 400×267 → mostrar a 265×177
  const imgUniforme = new ImageRun({
    data: uniformeData, type: "jpg",
    transformation: { width: 265, height: 177 },
  });
  const imgFormal = new ImageRun({
    data: formalData, type: "jpg",
    transformation: { width: 265, height: 177 },
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: {
        page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
      },
      children: [

        // ── Header: vacío izquierda | logo derecha ───────────────────────
        new Table({
          width: { size: TOTAL, type: WidthType.DXA },
          columnWidths: [TOTAL - 2800, 2800],
          borders: {
            top: noB, bottom: noB, left: noB, right: noB,
            insideHorizontal: noB, insideVertical: noB,
          },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: TOTAL - 2800, type: WidthType.DXA },
                children: [gap(0)],
              }),
              new TableCell({
                width: { size: 2800, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 0, after: 0 },
                    children: [imgLogo],
                  }),
                ],
              }),
            ],
          })],
        }),

        // ── Título ───────────────────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: LN, lineRule: "auto", before: 160, after: 160 },
          children: [
            new TextRun({
              text: "CÓDIGO DE VESTIR",
              font: FONT, size: 28, bold: true,
              color: "1F3864",
              underline: { type: UnderlineType.SINGLE },
            }),
          ],
        }),

        // ── Introducción ─────────────────────────────────────────────────
        jP("Con el objetivo de mantener una imagen profesional y uniforme ante nuestros clientes y público en general, se establece el siguiente Código de Vestir para todo el personal:"),

        gap(160),

        // ── Sección 001 ──────────────────────────────────────────────────
        sectionTable("001", "Uso obligatorio de uniforme", [
          "El uniforme institucional deberá portarse de manera obligatoria los días lunes, martes, miércoles, jueves y sábado durante la jornada laboral.",
          "El uniforme deberá estar limpio, en buen estado y portarse de forma adecuada, proyectando siempre una imagen profesional acorde a los valores de la empresa.",
          "No se permite el uso de ropa deportiva, pantalón tipo jogger, sandalias informales, shorts arriba de la mitad de la pierna de largo, bermudas o pantalón tipo cargo, prendas rotas o con mensajes inapropiados para uso en oficina.",
        ], imgUniforme),

        gap(160),

        // ── Sección 002 ──────────────────────────────────────────────────
        sectionTable("002", "Viernes – Formal o Casual", [
          "Se entenderá como vestimenta formal casual: pantalón de vestir, blusa o camisa formal, blazer opcional, jeans lisos, y zapato cerrado, tenis o calzado formal.",
          "No se permite el uso de ropa deportiva, blusas strapless o escotadas, pantalones tipo jogger o cargo, sandalias informales, shorts arriba de media pierna, bermudas, prendas rotas o ropa con mensajes inapropiados para un ambiente de oficina.",
          "Asimismo, el uniforme o la vestimenta deberán mantenerse limpios, en buen estado y portarse de manera adecuada, proyectando en todo momento una imagen profesional acorde con los valores de la empresa.",
        ], imgFormal),

        gap(160),

        // ── Sección 003 ──────────────────────────────────────────────────
        new Table({
          width: { size: TOTAL, type: WidthType.DXA },
          columnWidths: [TOTAL],
          borders: {
            top: boxB, bottom: boxB, left: boxB, right: boxB,
            insideHorizontal: noB, insideVertical: noB,
          },
          rows: [new TableRow({
            children: [new TableCell({
              width: { size: TOTAL, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, fill: "F4F4F4", color: "auto" },
              margins: { top: 120, bottom: 120, left: 160, right: 160 },
              children: [
                secTitle("003", "Disposiciones Generales"),
                jP("El uso del uniforme es obligatorio durante el desempeño de las actividades laborales dentro de la empresa, ya que forma parte de la imagen institucional y del profesionalismo del personal.", 100),
                jP("Asimismo, se recomienda retirar el uniforme una vez concluidas las labores, con el fin de preservar la buena imagen de la empresa fuera del entorno laboral.", 0),
              ],
            })],
          })],
        }),

        gap(300),

        // ── Firma ────────────────────────────────────────────────────────
        new Table({
          width: { size: TOTAL, type: WidthType.DXA },
          columnWidths: [Math.round(TOTAL * 0.45), Math.round(TOTAL * 0.55)],
          borders: {
            top: noB, bottom: noB, left: noB, right: noB,
            insideHorizontal: noB, insideVertical: noB,
          },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: Math.round(TOTAL * 0.45), type: WidthType.DXA },
                margins: { top: 0, bottom: 0, left: 0, right: 240 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 480, after: 60 },
                    border: { top: thinB },
                    children: [],
                  }),
                  cP(nombreCompleto.toUpperCase(), true, 0),
                  cP("Nombre del interesado", false, 0),
                ],
              }),
              new TableCell({
                width: { size: Math.round(TOTAL * 0.55), type: WidthType.DXA },
                margins: { top: 0, bottom: 0, left: 240, right: 0 },
                verticalAlign: VerticalAlign.BOTTOM,
                children: [
                  cP("Cancún, Quintana Roo a _____ de ____________ del _______", false, 0),
                ],
              }),
            ],
          })],
        }),

      ],
    }],
  });

  const nombre = nombreCompleto.replace(/\s+/g, "_").toUpperCase();
  descargar(doc, `Codigo_Vestir_${nombre}.docx`);
}
