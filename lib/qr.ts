import QRCode from "qrcode";

export async function generateQrDataUrl(url: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(url, {
      margin: 1,
      width: 240,
      color: { dark: "#050914", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}
