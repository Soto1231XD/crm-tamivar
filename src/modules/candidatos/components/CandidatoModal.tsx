import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { Candidato, CreateCandidatoPayload, UpdateCandidatoPayload } from "../services/candidatos.api";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

type Form = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  tipo: "Empleado" | "Becario";
  puesto_solicitado: string;
  area: string;
  telefono: string;
  correo: string;
  fecha_entrevista: string;
  notas: string;
  estatus: "Pendiente" | "Entrevistado" | "Aprobado" | "Rechazado";
};

const EMPTY: Form = {
  nombre: "", apellido_paterno: "", apellido_materno: "",
  tipo: "Empleado", puesto_solicitado: "", area: "",
  telefono: "", correo: "", fecha_entrevista: "", notas: "",
  estatus: "Pendiente",
};

interface Props {
  initial?: Candidato | null;
  onSave: (data: CreateCandidatoPayload | UpdateCandidatoPayload) => Promise<void>;
  onClose: () => void;
}

export function CandidatoModal({ initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        nombre: initial.nombre,
        apellido_paterno: initial.apellido_paterno,
        apellido_materno: initial.apellido_materno ?? "",
        tipo: initial.tipo,
        puesto_solicitado: initial.puesto_solicitado,
        area: initial.area,
        telefono: initial.telefono ?? "",
        correo: initial.correo ?? "",
        fecha_entrevista: initial.fecha_entrevista ? initial.fecha_entrevista.slice(0, 10) : "",
        notas: initial.notas ?? "",
        estatus: initial.estatus,
      });
    } else {
      setForm(EMPTY);
    }
  }, [initial]);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.apellido_paterno.trim()) { setError("El apellido paterno es obligatorio."); return; }
    if (!form.puesto_solicitado.trim()) { setError("El puesto solicitado es obligatorio."); return; }
    if (!form.area.trim()) { setError("El área es obligatoria."); return; }

    setSaving(true);
    setError("");
    try {
      const payload: CreateCandidatoPayload = {
        nombre: form.nombre.trim(),
        apellido_paterno: form.apellido_paterno.trim(),
        apellido_materno: form.apellido_materno.trim() || undefined,
        tipo: form.tipo,
        puesto_solicitado: form.puesto_solicitado.trim(),
        area: form.area.trim(),
        telefono: form.telefono.trim() || undefined,
        correo: form.correo.trim() || undefined,
        fecha_entrevista: form.fecha_entrevista || undefined,
        notas: form.notas.trim() || undefined,
        estatus: form.estatus,
      };
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
      title={isEdit ? "Editar candidato" : "Registrar candidato"}
      maxWidthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Tipo */}
        <div>
          <label className={LABEL}>Tipo de candidato <span className="text-red-500">*</span></label>
          <div className="flex gap-3">
            {(["Empleado", "Becario"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("tipo", t)}
                className={[
                  "flex-1 rounded-xl border py-2.5 text-sm font-semibold transition",
                  form.tipo === t
                    ? "border-[#312C85] bg-[#312C85] text-white"
                    : "border-slate-300 bg-slate-50 text-slate-600 hover:border-[#312C85] hover:text-[#312C85]",
                ].join(" ")}
              >
                {t === "Becario" ? "Becario / Prácticas" : "Empleado"}
              </button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
            <input className={INPUT} value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre(s)" />
          </div>
          <div>
            <label className={LABEL}>Apellido paterno <span className="text-red-500">*</span></label>
            <input className={INPUT} value={form.apellido_paterno} onChange={e => set("apellido_paterno", e.target.value)} placeholder="Apellido paterno" />
          </div>
          <div>
            <label className={LABEL}>Apellido materno</label>
            <input className={INPUT} value={form.apellido_materno} onChange={e => set("apellido_materno", e.target.value)} placeholder="Apellido materno" />
          </div>
        </div>

        {/* Puesto / Área */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Puesto solicitado <span className="text-red-500">*</span></label>
            <input className={INPUT} value={form.puesto_solicitado} onChange={e => set("puesto_solicitado", e.target.value)} placeholder="Ej. Asesor de ventas" />
          </div>
          <div>
            <label className={LABEL}>Área / Departamento <span className="text-red-500">*</span></label>
            <input className={INPUT} value={form.area} onChange={e => set("area", e.target.value)} placeholder="Ej. Ventas" />
          </div>
        </div>

        {/* Contacto */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Teléfono</label>
            <input className={INPUT} type="tel" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="55 1234 5678" />
          </div>
          <div>
            <label className={LABEL}>Correo electrónico</label>
            <input className={INPUT} type="email" value={form.correo} onChange={e => set("correo", e.target.value)} placeholder="correo@ejemplo.com" />
          </div>
        </div>

        {/* Fecha entrevista + Estatus */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Fecha de entrevista</label>
            <input className={INPUT} type="date" value={form.fecha_entrevista} onChange={e => set("fecha_entrevista", e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Estatus</label>
            <select className={INPUT} value={form.estatus} onChange={e => set("estatus", e.target.value as Form["estatus"])}>
              <option value="Pendiente">Pendiente</option>
              <option value="Entrevistado">Entrevistado</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className={LABEL}>Notas / Observaciones</label>
          <textarea
            rows={3}
            className={`${INPUT} resize-none`}
            value={form.notas}
            onChange={e => set("notas", e.target.value)}
            placeholder="Impresiones de la entrevista, habilidades, etc."
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar candidato"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
