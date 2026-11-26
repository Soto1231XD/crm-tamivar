import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { Empleado } from "../services/empleados.api";
import type { ContratoIndeterminadoData } from "../utils/documentos-rh/doc-contrato";
import type { ContratoDeterminadoData } from "../utils/documentos-rh/doc-contrato-determinado";
import type { ContratoServiciosData } from "../utils/documentos-rh/doc-contrato-servicios";
import type { ContratoConfidencialidadData } from "../utils/documentos-rh/doc-contrato-confidencialidad";
import {
  generarContratoIndeterminado,
  generarContratoDeterminado,
  generarContratoServicios,
  generarContratoConfidencialidad,
  generarReglamentoInterior,
  generarCodigoVestir,
  generarAutorizacionUsoImagen,
  generarIndiceExpediente,
  generarCaratulaExpediente,
} from "../utils/documentos-rh";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  empleado: Empleado;
  onClose: () => void;
}

type TipoContrato = "indeterminado" | "determinado" | "servicios" | "confidencialidad";

const REQUIRED_LABOR: { key: keyof Empleado; label: string }[] = [
  { key: "curp",   label: "CURP" },
  { key: "rfc",    label: "RFC" },
  { key: "nss",    label: "N.S.S. (Número de Seguridad Social)" },
  { key: "genero", label: "Género" },
];

const REQUIRED_SERVICIOS: { key: keyof Empleado; label: string }[] = [
  { key: "rfc",    label: "RFC" },
  { key: "genero", label: "Género" },
];

const ESTADOS_CIVILES = ["Soltero", "Casado", "Divorciado", "Viudo", "Unión libre"];

function getMissing(tipo: TipoContrato, empleado: Empleado) {
  const fields = tipo === "servicios" ? REQUIRED_SERVICIOS : REQUIRED_LABOR;
  return fields.filter((f) => {
    const v = empleado[f.key];
    return !v || (typeof v === "string" && !v.trim());
  });
}

export function ContratoModal({ empleado, onClose }: Props) {
  const [tipo, setTipo]                       = useState<TipoContrato>("indeterminado");

  // Labor (indeterminado / determinado)
  const [estadoCivil, setEstadoCivil]         = useState("");
  const [claveElector, setClaveElector]       = useState("");
  const [descPuesto, setDescPuesto]           = useState("");
  const [benNombre, setBenNombre]             = useState("");
  const [benParentesco, setBenParentesco]     = useState("");
  const [benFechaNac, setBenFechaNac]         = useState("");
  const [benPorcentaje, setBenPorcentaje]     = useState("100");
  // Determinado extra
  const [fechaInicio, setFechaInicio]         = useState("");
  const [fechaFin, setFechaFin]               = useState("");
  const [diasPrueba, setDiasPrueba]           = useState("30");

  // Servicios
  const [svTitulo, setSvTitulo]               = useState("");
  const [svCedula, setSvCedula]               = useState("");
  const [svClaveElector, setSvClaveElector]   = useState("");
  const [svHonorarios, setSvHonorarios]       = useState("");
  const [svPeriodicidad, setSvPeriodicidad]   = useState("Quincenal");
  const [svFecha, setSvFecha]                 = useState("");
  const [svActividades, setSvActividades]     = useState("");
  const [svInforme, setSvInforme]             = useState("");
  const [svResponsabilidad, setSvResponsabilidad] = useState("");
  const [svAuditoria, setSvAuditoria]         = useState("");
  const [svExpediente, setSvExpediente]       = useState("");

  // Confidencialidad
  const [cfFecha, setCfFecha]                 = useState("");
  const [cfAnios, setCfAnios]                 = useState("5");

  const [kitReglamento, setKitReglamento]        = useState(true);
  const [kitCodigoVestir, setKitCodigoVestir]    = useState(true);
  const [kitUsoImagen,    setKitUsoImagen]        = useState(true);
  const [kitIndiceExp,    setKitIndiceExp]        = useState(true);
  const [kitCaratula,     setKitCaratula]         = useState(true);

  const [generating, setGenerating]           = useState(false);
  const [generated, setGenerated]             = useState(false);

  const missing = getMissing(tipo, empleado);

  // Validación por tipo
  const laborBaseValid =
    missing.length === 0 &&
    estadoCivil && claveElector.trim() && descPuesto.trim() &&
    benNombre.trim() && benParentesco.trim() && benFechaNac;

  const canGenerate =
    tipo === "indeterminado"
      ? !!laborBaseValid
      : tipo === "determinado"
        ? !!laborBaseValid && !!fechaInicio && !!fechaFin && parseInt(diasPrueba) > 0
        : tipo === "confidencialidad"
          ? !!cfFecha && parseInt(cfAnios) > 0
          : // servicios
            missing.length === 0 &&
            svTitulo.trim().length > 0 && svCedula.trim().length > 0 &&
            svClaveElector.trim().length > 0 && parseFloat(svHonorarios) > 0 &&
            !!svFecha && svActividades.trim().length > 0 &&
            svInforme.trim().length > 0 && svResponsabilidad.trim().length > 0 &&
            svAuditoria.trim().length > 0 && svExpediente.trim().length > 0;

  const handleGenerar = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      if (tipo === "indeterminado") {
        const payload: ContratoIndeterminadoData = {
          nombre:               empleado.nombre,
          apellido_paterno:     empleado.apellido_paterno,
          apellido_materno:     empleado.apellido_materno ?? "",
          puesto:               empleado.puesto,
          curp:                 empleado.curp!,
          rfc:                  empleado.rfc!,
          nss:                  empleado.nss!,
          genero:               empleado.genero!,
          sueldo:               parseFloat(empleado.sueldo),
          periodicidad_sueldo:  empleado.periodicidad_sueldo,
          fecha_ingreso:        empleado.fecha_ingreso,
          estado_civil:         estadoCivil,
          clave_elector:        claveElector,
          descripcion_puesto:   descPuesto,
          beneficiario_nombre:      benNombre,
          beneficiario_parentesco:  benParentesco,
          beneficiario_fecha_nac:   benFechaNac,
          beneficiario_porcentaje:  parseFloat(benPorcentaje) || 100,
        };
        await generarContratoIndeterminado(payload);
      } else if (tipo === "determinado") {
        const payload: ContratoDeterminadoData = {
          nombre:               empleado.nombre,
          apellido_paterno:     empleado.apellido_paterno,
          apellido_materno:     empleado.apellido_materno ?? "",
          puesto:               empleado.puesto,
          curp:                 empleado.curp!,
          rfc:                  empleado.rfc!,
          nss:                  empleado.nss!,
          genero:               empleado.genero!,
          sueldo:               parseFloat(empleado.sueldo),
          periodicidad_sueldo:  empleado.periodicidad_sueldo,
          fecha_inicio:         fechaInicio,
          fecha_fin:            fechaFin,
          dias_prueba:          parseInt(diasPrueba) || 30,
          estado_civil:         estadoCivil,
          clave_elector:        claveElector,
          descripcion_puesto:   descPuesto,
          beneficiario_nombre:      benNombre,
          beneficiario_parentesco:  benParentesco,
          beneficiario_fecha_nac:   benFechaNac,
          beneficiario_porcentaje:  parseFloat(benPorcentaje) || 100,
        };
        await generarContratoDeterminado(payload);
      } else if (tipo === "confidencialidad") {
        const payload: ContratoConfidencialidadData = {
          nombre:            empleado.nombre,
          apellido_paterno:  empleado.apellido_paterno,
          apellido_materno:  empleado.apellido_materno ?? "",
          genero:            empleado.genero,
          curp:              empleado.curp,
          fecha_contrato:    cfFecha,
          anios_vigencia:    parseInt(cfAnios) || 5,
        };
        await generarContratoConfidencialidad(payload);
      } else {
        const payload: ContratoServiciosData = {
          nombre:               empleado.nombre,
          apellido_paterno:     empleado.apellido_paterno,
          apellido_materno:     empleado.apellido_materno ?? "",
          puesto:               empleado.puesto,
          rfc:                  empleado.rfc!,
          genero:               empleado.genero!,
          titulo_profesional:   svTitulo,
          cedula_profesional:   svCedula,
          clave_elector:        svClaveElector,
          honorarios:           parseFloat(svHonorarios),
          periodicidad_pago:    svPeriodicidad,
          fecha_contrato:       svFecha,
          actividades:          svActividades,
          informe_items:        svInforme,
          responsabilidad_items: svResponsabilidad,
          auditoria_items:      svAuditoria,
          expediente_items:     svExpediente,
        };
        await generarContratoServicios(payload);
      }
      if (kitReglamento) generarReglamentoInterior();
      if (kitCodigoVestir) await generarCodigoVestir(`${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim());
      if (kitUsoImagen) generarAutorizacionUsoImagen(empleado);
      if (kitIndiceExp) generarIndiceExpediente(empleado);
      if (kitCaratula) await generarCaratulaExpediente(empleado);
      setGenerated(true);
    } finally {
      setGenerating(false);
    }
  };

  // ── Selector de tipo (siempre visible) ────────────────────────────────────
  const TipoSelector = (
    <div className="mb-1">
      <label className={LABEL}>Tipo de contrato</label>
      <div className="grid grid-cols-2 gap-2">
        {(["indeterminado", "determinado", "servicios", "confidencialidad"] as TipoContrato[]).map((t) => {
          const labels: Record<TipoContrato, string> = {
            indeterminado:    "Tiempo Indeterminado",
            determinado:      "Tiempo Determinado",
            servicios:        "Prestación de Servicios",
            confidencialidad: "Confidencialidad",
          };
          const active = tipo === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
                active
                  ? "border-[#312C85] bg-[#312C85] text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title="Generar contrato de trabajo"
      maxWidthClassName={tipo === "servicios" ? "max-w-2xl" : "max-w-xl"}
    >
      {/* ── Faltan datos ──────────────────────────────────────────────────── */}
      {missing.length > 0 ? (
        <div className="flex flex-col gap-4">
          {TipoSelector}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Para poder generar el contrato, le faltan los siguientes datos:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-0.5">
              {missing.map((f) => (
                <li key={f.key} className="text-sm text-amber-700">
                  {f.label}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-amber-600">
              Puedes agregarlos editando el perfil del empleado y luego generar el contrato desde su detalle.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
            >
              Entendido
            </button>
          </div>
        </div>

      ) : generated ? (
        /* ── Generado exitosamente ───────────────────────────────────────── */
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✓
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {(kitReglamento || kitCodigoVestir) ? "Documentos generados" : "Contrato generado"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Los archivos .docx se descargaron automáticamente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
          >
            Cerrar
          </button>
        </div>

      ) : (
        /* ── Formulario ──────────────────────────────────────────────────── */
        <div className="flex flex-col gap-5">
          <p className="text-sm text-slate-500">
            Completa los datos adicionales para generar el contrato de{" "}
            <span className="font-semibold text-slate-700">
              {empleado.nombre} {empleado.apellido_paterno}
            </span>
            .
          </p>

          {TipoSelector}

          {/* ── CAMPOS LABORALES (indeterminado / determinado) ─────────────── */}
          {tipo !== "servicios" && tipo !== "confidencialidad" && (
            <>
              {/* Determinado: fechas y días */}
              {tipo === "determinado" && (
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <label className={LABEL}>Fecha de inicio</label>
                    <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Fecha de fin</label>
                    <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className={INPUT} />
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL}>Días de periodo de prueba</label>
                    <input type="number" min={1} value={diasPrueba} onChange={(e) => setDiasPrueba(e.target.value)} className={INPUT} />
                  </div>
                </div>
              )}

              {/* Estado civil */}
              <div>
                <label className={LABEL}>Estado civil</label>
                <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className={INPUT}>
                  <option value="">Selecciona...</option>
                  {ESTADOS_CIVILES.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Clave de elector */}
              <div>
                <label className={LABEL}>Clave de elector (INE)</label>
                <input
                  type="text"
                  value={claveElector}
                  onChange={(e) => setClaveElector(e.target.value.toUpperCase())}
                  placeholder="AAAA000000AAAAAA00"
                  className={INPUT}
                />
              </div>

              {/* Descripción del puesto */}
              <div>
                <label className={LABEL}>Descripción del puesto</label>
                <p className="mb-1.5 text-xs text-slate-400">
                  Escribe cada actividad en una línea separada. Aparecerán en la Cláusula Primera del contrato.
                </p>
                <textarea
                  value={descPuesto}
                  onChange={(e) => setDescPuesto(e.target.value)}
                  rows={5}
                  placeholder={"Atención y seguimiento a clientes.\nElaboración de reportes.\nCoordinación con el equipo."}
                  className={INPUT + " resize-y"}
                />
              </div>

              {/* Beneficiario */}
              <div>
                <p className={LABEL + " mb-3"}>Datos del beneficiario</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={LABEL}>Nombre completo</label>
                    <input type="text" value={benNombre} onChange={(e) => setBenNombre(e.target.value)} placeholder="Nombre del beneficiario" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Parentesco</label>
                    <input type="text" value={benParentesco} onChange={(e) => setBenParentesco(e.target.value)} placeholder="Ej: Madre, Cónyuge" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Porcentaje (%)</label>
                    <input type="number" min={1} max={100} value={benPorcentaje} onChange={(e) => setBenPorcentaje(e.target.value)} className={INPUT} />
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL}>Fecha de nacimiento</label>
                    <input type="date" value={benFechaNac} onChange={(e) => setBenFechaNac(e.target.value)} className={INPUT} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── CAMPOS CONFIDENCIALIDAD ──────────────────────────────────── */}
          {tipo === "confidencialidad" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Fecha de firma</label>
                <input
                  type="date"
                  value={cfFecha}
                  onChange={(e) => setCfFecha(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Años de vigencia post-relación</label>
                <input
                  type="number"
                  min={1}
                  value={cfAnios}
                  onChange={(e) => setCfAnios(e.target.value)}
                  className={INPUT}
                />
              </div>
              <p className="col-span-2 text-xs text-slate-400">
                La identificación del empleado se tomará automáticamente de su CURP si está registrado.
              </p>
            </div>
          )}

          {/* ── CAMPOS SERVICIOS ──────────────────────────────────────────── */}
          {tipo === "servicios" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* Título profesional */}
                <div className="col-span-2">
                  <label className={LABEL}>Título profesional</label>
                  <input
                    type="text"
                    value={svTitulo}
                    onChange={(e) => setSvTitulo(e.target.value)}
                    placeholder="Ej: Licenciada en Contaduría, Ing. en Sistemas"
                    className={INPUT}
                  />
                </div>
                {/* Cédula profesional */}
                <div>
                  <label className={LABEL}>Cédula profesional</label>
                  <input
                    type="text"
                    value={svCedula}
                    onChange={(e) => setSvCedula(e.target.value)}
                    placeholder="Número de cédula"
                    className={INPUT}
                  />
                </div>
                {/* Clave de elector */}
                <div>
                  <label className={LABEL}>Clave de elector (INE)</label>
                  <input
                    type="text"
                    value={svClaveElector}
                    onChange={(e) => setSvClaveElector(e.target.value.toUpperCase())}
                    placeholder="AAAA000000AAAAAA00"
                    className={INPUT}
                  />
                </div>
                {/* Honorarios */}
                <div>
                  <label className={LABEL}>Honorarios mensuales (MXN)</label>
                  <input
                    type="number"
                    min={1}
                    value={svHonorarios}
                    onChange={(e) => setSvHonorarios(e.target.value)}
                    placeholder="5800"
                    className={INPUT}
                  />
                </div>
                {/* Periodicidad de pago */}
                <div>
                  <label className={LABEL}>Periodicidad de pago</label>
                  <select value={svPeriodicidad} onChange={(e) => setSvPeriodicidad(e.target.value)} className={INPUT}>
                    <option value="Quincenal">Quincenal</option>
                    <option value="Mensual">Mensual</option>
                  </select>
                </div>
                {/* Fecha de firma */}
                <div className="col-span-2">
                  <label className={LABEL}>Fecha de firma del contrato</label>
                  <input type="date" value={svFecha} onChange={(e) => setSvFecha(e.target.value)} className={INPUT} />
                </div>
              </div>

              {/* Actividades */}
              <div>
                <label className={LABEL}>Actividades / Objeto del servicio</label>
                <p className="mb-1.5 text-xs text-slate-400">
                  Una actividad por línea. Aparecerán en las Cláusulas Segunda y Quinta.
                </p>
                <textarea
                  value={svActividades}
                  onChange={(e) => setSvActividades(e.target.value)}
                  rows={5}
                  placeholder={"Cálculo y presentación de impuestos (ISR, IVA).\nDeclaraciones mensuales y anuales.\nRegistro de ingresos y egresos."}
                  className={INPUT + " resize-y"}
                />
              </div>

              {/* Informe ejecutivo */}
              <div>
                <label className={LABEL}>Contenido del informe trimestral</label>
                <p className="mb-1.5 text-xs text-slate-400">
                  Una línea por punto. Cláusula Sexta.
                </p>
                <textarea
                  value={svInforme}
                  onChange={(e) => setSvInforme(e.target.value)}
                  rows={4}
                  placeholder={"Diagnóstico de la situación contable y financiera.\nRiesgos detectados.\nOportunidades de ahorro."}
                  className={INPUT + " resize-y"}
                />
              </div>

              {/* Responsabilidad profesional */}
              <div>
                <label className={LABEL}>Responsabilidades profesionales</label>
                <p className="mb-1.5 text-xs text-slate-400">
                  Situaciones por las que responde el prestador. Cláusula Octava.
                </p>
                <textarea
                  value={svResponsabilidad}
                  onChange={(e) => setSvResponsabilidad(e.target.value)}
                  rows={4}
                  placeholder={"Por errores de cálculo.\nPor omisiones atribuibles a su gestión.\nPor presentaciones extemporáneas."}
                  className={INPUT + " resize-y"}
                />
              </div>

              {/* Auditoría y supervisión */}
              <div>
                <label className={LABEL}>Auditoría y supervisión — lo que el cliente puede solicitar</label>
                <p className="mb-1.5 text-xs text-slate-400">
                  Una línea por punto. Cláusula Décima Tercera.
                </p>
                <textarea
                  value={svAuditoria}
                  onChange={(e) => setSvAuditoria(e.target.value)}
                  rows={4}
                  placeholder={"Revisión de expedientes.\nSolicitar evidencias.\nAuditar procesos.\nCualquier información relativa al objeto del contrato."}
                  className={INPUT + " resize-y"}
                />
              </div>

              {/* Entrega de expediente */}
              <div>
                <label className={LABEL}>Documentos a entregar al concluir</label>
                <p className="mb-1.5 text-xs text-slate-400">
                  Una línea por documento. Cláusula Décima Quinta.
                </p>
                <textarea
                  value={svExpediente}
                  onChange={(e) => setSvExpediente(e.target.value)}
                  rows={4}
                  placeholder={"Libros de contabilidad.\nContabilidad electrónica.\nDeclaraciones presentadas.\nExpedientes de personal."}
                  className={INPUT + " resize-y"}
                />
              </div>
            </>
          )}

          {/* ── Kit de documentos ────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Kit de documentos
            </p>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={kitReglamento}
                onChange={e => setKitReglamento(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#312C85]"
              />
              <span className="text-sm text-slate-700">
                Reglamento Interior de Trabajo
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 mt-2">
              <input
                type="checkbox"
                checked={kitCodigoVestir}
                onChange={e => setKitCodigoVestir(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#312C85]"
              />
              <span className="text-sm text-slate-700">
                Código de Vestir
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 mt-2">
              <input
                type="checkbox"
                checked={kitUsoImagen}
                onChange={e => setKitUsoImagen(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#312C85]"
              />
              <span className="text-sm text-slate-700">
                Autorización de uso de imagen
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 mt-2">
              <input
                type="checkbox"
                checked={kitIndiceExp}
                onChange={e => setKitIndiceExp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#312C85]"
              />
              <span className="text-sm text-slate-700">
                Índice del Expediente del Trabajador
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 mt-2">
              <input
                type="checkbox"
                checked={kitCaratula}
                onChange={e => setKitCaratula(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#312C85]"
              />
              <span className="text-sm text-slate-700">
                Carátula del Expediente del Trabajador
              </span>
            </label>
          </div>

          {/* ── Acciones ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Omitir
            </button>
            <button
              type="button"
              onClick={handleGenerar}
              disabled={!canGenerate || generating}
              className="rounded-xl bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating
                ? "Generando..."
                : (() => {
                    const extra = (kitReglamento ? 1 : 0) + (kitCodigoVestir ? 1 : 0) + (kitUsoImagen ? 1 : 0) + (kitIndiceExp ? 1 : 0) + (kitCaratula ? 1 : 0);
                    return extra > 0 ? `Generar ${1 + extra} documentos` : "Generar contrato";
                  })()}
            </button>
          </div>
        </div>
      )}
    </AppModal>
  );
}
