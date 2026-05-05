import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { DevelopmentForm } from "../components/DevelopmentForm";
import { getFriendlyDevelopmentError } from "../utils/developmentErrors";
import type {
  CreateDevelopmentPayload,
  NewDevelopmentImage,
} from "@/interfaces/development.interface";
import { createDevelopment } from "../services/developments.api";
import { processImageToWebP } from "@/shared/utils/imageProcessor";

export function CreateDevelopmentPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleCancel() {
    navigate("/modulos/desarrollos");
  }

  async function handleCreateDevelopment({
    payload,
    files,
  }: {
    payload: CreateDevelopmentPayload;
    files: NewDevelopmentImage[];
  }): Promise<string | null> {
    try {
      setIsSubmitting(true);

      const optimizedFiles: NewDevelopmentImage[] = await Promise.all(
        files.map(async (image) => ({
          ...image,
          file: await processImageToWebP(image.file),
        })),
      );

      await createDevelopment(payload, optimizedFiles);
      toast.success("El desarrollo se creó con éxito.");
      navigate("/modulos/desarrollos");
      return null;
    } catch (error: any) {
      console.error("Error al registrar desarrollo:", error);
      return getFriendlyDevelopmentError(error, "create");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DevelopmentForm
      title="Registrar nuevo desarrollo"
      submitLabel="Registrar"
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      onSubmit={handleCreateDevelopment}
    />
  );
}
