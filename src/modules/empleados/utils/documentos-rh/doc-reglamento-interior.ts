import {
  Document, Paragraph, TextRun,
  AlignmentType,
  FONT, descargar,
} from "./_shared";

const SZ  = 24;
const SZ_H = 28;
const LN  = 276;

const cB = (text: string, after = 180) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [new TextRun({ text, font: FONT, size: SZ_H, bold: true })],
  });

const jP = (text: string, after = 140) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children: [new TextRun({ text, font: FONT, size: SZ })],
  });

const lP = (text: string, indent = 0, after = 120) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    indent: indent ? { left: indent } : undefined,
    children: [new TextRun({ text, font: FONT, size: SZ })],
  });

const h2 = (text: string) =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: LN, lineRule: "auto", before: 160, after: 80 },
    children: [new TextRun({ text, font: FONT, size: SZ, bold: true })],
  });

const gap = (after = 120) =>
  new Paragraph({ spacing: { before: 0, after }, children: [] });

export function generarReglamentoInterior(): void {
  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ, bold: false } } } },
    sections: [{
      properties: {
        page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
      },
      children: [

        // Título
        cB("REGLAMENTO INTERIOR DE TRABAJO, DE LA EMPRESA SOLUCIONES TAMIVAR S.A. DE C.V., DE CONFORMIDAD CON LA LEY FEDERAL DEL TRABAJO, APLICABLE Y DE OBSERVANCIA PARA TODAS LAS PERSONAS QUE, CON CARÁCTER DE TRABAJADORES, PRESTAN SU TRABAJO PERSONAL SUBORDINADO EN LAS INSTALACIONES DE LA EMPRESA, EN LA CIUDAD DE CANCÚN, ESTADO DE QUINTANA ROO.", 300),

        // ── CAPÍTULO I ──────────────────────────────────────────────────────
        cB("CAPÍTULO I", 60),
        cB("OBJETO", 160),

        jP("Artículo 1.- El presente Reglamento Interior de Trabajo tiene por objeto regular las relaciones de trabajo entre la empresa denominada Soluciones Tamivar S.A. de C.V. y sus trabajadores."),

        gap(),

        // ── CAPÍTULO II ─────────────────────────────────────────────────────
        cB("CAPÍTULO II", 60),
        cB("DISPOSICIONES GENERALES", 160),

        jP("Artículo 1 Bis.- Las disposiciones del presente Reglamento son obligatorias y de observancia general para la empresa SOLUCIONES TAMIVAR S.A. de C.V. a quien en lo sucesivo se le denominará \"LA EMPRESA\", y sus trabajadores."),
        jP("Artículo 2.- La implementación del presente Reglamento estará a cargo del Gerente, Director, Administrador y/o del Consejo de Administración del centro de trabajo de \"EL PATRÓN\"."),
        jP("Artículo 3.- Se considera personal de la Empresa a todos los trabajadores contratados en los términos de los capítulos II y III del presente Reglamento."),
        jP("Artículo 4.- La prestación de los servicios del personal de la Empresa y demás efectos de su relación laboral, se regirán por lo dispuesto en la Ley Federal del Trabajo la que para los efectos del presente Reglamento se denominará como \"la Ley\"."),
        jP("Artículo 5.- Todo lo no previsto expresamente en este Reglamento, se decidirá tomando en consideración la Ley, los principios generales de derecho y el contrato individual de trabajo."),
        jP("Artículo 6.- Contra la inobservancia del presente Reglamento no podrá alegarse inexperiencia, desconocimiento o práctica en contra de las disposiciones en él contenidas."),
        jP("El presente reglamento deberá estar exhibido en lugar visible dentro del domicilio del Centro de Trabajo. Así mismo, deberá ser entregada una copia del reglamento debidamente firmado de forma particular por cada uno de los trabajadores al momento de su contratación, que deberá ser integro al exhibido en las instalaciones."),
        jP("El presente reglamento puede ser modificado en cualquier tiempo, debiendo ser en todo momento exhibido en lugar visible dentro del domicilio del Centro de Trabajo, así mismo, deberá entregarse al trabajador una nueva copia del reglamento interior de trabajo con las disposiciones modificadas, para efecto de que tenga conocimiento de las nuevas disposiciones del reglamento."),
        jP("Artículo 7.- El personal de la Empresa atenderá las disposiciones que sobre el particular emanen de la Comisión Mixta de Seguridad e Higiene y de la Comisión Mixta de Capacitación y Adiestramiento que funcionen en la Empresa, y en general de todas aquellas que se establezcan para el mejor cumplimiento de las actividades que la Ley encarga a la Empresa."),

        gap(),

        // ── CAPÍTULO III ────────────────────────────────────────────────────
        cB("CAPÍTULO III", 60),
        cB("DURACIÓN DE LAS RELACIONES DE TRABAJO", 160),

        jP("Artículo 8.- La contratación del personal de la Empresa podrá ser por obra, tiempo determinado, por temporada o por tiempo indeterminado y, en su caso, podrá estar sujeto a prueba o a capacitación inicial."),
        jP("Artículo 9.- La contratación de personal de la Empresa por obra determinada, procederá cuando así lo exija la naturaleza del servicio que se va a prestar. En el contrato individual de trabajo correspondiente se precisará el servicio de que se trate."),
        jP("Artículo 10.- El señalamiento de un tiempo determinado puede estipularse únicamente en los siguientes casos:"),
        lP("Cuando lo exija la naturaleza del trabajo que se va a prestar.", 360),
        lP("Cuando tenga por objeto sustituir temporalmente a otro trabajador.", 360),
        lP("En los demás casos previstos por la Ley.", 360),
        jP("Las condiciones antes señaladas, se harán constar expresamente en el contrato individual de trabajo respectivo."),

        h2("CONTRATACIÓN"),

        jP("Artículo 11.- Corresponde a la Empresa la contratación del personal, con las limitaciones y modalidades que marque la ley y las demás disposiciones legales vigentes."),
        jP("Artículo 12.- El contrato individual de trabajo se hará constar por escrito por cada uno de los trabajadores en el que debe señalarse lo siguiente:"),
        lP("Nombre, nacionalidad, edad, sexo, estado civil, Clave Única de Registro de Población, Registro Federal de Contribuyentes y domicilio del trabajador y del patrón;", 360),
        lP("Si la relación de trabajo es para obra, tiempo determinado, por temporada o por tiempo indeterminado y, en su caso, podrá estar sujeto a prueba o a capacitación inicial.", 360),
        lP("El servicio o servicios que deban prestarse, los que se determinarán con la mayor precisión posible.", 360),
        lP("El lugar o los lugares donde deberá prestarse el trabajo.", 360),
        lP("La duración de la jornada.", 360),
        lP("La forma y el monto del salario.", 360),
        lP("El día y el lugar de pago del salario.", 360),
        lP("La indicación de que el trabajador será capacitado o adiestrado en los términos de los planes y programas establecidos o que se establezcan en la empresa conforme a lo dispuesta en la Ley Federal del Trabajo.", 360),
        lP("Otras condiciones de trabajo, tales como dias de descanso, vacaciones y demás que convengan el trabajador y el patrón.", 360),
        lP("La designación de beneficiarios a los que refiere el artículo 501 de la Ley Federal del Trabajo.", 360),
        jP("Artículo 13.- El personal deberá proporcionar todos los datos y documentos que le sean solicitados por la Empresa con motivo de su contratación. El propio personal será responsable de la veracidad de los datos que haya proporcionado, y la omisión o falsedad en ellos ameritará la sanción que legalmente proceda."),

        h2("REQUISITOS DE INGRESO"),

        jP("Artículo 14.- Para ingresar a un puesto se requiere tener los conocimientos, habilidades, experiencia y salud necesarios para el desempeño del puesto de que se trate, mediante la presentación y aprobación de los exámenes que la Empresa determine."),
        jP("Artículo 15.- La contratación de personal de la Empresa para ocupar puestos que requieran un perfil profesional determinado, estará sujeta al previo cumplimiento de los siguientes requisitos: cédula expedida por la Secretaría de Educación Pública cuando se trate de actividades para las que necesite estar acreditado, título profesional; en su caso, documentación que acredite la experiencia profesional y en general, cualquier otro documento que se requiera para comprobar la especialidad de que se trate."),

        h2("LUGAR DE PRESTACIÓN DE LOS SERVICIOS"),

        jP("Artículo 16.- El personal de la Empresa se obliga a iniciar puntualmente sus labores en el área de trabajo que se le asigne."),
        jP("Artículo 17.- El personal de la Empresa estará obligado a desempeñar el empleo a su cargo observando en todo momento los principios de legalidad, honradez, lealtad, honestidad, eficiencia y colaboración."),
        jP("Artículo 18.- El personal de la Empresa tiene la obligación de prestar sus servicios en el lugar de trabajo para el cual fue contratado y la Empresa podrá reubicarlo libremente dentro de la República Mexicana, cuando lo requiera por necesidades del servicio o en razón de su especialidad, así como de un puesto a otro o de un departamento a otro sin perjuicio de su salario."),

        gap(),

        // ── CAPÍTULO IV ─────────────────────────────────────────────────────
        cB("CAPÍTULO IV", 60),
        cB("CONDICIONES DE TRABAJO", 160),

        jP("Artículo 19.- Las condiciones de trabajo del personal de la Empresa corresponderán a la naturaleza de los servicios que preste, siempre apegado a lo que la Ley dispone."),

        h2("JORNADA DE TRABAJO"),

        jP("Artículo 20.- La jornada de trabajo del personal de la Empresa se estipula en forma semanal con 48 horas, distribuida en 8 horas diarias. La jornada de trabajo del personal eventual de la Empresa se estipulará de acuerdo con el contrato individual de trabajo respectivo."),
        jP("Todo el personal de la empresa deberá registrar su hora de entrada a través de los medios tecnológicos de los que disponga el patrón para tal efecto, de conformidad a la jornada que respectivamente se estipule en su contrato individual de trabajo."),
        jP("Artículo 21.- La Empresa a través de su Gerente, Director, Administrador o Consejo de Administración queda facultada para reglamentar, establecer y modificar, general y específicamente, los horarios de entrada y salida del personal a su cargo, de acuerdo con las funciones, objetivos y necesidades de sus áreas de trabajo, siempre y cuando el personal cumpla con la jornada estipulada en el contrato individual de trabajo respectivo."),
        jP("Artículo 22.- Los trabajadores que laboren la jornada continua deberán interrumpir sus labores durante media hora para descansar o tomar alimentos fuera de la disposición de la Corporación; este tiempo lo empleará el trabajador a su arbitrio, pudiendo utilizar si lo desea las áreas de recreo de la Corporación. Los treinta minutos de descanso forman parte de la jornada de trabajo, en términos de los artículos 63 y 64 de la Ley."),
        jP("Artículo 23.- Queda prohibido al personal laborar en horario distinto a lo establecido en el artículo 21 del presente documento sin solicitud escrita a su jefe inmediato y autorizada por el Gerente, Director, Administrador o Consejo de Administración, así como reportada a la Gerencia de Recursos Humanos."),
        jP("Artículo 24.- En los casos de siniestro o riesgo inminente en que peligre la vida del trabajador o de sus compañeros, o la existencia misma de la Empresa, la jornada de trabajo se prolongará por el tiempo estrictamente indispensable para evitar esos males, con fundamento en el artículo 65 de la Ley Federal del Trabajo."),

        h2("AUSENCIA DEL TRABAJADOR"),

        jP("Artículo 25.- Los trabajadores que dejen de asistir a sus labores, podrán justificar la falta, con incapacidad expedida por el Instituto Mexicano del Seguro Social (IMSS). Si el trabajador por motivos de salud asiste a una consulta médica al IMSS debe justificar la inasistencia parcial de su jornada con un comprobante de consulta o receta médica que emita el mismo Instituto."),
        jP("Artículo 26.- La Empresa cubrirá la percepción ordinaria del trabajador por los primeros tres (3) días de incapacidad por enfermedad general emitidas por el IMSS, los cuales no son cubiertos por esta institución, y hasta por dos (2) periodos de incapacidades en el año, debiendo el trabajador laborar las horas que corresponden a su jornada ordinaria vía remota para el goce de la presente prestación. A partir del cuarto día serán pagados por el proceso del IMSS de acuerdo con sus normas relativas aplicables y por la Empresa conforme a lo siguiente:"),
        jP("La prestación contenida en el presente artículo solo será aplicable para los trabajadores que por la naturaleza de sus funciones puedan seguir laborando en sus domicilios particulares, tales como personal administrativo que puedan trabajar remotamente desde dispositivos portátiles, no siendo aplicable la presente prestación a los puestos de trabajo que necesariamente requieran su traslado para el desempeño de sus funciones."),
        jP("Artículo 27.- Los certificados médicos del Instituto Mexicano del Seguro Social sólo serán válidos si se presentan en tiempo de acuerdo con el artículo 25, sin roturas, enmendaduras o alteraciones de cualquier clase."),
        jP("Artículo 28.- Los controles de asistencia que se lleven, serán el único soporte para acreditar la asistencia al trabajo, por lo que los trabajadores se obligan a registrar personalmente sus entradas y salidas con las tarjetas, huella dactilar o medios que se les asignen, debiendo firmar los registros correspondientes, con la periodicidad que determine la Gerencia de Recursos Humanos."),
        jP("Las inasistencias que no se reclamen dentro de las cuarenta y ocho (48) horas hábiles siguientes a la fecha de pago, se entenderán consentidas tácitamente para los efectos legales a los que haya lugar."),
        jP("Artículo 29.- Los trabajadores que por cuestiones personales de fuerza mayor necesiten salir de la Empresa en horario de trabajo, deberán presentar un pase de salida debidamente requisitado y autorizado por su jefe inmediato superior, en el entendido de que estos pases sólo constituyen permisos para ausentarse parcialmente de sus labores."),
        jP("Articulo 29 Bis.- En el supuesto de que el trabajador se ausente a su jornada laboral o que estando en ella parcialmente se ausente por motivos de salud y asista a consulta médica particular, deberá presentar receta y/o constancia médica que avale la razón de su ausencia médica. Dicha ausencia y receta médica no será justificable en sí misma ni gozará de las prerrogativas establecidas en el artículo 26 del presente reglamento, estableciéndose desde este momento que dicha justificación será a criterio del patrón, el cual gozará de las facultades para determinar si la ausencia es justificada y si en su caso se pagará o no la jornada ordinaria y/o parcial."),
        jP("Artículo 29 Ter.- Las ausencias que se deriven de asuntos personales deberán notificarse oportunamente al patrón y estarán sujetas a la justificación de este."),
        jP("Tratándose de ausencias por caso fortuito o fuerza mayor el trabajador en la medida de lo posible deberá notificar inmediatamente al patrón o a su jefe inmediato mediante los medios que permitan acuse de recibo, para que tome las medidas pertinentes con relación a la operación del trabajo. Posterior a la notificación del caso fortuito, el trabajador deberá acreditar ante el patrón dentro de los tres días siguientes las causas que generaron el caso fortuito."),
        jP("Artículo 29 Quater.- El trabajador que injustificadamente se ausente a sus labores o parcialmente a ellas, podrá a exclusivo juicio del patrón recuperar sus horas de ausencia, previo acuerdo por escrito de recuperación de horas laborales que debidamente celebre el trabajador y el patrón, lo que en ningún momento se entenderá como modificación definitiva a su jornada laboral, sino que tendrá el carácter de jornada extraordinaria tendiente a recuperar sus horas de ausencia con el primordial fin de no afectarse el pago de su nómina, en los tiempos y formas que debidamente pacten entre las partes."),
        jP("Cualquier cambio definitivo a la jornada laboral de los trabajadores deberá ser debidamente modificado en sus respectivos contratos individuales de trabajo."),

        h2("TIEMPO EXTRA"),

        jP("Artículo 30.- La empresa podrá solicitar al trabajador la prestación de su trabajo por tiempos extraordinarios a los establecidos, los cuales necesariamente deberán hacerse constar por escrito con antelación al inicio de la jornada extraordinaria, en el que el patrón y el trabajador externen expresamente su consentimiento."),
        jP("Artículo 31.- El pago de las horas extra laboradas se calculará tomando en cuenta la percepción ordinaria para el trabajador que corresponda, de acuerdo con el artículo 67 de la Ley Federal del Trabajo."),

        h2("DÍAS DE DESCANSO"),

        jP("Artículo 32.- Son días de descanso obligatorio los señalados en el artículo 74 de la Ley Federal del Trabajo a saber:"),
        lP("El 1° de enero;", 360),
        lP("El primer lunes de febrero en conmemoración del 5 de febrero;", 360),
        lP("El tercer lunes de marzo en conmemoración del 21 de marzo;", 360),
        lP("El 1° de mayo;", 360),
        lP("El 16 de septiembre;", 360),
        lP("El tercer lunes de noviembre en conmemoración del 20 de noviembre;", 360),
        lP("El 1° de octubre de cada seis años, cuando corresponda a la transmisión del Poder Ejecutivo Federal;", 360),
        lP("El 25 de diciembre, y", 360),
        lP("El que determinen las leyes federales y locales electorales, en el caso de elecciones ordinarias para efectuar la jornada electoral.", 360),
        jP("Artículo 33.- El personal que labore cualquiera de los días antes indicados lo podrá compensar con otro día, previo acuerdo por escrito con su jefe inmediato y reportado con anticipación a la Gerencia de Recursos Humanos."),
        jP("Artículo 34.- La Empresa podrá determinar el intercambio de días de descanso obligatorio por el descanso de otros días hábiles, previo acuerdo con los trabajadores."),

        h2("PRIMA DOMINICAL"),

        jP("Artículo 35.- El personal de la Empresa que en su jornada semanal esté obligado a laborar en día domingo, tendrá derecho a que se le cubra una prima adicional, equivalente al veinticinco por ciento (25%) sobre su percepción ordinaria, de acuerdo al artículo 71 de la Ley Federal del Trabajo."),

        h2("VACACIONES"),

        jP("Artículo 36.- El personal de la Empresa que cuente con más de un año de servicios disfrutará de un periodo anual de vacaciones pagadas, que en ningún caso podrá ser inferior a doce días laborables, y que aumentará en dos días laborables, hasta llegar a veinte, por cada año subsecuente de servicios."),
        jP("A partir del sexto año, el periodo de vacaciones aumentará en dos días por cada cinco de servicios."),
        jP("Artículo 37.- Los trabajadores que presten servicios discontinuos y los de temporada tendrán derecho a un período anual de vacaciones, en proporción al número de días de trabajo en el año."),
        jP("Artículo 38.- Del total del periodo que le corresponda conforme a lo previsto en el artículo 76 de la Ley Federal del Trabajo, la persona trabajadora disfrutará de doce días de vacaciones continuos, por lo menos. Dicho periodo, a potestad de la persona trabajadora podrá ser distribuido en la forma y tiempo que así lo requiera, sin perjuicio de que particularmente en cada contrato individual de trabajo el trabajador y el patrón puedan pactar disposiciones diversas a las aquí establecidas en relación con la distribución de su periodo de vacaciones."),
        jP("Artículo 39.- El personal de la Empresa tendrá derecho al pago de una prima vacacional de conformidad a lo dispuesto por el artículo 80 de la Ley Federal del Trabajo."),
        jP("Artículo 40. No se consideran como ausencias, las incapacidades, días de capacitación, días festivos, descansos obligatorios y permisos económicos."),

        gap(),

        // ── CAPÍTULO V ──────────────────────────────────────────────────────
        cB("CAPÍTULO V", 60),
        cB("AGUINALDO", 160),

        jP("Artículo 41.- La Empresa pagará a su personal por concepto de aguinaldo, el importe de cuarenta (15) días de la percepción ordinaria mensual vigente a más tardar el 20 de diciembre de cada año, para los trabajadores que hayan laborado durante todo el año. En el caso de que el trabajador no haya laborado todo el año, se le pagará el aguinaldo proporcionalmente a los días laborados."),

        gap(),

        // ── CAPÍTULO VI ─────────────────────────────────────────────────────
        cB("CAPÍTULO VI.", 60),
        cB("TRABAJO DE MUJERES Y MENORES.", 160),

        jP("Artículo 42.- Los trabajadores independientemente de su género contarán con los mismos derechos y obligaciones atendiendo a la naturaleza de las funciones de cada puesto de trabajo."),
        jP("Artículo 43.- Las trabajadoras embarazadas o en lactancia, sin perjuicio de su salario, prestaciones y derechos, no realizarán labores insalubres y/o peligrosas, trabajo nocturno ni horas extras."),
        jP("Artículo 44.- Las madres trabajadoras observarán lo dispuesto en los artículos 170 al 172 de la Ley."),
        jP("Artículo 45.- Los mayores de 14 años y los menores de 16 años, deberán obtener un certificado médico que acredite su aptitud para el trabajo y se someterá a los exámenes médicos que ordene la inspección del trabajo, autorización de sus tutores para desempeñar el trabajo, así como todos los demás requisitos establecidos por la Ley."),
        jP("Artículo 46.- Se prohíbe el trabajo de menores en los siguientes casos:"),
        lP("46.1.- Labores que puedan afectar su moralidad.", 360),
        lP("46.2.- Labores peligrosas y/o insalubres.", 360),
        lP("46.3.- Labores superiores a su fuerza y las que puedan impedir o retardar su desarrollo normal.", 360),
        lP("46.4.- Domingos y días festivos.", 360),
        lP("47.4.- Trabajo nocturno y/o horas extras.", 360),
        jP("Artículo 47.- La jornada de trabajo de menores de 16 años no excederá de 6 horas diarias y se dividirá en periodos máximos de 3 horas, descansando entre los distintos periodos de la jornada, disfrutará de reposo de una hora por los menos, de conformidad al artículo 177 de la Ley Laboral."),
        jP("Artículo 48.- Los menores de 16 años disfrutaran de un periodo anual de vacaciones de conformidad a lo dispuesto por el artículo 179 de la Ley."),

        gap(),

        // ── CAPÍTULO VII ────────────────────────────────────────────────────
        cB("CAPÍTULO VII.", 60),
        cB("RIESGOS DE TRABAJO Y MEDIDAS PREVENTIVAS.", 160),

        jP("Artículo 49.- El patrón observará las medidas adecuadas para prevenir accidentes y/o enfermedades y cumplirá las indicaciones de la Comisión Mixta de Seguridad e Higiene."),
        jP("Artículo 50.- El patrón adoptará las medidas necesarias para prevenir los riesgos de trabajo en maquinaria y herramientas, así como para evitar que los contaminantes excedan los máximos permisibles, estipulados en los ordenamientos vigentes."),
        jP("Artículo 51.- El patrón instalará un botiquín con los medicamentos y material de curación indispensables en los primeros auxilios y adiestrará al personal necesario para enfrentar emergencias."),
        jP("Artículo 52.- Los candidatos a ingresar a la empresa, se someterán a exámenes médicos previos de ingreso. Los trabajadores restantes se someterán a exámenes médicos periódicos, los cuales se realizarán de acuerdo a las normas vigentes expedidas para el caso."),
        jP("Artículo 53.- Los trabajadores cumplirán con las medidas preventivas e higiénicas que dictaminen las autoridades las normas oficiales mexicanas de la Secretaría del trabajo y Previsión Social, la Secretaría de Salud, la Comisión Mixta y/o los asesores del patrón."),

        gap(),

        // ── CAPÍTULO VIII ───────────────────────────────────────────────────
        cB("CAPÍTULO VIII.", 60),
        cB("LIMPIEZA Y MANTENIMIENTO.", 160),

        jP("Artículo 54.- El patrón dotará a los trabajadores, durante toda la jornada, los materiales, herramientas, uniformes y útiles necesarios para el desarrollo de sus labores en buen estado y calidad."),
        jP("Artículo 55.- Los trabajadores inspeccionaran las herramientas y materiales antes de usarlos, si encontrasen algún defecto en ellos, deberán comunicarlo al patrón y/o a sus representantes inmediatamente previo al inicio de sus labores."),
        jP("Artículo 56.- Todos los trabajadores conservarán aseadas las herramientas, maquinaria, utensilios y mobiliario de uso, procurando evitar roturas, mal uso o desperfectos en los mismos."),
        jP("Artículo 57.- Los trabajadores mantendrán limpios los sanitarios, casilleros e instalaciones semejantes."),
        jP("Artículo 58.- Durante las labores, no se consumirán alimentos en las áreas de trabajo, ni se guardarán alimentos perecederos en mesas, cajones o sitios no autorizados."),
        jP("Artículo 59.- Inmediatamente después de la hora de comida, en el supuesto de que el trabajador utilice trastes, vasos y/o cualquier utensilio, lavará los trastes y se limpiará el sitio usado para tal actividad."),
        jP("Artículo 60.- Son obligaciones del patrón las estipuladas en el ARTÍCULO 132 de la Ley."),
        jP("Artículo 61.- El patrón deberá:"),
        lP("Promover el respeto, buen trato y dignificación de los trabajadores en un marco de justicia y equidad.", 360),
        lP("Retribuir a los trabajadores con un salario remunerador conforme a lo que establece la Ley.", 360),
        lP("Proporcionar a los trabajadores la capacitación adecuada y los elementos necesarios para el buen desempeño de su trabajo, procurando tecnología y materia prima de calidad a fin de alcanzar el mejoramiento sostenido de la productividad de la empresa.", 360),
        lP("Cumplir con sus obligaciones en materia de seguridad social y de vivienda para los trabajadores.", 360),
        lP("Observa las medidas de seguridad e higiene y propiciar el desarrollo de un ambiente que promueva la mejor protección de los trabajadores.", 360),
        lP("Procurar una administración eficiente que permita optimizar el uso de los recursos, organizando a sus trabajadores de forma productiva.", 360),
        lP("Llevar a cabo la planeación de la empresa en el mediano y largo plazo, de forma tal; que aun en caso de reestructuración, se privilegie la preservación de la planta de empleo.", 360),
        jP("Artículo 62.- Queda prohibido al patrón y a sus representantes lo marcado en el artículo 133 de la Ley Laboral."),

        gap(),

        // ── CAPÍTULO IX ─────────────────────────────────────────────────────
        cB("CAPÍTULO IX.", 60),
        cB("MEDIDAS DISCIPLINARIAS.", 160),

        jP("Artículo 63.- El empleado deberá portar su gafete de identificación."),
        jP("Artículo 64.- Para toda medida disciplinaria o sanción que el patrón aplique, debe conservar aquellos elementos que sirvan para comprobar la infracción que se le atribuye al empleador."),
        jP("Artículo 65.- En el caso de que el empleado considere injusta la medida disciplinaria o sanción impuesta, a la que se refiere el artículo anterior, quedan a salvo sus derechos para acudir a el Centro de Conciliación Laboral del Estado de Quintana Roo, a efecto de impugnar las medidas disciplinarias o sanciones impuestas en los términos que marca la Ley Federal del Trabajo."),
        jP("Artículo 66.- Cuando en los términos del artículo 110 de la Ley Federal del Trabajo, el personal contraiga con el patrón deudas por errores, pérdidas, averías, o similares, se le descontará de su salario, el importe de la responsabilidad. La cantidad descontada, no podrá ser mayor al salario de un mes y será la que convenga el patrón y el trabajador, sin que pueda rebasar el 30% del excedente al salario mínimo."),
        jP("Artículo 67.- Las infracciones a la Ley y al presente reglamento que no ameriten la separación del trabajo, serán sancionadas de la siguiente manera:"),
        jP("Por cualquier infracción cometida, en el término de 3 días, se levantará un acta administrativa en el que de forma circunstanciada se detallarán los hechos cometidos, firmada debidamente por el trabajador y dos testigos. En el caso de que el trabajador se niegue a firmar, bastará con la sola firma de los testigos. Dicha acta formará parte del expediente laboral del trabajador y servirá para todos los efectos legales más amplios que en derecho procedan."),
        jP("Artículo 68.- Son causas de rescisión del contrato, sin responsabilidad para el patrón, las identificadas en el artículo 47 de la Ley Federal del Trabajo."),
        jP("Artículo 69.- Son causas de rescisión del contrato, sin responsabilidad para el trabajador la enumeradas en el artículo 51 de la Ley Federal del Trabajo."),

        gap(),

        // ── CAPÍTULO X ──────────────────────────────────────────────────────
        cB("CAPÍTULO X", 60),
        cB("CAPACITACIÓN", 160),

        jP("Artículo 70.- El personal de la Empresa encargado, formulará y establecerá planes y programas para la capacitación de su personal, tomando en cuenta su actividad y especialidad, así como los requerimientos de actualización, orientación y desarrollo con sujeción a los lineamientos y políticas generales que haya dispuesto la Dirección General basados en la normatividad respectiva."),
        jP("Artículo 71.- El personal de la Empresa está obligado a asistir a los cursos, seminarios, talleres o eventos de capacitación que se programen por la Comisión Mixta de Capacitación y Adiestramiento, y a participar como instructor interno o facilitador, cuando se le requiera con motivo de su trabajo, así como también está obligado a someterse a los exámenes y procedimientos de evaluación que le sean requeridos durante el proceso de capacitación."),
        jP("Artículo 72.- La Empresa emitirá las políticas y procedimientos relativos a becas, asistencia a congresos, cursos de posgrado y otras medidas que estimulen la productividad y mejoren las condiciones de trabajo del personal de la Corporación, de conformidad con la normatividad aplicable."),

        gap(),

        // ── CAPÍTULO XI ─────────────────────────────────────────────────────
        cB("CAPÍTULO XI", 60),
        cB("SEGURIDAD E HIGIENE EN EL TRABAJO", 160),

        jP("Artículo 73.- El personal de la Empresa deberá observar y aplicar las medidas preventivas de riesgos de trabajo establecidas de Seguridad e Higiene para la preservación de la integridad física de sus trabajadores, instalaciones y equipos, así como, las disposiciones que en materia de seguridad e higiene expidan las autoridades respectivas."),
        jP("Así mismo la Empresa proporcionará a los trabajadores los lineamientos y disposiciones necesarias para el control de riesgos en general y en específico mediante los procedimientos o políticas correspondientes."),
        jP("Artículo 74.- La Empresa proporcionará al trabajador los equipos e implementos de seguridad que establezcan los procedimientos respectivos y los que Seguridad e Higiene determine."),

        gap(),

        // ── CAPÍTULO XII ────────────────────────────────────────────────────
        cB("CAPÍTULO XII", 60),
        cB("PREVISIÓN SOCIAL", 160),
        h2("RIESGOS DE TRABAJO"),

        jP("Artículo 75.- Los accidentes y enfermedades del personal de la Empresa en ejercicio o con motivo del trabajo, así como la determinación de incapacidades, indemnizaciones y derechos derivados de los propios riesgos de trabajo, se sujetarán a lo previsto en la Ley del Instituto Mexicano del Seguro Social y sus Reglamentos."),

        h2("SERVICIO MÉDICO"),

        jP("Artículo 76.- La atención médica del personal de la Empresa y sus derechohabientes, se prestará en iguales condiciones y términos, con base en la Ley del Instituto Mexicano del Seguro Social y sus Reglamentos."),
        jP("Artículo 77.- La Empresa a su costa y cuando lo considere conveniente, podrá someter al personal que ésta considere, a un chequeo médico, para verificar que no padece alguna incapacidad o enfermedad de trabajo contagiosa o incurable que pueda perjudicar el desarrollo de las actividades de la Corporación."),

        gap(),

        // ── CAPÍTULO XIII ───────────────────────────────────────────────────
        cB("CAPÍTULO XIII", 60),
        cB("PERMISOS", 160),

        jP("Artículo 78.- Los permisos económicos serán solicitados por escrito al superior jerárquico con una antelación mínima de un (1) día, a excepción de los casos de comprobada urgencia, a juicio de la Corporación, quien los concederá de inmediato, siempre y cuando no exista inconveniente por parte del jefe inmediato, según las necesidades de servicio del área."),
        jP("Los permisos deberán ser autorizados por el jefe inmediato, acordando las partes respecto del día de inasistencia, si será repuesto con otro día, descontado o con goce de sueldo."),

        gap(),

        // ── CAPÍTULO XIV ────────────────────────────────────────────────────
        cB("CAPÍTULO XIV", 60),
        cB("ANTIGÜEDAD", 160),

        jP("Artículo 79.- El derecho de antigüedad es generado por cada uno de los trabajadores con contrato por tiempo indeterminado y se computará a partir de la fecha de ingreso a SOLUCIONES TAMIVAR S.A. DE C.V. El personal podrá solicitar en todo momento la determinación de su antigüedad."),

        gap(),

        // ── CAPÍTULO XV ─────────────────────────────────────────────────────
        cB("CAPÍTULO XV", 60),
        cB("TERMINACIÓN DE SERVICIOS", 160),

        jP("Artículo 80.- La Empresa podrá realizar en todo tiempo ajustes a sus plantillas de personal, cuando así lo requiera el cumplimiento de sus actividades."),
        jP("Artículo 81.- En los casos a que se refiere el artículo anterior, el personal de la Empresa que no sea reubicado, será liquidado conforme a la Ley."),

        gap(),

        // ── CAPÍTULO XVI ────────────────────────────────────────────────────
        cB("CAPÍTULO XVI", 60),
        cB("RENUNCIA", 160),

        jP("Artículo 82.- El personal de la Empresa que decida renunciar a su trabajo, deberá notificarlo por escrito a la Gerencia de Recursos Humanos por lo menos con diez (10) días hábiles de anticipación, y para este efecto, al término de la relación laboral se cubrirá al trabajador la las partes proporcionales de aguinaldo y prima vacacional; y la percepción ordinaria de los días trabajados en el mes de la renuncia."),

        gap(),

        // ── CAPÍTULO XVII ───────────────────────────────────────────────────
        cB("CAPÍTULO XVII", 60),
        cB("ACTUALIZACIÓN TECNOLÓGICA Y MEDIOS ELECTRÓNICOS", 160),

        jP("Artículo 83.- La Empresa y los trabajadores, reconocen la validez jurídica de los actos administrativos ejecutados a través de los medios electrónicos que para el efecto implemente la Corporación, en los términos que se establezcan en las políticas, procedimientos o manuales correspondientes."),

        gap(),

        // ── CAPÍTULO XVIII ──────────────────────────────────────────────────
        cB("CAPÍTULO XVIII", 60),
        cB("OBLIGACIONES DE LOS TRABAJADORES", 160),

        jP("Artículo 84.- En forma enunciativa y no limitativa, los trabajadores tendrán las siguientes obligaciones:"),
        lP("I.- Ejecutar el trabajo con la intensidad, cuidado y esmero apropiados en el lugar y tiempo convenidos.", 360),
        lP("II.- Observar buenas costumbres y conducirse con disciplina, educación y respeto durante el desarrollo de su trabajo.", 360),
        lP("III.- Brindar la máxima cooperación a sus compañeros de trabajo con relación a la labor que desempeñen.", 360),
        lP("IV.- Proponer a su jefe las mejoras y áreas de oportunidad que observen para contribuir en la seguridad, productividad y desarrollo de la Corporación.", 360),
        lP("V.- Usar los uniformes y/o equipo de trabajo y de seguridad industrial y personal establecidos por la Empresa tales como: zapatos de seguridad, casco, lentes, cinturones, guantes, tapabocas, entre otros, de acuerdo a los requerimientos de cada área.", 360),
        lP("VI.- Portar la identificación proporcionada por la Empresa en las horas de trabajo y a la hora de entrada y salida de sus labores.", 360),
        lP("VII.- Informar por escrito y con claridad a la Corporación, todo cambio de dirección, estado civil, nacimiento de hijos, así como otros datos que pudieran interesar a la Corporación. En caso de no cumplir con esto, prevalecerán los últimos informes dados, para cualquier efecto legal.", 360),
        lP("VIII.- Evitar el desperdicio de materiales, pérdidas de tiempo en el trabajo y avisar inmediatamente a su jefe inmediato cuando falten materiales o herramientas para realizar el trabajo, así como de las causas que le impidan continuar con el mismo.", 360),
        lP("IX.- Hacer el mejor uso de los bienes muebles o inmuebles de la Empresa para cuidar de su conservación y aprovechamiento.", 360),
        lP("X.- Responder por los perjuicios materiales causados intencional o negligentemente a la Corporación.", 360),
        lP("XI.- Guardar las herramientas, material o productos en los lugares destinados al efecto.", 360),
        lP("XII.- Respetar el servicio de vigilancia implementado por la Corporación, así como los métodos y procedimientos tendientes a la protección de recursos humanos y materiales.", 360),
        lP("XIII.- Mantener libres las vías de comunicación en la Empresa y cooperar para evitar atropellos y carreras en todos los lugares de la misma.", 360),
        lP("XIV.- Observar las medidas preventivas de seguridad e higiene que se acuerden por la Comisión Mixta de Seguridad e Higiene.", 360),
        lP("XV.- Comunicar a la Empresa o a la Comisión Mixta de Seguridad e Higiene las deficiencias y actos inseguros que adviertan a fin de evitar daños a los trabajadores y a las instalaciones.", 360),
        lP("XVI.- Atender todas las indicaciones, pláticas y prácticas de seguridad que imparta la Corporación.", 360),
        lP("XVII.- Prestar auxilio en cualquier tiempo que se necesite cuando por siniestro o riesgo inminente, peligren las personas o las propiedades de la Empresa o de sus compañeros de trabajo.", 360),
        lP("XVIII.- Avisar al encargado de las áreas, antes de efectuar trabajos de mantenimiento, verificando que los equipos estén fuera de servicio y asegurados con candados y tarjeta de seguridad.", 360),
        lP("XIX.- Usar adecuadamente los servicios de baños manteniéndolos en buenas condiciones de orden y limpieza, depositando los desperdicios en los cestos de basura.", 360),
        lP("XX.- Comunicar a la Empresa y a la Comisión Mixta de Seguridad e Higiene el padecimiento de cualquier enfermedad contagiosa, riesgo de trabajo o incapacidad en cuanto tenga conocimiento de ello.", 360),
        lP("XXI.- No ingresar al centro de trabajo con materiales inflamables y/o toxicos no autorizados por el patrón.", 360),
        lP("XXII.- Parar sus máquinas al terminar su trabajo y no desconectar los interruptores cuando se interrumpa la corriente por causas ajenas a la empresa.", 360),
        lP("XXIII.- Permitir la revisión personal y de útiles, bolsas, mochilas, automóviles, etc., a solicitud de la Corporación.", 360),
        lP("XXIV.- Cerrar las llaves del agua después de que se hayan usado.", 360),
        lP("XXV.- Ubicar los automóviles o motocicletas en los lugares destinados para tal efecto. Por ningún motivo, los trabajadores deberán estacionar o circular esos vehículos en áreas de trabajo.", 360),
        lP("XXVI.- Someterse a las investigaciones que practique la Corporación.", 360),
        lP("XXVII.- Entregar la credencial de identificación al departamento de Recursos Humanos, devolver el equipo de trabajo, materiales, herramientas y demás instrumentos proporcionados por la Corporación, al concluir la relación de trabajo.", 360),
        lP("XXVIII.- Someterse a los reconocimientos médicos que establezca la Empresa a fin de comprobar el estado de salud de los trabajadores, en términos de lo dispuesto por la Ley.", 360),
        lP("XXIX.- Las demás que se establezcan en la Ley Federal del Trabajo, en el presente Reglamento, los contratos individuales de trabajo y sus adendas; así como en las demás disposiciones normativas o administrativas aplicables.", 360),

        gap(),

        // ── CAPÍTULO XIX ────────────────────────────────────────────────────
        cB("CAPÍTULO XIX", 60),
        cB("PROHIBICIONES DE LOS TRABAJADORES", 160),

        jP("Artículo 85.- En forma enunciativa y no limitativa queda prohibido a los trabajadores de la Corporación, mientras presten sus servicios:"),
        lP("I.- Hacer propaganda política o religiosa dentro de las instalaciones de la Corporación.", 360),
        lP("II.- Introducir y/o portar cualquier clase de arma dentro de las instalaciones de la Corporación.", 360),
        lP("III.- Suspender o abandonar sus labores antes de la hora señalada para ese efecto o abandonar sus puestos sin la autorización correspondiente, a menos que exista permiso por escrito u ocurra una causa de fuerza mayor como incendio, terremoto, inundación, etc.", 360),
        lP("IV.- Introducir a las instalaciones de la Corporación, personas ajenas a ésta, (amigos, familiares, menores, etc.), a lugares de alto riesgo que puedan poner en peligro su integridad física.", 360),
        lP("V.- Introducir cámaras fotográficas, cámaras de vídeo, videos, y cualquier otro material, sin la autorización escrita de la Corporación.", 360),
        lP("VI.- Checar tarjeta o medio de control de asistencia de otro trabajador.", 360),
        lP("VII.- Conducir a una velocidad mayor de diez (10) km/h dentro del perímetro de la Corporación.", 360),
        lP("VIII.- Entrar a cualquier área distinta a su lugar de trabajo si no hay personal responsable de la misma, y a los almacenes de la Empresa sin la autorización respectiva de la Gerencia.", 360),
        lP("IX.- Provocar directa o indirectamente el desorden y la indisciplina en el curso de las labores.", 360),
        lP("X.- Dañar, destruir por dolo o negligencia y/o robar los implementos de trabajo, equipos, materiales, publicaciones, manuales, implementos de seguridad y protección y cualquier otro bien propiedad de la Corporación, compañeros, proveedores, clientes, contratistas o visitantes.", 360),
        lP("XI.- Disponer o utilizar manuales, procedimientos, materiales, herramientas, equipos, publicaciones, útiles, patentes, marcas o cualquier bien propiedad de la Corporación, compañeros, proveedores, clientes, contratistas o visitantes en beneficio personal o de terceros.", 360),
        lP("XII.- Alterar, modificar, falsificar, dañar, destruir, disponer o cambiar cualquier documento, información, aviso, mecanismos de comprobación, medidas, sistemas, procedimientos, y disposiciones de trabajo sin autorización.", 360),
        lP("XIII.- Sacar de la Empresa materias primas, dibujos, herramientas, mercancías, útiles, modelos, materiales, muebles, vehículos, documentos, o cualquier otro bien u objeto, que sea propiedad de la misma o de terceros, sin tener la debida autorización, misma que deberá constar por escrito por el personal autorizado para ello.", 360),
        lP("XIV.- Hacer colectas o rifas dentro de los terrenos o instalaciones de la Empresa sin contar con la autorización expresa para tal efecto.", 360),
        lP("XV.- Interferir y distraer a sus compañeros durante sus labores, salvo que por necesidades del trabajo se requiera.", 360),
        lP("XVI.- Tratar asuntos ajenos al trabajo en horas laborales.", 360),
        lP("XVII.- Introducir a la Empresa o poseer dentro de la misma bebida alcohólicas, drogas, enervantes, tóxicos, objetos punzo cortantes, o cualquier otro objeto o sustancia que pueda poner en riesgo la seguridad de las personas o de los bienes.", 360),
        lP("XVIII.- Fumar en las áreas restringidas para ello.", 360),
        lP("XIX.- Maniobrar equipos sin ser el trabajador asignado a el.", 360),
        lP("XX.- Presentarse a trabajar en estado de embriaguez o bajo la influencia de narcóticos o drogas enervantes, salvo que exista prescripción médica debidamente comprobada en cuyo caso deberá notificarlo a la Empresa antes de iniciar su labor.", 360),
        lP("XXI.- Hacer mal uso o utilizar para fin distinto al que ha sido destinado, los equipos de trabajo, materiales o materias primas, documentos, información o demás bienes.", 360),
        lP("XXII.- Usar maquinaria, equipo y herramienta en mal estado, mismos que tendrán que ser reportados inmediatamente a su jefe inmediato para la reposición o corrección de los mismos.", 360),
        lP("XXIII.- Mover o quitar protectores, que señalen avisos de peligro u otros objetos destinados a proteger a los trabajadores o a los bienes de la Corporación.", 360),
        lP("XXIV.- Desordenar o contribuir a la falta de limpieza o condiciones no sanitarias dentro de las propiedades de la Corporación.", 360),
        lP("XXV.- Distribuir o colocar cualquier asunto escrito u objeto no autorizado por la Corporación.", 360),

        gap(),

        // ── CAPÍTULO XX ─────────────────────────────────────────────────────
        cB("CAPÍTULO XX", 60),
        cB("DERECHOS RESERVADOS QUE NO SEAN DE DOMINIO PÚBLICO", 160),

        jP("Artículo 86.- El Trabajador reconoce que son Propiedad exclusiva de la Empresa todos los documentos e información que se le proporcione con motivo de la relación de trabajo, así como los que el propio Trabajador prepare o formule en relación o conexión con sus servicios, por lo que se obliga a conservarlos en buen estado y entregarlos a la Empresa en el momento en que ésta lo requiera, o bien al terminar el contrato por el motivo que fuere adquirido u obtenido durante la prestación de sus servicios para la Corporación, por lo que no podrá contribuir con dicha información confidencial en labores iguales o similares relacionadas con cualquier actividad que tenga conexión con las labores que hubiese desempeñado para la Corporación."),
        jP("Si el Trabajador dejara de cumplir con las disposiciones de esta cláusula, quedará sujeto a la responsabilidad laboral, así como a la civil por daños y perjuicios que causaré a la Empresa a las sanciones penales a las que se hará acreedor."),
        jP("Artículo 87.- El Trabajador acepta y está de acuerdo en que la propiedad y explotación de las invenciones de la Empresa corresponderá en todo tiempo a la Corporación; así como el derecho de explotación de la patente, propiedad industrial y/o derecho de autor correspondiente, ya que dicha actividad está incluida en la percepción ordinaria que las partes han pactado como remuneración por los servicios que deriven de este contrato."),
        lP("I.- El Trabajador conviene y se obliga a ceder o traspasar a la Corporación, la propiedad, interés y derecho exclusivo sobre dichas invenciones, descubrimientos y mejoras y cualquier patente, propiedad industrial y/o derecho de autor que se expida en relación con los mismos y se obliga a firmar, al ser solicitado para ello, toda la documentación que fuera necesaria para realizar dichas cesiones o traspasos.", 360),
        lP("II.- El Trabajador está de acuerdo así mismo, en que estos pactos serán obligatorios para sus representantes y albaceas con posterioridad a la terminación de su empleo con la Corporación, por cualquier causa o motivo y por el tiempo que sea necesario para llevar a cabo los términos y finalidades del mismo.", 360),
        jP("El Trabajador conviene en que durante la vigencia de su relación contractual de trabajo con la Empresa no revelará a otra persona física o moral, independientemente de la estructura que tenga la misma, ni usará directa o indirectamente cualquier información confidencial de la Empresa o de terceros, a menos que tal comunicación o uso sea función directa de las labores que le haya encomendado la Empresa, requiriendo para ello autorización previa y por escrito."),
        jP("Lo anterior incluye cualquier información confidencial que haya sido adquirida, obtenida o desarrollada por el empleado, solo o conjuntamente con otras personas, durante el desempeño de sus servicios para la Empresa."),
        lP("III.- El Trabajador no obstante la terminación de la relación contractual de trabajo con la Corporación, queda obligado a no divulgar, ni a servirse personalmente de los secretos de la Empresa o de terceros que la misma tuviese derecho para usar y no proporcionará a terceros, directa o indirectamente información verbal o por escrito sobre los mismos, incluyendo, los métodos, sistemas y actividades de cualquier clase que la Empresa o terceros relacionados con la misma observen. También devolverá los proyectos, estudios, folletos, publicaciones, manuales, dibujos, diseños, planos, memorandos, diarios, correspondencia y cualquier otro documento o información técnica basados en procedimientos y en formas propias de los mismos, los cuales tienen carácter estrictamente confidencial y por lo tanto deben ser considerados secretos. Igualmente se obliga a no servirse para su beneficio personal o de terceros del contenido de los documentos antes mencionados, ni de las patentes, marcas, mejoras, inventos, nombres comerciales o perfeccionamientos, propiedad de la Empresa o de terceros que la misma tuviere derecho a usar.", 360),

        gap(),

        // ── CAPÍTULO XXI ────────────────────────────────────────────────────
        cB("CAPÍTULO XXI", 60),
        cB("PROHIBICIONES DE LA EMPRESA", 160),

        jP("Artículo 88.- Queda prohibido a los representantes de la Corporación, entre otros actos, los siguientes:"),
        lP("I.- Exigir o aceptar dinero de los trabajadores como gratificación por cualquier motivo.", 360),
        lP("II.- Obligar a los trabajadores, mediante coacción o por cualquier otra vía, a terminar la relación laboral con la Empresa.", 360),
        lP("III.- Hacer colectas o suscripciones dentro de la Corporación.", 360),
        lP("IV.- Ejecutar cualquier acto que restrinja a los trabajadores los derechos que a su favor otorga la Ley o el Contrato Individual de Trabajo.", 360),
        lP("V.- Hacer propaganda política o religiosa dentro del local que ocupa la Corporación.", 360),

        gap(),

        // ── CAPÍTULO XXII ───────────────────────────────────────────────────
        cB("CAPÍTULO XXII", 60),
        cB("OBLIGACIONES DE LA EMPRESA", 160),

        jP("Artículo 89.- Son obligaciones de la Corporación:"),
        lP("I.- Promover la seguridad permanente a todos los niveles.", 360),
        lP("II.- Proporcionar al trabajador el equipo de protección personal en la cantidad y calidad necesaria para efectuar el trabajo con seguridad.", 360),
        lP("III.- Colocar señalamientos adecuados para identificar riesgos existentes en las instalaciones.", 360),
        lP("IV.- Dar facilidades y apoyo necesarios a los integrantes de la Comisión Mixta de Seguridad e Higiene para que realicen sus actividades.", 360),
        lP("V.- Realizar las correcciones necesarias para eliminar las condiciones y actos inseguros de las instalaciones.", 360),
        lP("VI.- Establecer los Reglamentos y procedimientos de operación de cada una de las áreas y puestos.", 360),
        lP("VII.- Vigilar se cumpla con los requerimientos legales que establecen el Reglamento Interno de Trabajo y la Ley.", 360),
        lP("VIII.- Permitir en los días de descanso que el personal de la Empresa use las instalaciones deportivas disponibles, en caso de que alguna se encuentre habilitada, bajo su responsabilidad.", 360),
        lP("IX.- Proporcionar al personal que realice actividades o labores de dirección, supervisión, enlace, ejecución de proyectos, o de mando, con la justificación correspondiente y previa autorización de la Dirección de Administración, los equipos de telecomunicaciones necesarios para el desarrollo adecuado de sus funciones, considerando los mismos como herramienta de trabajo.", 360),

        gap(),

        // ── CAPÍTULO XXIII ──────────────────────────────────────────────────
        cB("CAPÍTULO XXIII", 60),
        cB("SANCIONES", 160),

        jP("Artículo 90.- Los actos que ameriten la aplicación de sanciones laborales por incumplimiento a este reglamento y a la Ley que a juicio de la Empresa deban ser esclarecidos, se someterán a una investigación administrativa conforme al siguiente procedimiento:"),
        lP("I. Se notificará al trabajador por escrito las faltas imputadas para que exponga a la Gerencia de Recursos Humanos lo que a su derecho convenga.", 360),
        lP("II. Las diligencias respectivas se harán constar en actas administrativas mediante dos testigos.", 360),
        lP("III. Si el trabajador no comparece al lugar y en la fecha y hora fijadas para iniciar la investigación, se hará constar este hecho por escrito ante dos testigos y la Gerencia de Recursos Humanos dictará la resolución que estime procedente.", 360),
        jP("Artículo 91.- La jornada de labores de los trabajadores será la que respectivamente se estipule en cada uno de sus contratos individuales de trabajo."),
        jP("El trabajador contará con diez minutos de tolerancia para ingresar a trabajar despues de la la hora fijada para el inicio de sus labores."),
        jP("Todo registro de entrada posterior a los diez minutos de tolerancia se considerará como un retardo, los cuales no deberán de exceder de los treinta minutos, apercibidos los trabajadores que para el caso de que su retardo exceda de treinta minutos no se le permitirá el acceso al centro de trabajo y se contemplará lo anterior como una falta injustificada."),
        jP("Artículo 92.- Los retardos serán sancionados de la siguiente manera:"),
        jP("Del primer al segundo retardo: se sancionará mediante amonestación verbal y escrita mediante acta administrativa instandosele al trabajador acerca de la puntualidad en el inicio de sus labores."),
        jP("El tercer retardo efectuado en un periodo de quince días que no supere los treinta minutos al que se refiere en parrafos anteriores: se sancionará con el descuento vía nómina equivalente a los minutos de retardo que se computen del primer, segundo y tercer retardo, en el que se deberá hacer constar mediante acta administrativa el origen del descuento, instandosele al trabajador acerca de la puntualidad en el inicio de sus labores, misma en la que el trabajador se comprometerá a iniciar con puntualidad y diligencia para el sano desarrollo de las actividades de la empresa."),
        jP("Artículo 93.- La reincidencia en los retardos por parte del trabajador independientemente de que se trate del primero, segundo o tercero, serán considerados por periodos de seis meses para efectos de rescindir la relación laboral entre el trabajador y el patrón, de conformidad a lo establecido en el artículo 47 fracción XV de la Ley Federal del Trabajo, toda vez que dichos retardos generan consecuencias graves en lo que al trabajo se refiere, en virtud de no iniciar puntualmente con las operaciones que la empresa mantiene frente a terceros, perjudicando la normal operación de la empresa."),
        jP("Artículo 93 bis.- La reincidencia en el tercer retardo por parte del trabajador será considerada por periodos de tres meses para determinar suspensiones de trabajo sin derecho a goce de sueldo por los días equivalentes al número de terceros retardos que se le levanten en el periodo establecido de tres meses."),

      ],
    }],
  });

  descargar(doc, "Reglamento_Interior_de_Trabajo_Tamivar.docx");
}
