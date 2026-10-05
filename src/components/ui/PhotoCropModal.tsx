import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { AppModal } from './AppModal';

type PhotoCropModalProps = {
  isOpen: boolean;
  imageSrc: string;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
};

export function PhotoCropModal({ isOpen, imageSrc, onConfirm, onCancel }: PhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels);
      onConfirm(file);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Ajustar foto de perfil"
      subtitle="Mueve y ajusta el zoom para encuadrar la foto."
      maxWidthClassName="max-w-lg"
    >
      <div className="relative h-80 w-full overflow-hidden rounded-xl bg-slate-900">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Zoom</span>
          <span className="text-xs text-slate-400">{Math.round((zoom - 1) / 2 * 100)}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-[#312C85]"
        />
      </div>

      <div className="mt-5 flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing}
          className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isProcessing ? 'Procesando...' : 'Confirmar'}
        </button>
      </div>
    </AppModal>
  );
}

async function getCroppedImageFile(imageSrc: string, pixelCrop: Area): Promise<File> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener el contexto del canvas.');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('No se pudo generar el recorte.')); return; }
        resolve(new File([blob], 'foto-perfil.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = src;
  });
}
