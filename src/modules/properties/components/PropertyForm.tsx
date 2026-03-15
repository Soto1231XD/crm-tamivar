import { useNavigate } from "react-router-dom";
import { usePropertyForm } from "../utils/usePropertyForm";
import {
  FieldInput,
  FieldSelect,
  FieldTextarea,
  Toggle,
  PaymentMultiSelect,
} from "./FormFields";
import type {
  PropertyRecord,
  CreatePropertyPayload,
} from "@/interfaces/property.interface";
import { ImageGridUploader } from "./ImageGridUploader";

// Importamos las constantes que estaban en el archivo original.
import {
  TYPE_OPTIONS,
  OPERATION_OPTIONS,
  STATUS_OPTIONS,
  PAYMENT_OPTIONS,
} from "../utils/property-constants";

type PropertyFormProps = {
  property?: PropertyRecord | null;
  title: string;
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (data: {
    payload: Omit<CreatePropertyPayload, "creado_por_id">;
    files: File[];
  }) => Promise<string | null>;
};

export function PropertyForm({
  property,
  title,
  submitLabel,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: PropertyFormProps) {
  const navigate = useNavigate();

  // Consumimos toda la lógica desde nuestro nuevo Custom Hook
  const {
    form,
    submitError,
    errors,
    handleInputChange,
    handlePaymentToggle,
    handleAddImages,
    handleRemoveImage,
    handleRemoveExistingImage,
    handleSubmit,
  } = usePropertyForm(property, onSubmit);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate("/modulos/properties")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Volver a propiedades
      </button>

      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Completa la información de la propiedad.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-red-600">*</span> Campo
          obligatorio
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-10 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              1. Información general
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FieldInput
                label="Título"
                name="titulo"
                value={form.titulo}
                onChange={handleInputChange}
                required
              />
              <FieldSelect
                label="Tipo de inmueble"
                name="tipo_inmueble"
                value={form.tipo_inmueble}
                onChange={handleInputChange}
                options={TYPE_OPTIONS.filter((option) => option !== "Todos los tipos")}
                required
              />
              <FieldSelect
                label="Tipo de operación"
                name="tipo_operacion"
                value={form.tipo_operacion}
                onChange={handleInputChange}
                options={OPERATION_OPTIONS}
                required
              />
              <FieldSelect
                label="Estatus"
                name="estatus"
                value={form.estatus}
                onChange={handleInputChange}
                options={STATUS_OPTIONS.filter((option) => option !== "Todos los estados")}
                required
              />
              <FieldTextarea
                label="Descripción"
                name="descripcion"
                value={form.descripcion}
                onChange={handleInputChange}
                className="md:col-span-2"
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              2. Precio y Condiciones
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FieldInput
                label="Precio (MXN)"
                name="precio"
                value={form.precio}
                onChange={handleInputChange}
                error={errors.precio}
                type="text"
                inputMode="decimal"
                required
              />
              <PaymentMultiSelect
                label="Tipos de pago"
                selectedValues={form.tipos_pago}
                options={PAYMENT_OPTIONS}
                onToggle={handlePaymentToggle}
                error={errors.tipos_pago}
                required
              />
              <FieldInput
                label="Precio condicionado (monto) (MXN)"
                name="precio_condicionado_monto"
                value={form.precio_condicionado_monto}
                onChange={handleInputChange}
                type="text"
                inputMode="decimal"
              />
              <FieldInput
                label="Precio condicionado (descripción)"
                name="precio_condicionado_descripcion"
                value={form.precio_condicionado_descripcion}
                onChange={handleInputChange}
                type="text"
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              3. Dirección
            </h3>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              {/* FILA 1: Calle es larga (ocupa 2), números son cortos (ocupan 1 c/u) */}
              <div className="md:col-span-2">
                <FieldInput
                  label="Calle"
                  name="calle"
                  value={form.calle}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <FieldInput
                label="Número exterior"
                name="num_ext"
                value={form.num_ext}
                onChange={handleInputChange}
                type="number"
                required
              />
              <FieldInput
                label="Número interior"
                name="num_int"
                value={form.num_int}
                onChange={handleInputChange}
                type="number"
              />

              {/* FILA 2: Fraccionamiento (2), Municipio (1), Estado (1) */}
              <div className="md:col-span-2">
                <FieldInput
                  label="Fraccionamiento"
                  name="fraccionamiento"
                  value={form.fraccionamiento}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <FieldInput
                label="Estado"
                name="estado"
                value={form.estado}
                onChange={handleInputChange}
                required
              />
              <FieldInput
                label="Municipio"
                name="municipio"
                value={form.municipio}
                onChange={handleInputChange}
                required
              />

              {/* FILA 3: Los campos cortitos inmobiliarios juntos en 1 fila perfecta */}
              <FieldInput
                label="Región (SMZ)"
                name="smz"
                value={form.smz}
                onChange={handleInputChange}
                error={errors.smz}
                type="number"
              />
              <FieldInput
                label="Manzana (MZ)"
                name="mza"
                value={form.mza}
                onChange={handleInputChange}
                error={errors.mza}
                type="number"
              />
              <FieldInput
                label="Lote"
                name="lote"
                value={form.lote}
                onChange={handleInputChange}
                error={errors.lote}
                type="number"
              />
              <FieldInput
                label="Código postal"
                name="cp"
                value={form.cp}
                onChange={handleInputChange}
                error={errors.cp}
                type="number"
                required
              />

              {/* FILA 4: Referencias ocupa todo el ancho de las 4 columnas */}
              <div className="md:col-span-4">
                <FieldTextarea
                  label="Referencias"
                  name="referencias"
                  value={form.referencias}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              4. Medidas y Distribución
            </h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
              <FieldInput
                label="Terreno (m2)"
                name="terreno_m2"
                value={form.terreno_m2}
                onChange={handleInputChange}
                type="number"
                min="1"
                step="0.01"
                required
              />
              <FieldInput
                label="Construcción (m2)"
                name="construccion_m2"
                value={form.construccion_m2}
                onChange={handleInputChange}
                type="number"
                min="1"
                step="0.01"
                required
              />
              <FieldInput
                label="Frente"
                name="frente"
                value={form.frente}
                onChange={handleInputChange}
                type="number"
                min="1"
                step="0.01"
                required
              />
              <FieldInput
                label="Fondo"
                name="fondo"
                value={form.fondo}
                onChange={handleInputChange}
                type="number"
                min="1"
                step="0.01"
                required
              />
              <FieldInput
                label="Recámaras"
                name="recamaras"
                value={form.recamaras}
                onChange={handleInputChange}
                type="number"
                min="0"
                required
              />
              <FieldInput
                label="Baños"
                name="banos"
                value={form.banos}
                onChange={handleInputChange}
                type="number"
                min="0"
                step="0.5"
                required
              />
              <FieldInput
                label="Estacionamiento"
                name="estacionamiento"
                value={form.estacionamiento}
                onChange={handleInputChange}
                type="number"
                min="0"
                required
              />
              <FieldInput
                label="Pisos"
                name="pisos_tiene"
                value={form.pisos_tiene}
                onChange={handleInputChange}
                type="number"
                min="0"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Características Adicionales
              </h4>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <Toggle
                  name="tiene_gravamen"
                  checked={form.tiene_gravamen}
                  onChange={handleInputChange}
                  label="Tiene gravamen"
                />
                <Toggle
                  name="sala"
                  checked={form.sala}
                  onChange={handleInputChange}
                  label="Sala"
                />
                <Toggle
                  name="comedor"
                  checked={form.comedor}
                  onChange={handleInputChange}
                  label="Comedor"
                />
                <Toggle
                  name="cocina"
                  checked={form.cocina}
                  onChange={handleInputChange}
                  label="Cocina"
                />
                <Toggle
                  name="area_servicio"
                  checked={form.area_servicio}
                  onChange={handleInputChange}
                  label="Área de servicio"
                />
                <Toggle
                  name="patio"
                  checked={form.patio}
                  onChange={handleInputChange}
                  label="Patio"
                />
                <Toggle
                  name="jardin"
                  checked={form.jardin}
                  onChange={handleInputChange}
                  label="Jardín"
                />
                <Toggle
                  name="alberca"
                  checked={form.alberca}
                  onChange={handleInputChange}
                  label="Alberca"
                />
                <Toggle
                  name="terraza"
                  checked={form.terraza}
                  onChange={handleInputChange}
                  label="Terraza"
                />
                <Toggle
                  name="amueblado"
                  checked={form.amueblado}
                  onChange={handleInputChange}
                  label="Amueblado"
                />
                <Toggle
                  name="bodega"
                  checked={form.bodega}
                  onChange={handleInputChange}
                  label="Bodega"
                />
                <Toggle
                  name="aire_acondicionado"
                  checked={form.aire_acondicionado}
                  onChange={handleInputChange}
                  label="Aire acondicionado"
                />
                <Toggle
                  name="boiler"
                  checked={form.boiler}
                  onChange={handleInputChange}
                  label="Boiler"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              5. Extras e Imágenes
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <FieldInput
                label="Cuota mantenimiento (MXN)"
                name="cuota_mantenimiento"
                value={form.cuota_mantenimiento}
                onChange={handleInputChange}
                type="text"
                inputMode="decimal"
                className="md:col-span-2"
              />
              <FieldTextarea
                label="Servicios e instalaciones"
                name="servicios_instalaciones"
                value={form.servicios_instalaciones}
                onChange={handleInputChange}
                className="md:col-span-2"
              />
              <FieldTextarea
                label="Amenidades"
                name="amenidades"
                value={form.amenidades}
                onChange={handleInputChange}
                className="md:col-span-2"
              />
              <ImageGridUploader
                images={form.imagenes}
                onAddImages={handleAddImages}
                onRemoveImage={handleRemoveImage}
                existingImages={form.imagenes_existentes}
                onRemoveExistingImage={handleRemoveExistingImage}
              />
              <FieldTextarea
                label="Comentarios"
                name="comentarios"
                value={form.comentarios}
                onChange={handleInputChange}
                className="md:col-span-2"
              />
            </div>
          </section>

          {submitError ? (
            <p className="text-sm font-medium text-red-600">{submitError}</p>
          ) : null}

          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-white pt-8">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-[#FD3939] px-6 py-2 text-base font-semibold text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#0F172A] px-6 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Guardando..." : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}