export type FileReadResult =
  | { success: true; dataUrl: string; fileName: string; fileSize: number; mimeType: string }
  | { success: false; error: string };

export type Result<T> = { success: true; data: T } | { success: false; error: string };

export interface ParsedImageBase64 {
  mimeType: string;
  base64: string;
}

// Leading base64 characters of common image formats' magic bytes
const IMAGE_SIGNATURES: [prefix: string, mimeType: string][] = [
  ['iVBORw0KGgo', 'image/png'],
  ['/9j/', 'image/jpeg'],
  ['R0lGOD', 'image/gif'],
  ['UklGR', 'image/webp'],
  ['PHN2Zy', 'image/svg+xml'], // "<svg"
  ['PD94bWw', 'image/svg+xml'], // "<?xml"
  ['AAABAA', 'image/x-icon'],
];

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
};

/**
 * Parses an image given as a base64 data URL (`data:image/png;base64,...`) or a raw
 * base64 string (type sniffed from its leading magic bytes).
 */
export function parseImageBase64(input: string): Result<ParsedImageBase64> {
  const trimmed = input.trim();
  let mimeType: string | undefined;
  let base64 = trimmed;

  if (/^data:/i.test(trimmed)) {
    const match = /^data:(image\/[a-z0-9.+-]+)((?:;[^,;]*)*?);base64,([\s\S]*)$/i.exec(trimmed);
    if (!match) return { success: false, error: 'Expected a base64-encoded image data URL (data:image/...;base64,...)' };
    mimeType = match[1].toLowerCase();
    base64 = match[3];
  }

  base64 = base64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return { success: false, error: 'Input is not valid base64' };
  }

  mimeType ??= IMAGE_SIGNATURES.find(([prefix]) => base64.startsWith(prefix))?.[1];
  if (!mimeType) return { success: false, error: 'Could not detect an image type from the base64 data' };

  return { success: true, data: { mimeType, base64 } };
}

/** Decodes a base64 image (data URL or raw base64) into a File, for the upload pipeline. */
export function base64ToImageFile(input: string, baseName = 'pasted-image'): Result<File> {
  const parsed = parseImageBase64(input);
  if (!parsed.success) return parsed;
  try {
    const binary = atob(parsed.data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ext = MIME_EXTENSIONS[parsed.data.mimeType] ?? parsed.data.mimeType.split('/')[1]?.split('+')[0] ?? 'img';
    return { success: true, data: new File([bytes], `${baseName}.${ext}`, { type: parsed.data.mimeType }) };
  } catch {
    return { success: false, error: 'Failed to decode base64 image data' };
  }
}

export interface CompressionOptions {
  maxWidth?: number;
  quality?: number; // 0 to 1 for jpeg/webp
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'original';
}

export function compressImage(dataUrl: string, mimeType: string, options: CompressionOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    // Cannot compress SVGs easily via canvas without breaking them, just return original
    if (mimeType.includes('svg')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (options.maxWidth && width > options.maxWidth) {
        const ratio = options.maxWidth / width;
        width = options.maxWidth;
        height = height * ratio;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      
      // Fill transparent background with white if converting to JPEG
      const targetType = options.outputType === 'original' ? mimeType : (options.outputType || mimeType);
      if (targetType === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const quality = options.quality ?? 0.85;
      resolve(canvas.toDataURL(targetType, quality));
    };
    img.onerror = () => reject(new Error('Failed to load image into canvas for compression.'));
    img.src = dataUrl;
  });
}

export function fileToBase64(file: File, options?: CompressionOptions): Promise<FileReadResult> {
  return new Promise((resolve) => {
    if (file.size === 0) {
      resolve({ success: false, error: 'File is empty' });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      let result = reader.result as string;
      
      if (options && (options.maxWidth || options.quality || options.outputType)) {
        try {
          result = await compressImage(result, file.type, options);
        } catch {
          // Fallback to original on error
        }
      }

      // Calculate new rough byte size (length of base64 * 3/4)
      const base64Len = result.split(',')[1].length;
      const approximateSize = Math.floor(base64Len * 0.75);

      resolve({
        success: true,
        dataUrl: result,
        fileName: file.name,
        fileSize: options ? approximateSize : file.size,
        mimeType: (options?.outputType && options.outputType !== 'original') ? options.outputType : file.type,
      });
    };
    reader.onerror = () => resolve({ success: false, error: (reader.error as Error).message || 'Failed to read file' });
    reader.readAsDataURL(file);
  });
}

export function stripDataUrlPrefix(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(',');
  return commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
