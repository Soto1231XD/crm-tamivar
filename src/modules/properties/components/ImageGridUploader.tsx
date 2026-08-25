import { useEffect, useState, useRef, useMemo, type ChangeEvent, type DragEvent } from "react";
import type { Imagen, NuevaImagen } from "@/interfaces/property.interface";
import {
  MAX_PROPERTY_IMAGES,
  MAX_PROPERTY_IMAGE_SIZE_MB,
  MAX_PROPERTY_IMAGES_TOTAL_SIZE_MB,
} from "../utils/propertyValidations";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PROPERTY_IMAGES_INPUT_ID = "property-images-input";

type UnifiedItem =
  | { kind: "existing"; origIdx: number; img: Imagen }
  | { kind: "new"; origIdx: number; img: NuevaImagen };

function PositionBadge({ position }: { position: number }) {
  return (
    <span className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[11px] font-bold text-white backdrop-blur-sm">
      {position}
    </span>
  );
}

const REMOVE_BTN =
  "absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 backdrop-blur-sm transition-all hover:scale-110 hover:bg-red-600 group-hover:opacity-100";

const CLOSE_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TITLE_INPUT =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

type CardDragProps = {
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
};

function cardClass(isDragging: boolean, isDropTarget: boolean, extra = "") {
  return [
    "group relative overflow-hidden rounded-xl border bg-slate-50 shadow-sm transition-all cursor-grab active:cursor-grabbing",
    isDragging ? "opacity-40 scale-95" : "",
    isDropTarget ? "border-indigo-400 ring-2 ring-indigo-300" : "border-slate-200 hover:shadow-md",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function ImagePreview({
  image,
  index,
  position,
  onRemove,
  onUpdateTitle,
  onSetPrimary,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  image: NuevaImagen;
  index: number;
  position: number;
  onRemove: () => void;
  onUpdateTitle: (index: number, titulo: string) => void;
  onSetPrimary: (type: "new" | "existing", index: number) => void;
} & CardDragProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(image.file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image.file]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cardClass(isDragging, isDropTarget)}
    >
      <div className="relative aspect-square">
        <PositionBadge position={position} />
        <img
          src={previewUrl}
          alt={image.titulo || "Preview"}
          className="h-full w-full object-cover"
          draggable={false}
        />
        <button type="button" onClick={onRemove} className={REMOVE_BTN} title="Quitar imagen">
          {CLOSE_ICON}
        </button>
        {image.principal && (
          <span className="absolute bottom-2 right-2 rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
            Principal
          </span>
        )}
      </div>
      <div className="space-y-2 border-t border-slate-200 bg-white p-3">
        <input
          type="text"
          draggable={false}
          value={image.titulo}
          onChange={(e) => onUpdateTitle(index, e.target.value)}
          placeholder="Ej. Fachada"
          className={TITLE_INPUT}
        />
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <input
            type="radio"
            draggable={false}
            name="property-primary-image"
            checked={image.principal}
            onChange={() => onSetPrimary("new", index)}
            className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Usar como foto principal
        </label>
      </div>
    </div>
  );
}

function ExistingImagePreview({
  image,
  index,
  position,
  onRemove,
  onUpdateTitle,
  onSetPrimary,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  image: Imagen;
  index: number;
  position: number;
  onRemove: () => void;
  onUpdateTitle: (index: number, titulo: string) => void;
  onSetPrimary: (type: "new" | "existing", index: number) => void;
} & CardDragProps) {
  const imageUrl = image.url?.startsWith("http")
    ? image.url
    : `${API_URL}/${image.url}`;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cardClass(isDragging, isDropTarget, "ring-2 ring-brand-500/20")}
    >
      <div className="relative aspect-square">
        <PositionBadge position={position} />
        <img
          src={imageUrl}
          alt={image.titulo || "Imagen existente"}
          className="h-full w-full object-cover"
          draggable={false}
        />
        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
          Guardada
        </span>
        <button type="button" onClick={onRemove} className={REMOVE_BTN} title="Quitar imagen">
          {CLOSE_ICON}
        </button>
        {image.principal && (
          <span className="absolute bottom-2 right-2 rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
            Principal
          </span>
        )}
      </div>
      <div className="space-y-2 border-t border-slate-200 bg-white p-3">
        <input
          type="text"
          draggable={false}
          value={image.titulo}
          onChange={(e) => onUpdateTitle(index, e.target.value)}
          placeholder="Ej. Fachada"
          className={TITLE_INPUT}
        />
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <input
            type="radio"
            draggable={false}
            name="property-primary-image"
            checked={image.principal}
            onChange={() => onSetPrimary("existing", index)}
            className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Usar como foto principal
        </label>
      </div>
    </div>
  );
}

type ImageGridUploaderProps = {
  images: NuevaImagen[];
  existingImages?: Imagen[];
  onRemoveExistingImage?: (index: number) => void;
  onAddImages: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onUpdateImageTitle: (index: number, titulo: string) => void;
  onUpdateExistingImageTitle?: (index: number, titulo: string) => void;
  onSetPrimaryImage: (type: "new" | "existing", index: number) => void;
  onReorderImages?: (existingImages: Imagen[], newImages: NuevaImagen[]) => void;
  label?: string;
  error?: string;
};

export function ImageGridUploader({
  images,
  onAddImages,
  onRemoveImage,
  existingImages = [],
  onRemoveExistingImage,
  onUpdateImageTitle,
  onUpdateExistingImageTitle,
  onSetPrimaryImage,
  onReorderImages,
  label = "Imágenes de la propiedad",
  error,
}: ImageGridUploaderProps) {
  // useRef for the actual drag source — avoids stale-closure in drop handler
  // and prevents the synchronous setState from cancelling the browser drag gesture
  const dragIndexRef = useRef<number | null>(null);
  const dropTargetRef = useRef<number | null>(null);
  const [visualDragIndex, setVisualDragIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const unified = useMemo<UnifiedItem[]>(
    () => [
      ...existingImages.map((img, idx) => ({ kind: "existing" as const, origIdx: idx, img })),
      ...images.map((img, idx) => ({ kind: "new" as const, origIdx: idx, img })),
    ],
    [existingImages, images],
  );

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
    // Defer visual update so the browser can capture the drag snapshot first
    setTimeout(() => setVisualDragIndex(index), 0);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    if (index !== dropTargetRef.current) {
      dropTargetRef.current = index;
      setDropTargetIndex(index);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, toIndex: number) {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    dropTargetRef.current = null;
    setVisualDragIndex(null);
    setDropTargetIndex(null);

    if (fromIndex === null || fromIndex === toIndex) return;

    const next = [...unified];
    const [dragged] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, dragged);

    const newExisting = next
      .filter((item): item is Extract<UnifiedItem, { kind: "existing" }> => item.kind === "existing")
      .map((item) => item.img);
    const newImages = next
      .filter((item): item is Extract<UnifiedItem, { kind: "new" }> => item.kind === "new")
      .map((item) => item.img);

    onReorderImages?.(newExisting, newImages);
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    dropTargetRef.current = null;
    setVisualDragIndex(null);
    setDropTargetIndex(null);
  }

  return (
    <div className="md:col-span-2 flex flex-col gap-3 text-sm text-slate-700">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor={PROPERTY_IMAGES_INPUT_ID} className="font-medium">
          {label} <span className="font-semibold text-red-600">*</span>
        </label>
        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
          Solo se permiten 40 imágenes de la propiedad
        </span>
      </div>

      <div className="flex w-full items-center justify-center">
        <label
          htmlFor={PROPERTY_IMAGES_INPUT_ID}
          className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100"
        >
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
              <span className="font-semibold">Haz clic para seleccionar</span>{" "}imágenes
            </p>
            <p className="text-xs">Formatos soportados: JPG, PNG, WEBP</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Máximo {MAX_PROPERTY_IMAGES} imágenes, {MAX_PROPERTY_IMAGE_SIZE_MB} MB por imagen y{" "}
              {MAX_PROPERTY_IMAGES_TOTAL_SIZE_MB} MB por envió.
            </p>
          </div>
          <input
            id={PROPERTY_IMAGES_INPUT_ID}
            type="file"
            name="imagenes"
            accept="image/jpeg, image/png, image/webp"
            multiple
            onChange={onAddImages}
            className="hidden"
          />
        </label>
      </div>

      {unified.length > 0 && (
        <>
          {onReorderImages && (
            <p className="text-center text-xs text-slate-400">
              Arrastra las imágenes para reordenarlas
            </p>
          )}
          <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unified.map((item, unifiedIndex) => {
              const position = unifiedIndex + 1;
              const isDragging = visualDragIndex === unifiedIndex;
              const isDropTarget =
                dropTargetIndex === unifiedIndex && visualDragIndex !== unifiedIndex;

              if (item.kind === "existing") {
                return (
                  <ExistingImagePreview
                    key={item.img.url || `existing-${item.origIdx}`}
                    image={item.img}
                    index={item.origIdx}
                    position={position}
                    onRemove={() => onRemoveExistingImage?.(item.origIdx)}
                    onUpdateTitle={(_, titulo) =>
                      onUpdateExistingImageTitle?.(item.origIdx, titulo)
                    }
                    onSetPrimary={onSetPrimaryImage}
                    isDragging={isDragging}
                    isDropTarget={isDropTarget}
                    onDragStart={() => handleDragStart(unifiedIndex)}
                    onDragOver={(e) => handleDragOver(e, unifiedIndex)}
                    onDrop={(e) => handleDrop(e, unifiedIndex)}
                    onDragEnd={handleDragEnd}
                  />
                );
              }

              return (
                <ImagePreview
                  key={`new-${item.img.file.name}-${item.img.file.size}`}
                  image={item.img}
                  index={item.origIdx}
                  position={position}
                  onRemove={() => onRemoveImage(item.origIdx)}
                  onUpdateTitle={(_, titulo) => onUpdateImageTitle(item.origIdx, titulo)}
                  onSetPrimary={onSetPrimaryImage}
                  isDragging={isDragging}
                  isDropTarget={isDropTarget}
                  onDragStart={() => handleDragStart(unifiedIndex)}
                  onDragOver={(e) => handleDragOver(e, unifiedIndex)}
                  onDrop={(e) => handleDrop(e, unifiedIndex)}
                  onDragEnd={handleDragEnd}
                />
              );
            })}
          </div>
        </>
      )}

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
