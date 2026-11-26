import {
  Document, Paragraph, TextRun, AlignmentType, TabStopType,
  FONT, SIZE_BODY, SIZE_TITLE, SIZE_HEAD, MESES_ES,
  run, para, descargar,
  parseLocalDate,
} from "./_shared";
import type { Empleado, PermisoEmpleado } from "./_shared";

function formatHora12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export async function generarPermisoSalidaAnticipada(
  empleado: Empleado,
  permiso: PermisoEmpleado,
  opts?: { onlyBlob?: boolean },
): Promise<Blob> {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const fechaPermiso = parseLocalDate(permiso.fecha.slice(0, 10));

  const partes = (permiso.hora_llegada ?? "").split("|");
  const horarioHabitual = partes[0] ?? "09:00-18:00";
  const horaHabSalida   = partes[1] ?? "18:00";
  const horaAutorizada  = partes[2] ?? "";
  const forma           = partes[3] ?? "sin_goce";

  const TAB_FIRMA = 5400;

  const chkRun = (checked: boolean, label: string): Paragraph =>
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: checked ? "þ" : "¨", font: "Wingdings", size: SIZE_BODY }),
        new TextRun({ text: `  ${label}`, font: FONT, size: SIZE_BODY }),
      ],
    });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 },
        },
      },
      children: [
        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true, size: SIZE_HEAD })], AlignmentType.CENTER, 20),
        para([run("DEPARTAMENTO DE RECURSOS HUMANOS", { bold: true })], AlignmentType.CENTER, 60),
        para([
          run("PERMISO DE SALIDA ANTICIPADA", { bold: true, under: true, size: SIZE_TITLE }),
        ], AlignmentType.CENTER, 200),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Nombre del colaborador: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: nombre, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "No. Colaborador: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: String(empleado.id), font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Puesto: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: empleado.puesto.toUpperCase(), font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "Área/Departamento: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: empleado.area?.toUpperCase() ?? "—", font: FONT, size: SIZE_BODY }),
          ],
        }),
        para([
          run("Fecha de solicitud: ", { bold: true }),
          run(`${fechaPermiso.getDate()} de ${MESES_ES[fechaPermiso.getMonth()]} de ${fechaPermiso.getFullYear()}`),
        ], AlignmentType.LEFT, 200),

        para([run("DETALLE DE SOLICITUD", { bold: true })], AlignmentType.LEFT, 60),
        para([
          run("Motivo del permiso: ", { bold: true }),
          run(permiso.descripcion?.toUpperCase() ?? "____________________________________"),
        ], AlignmentType.LEFT, 60),
        para([
          run("Horario habitual de trabajo: ", { bold: true }),
          run(`${horarioHabitual} hrs.`),
        ], AlignmentType.LEFT, 60),
        para([
          run("Hora habitual de salida: ", { bold: true }),
          run(`${formatHora12(horaHabSalida)} hrs.`),
        ], AlignmentType.LEFT, 60),
        para([
          run("Hora autorizada de salida: ", { bold: true }),
          run(horaAutorizada ? `${formatHora12(horaAutorizada)} hrs.` : "____:____ hrs."),
        ], AlignmentType.LEFT, 200),

        para([run("FORMA DE COMPENSACIÓN", { bold: true })], AlignmentType.LEFT, 60),
        chkRun(forma === "reduccion_comida", "Reducción de tiempo de comida"),
        chkRun(forma === "reposicion",       "Reposición de tiempo"),
        chkRun(forma === "sin_goce",         "Sin goce de sueldo"),
        chkRun(forma === "no_aplica",        "No aplica"),
        new Paragraph({ spacing: { after: 160 }, children: [] }),

        para([
          run("El(la) colaborador(a) suscrito(a) declara bajo protesta de decir verdad que la información proporcionada en el presente formato es verídica, y se compromete a cumplir con la forma de compensación indicada en el presente permiso."),
        ], AlignmentType.JUSTIFIED, 400),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "Firma del colaborador", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "Firma del jefe inmediato", bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 20 },
          children: [
            new TextRun({ text: `C. ${nombre}`, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "HENRY FERNANDO TAMAY SANCHEZ", bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 0 },
          children: [
            new TextRun({ text: "(Colaborador/a)", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "(Jefe inmediato)", font: FONT, size: SIZE_BODY }),
          ],
        }),
      ],
    }],
  });

  return descargar(
    doc,
    `Permiso_Salida_Anticipada_${nombre.replace(/ /g, "_")}_${permiso.fecha.slice(0, 10)}.docx`,
    opts?.onlyBlob,
  );
}
