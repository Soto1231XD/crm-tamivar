import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { setCalificacion, getRegistrosAsesor, type AdvisorScoreRow, type RegistroVisita } from "../services/evaluacion.api";
import { MONTHS, fullName, API_URL, META_PUBLICACIONES, MIN_VISITAS, MAX_VISITAS } from "../utils/evaluacion.helpers";
import { FilterCard, FilterSelect } from "@/components/ui/AppFilters";
import { AppModal } from "@/components/ui/AppModal";
import { getStatusStyles } from "@/shared/ui/statusStyles";

export function ScoreboardTab({
  rows,
  loading,
  mes,
  anio,
  onMesChange,
  onAnioChange,
  canSeeAll,
  canGestionar,
  onGradeSet,
}: {
  rows: AdvisorScoreRow[];
  loading: boolean;
  mes: number;
  anio: number;
  onMesChange: (m: number) => void;
  onAnioChange: (a: number) => void;
  canSeeAll: boolean;
  canGestionar: boolean;
  onGradeSet: (userId: number, cal: number | null) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  const [detalleRow, setDetalleRow] = useState<AdvisorScoreRow | null>(null);
  const [detalleMes, setDetalleMes] = useState(mes);
  const [detalleAnio, setDetalleAnio] = useState(anio);
  const [registros, setRegistros] = useState<RegistroVisita[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);

  useEffect(() => {
    if (!detalleRow) return;
    setLoadingRegistros(true);
    getRegistrosAsesor(detalleRow.usuario.id, detalleMes, detalleAnio)
      .then(setRegistros)
      .catch(() => toast.error("Error al cargar registros."))
      .finally(() => setLoadingRegistros(false));
  }, [detalleRow, detalleMes, detalleAnio]);

  const openDetalle = (row: AdvisorScoreRow) => {
    setDetalleRow(row);
    setDetalleMes(mes);
    setDetalleAnio(anio);
  };

  const startEdit = (userId: number, current: number | null) => {
    setEditingId(userId);
    setEditVal(current !== null ? String(current) : "");
  };

  const commitEdit = async (userId: number) => {
    const num = parseFloat(editVal);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      try {
        await setCalificacion(userId, mes, anio, num);
        onGradeSet(userId, num);
        toast.success("Calificación guardada.");
      } catch {
        toast.error("Error al guardar calificación.");
      }
    }
    setEditingId(null);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  const filterPanel = (
    <FilterCard title="Período">
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <FilterSelect value={mes} onChange={(e) => onMesChange(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </FilterSelect>
        </div>
        <div className="w-28">
          <FilterSelect value={anio} onChange={(e) => onAnioChange(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </FilterSelect>
        </div>
      </div>
    </FilterCard>
  );

  const spinnerEl = (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[var(--crm-primary)]" />
    </div>
  );

  // ── Vista asesor: cards de métricas propias ──────────────────────────────
  if (!canSeeAll) {
    const row = rows[0];
    return (
      <div className="space-y-4">
        {filterPanel}
        {loading ? spinnerEl : !row ? (
          <p className="py-10 text-center text-sm text-[var(--crm-text-soft)]">No hay datos para este período.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--crm-text-soft)]">Visitas</p>
              <p className={`mt-2 text-3xl font-bold ${
                row.visitas < MIN_VISITAS ? "text-red-500" :
                row.visitas <= MAX_VISITAS ? "text-green-600" :
                "text-amber-500"
              }`}>{row.visitas}</p>
              <p className="mt-1 text-xs text-[var(--crm-text-soft)]">mín. {MIN_VISITAS} · máx. {MAX_VISITAS}</p>
            </div>
            {[
              { label: "Cierres",      value: String(row.cierres),       color: "text-green-600" },
              { label: "Apartados",    value: String(row.apartados),     color: "text-amber-500" },
              { label: "Juntas asistidas", value: `${row.juntas_asistidas}/${row.juntas_totales}`, color: "" },
              ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--crm-text-soft)]">{label}</p>
                <p className={`mt-2 text-3xl font-bold ${color || "text-[var(--crm-text)]"}`}>{value}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--crm-text-soft)]">Publicaciones</p>
              <p className={`mt-2 text-3xl font-bold ${
                row.publicaciones >= META_PUBLICACIONES ? "text-green-600" :
                row.publicaciones >= Math.floor(META_PUBLICACIONES * 0.6) ? "text-amber-500" :
                "text-[var(--crm-text)]"
              }`}>
                {row.publicaciones}
                <span className="text-sm font-normal text-[var(--crm-text-soft)]">/{META_PUBLICACIONES}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--crm-text-soft)]">Calificación</p>
              {row.calificacion_promedio !== null ? (
                <p className={`mt-2 text-3xl font-bold ${
                  row.calificacion_promedio >= 7 ? "text-green-600" :
                  row.calificacion_promedio >= 5 ? "text-amber-500" : "text-red-500"
                }`}>
                  {row.calificacion_promedio.toFixed(1)}
                  <span className="text-sm font-normal text-[var(--crm-text-soft)]">/10</span>
                </p>
              ) : (
                <p className="mt-2 text-3xl font-bold text-[var(--crm-text-soft)]">—</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Vista coordinador/admin: tabla completa ──────────────────────────────
  return (
    <div className="space-y-4">
      {filterPanel}
      {loading ? spinnerEl : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[var(--crm-border)] bg-[var(--crm-surface-soft)]">
              <tr>
                <th className="px-4 py-3 font-semibold text-[var(--crm-text)]">Asesor</th>
                <th className="px-3 py-3 text-center font-semibold text-[var(--crm-text)]">Visitas</th>
                <th className="px-3 py-3 text-center font-semibold text-[var(--crm-text)]">Cierres</th>
                <th className="px-3 py-3 text-center font-semibold text-[var(--crm-text)]">Apartados</th>
                <th className="px-3 py-3 text-center font-semibold text-[var(--crm-text)]">Juntas</th>
                <th className="px-3 py-3 text-center font-semibold text-[var(--crm-text)]">Publicaciones</th>
                <th className="px-3 py-3 text-center font-semibold text-[var(--crm-text)]">Calificación</th>
                <th className="px-3 py-3 text-center font-semibold text-[var(--crm-text)]">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--crm-border)]">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-[var(--crm-text-soft)]">
                    No hay datos para este período.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.usuario.id} className="hover:bg-[var(--crm-surface-soft)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {row.usuario.foto_url ? (
                        <img
                          src={`${API_URL}/${row.usuario.foto_url}`}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[var(--crm-primary-soft)] flex items-center justify-center text-xs font-bold text-[var(--crm-primary)]">
                          {row.usuario.nombres.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-[var(--crm-text)]">
                        {fullName(row.usuario)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-sm font-semibold ${
                      row.visitas < MIN_VISITAS ? "text-red-500" :
                      row.visitas <= MAX_VISITAS ? "text-green-600" :
                      "text-amber-500"
                    }`}>
                      {row.visitas}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {row.cierres}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {row.apartados}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-[var(--crm-text)]">
                    {row.juntas_asistidas}/{row.juntas_totales}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-sm font-semibold ${
                      row.publicaciones >= META_PUBLICACIONES ? "text-green-600" :
                      row.publicaciones >= Math.floor(META_PUBLICACIONES * 0.6) ? "text-amber-500" :
                      "text-[var(--crm-text)]"
                    }`}>
                      {row.publicaciones}/{META_PUBLICACIONES}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {canGestionar && editingId === row.usuario.id ? (
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={editVal}
                        autoFocus
                        onChange={(e) => setEditVal(e.target.value)}
                        onBlur={() => commitEdit(row.usuario.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(row.usuario.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-16 rounded-lg border border-[var(--crm-primary)] bg-[var(--crm-surface)] px-2 py-0.5 text-center text-sm outline-none"
                      />
                    ) : canGestionar ? (
                      <button
                        type="button"
                        onClick={() => startEdit(row.usuario.id, row.calificacion_promedio)}
                        className="group inline-flex items-center gap-1"
                        title="Clic para editar calificación"
                      >
                        {row.calificacion_promedio !== null ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.calificacion_promedio >= 7
                              ? "bg-green-50 text-green-700"
                              : row.calificacion_promedio >= 5
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}>
                            {row.calificacion_promedio.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--crm-text-soft)]">—</span>
                        )}
                        <span className="text-[10px] text-[var(--crm-text-soft)] opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                      </button>
                    ) : row.calificacion_promedio !== null ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.calificacion_promedio >= 7
                          ? "bg-green-50 text-green-700"
                          : row.calificacion_promedio >= 5
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {row.calificacion_promedio.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--crm-text-soft)]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => openDetalle(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--crm-border)] px-2.5 py-1 text-xs font-medium text-[var(--crm-text-soft)] hover:border-[var(--crm-primary)] hover:text-[var(--crm-primary)] transition-colors"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalle de registros */}
      <AppModal
        isOpen={!!detalleRow}
        onClose={() => setDetalleRow(null)}
        title={detalleRow ? `Registros de ${fullName(detalleRow.usuario)}` : ""}
      >
        {detalleRow && (
          <div className="space-y-4">
            {/* Selector de mes/año */}
            <div className="flex flex-wrap gap-2">
              <select
                value={detalleMes}
                onChange={(e) => setDetalleMes(Number(e.target.value))}
                className="rounded-lg border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-1.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)]"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={detalleAnio}
                onChange={(e) => setDetalleAnio(Number(e.target.value))}
                className="rounded-lg border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-1.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)]"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Contenido */}
            {loadingRegistros ? (
              <div className="flex justify-center py-8">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-[var(--crm-primary)]" />
              </div>
            ) : registros.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--crm-text-soft)]">
                Sin registros de visitas en este período.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--crm-border)]">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-[var(--crm-border)] bg-[var(--crm-surface-soft)]">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold text-[var(--crm-text)]">Cliente</th>
                      <th className="px-3 py-2.5 font-semibold text-[var(--crm-text)]">Estado</th>
                      <th className="px-3 py-2.5 font-semibold text-[var(--crm-text)]">Propiedad / Desarrollo</th>
                      <th className="px-3 py-2.5 font-semibold text-[var(--crm-text)]">Fecha cita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--crm-border)]">
                    {registros.map((r) => {
                      const badge = getStatusStyles(r.estado);
                      const referencia = r.propiedad?.titulo ?? r.desarrollo?.titulo ?? "—";
                      const fechaCita = r.fecha_cita
                        ? new Date(r.fecha_cita).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                        : "—";
                      return (
                        <tr key={r.id} className="hover:bg-[var(--crm-surface-soft)] transition-colors">
                          <td className="px-3 py-2.5 font-medium text-[var(--crm-text)]">
                            {r.nombres} {r.apellidos}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{ backgroundColor: badge.backgroundColor, color: badge.color }}
                            >
                              {r.estado}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--crm-text-soft)]">{referencia}</td>
                          <td className="px-3 py-2.5 text-[var(--crm-text-soft)]">{fechaCita}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </AppModal>
    </div>
  );
}
