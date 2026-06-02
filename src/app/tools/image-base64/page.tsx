'use client';

import * as React from 'react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { fileToBase64, stripDataUrlPrefix, formatFileSize, type FileReadResult } from '@/tools/image-base64/utils';
import { ImageUp, Trash2, FileText, Settings2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

export default function Page() {
  const [result, setResult] = React.useState<FileReadResult | null>(null);
  const [originalFile, setOriginalFile] = React.useState<File | null>(null);
  const [rawMode, setRawMode] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [isCompressing, setIsCompressing] = React.useState(false);
  
  // Compression Settings
  const [maxWidth, setMaxWidth] = React.useState('0'); // 0 means original
  const [quality, setQuality] = React.useState('0.85');
  const [format, setFormat] = React.useState<'original' | 'image/jpeg' | 'image/webp' | 'image/png'>('original');

  const inputRef = React.useRef<HTMLInputElement>(null);

  const processFile = React.useCallback(async (file: File) => {
    setIsCompressing(true);
    setResult(null);
    
    // Artificial small delay to allow UI to show loading state (if heavy image)
    await new Promise(r => setTimeout(r, 50)); 
    
    const options = {
      maxWidth: maxWidth === '0' ? undefined : parseInt(maxWidth, 10),
      quality: parseFloat(quality),
      outputType: format
    };
    
    const res = await fileToBase64(file, options);
    setResult(res);
    setIsCompressing(false);
  }, [maxWidth, quality, format]);

  const handleFile = React.useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setResult({ success: false, error: 'Please select an image file' });
      return;
    }
    setOriginalFile(file);
    processFile(file);
  }, [processFile]);

  // Re-process when settings change
  React.useEffect(() => {
    if (originalFile) {
      processFile(originalFile);
    }
  }, [maxWidth, quality, format, originalFile, processFile]);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = React.useCallback(() => setDragOver(false), []);

  const handleClear = React.useCallback(() => {
    setResult(null);
    setOriginalFile(null);
    setRawMode(false);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleDownload = () => {
    if (!result || !result.success) return;
    const isRaw = rawMode;
    const content = isRaw ? stripDataUrlPrefix(result.dataUrl) : result.dataUrl;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.fileName.split('.')[0]}_base64.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: 'success', message: 'Downloaded Base64 text file' });
  };

  const base64Content = result?.success
    ? (rawMode ? stripDataUrlPrefix(result.dataUrl) : result.dataUrl)
    : '';

  // Performance Optimization: Render a truncated string in the textarea if > 500kb
  // A 5MB base64 string will freeze React when pasted directly into a controlled textarea component
  const shouldTruncate = base64Content.length > 500_000;
  const displayContent = shouldTruncate 
    ? base64Content.substring(0, 100_000) + `\n\n... [TRUNCATED FOR UI PERFORMANCE - ${formatFileSize(base64Content.length)} TOTAL].\nUSE 'COPY' OR 'DOWNLOAD' BUTTON TO GET THE FULL STRING.`
    : base64Content;

  return (
    <ToolLayout name="Image to Base64" description="Convert images to base64 data URLs with optional compression to drastically reduce CSS/HTML bundle sizes" category="Encoding">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left side: Upload & Settings */}
        <div className="lg:col-span-1 space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            className="hidden"
          />

          {!originalFile ? (
            <button
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'w-full p-8 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 cursor-pointer',
                dragOver
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50 hover:bg-bg-tertiary'
              )}
            >
              <div className={cn('p-4 rounded-xl transition-colors', dragOver ? 'bg-accent/10' : 'bg-bg-tertiary')}>
                <ImageUp className={cn('h-8 w-8 transition-colors', dragOver ? 'text-accent' : 'text-text-muted')} />
              </div>
              <p className="text-text-primary font-medium text-sm">Upload or drag & drop</p>
              <p className="text-text-muted text-xs">PNG, JPG, WebP, SVG, GIF</p>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-bg-tertiary border border-border flex items-center justify-between">
               <div className="min-w-0 flex-1">
                 <p className="text-sm font-medium truncate">{originalFile.name}</p>
                 <p className="text-xs text-text-muted">Original: {formatFileSize(originalFile.size)}</p>
               </div>
               <Button variant="ghost" size="sm" onClick={handleClear} icon={<Trash2 className="h-4 w-4 text-error" />}>
                 Clear
               </Button>
            </div>
          )}

          <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
              <Settings2 className="h-4 w-4 text-accent" />
              <span>Compression Settings</span>
            </div>
            
            <Select
              label="Format Conversion"
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              options={[
                { value: 'original', label: 'Keep Original Format' },
                { value: 'image/webp', label: 'WebP (Smallest)' },
                { value: 'image/jpeg', label: 'JPEG (No transparency)' },
                { value: 'image/png', label: 'PNG (Lossless)' }
              ]}
            />
            
            <Select
              label="Max Width (px)"
              value={maxWidth}
              onChange={(e) => setMaxWidth(e.target.value)}
              options={[
                { value: '0', label: 'Original Size' },
                { value: '1920', label: '1920px (HD)' },
                { value: '1080', label: '1080px' },
                { value: '800', label: '800px' },
                { value: '500', label: '500px' },
                { value: '256', label: '256px (Icon)' }
              ]}
            />

            {(format === 'image/jpeg' || format === 'image/webp') && (
              <Select
                label="Quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                options={[
                  { value: '1', label: '100% (Maximum)' },
                  { value: '0.85', label: '85% (High)' },
                  { value: '0.6', label: '60% (Medium)' },
                  { value: '0.4', label: '40% (Low)' }
                ]}
              />
            )}
            
            <p className="text-[10px] text-text-muted leading-tight">
              Large base64 strings bloat CSS and HTML payloads. Compressing and resizing before encoding fixes this.
            </p>
          </div>
        </div>

        {/* Right side: Results */}
        <div className="lg:col-span-2 space-y-4">
          {isCompressing ? (
            <div className="h-64 flex items-center justify-center border border-border rounded-xl bg-bg-secondary animate-pulse">
               <p className="text-text-muted">Compressing and encoding...</p>
            </div>
          ) : result ? (
            <div className="space-y-4 animate-fade-in">
              {result.success ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-bg-tertiary border border-border">
                    <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-[url('https://cdn.pixabay.com/photo/2016/09/24/09/52/checkered-1691335_1280.png')] border border-border shrink-0">
                      <img src={result.dataUrl} alt="Preview" className="w-full h-full object-contain backdrop-blur-sm" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-bold rounded-md uppercase",
                          result.fileSize < (originalFile?.size || 0) ? "bg-success/10 text-success border border-success/20" : "bg-bg-hover text-text-secondary border border-border"
                        )}>
                          {formatFileSize(result.fileSize)} output
                        </span>
                        {originalFile && result.fileSize < originalFile.size && (
                          <span className="text-xs font-medium text-success">
                            -{Math.round((1 - result.fileSize / originalFile.size) * 100)}% smaller
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mb-1">
                        Format: <span className="font-mono text-text-primary">{result.mimeType}</span>
                      </p>
                      <p className="text-xs text-text-muted">
                        String length: {base64Content.length.toLocaleString()} characters
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex bg-bg-tertiary p-1 rounded-lg">
                      <button
                        onClick={() => setRawMode(false)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!rawMode ? 'bg-bg-primary shadow text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                      >
                        Data URL (data:...)
                      </button>
                      <button
                        onClick={() => setRawMode(true)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${rawMode ? 'bg-bg-primary shadow text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                      >
                        Raw String
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <CopyButton value={base64Content} label="Copy Base64" />
                      <Button variant="secondary" size="sm" onClick={handleDownload} icon={<Download className="h-4 w-4" />}>
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      readOnly
                      value={displayContent}
                      className={cn(
                        "w-full h-80 px-4 py-3 rounded-lg bg-bg-tertiary border border-border text-text-primary font-mono text-xs focus:outline-none resize-y",
                        shouldTruncate && "text-text-muted"
                      )}
                    />
                  </div>
                </>
              ) : (
                <div className="p-5 rounded-xl bg-error/10 border border-error/30">
                  <p className="text-sm text-error font-medium">Error</p>
                  <p className="text-sm text-text-secondary mt-1">{result.error}</p>
                </div>
              )}
            </div>
          ) : (
             <div className="h-64 flex flex-col items-center justify-center border border-border rounded-xl bg-bg-secondary border-dashed">
               <ImageUp className="h-8 w-8 text-text-muted/30 mb-2" />
               <p className="text-text-muted text-sm">Upload an image to see preview & code</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
