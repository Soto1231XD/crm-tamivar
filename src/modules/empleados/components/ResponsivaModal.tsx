import { useState, useEffect, useRef } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { processImageToWebP } from "@/shared/utils/imageProcessor";
import type { Empleado } from "../services/empleados.api";
import type {
  ResponsivaEmpleado, TipoResponsiva,
  DatosVehiculo, DatosMateriales, FilaMaterial,
  FilaHerramienta, DatosHerramientas,
} from "../services/responsivas.api";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const INPUT_SM =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-1 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

const USOS_OPCIONES = [
  "Plomería",
  "Electricidad",
  "Pintura",
  "Carpintería",
  "Jardinería",
  "Limpieza y mantenimiento general",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target!.result as string);
    reader.onerror = () => reject(new Error(`No se pudo leer "${file.name}"`));
    reader.readAsDataURL(file);
  });
}

const EMPTY_VEHICULO: DatosVehiculo = { marca: "", modelo: "", anio: "", color: "", placas: "", num_serie: "" };
const EMPTY_FILA: FilaMaterial = { herramienta: "", descripcion: "", uso: "" };
const EMPTY_HERRAMIENTA: FilaHerramienta = { herramienta: "", marca_modelo: "", num_serie: "", estado: "Nuevo", observaciones: "" };

interface Props {
  empleado: Empleado;
  item: ResponsivaEmpleado | null;
  onClose: () => void;
  onSave: (payload: { tipo: TipoResponsiva; fecha: string; datos: string }) => Promise<void>;
}

export function ResponsivaModal({ empleado, item, onClose, onSave }: Props) {
  const isEditing = !!item;
  const isMantenimiento = empleado.area.toLowerCase().includes("mantenimiento");

  const [tipo,  setTipo]  = useState<TipoResponsiva>(item?.tipo ?? "Vehículo");
  const [fecha, setFecha] = useState(todayISO());

  // Vehículo
  const [vehiculo, setVehiculo] = useState<DatosVehiculo>(EMPTY_VEHICULO);

  // Materiales
  const [filas,          setFilas]          = useState<FilaMaterial[]>([{ ...EMPTY_FILA }]);
  const [fechaDev,       setFechaDev]       = useState("");
  const [condiciones,    setCondiciones]    = useState("");
  const [fotos,          setFotos]          = useState<string[]>([]);

  // Herramientas
  const [filasH,       setFilasH]       = useState<FilaHerramienta[]>([{ ...EMPTY_HERRAMIENTA }]);
  const [lugarTrabajo, setLugarTrabajo] = useState("");
  const [usosSel,      setUsosSel]      = useState<string[]>([]);
  const [otrosUso,     setOtrosUso]     = useState("");
  const [fechaDevH,    setFechaDevH]    = useState("");

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!item) return;
    setTipo(item.tipo);
    setFecha(item.fecha.slice(0, 10));
    try {
      if (item.tipo === "Vehículo") {
        setVehiculo(JSON.parse(item.datos));
      } else if (item.tipo === "Materiales") {
        const d: DatosMateriales = JSON.parse(item.datos);
        setFilas(d.filas?.length ? d.filas : [{ ...EMPTY_FILA }]);
        setFechaDev(d.fecha_devolucion ?? "");
        setCondiciones(d.condiciones ?? "");
        setFotos(d.fotos ?? []);
      } else {
        const d: DatosHerramientas = JSON.parse(item.datos);
        setFilasH(d.filas?.length ? d.filas : [{ ...EMPTY_HERRAMIENTA }]);
        setLugarTrabajo(d.lugar_trabajo ?? "");
        setFechaDevH(d.fecha_devolucion ?? "");
        const otrosEntry = d.usos?.find(u => u.startsWith("Otros:"));
        setUsosSel(d.usos?.filter(u => !u.startsWith("Otros:")) ?? []);
        setOtrosUso(otrosEntry ? otrosEntry.replace("Otros:", "").trim() : "");
      }
    } catch { /* use defaults */ }
  }, [item]);

  const setV = (k: keyof DatosVehiculo, v: string) =>
    setVehiculo(prev => ({ ...prev, [k]: v }));

  const setFila = (idx: number, k: keyof FilaMaterial, v: string) =>
    setFilas(prev => prev.map((f, i) => i === idx ? { ...f, [k]: v } : f));

  const addFila    = () => setFilas(prev => [...prev, { ...EMPTY_FILA }]);
  const removeFila = (idx: number) =>
    setFilas(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const setFilaH = (idx: number, k: keyof FilaHerramienta, v: string) =>
    setFilasH(prev => prev.map((f, i) => i === idx ? { ...f, [k]: v } : f));

  const addFilaH    = () => setFilasH(prev => [...prev, { ...EMPTY_HERRAMIENTA }]);
  const removeFilaH = (idx: number) =>
    setFilasH(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const toggleUso = (uso: string) =>
    setUsosSel(prev => prev.includes(uso) ? prev.filter(u => u !== uso) : [...prev, uso]);

  const handleFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const MAX = 8;
    const remaining = MAX - fotos.length;
    if (remaining <= 0) { setError(`Máximo ${MAX} fotos.`); return; }
    const toProcess = files.slice(0, remaining);
    try {
      const nuevas = await Promise.all(
        toProcess.map(async (file) => {
          const webpFile = await processImageToWebP(file, {
            maxWidth: 1200, quality: 0.75, minQuality: 0.5,
            maxOutputSizeMB: 0.8, minWidth: 600,
          });
          return fileToDataUrl(webpFile);
        })
      );
      setFotos(prev => [...prev, ...nuevas]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar las fotos.");
    }
    e.target.value = "";
  };

  const removeFoto = (idx: number) => setFotos(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setError("");
    if (!fecha) { setError("La fecha es obligatoria."); return; }

    if (tipo === "Vehículo") {
      if (!vehiculo.marca.trim())  { setError("La marca es obligatoria.");    return; }
      if (!vehiculo.modelo.trim()) { setError("El modelo es obligatorio.");   return; }
      if (!vehiculo.anio.trim())   { setError("El año es obligatorio.");      return; }
      if (!vehiculo.color.trim())  { setError("El color es obligatorio.");    return; }
      if (!vehiculo.placas.trim()) { setError("Las placas son obligatorias."); return; }
      setSaving(true);
      try { await onSave({ tipo, fecha, datos: JSON.stringify(vehiculo) }); onClose(); }
      catch { setError("Error al guardar. Intenta de nuevo."); }
      finally { setSaving(false); }

    } else if (tipo === "Materiales") {
      const filasOk = filas.filter(f => f.herramienta.trim() || f.descripcion.trim() || f.uso.trim());
      if (!filasOk.length || !filasOk[0].herramienta.trim()) {
        setError("Agrega al menos un material."); return;
      }
      const datos: DatosMateriales = {
        filas: filasOk,
        fecha_entrega: fecha,
        ...(fechaDev            ? { fecha_devolucion: fechaDev }           : {}),
        ...(condiciones.trim()  ? { condiciones: condiciones.trim() }      : {}),
        ...(fotos.length        ? { fotos }                                : {}),
      };
      setSaving(true);
      try { await onSave({ tipo, fecha, datos: JSON.stringify(datos) }); onClose(); }
      catch { setError("Error al guardar. Intenta de nuevo."); }
      finally { setSaving(false); }

    } else {
      const filasOk = filasH.filter(f => f.herramienta.trim());
      if (!filasOk.length) { setError("Agrega al menos una herramienta."); return; }
      const usos = [
        ...usosSel,
        ...(otrosUso.trim() ? [`Otros: ${otrosUso.trim()}`] : []),
      ];
      const datos: DatosHerramientas = {
        lugar_trabajo: lugarTrabajo.trim(),
        usos,
        filas: filasOk,
        fecha_entrega: fecha,
        ...(fechaDevH ? { fecha_devolucion: fechaDevH } : {}),
      };
      setSaving(true);
      try { await onSave({ tipo, fecha, datos: JSON.stringify(datos) }); onClose(); }
      catch { setError("Error al guardar. Intenta de nuevo."); }
      finally { setSaving(false); }
    }
  };

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title={isEditing ? "Editar responsiva" : "Nueva responsiva"}
      maxWidthClassName={tipo === "Materiales" || tipo === "Herramientas" ? "max-w-2xl" : "max-w-lg"}
    >
      <div className="space-y-4">

        {/* Colaborador */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold">Colaborador: </span>
          {empleado.nombre} {empleado.apellido_paterno} {empleado.apellido_materno}
        </div>

        {/* Tipo y fecha */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Tipo de responsiva <span className="text-red-500">*</span></label>
            {isEditing ? (
              <div className="rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 select-none">
                {tipo}
              </div>
            ) : (
              <select className={INPUT} value={tipo} onChange={e => setTipo(e.target.value as TipoResponsiva)}>
                <option value="Vehículo">Vehículo</option>
                <option value="Materiales">Materiales / Equipo</option>
                {isMantenimiento && (
                  <option value="Herramientas">Herramientas Mantenimiento</option>
                )}
              </select>
            )}
          </div>
          <div>
            <label className={LABEL}>
              {tipo === "Materiales" || tipo === "Herramientas" ? "Fecha de entrega" : "Fecha"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input type="date" className={INPUT} value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
        </div>

        {/* ── Vehículo ── */}
        {tipo === "Vehículo" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Datos del vehículo
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Marca <span className="text-red-500">*</span></label>
                <input type="text" className={INPUT} placeholder="Toyota" value={vehiculo.marca}
                  onChange={e => setV("marca", e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Modelo <span className="text-red-500">*</span></label>
                <input type="text" className={INPUT} placeholder="Corolla" value={vehiculo.modelo}
                  onChange={e => setV("modelo", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={LABEL}>Año <span className="text-red-500">*</span></label>
                <input type="text" className={INPUT} placeholder="2022" value={vehiculo.anio}
                  onChange={e => setV("anio", e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Color <span className="text-red-500">*</span></label>
                <input type="text" className={INPUT} placeholder="Blanco" value={vehiculo.color}
                  onChange={e => setV("color", e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Placas <span className="text-red-500">*</span></label>
                <input type="text" className={INPUT} placeholder="ABC-123" value={vehiculo.placas}
                  onChange={e => setV("placas", e.target.value.toUpperCase())} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Número de serie</label>
              <input type="text" className={INPUT} placeholder="Opcional" value={vehiculo.num_serie}
                onChange={e => setV("num_serie", e.target.value)} />
            </div>
          </>
        )}

        {/* ── Materiales / Equipo ── */}
        {tipo === "Materiales" && (
          <>
            {/* Tabla de materiales */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 mb-2">
                Materiales / Equipo <span className="text-red-500">*</span>
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-3 py-2 text-left font-semibold text-slate-600 w-2/5">
                        Herramienta / Equipo
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600 w-2/5">
                        Descripción / Serie / Modelo
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600 w-1/5">Uso</th>
                      <th className="px-2 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-2 py-1.5">
                          <input type="text" className={INPUT_SM} placeholder="Laptop, Dron, Celular…"
                            value={fila.herramienta} onChange={e => setFila(idx, "herramienta", e.target.value)} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="text" className={INPUT_SM} placeholder="Modelo, No. Serie…"
                            value={fila.descripcion} onChange={e => setFila(idx, "descripcion", e.target.value)} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="text" className={INPUT_SM} placeholder="Laboral"
                            value={fila.uso} onChange={e => setFila(idx, "uso", e.target.value)} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {filas.length > 1 && (
                            <button type="button" onClick={() => removeFila(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-2 border-t border-slate-100">
                  <button type="button" onClick={addFila}
                    className="text-xs text-[#312C85] font-semibold hover:underline">
                    + Agregar fila
                  </button>
                </div>
              </div>
            </div>

            {/* Fecha de devolución */}
            <div>
              <label className={LABEL}>
                Fecha de devolución{" "}
                <span className="text-xs font-normal normal-case text-slate-400">(opcional)</span>
              </label>
              <input type="date" className={INPUT} value={fechaDev} onChange={e => setFechaDev(e.target.value)} />
            </div>

            {/* Condiciones */}
            <div>
              <label className={LABEL}>
                Condiciones / Observaciones{" "}
                <span className="text-xs font-normal normal-case text-slate-400">(opcional)</span>
              </label>
              <textarea
                className={INPUT + " resize-none h-20"}
                placeholder="Se entrega nuevo. Incluye accesorios…"
                value={condiciones}
                onChange={e => setCondiciones(e.target.value)}
              />
            </div>

            {/* Fotos */}
            <div>
              <label className={LABEL}>
                Evidencia fotográfica{" "}
                <span className="text-xs font-normal normal-case text-slate-400">(opcional · máx. 8)</span>
              </label>
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-4">
                {fotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {fotos.map((foto, idx) => (
                      <div key={idx} className="relative group">
                        <img src={foto} alt={`Foto ${idx + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => removeFoto(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {fotos.length < 8 && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#312C85] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {fotos.length === 0 ? "Subir fotos del equipo" : "Agregar más fotos"}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={handleFotos} />
              </div>
            </div>
          </>
        )}

        {/* ── Herramientas Mantenimiento ── */}
        {tipo === "Herramientas" && (
          <>
            {/* Lugar de trabajo */}
            <div>
              <label className={LABEL}>
                Lugar de trabajo / Inmueble{" "}
                <span className="text-xs font-normal normal-case text-slate-400">(opcional)</span>
              </label>
              <input
                type="text"
                className={INPUT}
                placeholder="Ej. Edificio Las Palmas, Depto 302…"
                value={lugarTrabajo}
                onChange={e => setLugarTrabajo(e.target.value)}
              />
            </div>

            {/* Tabla de herramientas */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 mb-2">
                Herramientas entregadas <span className="text-red-500">*</span>
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-2 py-2 text-left font-semibold text-slate-600">Herramienta</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-600">Marca / Modelo</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-600">No. Serie</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-600">Estado</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-600">Observaciones</th>
                      <th className="px-2 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {filasH.map((fila, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-2 py-1.5 min-w-[110px]">
                          <input type="text" className={INPUT_SM} placeholder="Taladro, Martillo…"
                            value={fila.herramienta} onChange={e => setFilaH(idx, "herramienta", e.target.value)} />
                        </td>
                        <td className="px-2 py-1.5 min-w-[110px]">
                          <input type="text" className={INPUT_SM} placeholder="Bosch GSB-18"
                            value={fila.marca_modelo} onChange={e => setFilaH(idx, "marca_modelo", e.target.value)} />
                        </td>
                        <td className="px-2 py-1.5 min-w-[90px]">
                          <input type="text" className={INPUT_SM} placeholder="N/A"
                            value={fila.num_serie} onChange={e => setFilaH(idx, "num_serie", e.target.value)} />
                        </td>
                        <td className="px-2 py-1.5 min-w-[90px]">
                          <select className={INPUT_SM} value={fila.estado}
                            onChange={e => setFilaH(idx, "estado", e.target.value as FilaHerramienta["estado"])}>
                            <option value="Nuevo">Nuevo</option>
                            <option value="Bueno">Bueno</option>
                            <option value="Regular">Regular</option>
                            <option value="Usado">Usado</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5 min-w-[110px]">
                          <input type="text" className={INPUT_SM} placeholder="Opcional"
                            value={fila.observaciones} onChange={e => setFilaH(idx, "observaciones", e.target.value)} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {filasH.length > 1 && (
                            <button type="button" onClick={() => removeFilaH(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-2 border-t border-slate-100">
                  <button type="button" onClick={addFilaH}
                    className="text-xs text-[#312C85] font-semibold hover:underline">
                    + Agregar herramienta
                  </button>
                </div>
              </div>
            </div>

            {/* Usos */}
            <div>
              <label className={LABEL}>
                Uso de la herramienta{" "}
                <span className="text-xs font-normal normal-case text-slate-400">(marcar los que apliquen)</span>
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 grid grid-cols-2 gap-y-2 gap-x-4">
                {USOS_OPCIONES.map(uso => (
                  <label key={uso} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usosSel.includes(uso)}
                      onChange={() => toggleUso(uso)}
                      className="rounded border-slate-300 text-[#312C85] focus:ring-[#312C85]/20"
                    />
                    {uso}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer col-span-2">
                  <input
                    type="checkbox"
                    checked={otrosUso.trim() !== ""}
                    onChange={e => { if (!e.target.checked) setOtrosUso(""); }}
                    className="rounded border-slate-300 text-[#312C85] focus:ring-[#312C85]/20"
                  />
                  <span className="whitespace-nowrap">Otros:</span>
                  <input
                    type="text"
                    className={INPUT_SM + " flex-1"}
                    placeholder="Especificar…"
                    value={otrosUso}
                    onChange={e => setOtrosUso(e.target.value)}
                  />
                </label>
              </div>
            </div>

            {/* Fecha de devolución */}
            <div>
              <label className={LABEL}>
                Fecha de devolución{" "}
                <span className="text-xs font-normal normal-case text-slate-400">(opcional)</span>
              </label>
              <input type="date" className={INPUT} value={fechaDevH} onChange={e => setFechaDevH(e.target.value)} />
            </div>
          </>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
