import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PropertyForm } from "../components/PropertyForm";
import { usePropertiesStore, type PropertiesState } from "../store/usePropertiesStore";
import type { CreatePropertyPayload } from "@/interfaces/property.interface";

export function CreatePropertyPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extraemos la acción addProperty del store de propiedades
  const addProperty = usePropertiesStore((state: PropertiesState) => state.addProperty);

  function handleCancel() {
    navigate("/modulos/propiedades");
  }

  async function handleCreateProperty({
    payload,
    files,
  }: {
    payload: CreatePropertyPayload;
    files: File[];
  }): Promise<string | null> {
    try {
      setIsSubmitting(true);

      // Llamamos a la acción del Store de Zustand
      await addProperty(payload, files);

      // Si la petición es exitosa, navegamos a la lista
      navigate("/modulos/propiedades");
      return null;
    } catch (error: any) {
      console.error("Error al registrar propiedad:", error);
      return (
        error?.response?.data?.message ||
        error.message ||
        "No fue posible crear la propiedad."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PropertyForm
      title="Registrar nueva propiedad"
      submitLabel="Registrar"
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      onSubmit={handleCreateProperty}
    />
  );
}
