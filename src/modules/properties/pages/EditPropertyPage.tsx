import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PropertyForm } from "../components/PropertyForm";
import { usePropertiesStore } from "../store/usePropertiesStore";
import type {
  CreatePropertyPayload,
  UpdatePropertyPayload,
} from "@/interfaces/property.interface";

export function EditPropertyPage() {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extraemos las herramientas que necesitamos de nuestro Store
  const {
    currentProperty,
    isLoading,
    error: loadError,
    fetchProperty,
    editProperty,
    clearCurrentProperty,
  } = usePropertiesStore();

  useEffect(() => {
    // Si hay un ID en la URL, le pedimos a Zustand que traiga esa propiedad
    if (propertyId) {
      fetchProperty(Number(propertyId));
    }

    // Cuando el usuario sale de esta página, limpiamos el estado
    return () => {
      clearCurrentProperty();
    };
  }, [propertyId, fetchProperty, clearCurrentProperty]);

  function handleCancel() {
    navigate("/modulos/properties");
  }

  // Mantenemos la misma firma que espera tu PropertyForm ({ payload, files })
  async function handleEditProperty({
    payload,
    files,
  }: {
    payload: Omit<CreatePropertyPayload, "creado_por_id">;
    files: File[];
  }): Promise<string | null> {
    if (!currentProperty) return "No se encontró la propiedad.";

    try {
      setIsSubmitting(true);

      await editProperty(
        currentProperty.id,
        payload as UpdatePropertyPayload,
        files,
      );

      navigate("/modulos/properties");
      return null;
    } catch (error: any) {
      console.error("Error al actualizar:", error);
      return (
        error?.response?.data?.message ||
        error.message ||
        "No fue posible actualizar la propiedad."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Cargando propiedad...
      </section>
    );
  }

  if (loadError || !currentProperty) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-red-600">
          {loadError || "No se encontró la propiedad."}
        </p>
        <button
          type="button"
          onClick={handleCancel}
          className="mt-4 rounded-lg bg-[#0F172A] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Volver al listado
        </button>
      </section>
    );
  }

  // Renderizamos el formulario inyectando la propiedad actual
  return (
    <PropertyForm
      property={currentProperty}
      title="Editar propiedad"
      submitLabel="Guardar cambios"
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      onSubmit={handleEditProperty}
    />
  );
}
