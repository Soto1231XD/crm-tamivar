type ProcessImageOptions = {
  maxWidth?: number;
  quality?: number;
  minQuality?: number;
  maxOutputSizeMB?: number;
  maxIterations?: number;
  qualityStep?: number;
  resizeStepRatio?: number;
  minWidth?: number;
};

const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_QUALITY = 0.8;
const DEFAULT_MIN_QUALITY = 0.55;
const DEFAULT_MAX_OUTPUT_SIZE_MB = 2;
const DEFAULT_MAX_ITERATIONS = 6;
const DEFAULT_QUALITY_STEP = 0.08;
const DEFAULT_RESIZE_STEP_RATIO = 0.88;
const DEFAULT_MIN_WIDTH = 960;

function normalizeProcessOptions(
  maxWidthOrOptions: number | ProcessImageOptions = DEFAULT_MAX_WIDTH,
  qualityArg: number = DEFAULT_QUALITY,
): Required<ProcessImageOptions> {
  if (typeof maxWidthOrOptions === "number") {
    return {
      maxWidth: maxWidthOrOptions,
      quality: qualityArg,
      minQuality: DEFAULT_MIN_QUALITY,
      maxOutputSizeMB: DEFAULT_MAX_OUTPUT_SIZE_MB,
      maxIterations: DEFAULT_MAX_ITERATIONS,
      qualityStep: DEFAULT_QUALITY_STEP,
      resizeStepRatio: DEFAULT_RESIZE_STEP_RATIO,
      minWidth: DEFAULT_MIN_WIDTH,
    };
  }

  return {
    maxWidth: maxWidthOrOptions.maxWidth ?? DEFAULT_MAX_WIDTH,
    quality: maxWidthOrOptions.quality ?? DEFAULT_QUALITY,
    minQuality: maxWidthOrOptions.minQuality ?? DEFAULT_MIN_QUALITY,
    maxOutputSizeMB:
      maxWidthOrOptions.maxOutputSizeMB ?? DEFAULT_MAX_OUTPUT_SIZE_MB,
    maxIterations: maxWidthOrOptions.maxIterations ?? DEFAULT_MAX_ITERATIONS,
    qualityStep: maxWidthOrOptions.qualityStep ?? DEFAULT_QUALITY_STEP,
    resizeStepRatio:
      maxWidthOrOptions.resizeStepRatio ?? DEFAULT_RESIZE_STEP_RATIO,
    minWidth: maxWidthOrOptions.minWidth ?? DEFAULT_MIN_WIDTH,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) || "");
    reader.onerror = () =>
      reject(
        new Error(
          `No pudimos leer la imagen "${file.name}". Verifica que el archivo no esté dañado o incompleto.`,
        ),
      );
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string, fileName: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          `La imagen "${fileName}" no pudo abrirse correctamente. Usa un archivo JPG, PNG o WEBP válido.`,
        ),
      );
    img.src = dataUrl;
  });
}

function renderImageToWebPBlob(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(
        new Error(
          "No pudimos preparar la imagen para optimizarla en este navegador.",
        ),
      );
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "No pudimos convertir la imagen al formato optimizado.",
            ),
          );
          return;
        }

        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

// Procesa una imagen: redimensiona, comprime y convierte a WebP
export const processImageToWebP = async (
  file: File,
  maxWidthOrOptions: number | ProcessImageOptions = DEFAULT_MAX_WIDTH,
  qualityArg: number = DEFAULT_QUALITY,
): Promise<File> => {
  try {
    const options = normalizeProcessOptions(maxWidthOrOptions, qualityArg);
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl, file.name);

    let width = Math.min(img.width, options.maxWidth);
    let height = Math.round((img.height * width) / img.width);
    let quality = options.quality;
    const maxOutputBytes = options.maxOutputSizeMB * 1024 * 1024;
    let bestBlob: Blob | null = null;

    for (let attempt = 0; attempt < options.maxIterations; attempt += 1) {
      const blob = await renderImageToWebPBlob(img, width, height, quality);
      bestBlob = blob;

      if (blob.size <= maxOutputBytes) {
        break;
      }

      if (quality > options.minQuality) {
        quality = Math.max(options.minQuality, quality - options.qualityStep);
        continue;
      }

      if (width <= options.minWidth) {
        break;
      }

      width = Math.max(
        options.minWidth,
        Math.round(width * options.resizeStepRatio),
      );
      height = Math.round((img.height * width) / img.width);
    }

    if (!bestBlob) {
      throw new Error(
        `No pudimos optimizar la imagen "${file.name}". Intenta con otro archivo o vuelve a exportarla.`,
      );
    }

    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    return new File([bestBlob], newFileName, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      `No pudimos optimizar la imagen "${file.name}". Intenta con otro archivo o vuelve a exportarla.`,
    );
  }
};

// Procesa una imagen, convierte a JPEG
export async function getPdfCompatibleImage(
  imageUrl: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();

    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.warn("No se pudo crear el contexto 2D para PDF");
        return resolve(null);
      }

      // Dibujamos el WebP original en el canvas
      ctx.drawImage(img, 0, 0);

      // Lo exportamos como JPEG (calidad 0.8 es un buen balance peso/calidad)
      const jpegBase64 = canvas.toDataURL("image/jpeg", 0.8);
      resolve(jpegBase64);
    };

    img.onerror = () => {
      console.warn("Error cargando imagen para conversión a PDF:", imageUrl);
      resolve(null); // Resolvemos con null para omitir esa imagen sin romper el PDF
    };

    img.src = imageUrl;
  });
}
