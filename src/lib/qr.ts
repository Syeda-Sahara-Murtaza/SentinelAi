import jsQR from "jsqr";
export async function decodeQrFile(file: File): Promise<string> {
  const image = await createImageBitmap(file).catch(() => { throw new Error("This image could not be opened. Choose a clear PNG, JPEG, WebP, or GIF."); });
  try {
    if (image.width * image.height > 25_000_000) throw new Error("This image is too large. Resize it below 25 megapixels.");
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Image decoding is not available in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" });
    if (!qr?.data) throw new Error("No readable QR code was found. Try a sharper image with the entire QR code visible.");
    return qr.data;
  } finally { image.close(); }
}
