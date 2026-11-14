import {
  Document, Paragraph, TextRun, AlignmentType, UnderlineType, TabStopType,
  FONT, SIZE_BODY, SIZE_TITLE, SIZE_HEAD, MESES_ES, MESES_UP,
  run, para, descargar,
  parseLocalDate, fechaLarga,
} from "./_shared";
import type { Empleado, PermisoEmpleado } from "./_shared";

function formatHora12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function calcularRetrasoTexto(horaEntrada: string, horaLlegada: string): string {
  const [eh, em] = horaEntrada.split(":").map(Number);
  const [lh, lm] = horaLlegada.split(":").map(Number);
  const totalMin = (lh * 60 + lm) - (eh * 60 + em);
  if (totalMin <= 0) return "algunos minutos";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h} hora${h > 1 ? "s" : ""} y ${m} minuto${m > 1 ? "s" : ""}`;
  if (h > 0) return `${h} hora${h > 1 ? "s" : ""}`;
  return `${m} minuto${m > 1 ? "s" : ""}`;
}

export async function generarAvisoTardanza(
  empleado: Empleado,
  permiso: PermisoEmpleado,
): Promise<void> {
  const HORA_ENTRADA = "09:00";
  const horaLlegada = permiso.hora_llegada ?? "09:00";
  const fechaPermiso = parseLocalDate(permiso.fecha.slice(0, 10));
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const retraso = calcularRetrasoTexto(HORA_ENTRADA, horaLlegada);
  const TAB_FIRMA = 4860;

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true, size: SIZE_HEAD })], AlignmentType.CENTER, 60),
        para([run("RECURSOS HUMANOS", { bold: true })], AlignmentType.CENTER, 60),
        para([run("Gerente General", { bold: true })], AlignmentType.CENTER, 400),

        para([
          run("AVISO DE ENTRADA TARDÍA SIN GOCE DE SUELDO POR CAUSA EXTERNA", { bold: true, under: true, size: SIZE_TITLE }),
        ], AlignmentType.CENTER, 400),

        para([
          run("Por medio de la presente, el(la) que suscribe "),
          run(nombre, { bold: true, under: true }),
          run(", manifiesto que el día "),
          run(fechaLarga(fechaPermiso), { bold: true, under: true }),
          run(" ingresaré de manera tardía a mis labores en las instalaciones de "),
          run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true }),
          run(", siendo el motivo de dicho retraso por causa externa la siguiente:"),
        ], AlignmentType.JUSTIFIED, 300),

        para([
          run("MOTIVO: ", { bold: true }),
          run(permiso.descripcion?.toUpperCase() ?? "CAUSA EXTERNA", { under: true }),
        ], AlignmentType.LEFT, 200),

        para([
          run("Mi horario habitual de ingreso es a las "),
          run(formatHora12(HORA_ENTRADA), { bold: true, under: true }),
          run(" horas, y mi hora estimada de llegada es a las "),
          run(formatHora12(horaLlegada), { bold: true, under: true }),
          run(` horas, con un retraso aproximado de `),
          run(retraso.toUpperCase(), { bold: true, under: true }),
          run("."),
        ], AlignmentType.JUSTIFIED, 300),

        para([
          run("Por lo anterior, en términos de lo dispuesto por el artículo "),
          run("47, Fracción X", { bold: true }),
          run(" de la Ley Federal del Trabajo, manifiesto expresamente mi conformidad en que el tiempo de retraso sea descontado de mi salario, renunciando a cualquier reclamación al respecto."),
        ], AlignmentType.JUSTIFIED, 200),

        para([
          run("Reanudando mis labores el mismo día en el horario indicado."),
        ], AlignmentType.JUSTIFIED, 500),

        para([
          run("En la Ciudad de Cancún, Estado de Quintana Roo, a los "),
          run(String(fechaPermiso.getDate()), { bold: true }),
          run(" días del mes de "),
          run(MESES_UP[fechaPermiso.getMonth()], { bold: true }),
          run(` del año ${fechaPermiso.getFullYear()}.`),
        ], AlignmentType.LEFT, 700),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Colaborador: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: nombre, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "No. Colaborador: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: String(empleado.id), font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 600 },
          children: [
            new TextRun({ text: "Departamento / Área: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: empleado.area?.toUpperCase() ?? "—", underline: { type: UnderlineType.SINGLE }, font: FONT, size: SIZE_BODY }),
          ],
        }),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
          ],
        }),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 0 },
          children: [
            new TextRun({ text: `C. ${nombre}`, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "C. HENRY FERNANDO TAMAY SANCHEZ", font: FONT, size: SIZE_BODY }),
          ],
        }),
      ],
    }],
  });

  await descargar(
    doc,
    `Aviso_Tardanza_${nombre.replace(/ /g, "_")}_${permiso.fecha.slice(0, 10)}.docx`,
  );
}

export async function generarPermisoEntradaTarde(
  empleado: Empleado,
  permiso: PermisoEmpleado,
): Promise<void> {
  const HORA_ENTRADA = "09:00";
  const horaLlegada = permiso.hora_llegada ?? "09:00";
  const fechaPermiso = parseLocalDate(permiso.fecha.slice(0, 10));
  const fechaRecuperacion = permiso.fecha_recuperacion
    ? parseLocalDate(permiso.fecha_recuperacion)
    : null;
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const retraso = calcularRetrasoTexto(HORA_ENTRADA, horaLlegada);
  const TAB_FIRMA = 4860;

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true, size: SIZE_HEAD })], AlignmentType.CENTER, 60),
        para([run("RECURSOS HUMANOS", { bold: true })], AlignmentType.CENTER, 60),
        para([run("Gerente General", { bold: true })], AlignmentType.CENTER, 400),

        para([
          run("PERMISO DE ENTRADA TARDE CON RECUPERACIÓN DE TIEMPO", { bold: true, under: true, size: SIZE_TITLE }),
        ], AlignmentType.CENTER, 400),

        para([
          run("Por medio de la presente, el(la) que suscribe "),
          run(nombre, { bold: true, under: true }),
          run(", manifiesto que el día "),
          run(fechaLarga(fechaPermiso), { bold: true, under: true }),
          run(" ingresaré de manera tardía a mis labores en las instalaciones de "),
          run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true }),
          run(", siendo el motivo del retraso por causa externa la siguiente:"),
        ], AlignmentType.JUSTIFIED, 300),

        para([
          run("MOTIVO: ", { bold: true }),
          run(permiso.descripcion?.toUpperCase() ?? "CAUSA EXTERNA", { under: true }),
        ], AlignmentType.LEFT, 200),

        para([
          run("Mi horario habitual de ingreso es a las "),
          run(formatHora12(HORA_ENTRADA), { bold: true, under: true }),
          run(" horas, y mi hora estimada de llegada es a las "),
          run(formatHora12(horaLlegada), { bold: true, under: true }),
          run(` horas, con un retraso aproximado de `),
          run(retraso.toUpperCase(), { bold: true, under: true }),
          run("."),
        ], AlignmentType.JUSTIFIED, 300),

        para([
          run("Asimismo, me comprometo a que el tiempo no laborado será considerado para reponer el día "),
          run(fechaLarga(fechaPermiso), { bold: true, under: true }),
          ...(fechaRecuperacion ? [
            run(" y el día "),
            run(fechaLarga(fechaRecuperacion), { bold: true, under: true }),
          ] : []),
          run(" en los términos acordados con la empresa."),
        ], AlignmentType.JUSTIFIED, 300),

        para([
          run("En términos de lo dispuesto por el artículo "),
          run("47, Fracción X", { bold: true }),
          run(" de la Ley Federal del Trabajo, manifiesto expresamente mi conformidad en que el tiempo no recuperado sea descontado de mi salario, renunciando a cualquier reclamación al respecto."),
        ], AlignmentType.JUSTIFIED, 500),

        para([
          run("En la Ciudad de Cancún, Estado de Quintana Roo, a los "),
          run(String(fechaPermiso.getDate()), { bold: true }),
          run(" días del mes de "),
          run(MESES_UP[fechaPermiso.getMonth()], { bold: true }),
          run(` del año ${fechaPermiso.getFullYear()}.`),
        ], AlignmentType.LEFT, 700),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Colaborador: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: nombre, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "No. Colaborador: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: String(empleado.id), font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 600 },
          children: [
            new TextRun({ text: "Departamento / Área: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: empleado.area?.toUpperCase() ?? "—", underline: { type: UnderlineType.SINGLE }, font: FONT, size: SIZE_BODY }),
          ],
        }),

        new Paragraph({
          tabStops: [
            { type: TabStopType.LEFT, position: 3600 },
            { type: TabStopType.LEFT, position: 7200 },
          ],
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [
            { type: TabStopType.LEFT, position: 3600 },
            { type: TabStopType.LEFT, position: 7200 },
          ],
          spacing: { after: 0 },
          children: [
            new TextRun({ text: `C. ${nombre}`, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "GERENTE GENERAL", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "C. HENRY FERNANDO TAMAY SANCHEZ", font: FONT, size: SIZE_BODY }),
          ],
        }),
      ],
    }],
  });

  await descargar(
    doc,
    `Permiso_Entrada_Tarde_${nombre.replace(/ /g, "_")}_${permiso.fecha.slice(0, 10)}.docx`,
  );
}

export async function generarPermisoLlegarTarde(
  empleado: Empleado,
  permiso: PermisoEmpleado,
): Promise<void> {
  const HORA_ENTRADA = "09:00";
  const horaLlegada = permiso.hora_llegada ?? "09:00";
  const fechaPermiso = parseLocalDate(permiso.fecha.slice(0, 10));
  const fechaRecuperacion = permiso.fecha_recuperacion
    ? parseLocalDate(permiso.fecha_recuperacion)
    : null;
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
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
          run("PERMISO PARA LLEGAR TARDE", { bold: true, under: true, size: SIZE_TITLE }),
        ], AlignmentType.CENTER, 200),

        para([
          run("En la ciudad de Cancún, Quintana Roo, a "),
          run(String(fechaPermiso.getDate()), { bold: true }),
          run(" de "),
          run(MESES_ES[fechaPermiso.getMonth()], { bold: true }),
          run(` de ${fechaPermiso.getFullYear()}.`),
        ], AlignmentType.LEFT, 200),

        para([run("Por medio del presente se autoriza al/la colaborador(a):")], AlignmentType.LEFT, 100),
        para([run("Nombre: ", { bold: true }), run(nombre)], AlignmentType.LEFT, 60),
        para([run("Puesto: ", { bold: true }), run(empleado.puesto.toUpperCase())], AlignmentType.LEFT, 60),
        para([run("Departamento: ", { bold: true }), run(empleado.area?.toUpperCase() ?? "—")], AlignmentType.LEFT, 200),

        para([
          run("A presentarse a laborar el día "),
          run(`${fechaPermiso.getDate()} de ${MESES_ES[fechaPermiso.getMonth()]} de ${fechaPermiso.getFullYear()}`, { bold: true }),
          run(" a las "),
          run(formatHora12(horaLlegada), { bold: true }),
          run(" hrs., siendo su horario habitual de entrada las "),
          run(formatHora12(HORA_ENTRADA), { bold: true }),
          run(" hrs."),
        ], AlignmentType.JUSTIFIED, 100),

        para([
          run("Motivo del permiso: ", { bold: true }),
          run(permiso.descripcion?.toUpperCase() ?? "____________________________________"),
        ], AlignmentType.LEFT, 200),

        para([run("Tipo de permiso:", { bold: true })], AlignmentType.LEFT, 60),
        chkRun(permiso.con_goce && !fechaRecuperacion, "Con goce de sueldo"),
        chkRun(!permiso.con_goce && !fechaRecuperacion, "Sin goce de sueldo"),
        chkRun(!!fechaRecuperacion, "Con reposición de tiempo"),
        new Paragraph({ spacing: { after: 160 }, children: [] }),

        ...(fechaRecuperacion ? [
          para([
            run("En caso de reposición, el tiempo será cubierto el día "),
            run(`${fechaRecuperacion.getDate()} de ${MESES_ES[fechaRecuperacion.getMonth()]} de ${fechaRecuperacion.getFullYear()}`, { bold: true }),
            run(" en el siguiente horario: "),
            run(formatHora12(HORA_ENTRADA), { bold: true }),
            run(" – "),
            run(formatHora12(horaLlegada), { bold: true }),
            run("."),
          ], AlignmentType.JUSTIFIED, 200),
        ] : []),

        para([
          run("El presente permiso se otorga de manera excepcional y no modifica el horario laboral establecido en el contrato ni en el Reglamento Interior de Trabajo."),
        ], AlignmentType.JUSTIFIED, 400),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "Firma del colaborador", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "Firma de autorización (Jefe inmediato)", bold: true, font: FONT, size: SIZE_BODY }),
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

  await descargar(
    doc,
    `Permiso_Llegar_Tarde_${nombre.replace(/ /g, "_")}_${permiso.fecha.slice(0, 10)}.docx`,
  );
}
