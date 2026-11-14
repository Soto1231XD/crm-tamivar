import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { PermisoEmpleado, CreatePermisoPayload, UpdatePermisoPayload } from "../services/permisos.api";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

function calcularRetraso(horaEntrada: string, horaLlegada: string): string {
  const [eh, em] = horaEntrada.split(":").map(Number);
  const [lh, lm] = horaLlegada.split(":").map(Number);
  const totalMin = (lh * 60 + lm) - (eh * 60 + em);
  if (totalMin <= 0) return "";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h} hora${h > 1 ? "s" : ""} y ${m} minuto${m > 1 ? "s" : ""}`;
  if (h > 0) return `${h} hora${h > 1 ? "s" : ""}`;
  return `${m} minuto${m > 1 ? "s" : ""}`;
}

interface Props {
  empleadoId: number;
  initial?: PermisoEmpleado | null;
  onSave: (data: CreatePermisoPayload | UpdatePermisoPayload) => Promise<void>;
  onClose: () => void;
}

export function PermisoModal({ empleadoId, initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState<"Personal" | "Médico" | "Familiar" | "Tardanza" | "Entrada Tarde" | "Inasistencia" | "Lactancia" | "Falta Justificada" | "Permiso para llegar tarde">("Personal");
  const [conGoce, setConGoce] = useState(true);
  const [descripcion, setDescripcion] = useState("");
  const [horaLlegada, setHoraLlegada] = useState("");
  const [fechaRecuperacion, setFechaRecuperacion] = useState("");
  const [opcionPLT, setOpcionPLT] = useState<"con_goce" | "sin_goce" | "reposicion">("sin_goce");
  const [horarioLac, setHorarioLac] = useState({
    entrada: "09:00",
    salidaHabLV: "18:00",
    salidaHabSab: "14:00",
    salidaNuevaLV: "16:00",
    salidaNuevaSab: "13:00",
  });
  const [estatus, setEstatus] = useState<"Pendiente" | "Aprobado" | "Rechazado">("Pendiente");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const HORA_ENTRADA = "09:00";
  const esTardanza = tipo === "Tardanza";
  const esEntradaTarde = tipo === "Entrada Tarde";
  const esInasistencia = tipo === "Inasistencia";
  const esLactancia = tipo === "Lactancia";
  const esFaltaJustificada = tipo === "Falta Justificada";
  const esPermisoLlegarTarde = tipo === "Permiso para llegar tarde";
  const retraso = (esTardanza || esEntradaTarde || esPermisoLlegarTarde) && horaLlegada ? calcularRetraso(HORA_ENTRADA, horaLlegada) : "";

  useEffect(() => {
    if (initial) {
      setFecha(initial.fecha.slice(0, 10));
      setTipo(initial.tipo as typeof tipo);
      setConGoce(initial.tipo === "Tardanza" || initial.tipo === "Entrada Tarde" ? false : initial.con_goce);
      setDescripcion(initial.descripcion ?? "");
      if (initial.tipo === "Lactancia" && initial.hora_llegada) {
        const [ent, shlv, shsab, snlv, snsab] = initial.hora_llegada.split("|");
        setHorarioLac({
          entrada: ent ?? "09:00",
          salidaHabLV: shlv ?? "18:00",
          salidaHabSab: shsab ?? "14:00",
          salidaNuevaLV: snlv ?? "16:00",
          salidaNuevaSab: snsab ?? "13:00",
        });
      } else {
        // Para Falta Justificada hora_llegada es una fecha (fin de ausencia)
        setHoraLlegada(initial.hora_llegada ?? "");
      }
      setFechaRecuperacion(initial.fecha_recuperacion ?? "");
      setEstatus(initial.estatus);
      if (initial.tipo === "Permiso para llegar tarde") {
        if (initial.fecha_recuperacion) setOpcionPLT("reposicion");
        else if (initial.con_goce) setOpcionPLT("con_goce");
        else setOpcionPLT("sin_goce");
      }
    }
  }, [initial]);

  // Estos tipos siempre son sin goce
  useEffect(() => {
    if (esTardanza || esEntradaTarde || esInasistencia || esFaltaJustificada) setConGoce(false);
  }, [esTardanza, esEntradaTarde, esInasistencia, esFaltaJustificada]);
  // Lactancia siempre con goce
  useEffect(() => {
    if (esLactancia) setConGoce(true);
  }, [esLactancia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) { setError("La fecha es obligatoria."); return; }
    if ((esTardanza || esEntradaTarde) && !horaLlegada) { setError("La hora estimada de llegada es obligatoria."); return; }
    if (esTardanza && !descripcion.trim()) { setError("El motivo de la tardanza es obligatorio."); return; }
    if (esEntradaTarde && !fechaRecuperacion) { setError("La fecha de recuperación es obligatoria."); return; }
    if (esEntradaTarde && !descripcion.trim()) { setError("El motivo es obligatorio."); return; }
    if (esInasistencia && !fechaRecuperacion) { setError("La fecha de regreso es obligatoria."); return; }
    if (esInasistencia && !descripcion.trim()) { setError("El motivo de la inasistencia es obligatorio."); return; }
    if (esLactancia && !fechaRecuperacion) { setError("La fecha de término es obligatoria."); return; }
    if (esFaltaJustificada && !horaLlegada) { setError("La fecha de fin de la ausencia es obligatoria."); return; }
    if (esFaltaJustificada && !fechaRecuperacion) { setError("La fecha de reanudación es obligatoria."); return; }
    if (esFaltaJustificada && !descripcion.trim()) { setError("El motivo de la falta es obligatorio."); return; }
    if (esPermisoLlegarTarde && !horaLlegada) { setError("La hora de llegada es obligatoria."); return; }
    if (esPermisoLlegarTarde && !descripcion.trim()) { setError("El motivo es obligatorio."); return; }
    if (esPermisoLlegarTarde && opcionPLT === "reposicion" && !fechaRecuperacion) { setError("La fecha de reposición es obligatoria."); return; }
    setSaving(true);
    setError("");
    try {
      const needsHora = esTardanza || esEntradaTarde || esPermisoLlegarTarde;
      const needsFechaExtra = esEntradaTarde || esInasistencia || esLactancia || esFaltaJustificada || (esPermisoLlegarTarde && opcionPLT === "reposicion");
      const horaLlegadaFinal = esLactancia
        ? `${horarioLac.entrada}|${horarioLac.salidaHabLV}|${horarioLac.salidaHabSab}|${horarioLac.salidaNuevaLV}|${horarioLac.salidaNuevaSab}`
        : esFaltaJustificada ? horaLlegada
        : needsHora ? horaLlegada : null;
      const payload = isEdit
        ? ({
            fecha, tipo, con_goce: conGoce,
            descripcion: descripcion || undefined,
            hora_llegada: horaLlegadaFinal,
            fecha_recuperacion: needsFechaExtra ? fechaRecuperacion : null,
            estatus,
          } as UpdatePermisoPayload)
        : ({
            empleado_id: empleadoId,
            fecha, tipo, con_goce: conGoce,
            descripcion: descripcion || undefined,
            hora_llegada: horaLlegadaFinal,
            fecha_recuperacion: needsFechaExtra ? fechaRecuperacion : null,
            estatus,
          } as CreatePermisoPayload);
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title={isEdit ? "Editar permiso" : "Registrar permiso"}
      maxWidthClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Fila 1: Fecha + Tipo */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>
              {esInasistencia || esLactancia || esFaltaJustificada ? "Fecha de inicio" : "Fecha"} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={INPUT}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div>
            <label className={LABEL}>Tipo <span className="text-red-500">*</span></label>
            <select className={INPUT} value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
              <option value="Personal">Personal</option>
              <option value="Médico">Médico</option>
              <option value="Familiar">Familiar</option>
              <option value="Tardanza">Tardanza — Sin goce de sueldo</option>
              <option value="Entrada Tarde">Entrada Tarde — Con recuperación de tiempo</option>
              <option value="Inasistencia">Inasistencia — Constancia sin goce de sueldo</option>
              <option value="Lactancia">Lactancia — Ajuste de horario por periodo de lactancia</option>
              <option value="Falta Justificada">Falta Justificada — Constancia sin goce de sueldo</option>
              <option value="Permiso para llegar tarde">Permiso para llegar tarde — Con goce, sin goce o reposición</option>
            </select>
          </div>
        </div>

        {/* Fila 2: Estatus + Goce (Goce solo si no es tipo especial) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Estatus</label>
            <select className={INPUT} value={estatus} onChange={(e) => setEstatus(e.target.value as typeof estatus)}>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
          {!esTardanza && !esEntradaTarde && !esInasistencia && !esLactancia && !esFaltaJustificada && !esPermisoLlegarTarde ? (
            <div>
              <label className={LABEL}>Goce de sueldo</label>
              <div className="flex h-[42px] items-center gap-4">
                {(["Con goce", "Sin goce"] as const).map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="con_goce"
                      checked={conGoce === (opt === "Con goce")}
                      onChange={() => setConGoce(opt === "Con goce")}
                      className="accent-[#312C85]"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-end pb-1">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                Sin goce de sueldo
              </span>
            </div>
          )}
        </div>

        {/* Sección especial Tardanza */}
        {esTardanza && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Horarios de tardanza</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Hora habitual de entrada</label>
                <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-500">
                  9:00 am
                </div>
              </div>
              <div>
                <label className={LABEL}>Hora estimada de llegada <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  className={INPUT}
                  value={horaLlegada}
                  onChange={(e) => setHoraLlegada(e.target.value)}
                />
              </div>
            </div>
            {retraso && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                <span className="font-semibold">Retraso aproximado: </span>{retraso}
              </div>
            )}
          </div>
        )}

        {/* Sección especial Entrada Tarde */}
        {esEntradaTarde && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Detalle de entrada tarde</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Hora habitual de entrada</label>
                <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-500">
                  9:00 am
                </div>
              </div>
              <div>
                <label className={LABEL}>Hora estimada de llegada <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  className={INPUT}
                  value={horaLlegada}
                  onChange={(e) => setHoraLlegada(e.target.value)}
                />
              </div>
            </div>
            {retraso && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                <span className="font-semibold">Retraso aproximado: </span>{retraso}
              </div>
            )}
            <div>
              <label className={LABEL}>Fecha de recuperación <span className="text-red-500">*</span></label>
              <input
                type="date"
                className={INPUT}
                value={fechaRecuperacion}
                onChange={(e) => setFechaRecuperacion(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Sección especial Inasistencia */}
        {esInasistencia && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">Periodo de inasistencia</p>
            <div>
              <label className={LABEL}>Fecha de regreso <span className="text-red-500">*</span></label>
              <input
                type="date"
                className={INPUT}
                value={fechaRecuperacion}
                onChange={(e) => setFechaRecuperacion(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Sección especial Lactancia */}
        {esLactancia && (
          <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-pink-400">Periodo de lactancia</p>

            <div>
              <label className={LABEL}>Fecha de término <span className="text-red-500">*</span></label>
              <input
                type="date"
                className={INPUT}
                value={fechaRecuperacion}
                onChange={(e) => setFechaRecuperacion(e.target.value)}
              />
            </div>

            {/* Horario laboral habitual */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Horario laboral habitual</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className={LABEL}>Entrada</label>
                  <input type="time" className={INPUT} value={horarioLac.entrada}
                    onChange={(e) => setHorarioLac(h => ({ ...h, entrada: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Salida Lun–Vie</label>
                  <input type="time" className={INPUT} value={horarioLac.salidaHabLV}
                    onChange={(e) => setHorarioLac(h => ({ ...h, salidaHabLV: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Salida Sábado</label>
                  <input type="time" className={INPUT} value={horarioLac.salidaHabSab}
                    onChange={(e) => setHorarioLac(h => ({ ...h, salidaHabSab: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Horario autorizado por lactancia */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Horario autorizado por lactancia</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>Nueva salida Lun–Vie</label>
                  <input type="time" className={INPUT} value={horarioLac.salidaNuevaLV}
                    onChange={(e) => setHorarioLac(h => ({ ...h, salidaNuevaLV: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Nueva salida Sábado</label>
                  <input type="time" className={INPUT} value={horarioLac.salidaNuevaSab}
                    onChange={(e) => setHorarioLac(h => ({ ...h, salidaNuevaSab: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección especial Falta Justificada */}
        {esFaltaJustificada && (
          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">Periodo de ausencia</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Fecha de fin de ausencia <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className={INPUT}
                  value={horaLlegada}
                  onChange={(e) => setHoraLlegada(e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL}>Fecha de reanudación <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className={INPUT}
                  value={fechaRecuperacion}
                  onChange={(e) => setFechaRecuperacion(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Sección especial Permiso para llegar tarde */}
        {esPermisoLlegarTarde && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Detalle del permiso</p>

            {/* Horas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Hora habitual de entrada</label>
                <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-500">
                  9:00 am
                </div>
              </div>
              <div>
                <label className={LABEL}>Hora de llegada <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  className={INPUT}
                  value={horaLlegada}
                  onChange={(e) => setHoraLlegada(e.target.value)}
                />
              </div>
            </div>
            {retraso && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                <span className="font-semibold">Retraso aproximado: </span>{retraso}
              </div>
            )}

            {/* Tipo de permiso — 3 opciones */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">Tipo de permiso</p>
              <div className="flex flex-col gap-2">
                {([
                  { value: "con_goce",   label: "Con goce de sueldo" },
                  { value: "sin_goce",   label: "Sin goce de sueldo" },
                  { value: "reposicion", label: "Con reposición de tiempo" },
                ] as const).map(({ value, label }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="tipo_plt"
                      checked={opcionPLT === value}
                      onChange={() => {
                        setOpcionPLT(value);
                        if (value === "con_goce")   { setConGoce(true);  setFechaRecuperacion(""); }
                        if (value === "sin_goce")   { setConGoce(false); setFechaRecuperacion(""); }
                        if (value === "reposicion") { setConGoce(false); }
                      }}
                      className="accent-[#312C85]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Fecha de reposición — solo si se seleccionó reposición */}
            {opcionPLT === "reposicion" && (
              <div>
                <label className={LABEL}>Fecha de reposición <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className={INPUT}
                  value={fechaRecuperacion}
                  onChange={(e) => setFechaRecuperacion(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Descripción / Motivo */}
        <div>
          <label className={LABEL}>
            {esTardanza
              ? <>Motivo de la tardanza <span className="text-red-500">*</span></>
              : esEntradaTarde
              ? <>Motivo <span className="text-red-500">*</span></>
              : esInasistencia
              ? <>Motivo de la inasistencia <span className="text-red-500">*</span></>
              : esFaltaJustificada
              ? <>Motivo de la falta <span className="text-red-500">*</span></>
              : esPermisoLlegarTarde
              ? <>Motivo del permiso <span className="text-red-500">*</span></>
              : esLactancia
              ? "Observaciones (opcional)"
              : "Descripción"}
          </label>
          <textarea
            rows={3}
            className={`${INPUT} resize-none`}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={
              esTardanza ? "Describa la causa externa de la tardanza..." :
              esEntradaTarde ? "Describa el motivo de la entrada tarde..." :
              esInasistencia ? "Describa el motivo de la inasistencia..." :
              esFaltaJustificada ? "Describa el motivo de la falta justificada..." :
              esPermisoLlegarTarde ? "Describa el motivo del permiso para llegar tarde..." :
              esLactancia ? "Alguna observación adicional..." :
              "Motivo o detalles del permiso..."
            }
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
