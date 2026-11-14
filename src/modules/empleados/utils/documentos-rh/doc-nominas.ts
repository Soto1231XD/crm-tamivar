import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, TabStopType,
  FONT, SIZE_BODY, SIZE_TITLE, SIZE_HEAD, MESES_ES, MESES_UP,
  run, para, descargar,
  montoALetras, formatMonto,
} from "./_shared";
import type { Empleado, NominaEmpleado } from "./_shared";

// ── RECIBO DE PAGO DE NÓMINA EN EFECTIVO ─────────────────────────────────────

function numeroALetras(n: number): string {
  if (n === 0) return "CERO PESOS 00/100 M.N.";
  const unidades = ["","UNO","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE",
    "DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISÉIS","DIECISIETE","DIECIOCHO","DIECINUEVE"];
  const decenas  = ["","","VEINTE","TREINTA","CUARENTA","CINCUENTA","SESENTA","SETENTA","OCHENTA","NOVENTA"];
  const centenas = ["","CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS",
    "SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];
  const entero = Math.floor(n);
  const cents  = Math.round((n - entero) * 100);

  function conv(num: number): string {
    if (num === 0) return "";
    if (num === 100) return "CIEN";
    if (num < 20) return unidades[num];
    if (num < 100) {
      const d = Math.floor(num / 10), u = num % 10;
      return d === 2 && u > 0 ? `VEINTI${unidades[u]}` : `${decenas[d]}${u > 0 ? ` Y ${unidades[u]}` : ""}`;
    }
    const c = Math.floor(num / 100), rest = num % 100;
    return `${centenas[c]}${rest > 0 ? ` ${conv(rest)}` : ""}`;
  }

  function convMiles(num: number): string {
    if (num === 0) return "";
    if (num < 1000) return conv(num);
    const miles = Math.floor(num / 1000), resto = num % 1000;
    const prefMiles = miles === 1 ? "MIL" : `${conv(miles)} MIL`;
    return `${prefMiles}${resto > 0 ? ` ${conv(resto)}` : ""}`;
  }

  const str = entero < 1000000
    ? convMiles(entero)
    : `${convMiles(Math.floor(entero / 1000000))} MILLÓN${Math.floor(entero / 1000000) > 1 ? "ES" : ""} ${convMiles(entero % 1000000)}`.trim();

  return `${str} PESOS ${String(cents).padStart(2,"0")}/100 M.N.`;
}

function fmtMXN(val: string | null | undefined): string {
  if (!val) return "—";
  return parseFloat(val).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export async function generarReciboNomina(empleado: Empleado, nomina: NominaEmpleado) {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.toUpperCase();

  const fmtDate = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return `${String(d).padStart(2, "0")} / ${MESES_ES[m - 1].charAt(0).toUpperCase() + MESES_ES[m - 1].slice(1)} / ${y}`;
  };

  const total = parseFloat(nomina.total_pagado);

  const cell = (text: string, bold = false, width = 4320, shaded = false) =>
    new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: shaded ? { type: ShadingType.CLEAR, fill: "EEEEEE" } : undefined,
      children: [new Paragraph({
        children: [new TextRun({ text, font: FONT, size: SIZE_BODY, bold })],
      })],
    });

  const row = (label: string, value: string) =>
    new TableRow({ children: [cell(label, false, 4320, true), cell(value, false, 4320)] });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "SOLUCIONES TAMIVAR S.A. DE C.V.", font: FONT, size: SIZE_HEAD, bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [new TextRun({ text: "RECIBO DE PAGO DE NÓMINA EN EFECTIVO", font: FONT, size: SIZE_TITLE, bold: true })],
        }),

        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "Folio: ", font: FONT, size: SIZE_BODY, bold: true }),
            new TextRun({ text: nomina.folio ?? "____________________", font: FONT, size: SIZE_BODY }),
          ],
        }),

        new Table({
          width: { size: 8640, type: WidthType.DXA },
          columnWidths: [4320, 4320],
          rows: [
            row("Nombre del trabajador:", nombre),
            row("Puesto:", empleado.puesto),
            row("Periodo de pago:", `Del ${fmtDate(nomina.periodo_inicio)} al ${fmtDate(nomina.periodo_fin)}`),
            row("Fecha de pago:", fmtDate(nomina.fecha_pago)),
          ],
        }),

        new Paragraph({ spacing: { after: 120 }, children: [] }),

        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: "Detalle del pago", font: FONT, size: SIZE_BODY, bold: true })],
        }),
        new Table({
          width: { size: 8640, type: WidthType.DXA },
          columnWidths: [4320, 4320],
          rows: [
            new TableRow({ children: [cell("Descripción", true, 4320, true), cell("Importe", true, 4320, true)] }),
            row("Sueldo / salario del periodo", fmtMXN(nomina.sueldo_periodo)),
            row("Otros conceptos", nomina.otros_conceptos ? fmtMXN(nomina.otros_conceptos) : "_________________"),
            row("Descuentos autorizados",    nomina.descuentos_autorizados ? fmtMXN(nomina.descuentos_autorizados) : "_________________"),
            row("Otros descuentos",          nomina.otros_descuentos ? fmtMXN(nomina.otros_descuentos) : "_________________"),
            new TableRow({
              children: [
                cell("TOTAL PAGADO EN EFECTIVO", true, 4320, true),
                new TableCell({
                  width: { size: 4320, type: WidthType.DXA },
                  children: [new Paragraph({
                    children: [new TextRun({ text: fmtMXN(nomina.total_pagado), font: FONT, size: SIZE_BODY, bold: true })],
                  })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { after: 120 }, children: [] }),

        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({ text: "Cantidad recibida con letra:  ", font: FONT, size: SIZE_BODY, bold: true }),
            new TextRun({ text: numeroALetras(total), font: FONT, size: SIZE_BODY }),
          ],
        }),

        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({
            text: "Por medio del presente, declaro haber recibido de Soluciones TAMIVAR S.A. DE C.V., en efectivo y a mi entera satisfacción, la cantidad indicada como TOTAL PAGADO EN EFECTIVO, correspondiente al periodo de nómina señalado en este documento. Manifiesto que el importe recibido corresponde al pago que se me entrega en esta fecha, sin perjuicio de los derechos laborales que legalmente me correspondan.",
            font: FONT, size: SIZE_BODY,
          })],
        }),

        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Observaciones:  ", font: FONT, size: SIZE_BODY, bold: true }),
            ...(nomina.observaciones
              ? [new TextRun({ text: nomina.observaciones, font: FONT, size: SIZE_BODY })]
              : []),
          ],
        }),
        new Paragraph({
          spacing: { after: 0 },
          children: [new TextRun({ text: "__________________________________________________________", font: FONT, size: SIZE_BODY })],
        }),
        new Paragraph({
          spacing: { after: 900 },
          children: [new TextRun({ text: "__________________________________________________________", font: FONT, size: SIZE_BODY })],
        }),

        new Paragraph({
          tabStops: [{ type: TabStopType.CENTER, position: 2340 }, { type: TabStopType.CENTER, position: 7020 }],
          spacing: { after: 600 },
          children: [
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.CENTER, position: 2340 }, { type: TabStopType.CENTER, position: 7020 }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "Nombre y firma del trabajador", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "Nombre y firma de quien entrega", font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.CENTER, position: 2340 }, { type: TabStopType.CENTER, position: 7020 }],
          spacing: { after: 240 },
          children: [
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: `C. ${nombre}`, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "Este recibo deberá conservarse como comprobante del pago efectuado.", font: FONT, size: SIZE_BODY, italics: true })],
        }),
      ],
    }],
  });

  await descargar(doc, `Nomina_${nombre.replace(/ /g, "_")}_${nomina.periodo_inicio.slice(0, 10)}.docx`);
}

// ── SOLICITUD DE ADELANTO DE NÓMINA ──────────────────────────────────────────

export interface AdelantoNominaData {
  monto: number;
  formaDescuento: "proxima" | "parcialidades" | "otro";
  parcialidades?: number;
  otro?: string;
}

export async function generarSolicitudAdelanto(empleado: Empleado, data: AdelantoNominaData): Promise<void> {
  const hoy    = new Date();
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const fechaStr = `CANCÚN, QUINTANA ROO A ${hoy.getDate()} DE ${MESES_UP[hoy.getMonth()]} DEL ${hoy.getFullYear()}`;

  const chk = (checked: boolean) => checked ? "☑" : "☐";

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1417, right: 1701, bottom: 1417, left: 1701 },
        },
      },
      children: [
        para([run("SOLICITUD DE ADELANTO DE NÓMINA", { bold: true, size: SIZE_HEAD })], AlignmentType.CENTER, 200),

        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true })], AlignmentType.LEFT, 0),
        para([run("GERENTE GENERAL Y/O REPRESENTANTE LEGAL Y/O", { bold: true })], AlignmentType.LEFT, 0),
        para([run("GERENTE DE RECURSOS HUMANOS.", { bold: true })], AlignmentType.LEFT, 160),
        para([run("PRESENTE.", { bold: true })], AlignmentType.LEFT, 200),

        new Paragraph({
          spacing: { before: 100, after: 100, line: 240, lineRule: "auto" as never },
          children: [
            run("Lugar y fecha: ", { bold: true }),
            run(fechaStr),
          ],
        }),

        new Paragraph({
          spacing: { before: 100, after: 100, line: 240, lineRule: "auto" as never },
          children: [
            run("Por medio de la presente, el(la) que suscribe:"),
          ],
        }),

        new Paragraph({
          spacing: { before: 60, after: 0, line: 240, lineRule: "auto" as never },
          children: [run("Nombre del colaborador: ", { bold: true }), run(nombre)],
        }),
        new Paragraph({
          spacing: { before: 0, after: 0, line: 240, lineRule: "auto" as never },
          children: [run("Puesto: ", { bold: true }), run(empleado.puesto.toUpperCase())],
        }),
        new Paragraph({
          spacing: { before: 0, after: 160, line: 240, lineRule: "auto" as never },
          children: [run("Área/Departamento: ", { bold: true }), run(empleado.area.toUpperCase())],
        }),

        new Paragraph({
          spacing: { before: 100, after: 60, line: 240, lineRule: "auto" as never },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            run("Solicito atentamente se me otorgue un "),
            run("anticipo de nómina", { bold: true }),
            run(" por la cantidad de:"),
          ],
        }),

        para([
          run(`$${formatMonto(data.monto)} `, { bold: true }),
          run(`(${montoALetras(data.monto)})`, { bold: true }),
        ], AlignmentType.LEFT, 160),

        new Paragraph({
          spacing: { before: 100, after: 80, line: 240, lineRule: "auto" as never },
          children: [run("El cual solicito sea descontado vía nómina en:")],
        }),

        new Paragraph({
          spacing: { before: 0, after: 60, line: 240, lineRule: "auto" as never },
          children: [
            run(`${chk(data.formaDescuento === "proxima")}  `),
            run("La próxima nómina", { bold: data.formaDescuento === "proxima" }),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 60, line: 240, lineRule: "auto" as never },
          children: [
            run(`${chk(data.formaDescuento === "parcialidades")}  `),
            run(
              data.formaDescuento === "parcialidades" && data.parcialidades
                ? `En ${data.parcialidades} parcialidades iguales de $${formatMonto(data.monto / data.parcialidades)} c/u`
                : "En ____ parcialidades iguales",
              { bold: data.formaDescuento === "parcialidades" }
            ),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 320, line: 240, lineRule: "auto" as never },
          children: [
            run(`${chk(data.formaDescuento === "otro")}  `),
            run(
              data.formaDescuento === "otro" && data.otro
                ? `Otro: ${data.otro}`
                : "Otro: ___________________________________________",
              { bold: data.formaDescuento === "otro" }
            ),
          ],
        }),

        para([run("COLABORADOR: ", { bold: true }), run(nombre, { bold: true })], AlignmentType.LEFT, 0),
        para([run("NÚMERO DE COLABORADOR: ", { bold: true }), run((empleado.curp ?? String(empleado.id)).toUpperCase(), { bold: true })], AlignmentType.LEFT, 0),
        para([run("DEPARTAMENTO: ", { bold: true }), run(empleado.area.toUpperCase(), { bold: true })], AlignmentType.LEFT, 400),

        new Paragraph({
          tabStops: [{ type: TabStopType.CENTER, position: 2340 }, { type: TabStopType.CENTER, position: 7020 }],
          spacing: { after: 0 },
          children: [
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: '"EL TRABAJADOR"', font: FONT, size: SIZE_BODY, bold: true }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: '"GERENTE GENERAL"', font: FONT, size: SIZE_BODY, bold: true }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.CENTER, position: 2340 }, { type: TabStopType.CENTER, position: 7020 }],
          spacing: { after: 600 },
          children: [new TextRun({ text: "", font: FONT, size: SIZE_BODY })],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.CENTER, position: 2340 }, { type: TabStopType.CENTER, position: 7020 }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.CENTER, position: 2340 }, { type: TabStopType.CENTER, position: 7020 }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: `C. ${nombre}`, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "HENRY FERNANDO TAMAY SÁNCHEZ", font: FONT, size: SIZE_BODY }),
          ],
        }),
      ],
    }],
  });

  await descargar(doc, `Adelanto_Nomina_${nombre.replace(/ /g, "_")}_${hoy.toISOString().slice(0, 10)}.docx`);
}
