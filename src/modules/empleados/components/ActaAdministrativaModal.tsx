import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type {
  ActaAdministrativa,
  CreateActaPayload,
  UpdateActaPayload,
} from "../services/actas-administrativas.api";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";
const TEXTAREA = `${INPUT} resize-none`;

const TIPOS = [
  { value: "voluntaria",    label: "Acta Administrativa de Hechos (Voluntaria)" },
  { value: "hechos",        label: "Acta de Hechos" },
  { value: "disciplinaria", label: "Acta Disciplinaria" },
  { value: "pip",           label: "Plan de Mejora (PIP)" },
];

const ORDINALES = [
  "PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO",
  "SEXTO", "SÉPTIMO", "OCTAVO", "NOVENO", "DÉCIMO",
];

interface Props {
  empleadoId: number;
  initial?: ActaAdministrativa | null;
  onSave: (data: CreateActaPayload | UpdateActaPayload) => Promise<void>;
  onClose: () => void;
}

export function ActaAdministrativaModal({ empleadoId, initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);
  const today  = new Date().toISOString().slice(0, 10);

  const [tipo,               setTipo]               = useState("voluntaria");
  const [fechaActa,          setFechaActa]          = useState(today);
  const [horaInicio,         setHoraInicio]         = useState("10:00");
  const [horaCierre,         setHoraCierre]         = useState("11:00");
  // voluntaria
  const [fechaHechos,        setFechaHechos]        = useState(today);
  const [empleadoClaveIne,   setEmpleadoClaveIne]   = useState("");
  const [testigoNombre,      setTestigoNombre]      = useState("");
  const [testigoClaveIne,    setTestigoClaveIne]    = useState("");
  const [hechos,             setHechos]             = useState("");
  const [declaracionTestigo, setDeclaracionTestigo] = useState("");
  // hechos
  const [puntos,             setPuntos]             = useState<string[]>([""]);
  // disciplinaria
  const [testigo1,           setTestigo1]           = useState("");
  const [testigo2,           setTestigo2]           = useState("");
  const [manifestaciones,    setManifestaciones]    = useState("");
  // pip
  const [pipObjetivo,        setPipObjetivo]        = useState("");
  const [pipDuracion,        setPipDuracion]        = useState("");
  const [pipFechaFin,        setPipFechaFin]        = useState(today);
  const [pipAreas,           setPipAreas]           = useState<string[]>([""]);
  const [pipMetas,           setPipMetas]           = useState<{ meta: string; indicador: string }[]>([{ meta: "", indicador: "" }]);
  const [pipSeguimiento,     setPipSeguimiento]     = useState("");
  // plan de mejora como complemento de otra acta
  const [conPlanMejora,      setConPlanMejora]      = useState(false);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    if (!initial) return;
    setTipo(initial.tipo ?? "voluntaria");
    setFechaActa(initial.fecha_acta.slice(0, 10));
    setHoraInicio(initial.hora_inicio);
    setHoraCierre(initial.hora_cierre);
    if (initial.fecha_hechos) setFechaHechos(initial.fecha_hechos.slice(0, 10));
    setEmpleadoClaveIne(initial.empleado_clave_ine ?? "");
    setTestigoNombre(initial.testigo_nombre ?? "" ?? "");
    setTestigoClaveIne(initial.testigo_clave_ine ?? "");
    if (initial.tipo === "hechos") {
      try {
        const arr = JSON.parse(initial.hechos ?? "[]") as string[];
        setPuntos(arr.length > 0 ? arr : [""]);
      } catch { setPuntos([""]); }
    } else if (initial.tipo === "disciplinaria") {
      setHechos(initial.hechos ?? "");
      setManifestaciones(initial.declaracion_testigo ?? "");
      try {
        const arr = JSON.parse(initial.testigo_nombre ?? "[]") as string[];
        setTestigo1(arr[0] ?? "");
        setTestigo2(arr[1] ?? "");
      } catch { /* vacío */ }
    } else if (initial.tipo === "pip") {
      try {
        const pip = JSON.parse(initial.hechos ?? "{}") as Record<string, unknown>;
        setPipObjetivo(pip.objetivo as string ?? "");
        setPipDuracion(pip.duracion as string ?? "");
        setPipFechaFin((pip.fechaFin as string | undefined)?.slice(0, 10) ?? today);
        setPipAreas((pip.areas as string[] | undefined) ?? [""]);
        setPipMetas((pip.metas as { meta: string; indicador: string }[] | undefined) ?? [{ meta: "", indicador: "" }]);
        setPipSeguimiento(pip.seguimiento as string ?? "");
      } catch { /* vacío */ }
    } else {
      setHechos(initial.hechos ?? "");
      setDeclaracionTestigo(initial.declaracion_testigo ?? "");
    }
    // plan de mejora como complemento
    if (initial.plan_mejora && initial.plan_mejora_data) {
      setConPlanMejora(true);
      try {
        const pip = JSON.parse(initial.plan_mejora_data) as Record<string, unknown>;
        setPipObjetivo(pip.objetivo as string ?? "");
        setPipDuracion(pip.duracion as string ?? "");
        setPipFechaFin((pip.fechaFin as string | undefined)?.slice(0, 10) ?? today);
        setPipAreas((pip.areas as string[] | undefined) ?? [""]);
        setPipMetas((pip.metas as { meta: string; indicador: string }[] | undefined) ?? [{ meta: "", indicador: "" }]);
        setPipSeguimiento(pip.seguimiento as string ?? "");
      } catch { /* vacío */ }
    }
  }, [initial]);

  const addPunto    = () => setPuntos((p) => [...p, ""]);
  const removePunto = (i: number) => setPuntos((p) => p.filter((_, idx) => idx !== i));
  const setPunto    = (i: number, v: string) =>
    setPuntos((p) => p.map((x, idx) => (idx === i ? v : x)));

  const addArea    = () => setPipAreas((a) => [...a, ""]);
  const removeArea = (i: number) => setPipAreas((a) => a.filter((_, idx) => idx !== i));
  const setArea    = (i: number, v: string) =>
    setPipAreas((a) => a.map((x, idx) => (idx === i ? v : x)));

  const addMeta    = () => setPipMetas((m) => [...m, { meta: "", indicador: "" }]);
  const removeMeta = (i: number) => setPipMetas((m) => m.filter((_, idx) => idx !== i));
  const setMeta    = (i: number, field: "meta" | "indicador", v: string) =>
    setPipMetas((m) => m.map((x, idx) => (idx === i ? { ...x, [field]: v } : x)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (tipo === "voluntaria" && !testigoNombre.trim()) {
      setError("El nombre del testigo es requerido."); return;
    }
    if (tipo === "hechos" && puntos.every((p) => !p.trim())) {
      setError("Agrega al menos un punto de hechos."); return;
    }
    if (tipo === "disciplinaria" && !testigo1.trim()) {
      setError("El nombre del Testigo 1 es requerido."); return;
    }
    if (tipo === "pip" && !pipObjetivo.trim()) {
      setError("El objetivo del plan es requerido."); return;
    }
    setSaving(true);
    try {
      let extra: Partial<CreateActaPayload> = {};
      if (tipo === "voluntaria") {
        extra = {
          fecha_hechos:        fechaHechos,
          empleado_clave_ine:  empleadoClaveIne.trim() || undefined,
          testigo_nombre:      testigoNombre.trim(),
          testigo_clave_ine:   testigoClaveIne.trim() || undefined,
          hechos:              hechos.trim() || undefined,
          declaracion_testigo: declaracionTestigo.trim() || undefined,
        };
      } else if (tipo === "hechos") {
        extra = { hechos: JSON.stringify(puntos.filter((p) => p.trim())) };
      } else if (tipo === "disciplinaria") {
        extra = {
          testigo_nombre:      JSON.stringify([testigo1.trim(), testigo2.trim()]),
          hechos:              hechos.trim() || undefined,
          declaracion_testigo: manifestaciones.trim() || undefined,
        };
      } else if (tipo === "pip") {
        extra = {
          hora_inicio: "N/A",
          hora_cierre: "N/A",
          hechos: JSON.stringify({
            objetivo:    pipObjetivo.trim(),
            duracion:    pipDuracion.trim(),
            fechaFin:    pipFechaFin,
            areas:       pipAreas.filter((a) => a.trim()),
            metas:       pipMetas.filter((m) => m.meta.trim()),
            seguimiento: pipSeguimiento.trim(),
          }),
        };
      }
      // plan de mejora como complemento (solo para tipos que no son pip)
      const pipExtra: Partial<CreateActaPayload> = {};
      if (tipo !== "pip" && conPlanMejora) {
        pipExtra.plan_mejora = true;
        pipExtra.plan_mejora_data = JSON.stringify({
          objetivo:    pipObjetivo.trim(),
          duracion:    pipDuracion.trim(),
          fechaFin:    pipFechaFin,
          areas:       pipAreas.filter((a) => a.trim()),
          metas:       pipMetas.filter((m) => m.meta.trim()),
          seguimiento: pipSeguimiento.trim(),
        });
      } else if (tipo !== "pip") {
        pipExtra.plan_mejora = false;
        pipExtra.plan_mejora_data = undefined;
      }

      const payload: CreateActaPayload = {
        empleado_id: empleadoId,
        tipo,
        fecha_acta:  fechaActa,
        hora_inicio: tipo === "pip" ? "N/A" : horaInicio,
        hora_cierre: tipo === "pip" ? "N/A" : horaCierre,
        ...extra,
        ...pipExtra,
      };
      await onSave(isEdit ? (payload as UpdateActaPayload) : payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      isOpen
      title={isEdit ? "Editar acta" : "Nueva acta administrativa"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Selector de tipo */}
        <div>
          <label className={LABEL}>Tipo de acta</label>
          <select
            className={INPUT}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            disabled={isEdit}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Fecha + horas (común, oculto para PIP) */}
        <div className={tipo === "pip" ? "grid grid-cols-1 gap-3" : "grid grid-cols-3 gap-3"}>
          <div>
            <label className={LABEL}>Fecha del acta</label>
            <input type="date" className={INPUT} value={fechaActa}
              onChange={(e) => setFechaActa(e.target.value)} required />
          </div>
          {tipo !== "pip" && (
            <>
              <div>
                <label className={LABEL}>Hora inicio</label>
                <input type="time" className={INPUT} value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)} required />
              </div>
              <div>
                <label className={LABEL}>Hora cierre</label>
                <input type="time" className={INPUT} value={horaCierre}
                  onChange={(e) => setHoraCierre(e.target.value)} required />
              </div>
            </>
          )}
        </div>

        {/* ── VOLUNTARIA ─────────────────────────────────────── */}
        {tipo === "voluntaria" && (
          <>
            <div>
              <label className={LABEL}>Fecha de los hechos</label>
              <input type="date" className={INPUT} value={fechaHechos}
                onChange={(e) => setFechaHechos(e.target.value)} required />
            </div>

            <div>
              <label className={LABEL}>Clave de elector del empleado (INE)</label>
              <input type="text" className={INPUT} value={empleadoClaveIne}
                onChange={(e) => setEmpleadoClaveIne(e.target.value)}
                placeholder="Opcional — se imprime en el acta" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Nombre del testigo</label>
                <input type="text" className={INPUT} value={testigoNombre}
                  onChange={(e) => setTestigoNombre(e.target.value)}
                  placeholder="Nombre completo" required />
              </div>
              <div>
                <label className={LABEL}>Clave de elector del testigo (INE)</label>
                <input type="text" className={INPUT} value={testigoClaveIne}
                  onChange={(e) => setTestigoClaveIne(e.target.value)}
                  placeholder="Opcional" />
              </div>
            </div>

            <div>
              <label className={LABEL}>
                Hechos{" "}
                <span className="normal-case font-normal text-slate-400">
                  (opcional — vacío genera líneas en blanco)
                </span>
              </label>
              <textarea className={TEXTAREA} rows={4} value={hechos}
                onChange={(e) => setHechos(e.target.value)}
                placeholder="Relato de los hechos..." />
            </div>

            <div>
              <label className={LABEL}>
                Declaración del testigo{" "}
                <span className="normal-case font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea className={TEXTAREA} rows={3} value={declaracionTestigo}
                onChange={(e) => setDeclaracionTestigo(e.target.value)}
                placeholder="Declaración del testigo..." />
            </div>
          </>
        )}

        {/* ── ACTA DE HECHOS ─────────────────────────────────── */}
        {tipo === "hechos" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={LABEL + " mb-0"}>Hechos numerados</label>
              <button
                type="button"
                onClick={addPunto}
                className="flex items-center gap-1 rounded-lg border border-[#312C85] px-3 py-1 text-xs font-semibold text-[#312C85] transition hover:bg-[#312C85]/5"
              >
                + Agregar punto
              </button>
            </div>

            {puntos.map((p, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="mt-2.5 w-24 shrink-0 text-xs font-bold text-slate-500">
                  {ORDINALES[i] ?? `${i + 1}`}.
                </span>
                <textarea
                  className={TEXTAREA + " flex-1"}
                  rows={3}
                  value={p}
                  onChange={(e) => setPunto(i, e.target.value)}
                  placeholder={`Descripción del punto ${i + 1}...`}
                />
                {puntos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePunto(i)}
                    className="mt-2 rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-500 transition hover:bg-red-50"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── ACTA DISCIPLINARIA ─────────────────────────────── */}
        {tipo === "disciplinaria" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Testigo 1</label>
                <input type="text" className={INPUT} value={testigo1}
                  onChange={(e) => setTestigo1(e.target.value)}
                  placeholder="Nombre completo del testigo 1" required />
              </div>
              <div>
                <label className={LABEL}>Testigo 2 <span className="normal-case font-normal text-slate-400">(opcional)</span></label>
                <input type="text" className={INPUT} value={testigo2}
                  onChange={(e) => setTestigo2(e.target.value)}
                  placeholder="Nombre completo del testigo 2" />
              </div>
            </div>

            <div>
              <label className={LABEL}>
                Hechos{" "}
                <span className="normal-case font-normal text-slate-400">(opcional — vacío genera líneas en blanco)</span>
              </label>
              <textarea className={TEXTAREA} rows={4} value={hechos}
                onChange={(e) => setHechos(e.target.value)}
                placeholder="Relato de los hechos..." />
            </div>

          </>
        )}

        {/* ── PLAN DE MEJORA (PIP) ───────────────────────────── */}
        {tipo === "pip" && (
          <>
            <div>
              <label className={LABEL}>Objetivo del plan</label>
              <textarea className={TEXTAREA} rows={2} value={pipObjetivo}
                onChange={(e) => setPipObjetivo(e.target.value)}
                placeholder="Mejorar el desempeño en..." required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Duración</label>
                <input type="text" className={INPUT} value={pipDuracion}
                  onChange={(e) => setPipDuracion(e.target.value)}
                  placeholder="Ej. 3 meses" />
              </div>
              <div>
                <label className={LABEL}>Fecha estimada de cierre</label>
                <input type="date" className={INPUT} value={pipFechaFin}
                  onChange={(e) => setPipFechaFin(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={LABEL + " mb-0"}>Áreas de mejora</label>
                <button type="button" onClick={addArea}
                  className="flex items-center gap-1 rounded-lg border border-[#312C85] px-3 py-1 text-xs font-semibold text-[#312C85] transition hover:bg-[#312C85]/5">
                  + Agregar área
                </button>
              </div>
              {pipAreas.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" className={INPUT + " flex-1"} value={a}
                    onChange={(e) => setArea(i, e.target.value)}
                    placeholder={`Área de mejora ${i + 1}...`} />
                  {pipAreas.length > 1 && (
                    <button type="button" onClick={() => removeArea(i)}
                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 transition hover:bg-red-50">✕</button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={LABEL + " mb-0"}>Metas y compromisos</label>
                <button type="button" onClick={addMeta}
                  className="flex items-center gap-1 rounded-lg border border-[#312C85] px-3 py-1 text-xs font-semibold text-[#312C85] transition hover:bg-[#312C85]/5">
                  + Agregar meta
                </button>
              </div>
              {pipMetas.map((m, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Meta {i + 1}</span>
                    {pipMetas.length > 1 && (
                      <button type="button" onClick={() => removeMeta(i)}
                        className="text-xs text-red-500 hover:text-red-700">✕ Quitar</button>
                    )}
                  </div>
                  <textarea className={TEXTAREA} rows={2} value={m.meta}
                    onChange={(e) => setMeta(i, "meta", e.target.value)}
                    placeholder="Descripción de la meta..." />
                  <input type="text" className={INPUT} value={m.indicador}
                    onChange={(e) => setMeta(i, "indicador", e.target.value)}
                    placeholder="Indicador de cumplimiento..." />
                </div>
              ))}
            </div>

            <div>
              <label className={LABEL}>
                Seguimiento{" "}
                <span className="normal-case font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea className={TEXTAREA} rows={3} value={pipSeguimiento}
                onChange={(e) => setPipSeguimiento(e.target.value)}
                placeholder="Descripción del proceso de seguimiento y evaluación..." />
            </div>
          </>
        )}

        {/* ── PLAN DE MEJORA como complemento (solo para actas que no son PIP) ── */}
        {tipo !== "pip" && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Plan de mejora</p>
                <p className="text-xs text-slate-400 mt-0.5">¿Esta acta derivará en un Plan de Mejora (PIP)?</p>
              </div>
              <button
                type="button"
                onClick={() => setConPlanMejora((v) => !v)}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#312C85]/30",
                  conPlanMejora ? "bg-[#312C85]" : "bg-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    conPlanMejora ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>

            {conPlanMejora && (
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div>
                  <label className={LABEL}>Objetivo del plan</label>
                  <textarea className={TEXTAREA} rows={2} value={pipObjetivo}
                    onChange={(e) => setPipObjetivo(e.target.value)}
                    placeholder="Mejorar el desempeño en..." required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Duración</label>
                    <input type="text" className={INPUT} value={pipDuracion}
                      onChange={(e) => setPipDuracion(e.target.value)}
                      placeholder="Ej. 3 meses" />
                  </div>
                  <div>
                    <label className={LABEL}>Fecha estimada de cierre</label>
                    <input type="date" className={INPUT} value={pipFechaFin}
                      onChange={(e) => setPipFechaFin(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL + " mb-0"}>Áreas de mejora</label>
                    <button type="button" onClick={addArea}
                      className="flex items-center gap-1 rounded-lg border border-[#312C85] px-3 py-1 text-xs font-semibold text-[#312C85] transition hover:bg-[#312C85]/5">
                      + Agregar área
                    </button>
                  </div>
                  {pipAreas.map((a, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" className={INPUT + " flex-1"} value={a}
                        onChange={(e) => setArea(i, e.target.value)}
                        placeholder={`Área de mejora ${i + 1}...`} />
                      {pipAreas.length > 1 && (
                        <button type="button" onClick={() => removeArea(i)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 transition hover:bg-red-50">✕</button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL + " mb-0"}>Metas y compromisos</label>
                    <button type="button" onClick={addMeta}
                      className="flex items-center gap-1 rounded-lg border border-[#312C85] px-3 py-1 text-xs font-semibold text-[#312C85] transition hover:bg-[#312C85]/5">
                      + Agregar meta
                    </button>
                  </div>
                  {pipMetas.map((m, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Meta {i + 1}</span>
                        {pipMetas.length > 1 && (
                          <button type="button" onClick={() => removeMeta(i)}
                            className="text-xs text-red-500 hover:text-red-700">✕ Quitar</button>
                        )}
                      </div>
                      <textarea className={TEXTAREA} rows={2} value={m.meta}
                        onChange={(e) => setMeta(i, "meta", e.target.value)}
                        placeholder="Descripción de la meta..." />
                      <input type="text" className={INPUT} value={m.indicador}
                        onChange={(e) => setMeta(i, "indicador", e.target.value)}
                        placeholder="Indicador de cumplimiento..." />
                    </div>
                  ))}
                </div>

                <div>
                  <label className={LABEL}>
                    Seguimiento{" "}
                    <span className="normal-case font-normal text-slate-400">(opcional)</span>
                  </label>
                  <textarea className={TEXTAREA} rows={2} value={pipSeguimiento}
                    onChange={(e) => setPipSeguimiento(e.target.value)}
                    placeholder="Descripción del proceso de seguimiento..." />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="rounded-xl bg-[#312C85] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a2570] disabled:opacity-60">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear acta"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
