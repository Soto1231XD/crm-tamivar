import { useState } from "react";
import toast from "react-hot-toast";
import {
  createExamen,
  deleteExamen,
  submitRespuestas,
  getExamenResultados,
  calificarRespuestaLibre,
  type Examen,
} from "../services/evaluacion.api";
import { fmtDate, fullName } from "../utils/evaluacion.helpers";
import { AppModal } from "@/components/ui/AppModal";

export function ExamenesTab({
  examenes,
  canGestionar,
  currentUserId,
  onCreated,
  onDeleted,
  onSubmitted,
}: {
  examenes: Examen[];
  canGestionar: boolean;
  currentUserId: number;
  onCreated: (e: Examen) => void;
  onDeleted: (id: number) => void;
  onSubmitted: (examenId: number) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [takingExamen, setTakingExamen] = useState<Examen | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [resultadosExamen, setResultadosExamen] = useState<Examen | null>(null);
  const [resultadosMode, setResultadosMode] = useState<"coordinator" | "asesor">("asesor");
  const [expandedAsesores, setExpandedAsesores] = useState<Set<number>>(new Set());
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [newExamen, setNewExamen] = useState({
    titulo: "",
    descripcion: "",
    preguntas: [{ orden: 1, tipo: "opcion_multiple", pregunta: "", opciones: ["", ""], respuesta_correcta: "", puntos: 1 }] as Array<{
      orden: number;
      tipo: string;
      pregunta: string;
      opciones: string[];
      respuesta_correcta: string;
      puntos: number;
    }>,
  });

  const handleCreateExamen = async () => {
    if (!newExamen.titulo || newExamen.preguntas.some((p) => !p.pregunta)) {
      toast.error("Completa el título y todas las preguntas.");
      return;
    }
    setSaving(true);
    try {
      const created = await createExamen({
        titulo: newExamen.titulo,
        descripcion: newExamen.descripcion || undefined,
        preguntas: newExamen.preguntas.map((p) => ({
          ...p,
          opciones: p.tipo === "opcion_multiple" ? p.opciones.filter(Boolean) : undefined,
          respuesta_correcta: p.respuesta_correcta || undefined,
          puntos: p.puntos,
        })),
      });
      onCreated(created);
      setShowCreate(false);
      toast.success("Examen creado.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear examen.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!takingExamen) return;
    const respuestas = takingExamen.preguntas.map((p) => ({
      pregunta_id: p.id,
      respuesta: answers[p.id] ?? "",
    }));
    if (respuestas.some((r) => !r.respuesta)) {
      toast.error("Responde todas las preguntas.");
      return;
    }
    setSaving(true);
    try {
      await submitRespuestas(takingExamen.id, respuestas);
      onSubmitted(takingExamen.id);
      setTakingExamen(null);
      setAnswers({});
      toast.success("Examen enviado.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al enviar respuestas.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerResultados = async (examen: Examen) => {
    setLoadingResultados(true);
    try {
      const full = await getExamenResultados(examen.id);
      setResultadosExamen(full);
      setResultadosMode("coordinator");
      setExpandedAsesores(new Set());
    } catch {
      toast.error("Error al cargar resultados.");
    } finally {
      setLoadingResultados(false);
    }
  };

  const handleCalificarLibre = async (
    asignacionId: number,
    preguntaId: number,
    correcto: boolean,
  ) => {
    try {
      const updated = await calificarRespuestaLibre(asignacionId, preguntaId, correcto);
      setResultadosExamen((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          asignaciones: prev.asignaciones.map((a) =>
            a.id === asignacionId
              ? { ...a, calificacion: updated.calificacion, respuestas: updated.respuestas }
              : a,
          ),
        };
      });
    } catch {
      toast.error("Error al guardar calificación.");
    }
  };

  const toggleExpandAsesor = (uid: number) => {
    setExpandedAsesores((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const addPregunta = () => {
    setNewExamen((prev) => ({
      ...prev,
      preguntas: [
        ...prev.preguntas,
        { orden: prev.preguntas.length + 1, tipo: "opcion_multiple", pregunta: "", opciones: ["", ""], respuesta_correcta: "", puntos: 1 },
      ] as typeof prev.preguntas,
    }));
  };

  return (
    <div className="space-y-3">
      {canGestionar && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-[var(--crm-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-80"
          >
            + Nuevo examen
          </button>
        </div>
      )}

      {examenes.length === 0 && (
        <p className="py-10 text-center text-sm text-[var(--crm-text-soft)]">Sin exámenes.</p>
      )}

      {examenes.map((examen) => {
        const miAsignacion = examen.asignaciones.find((a) => a.usuario_id === currentUserId);
        const yaCompletado = miAsignacion?.completado_en != null;

        return (
          <div key={examen.id} className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--crm-text)]">{examen.titulo}</p>
                {examen.descripcion && (
                  <p className="text-xs text-[var(--crm-text-soft)] mt-0.5">{examen.descripcion}</p>
                )}
                <p className="text-xs text-[var(--crm-text-soft)] mt-1">
                  {examen.preguntas.length} preguntas · {examen.preguntas.reduce((s, p) => s + p.puntos, 0)} pts · Creado {fmtDate(examen.creado_en)}
                </p>
                {canGestionar && (
                  <p className="text-xs text-[var(--crm-text-soft)] mt-0.5">
                    Completados: {examen.asignaciones.filter((a) => a.completado_en).length}/{examen.asignaciones.length}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                {miAsignacion && (
                  yaCompletado ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                        (miAsignacion.calificacion ?? 0) >= 7 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {miAsignacion.calificacion != null ? `${miAsignacion.calificacion}/10` : "Completado"}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setResultadosExamen(examen); setResultadosMode("asesor"); }}
                        className="text-xs text-[var(--crm-primary)] hover:underline"
                      >
                        Ver resultados
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setTakingExamen(examen); setAnswers({}); }}
                      className="rounded-xl bg-[var(--crm-primary)] px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Responder
                    </button>
                  )
                )}
                {canGestionar && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleVerResultados(examen)}
                      disabled={loadingResultados}
                      className="text-xs text-[var(--crm-primary)] hover:underline disabled:opacity-50"
                    >
                      Ver respuestas
                    </button>
                    <button
                      type="button"
                      onClick={() => { deleteExamen(examen.id).then(() => { onDeleted(examen.id); toast.success("Examen eliminado."); }).catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Error.")); }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal: Tomar examen */}
      <AppModal isOpen={!!takingExamen} onClose={() => setTakingExamen(null)} title={takingExamen?.titulo ?? ""}>
        {takingExamen && (
          <div className="space-y-5">
            {takingExamen.preguntas.map((p, idx) => (
              <div key={p.id} className="space-y-2">
                <p className="text-sm font-medium text-[var(--crm-text)]">
                  {idx + 1}. {p.pregunta}
                </p>
                {p.tipo === "texto_libre" ? (
                  <textarea
                    rows={3}
                    value={answers[p.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [p.id]: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)] resize-none"
                  />
                ) : p.tipo === "verdadero_falso" ? (
                  <div className="flex gap-3">
                    {["Verdadero", "Falso"].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${p.id}`}
                          value={opt}
                          checked={answers[p.id] === opt}
                          onChange={() => setAnswers((a) => ({ ...a, [p.id]: opt }))}
                          className="accent-[var(--crm-primary)]"
                        />
                        <span className="text-sm text-[var(--crm-text)]">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {(p.opciones ?? []).map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${p.id}`}
                          value={opt}
                          checked={answers[p.id] === opt}
                          onChange={() => setAnswers((a) => ({ ...a, [p.id]: opt }))}
                          className="accent-[var(--crm-primary)]"
                        />
                        <span className="text-sm text-[var(--crm-text)]">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTakingExamen(null)} className="rounded-xl border border-[var(--crm-border)] px-4 py-2 text-sm text-[var(--crm-text-soft)]">
                Cancelar
              </button>
              <button type="button" onClick={handleSubmit} disabled={saving} className="rounded-xl bg-[var(--crm-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {saving ? "Enviando..." : "Enviar respuestas"}
              </button>
            </div>
          </div>
        )}
      </AppModal>

      {/* Modal: Crear examen */}
      <AppModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo examen">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <input
            placeholder="Título del examen *"
            value={newExamen.titulo}
            onChange={(e) => setNewExamen((x) => ({ ...x, titulo: e.target.value }))}
            className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]"
          />
          <input
            placeholder="Descripción (opcional)"
            value={newExamen.descripcion}
            onChange={(e) => setNewExamen((x) => ({ ...x, descripcion: e.target.value }))}
            className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]"
          />

          {newExamen.preguntas.map((p, idx) => (
            <div key={idx} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface-soft)] p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[var(--crm-text-soft)]">P{idx + 1}</span>
                <select
                  value={p.tipo}
                  onChange={(e) => setNewExamen((x) => {
                    const ps = [...x.preguntas] as typeof x.preguntas;
                    ps[idx] = { ...ps[idx], tipo: e.target.value };
                    return { ...x, preguntas: ps };
                  })}
                  className="rounded-lg border border-[var(--crm-border-strong)] bg-white px-2 py-1 text-xs text-[var(--crm-text)] outline-none"
                >
                  <option value="opcion_multiple">Opción múltiple</option>
                  <option value="verdadero_falso">Verdadero/Falso</option>
                  <option value="texto_libre">Texto libre</option>
                </select>
                <div className="flex items-center gap-1 ml-auto">
                  <label className="text-xs text-[var(--crm-text-soft)]">Puntos:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={p.puntos}
                    onChange={(e) => setNewExamen((x) => {
                      const ps = [...x.preguntas] as typeof x.preguntas;
                      ps[idx] = { ...ps[idx], puntos: Math.max(1, parseInt(e.target.value) || 1) };
                      return { ...x, preguntas: ps };
                    })}
                    className="w-14 rounded-lg border border-[var(--crm-border-strong)] bg-white px-2 py-1 text-center text-xs text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)]"
                  />
                </div>
              </div>
              <input
                placeholder="Pregunta *"
                value={p.pregunta}
                onChange={(e) => setNewExamen((x) => {
                  const ps = [...x.preguntas];
                  ps[idx] = { ...ps[idx], pregunta: e.target.value };
                  return { ...x, preguntas: ps };
                })}
                className="w-full rounded-lg border border-[var(--crm-border-strong)] bg-white px-2.5 py-1.5 text-sm text-[var(--crm-text)] outline-none"
              />
              {p.tipo === "opcion_multiple" && (
                <div className="space-y-1.5">
                  <p className="text-xs text-[var(--crm-text-soft)]">Selecciona el radio de la opción correcta</p>
                  {p.opciones.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${idx}`}
                        checked={p.respuesta_correcta === opt && opt !== ""}
                        onChange={() => setNewExamen((x) => {
                          const ps = [...x.preguntas];
                          ps[idx] = { ...ps[idx], respuesta_correcta: ps[idx].opciones[oi] };
                          return { ...x, preguntas: ps };
                        })}
                        className="accent-[var(--crm-primary)] shrink-0"
                        title="Marcar como correcta"
                      />
                      <input
                        placeholder={`Opción ${oi + 1}`}
                        value={opt}
                        onChange={(e) => setNewExamen((x) => {
                          const ps = [...x.preguntas];
                          const opts = [...ps[idx].opciones];
                          const wasCorrect = ps[idx].respuesta_correcta === opts[oi];
                          opts[oi] = e.target.value;
                          ps[idx] = {
                            ...ps[idx],
                            opciones: opts,
                            respuesta_correcta: wasCorrect ? e.target.value : ps[idx].respuesta_correcta,
                          };
                          return { ...x, preguntas: ps };
                        })}
                        className="flex-1 rounded-lg border border-[var(--crm-border-strong)] bg-white px-2.5 py-1 text-sm text-[var(--crm-text)] outline-none"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewExamen((x) => {
                      const ps = [...x.preguntas];
                      ps[idx] = { ...ps[idx], opciones: [...ps[idx].opciones, ""] };
                      return { ...x, preguntas: ps };
                    })}
                    className="text-xs text-[var(--crm-primary)]"
                  >
                    + Opción
                  </button>
                </div>
              )}
              {p.tipo === "verdadero_falso" && (
                <div className="space-y-1">
                  <p className="text-xs text-[var(--crm-text-soft)]">Selecciona la respuesta correcta</p>
                  <div className="flex gap-4">
                    {["Verdadero", "Falso"].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`correct-${idx}`}
                          checked={p.respuesta_correcta === opt}
                          onChange={() => setNewExamen((x) => {
                            const ps = [...x.preguntas];
                            ps[idx] = { ...ps[idx], respuesta_correcta: opt };
                            return { ...x, preguntas: ps };
                          })}
                          className="accent-[var(--crm-primary)]"
                        />
                        <span className="text-sm text-[var(--crm-text)]">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <button type="button" onClick={addPregunta} className="text-sm text-[var(--crm-primary)]">
            + Agregar pregunta
          </button>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-[var(--crm-border)] px-4 py-2 text-sm text-[var(--crm-text-soft)]">
            Cancelar
          </button>
          <button type="button" onClick={handleCreateExamen} disabled={saving} className="rounded-xl bg-[var(--crm-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {saving ? "Creando..." : "Crear examen"}
          </button>
        </div>
      </AppModal>

      {/* Modal: Resultados coordinador */}
      <AppModal
        isOpen={!!resultadosExamen && resultadosMode === "coordinator"}
        onClose={() => setResultadosExamen(null)}
        title={`Respuestas — ${resultadosExamen?.titulo ?? ""}`}
      >
        {resultadosExamen && (
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {resultadosExamen.asignaciones.filter((a) => a.completado_en).length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--crm-text-soft)]">
                Ningún asesor ha completado este examen todavía.
              </p>
            )}
            {resultadosExamen.asignaciones
              .filter((a) => a.completado_en)
              .map((asignacion) => {
                const expanded = expandedAsesores.has(asignacion.usuario_id);
                return (
                  <div key={asignacion.usuario_id} className="rounded-xl border border-[var(--crm-border)] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleExpandAsesor(asignacion.usuario_id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left bg-[var(--crm-surface-soft)] hover:bg-[var(--crm-surface)]"
                    >
                      <span className="text-sm font-medium text-[var(--crm-text)]">
                        {asignacion.usuario ? fullName(asignacion.usuario) : `Asesor ${asignacion.usuario_id}`}
                      </span>
                      <div className="flex items-center gap-2">
                        {asignacion.calificacion != null && (
                          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                            asignacion.calificacion >= 7 ? "bg-green-100 text-green-700" :
                            asignacion.calificacion >= 5 ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {asignacion.calificacion}/10
                          </span>
                        )}
                        <span className="text-xs text-[var(--crm-text-soft)]">{expanded ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-[var(--crm-border)] divide-y divide-[var(--crm-border)]">
                        {resultadosExamen.preguntas.map((pregunta, idx) => {
                          const resp = asignacion.respuestas?.find((r) => r.pregunta_id === pregunta.id);
                          const esTextoLibre = pregunta.tipo === "texto_libre";
                          const esCorrecta = resp?.calificacion === 10;
                          return (
                            <div key={pregunta.id} className="px-4 py-3 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-[var(--crm-text-soft)]">P{idx + 1}</p>
                                {!esTextoLibre && (
                                  <span className="text-xs text-[var(--crm-text-soft)]">{pregunta.puntos} pt{pregunta.puntos !== 1 ? "s" : ""}</span>
                                )}
                              </div>
                              <p className="text-sm text-[var(--crm-text)]">{pregunta.pregunta}</p>
                              {resp ? (
                                <div className="space-y-2">
                                  <div className={`rounded-lg px-3 py-2 text-sm ${
                                    esTextoLibre
                                      ? "bg-[var(--crm-surface-soft)] text-[var(--crm-text)]"
                                      : esCorrecta
                                      ? "bg-green-50 text-green-700"
                                      : "bg-red-50 text-red-700"
                                  }`}>
                                    {!esTextoLibre && (
                                      <p className="text-xs font-semibold mb-0.5">
                                        {esCorrecta ? "✓ Correcta" : "✗ Incorrecta"}
                                      </p>
                                    )}
                                    <p>{resp.respuesta}</p>
                                    {!esCorrecta && !esTextoLibre && pregunta.respuesta_correcta && (
                                      <p className="text-xs mt-1 opacity-75">
                                        Correcta: {pregunta.respuesta_correcta}
                                      </p>
                                    )}
                                  </div>
                                  {esTextoLibre && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[var(--crm-text-soft)]">Calificar:</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCalificarLibre(asignacion.id, pregunta.id, true)}
                                        className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                                          resp.calificacion === 10
                                            ? "bg-green-500 text-white"
                                            : "bg-green-50 text-green-700 hover:bg-green-100"
                                        }`}
                                      >
                                        Bien
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCalificarLibre(asignacion.id, pregunta.id, false)}
                                        className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                                          resp.calificacion === 0
                                            ? "bg-red-500 text-white"
                                            : "bg-red-50 text-red-700 hover:bg-red-100"
                                        }`}
                                      >
                                        Mal
                                      </button>
                                      {resp.calificacion === null && (
                                        <span className="text-xs text-amber-500">Sin calificar</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-[var(--crm-text-soft)]">Sin respuesta</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </AppModal>

      {/* Modal: Mis resultados (asesor) */}
      <AppModal
        isOpen={!!resultadosExamen && resultadosMode === "asesor"}
        onClose={() => setResultadosExamen(null)}
        title={`Mis resultados — ${resultadosExamen?.titulo ?? ""}`}
      >
        {resultadosExamen && (() => {
          const miAsignacion = resultadosExamen.asignaciones[0];
          return (
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {miAsignacion?.calificacion != null && (
                <div className={`text-center py-3 rounded-xl text-lg font-bold ${
                  miAsignacion.calificacion >= 7 ? "bg-green-50 text-green-700" :
                  miAsignacion.calificacion >= 5 ? "bg-amber-50 text-amber-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  {miAsignacion.calificacion}/10
                </div>
              )}
              {resultadosExamen.preguntas.map((pregunta, idx) => {
                const resp = miAsignacion?.respuestas?.find((r) => r.pregunta_id === pregunta.id);
                const esTextoLibre = pregunta.tipo === "texto_libre";
                const esCorrecta = resp?.calificacion === 10;
                return (
                  <div key={pregunta.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--crm-text)]">{idx + 1}. {pregunta.pregunta}</p>
                      {!esTextoLibre && (
                        <span className="shrink-0 ml-2 text-xs text-[var(--crm-text-soft)]">{pregunta.puntos} pt{pregunta.puntos !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                    {resp ? (
                      <div className={`rounded-lg px-3 py-2 text-sm ${
                        esTextoLibre
                          ? "bg-[var(--crm-surface-soft)] text-[var(--crm-text)]"
                          : esCorrecta
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {!esTextoLibre && (
                          <p className="text-xs font-semibold mb-0.5">
                            {esCorrecta ? "✓ Correcta" : "✗ Incorrecta"}
                          </p>
                        )}
                        <p>{resp.respuesta}</p>
                        {!esCorrecta && !esTextoLibre && pregunta.respuesta_correcta && (
                          <p className="text-xs mt-1 opacity-75">
                            Respuesta correcta: {pregunta.respuesta_correcta}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--crm-text-soft)]">Sin respuesta</p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </AppModal>
    </div>
  );
}
