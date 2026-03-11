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
} from "../utils/propertyValidations";

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
  // Consumimos toda la lógica desde nuestro nuevo Custom Hook
  const {
    form,
    submitError,
    handleInputChange,
    handlePaymentToggle,
    handleAddImages,
    handleRemoveImage,
    handleRemoveExistingImage,
    handleSubmit,
  } = usePropertyForm(property, onSubmit);

  return (
    <div className="space-y-4">
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
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              1. Información general
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
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
                options={TYPE_OPTIONS}
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
              <FieldTextarea
                label="Descripción"
                name="descripcion"
                value={form.descripcion}
                onChange={handleInputChange}
                className="md:col-span-2"
              />
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              2. Precio y estado
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <FieldInput
                label="Precio (MXN)"
                name="precio"
                value={form.precio}
                onChange={handleInputChange}
                type="text"
                inputMode="decimal"
                required
              />
              <FieldSelect
                label="Estatus"
                name="estatus"
                value={form.estatus}
                onChange={handleInputChange}
                options={STATUS_OPTIONS}
                required
              />
              <PaymentMultiSelect
                label="Tipos de pago"
                selectedValues={form.tipos_pago}
                options={PAYMENT_OPTIONS}
                onToggle={handlePaymentToggle}
                className="md:col-span-2"
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
              <FieldTextarea
                label="Precio condicionado (descripción)"
                name="precio_condicionado_descripcion"
                value={form.precio_condicionado_descripcion}
                onChange={handleInputChange}
              />
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              3. Dirección
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <FieldInput
                label="Código postal"
                name="cp"
                value={form.cp}
                onChange={handleInputChange}
                type="number"
                required
              />
              <FieldInput
                label="Fraccionamiento"
                name="fraccionamiento"
                value={form.fraccionamiento}
                onChange={handleInputChange}
                required
              />
              <FieldInput
                label="Calle"
                name="calle"
                value={form.calle}
                onChange={handleInputChange}
                required
              />
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
              <FieldInput
                label="Municipio"
                name="municipio"
                value={form.municipio}
                onChange={handleInputChange}
                required
              />
              <FieldInput
                label="Estado"
                name="estado"
                value={form.estado}
                onChange={handleInputChange}
                required
              />
              <FieldInput
                label="Región"
                name="smz"
                value={form.smz}
                onChange={handleInputChange}
                type="number"
              />
              <FieldInput
                label="Manzana"
                name="mza"
                value={form.mza}
                onChange={handleInputChange}
                type="number"
              />
              <FieldInput
                label="Lote"
                name="lote"
                value={form.lote}
                onChange={handleInputChange}
                type="number"
              />
              <FieldTextarea
                label="Referencias"
                name="referencias"
                value={form.referencias}
                onChange={handleInputChange}
                className="md:col-span-2"
              />
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              4. Medidas y características
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
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
            </div>

            <div className="grid gap-2 md:grid-cols-2">
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
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              5. Extras e Imágenes
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle
                name="tiene_gravamen"
                checked={form.tiene_gravamen}
                onChange={handleInputChange}
                label="Tiene gravamen"
                className="md:col-span-2"
              />
              <FieldInput
                label="Cuota mantenimiento (MXN)"
                name="cuota_mantenimiento"
                value={form.cuota_mantenimiento}
                onChange={handleInputChange}
                type="text"
                inputMode="decimal"
              />
              <FieldInput
                label="Pisos"
                name="pisos_tiene"
                value={form.pisos_tiene}
                onChange={handleInputChange}
                type="number"
                min="0"
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