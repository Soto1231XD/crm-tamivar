import { ImageRun } from "docx";
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType,
  FONT, SIZE_BODY, SIZE_TITLE, SIZE_HEAD, MESES_ES,
  run, para, descargar, parseLocalDate,
} from "./_shared";
import type { Empleado } from "./_shared";
import type { ResponsivaEmpleado, DatosMateriales } from "../../services/responsivas.api";

function cellP(text: string, bold = false, center = false): Paragraph {
  return new Paragraph({
    alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 40 },
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY, bold })],
  });
}

// Convierte cualquier dataUrl (incluye WebP) a JPEG Uint8Array via canvas.
// ImageRun de docx-js no soporta WebP, por eso se convierte siempre a JPEG.
function fotoAJpeg(dataUrl: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      const jpeg = canvas.toDataURL("image/jpeg", 0.85);
      const comma = jpeg.indexOf(",");
      const binary = atob(jpeg.slice(comma + 1));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      resolve(bytes);
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = dataUrl;
  });
}

export async function generarResponsivaMateriales(
  empleado: Empleado,
  responsiva: ResponsivaEmpleado,
  opts?: { onlyBlob?: boolean },
): Promise<Blob> {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const puesto = empleado.puesto.toUpperCase();
  const d: DatosMateriales = JSON.parse(responsiva.datos);

  const fmtFecha = (iso: string) => {
    const f = parseLocalDate(iso);
    return `${f.getDate()} de ${MESES_ES[f.getMonth()]} de ${f.getFullYear()}`;
  };

  const TBL = 9394;
  const HALF = 4697;

  const filaRows = d.filas.map(fila =>
    new TableRow({
      children: [
        new TableCell({ width: { size: 3131, type: WidthType.DXA }, children: [cellP(fila.herramienta)] }),
        new TableCell({ width: { size: 3131, type: WidthType.DXA }, children: [cellP(fila.descripcion)] }),
        new TableCell({ width: { size: 3132, type: WidthType.DXA }, children: [cellP(fila.uso)] }),
      ],
    })
  );

  // Pre-procesar fotos: convertir a JPEG (ImageRun no soporta WebP)
  const jpegBytes: Uint8Array[] = d.fotos?.length
    ? await Promise.all(d.fotos.map(fotoAJpeg))
    : [];

  // Build photo section
  const photoSection: (Paragraph | Table)[] = [];
  if (jpegBytes.length > 0) {
    photoSection.push(
      new Paragraph({ spacing: { before: 300, after: 0 }, children: [] }),
      para([run("EVIDENCIA FOTOGRÁFICA DEL ESTADO DEL EQUIPO", { bold: true })], AlignmentType.CENTER, 100),
    );
    const CELL_W = Math.floor(TBL / 2) - 60;
    for (let i = 0; i < jpegBytes.length; i += 2) {
      const makeCells = jpegBytes.slice(i, i + 2).map((bytes, j) =>
        new TableCell({
          width: { size: CELL_W, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 40 },
              children: [
                new ImageRun({ data: bytes, transformation: { width: 280, height: 210 }, type: "jpg" }),
              ],
            }),
            cellP(`Foto ${i + j + 1}`, false, true),
          ],
        })
      );
      if (makeCells.length === 1) {
        makeCells.push(new TableCell({
          width: { size: CELL_W, type: WidthType.DXA },
          children: [new Paragraph({ children: [] })],
        }));
      }
      photoSection.push(
        new Table({
          width: { size: TBL, type: WidthType.DXA },
          columnWidths: [CELL_W, CELL_W],
          rows: [new TableRow({ children: makeCells })],
        }),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1418, right: 1418, bottom: 1418, left: 1418 },
        },
      },
      children: [
        // Encabezado
        para([run("ANEXO 6", { bold: true, size: SIZE_HEAD })], AlignmentType.CENTER, 0),
        para([run("CARTA RESPONSIVA DE ÚTILES, INSTRUMENTOS Y MATERIALES DE TRABAJO", { bold: true, size: SIZE_TITLE })], AlignmentType.CENTER, 200),

        // Datos del colaborador
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "NOMBRE DE COLABORADOR: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: nombre, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({ text: "PUESTO: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: puesto, font: FONT, size: SIZE_BODY }),
          ],
        }),

        // Párrafo de apertura
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160 },
          children: [
            new TextRun({ text: "Por medio de la presente, ", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "SOLUCIONES TAMIVAR, SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE, ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "hace constar la entrega al ", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "COLABORADOR ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "del siguiente útil, instrumento y material de trabajo, mismo que el ", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "COLABORADOR ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "se obliga a cuidar, mantener y resguardar bajo su más estricta responsabilidad en las condiciones en las que se le entregan y con el desgaste que corresponda a su uso y actividad ordinaria.", font: FONT, size: SIZE_BODY }),
          ],
        }),

        // Tabla de materiales
        para([run("MATERIAL DE TRABAJO", { bold: true })], AlignmentType.CENTER, 60),
        new Table({
          width: { size: TBL, type: WidthType.DXA },
          columnWidths: [3131, 3131, 3132],
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 3131, type: WidthType.DXA }, children: [cellP("HERRAMIENTA", true, true)] }),
                new TableCell({ width: { size: 3131, type: WidthType.DXA }, children: [cellP("DESCRIPCIÓN", true, true)] }),
                new TableCell({ width: { size: 3132, type: WidthType.DXA }, children: [cellP("USO", true, true)] }),
              ],
            }),
            ...filaRows,
          ],
        }),

        new Paragraph({ spacing: { after: 160 }, children: [] }),

        // Tabla de fechas
        new Table({
          width: { size: TBL, type: WidthType.DXA },
          columnWidths: [HALF, HALF],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: HALF, type: WidthType.DXA },
                  children: [
                    cellP("FECHA DE ENTREGA AL COLABORADOR:", true),
                    cellP(fmtFecha(d.fecha_entrega)),
                    new Paragraph({ spacing: { after: 40 }, children: [] }),
                  ],
                }),
                new TableCell({
                  width: { size: HALF, type: WidthType.DXA },
                  children: [
                    cellP("FECHA DE DEVOLUCIÓN:", true),
                    cellP(d.fecha_devolucion ? fmtFecha(d.fecha_devolucion) : ""),
                    new Paragraph({ spacing: { after: 40 }, children: [] }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { after: 160 }, children: [] }),

        // Condiciones de entrega / observaciones
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "CONDICIONES DE ENTREGA Y/O OBSERVACIONES: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: d.condiciones ?? "", font: FONT, size: SIZE_BODY }),
          ],
        }),

        // Condiciones y responsabilidad
        para([run("CONDICIONES Y RESPONSABILIDAD:", { bold: true })], AlignmentType.LEFT, 80),
        ...[
          "El equipo es propiedad de la empresa y su uso es exclusivamente laboral.",
          "El colaborador se obliga a cuidarlo y utilizarlo conforme a políticas internas.",
          "En caso de daño, pérdida o robo por negligencia, mal uso o incumplimiento, autoriza expresamente a la empresa a realizar el cobro correspondiente por reparación o reposición, conforme a la Ley Federal del Trabajo y previa evidencia.",
          "Al término de la relación laboral, el equipo deberá devolverse en buen estado, considerando desgaste normal de su uso.",
        ].map(txt =>
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 276, lineRule: "auto", before: 0, after: 80 },
            children: [
              new TextRun({ text: "• ", bold: true, font: FONT, size: SIZE_BODY }),
              new TextRun({ text: txt, font: FONT, size: SIZE_BODY }),
            ],
          })
        ),

        new Paragraph({ spacing: { after: 160 }, children: [] }),

        // Fotos (si existen)
        ...photoSection,

        new Paragraph({ spacing: { before: 300, after: 0 }, children: [] }),

        // Firmas
        new Table({
          width: { size: TBL, type: WidthType.DXA },
          columnWidths: [HALF, HALF],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: HALF, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    cellP("__________________________________________", false, true),
                    cellP("NOMBRE Y FIRMA DE COLABORADOR", true, true),
                  ],
                }),
                new TableCell({
                  width: { size: HALF, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    cellP("________________________________________", false, true),
                    cellP("HENRY FERNANDO TAMAY SANCHEZ", true, true),
                    cellP("ADMINISTRADOR ÚNICO", false, true),
                    cellP("SOLUCIONES TAMIVAR, S.A. DE C.V.", false, true),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  return descargar(
    doc,
    `Responsiva_Materiales_${nombre.replace(/ /g, "_")}_${d.fecha_entrega}.docx`,
    opts?.onlyBlob,
  );
}
