import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType,
  FONT, MESES_UP, enteroALetras,
  descargar,
} from "./_shared";
import { BorderStyle } from "docx";

export interface ContratoDeterminadoData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  puesto: string;
  curp: string;
  rfc: string;
  nss: string;
  genero: string;
  sueldo: number;
  periodicidad_sueldo: string;
  fecha_inicio: string;  
  fecha_fin: string;      
  dias_prueba: number;    
  estado_civil: string;
  clave_elector: string;
  descripcion_puesto: string;
  beneficiario_nombre: string;
  beneficiario_parentesco: string;
  beneficiario_fecha_nac: string;
  beneficiario_porcentaje: number;
}

const SZ  = 24;  
const LN  = 276; 
const thinB = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const noB   = { style: BorderStyle.NONE,   size: 0, color: "auto"   };

const r = (text: string, bold = false) =>
  new TextRun({ text, font: FONT, size: SZ, bold });

const jP = (text: string, after = 160) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [r(text)],
  });

const jPR = (runs: TextRun[], after = 160) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: runs,
  });

const cP = (text: string, bold = false, after = 120) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [r(text, bold)],
  });

const clauseH = (text: string) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LN, lineRule: "auto", before: 280, after: 160 },
    children: [r(text, true)],
  });

const clauseT = (text: string) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 200, after: 80 },
    children: [r(text, true)],
  });

const gap = (after = 200) => new Paragraph({ spacing: { before: 0, after }, children: [] });

function montoALetras(val: number): string {
  const entero = Math.floor(val);
  const cents  = Math.round((val - entero) * 100);
  return `${enteroALetras(entero)} PESOS ${String(cents).padStart(2, "0")}/100 M.N.`;
}

function fmtSueldo(n: number): string {
  return `MXN $${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function diaALetras(d: number): string {
  const nums = [
    "","UNO","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE",
    "DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISÉIS","DIECISIETE","DIECIOCHO","DIECINUEVE",
    "VEINTE","VEINTIÚN","VEINTIDÓS","VEINTITRÉS","VEINTICUATRO","VEINTICINCO","VEINTISÉIS",
    "VEINTISIETE","VEINTIOCHO","VEINTINUEVE","TREINTA","TREINTA Y UNO",
  ];
  return nums[d] ?? String(d);
}

function fechaContratoLegal(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${diaALetras(d)} DÍAS DEL MES DE ${MESES_UP[m - 1]} DEL AÑO ${enteroALetras(y).toUpperCase()}`;
}

function fechaNacLegal(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${String(d).padStart(2, "0")} DE ${MESES_UP[m - 1]} DE ${y}`;
}

function fechaCorta(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} de ${MESES_UP[m - 1].charAt(0) + MESES_UP[m - 1].slice(1).toLowerCase()} de ${y}`;
}

function estadoCivilGendered(estado: string, genero: string): string {
  const fem = genero.toLowerCase() === "femenino";
  const map: Record<string, [string, string]> = {
    Soltero:       ["soltero",    "soltera"],
    Casado:        ["casado",     "casada"],
    Divorciado:    ["divorciado", "divorciada"],
    Viudo:         ["viudo",      "viuda"],
    "Unión libre": ["unión libre","unión libre"],
  };
  const pair = map[estado];
  if (!pair) return estado.toLowerCase();
  return fem ? pair[1] : pair[0];
}

function periodicidadAdv(p: string): string {
  if (p === "Quincenal") return "quincenalmente";
  if (p === "Semanal")   return "semanalmente";
  return "mensualmente";
}

function sueldoMensual(sueldo: number, periodicidad: string): number {
  if (periodicidad === "Quincenal") return sueldo * 2;
  if (periodicidad === "Semanal")   return Math.round(sueldo * (52 / 12));
  return sueldo;
}

function tCell(text: string, widthPct: number, fill: string, bold = false) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, color: "auto", fill },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [r(text, bold)],
    })],
  });
}

function firmaCell(titulo: string, nombre: string, subtitulo: string, widthPct: number) {
  const children: Paragraph[] = [
    cP(titulo, true, 0),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 60 },
      border: { top: thinB },
      children: [],
    }),
  ];
  if (nombre)    children.push(cP(nombre, false, 0));
  if (subtitulo) children.push(cP(subtitulo, false, 0));
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFFFFF" },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children,
  });
}

export async function generarContratoDeterminado(d: ContratoDeterminadoData) {
  const nombreCompleto = `${d.nombre} ${d.apellido_paterno} ${d.apellido_materno}`.trim().toUpperCase();
  const puestoUp    = d.puesto.toUpperCase();
  const sexo        = d.genero.toLowerCase() === "femenino" ? "femenino" : "masculino";
  const estadoCivil = estadoCivilGendered(d.estado_civil, d.genero);
  const monthSueldo = sueldoMensual(d.sueldo, d.periodicidad_sueldo);
  const sueldoFmt   = fmtSueldo(monthSueldo);
  const sueldoLetr  = montoALetras(monthSueldo);
  const perAdv      = periodicidadAdv(d.periodicidad_sueldo);
  const fechaFirma  = fechaContratoLegal(d.fecha_inicio);
  const benFechaNac = fechaNacLegal(d.beneficiario_fecha_nac);
  const fechaIniStr = fechaCorta(d.fecha_inicio);
  const fechaFinStr = fechaCorta(d.fecha_fin);
  const diasLetr    = enteroALetras(d.dias_prueba).toUpperCase();

  const actividadesP = d.descripcion_puesto
    .split("\n")
    .filter((l) => l.trim())
    .map((l) =>
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: LN, lineRule: "auto", before: 0, after: 120 },
        indent: { left: 360 },
        children: [r(l.trim())],
      })
    );

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 } } },
      children: [

        // ── Título ──────────────────────────────────────────────────────────
        cP("CONTRATO INDIVIDUAL DE TRABAJO POR TIEMPO DETERMINADO", true, 0),
        cP("SUJETO A PERIODO DE PRUEBA", true, 240),

        jPR([
          r("QUE CELEBRAN POR UNA PARTE LA SOCIEDAD MERCANTIL DENOMINADA "),
          r('"SOLUCIONES TAMIVAR", SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE', true),
          r(", REPRESENTADA EN ESTE ACTO POR SU ADMINISTRADOR ÚNICO EL "),
          r("C. HENRY FERNANDO TAMAY SANCHEZ", true),
          r(', A QUIEN EN LO SUCESIVO Y PARA LOS EFECTOS LEGALES DEL PRESENTE CONTRATO SE LE DENOMINARÁ COMO '),
          r('"LA EMPRESA" Y/O "EL PATRÓN"', true),
          r(", Y, POR OTRA PARTE, EL "),
          r(`C. ${nombreCompleto}`, true),
          r(', A QUIEN EN LO SUCESIVO Y PARA LOS EFECTOS LEGALES DEL PRESENTE CONTRATO SE LE DENOMINARÁ COMO '),
          r('"EL TRABAJADOR"', true),
          r(', Y CONJUNTAMENTE AMBOS CELEBRANTES EN LO SUCESIVO SE LES DENOMINARÁ COMO '),
          r('"LAS PARTES"', true),
          r(" DE CONFORMIDAD CON LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:"),
        ]),

        // ── DECLARACIONES ───────────────────────────────────────────────────
        clauseH("DECLARACIONES"),

        clauseT(`PRIMERA. "LA EMPRESA" Y/O "EL PATRON", POR CONDUCTO DE SU REPRESENTANTE LEGAL, BAJO PROTESTA DE DECIR VERDAD, DECLARA:`),
        jP(`Que es una Sociedad Mercantil constituida de conformidad con la Legislación Mexicana, lo que acredita mediante la Escritura Pública número 10,047 (diez mil cuarenta y siete), Volumen Cuadragésimo Cuarto, Tomo "D", de fecha veinticuatro de julio del dos mil veinticuatro, otorgada ante la Fe del Licenciado Abraham Gómez Juárez, Notario Público Suplente de la Notaria Pública número Seis del Estado de Quintana Roo, misma que corre agregada al presente contrato en copia simple como ANEXO 1.`),
        jP(`Que su representante legal cuenta con las facultades necesarias como Administrador Único de la "EMPRESA Y/O EL PATRÓN" para obligarla en términos del presente contrato, lo que acredita mediante la Escritura Pública descrita en la fracción que antecede.`),
        jP(`Que se encuentra inscrita ante el Servicio de Administración Tributaria (SAT), bajo el Registro Federal de Contribuyentes (RFC) alfanumérico STA240724718.`),
        jP(`Que dentro de su objeto social se contempla la compraventa de bienes inmuebles, arrendamientos, subarrendamientos y comercialización de toda clase de bienes inmuebles, así como la celebración de toda clase de contratos para el cumplimiento de su objeto social.`),
        jPR([
          r(`Ser su voluntad celebrar el presente contrato individual de trabajo por tiempo determinado sujeto a periodo de prueba con `),
          r('"EL TRABAJADOR"', true),
          r(` para el puesto de `), r(puestoUp, true), r("."),
        ]),

        clauseT(`SEGUNDA. "EL TRABAJADOR", POR SU PROPIO Y PERSONAL DERECHO, BAJO PROTESTA DE DECIR VERDAD, DECLARA:`),
        jPR([
          r("Ser una persona física, de estado civil "), r(estadoCivil, true),
          r(", sexo "), r(sexo, true),
          r(", de nacionalidad mexicana y con capacidad jurídica para celebrar el presente contrato."),
        ]),
        jPR([
          r("Identificarse con su Credencial para Votar debidamente expedida por el Instituto Nacional Electoral (INE), con Clave de Elector alfanumérica "),
          r(d.clave_elector.toUpperCase(), true),
          r(", misma que corre agregada al presente contrato en copia simple como ANEXO 2."),
        ]),
        jPR([
          r("Contar con una Clave Única de Registro de Población alfanumérico "),
          r(d.curp, true),
          r(", lo que acredita mediante Constancia de la Clave Única de Registro de Población, misma que corre agregada al presente contrato en copia simple como ANEXO 3."),
        ]),
        jPR([
          r("Estar registrado ante el Servicio de Administración Tributaria (SAT), bajo el Registro Federal de Contribuyentes (RFC) alfanumérico "),
          r(d.rfc, true),
          r(", lo que acredita mediante Constancia de Situación Fiscal (CSF), misma que corre agregada al presente contrato en copia simple como ANEXO 4."),
        ]),
        jPR([
          r("Estar inscrito ante el Instituto Mexicano del Seguro Social, bajo el Número de Seguridad Social "),
          r(d.nss, true), r("."),
        ]),
        jP(`Que no cuenta con ningún otro empleo remunerado con otro patrón o empresa, y, por ende, no recibe ninguna otra remuneración laboral por concepto de nómina.`),
        jPR([
          r("Que cuenta con los conocimientos, experiencia y habilidades necesarios para llevar a cabo las actividades del puesto de "),
          r(puestoUp, true), r(` requeridas por `), r('"LA EMPRESA" Y/O "EL PATRON"', true), r("."),
        ]),
        jPR([
          r(`Ser su voluntad celebrar el presente contrato individual de trabajo por tiempo determinado sujeto a periodo de prueba con `),
          r('"LA EMPRESA" Y/O "EL PATRON"', true),
          r(` para el puesto de `), r(puestoUp, true), r("."),
        ]),

        clauseT(`TERCERA. "LAS PARTES", REPRESENTADAS POR COMO HA QUEDADO DICHO, BAJO PROTESTA DE DECIR VERDAD, DECLARAN:`),
        jPR([
          r(`Que vistas las declaraciones que anteceden, ambas partes convienen en someterse a las obligaciones que se desprenden del presente `),
          r("CONTRATO INDIVIDUAL DE TRABAJO SUJETO A PERIODO DE PRUEBA", true),
          r(", contenidas en las siguientes:"),
        ]),

        // ── CLÁUSULAS ────────────────────────────────────────────────────────
        clauseH("CLÁUSULAS"),

        clauseT("PRIMERA. DESCRIPCIÓN DEL PUESTO."),
        jPR([
          r('"EL TRABAJADOR"', true),
          r(", tendrá la obligación de prestar su trabajo personal y subordinado a "),
          r('"LA EMPRESA" Y/O "EL PATRON"', true),
          r(", bajo el puesto de "), r(puestoUp, true),
          r(", que incluyen las actividades y servicios de:"),
        ]),
        ...actividadesP,
        jP(`Mismas labores que se compromete a llevar a cabo, así como cualquier otra actividad relacionada e inherente a las anteriormente descritas, debiendo dar cabal cumplimiento en el momento en el que le sean requeridas por "LA EMPRESA", así como cualquier otra que sea compatible con sus fuerzas, aptitudes, estado o condición y que sea del mismo género de los que formen el objeto de "LA EMPRESA".`),
        jP(`En atención a la dinámica del giro comercial a la que se dedica "LA EMPRESA", se espera que "EL TRABAJADOR", sea flexible y capaz de adaptarse a las necesidades cambiantes del entorno laboral.`),

        clauseT("SEGUNDA. UBICACIÓN DEL CENTRO DE TRABAJO."),
        jPR([
          r('"EL TRABAJADOR"', true),
          r(", desempeñará sus funciones y servicios en la fuente de Trabajo ubicado en la dirección "),
          r("LOTE 20, MANZANA 52, REGIÓN 97, EN ESTA CIUDAD DE CANCÚN, ESTADO DE QUINTANA ROO", true),
          r(`. "LAS PARTES" acuerdan que dicha ubicación puede ser sujeta a cambios a discreción de "EL PATRON", dependiendo de sus necesidades operativas.`),
        ]),
        jP(`Se establece que, en el contexto de los servicios prestados por "EL PATRÓN" a sus clientes, la única responsable de la relación laboral entre las partes será "EL PATRÓN". En ningún caso, los clientes a los que "EL TRABAJADOR" sea asignado serán responsables de las obligaciones laborales.`),

        // ── CLÁUSULA TERCERA — diferente en contrato determinado ─────────────
        clauseT("TERCERA. PRESTACIÓN DEL TRABAJO Y VIGENCIA."),
        jPR([
          r('"LAS PARTES"', true),
          r(` acuerdan que la relación laboral iniciará el día `),
          r(fechaIniStr, true),
          r(` y tendrá una vigencia hasta el día `),
          r(fechaFinStr, true),
          r(`. Asimismo, el presente contrato estará sujeto a un periodo de prueba de `),
          r(`${d.dias_prueba} (${diasLetr}) días`, true),
          r(`, contado a partir de la fecha de inicio de la relación laboral.`),
        ]),
        jPR([
          r('"EL TRABAJADOR"', true),
          r(` se compromete a prestar sus servicios de trabajo con diligencia y oportunidad. Estará sujeto a la dirección y dependencia del jefe inmediato designado por `),
          r('"EL PATRÓN"', true),
          r(". Este compromiso incluye la observancia de instrucciones, el respeto a los horarios establecidos, el acatamiento de los reglamentos internos de trabajo y políticas de \"EL PATRÓN\", así como el cumplimiento de las leyes aplicables en materia laboral."),
        ]),
        jP(`"EL TRABAJADOR" manifiesta conocer y observar las disposiciones contenidas en el reglamento interior de trabajo, que estará fijado visiblemente en el centro laboral en el que desempeñará sus funciones, debiendo dar cabal cumplimiento en todo momento de lo que su contenido dispone, y que dicho reglamento forma parte integral del presente contrato como ANEXO 5.`),

        clauseT("CUARTA. DE LA FORMA Y MONTO DEL SALARIO."),
        jPR([
          r('"EL TRABAJADOR"', true),
          r(` percibirá por concepto de salario la cantidad mensual de `),
          r(`${sueldoFmt} (${sueldoLetr})`, true),
          r(`, el cual será pagado `), r(perAdv, true),
          r(`. El pago se realizará en el lugar de trabajo o a través de los medios acordados por ambas partes. El pago podrá realizarse en efectivo, cheque, mediante depósito o transferencia bancaria a la cuenta designada por "EL TRABAJADOR" o asignada por "EL PATRÓN".`),
        ]),
        jP(`"EL TRABAJADOR" autoriza expresamente a "EL PATRÓN" para efectuar el pago de su salario y otras prestaciones, ya sea en efectivo, cheque o mediante transferencia electrónica, de manera indistinta, conforme al artículo 101 de la Ley Federal del Trabajo. La cantidad señalada incluye la parte proporcional de los días de descanso semanal y los días de descanso obligatorio no trabajados. "EL TRABAJADOR" deberá firmar un recibo al recibir su remuneración.`),
        jP(`Asimismo, "EL TRABAJADOR" autoriza a "EL PATRÓN" para deducir de su salario los impuestos correspondientes, las cuotas obreras del Instituto Mexicano del Seguro Social y cualquier otra obligación a su cargo, según lo establecido en los artículos 97 y 110 de la Ley Federal del Trabajo. "EL PATRÓN" enviará a la dirección de correo electrónico proporcionada por "EL TRABAJADOR" los comprobantes de cualquier pago nominal ordinario y/o extraordinario realizado.`),

        clauseT("QUINTA. DE LA SEGURIDAD SOCIAL."),
        jPR([
          r('"EL PATRON"', true),
          r(` asume la responsabilidad de dar de alta a `), r('"EL TRABAJADOR"', true),
          r(` ante el Instituto Mexicano del Seguro Social (IMSS) y de cumplir con todas las obligaciones patronales de manera puntual, de acuerdo con lo establecido por la legislación vigente en la materia.`),
        ]),

        clauseT("SEXTA. JORNADA LABORAL Y AJUSTES DE TURNO."),
        jPR([
          r('"LAS PARTES"', true),
          r(` acuerdan que la jornada laboral será determinada por "LA EMPRESA" en función de sus necesidades y conforme a lo dispuesto en el Capítulo Segundo de la Ley Federal del Trabajo. Dicha jornada no excederá las 48 horas semanales, distribuidas en turnos de hasta 8 horas diarias. Se incluirá media hora para el disfrute de alimentos y se otorgará al menos un día de descanso con goce de salario íntegro por cada 6 días trabajados.`),
        ]),
        jP(`Cualquier hora de trabajo extraordinario deberá ser acordada previamente por escrito y será compensada por "LA EMPRESA" según lo establecido en el Artículo 67 de la Ley Federal del Trabajo. "EL TRABAJADOR" manifiesta su conformidad para ajustar su turno u horario de trabajo según las necesidades de "LA EMPRESA", sin que esto implique una modificación de sus condiciones generales de trabajo.`),
        jP(`Solo mediante una orden expresa y por escrito de "LA EMPRESA", "EL TRABAJADOR" podrá prestar servicios fuera de la jornada laboral, así como en los días de descanso semanales o días de descanso obligatorios. "EL TRABAJADOR" acepta la posibilidad de futuros ajustes en su turno u horario laboral, siempre respetando la jornada legal de trabajo.`),

        clauseT("SÉPTIMA. NOTIFICACIÓN DE AUSENCIAS."),
        jPR([
          r(`En caso de que `), r('"EL TRABAJADOR"', true),
          r(` se vea imposibilitado de asistir a sus labores diarias, se compromete a notificar a la `),
          r('"EMPRESA"', true),
          r(` dentro de la primera hora de iniciada la jornada laboral. Al reincorporarse, "EL TRABAJADOR" deberá presentar el comprobante correspondiente, siendo aceptado únicamente el certificado de incapacidad emitido por el IMSS.`),
        ]),
        jP(`En caso de inasistencia sin justificación, "EL TRABAJADOR" deberá comunicar por escrito con antelación a "LA EMPRESA", especificando la causa de la ausencia. Se le informa que la falta injustificada será considerada como tal, de acuerdo con el Artículo 47 de la Ley Federal del Trabajo.`),

        clauseT("OCTAVA. DE LA CONFIDENCIALIDAD Y USO DE IMAGEN."),
        jP(`Las partes se comprometen a mantener estricta confidencialidad sobre toda la información generada entre ellas. No podrán comunicarla ni utilizarla con fines comerciales distintos a los establecidos en este Contrato. Ambas reconocen que dicha información constituye un secreto industrial, según lo estipulado en el Artículo 82 de la Ley Federal de Protección a la Propiedad Industrial.`),
        jP(`Al concluir la relación laboral, ambas partes acuerdan devolverse mutuamente toda la información intercambiada o destruirla según solicitud de la contraparte, comprometiéndose a mantener la confidencialidad de manera indefinida. El incumplimiento de esta obligación por parte de "EL TRABAJADOR" constituirá causa de rescisión de la relación laboral sin responsabilidad para "LA EMPRESA".`),
        jP(`"EL TRABAJADOR" se compromete a no revelar ni utilizar en perjuicio de "EL PATRÓN" información confidencial tales como información técnica, financiera, fiscal, crediticia y comercial, incluso después de la conclusión del contrato por el período de 10 años. En el caso de que, durante sus labores, realice invenciones o mejoras relacionados con los procedimientos o propiedad intelectual de "LA EMPRESA", la propiedad y derecho de explotación corresponden exclusivamente a "LA EMPRESA".`),
        jP(`Adicionalmente, "EL TRABAJADOR" autoriza a "LA EMPRESA" para utilizar su imagen en actividades relacionadas con la promoción del negocio. Esta autorización es otorgada de manera gratuita, informada y voluntaria, y será vigente durante el plazo de la relación laboral y hasta por seis meses aun cuando se dé por finalizada y/o rescindida la misma.`),

        clauseT("NOVENA. DE LOS RECONOCIMIENTOS MÉDICOS Y CAPACITACIÓN."),
        jPR([
          r('"EL TRABAJADOR"', true),
          r(`, a solicitud de "LA EMPRESA", se someterá a los reconocimientos médicos, técnicos y científicos que resulten procedentes. "LA EMPRESA" asumirá el costo de estos reconocimientos cuando sean realizados a través de servicios ajenos al IMSS. Adicionalmente, "EL TRABAJADOR" se compromete a participar en los planes y programas de capacitación vigentes en el centro de trabajo y a actualizar sus antecedentes no penales cada 6 meses y su domicilio cada 3 meses.`),
        ]),

        clauseT("DÉCIMA. AGUINALDO."),
        jP(`Por el tiempo trabajado, "EL TRABAJADOR" tendrá derecho a percibir la parte proporcional del aguinaldo anual equivalente a quince días de salario, el cual deberá pagarse antes del día veinte de diciembre, conforme al Artículo 87 de la Ley Federal del Trabajo.`),

        clauseT("DÉCIMA PRIMERA. VACACIONES."),
        jP(`"EL TRABAJADOR" disfrutará de los días de vacaciones proporcionales que le correspondan según el Artículo 76 de la Ley Federal del Trabajo. Además, recibirá un 25% de su sueldo como prima vacacional sobre los días que le corresponda disfrutar. Las fechas de vacaciones se establecerán de mutuo acuerdo, tomando en cuenta las necesidades y políticas de "LA EMPRESA".`),

        clauseT("DÉCIMA SEGUNDA. TERMINACIÓN DEL CONTRATO."),
        jPR([
          r(`El presente contrato terminará en la fecha pactada el `),
          r(fechaFinStr, true),
          r(`, salvo que antes sobrevenga alguna de las causas de rescisión previstas en la Ley Federal del Trabajo. En caso de terminación, se respetarán los derechos y obligaciones establecidos por la Ley Federal del Trabajo con respecto al pago proporcional de las prestaciones que correspondan.`),
        ]),

        clauseT("DÉCIMA TERCERA. PARTICIPACIÓN EN PROGRAMAS DE SEGURIDAD E HIGIENE."),
        jPR([
          r('"EL TRABAJADOR"', true),
          r(` se integrará a los planes y programas de seguridad e higiene, capacitación y adiestramiento, y otros establecidos o que se establezcan por parte de "LA EMPRESA". Deberá participar activamente en estos programas, según lo establecido en el Capítulo III Bis, del Título Cuarto de la Ley Federal del Trabajo.`),
        ]),

        clauseT("DÉCIMA CUARTA. DECLARACIÓN DE EXCLUSIVIDAD."),
        jPR([
          r('"EL TRABAJADOR"', true),
          r(` declara que no tiene relación laboral actual con ninguna empresa excepto "LA EMPRESA" y reconoce que no existe relación laboral o de cualquier otra índole con la empresa o empresas a las que sea asignado. La omisión de esta obligación podrá ser causa de despido justificado para "EL TRABAJADOR", sin responsabilidad para "LA EMPRESA".`),
        ]),

        clauseT("DÉCIMA QUINTA. RESPONSABILIDAD SOBRE INSTRUMENTOS Y BIENES."),
        jPR([
          r('"EL TRABAJADOR"', true),
          r(` asume la responsabilidad total del cuidado y conservación de los instrumentos, herramientas, inmuebles, mobiliario, instalaciones, información en soportes físicos o electrónicos, y demás bienes propiedad de "LA EMPRESA". Asimismo, "EL TRABAJADOR" asume la responsabilidad de los instrumentos identificados en el documento que se agrega como ANEXO 6, siendo únicamente responsabilidad de "LA EMPRESA" los mantenimientos preventivos que requieran dicho instrumento.`),
        ]),

        clauseT("DÉCIMA SEXTA. LEGISLACIÓN Y USOS COMERCIALES."),
        jP(`Las partes acuerdan que todo lo no previsto en el presente Contrato se regirá por las disposiciones de la Ley Federal del Trabajo y, en su caso, por los usos y costumbres aplicables, así como las buenas prácticas del mercado.`),

        clauseT("DÉCIMA SÉPTIMA. DESIGNACIÓN DE BENEFICIARIOS."),
        jPR([
          r('"EL TRABAJADOR"', true),
          r(` manifiesta que, en cumplimiento de la fracción X del artículo 25 de la Ley Federal del Trabajo, es su voluntad designar como beneficiario para el pago de salarios y/o prestaciones devengadas y no cobradas en caso de fallecimiento o desaparición derivada de un acto delincuencial a la siguiente persona:`),
        ]),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: thinB, bottom: thinB, left: thinB, right: thinB, insideHorizontal: thinB, insideVertical: thinB },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                tCell("NOMBRE COMPLETO", 40, "D9D9D9", true),
                tCell("PARENTESCO", 15, "D9D9D9", true),
                tCell("FECHA DE NACIMIENTO", 25, "D9D9D9", true),
                tCell("PORCENTAJE", 20, "D9D9D9", true),
              ],
            }),
            new TableRow({
              height: { value: 400, rule: "atLeast" },
              children: [
                tCell(d.beneficiario_nombre.toUpperCase(), 40, "FFFFFF"),
                tCell(d.beneficiario_parentesco.toUpperCase(), 15, "FFFFFF"),
                tCell(benFechaNac, 25, "FFFFFF"),
                tCell(`${d.beneficiario_porcentaje}%`, 20, "FFFFFF"),
              ],
            }),
          ],
        }),

        gap(80),
        jPR([
          r('"LAS PARTES"', true),
          r(` acuerdan que, en caso de que "EL TRABAJADOR" desee modificar los beneficiarios establecidos anteriormente, deberá notificar por escrito a "LA EMPRESA", entendiéndose que, de no hacerlo, continúa siendo voluntad de "EL TRABAJADOR" designar a los beneficiarios anteriormente enlistados.`),
        ]),

        // ── Cierre y Firmas ─────────────────────────────────────────────────
        gap(240),
        jPR([
          r(`LEÍDO Y DEBIDAMENTE COMPRENDIDO QUE FUE EL PRESENTE `),
          r("CONTRATO INDIVIDUAL DEL TRABAJO SUJETO A PERIODO DE PRUEBA", true),
          r(` Y ENTERADAS LAS PARTES DEL CONTENIDO Y ALCANCE LEGAL DEL PRESENTE, LO FIRMAN POR DUPLICADO AL CALCE DE CADA HOJA, QUEDANDO UN INSTRUMENTO ORIGINAL EN PODER DE CADA PARTE, EN LA `),
          r(`CIUDAD DE CANCÚN, A LOS ${fechaFirma}`, true), r("."),
        ]),

        gap(280),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
          rows: [new TableRow({
            children: [
              firmaCell('"EL PATRÓN"', "C. HENRY FERNANDO TAMAY SANCHEZ", "NOMBRE COMPLETO DEL REPRESENTANTE LEGAL", 50),
              firmaCell('"EL TRABAJADOR"', nombreCompleto, "NOMBRE COMPLETO DEL TRABAJADOR", 50),
            ],
          })],
        }),

        gap(160),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
          rows: [new TableRow({
            children: [
              firmaCell('"SOLUCIONES TAMIVAR", S.A. DE C.V.', "NOMBRE DE LA EMPRESA", "FIRMA DEL REPRESENTANTE LEGAL", 50),
              firmaCell("FIRMA DEL TRABAJADOR", "", "HUELLA DEL TRABAJADOR", 50),
            ],
          })],
        }),

      ],
    }],
  });

  descargar(doc, `Contrato_Determinado_${nombreCompleto.replace(/\s+/g, "_")}_${d.fecha_inicio.slice(0, 10)}.docx`);
}
