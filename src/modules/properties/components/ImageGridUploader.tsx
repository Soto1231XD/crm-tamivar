import { useEffect, useState, type ChangeEvent } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ImagePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    // Generamos una URL temporal para que el tag <img> pueda mostrar el archivo físico
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Limpiamos la memoria cuando el componente se destruye
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-all hover:shadow-md">
      <img
        src={previewUrl}
        alt="Preview"
        className="h-full w-full object-cover"
      />

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 backdrop-blur-sm transition-all hover:scale-110 hover:bg-red-600 group-hover:opacity-100"
        title="Quitar imagen"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

// Props del componente principal
type ImageGridUploaderProps = {
  images: File[];
  existingImages?: any[];
  onRemoveExistingImage?: (index: number) => void;
  onAddImages: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
};

export function ImageGridUploader({
  images,
  onAddImages,
  onRemoveImage,
  existingImages = [],
  onRemoveExistingImage
}: ImageGridUploaderProps) {
  return (
    <div className="md:col-span-2 flex flex-col gap-3 text-sm text-slate-700">
      <label className="font-medium">
        Imágenes de la propiedad{" "}
        <span className="font-semibold text-red-600">*</span>
      </label>

      <div className="flex w-full items-center justify-center">
        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100">
          <div className="flex flex-col items-center justify-center pb-6 pt-5 text-slate-500">
            <svg
              className="mb-3 h-8 w-8"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-1 text-sm">
              <span className="font-semibold">Haz clic para seleccionar</span>{" "}
              imágenes
            </p>
            <p className="text-xs">Formatos soportados: JPG, PNG, WEBP</p>
          </div>
          <input
            type="file"
            name="imagenes"
            accept="image/jpeg, image/png, image/webp"
            multiple
            onChange={onAddImages}
            className="hidden"
          />
        </label>
      </div>

      {/* Cuadrícula de previsualización (5 por fila en pantallas md) */}
      {(existingImages.length > 0 || images.length > 0) && (
        <div className="mt-3 grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-8">
          
          {existingImages.map((img, index) => (
            <ExistingImagePreview
              key={`existing-${index}`}
              image={img}
              onRemove={() => onRemoveExistingImage && onRemoveExistingImage(index)}
            />
          ))}

          {images.map((file, index) => (
            <ImagePreview
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => onRemoveImage(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Subcomponente para imágenes que ya existen en la BD
function ExistingImagePreview({
  image,
  onRemove,
}: {
  image: any;
  onRemove: () => void;
}) {
  const imageUrl = image.url?.startsWith("http")
    ? image.url
    : `${API_URL}/${image.url}`;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-all hover:shadow-md ring-2 ring-brand-500/20">
      <img
        src={imageUrl}
        alt={image.titulo || "Imagen existente"}
        className="h-full w-full object-cover"
      />

      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
        Guardada
      </span>

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 backdrop-blur-sm transition-all hover:scale-110 hover:bg-red-600 group-hover:opacity-100"
        title="Quitar imagen"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}