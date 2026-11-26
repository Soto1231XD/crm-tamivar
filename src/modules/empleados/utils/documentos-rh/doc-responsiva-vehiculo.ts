import {
  Document, Paragraph, TextRun, AlignmentType, TabStopType,
  FONT, SIZE_BODY, SIZE_TITLE, SIZE_HEAD, MESES_ES,
  run, para, descargar, parseLocalDate,
} from "./_shared";
import type { Empleado } from "./_shared";
import type { ResponsivaEmpleado, DatosVehiculo } from "../../services/responsivas.api";

export async function generarResponsivaVehiculo(
  empleado: Empleado,
  responsiva: ResponsivaEmpleado,
  opts?: { onlyBlob?: boolean },
): Promise<Blob> {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const fecha  = parseLocalDate(responsiva.fecha.slice(0, 10));
  const fechaLarga = `${fecha.getDate()} de ${MESES_ES[fecha.getMonth()]} de ${fecha.getFullYear()}`;

  const d: DatosVehiculo = JSON.parse(responsiva.datos);

  const TAB = 5400;
  const linea = "____________________________";

  const campoP = (label: string, valor: string) =>
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, font: FONT, size: SIZE_BODY }),
        new TextRun({ text: valor || "—", font: FONT, size: SIZE_BODY }),
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
        para([run("RESPONSIVA DE USO LABORAL DE VEHÍCULO", { bold: true, under: true, size: SIZE_TITLE })], AlignmentType.CENTER, 300),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276, lineRule: "auto", before: 0, after: 300 },
          children: [
            new TextRun({ text: "En la ciudad de Cancún, Quintana Roo, a ", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: fechaLarga, bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: ", yo ", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: nombre, bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: ", en mi carácter de colaborador(a) de la empresa ", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "SOLUCIONES TAMIVAR S.A. DE C.V.", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: ", declaro que recibo en buenas condiciones el vehículo que se describe a continuación, el cual será utilizado única y exclusivamente para fines laborales:", font: FONT, size: SIZE_BODY }),
          ],
        }),

        para([run("DATOS DEL VEHÍCULO", { bold: true })], AlignmentType.LEFT, 60),
        campoP("Marca",           d.marca),
        campoP("Modelo",          d.modelo),
        campoP("Año",             d.anio),
        campoP("Color",           d.color),
        campoP("Placas",          d.placas),
        campoP("Número de serie", d.num_serie),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        para([run("CONDICIONES DE USO LABORAL", { bold: true })], AlignmentType.LEFT, 60),

        ...[
          "El vehículo será utilizado únicamente para actividades relacionadas con mis funciones laborales.",
          "Me comprometo a conducir el vehículo de manera responsable, respetando el Reglamento de Tránsito y demás disposiciones legales aplicables.",
          "Declaro contar con licencia de conducir vigente durante todo el periodo de uso del vehículo.",
          "Seré responsable de cualquier multa, infracción o sanción derivada del uso indebido del vehículo.",
          "En caso de daño, accidente o siniestro ocasionado por negligencia, imprudencia o incumplimiento de esta responsiva, asumiré la responsabilidad correspondiente.",
          "Me comprometo a reportar de inmediato cualquier falla mecánica, daño o incidente ocurrido durante el uso del vehículo.",
          "Queda estrictamente prohibido ceder el uso del vehículo a terceros sin autorización expresa y por escrito de la empresa.",
          "El vehículo deberá ser devuelto cuando la empresa lo solicite, en las mismas condiciones en que fue entregado, considerando únicamente el desgaste normal por uso laboral.",
        ].map((txt, i) =>
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 276, lineRule: "auto", before: 0, after: 80 },
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true, font: FONT, size: SIZE_BODY }),
              new TextRun({ text: txt, font: FONT, size: SIZE_BODY }),
            ],
          })
        ),

        new Paragraph({ spacing: { after: 160 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 },
          children: [new TextRun({ text: "La empresa no será responsable por objetos personales dejados dentro del vehículo.", font: FONT, size: SIZE_BODY })],
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Leída la presente y estando conforme con su contenido y alcance legal, firmo la presente responsiva para los efectos que haya lugar.", font: FONT, size: SIZE_BODY })],
        }),

        // Firmas
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB }],
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "Firma del colaborador(a)", bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "Firma del representante de la empresa", bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: linea, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: linea, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB }],
          spacing: { after: 20 },
          children: [
            new TextRun({ text: `C. ${nombre}`, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "HENRY FERNANDO TAMAY SANCHEZ", bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB }],
          spacing: { after: 0 },
          children: [
            new TextRun({ text: `(${empleado.puesto.toUpperCase()})`, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "(Representante de la empresa)", font: FONT, size: SIZE_BODY }),
          ],
        }),
      ],
    }],
  });

  return descargar(
    doc,
    `Responsiva_Vehiculo_${nombre.replace(/ /g, "_")}_${responsiva.fecha.slice(0, 10)}.docx`,
    opts?.onlyBlob,
  );
}
