import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType,
  FONT, MESES_UP, MESES_ES,
  descargar,
} from "./_shared";
import { BorderStyle } from "docx";
import type { Empleado } from "./_shared";
import type { CreateBajaPayload } from "../../services/bajas.api";

const SZ  = 20;
const SZS = 18;
const LN  = 276;

const thinB = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const noB   = { style: BorderStyle.NONE,   size: 0, color: "auto"   };

const tableBorders = {
  top: thinB, bottom: thinB, left: thinB, right: thinB,
  insideHorizontal: thinB, insideVertical: thinB,
};

const r = (text: string, bold = false, size = SZ) =>
  new TextRun({ text, font: FONT, size, bold });

const p = (
  children: TextRun[],
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
  after = 120,
) => new Paragraph({ alignment: align, spacing: { line: LN, lineRule: "auto", before: 0, after }, children });

const gap = (after = 160) => new Paragraph({ spacing: { before: 0, after }, children: [] });

function cell(
  children: Paragraph[],
  widthPct: number,
  opts: { bold?: boolean; fill?: string; center?: boolean } = {},
) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: opts.fill ?? "FFFFFF" },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children,
  });
}

function headerCell(text: string, widthPct: number) {
  return cell(
    [p([r(text, true, SZS)], AlignmentType.CENTER, 0)],
    widthPct,
    { fill: "D9D9D9" },
  );
}

function emptyCell(widthPct: number, height = " ") {
  return cell([p([r(height, false, SZS)], AlignmentType.LEFT, 0)], widthPct);
}

function dataCell(text: string, widthPct: number, bold = false) {
  return cell([p([r(text, bold, SZS)], AlignmentType.LEFT, 0)], widthPct);
}

function sectionTitle(num: string, title: string) {
  return new Paragraph({
    spacing: { line: LN, lineRule: "auto", before: 280, after: 100 },
    children: [r(`${num}. ${title}`, true, SZ)],
  });
}

function labelRow(label: string, value: string) {
  return new Paragraph({
    spacing: { line: LN, lineRule: "auto", before: 0, after: 80 },
    children: [r(label, true, SZ), r(value, false, SZ)],
  });
}

function formatFecha(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function fechaFirma(iso: string): { dias: string; mes: string; anio: string } {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return {
    dias: String(d).padStart(2, "0"),
    mes: MESES_ES[m - 1],
    anio: String(y),
  };
}

function signatureBlock(titulo: string, nombre: string, widthPct: number) {
  return cell(
    [
      p([r(titulo, true, SZS)], AlignmentType.CENTER, 0),
      new Paragraph({ spacing: { before: 0, after: 0 }, children: [r("", false, SZS)] }),
      new Paragraph({
        spacing: { before: 480, after: 60 },
        border: { top: thinB },
        children: [],
      }),
      p([r(nombre || "________________________________________", false, SZS)], AlignmentType.CENTER, 0),
      p([r("Nombre y Firma", false, SZS)], AlignmentType.CENTER, 0),
    ],
    widthPct,
  );
}

export async function generarActaEntregaPuesto(
  empleado: Empleado,
  baja: Pick<CreateBajaPayload, "fecha_baja" | "tipo" | "descripcion">,
) {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const { dias, mes, anio } = fechaFirma(baja.fecha_baja);
  const hoy = new Date();
  const diaHoy  = String(hoy.getDate()).padStart(2, "0");
  const mesHoy  = MESES_UP[hoy.getMonth()];
  const anioHoy = String(hoy.getFullYear());

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: {
        page: { margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 } },
      },
      children: [

        // ── Título ───────────────────────────────────────────────────────────────
        p([r("ACTA DE ENTREGA - RECEPCIÓN DE PUESTO DE TRABAJO", true, 26)], AlignmentType.CENTER, 60),
        p(
          [r(`Cancún, Quintana Roo, a ${diaHoy} de ${mesHoy} de ${anioHoy}`, false, SZ)],
          AlignmentType.CENTER, 200,
        ),

        // ── 1. Datos generales ────────────────────────────────────────────────
        sectionTitle("1", "DATOS GENERALES"),
        labelRow("Nombre del Colaborador que Entrega: ", nombre),
        labelRow("Puesto / Cargo: ", empleado.puesto.toUpperCase()),
        labelRow("Área / Departamento: ", empleado.area.toUpperCase()),
        labelRow("Tipo de separación: ", baja.tipo),
        labelRow("Fecha efectiva de separación: ", formatFecha(baja.fecha_baja)),
        gap(80),

        // ── 2. Actividades y proyectos en proceso ─────────────────────────────
        sectionTitle("2", "ACTIVIDADES Y PROYECTOS EN PROCESO"),
        p([r("Detalle de aquellos asuntos que se encuentran a mitad de su ejecución y requieren continuidad inmediata.", false, SZS)], AlignmentType.LEFT, 100),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("No.", 5),
                headerCell("Nombre del Proyecto o Tarea", 25),
                headerCell("Descripción del estado actual", 30),
                headerCell("Fecha límite / Próximo entregable", 20),
                headerCell("Ubicación física o digital del avance", 20),
              ],
            }),
            ...([1, 2, 3] as const).map((n) =>
              new TableRow({
                height: { value: 500, rule: "atLeast" },
                children: [
                  dataCell(String(n), 5),
                  emptyCell(25),
                  emptyCell(30),
                  emptyCell(20),
                  emptyCell(20),
                ],
              })
            ),
          ],
        }),

        // ── 3. Actividades pendientes ─────────────────────────────────────────
        sectionTitle("3", "ACTIVIDADES PENDIENTES POR REALIZAR"),
        p([r("Tareas asignadas al puesto que aún no han sido iniciadas, pero que forman parte de la operación regular.", false, SZS)], AlignmentType.LEFT, 100),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("No.", 5),
                headerCell("Actividad Pendiente", 35),
                headerCell("Prioridad (Alta / Media / Baja)", 25),
                headerCell("Observaciones / Instrucciones especiales", 35),
              ],
            }),
            ...([1, 2, 3] as const).map((n) =>
              new TableRow({
                height: { value: 500, rule: "atLeast" },
                children: [
                  dataCell(String(n), 5),
                  emptyCell(35),
                  emptyCell(25),
                  emptyCell(35),
                ],
              })
            ),
          ],
        }),

        // ── 4. Accesos a herramientas digitales ───────────────────────────────
        sectionTitle("4", "ACCESOS A FORMATOS, BASES DE DATOS Y HERRAMIENTAS DIGITALES"),
        p([r("Listado de dónde se encuentra la información, rutas de acceso, carpetas compartidas, contraseñas o sistemas clave utilizados en el puesto.", false, SZS)], AlignmentType.LEFT, 100),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Recurso / Herramienta", 25),
                headerCell("Ruta de Acceso (URL, Carpeta, Drive)", 30),
                headerCell("Tipo de Acceso (Usuario / Permisos)", 25),
                headerCell("Ubicación de Plantillas o Formatos", 20),
              ],
            }),
            ...[1, 2, 3].map(() =>
              new TableRow({
                height: { value: 500, rule: "atLeast" },
                children: [emptyCell(25), emptyCell(30), emptyCell(25), emptyCell(20)],
              })
            ),
          ],
        }),
        new Paragraph({
          spacing: { line: LN, lineRule: "auto", before: 100, after: 60 },
          children: [
            r("Correo Electrónico Corporativo: ", true, SZS),
            r("Indicaciones para redirección o respaldo: ____________________________________________", false, SZS),
          ],
        }),
        new Paragraph({
          spacing: { line: LN, lineRule: "auto", before: 0, after: 80 },
          children: [
            r("Contraseñas generales entregadas a: ", true, SZS),
            r("____________________________________________", false, SZS),
          ],
        }),

        // ── 5. Inventario de activos ──────────────────────────────────────────
        sectionTitle("5", "INVENTARIO DE ACTIVOS Y EQUIPO DE TRABAJO"),
        p([r("Marque con una X los elementos entregados y señale su condición física:", false, SZS)], AlignmentType.LEFT, 100),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Elemento", 40),
                headerCell("Entregado (Sí / No / N/A)", 20),
                headerCell("Estado (Bueno / Regular / Malo)", 20),
                headerCell("No. de Serie / Descripción", 20),
              ],
            }),
            ...[
              "Equipo de Cómputo (Laptop / PC)",
              "Teléfono Celular / Dispositivo Móvil",
              "Cargadores y Cables",
              "Llaves de oficinas / Archiveros",
              "Tarjetas de Acceso / Gafete",
              "Herramientas de trabajo / EPP",
            ].map((item) =>
              new TableRow({
                height: { value: 420, rule: "atLeast" },
                children: [
                  dataCell(item, 40),
                  emptyCell(20),
                  emptyCell(20),
                  emptyCell(20),
                ],
              })
            ),
          ],
        }),

        // ── 6. Observaciones generales ────────────────────────────────────────
        sectionTitle("6", "OBSERVACIONES GENERALES Y ASUNTOS CRÍTICOS"),
        p([r("(Contactos clave de proveedores/clientes, pendientes administrativos o advertencias importantes sobre la operación)", false, SZS)], AlignmentType.LEFT, 80),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              height: { value: 1200, rule: "atLeast" },
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFFFFF" },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [p([r("", false, SZS)])],
                }),
              ],
            }),
          ],
        }),

        // ── 7. Firmas de conformidad ──────────────────────────────────────────
        sectionTitle("7", "FIRMAS DE CONFORMIDAD"),
        new Paragraph({
          spacing: { line: LN, lineRule: "auto", before: 0, after: 160 },
          children: [
            r(`La presente acta se firma en señal de conformidad y entrega formal de los recursos materiales, información, accesos y responsabilidades descritas anteriormente, a los `, false, SZS),
            r(dias, true, SZS),
            r(` días del mes de `, false, SZS),
            r(mes, true, SZS),
            r(` de `, false, SZS),
            r(anio, true, SZS),
            r(".", false, SZS),
          ],
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
          rows: [
            new TableRow({
              children: [
                signatureBlock("ENTREGÓ (Colaborador)", nombre, 50),
                signatureBlock("RECIBIÓ (Jefe Directo / Reemplazo)", "", 50),
              ],
            }),
          ],
        }),

        gap(160),

        new Table({
          width: { size: 60, type: WidthType.PERCENTAGE },
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
          rows: [
            new TableRow({
              children: [
                signatureBlock("VISTO BUENO (Recursos Humanos / TI)", "", 100),
              ],
            }),
          ],
        }),

      ],
    }],
  });

  const apellido = empleado.apellido_paterno.replace(/\s+/g, "_");
  descargar(doc, `Acta_Entrega_Puesto_${apellido}_${baja.fecha_baja.slice(0, 10)}.docx`);
}
