export type QrResult =
  | { success: true; dataUrl: string }
  | { success: false; error: string };

export interface QrOptions {
  size?: number;
  colorDark?: string;
  colorLight?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export async function generateQrCode(
  text: string,
  options: QrOptions = {},
): Promise<QrResult> {
  if (!text.trim()) {
    return { success: false, error: 'Input cannot be empty' };
  }

  const {
    size = 400,
    colorDark = '#000000', // Standard black for maximum compatibility
    colorLight = '#ffffff', // Solid white background (quiet zone)
    errorCorrectionLevel = 'M',
  } = options;

  try {
    const qrcode = await import('qrcode');
    const dataUrl = await qrcode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: colorDark,
        light: colorLight,
      },
      errorCorrectionLevel,
    });
    return { success: true, dataUrl };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function generateQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: QrOptions = {},
): Promise<QrResult> {
  if (!text.trim()) {
    return { success: false, error: 'Input cannot be empty' };
  }

  const {
    size = 400,
    colorDark = '#000000',
    colorLight = '#ffffff',
    errorCorrectionLevel = 'M',
  } = options;

  try {
    const qrcode = await import('qrcode');
    canvas.width = size;
    canvas.height = size;
    await qrcode.toCanvas(canvas, text, {
      width: size,
      margin: 2,
      color: {
        dark: colorDark,
        light: colorLight,
      },
      errorCorrectionLevel,
    });
    return { success: true, dataUrl: canvas.toDataURL() };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
