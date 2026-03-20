import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { CreatePropertyPayload, PropertyRecord } from "@/interfaces/property.interface";
import { ImageGridUploader } from "./ImageGridUploader";
import { FieldInput, FieldSelect, FieldTextarea, PaymentMultiSelect, Toggle } from "./FormFields";
import { usePropertyForm } from "../utils/usePropertyForm";
import { OPERATION_OPTIONS, PAYMENT_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from "../utils/property-constants";

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

type SectionCardProps = {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
};

function SectionCard({ step, title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#312C85] text-sm font-bold text-white shadow-sm">
          {step}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function PropertyForm({
  property,
  title,
  submitLabel,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: PropertyFormProps) {
  const navigate = useNavigate();
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
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate("/modulos/propiedades")}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Volver a propiedades
      </button>

      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Formulario de propiedad</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Captura la información principal, condiciones, dirección, características e imágenes de la propiedad en un solo flujo.
        </p>
        <div className="mt-4 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-100">
          <span className="mr-1 font-semibold">*</span> Campo obligatorio
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <SectionCard
          step="1"
          title="Información general"
          description="Define la identidad principal de la propiedad y como se presentara en el catalogo."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldInput
              label="Titulo"
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
              label="Estado"
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
            <FieldTextarea
              label="Etiquetas"
              name="etiquetas"
              value={form.etiquetas}
              onChange={handleInputChange}
              className="md:col-span-2"
            />
          </div>
        </SectionCard>

        <SectionCard
          step="2"
          title="Precio y condiciones"
          description="Configura el valor de la propiedad, pagos aceptados y condiciones especiales."
        >
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
        </SectionCard>

        <SectionCard
          step="3"
          title="Dirección"
          description="Ubica la propiedad con datos claros y referencias fáciles de consultar."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <FieldInput
              label="Calle"
              name="calle"
              value={form.calle}
              onChange={handleInputChange}
              required
              className="md:col-span-2"
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
              label="Fraccionamiento"
              name="fraccionamiento"
              value={form.fraccionamiento}
              onChange={handleInputChange}
              required
              className="md:col-span-2"
            />
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

            <FieldTextarea
              label="Referencias"
              name="referencias"
              value={form.referencias}
              onChange={handleInputChange}
              className="md:col-span-4"
            />
          </div>
        </SectionCard>

        <SectionCard
          step="4"
          title="Medidas y distribución"
          description="Registra las dimensiones clave y las características interiores de la propiedad."
        >
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Checks rápidos</p>
              <h4 className="mt-1 text-base font-semibold text-slate-900">Características adicionales</h4>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Toggle name="tiene_gravamen" checked={form.tiene_gravamen} onChange={handleInputChange} label="Tiene gravamen" />
              <Toggle name="sala" checked={form.sala} onChange={handleInputChange} label="Sala" />
              <Toggle name="comedor" checked={form.comedor} onChange={handleInputChange} label="Comedor" />
              <Toggle name="cocina" checked={form.cocina} onChange={handleInputChange} label="Cocina" />
              <Toggle name="area_servicio" checked={form.area_servicio} onChange={handleInputChange} label="Área de servicio" />
              <Toggle name="patio" checked={form.patio} onChange={handleInputChange} label="Patio" />
              <Toggle name="jardín" checked={form.jardin} onChange={handleInputChange} label="Jardín" />
              <Toggle name="alberca" checked={form.alberca} onChange={handleInputChange} label="Alberca" />
              <Toggle name="terraza" checked={form.terraza} onChange={handleInputChange} label="Terraza" />
              <Toggle name="amueblado" checked={form.amueblado} onChange={handleInputChange} label="Amueblado" />
              <Toggle name="bodega" checked={form.bodega} onChange={handleInputChange} label="Bodega" />
              <Toggle
                name="aire_acondicionado"
                checked={form.aire_acondicionado}
                onChange={handleInputChange}
                label="Aire acondicionado"
              />
              <Toggle name="boiler" checked={form.boiler} onChange={handleInputChange} label="Boiler" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          step="5"
          title="Extras e imágenes"
          description="Agrega imágenes, amenidades, servicios e información complementaria para cerrar la ficha."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldInput
              label="Cuota de mantenimiento (MXN)"
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
        </SectionCard>

        {submitError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {submitError}
          </div>
        ) : null}

        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
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
    </div>
  );
}
