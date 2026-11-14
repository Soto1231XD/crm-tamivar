import { useState } from "react";
import type { AdelantoEmpleado, CreateAdelantoPayload, UpdateAdelantoPayload } from "../services/adelantos.api";

interface Props {
  empleadoId: number;
  item?: AdelantoEmpleado;
  onSave: (data: CreateAdelantoPayload) => Promise<void>;
  onUpdate?: (id: number, data: UpdateAdelantoPayload) => Promise<void>;
  onClose: () => void;
}

const inputClass = "w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30";
const labelClass = "mb-1 block text-xs font-medium text-[var(--crm-text-muted)]";

export function AdelantoNominaModal({ empleadoId, item, onSave, onUpdate, onClose }: Props) {
  const isEdit = !!item;
  const [monto, setMonto] = useState(item ? String(parseFloat(item.monto)) : "");
  const [forma, setForma] = useState<"proxima" | "parcialidades" | "otro">(
    (item?.forma_descuento as "proxima" | "parcialidades" | "otro") ?? "proxima"
  );
  const [parcialidades, setParcialidades] = useState(item?.parcialidades ? String(item.parcialidades) : "");
  const [otro, setOtro] = useState(item?.otro_descripcion ?? "");
  const [saving, setSaving] = useState(false);

  const canGuardar =
    parseFloat(monto) > 0 &&
    (forma !== "parcialidades" || parseInt(parcialidades) > 0) &&
    (forma !== "otro" || otro.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit && item && onUpdate) {
        await onUpdate(item.id, {
          monto: parseFloat(monto),
          forma_descuento: forma,
          parcialidades: forma === "parcialidades" ? parseInt(parcialidades) : undefined,
          otro_descripcion: forma === "otro" ? otro.trim() : undefined,
        });
      } else {
        await onSave({
          empleado_id: empleadoId,
          monto: parseFloat(monto),
          forma_descuento: forma,
          parcialidades: forma === "parcialidades" ? parseInt(parcialidades) : undefined,
          otro_descripcion: forma === "otro" ? otro.trim() : undefined,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--crm-text)]">
            {isEdit ? "Editar adelanto" : "Solicitud de adelanto de nómina"}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--crm-text-muted)]">
            {isEdit ? "Modifica los datos del adelanto registrado" : "Se guarda en el historial y se genera el documento Word"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {/* Monto */}
          <div>
            <label className={labelClass}>Monto solicitado <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number" min="1" step="0.01" placeholder="0.00"
                value={monto} onChange={(e) => setMonto(e.target.value)}
                className={`${inputClass} pl-6`} required autoFocus
              />
            </div>
          </div>

          {/* Forma de descuento */}
          <div>
            <label className={labelClass}>Descontar vía nómina en <span className="text-red-500">*</span></label>
            <div className="mt-1 flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50 has-[:checked]:border-[#312C85] has-[:checked]:bg-[#312C85]/5">
                <input type="radio" name="forma" value="proxima" checked={forma === "proxima"} onChange={() => setForma("proxima")} className="accent-[#312C85]" />
                <span className="text-sm font-medium text-slate-700">La próxima nómina</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50 has-[:checked]:border-[#312C85] has-[:checked]:bg-[#312C85]/5">
                <input type="radio" name="forma" value="parcialidades" checked={forma === "parcialidades"} onChange={() => setForma("parcialidades")} className="accent-[#312C85]" />
                <span className="text-sm font-medium text-slate-700">En parcialidades iguales</span>
              </label>
              {forma === "parcialidades" && (
                <div className="ml-7 flex flex-col gap-2">
                  <div>
                    <label className={labelClass}>Número de parcialidades <span className="text-red-500">*</span></label>
                    <input type="number" min="2" max="24" placeholder="Ej. 3" value={parcialidades} onChange={(e) => setParcialidades(e.target.value)} className={inputClass} />
                  </div>
                  {parseFloat(monto) > 0 && parseInt(parcialidades) >= 2 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                      <p className="text-xs text-amber-700">
                        <span className="font-semibold">Descuento por nómina: </span>
                        {(parseFloat(monto) / parseInt(parcialidades)).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                        {" "}× {parcialidades} pagos
                      </p>
                    </div>
                  )}
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50 has-[:checked]:border-[#312C85] has-[:checked]:bg-[#312C85]/5">
                <input type="radio" name="forma" value="otro" checked={forma === "otro"} onChange={() => setForma("otro")} className="accent-[#312C85]" />
                <span className="text-sm font-medium text-slate-700">Otro</span>
              </label>
              {forma === "otro" && (
                <div className="ml-7">
                  <label className={labelClass}>Especificar <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Describe la forma de descuento..." value={otro} onChange={(e) => setOtro(e.target.value)} className={inputClass} />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--crm-text-muted)] hover:bg-[var(--crm-hover)]">
              Cancelar
            </button>
            <button type="submit" disabled={!canGuardar || saving}
              className="rounded-xl bg-[#312C85] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50">
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar y generar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
