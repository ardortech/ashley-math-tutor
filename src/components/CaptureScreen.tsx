import { useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { loadImage, compressImage, bitmapToObjectUrl } from "../lib/imageUtils";

interface CaptureScreenProps {
  onBack: () => void;
}

async function getCroppedBlob(
  imageSrc: string,
  crop: Area,
): Promise<Blob> {
  const img = await createImageBitmap(
    await (await fetch(imageSrc)).blob(),
  );
  const canvas = new OffscreenCanvas(crop.width, crop.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  img.close();
  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 });
}

export default function CaptureScreen({ onBack }: CaptureScreenProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const bitmap = await loadImage(file);
    const url = bitmapToObjectUrl(bitmap);
    bitmap.close();
    setImageSrc(url);
    setPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  }, []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea);
      const bitmap = await createImageBitmap(blob);
      const compressed = await compressImage(bitmap);
      bitmap.close();
      const url = URL.createObjectURL(compressed);
      setPreview(url);
      setImageSrc(null);
    } finally {
      setProcessing(false);
    }
  }, [imageSrc, croppedArea]);

  const handleRetake = useCallback(() => {
    setPreview(null);
    setImageSrc(null);
    inputRef.current?.click();
  }, []);

  // No image selected yet — show capture button
  if (!imageSrc && !preview) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 bg-bg">
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-2xl bg-primary px-8 py-5 text-lg font-bold text-white
            shadow-[0_8px_0_0_var(--color-primary-pressed)]
            active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
            transition-all"
        >
          選擇照片
        </button>
        <button onClick={onBack} className="mt-4 text-muted text-sm">
          返回首頁
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // Cropping
  if (imageSrc && !preview) {
    return (
      <div className="flex flex-col h-dvh bg-ink">
        <div className="relative flex-1">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="flex items-center gap-3 p-4 bg-ink">
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="rounded-xl bg-white/10 px-4 py-3 text-white text-sm font-medium"
          >
            旋轉
          </button>
          <button
            onClick={() => { setImageSrc(null); inputRef.current?.click(); }}
            className="rounded-xl bg-white/10 px-4 py-3 text-white text-sm font-medium"
          >
            重拍
          </button>
          <div className="flex-1" />
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="rounded-xl bg-primary px-6 py-3 text-white text-sm font-bold
              disabled:opacity-50 transition-opacity"
          >
            {processing ? "處理中…" : "確定裁切"}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // Preview
  return (
    <div className="flex flex-col min-h-dvh bg-bg px-4 pt-4">
      <h2 className="text-lg font-bold text-ink mb-3">照片預覽</h2>
      <div className="rounded-2xl border border-card-border bg-card overflow-hidden">
        <img src={preview!} alt="裁切後的題目照片" className="w-full" />
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleRetake}
          className="flex-1 rounded-2xl border border-card-border bg-card px-4 py-4 text-sm font-bold text-ink
            active:bg-card-border/30 transition-colors"
        >
          重新拍攝
        </button>
        <button
          className="flex-1 rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-white
            shadow-[0_6px_0_0_var(--color-primary-pressed)]
            active:translate-y-1 active:shadow-[0_3px_0_0_var(--color-primary-pressed)]
            transition-all opacity-50 cursor-not-allowed"
          disabled
        >
          送出（Phase 2）
        </button>
      </div>
      <button onClick={onBack} className="mt-4 text-muted text-sm text-center">
        返回首頁
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}
