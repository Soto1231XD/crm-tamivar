import agregarIcon from "@/assets/images/Agregar.png";
import type { Empleado } from "../../services/empleados.api";
import type { Baja } from "../../services/bajas.api";
import type { HistorialIngreso } from "../../services/historial-ingreso.api";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

type TimelineItem =
  | { kind: "ingreso"; fecha: string; item: HistorialIngreso }
  | { kind: "baja";    fecha: string; item: Baja };

interface Props {
  historialIngresos: HistorialIngreso[];
  bajas: Baja[];
  loadingHistorial: boolean;
  loadingBajas: boolean;
  empleado: Empleado;
  canEdit: boolean;
  onAddBaja: () => void;
  onEditBaja: (b: Baja) => void;
  onDeleteBaja: (b: Baja) => void;
  onReactivar: () => void;
}

export function HistorialTab({ historialIngresos, bajas, loadingHistorial, loadingBajas, empleado, canEdit, onAddBaja, onEditBaja, onDeleteBaja, onReactivar }: Props) {
  const timeline: TimelineItem[] = [
    ...historialIngresos.map((h) => ({ kind: "ingreso" as const, fecha: h.fecha, item: h })),
    ...bajas.map((b) => ({ kind: "baja" as const, fecha: b.fecha_baja, item: b })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--crm-text-muted)]">
          {timeline.length} {timeline.length === 1 ? "evento registrado" : "eventos registrados"}
        </p>
        <div className="flex items-center gap-2">
          {canEdit && empleado.estatus === "Baja" && (
            <button
              type="button"
              onClick={onReactivar}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Reactivar empleado
            </button>
          )}
          {canEdit && empleado.estatus === "Activo" && (
            <button
              type="button"
              onClick={onAddBaja}
              className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
            >
              <img src={agregarIcon} alt="" className="h-4 w-4" />
              Registrar baja
            </button>
          )}
        </div>
      </div>

      {(loadingHistorial || loadingBajas) ? (
        <p className="text-sm text-[var(--crm-text-muted)]">Cargando historial...</p>
      ) : timeline.length === 0 ? (
        <p className="text-sm text-[var(--crm-text-muted)]">Sin eventos registrados.</p>
      ) : (
        <ol className="relative border-l border-[var(--crm-border)] ml-3">
          {timeline.map((entry, i) => {
            if (entry.kind === "ingreso") {
              const h = entry.item as HistorialIngreso;
              return (
                <li key={`ingreso-${h.id}-${i}`} className="mb-6 ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-white dark:ring-gray-900">
                    <svg className="h-3 w-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-emerald-800">{h.tipo}</span>
                      <time className="text-xs text-emerald-600">{formatDate(h.fecha)}</time>
                    </div>
                    {h.descripcion && <p className="mt-1 text-xs text-emerald-700">{h.descripcion}</p>}
                  </div>
                </li>
              );
            } else {
              const b = entry.item as Baja;
              return (
                <li key={`baja-${b.id}-${i}`} className="mb-6 ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 ring-4 ring-white dark:ring-gray-900">
                    <svg className="h-3 w-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-800">Baja</span>
                        <span className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          b.tipo === "Renuncia" ? "bg-amber-100 text-amber-700" :
                          b.tipo === "Despido"  ? "bg-red-100 text-red-700"     :
                                                  "bg-slate-100 text-slate-600",
                        ].join(" ")}>
                          {b.tipo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <time className="text-xs text-red-600">{formatDate(b.fecha_baja)}</time>
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditBaja(b)}
                              className="rounded p-1 text-slate-400 hover:text-slate-600"
                              title="Editar"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteBaja(b)}
                              className="rounded p-1 text-slate-400 hover:text-red-500"
                              title="Eliminar"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {b.descripcion && <p className="mt-1 text-xs text-red-700">{b.descripcion}</p>}
                  </div>
                </li>
              );
            }
          })}
        </ol>
      )}
    </div>
  );
}
