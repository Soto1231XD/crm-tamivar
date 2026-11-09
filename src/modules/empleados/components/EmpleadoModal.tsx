import { useEffect, useRef, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { Empleado, CreateEmpleadoPayload, UpdateEmpleadoPayload } from "../services/empleados.api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

type Form = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  area: string;
  puesto: string;
  fecha_ingreso: string;
  sueldo: string;
  telefono: string;
  correo: string;
  curp: string;
  rfc: string;
  genero: string;
  nss: string;
  direccion: string;
  tipo_sangre: string;
  contacto_emergencia_nombre: string;
  contacto_emergencia_telefono: string;
  estatus: "Activo" | "Baja";
};

const EMPTY: Form = {
  nombre: "", apellido_paterno: "", apellido_materno: "",
  area: "", puesto: "", fecha_ingreso: "", sueldo: "",
  telefono: "", correo: "", curp: "", rfc: "",
  genero: "", nss: "", direccion: "",
  tipo_sangre: "", contacto_emergencia_nombre: "", contacto_emergencia_telefono: "",
  estatus: "Activo",
};

interface Props {
  initial?: Empleado | null;
  onSave: (data: CreateEmpleadoPayload | UpdateEmpleadoPayload, fotoFile?: File) => Promise<void>;
  onClose: () => void;
}

export function EmpleadoModal({ initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<Form>(EMPTY);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        nombre: initial.nombre,
        apellido_paterno: initial.apellido_paterno,
        apellido_materno: initial.apellido_materno ?? "",
        area: initial.area,
        puesto: initial.puesto,
        fecha_ingreso: initial.fecha_ingreso.split("T")[0],
        sueldo: initial.sueldo,
        telefono: initial.telefono ?? "",
        correo: initial.correo ?? "",
        curp: initial.curp ?? "",
        rfc: initial.rfc ?? "",
        genero: initial.genero ?? "",
        nss: initial.nss ?? "",
        direccion: initial.direccion ?? "",
        tipo_sangre: initial.tipo_sangre ?? "",
        contacto_emergencia_nombre: initial.contacto_emergencia_nombre ?? "",
        contacto_emergencia_telefono: initial.contacto_emergencia_telefono ?? "",
        estatus: initial.estatus,
      });
      setFotoPreview(initial.foto_url ? (initial.foto_url.startsWith("/uploads") ? `${API_BASE}${initial.foto_url}` : initial.foto_url) : null);
    } else {
      setForm(EMPTY);
      setFotoFile(null);
      setFotoPreview(null);
    }
  }, [initial]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.apellido_paterno.trim()) { setError("El apellido paterno es obligatorio."); return; }
    if (!form.area.trim()) { setError("El área es obligatoria."); return; }
    if (!form.puesto.trim()) { setError("El puesto es obligatorio."); return; }
    if (!form.fecha_ingreso) { setError("La fecha de ingreso es obligatoria."); return; }
    const sueldo = parseFloat(form.sueldo);
    if (isNaN(sueldo) || sueldo <= 0) { setError("El sueldo debe ser un número positivo."); return; }

    setSaving(true);
    setError("");
    try {
      const payload: CreateEmpleadoPayload | UpdateEmpleadoPayload = {
        nombre: form.nombre.trim(),
        apellido_paterno: form.apellido_paterno.trim(),
        apellido_materno: form.apellido_materno.trim(),
        area: form.area.trim(),
        puesto: form.puesto.trim(),
        fecha_ingreso: form.fecha_ingreso,
        sueldo,
        ...(form.telefono.trim() && { telefono: form.telefono.trim() }),
        ...(form.correo.trim() && { correo: form.correo.trim() }),
        ...(form.curp.trim() && { curp: form.curp.trim().toUpperCase() }),
        ...(form.rfc.trim() && { rfc: form.rfc.trim().toUpperCase() }),
        ...(form.genero && { genero: form.genero }),
        ...(form.nss.trim() && { nss: form.nss.trim() }),
        ...(form.direccion.trim() && { direccion: form.direccion.trim() }),
        ...(form.tipo_sangre && { tipo_sangre: form.tipo_sangre }),
        ...(form.contacto_emergencia_nombre.trim() && { contacto_emergencia_nombre: form.contacto_emergencia_nombre.trim() }),
        ...(form.contacto_emergencia_telefono.trim() && { contacto_emergencia_telefono: form.contacto_emergencia_telefono.trim() }),
        ...(isEdit && { estatus: form.estatus }),
      };
      await onSave(payload, fotoFile ?? undefined);
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
      title={isEdit ? "Editar empleado" : "Alta de empleado"}
      subtitle="Captura los datos del empleado."
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[90vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Foto */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div
            className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 transition hover:border-[#312C85]"
            onClick={() => fileRef.current?.click()}
          >
            {fotoPreview ? (
              <img src={fotoPreview} alt="Foto" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4a4 4 0 100 8 4 4 0 000-8zM6 20v-1a6 6 0 1112 0v1" />
                </svg>
                <span className="text-[10px] font-semibold">Foto</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Foto del empleado</p>
            <p className="text-xs text-slate-400 mt-0.5">JPG, PNG o WEBP · máx. 25 MB</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              {fotoPreview ? "Cambiar foto" : "Subir foto"}
            </button>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFotoChange} />
          </div>
        </div>

        {/* Datos personales */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Datos personales</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
              <input type="text" className={INPUT} value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)} placeholder="Nombre(s)" />
            </div>
            <div>
              <label className={LABEL}>Apellido paterno <span className="text-red-500">*</span></label>
              <input type="text" className={INPUT} value={form.apellido_paterno}
                onChange={(e) => set("apellido_paterno", e.target.value)} placeholder="Apellido paterno" />
            </div>
            <div>
              <label className={LABEL}>Apellido materno</label>
              <input type="text" className={INPUT} value={form.apellido_materno}
                onChange={(e) => set("apellido_materno", e.target.value)} placeholder="Apellido materno" />
            </div>
            <div>
              <label className={LABEL}>Género</label>
              <select className={INPUT} value={form.genero} onChange={(e) => set("genero", e.target.value)}>
                <option value="">— Sin especificar —</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>CURP</label>
              <input type="text" className={INPUT} value={form.curp}
                onChange={(e) => set("curp", e.target.value.toUpperCase())} placeholder="CURP a 18 caracteres"
                maxLength={18} />
            </div>
            <div>
              <label className={LABEL}>RFC</label>
              <input type="text" className={INPUT} value={form.rfc}
                onChange={(e) => set("rfc", e.target.value.toUpperCase())} placeholder="RFC con homoclave"
                maxLength={13} />
            </div>
            <div>
              <label className={LABEL}>N.S.S</label>
              <input type="text" className={INPUT} value={form.nss}
                onChange={(e) => set("nss", e.target.value)} placeholder="Número de Seguro Social"
                maxLength={11} />
            </div>
            <div>
              <label className={LABEL}>Tipo de sangre</label>
              <select className={INPUT} value={form.tipo_sangre} onChange={(e) => set("tipo_sangre", e.target.value)}>
                <option value="">— Sin especificar —</option>
                <option>O+</option>
                <option>O-</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Teléfono</label>
              <input type="text" className={INPUT} value={form.telefono}
                onChange={(e) => set("telefono", e.target.value)} placeholder="998 000 0000" />
            </div>
            <div>
              <label className={LABEL}>Correo electrónico</label>
              <input type="email" className={INPUT} value={form.correo}
                onChange={(e) => set("correo", e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Dirección</label>
              <input type="text" className={INPUT} value={form.direccion}
                onChange={(e) => set("direccion", e.target.value)} placeholder="Calle, número, colonia, ciudad" />
            </div>
          </div>
        </div>

        {/* Datos laborales */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Datos laborales</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Área <span className="text-red-500">*</span></label>
              <input type="text" className={INPUT} value={form.area}
                onChange={(e) => set("area", e.target.value)} placeholder="Ej. Ventas, Administración" />
            </div>
            <div>
              <label className={LABEL}>Puesto <span className="text-red-500">*</span></label>
              <input type="text" className={INPUT} value={form.puesto}
                onChange={(e) => set("puesto", e.target.value)} placeholder="Ej. Asesor de ventas" />
            </div>
            <div>
              <label className={LABEL}>Fecha de ingreso <span className="text-red-500">*</span></label>
              <input type="date" className={INPUT} value={form.fecha_ingreso}
                onChange={(e) => set("fecha_ingreso", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Sueldo (MXN) <span className="text-red-500">*</span></label>
              <input type="number" min="0" step="0.01" className={INPUT} value={form.sueldo}
                onChange={(e) => set("sueldo", e.target.value)} placeholder="0.00" />
            </div>
            {isEdit && (
              <div>
                <label className={LABEL}>Estatus</label>
                <select className={INPUT} value={form.estatus}
                  onChange={(e) => set("estatus", e.target.value as "Activo" | "Baja")}>
                  <option value="Activo">Activo</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Contacto de emergencia */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Contacto de emergencia</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Nombre del contacto</label>
              <input type="text" className={INPUT} value={form.contacto_emergencia_nombre}
                onChange={(e) => set("contacto_emergencia_nombre", e.target.value)}
                placeholder="Nombre completo" />
            </div>
            <div>
              <label className={LABEL}>Teléfono del contacto</label>
              <input type="text" className={INPUT} value={form.contacto_emergencia_telefono}
                onChange={(e) => set("contacto_emergencia_telefono", e.target.value)}
                placeholder="998 000 0000" />
            </div>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar empleado"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
