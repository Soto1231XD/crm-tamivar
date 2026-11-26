import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType,
  FONT, MESES_UP, enteroALetras, montoALetras,
  descargar,
} from "./_shared";
import { BorderStyle } from "docx";

export interface ContratoServiciosData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  puesto: string;
  rfc: string;
  genero: string;
  titulo_profesional: string;   
  cedula_profesional: string;
  clave_elector: string;
  honorarios: number;          
  periodicidad_pago: string;    
  fecha_contrato: string;       
  actividades: string;          
  informe_items: string;        
  responsabilidad_items: string;
  auditoria_items: string;      
  expediente_items: string;     
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

const gap = (after = 200) =>
  new Paragraph({ spacing: { before: 0, after }, children: [] });

const indenP = (text: string) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after: 120 },
    indent: { left: 360 },
    children: [r(text.trim())],
  });

function splitLines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

function fmtHonorarios(n: number): string {
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


export async function generarContratoServicios(d: ContratoServiciosData) {
  const fem          = d.genero.toLowerCase() === "femenino";
  const nombreCompleto = `${d.nombre} ${d.apellido_paterno} ${d.apellido_materno}`.trim().toUpperCase();
  const prestadorFull = `${fem ? "LA" : "EL"} ${d.puesto.toUpperCase()}`;
  const honorFmt     = fmtHonorarios(d.honorarios);
  const honorLetr    = montoALetras(d.honorarios);
  const perAdv       = d.periodicidad_pago === "Quincenal" ? "quincenal" : "mensual";
  const fechaFirma   = fechaContratoLegal(d.fecha_contrato);
  const penaFmt      = "MXN $50,000.00 (CINCUENTA MIL PESOS 00/100 MONEDA NACIONAL)";

  const actividadesPs     = splitLines(d.actividades).map(indenP);
  const informePs         = splitLines(d.informe_items).map(indenP);
  const responsabilidadPs = splitLines(d.responsabilidad_items).map(indenP);
  const auditoriaPs       = splitLines(d.auditoria_items).map(indenP);
  const expedientePs      = splitLines(d.expediente_items).map(indenP);

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 } } },
      children: [

        // ── Título ──────────────────────────────────────────────────────────
        cP("CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES", true, 0),
        cP(`QUE CELEBRAN POR UNA PARTE LA SOCIEDAD MERCANTIL DENOMINADA "SOLUCIONES TAMIVAR",`, true, 0),
        cP(`SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE, REPRESENTADA EN ESTE ACTO POR SU ADMINISTRADOR ÚNICO`, true, 0),
        cP(`EL SEÑOR HENRY FERNANDO TAMAY SANCHEZ, A QUIEN EN LO SUCESIVO Y PARA LOS EFECTOS LEGALES`, true, 0),
        cP(`DEL PRESENTE CONTRATO SE LE DENOMINARÁ COMO "EL CLIENTE", Y, POR OTRA PARTE,`, true, 0),
        jPR([
          r(fem ? "LA " : "EL ", true),
          r(`${fem ? "LIC." : "LIC."} ${nombreCompleto}`, true),
          r(`, A QUIEN EN LO SUCESIVO Y PARA LOS EFECTOS LEGALES DEL PRESENTE CONTRATO SE LE DENOMINARÁ COMO `, true),
          r(`"${prestadorFull}"`, true),
          r(`, Y CONJUNTAMENTE AMBOS CELEBRANTES A QUIENES EN LO SUCESIVO Y PARA LOS EFECTOS LEGALES DEL PRESENTE CONTRATO SE LES DENOMINARÁ COMO `, true),
          r('"LAS PARTES"', true),
          r(", DE CONFORMIDAD CON LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:", true),
        ], 240),

        // ── DECLARACIONES ───────────────────────────────────────────────────
        clauseH("DECLARACIONES"),

        clauseT(`PRIMERA. "EL CLIENTE", POR CONDUCTO DE SU REPRESENTANTE LEGAL, BAJO PROTESTA DE DECIR VERDAD, DECLARA:`),
        jP(`Que es una Sociedad Mercantil constituida de conformidad con la Legislación Mexicana, lo que acredita mediante la Escritura Pública número 10,047 (diez mil cuarenta y siete), Volumen Cuadragésimo Cuarto, Tomo "D", de fecha veinticuatro de julio del dos mil veinticuatro, otorgada ante la Fe del Licenciado Abraham Gómez Juárez, Notario Público Suplente de la Notaria Pública número Seis del Estado de Quintana Roo, misma que corre agregada al presente contrato en copia simple como ANEXO 1.`),
        jP(`Que su representante legal cuenta con las facultades legales más amplias para obligarla en términos del presente contrato, mismas que no le han sido revocadas, modificadas o limitadas de forma alguna, lo que acredita mediante la Escritura Pública que corre agregada como ANEXO 1.`),
        jP(`Que dentro de su objeto social se encuentra contemplada la contratación de todo tipo de servicios profesionales de consultoría y demás profesiones afines.`),
        jPR([
          r(`Que, para el debido cumplimiento de su objeto social, organización y funcionamiento empresarial, requiere la contratación de los servicios profesionales de `),
          r(`"${prestadorFull}"`, true), r("."),
        ]),

        clauseT(`SEGUNDA. "${prestadorFull.replace(/^LA |^EL /, "")}", POR SU PROPIO Y PERSONAL DERECHO, BAJO PROTESTA DE DECIR VERDAD, DECLARA:`),
        jP(`Ser una persona física, de nacionalidad mexicana, mayor de edad y con capacidad legal para celebrar el presente contrato.`),
        jPR([
          r(`Identificarse con su Credencial para Votar debidamente expedida por el Instituto Nacional Electoral (INE), con Clave de Elector alfanumérica `),
          r(d.clave_elector.toUpperCase(), true),
          r(`, misma que corre agregada al presente contrato en copia simple como ANEXO 2.`),
        ]),
        jPR([
          r(`Ser `), r(d.titulo_profesional, true),
          r(`, lo que acredita con su Cédula Profesional Número `),
          r(d.cedula_profesional, true),
          r(`, debidamente expedida por la Secretaría de Educación Pública (SEP), misma que corre agregada al presente contrato en copia simple como ANEXO 3.`),
        ]),
        jPR([
          r(`Que se encuentra debidamente inscrit${fem ? "a" : "o"} ante el Servicio de Administración Tributaria (SAT), bajo el Registro Federal de Contribuyentes (RFC) alfanumérico `),
          r(d.rfc, true),
          r(`, lo que acredita mediante su Constancia de Situación Fiscal, misma que corre agregada al presente contrato en copia simple como ANEXO 4.`),
        ]),
        jPR([
          r(`Dedicarse preponderantemente a prestar sus servicios profesionales como `),
          r(d.titulo_profesional, true),
          r(`, por lo que cuenta con los conocimientos técnicos y profesionales para prestar sus servicios en favor de "EL CLIENTE".`),
        ]),

        clauseT(`TERCERA. "LAS PARTES", REPRESENTADAS POR COMO HA QUEDADO ESTABLECIDO, BAJO PROTESTA DE DECIR VERDAD, DECLARAN:`),
        jP(`Que se reconocen en este acto la personalidad con la que comparecen a la celebración del presente contrato y, que a la celebración de este no ha mediado error, dolo, mala fe, violencia o cualquier otro vicio de la voluntad que pudiera afectar el consentimiento expresamente manifestado.`),
        jP(`Que habiéndose reconocido la personalidad con la que comparecen, convienen en sujetarse al cumplimiento de las siguientes:`),

        // ── CLÁUSULAS ────────────────────────────────────────────────────────
        clauseH("CLÁUSULAS"),

        clauseT("PRIMERA. TÍTULOS DE LAS CLÁUSULAS."),
        jPR([
          r('"LAS PARTES"', true),
          r(`, acuerdan que el título, definición o denominación que aparece seguido de cada cláusula, será únicamente para efectos de referencia y con el objeto de facilitar su lectura y manejo, debiendo sujetarse limitativa y expresamente a lo contenido en cada una de ellas, y en caso de controversia futura, deberá resolverse lo más apegado a la conexión lógica-jurídica en relación con el objeto del presente contrato, así mismo, las cláusulas deberán interpretarse las unas por las otras, atribuyendo a las dudosas el sentido que resulte del conjunto de todas.`),
        ]),

        clauseT("SEGUNDA. OBJETO DEL CONTRATO."),
        jPR([
          r('"LAS PARTES"', true),
          r(`, con fundamento en los artículos 2864, 2865, 2866, 2868, 2871 y demás relativos y aplicables al Código Civil para el Estado de Quintana Roo, el objeto del presente `),
          r("CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES", true),
          r(` lo constituye la obligación por parte de `),
          r(`"${prestadorFull}"`, true),
          r(` de prestar sus servicios a "EL CLIENTE" respecto de las siguientes actividades:`),
        ]),
        ...actividadesPs,
        jPR([
          r(`Todas las anteriores actividades, deberán ser ejecutadas atendiendo a las disposiciones legales aplicables debiendo `),
          r(`"${prestadorFull}"`, true),
          r(` actuar bajo la presente prestación de servicios de forma diligente y de buena fe, velando en todo momento por el cumplimiento de las obligaciones contractuales de "EL CLIENTE".`),
        ]),

        clauseT("TERCERA. VIGENCIA."),
        jPR([
          r('"LAS PARTES"', true),
          r(` convienen en que el contrato tendrá una vigencia indefinida, mismo que comenzará a correr a partir de la firma de este, pudiendo ser rescindido por cualquiera de las partes en cualquier tiempo, sin pena convencional, siempre y cuando se dé aviso por escrito con antelación de quince días naturales a la fecha en la que se desea que los derechos y obligaciones derivados del presente contrato dejaren de surtir sus efectos. La contravención a no dar aviso con antelación de quince días naturales para rescindir el contrato por cualquiera de las partes, generará en la parte que incumpla a dicha disposición al pago de una pena convencional por la cantidad de `),
          r(penaFmt, true),
          r(`, en favor de la otra parte.`),
        ]),

        clauseT("CUARTA. HONORARIOS."),
        jPR([
          r('"LAS PARTES"', true),
          r(` convienen en que los honorarios por la ejecución del presente contrato serán por la cantidad de `),
          r(`${honorFmt} (${honorLetr}) MENSUALES`, true),
          r(`, pagaderos de forma ${perAdv}, que en este acto "EL CLIENTE" se obliga a pagar en favor de `),
          r(`"${prestadorFull}"`, true),
          r(`, teniendo a su vez esta última la obligación de expedir la factura correspondiente que deberá pagar "EL CLIENTE" a más tardar dentro de los tres días naturales siguientes a su expedición.`),
        ]),

        clauseT(`QUINTA. OBLIGACIONES DE "${prestadorFull.replace(/^LA |^EL /, "")}".`),
        jPR([
          r('"LAS PARTES"', true),
          r(` convienen desde este momento que `),
          r(`"${prestadorFull}"`, true),
          r(` tendrá las siguientes obligaciones en favor de "EL CLIENTE" durante la ejecución del presente contrato:`),
        ]),
        ...actividadesPs,
        jPR([
          r(`Analizar permanentemente las operaciones del cliente y proponer estrategias, estructuras, alternativas y esquemas que permitan optimizar el cumplimiento de sus obligaciones de manera lícita, mediante el aprovechamiento de las herramientas, deducciones, beneficios y demás mecanismos expresamente previstos en la legislación vigente.`),
        ]),
        jPR([
          r(`Todas las anteriores obligaciones serán ejecutadas en el momento que sea requerido o en el momento que le sean requeridas por "EL CLIENTE". Asimismo, `),
          r(`"${prestadorFull}"`, true),
          r(` deberá emitir recomendaciones oportunas para mejorar la eficiencia del servicio, procurando el adecuado cumplimiento de las obligaciones sin incurrir en prácticas que pudieran constituir simulación, evasión u otras conductas prohibidas por la legislación aplicable.`),
        ]),

        clauseT("SEXTA. INFORME EJECUTIVO."),
        jPR([
          r(`"${prestadorFull}"`, true),
          r(` deberá presentar trimestralmente a "EL CLIENTE" un informe ejecutivo que contenga:`),
        ]),
        ...informePs,
        jP(`La falta de entrega en la presentación de dicho informe será considerada incumplimiento contractual.`),

        clauseT("SÉPTIMA. CONFIDENCIALIDAD."),
        jP(`El objeto de la presente cláusula es que "LAS PARTES" guarden estricta y rigurosa confidencialidad sobre la información propiedad de estas, que se compartan entre sí ya sea de manera oral, escrita, por medios electrónicos, ópticos, electromagnéticos o por cualquier otro medio.`),
        jP(`Se entenderá por Parte Receptora aquella que reciba "Información Confidencial" de la Parte Propietaria que será aquella dueña de la "Información Confidencial" entregada. La Parte Receptora podrá utilizar la "Información Confidencial" única y exclusivamente para el propósito para el cual fue expresamente proporcionada y no podrá divulgarla ni utilizarla en forma alguna total o parcialmente, por sí o por interpósita persona, sin el consentimiento previo y por escrito de la Parte Propietaria de la información.`),
        jP(`Se entenderá por "INFORMACIÓN CONFIDENCIAL" toda aquella información escrita, o gráfica en cualquier tipo de medio, así como la contenida en medios electrónicos o electromagnéticos, que se encuentre identificada claramente por "LAS PARTES" como confidencial. Dentro de este tipo de información se incluye, de manera enunciativa más no limitativa, información técnica, financiera, fiscal, crediticia y comercial relativa a nombres de clientes o socios potenciales, propuestas de negocios, estrategias de negocios, estructura organizacional, reportes, planes, proyecciones, datos y cualquier otra información industrial, económica o comercial, junto con fórmulas, mecanismos, patrones, métodos, técnicas, procesos de análisis y cualquier otro documento preparado para la ejecución del presente contrato.`),
        jP(`Si a alguna de LAS PARTES se le solicitare o requiriere por disposición de ley a través de mandato escrito de conformidad con la legislación aplicable, como resultado de un procedimiento judicial o administrativo, para revelar total o parcialmente la "Información Confidencial", la Parte que haya sido requerida conviene en informar inmediatamente a la Parte propietaria de dicha información, con la finalidad de que esta última, si lo estima conveniente, esté en posibilidad de ejercer las medidas o recursos legales necesarios para su adecuada defensa.`),
        jP(`LAS PARTES reconocen que la "Información Confidencial" constituye un secreto industrial en términos del artículo 163 de la Ley Federal de Protección a la Propiedad Industrial, y por lo tanto, quedarán sujetas a lo establecido por los artículos 166, 167, 169 y demás relativos de dicho ordenamiento legal. Toda la información compartida tendrá una vigencia de estricta confidencialidad durante la ejecución del presente contrato y hasta por un plazo de cinco años después de finalizada su vigencia.`),

        clauseT("OCTAVA. RESPONSABILIDAD PROFESIONAL."),
        jPR([
          r(`"${prestadorFull}"`, true),
          r(` será responsable de las siguientes acciones:`),
        ]),
        ...responsabilidadPs,
        jPR([
          r(`En el supuesto de que `),
          r(`"${prestadorFull}"`, true),
          r(` incurra en alguna de las acciones anteriormente enlistadas, deberá indemnizar a "EL CLIENTE" hasta por el importe de las erogaciones que este último tuviera que realizar por el error o impericia de `),
          r(`"${prestadorFull}"`, true), r("."),
        ]),

        clauseT("NOVENA. NO RELACIÓN LABORAL."),
        jPR([
          r('"LAS PARTES"', true),
          r(` acuerdan que el presente contrato de prestación de servicios no constituye derecho laboral alguno sobre estos, reconociéndose la no subordinación laboral y, quedando expresamente pactado que el presente contrato y relación que hoy pactan es estrictamente de carácter profesional. Por lo tanto, cada una de las partes será responsable de enterar fiscalmente a la autoridad administrativa correspondiente de todo lo establecido por la Legislación Fiscal.`),
        ]),

        clauseT("DÉCIMA. NO CESIÓN DE DERECHOS."),
        jP(`Queda expresamente pactado que LAS PARTES deberán dar directa, única y exclusivamente cumplimiento a sus obligaciones y derechos derivadas del presente contrato, por lo que no podrán ceder, traspasar y/o enajenar sus derechos a terceras personas sin la autorización expresa y/o por escrito que ambas partes se otorguen.`),

        clauseT("DÉCIMA PRIMERA. LIBERACIÓN DE RESPONSABILIDAD."),
        jPR([
          r(`"${prestadorFull}"`, true),
          r(` en este acto se obliga a desempeñar sus funciones dentro del marco legal, debiendo dar cabal cumplimiento de acuerdo a los principios de buena fe, las buenas costumbres, y en general a actuar dentro de las disposiciones legales aplicables a su prestación de servicios, liberando expresamente en este acto a "EL CLIENTE" de todo lo que por su mala práctica incurra, haciéndose cargo inmediatamente de todos los gastos y costas judiciales que "EL CLIENTE" tuviera que erogar por motivo de su negligencia, error o impericia.`),
        ]),

        clauseT("DÉCIMA SEGUNDA. PENA CONVENCIONAL."),
        jPR([
          r('"LAS PARTES"', true),
          r(`, convienen en establecer como pena convencional ante el incumplimiento de cualquier obligación contractual señalada en las cláusulas del presente contrato, a cargo de cada una de las partes, la cantidad de `),
          r(penaFmt, true),
          r(` que deberá pagar una parte a la otra que haya incurrido en el incumplimiento, sin perjuicio de las demás acciones civiles o penales que pudieran iniciar de conformidad con las cláusulas séptima, octava y décima primera.`),
        ]),

        clauseT("DÉCIMA TERCERA. AUDITORÍA Y SUPERVISIÓN."),
        jPR([
          r(`"EL CLIENTE"`, true),
          r(` podrá en cualquier momento requerir a `),
          r(`"${prestadorFull}"`, true), r(":"),
        ]),
        ...auditoriaPs,
        jPR([
          r(`"${prestadorFull}"`, true),
          r(` deberá entregar dicha información en un plazo máximo de cuarenta y ocho (48) horas a partir de que esta sea solicitada.`),
        ]),

        clauseT("DÉCIMA CUARTA. CAUSALES DE RESCISIÓN."),
        jPR([
          r('"LAS PARTES"', true),
          r(` podrán dar por terminado el presente contrato en los siguientes supuestos:`),
        ]),
        indenP("Por incumplimiento imputable a alguna de las partes; o"),
        indenP("Por la manifestación unilateral de voluntad de conformidad con la cláusula tercera, atendiendo a lo que en ella se dispone."),
        jPR([
          r('"LAS PARTES"', true),
          r(` convienen en este acto que una vez que sea rescindida la relación contractual, `),
          r(`"${prestadorFull}"`, true),
          r(` será responsable durante el plazo máximo de cinco (5) años posteriores a la terminación, por todo cuanto de hecho y por derecho corresponda a las obligaciones que tuvo con "EL CLIENTE" en el tiempo que prestó sus servicios, debiendo reparar los daños causados a "EL CLIENTE" por el error o impericia en la prestación de sus servicios.`),
        ]),

        clauseT("DÉCIMA QUINTA. ENTREGA DE EXPEDIENTE Y RENDICIÓN DE CUENTAS."),
        jPR([
          r('"LAS PARTES"', true),
          r(` convienen en que, al concluir la relación contractual, `),
          r(`"${prestadorFull}"`, true),
          r(` deberá entregar inmediatamente y sin demora a "EL CLIENTE" la siguiente información:`),
        ]),
        ...expedientePs,

        clauseT("DÉCIMA SEXTA. JURISDICCIÓN Y COMPETENCIA."),
        jPR([
          r('"LAS PARTES"', true),
          r(`, convienen que ante cualquier controversia presente y/o futura en cumplimiento de las obligaciones contenidas en el presente instrumento, acuerdan en someterse a la Legislación Civil sustantiva y procesal aplicable de los Juzgados y Tribunales Competentes de la Ciudad de Cancún, Estado de Quintana Roo, renunciando desde este momento a cualquier otro fuero que por motivo de sus domicilios presentes o futuros pudiera corresponderles.`),
        ]),

        // ── Cierre y Firmas ─────────────────────────────────────────────────
        gap(240),
        jPR([
          r(`LEÍDO QUE FUE EL PRESENTE CONTRATO Y ENTERADAS LAS PARTES DEL CONTENIDO Y ALCANCE LEGAL AL QUE SE SOMETEN EN VIRTUD DEL PRESENTE INSTRUMENTO, LO FIRMAN POR DUPLICADO PARA DEBIDA CONSTANCIA A ENTERA CONFORMIDAD AL CALCE DE CADA HOJA, QUEDANDO UN INSTRUMENTO EN ORIGINAL EN PODER DE CADA UNA DE LAS PARTES, EN LA CIUDAD DE CANCÚN, MUNICIPIO DE BENITO JUÁREZ, ESTADO DE QUINTANA ROO, A LOS `),
          r(fechaFirma, true), r("."),
        ]),

        gap(280),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFFFFF" },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  cP('"EL CLIENTE"', true, 0),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 480, after: 60 },
                    border: { top: thinB },
                    children: [],
                  }),
                  cP("HENRY FERNANDO TAMAY SANCHEZ.", true, 0),
                  cP("ADMINISTRADOR ÚNICO", false, 0),
                  cP('"SOLUCIONES TAMIVAR", S.A. DE C.V.', false, 0),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFFFFF" },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  cP(`"${prestadorFull}"`, true, 0),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 480, after: 60 },
                    border: { top: thinB },
                    children: [],
                  }),
                  cP(nombreCompleto, true, 0),
                  cP("POR SU PROPIO Y PERSONAL DERECHO.", false, 0),
                ],
              }),
            ],
          })],
        }),

      ],
    }],
  });

  descargar(doc, `Contrato_Servicios_${nombreCompleto.replace(/\s+/g, "_")}_${d.fecha_contrato.slice(0, 10)}.docx`);
}
