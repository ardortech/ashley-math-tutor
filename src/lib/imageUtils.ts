const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.8;

export async function loadImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

export async function compressImage(bitmap: ImageBitmap): Promise<Blob> {
  const { width, height } = bitmap;
  let w = width;
  let h = height;

  if (Math.max(w, h) > MAX_EDGE) {
    const scale = MAX_EDGE / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);

  return canvas.convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY });
}

export function bitmapToObjectUrl(bitmap: ImageBitmap): string {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
