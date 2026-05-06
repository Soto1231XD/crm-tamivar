import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { DevelopmentForm } from "../components/DevelopmentForm";
import { getFriendlyDevelopmentError } from "../utils/developmentErrors";
import type {
  DevelopmentRecord,
  NewDevelopmentImage,
  UpdateDevelopmentPayload,
} from "@/interfaces/development.interface";
import {
  getDevelopment,
  updateDevelopment,
} from "../services/developments.api";
import { processImageToWebP } from "@/shared/utils/imageProcessor";

export function EditDevelopmentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [development, setDevelopment] = useState<DevelopmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDevelopment() {
      if (!id) {
        setLoadError("No se encontró el desarrollo solicitado.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await getDevelopment(Number(id));
        if (!isMounted) return;
        setDevelopment(response);
        setLoadError("");
      } catch (error) {
        if (!isMounted) return;
        setLoadError(getFriendlyDevelopmentError(error, "load_detail"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDevelopment();
    return () => {
      isMounted = false;
    };
  }, [id]);

  function handleCancel() {
    navigate("/modulos/desarrollos");
  }

  async function handleEditDevelopment({
    payload,
    files,
  }: {
    payload: UpdateDevelopmentPayload;
    files: NewDevelopmentImage[];
  }): Promise<string | null> {
    if (!development) return "No se encontró el desarrollo.";

    try {
      setIsSubmitting(true);

      const optimizedFiles: NewDevelopmentImage[] = await Promise.all(
        files.map(async (image) => ({
          ...image,
          file: await processImageToWebP(image.file),
        })),
      );

      await updateDevelopment(development.id, payload, optimizedFiles);
      toast.success("El desarrollo se actualizó correctamente.");
      navigate("/modulos/desarrollos");
      return null;
    } catch (error) {
      console.error("Error al actualizar desarrollo:", error);
      return getFriendlyDevelopmentError(error, "update");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Cargando desarrollo...
      </section>
    );
  }

  if (loadError || !development) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-red-600">
          {loadError || "No se encontró el desarrollo."}
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

  return (
    <DevelopmentForm
      development={development}
      title="Editar desarrollo"
      submitLabel="Guardar cambios"
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
      onSubmit={handleEditDevelopment}
    />
  );
}
