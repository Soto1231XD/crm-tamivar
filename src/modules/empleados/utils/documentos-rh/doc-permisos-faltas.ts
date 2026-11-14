import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, UnderlineType, TabStopType,
  FONT, SIZE_BODY, SIZE_TITLE, SIZE_HEAD, MESES_ES, MESES_UP,
  run, para, blank, descargar,
  parseLocalDate, fechaLarga,
} from "./_shared";
import type { Empleado, PermisoEmpleado } from "./_shared";

// ── CONSTANCIA DE PERMISO DE INASISTENCIA SIN GOCE DE SUELDO ─────────────────

export async function generarConstanciaInasistencia(
  empleado: Empleado,
  permiso: PermisoEmpleado,
): Promise<void> {
  const fechaInicio = parseLocalDate(permiso.fecha.slice(0, 10));
  const fechaRegreso = permiso.fecha_recuperacion
    ? parseLocalDate(permiso.fecha_recuperacion)
    : null;
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const TAB_FIRMA = 4860;

  const DIAS_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

  const fechaInicioStr = `${DIAS_ES[fechaInicio.getDay()]} ${fechaInicio.getDate()} del mes de ${MESES_ES[fechaInicio.getMonth()]} del año ${fechaInicio.getFullYear()}`;
  const fechaRegresoStr = fechaRegreso
    ? `${DIAS_ES[fechaRegreso.getDay()]} ${fechaRegreso.getDate()} de ${MESES_ES[fechaRegreso.getMonth()]} de ${fechaRegreso.getFullYear()}`
    : "____________________";

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
        para([run("RECURSOS HUMANOS", { bold: true })], AlignmentType.CENTER, 400),

        para([
          run("CONSTANCIA DE PERMISO DE INASISTENCIA SIN GOCE DE SUELDO", { bold: true, under: true, size: SIZE_TITLE }),
        ], AlignmentType.CENTER, 60),

        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true })], AlignmentType.LEFT, 20),
        para([run("GERENTE GENERAL Y/O REPRESENTANTE LEGAL Y/O", { bold: true })], AlignmentType.LEFT, 20),
        para([run("GERENTE DE RECURSO HUMANOS.", { bold: true })], AlignmentType.LEFT, 300),

        para([run("PRESENTE.", { bold: true })], AlignmentType.LEFT, 300),

        para([
          run("Por medio de la presente, solicito su autorización para ausentarme el día "),
          run(fechaInicioStr, { bold: true, under: true }),
          ...(fechaRegreso ? [
            run(", reanudando mis labores en fecha "),
            run(fechaRegresoStr, { bold: true, under: true }),
          ] : []),
          run("."),
        ], AlignmentType.JUSTIFIED, 200),

        para([
          run("MOTIVO: ", { bold: true }),
          run(permiso.descripcion ?? "CAUSA PERSONAL", { under: true }),
        ], AlignmentType.JUSTIFIED, 300),

        para([
          run("En virtud de lo anterior, con fundamento en el artículo "),
          run("47 fracción X", { bold: true }),
          run(" de la Ley Federal del Trabajo, el periodo de inasistencia señalado no se contemplará como causal de rescisión de la relación de trabajo, toda vez que expresamente mediante la firma que en la presente constancia realice "),
          run("EL PATRÓN", { bold: true }),
          run(", autoriza de conformidad a lo solicitado."),
        ], AlignmentType.JUSTIFIED, 500),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "COLABORADOR: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: nombre, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "NÚMERO DE COLABORADOR: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: String(empleado.id), font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          spacing: { after: 700 },
          children: [
            new TextRun({ text: "DEPARTAMENTO: ", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: empleado.area?.toUpperCase() ?? "—", underline: { type: UnderlineType.SINGLE }, font: FONT, size: SIZE_BODY }),
          ],
        }),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '"EL TRABAJADOR"', bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: '"GERENTE GENERAL"', bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({ spacing: { after: 900 } }),
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
          spacing: { after: 0 },
          children: [
            new TextRun({ text: `C. ${nombre}`, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "HENRY FERNANDO TAMAY SANCHEZ", font: FONT, size: SIZE_BODY }),
          ],
        }),
      ],
    }],
  });

  await descargar(
    doc,
    `Constancia_Inasistencia_${nombre.replace(/ /g, "_")}_${permiso.fecha.slice(0, 10)}.docx`,
  );
}

// ── CONSTANCIA DE AUTORIZACIÓN POR PERIODO DE LACTANCIA ──────────────────────

function to12h(t: string): string {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const ampm = h < 12 ? "a.m." : "p.m.";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

export async function generarPermisoLactancia(
  empleado: Empleado,
  permiso: PermisoEmpleado,
): Promise<void> {
  const fechaInicio = parseLocalDate(permiso.fecha.slice(0, 10));
  const fechaTermino = permiso.fecha_recuperacion
    ? parseLocalDate(permiso.fecha_recuperacion)
    : null;
  const ing = parseLocalDate(empleado.fecha_ingreso);
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();

  const partes = (permiso.hora_llegada ?? "").split("|");
  const horEntrada    = to12h(partes[0] ?? "09:00");
  const horSalidaHabLV  = to12h(partes[1] ?? "18:00");
  const horSalidaHabSab = to12h(partes[2] ?? "14:00");
  const horSalidaNuevaLV  = to12h(partes[3] ?? "16:00");
  const horSalidaNuevaSab = to12h(partes[4] ?? "13:00");

  const dd = String(fechaInicio.getDate()).padStart(2, "0");
  const mm = String(fechaInicio.getMonth() + 1).padStart(2, "0");
  const yy = String(fechaInicio.getFullYear()).slice(2);
  const folio = `RH-LAC-${dd}${mm}${yy}-${fechaInicio.getFullYear()}`;

  const TW = 8640;
  const CW = [2880, 2880, 2880];

  function tcell(text: string, bold = false, header = false): TableCell {
    return new TableCell({
      width: { size: CW[0], type: WidthType.DXA },
      verticalAlign: "center" as const,
      shading: header ? { type: ShadingType.CLEAR, fill: "D9D9D9" } : { type: ShadingType.CLEAR, fill: "FFFFFF" },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60, before: 60 },
        children: [new TextRun({ text, bold, font: FONT, size: SIZE_BODY })],
      })],
    });
  }

  const horarioTable = new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: CW,
    rows: [
      new TableRow({ children: [
        tcell("DÍA", true, true),
        tcell("HORARIO DE ENTRADA", true, true),
        tcell("HORARIO DE SALIDA", true, true),
      ]}),
      new TableRow({ children: [
        tcell("Lunes a viernes"),
        tcell(horEntrada),
        tcell(horSalidaNuevaLV),
      ]}),
      new TableRow({ children: [
        tcell("Sábado"),
        tcell(horEntrada),
        tcell(horSalidaNuevaSab),
      ]}),
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
          run("CONSTANCIA DE AUTORIZACIÓN Y AJUSTE DE HORARIO POR PERIODO DE LACTANCIA", { bold: true, under: true, size: SIZE_TITLE }),
        ], AlignmentType.CENTER, 60),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: 5400 }],
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `Folio: ${folio}`, bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: `Fecha de elaboración: ${fechaLarga(fechaInicio)}`, font: FONT, size: SIZE_BODY }),
          ],
        }),

        para([run("I. DATOS DE LA COLABORADORA", { bold: true, under: true })], AlignmentType.LEFT, 100),
        para([run("Nombre completo: ", { bold: true }), run(nombre)], AlignmentType.LEFT, 60),
        para([run("Puesto: ", { bold: true }), run(empleado.puesto.toUpperCase())], AlignmentType.LEFT, 60),
        para([run("Área/Departamento: ", { bold: true }), run(empleado.area?.toUpperCase() ?? "—")], AlignmentType.LEFT, 60),
        para([
          run("Fecha de ingreso: ", { bold: true }),
          run(`${dd} / ${MESES_UP[ing.getMonth()]} / ${ing.getFullYear()}`),
        ], AlignmentType.LEFT, 60),
        para([
          run("Fecha de inicio del permiso de lactancia: ", { bold: true }),
          run(`${fechaInicio.getDate()} / ${MESES_UP[fechaInicio.getMonth()]} / ${fechaInicio.getFullYear()}`),
        ], AlignmentType.LEFT, 60),
        para([run("Jornada laboral habitual:", { bold: true })], AlignmentType.LEFT, 20),
        para([run(`Lunes a Viernes: ${horEntrada} a ${horSalidaHabLV}`)], AlignmentType.LEFT, 20),
        para([run(`Sábado: ${horEntrada} a ${horSalidaHabSab}`)], AlignmentType.LEFT, 200),

        para([run("II. AUTORIZACIÓN DE AJUSTE DE HORARIO", { bold: true, under: true })], AlignmentType.LEFT, 100),
        para([
          run("Por medio de la presente, "),
          run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true }),
          run(", a través del Departamento de Recursos Humanos, hace constar que la colaboradora anteriormente señalada cuenta con el correspondiente permiso para el periodo de lactancia."),
        ], AlignmentType.JUSTIFIED, 160),
        para([
          run("En atención a lo anterior, y de común acuerdo con la colaboradora, se autoriza que el periodo correspondiente al permiso de lactancia se acumule con el tiempo destinado para la toma de alimentos, a efecto de realizar un ajuste en su horario de salida."),
        ], AlignmentType.JUSTIFIED, 160),
        para([run("Por lo tanto, durante la vigencia de este acuerdo, el horario autorizado para la colaboradora será el siguiente:")], AlignmentType.JUSTIFIED, 100),

        horarioTable,

        blank(),
        para([
          run("El presente ajuste se realiza exclusivamente con motivo del periodo de lactancia y tendrá vigencia a partir del día "),
          run(fechaLarga(fechaInicio), { bold: true, under: true }),
          run(", durante el periodo que corresponda conforme a las disposiciones aplicables."),
        ], AlignmentType.JUSTIFIED, 160),
        para([
          run("La presente constancia tiene como finalidad dejar evidencia documental del horario autorizado por el Departamento de Recursos Humanos y de la conformidad de la colaboradora respecto del ajuste señalado."),
        ], AlignmentType.JUSTIFIED, 200),

        para([run("III. VIGENCIA", { bold: true, under: true })], AlignmentType.LEFT, 100),
        para([
          run("Fecha de inicio: ", { bold: true }),
          run(`${fechaInicio.getDate()} / ${MESES_UP[fechaInicio.getMonth()]} / ${fechaInicio.getFullYear()}`),
        ], AlignmentType.LEFT, 60),
        para([
          run("Fecha de término: ", { bold: true }),
          run(fechaTermino
            ? `${fechaTermino.getDate()} / ${MESES_UP[fechaTermino.getMonth()]} / ${fechaTermino.getFullYear()}`
            : "____________________"),
        ], AlignmentType.LEFT, 160),
        para([
          run("En caso de que exista alguna modificación respecto del horario autorizado, esta deberá ser comunicada previamente al Departamento de Recursos Humanos para los efectos administrativos correspondientes."),
        ], AlignmentType.JUSTIFIED, 200),

        para([run("IV. AUTORIZACIÓN", { bold: true, under: true })], AlignmentType.LEFT, 100),
        para([run("POR LA EMPRESA")], AlignmentType.LEFT, 20),
        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true })], AlignmentType.LEFT, 400),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: 5400 }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: 5400 }],
          spacing: { after: 20 },
          children: [
            new TextRun({ text: "Generalista de Recursos Humanos", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "HENRY FERNANDO TAMAY SANCHEZ", bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: 5400 }],
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "SOLUCIONES TAMIVAR, S.A. DE C.V.", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "DIRECTOR GENERAL", font: FONT, size: SIZE_BODY }),
          ],
        }),

        para([run("V. CONFORMIDAD DE LA COLABORADORA", { bold: true, under: true })], AlignmentType.LEFT, 100),
        para([
          run("Manifiesto que he leído el presente documento y que estoy de acuerdo con el horario autorizado, quedando enterada de las condiciones y vigencia del mismo."),
        ], AlignmentType.JUSTIFIED, 300),

        para([run(`NOMBRE DE LA COLABORADORA: `, { bold: true }), run(nombre, { under: true })], AlignmentType.LEFT, 100),
        para([run("Firma: ____________________________________")], AlignmentType.LEFT, 60),
        para([run("Fecha: ____ / ____ / ______")], AlignmentType.LEFT, 400),

        para([run("SELLO DE RECURSOS HUMANOS", { bold: true })], AlignmentType.CENTER, 20),
        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true })], AlignmentType.CENTER, 20),
        para([run("DEPARTAMENTO DE RECURSOS HUMANOS", { bold: true })], AlignmentType.CENTER),
      ],
    }],
  });

  await descargar(
    doc,
    `Permiso_Lactancia_${nombre.replace(/ /g, "_")}_${permiso.fecha.slice(0, 10)}.docx`,
  );
}

// ── CONSTANCIA DE FALTA JUSTIFICADA SIN GOCE DE SUELDO ───────────────────────

export async function generarConstanciaFaltaJustificada(
  empleado: Empleado,
  permiso: PermisoEmpleado,
): Promise<void> {
  const fechaInicio = parseLocalDate(permiso.fecha.slice(0, 10));
  const fechaFin = permiso.hora_llegada ? parseLocalDate(permiso.hora_llegada.slice(0, 10)) : fechaInicio;
  const fechaReanudacion = permiso.fecha_recuperacion ? parseLocalDate(permiso.fecha_recuperacion) : null;
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const motivo = (permiso.descripcion ?? "").toUpperCase();

  const dia = (d: Date) => String(d.getDate()).padStart(2, "0");
  const mes = (d: Date) => MESES_ES[d.getMonth()];
  const año = (d: Date) => String(d.getFullYear());

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
          run("CONSTANCIA DE FALTA JUSTIFICADA SIN GOCE DE SUELDO", { bold: true, under: true, size: SIZE_TITLE }),
        ], AlignmentType.CENTER, 200),

        para([run("GERENTE GENERAL Y/O REPRESENTANTE LEGAL Y/O AUXILIAR DE RECURSOS HUMANOS", { bold: true })], AlignmentType.CENTER, 20),
        para([run("PRESENTE.", { bold: true })], AlignmentType.CENTER, 200),

        para([
          run("Por medio de la presente, se justifica la ausencia del día "),
          run(`${dia(fechaInicio)} del mes de ${mes(fechaInicio)} del año ${año(fechaInicio)}`, { bold: true }),
          run(", al día "),
          run(`${dia(fechaFin)} del mes de ${mes(fechaFin)} del año ${año(fechaFin)}`, { bold: true }),
          run(" por motivos de "),
          run(motivo, { bold: true }),
          run("."),
        ], AlignmentType.JUSTIFIED, 100),

        para([
          run("Reanudando mis labores en fecha "),
          run(fechaReanudacion ? fechaLarga(fechaReanudacion) : "____________________", { bold: true }),
          run("."),
        ], AlignmentType.JUSTIFIED, 100),

        para([
          run("Lo anterior, sin disfrutar de mi salario durante el periodo señalado de ausencia, autorizando que me sea descontado vía nómina los días de inasistencia señalados."),
        ], AlignmentType.JUSTIFIED, 160),

        para([
          run("En virtud de lo anterior, con fundamento en el artículo 47 fracción X de la Ley Federal del Trabajo, el periodo de inasistencia señalado no se contemplará como causal de rescisión de la relación de trabajo, toda vez que expresamente mediante la firma que en la presente constancia realice "),
          run("EL PATRÓN", { bold: true }),
          run(", autoriza de conformidad a lo solicitado."),
        ], AlignmentType.JUSTIFIED, 300),

        para([run(`COLABORADOR: `, { bold: true }), run(nombre)], AlignmentType.LEFT, 60),
        para([run(`NÚMERO DE COLABORADOR: `, { bold: true }), run(empleado.curp ?? empleado.nss ?? "")], AlignmentType.LEFT, 60),
        para([run(`DEPARTAMENTO: `, { bold: true }), run(empleado.area?.toUpperCase() ?? "—")], AlignmentType.LEFT, 200),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: 5400 }],
          spacing: { after: 300 },
          children: [
            new TextRun({ text: `"EL TRABAJADOR"`, bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: `"AUXILIAR DE RECURSOS HUMANOS"`, bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: 5400 }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: 5400 }],
          spacing: { after: 20 },
          children: [
            new TextRun({ text: `C. ${nombre}`, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "JENNY RIVERA TORRES", bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),
      ],
    }],
  });

  await descargar(
    doc,
    `Falta_Justificada_${nombre.replace(/ /g, "_")}_${permiso.fecha.slice(0, 10)}.docx`,
  );
}
