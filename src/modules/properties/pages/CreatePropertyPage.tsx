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
    navigate("/modulos/properties");
  }

  async function handleCreateProperty({
    payload,
    files,
  }: {
    payload: Omit<CreatePropertyPayload, "creado_por_id">;
    files: File[];
  }): Promise<string | null> {
    try {
      setIsSubmitting(true);

      const payloadConId = {
        ...payload,
        creado_por_id: 2,
      };

      // Llamamos a la acción del Store de Zustand
      await addProperty(payloadConId as CreatePropertyPayload, files);

      // Si la petición es exitosa, navegamos a la lista
      navigate("/modulos/properties");
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
