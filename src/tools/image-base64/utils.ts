export type FileReadResult =
  | { success: true; dataUrl: string; fileName: string; fileSize: number; mimeType: string }
  | { success: false; error: string };

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
        } catch (e) {
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
