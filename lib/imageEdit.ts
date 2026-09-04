"use client";

/**
 * Rotates a photo by a multiple of 90 degrees and center-crops it to a
 * square, matching the square tiles it renders into everywhere in the app.
 * Pure canvas work — no dependency needed for basic crop/rotate.
 */
export async function prepareImageForUpload(file: File, rotationDeg = 0): Promise<File> {
  const bitmap = await loadBitmap(file);
  const normalized = ((Math.round(rotationDeg / 90) * 90) % 360 + 360) % 360;
  const swapDims = normalized === 90 || normalized === 270;
  const rw = swapDims ? bitmap.height : bitmap.width;
  const rh = swapDims ? bitmap.width : bitmap.height;

  const rotated = document.createElement("canvas");
  rotated.width = rw;
  rotated.height = rh;
  const rctx = rotated.getContext("2d");
  if (!rctx) return file;
  rctx.translate(rw / 2, rh / 2);
  rctx.rotate((normalized * Math.PI) / 180);
  rctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

  const size = Math.min(rw, rh);
  const sx = (rw - size) / 2;
  const sy = (rh - size) / 2;
  const cropped = document.createElement("canvas");
  cropped.width = size;
  cropped.height = size;
  const cctx = cropped.getContext("2d");
  if (!cctx) return file;
  cctx.drawImage(rotated, sx, sy, size, size, 0, 0, size, size);

  const blob = await new Promise<Blob | null>((resolve) =>
    cropped.toBlob((b) => resolve(b), "image/jpeg", 0.9)
  );
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Couldn't read image"));
    });
    return img as unknown as ImageBitmap;
  } finally {
    URL.revokeObjectURL(url);
  }
}
