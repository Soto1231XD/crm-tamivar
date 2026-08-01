import { useState } from "react";
import toast from "react-hot-toast";
import {
  createJunta,
  deleteJunta,
  updateAsistencia,
  type JuntaConAsistencia,
} from "../services/evaluacion.api";
import { fmtDate, fullName, API_URL } from "../utils/evaluacion.helpers";
import { AppModal } from "@/components/ui/AppModal";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export function JuntasTab({
  juntas,
  canGestionar,
  currentUserId,
  onCreated,
  onDeleted,
  onAsistenciaUpdated,
}: {
  juntas: JuntaConAsistencia[];
  canGestionar: boolean;
  currentUserId: number;
  onCreated: (j: JuntaConAsistencia) => void;
  onDeleted: (id: number) => void;
  onAsistenciaUpdated: (j: JuntaConAsistencia) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo: "", descripcion: "", fecha: "", tipo: "presencial" });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [marcandoTodos, setMarcandoTodos] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!form.titulo || !form.fecha) {
      toast.error("Título y fecha son requeridos.");
      return;
    }
    setSaving(true);
    try {
      const junta = await createJunta({
        titulo: form.titulo,
        descripcion: form.descripcion || undefined,
        fecha: form.fecha,
        tipo: form.tipo,
      });
      onCreated(junta);
      setShowModal(false);
      setForm({ titulo: "", descripcion: "", fecha: "", tipo: "presencial" });
      toast.success("Junta creada.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear junta.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number): Promise<string | null> => {
    try {
      await deleteJunta(id);
      onDeleted(id);
      toast.success("Junta eliminada.");
      return null;
    } catch (e: unknown) {
      return e instanceof Error ? e.message : "Error al eliminar junta.";
    }
  };

  const togglePresente = async (junta: JuntaConAsistencia, usuarioId: number, presente: boolean) => {
    try {
      const updated = await updateAsistencia(junta.id, [{ usuario_id: usuarioId, presente }]);
      onAsistenciaUpdated(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar asistencia.");
    }
  };

  const marcarTodosPresentes = async (junta: JuntaConAsistencia) => {
    setMarcandoTodos(true);
    try {
      const updated = await updateAsistencia(
        junta.id,
        junta.asistencias.map((a) => ({ usuario_id: a.usuario_id, presente: true })),
      );
      onAsistenciaUpdated(updated);
      toast.success("Todos marcados como presentes.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar asistencias.");
    } finally {
      setMarcandoTodos(false);
    }
  };

  const marcarTodosAusentes = async (junta: JuntaConAsistencia) => {
    setMarcandoTodos(true);
    try {
      const updated = await updateAsistencia(
        junta.id,
        junta.asistencias.map((a) => ({ usuario_id: a.usuario_id, presente: false })),
      );
      onAsistenciaUpdated(updated);
      toast.success("Todos marcados como ausentes.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar asistencias.");
    } finally {
      setMarcandoTodos(false);
    }
  };

  const handleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setBusqueda("");
  };

  return (
    <div className="space-y-3">
      {canGestionar && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-[var(--crm-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity"
          >
            + Nueva junta
          </button>
        </div>
      )}

      {juntas.length === 0 && (
        <p className="py-10 text-center text-sm text-[var(--crm-text-soft)]">Sin juntas registradas.</p>
      )}

      {juntas.map((junta) => {
        const miAsistencia = !canGestionar
          ? junta.asistencias.find((a) => a.usuario_id === currentUserId)
          : null;

        return (
          <div key={junta.id} className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--crm-surface-soft)]"
              onClick={() => handleExpand(junta.id)}
            >
              <div>
                <p className="font-semibold text-[var(--crm-text)]">{junta.titulo}</p>
                <p className="text-xs text-[var(--crm-text-soft)]">
                  {fmtDate(junta.fecha)} · {junta.tipo}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {canGestionar ? (
                  <>
                    <span className="text-xs text-[var(--crm-text-soft)]">
                      {junta.asistencias.filter((a) => a.presente).length}/{junta.asistencias.length} presentes
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPendingDeleteId(junta.id); }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </>
                ) : miAsistencia ? (
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                    miAsistencia.presente
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-500"
                  }`}>
                    {miAsistencia.presente ? "Asistí" : "No asistí"}
                  </span>
                ) : null}
                <span className="text-[var(--crm-text-soft)]">{expandedId === junta.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {expandedId === junta.id && (
              <div className="border-t border-[var(--crm-border)]">
                {canGestionar && (
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--crm-border)] bg-[var(--crm-surface-soft)]">
                    <input
                      type="text"
                      placeholder="Buscar asesor..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="flex-1 rounded-lg border border-[var(--crm-border-strong)] bg-[var(--crm-surface)] px-3 py-1.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)] placeholder:text-[var(--crm-text-soft)]"
                    />
                    <button
                      type="button"
                      disabled={marcandoTodos}
                      onClick={() => marcarTodosPresentes(junta)}
                      className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {marcandoTodos ? "Guardando..." : "✓ Todos presentes"}
                    </button>
                    <button
                      type="button"
                      disabled={marcandoTodos}
                      onClick={() => marcarTodosAusentes(junta)}
                      className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {marcandoTodos ? "Guardando..." : "✗ Todos ausentes"}
                    </button>
                  </div>
                )}
                <div className="divide-y divide-[var(--crm-border)]">
                {junta.asistencias
                  .filter((a) =>
                    !busqueda.trim() ||
                    fullName(a.usuario).toLowerCase().includes(busqueda.trim().toLowerCase()),
                  )
                  .map((a) => (
                  <div key={a.usuario_id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {a.usuario.foto_url ? (
                        <img src={`${API_URL}/${a.usuario.foto_url}`} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-[var(--crm-primary-soft)] flex items-center justify-center text-xs font-bold text-[var(--crm-primary)]">
                          {a.usuario.nombres.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm text-[var(--crm-text)]">
                        {fullName(a.usuario)}
                      </span>
                    </div>
                    {canGestionar ? (
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`asistencia-${junta.id}-${a.usuario_id}`}
                            checked={a.presente === true}
                            onChange={() => togglePresente(junta, a.usuario_id, true)}
                            className="accent-[var(--crm-primary)]"
                          />
                          <span className="text-xs font-medium text-green-600">Asistió</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`asistencia-${junta.id}-${a.usuario_id}`}
                            checked={a.presente === false}
                            onChange={() => togglePresente(junta, a.usuario_id, false)}
                            className="accent-red-500"
                          />
                          <span className="text-xs font-medium text-red-500">No asistió</span>
                        </label>
                      </div>
                    ) : (
                      <span className={`text-xs font-medium ${a.presente === true ? "text-green-600" : a.presente === false ? "text-red-400" : "text-[var(--crm-text-soft)]"}`}>
                        {a.presente === true ? "Presente" : a.presente === false ? "Ausente" : "—"}
                      </span>
                    )}
                  </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <DeleteConfirmModal
        isOpen={pendingDeleteId !== null}
        entityId={pendingDeleteId}
        entityLabel={juntas.find((j) => j.id === pendingDeleteId)?.titulo ?? ""}
        title="Eliminar junta"
        subtitle="Esta acción es permanente"
        descriptionPrefix="¿Estás seguro que deseas eliminar la junta"
        fallbackLabel="esta junta"
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
      />

      <AppModal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva junta">
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--crm-text-soft)]">Título *</span>
            <input
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--crm-text-soft)]">Fecha *</span>
            <input
              type="datetime-local"
              value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
              className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--crm-text-soft)]">Tipo</span>
            <select
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]"
            >
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--crm-text-soft)]">Descripción</span>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)] resize-none"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-xl border border-[var(--crm-border)] px-4 py-2 text-sm text-[var(--crm-text-soft)] hover:bg-[var(--crm-surface-soft)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="rounded-xl bg-[var(--crm-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-80 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Crear"}
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
