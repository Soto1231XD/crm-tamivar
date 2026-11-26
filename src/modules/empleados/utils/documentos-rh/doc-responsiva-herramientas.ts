import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType,
  FONT, SIZE_BODY, SIZE_TITLE, SIZE_HEAD, MESES_ES,
  run, para, descargar, parseLocalDate,
} from "./_shared";
import type { Empleado } from "./_shared";
import type { ResponsivaEmpleado, DatosHerramientas } from "../../services/responsivas.api";

const USOS_OPCIONES = [
  "Plomería",
  "Electricidad",
  "Pintura",
  "Carpintería",
  "Jardinería",
  "Limpieza y mantenimiento general",
];

function cellP(text: string, bold = false, center = false): Paragraph {
  return new Paragraph({
    alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 40 },
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY, bold })],
  });
}

function fmtFecha(iso: string): string {
  const f = parseLocalDate(iso);
  return `${String(f.getDate()).padStart(2, "0")} / ${String(f.getMonth() + 1).padStart(2, "0")} / ${f.getFullYear()}`;
}

function fmtFechaLarga(iso: string): string {
  const f = parseLocalDate(iso);
  return `${f.getDate()} de ${MESES_ES[f.getMonth()]} de ${f.getFullYear()}`;
}

export async function generarResponsivaHerramientas(
  empleado: Empleado,
  responsiva: ResponsivaEmpleado,
  opts?: { onlyBlob?: boolean },
): Promise<Blob> {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const puesto = empleado.puesto.toUpperCase();
  const area   = empleado.area.toUpperCase();
  const d: DatosHerramientas = JSON.parse(responsiva.datos);

  const TBL = 9394;
  // Columnas: No.(520) | Herramienta(1900) | Marca/Modelo(1900) | No.Serie(1700) | Estado(1700) | Observaciones(1674)
  const COLS = [520, 1900, 1900, 1700, 1700, 1674] as const;

  const headerRow = new TableRow({
    children: [
      new TableCell({ width: { size: COLS[0], type: WidthType.DXA }, children: [cellP("No.", true, true)] }),
      new TableCell({ width: { size: COLS[1], type: WidthType.DXA }, children: [cellP("Herramienta", true, true)] }),
      new TableCell({ width: { size: COLS[2], type: WidthType.DXA }, children: [cellP("Marca / Modelo", true, true)] }),
      new TableCell({ width: { size: COLS[3], type: WidthType.DXA }, children: [cellP("No. de Serie", true, true)] }),
      new TableCell({ width: { size: COLS[4], type: WidthType.DXA }, children: [cellP("Estado al Entregar", true, true)] }),
      new TableCell({ width: { size: COLS[5], type: WidthType.DXA }, children: [cellP("Observaciones", true, true)] }),
    ],
  });

  const filaRows = d.filas.map((fila, i) =>
    new TableRow({
      children: [
        new TableCell({ width: { size: COLS[0], type: WidthType.DXA }, children: [cellP(String(i + 1), false, true)] }),
        new TableCell({ width: { size: COLS[1], type: WidthType.DXA }, children: [cellP(fila.herramienta)] }),
        new TableCell({ width: { size: COLS[2], type: WidthType.DXA }, children: [cellP(fila.marca_modelo)] }),
        new TableCell({ width: { size: COLS[3], type: WidthType.DXA }, children: [cellP(fila.num_serie)] }),
        new TableCell({ width: { size: COLS[4], type: WidthType.DXA }, children: [cellP(fila.estado, false, true)] }),
        new TableCell({ width: { size: COLS[5], type: WidthType.DXA }, children: [cellP(fila.observaciones)] }),
      ],
    })
  );

  // Checkboxes de uso
  const usosParrafos = USOS_OPCIONES.map(opcion => {
    const seleccionado = d.usos.some(u => u === opcion || u.startsWith("Otros:") && opcion === "Otros");
    const check = seleccionado ? "☑" : "☐";
    return new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: `${check} ${opcion}`, font: FONT, size: SIZE_BODY })],
    });
  });
  const otrosUso = d.usos.find(u => u.startsWith("Otros:")) ?? "";
  usosParrafos.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: `${otrosUso ? "☑" : "☐"} Otros: ${otrosUso.replace("Otros:", "").trim()}`, font: FONT, size: SIZE_BODY })],
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: [
        // Encabezado
        para([run("FORMATO DE HERRAMIENTA DE TRABAJO", { bold: true, size: SIZE_HEAD })], AlignmentType.CENTER, 0),
        para([run("Área de Mantenimiento", { bold: true, size: SIZE_TITLE })], AlignmentType.CENTER, 300),

        // 1. Datos generales
        para([run("1. DATOS GENERALES", { bold: true })], AlignmentType.LEFT, 80),

        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Empresa: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "SOLUCIONES TAMIVAR, S.A. DE C.V.", font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Área: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: area, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Nombre del colaborador: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: nombre, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Puesto: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: puesto, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Fecha de entrega: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: fmtFechaLarga(d.fecha_entrega), font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Lugar de trabajo / inmueble: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: d.lugar_trabajo, font: FONT, size: SIZE_BODY }),
          ],
        }),

        // 2. Relación de herramientas
        para([run("2. RELACIÓN DE HERRAMIENTAS ENTREGADAS", { bold: true })], AlignmentType.LEFT, 80),
        new Table({
          width: { size: TBL, type: WidthType.DXA },
          columnWidths: [...COLS],
          rows: [headerRow, ...filaRows],
        }),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Estado al entregar:  ☐ Nuevo  ☐ Bueno  ☐ Regular  ☐ Usado", font: FONT, size: SIZE_BODY }),
          ],
        }),

        // 3. Uso de la herramienta
        para([run("3. USO DE LA HERRAMIENTA", { bold: true })], AlignmentType.LEFT, 60),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: "La herramienta descrita será utilizada exclusivamente para realizar actividades de mantenimiento, tales como (marcar las que apliquen):", font: FONT, size: SIZE_BODY })],
        }),
        ...usosParrafos,
        new Paragraph({ spacing: { after: 160 }, children: [] }),

        // 4. Responsabilidades
        para([run("4. RESPONSABILIDADES DEL COLABORADOR", { bold: true })], AlignmentType.LEFT, 60),
        para([run("El colaborador se compromete a:")], AlignmentType.LEFT, 60),
        ...[
          "Usar la herramienta únicamente para fines laborales.",
          "Conservarla en buen estado y reportar cualquier daño o falla.",
          "No prestar, modificar o dar uso indebido a la herramienta.",
          "Devolver la herramienta cuando le sea solicitada o al término de la relación laboral.",
        ].map(txt =>
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "- ", font: FONT, size: SIZE_BODY }),
              new TextRun({ text: txt, font: FONT, size: SIZE_BODY }),
            ],
          })
        ),
        new Paragraph({ spacing: { after: 160 }, children: [] }),

        // 5. Entrega y devolución
        para([run("5. ENTREGA Y DEVOLUCIÓN", { bold: true })], AlignmentType.LEFT, 80),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Fecha de entrega: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: fmtFecha(d.fecha_entrega), font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Fecha de devolución: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: d.fecha_devolucion ? fmtFecha(d.fecha_devolucion) : "____ / ____ / ______", font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Estado al devolver: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "☐ Bueno  ☐ Regular  ☐ Dañado", font: FONT, size: SIZE_BODY }),
          ],
        }),

        // 6. Firmas
        para([run("6. FIRMAS", { bold: true })], AlignmentType.LEFT, 60),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Con la firma del presente formato, ambas partes manifiestan su conformidad.", font: FONT, size: SIZE_BODY })],
        }),

        new Table({
          width: { size: TBL, type: WidthType.DXA },
          columnWidths: [Math.floor(TBL / 2), TBL - Math.floor(TBL / 2)],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: Math.floor(TBL / 2), type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    cellP("___________________________________", false, true),
                    cellP(nombre, true, true),
                    cellP("COLABORADOR", false, true),
                    new Paragraph({ spacing: { after: 60 }, children: [] }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 40 },
                      children: [
                        new TextRun({ text: "Fecha: ", bold: true, font: FONT, size: SIZE_BODY }),
                        new TextRun({ text: fmtFecha(d.fecha_entrega), font: FONT, size: SIZE_BODY }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: TBL - Math.floor(TBL / 2), type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    new Paragraph({ spacing: { after: 80 }, children: [] }),
                    cellP("___________________________________", false, true),
                    cellP("RESPONSABLE / SUPERVISOR", true, true),
                    cellP("ÁREA DE MANTENIMIENTO", false, true),
                    new Paragraph({ spacing: { after: 60 }, children: [] }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 40 },
                      children: [
                        new TextRun({ text: "Fecha: ", bold: true, font: FONT, size: SIZE_BODY }),
                        new TextRun({ text: fmtFecha(d.fecha_entrega), font: FONT, size: SIZE_BODY }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { after: 160 }, children: [] }),
        new Paragraph({
          spacing: { after: 0 },
          children: [
            new TextRun({ text: "Nota: ", bold: true, font: FONT, size: 18 }),
            new TextRun({ text: "Este formato es un documento interno de control y resguardo de herramientas de trabajo.", font: FONT, size: 18 }),
          ],
        }),
      ],
    }],
  });

  return descargar(
    doc,
    `Herramientas_Mantenimiento_${nombre.replace(/ /g, "_")}_${d.fecha_entrega}.docx`,
    opts?.onlyBlob,
  );
}
