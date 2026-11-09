import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { calcularDias, clasificarPeriodoVacacion } from "../services/vacaciones.api";
import type { Vacacion, CreateVacacionPayload, UpdateVacacionPayload } from "../services/vacaciones.api";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  empleadoId: number;
  fechaIngreso: string;
  sueldoMensual: number;
  diasCorresponden: number;
  diasDisponibles: number;
  diasDisponiblesAnticipado: number;
  initial?: Vacacion | null;
  onSave: (data: CreateVacacionPayload | UpdateVacacionPayload) => Promise<Vacacion>;
  onClose: () => void;
}

export function VacacionModal({ empleadoId, fechaIngreso, sueldoMensual, diasCorresponden, diasDisponibles, diasDisponiblesAnticipado, initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipo, setTipo] = useState<"Solicitud" | "Adelanto">("Solicitud");
  const [estatus, setEstatus] = useState<"Pendiente" | "Aprobada" | "Rechazada">("Pendiente");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setFechaInicio(initial.fecha_inicio.slice(0, 10));
      setFechaFin(initial.fecha_fin.slice(0, 10));
      setTipo(initial.tipo ?? "Solicitud");
      setEstatus(initial.estatus);
    }
  }, [initial]);

  const dias = fechaInicio && fechaFin && fechaFin >= fechaInicio
    ? calcularDias(fechaInicio, fechaFin)
    : 0;

  const sueldoDiario = sueldoMensual / 30;
  const prima = dias > 0 ? sueldoDiario * dias * 0.25 : 0;
  const tipoPrima = dias >= diasCorresponden ? "Completa" : "Parcial";
  const periodo = fechaInicio
    ? clasificarPeriodoVacacion(fechaIngreso, fechaInicio)
    : null;

  // En edición, los días del registro actual se "liberan", así que se suman al disponible
  const diasEditando = isEdit && initial && (initial.estatus === "Aprobada" || initial.estatus === "Pendiente")
    ? initial.dias
    : 0;
  const disponibleEfectivo = diasDisponibles + diasEditando;
  const disponibleEfectivoAnticipado = diasDisponiblesAnticipado + diasEditando;
  // Para anticipadas se valida contra el próximo periodo; para en-periodo, contra el actual
  const limiteEfectivo = periodo === "Anticipada" ? disponibleEfectivoAnticipado : disponibleEfectivo;
  const excedeDias = estatus !== "Rechazada" && dias > 0 && dias > limiteEfectivo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) { setError("Las fechas son obligatorias."); return; }
    if (fechaFin < fechaInicio) { setError("La fecha fin debe ser igual o posterior a la fecha inicio."); return; }
    setSaving(true);
    setError("");
    try {
      const primaGuardar = estatus === "Rechazada" ? null : prima;
      const payload = isEdit
        ? ({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, dias, tipo, estatus, prima_vacacional: primaGuardar } as UpdateVacacionPayload)
        : ({ empleado_id: empleadoId, fecha_inicio: fechaInicio, fecha_fin: fechaFin, dias, tipo, estatus, prima_vacacional: primaGuardar } as CreateVacacionPayload);
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
      title={isEdit ? "Editar vacación" : "Registrar vacación"}
      maxWidthClassName="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Fecha inicio <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={INPUT}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <label className={LABEL}>Fecha fin <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={INPUT}
              value={fechaFin}
              min={fechaInicio}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          {/* Días calculados */}
          <div>
            <label className={LABEL}>Días</label>
            <div className={[
              "flex h-[42px] items-center rounded-xl border px-3.5 text-sm font-semibold",
              excedeDias
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-slate-200 bg-slate-100 text-[#312C85]",
            ].join(" ")}>
              {dias > 0 ? `${dias} día${dias !== 1 ? "s" : ""}` : "—"}
            </div>
            {excedeDias && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {periodo === "Anticipada"
                  ? `Anticipo limitado a ${limiteEfectivo} día${limiteEfectivo !== 1 ? "s" : ""} (próximo periodo).`
                  : `Solo hay ${limiteEfectivo} día${limiteEfectivo !== 1 ? "s" : ""} disponible${limiteEfectivo !== 1 ? "s" : ""}.`}
              </p>
            )}
          </div>

          {/* Periodo */}
          <div>
            <label className={LABEL}>Periodo</label>
            <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-100 px-3.5">
              {periodo ? (
                <span className={[
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  periodo === "Anticipada" ? "bg-orange-100 text-orange-700" : "bg-teal-100 text-teal-700",
                ].join(" ")}>
                  {periodo === "Anticipada" ? "Anticipada" : "En periodo"}
                </span>
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </div>
          </div>

          <div>
            <label className={LABEL}>Tipo de solicitud</label>
            <select
              className={INPUT}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as typeof tipo)}
            >
              <option value="Solicitud">Solicitud</option>
              <option value="Adelanto">Adelanto</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>Estatus</label>
            <select
              className={INPUT}
              value={estatus}
              onChange={(e) => setEstatus(e.target.value as typeof estatus)}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
            </select>
          </div>

          {/* Prima vacacional */}
          <div>
            <label className={LABEL}>Prima vacacional</label>
            <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-sm font-semibold text-emerald-700">
              {dias > 0
                ? prima.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                : "—"}
            </div>
          </div>
        </div>

        {/* Resumen prima */}
        {dias > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Cálculo: </span>
            ${sueldoDiario.toFixed(2)} /día × {dias} días × 25% ={" "}
            <span className="font-bold text-emerald-700">
              {prima.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
            </span>
            <span className={[
              "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
              tipoPrima === "Completa" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
            ].join(" ")}>
              {tipoPrima}
            </span>
          </div>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving || dias === 0 || excedeDias} className="rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
