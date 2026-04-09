// Procesa una imagen: redimensiona (opcional) y convierte a WebP
export const processImageToWebP = async (
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Redimensionado proporcional si excede el máximo
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo obtener el contexto 2D"));

        // Dibujamos la imagen en el lienzo
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Error al generar el Blob"));

            // Creamos el nuevo archivo con extensión .webp
            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const processedFile = new File([blob], newFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            resolve(processedFile);
          },
          "image/webp",
          quality,
        );
      };

      img.onerror = () => reject(new Error("Error al cargar el objeto Image"));
    };

    reader.onerror = () =>
      reject(new Error("Error al leer el archivo original"));
  });
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