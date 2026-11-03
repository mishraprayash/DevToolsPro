'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Link2, FileCode, Copy, Braces, ArrowRight, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { encodeBase64, decodeBase64, encodeUrlStr, decodeUrlStr, encodeEntities, decodeEntities, isJsonCompatible, base64ToImageDataUrl } from '@/tools/encoder/utils';
import { OpenInMenu } from '@/components/tool/OpenInMenu';
import { inputTarget } from '@/lib/utils/openInTargets';
import { sendToTool } from '@/lib/utils/toolHandoff';
import { useWorkspaces } from '@/lib/hooks/useWorkspaces';
import { WorkspaceTabs } from '@/components/ui/WorkspaceTabs';
import { SplitPanesView } from '@/components/ui/SplitPanesView';

interface EncoderState {
  encodingMode: 'base64' | 'url' | 'entities';
  direction: 'encode' | 'decode';
  input: string;
  output: string;
  b64Mode: 'utf8' | 'hex' | 'binary';
  b64UrlSafe: boolean;
  urlMode: 'component' | 'uri' | 'strict';
  entMode: 'named' | 'decimal' | 'hex';
  entScope: 'markup' | 'all';
}

const defaultState: EncoderState = {
  encodingMode: 'base64',
  direction: 'encode',
  input: 'Encode or decode this string to keep it secure or transmit it safely.',
  output: '',
  b64Mode: 'utf8',
  b64UrlSafe: false,
  urlMode: 'component',
  entMode: 'named',
  entScope: 'markup'
};

export default function Page() {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    addWorkspace,
    removeWorkspace,
    renameWorkspace,
    updateActiveWorkspace,
    copyShareLink
  } = useWorkspaces<EncoderState>(defaultState, 'Encoder', 'encoder');

  const { state } = activeWorkspace;
  const router = useRouter();

  const decodedIsJson = React.useMemo(
    () => state.encodingMode === 'base64' && state.direction === 'decode' && isJsonCompatible(state.output),
    [state.encodingMode, state.direction, state.output]
  );

  // Base64 input that decodes to PNG/JPEG/GIF/WebP bytes: offer the Image to Base64 tool.
  const decodedImageDataUrl = React.useMemo(
    () => (state.encodingMode === 'base64' && state.direction === 'decode' ? base64ToImageDataUrl(state.input) : null),
    [state.encodingMode, state.direction, state.input]
  );

  const handleOpenInJson = () => {
    if (!sendToTool('json', { input: state.output, action: 'beautify', activeExample: -1 }, 'From Base64')) {
      toast({ type: 'error', message: 'Could not hand off to the JSON tool.' });
      return;
    }
    router.push('/tools/json');
  };

  const handleProcess = React.useCallback(() => {
    if (!state.input) {
      if (state.output !== '') updateActiveWorkspace({ output: '' });
      return;
    }
    let res = '';
    if (state.encodingMode === 'base64') {
      res = state.direction === 'encode' 
        ? encodeBase64(state.input, state.b64Mode, state.b64UrlSafe)
        : decodeBase64(state.input, state.b64Mode, state.b64UrlSafe);
    } else if (state.encodingMode === 'url') {
      res = state.direction === 'encode'
        ? encodeUrlStr(state.input, state.urlMode)
        : decodeUrlStr(state.input, state.urlMode);
    } else if (state.encodingMode === 'entities') {
      res = state.direction === 'encode'
        ? encodeEntities(state.input, { mode: state.entMode, scope: state.entScope })
        : decodeEntities(state.input);
    }
    if (res !== state.output) {
      updateActiveWorkspace({ output: res });
    }
  }, [state, updateActiveWorkspace]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const handleSwap = () => {
    updateActiveWorkspace({
      input: state.output,
      direction: state.direction === 'encode' ? 'decode' : 'encode'
    });
    toast({ type: 'success', message: 'Swapped input and output direction!' });
  };

  const toolbarContent = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
      {/* Navigation tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border overflow-x-auto scrollbar-hide">
        <button
          onClick={() => updateActiveWorkspace({ encodingMode: 'base64' })}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            state.encodingMode === 'base64'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Lock className="h-3.5 w-3.5" />
          Base64 Converter
        </button>
        <button
          onClick={() => updateActiveWorkspace({ encodingMode: 'url' })}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            state.encodingMode === 'url'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Link2 className="h-3.5 w-3.5" />
          URL Encoder
        </button>
        <button
          onClick={() => updateActiveWorkspace({ encodingMode: 'entities' })}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            state.encodingMode === 'entities'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <FileCode className="h-3.5 w-3.5" />
          HTML Entities
        </button>
      </div>

      {/* Direction Selector */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border shrink-0">
        <button
          onClick={() => updateActiveWorkspace({ direction: 'encode' })}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
            state.direction === 'encode' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Encode
        </button>
        <button
          onClick={() => updateActiveWorkspace({ direction: 'decode' })}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
            state.direction === 'decode' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Decode
        </button>
      </div>
    </div>
  );

  const leftPane = (
    <div className="flex flex-col h-full space-y-4 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-base font-semibold text-text-primary">Source Input</h2>
        <Button variant="ghost" size="sm" onClick={() => updateActiveWorkspace({ input: '' })}>Clear</Button>
      </div>
      <textarea
        value={state.input}
        onChange={(e) => updateActiveWorkspace({ input: e.target.value })}
        className="w-full flex-1 p-4 rounded-xl bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent resize-none font-mono overflow-y-auto min-h-[200px]"
        placeholder="Type values here..."
      />

      {/* Configs Panel based on active tab */}
      <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4 shadow-sm shrink-0">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Parameters</h3>
        
        {state.encodingMode === 'base64' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Text Character Standard"
              options={[
                { value: 'utf8', label: 'UTF-8 String' },
                { value: 'hex', label: 'Hexadecimal Bytes' },
                { value: 'binary', label: 'Raw Binary Bits' }
              ]}
              value={state.b64Mode}
              onChange={(e) => updateActiveWorkspace({ b64Mode: e.target.value as 'utf8' | 'hex' | 'binary' })}
            />
            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-7">
              <input
                type="checkbox"
                checked={state.b64UrlSafe}
                onChange={(e) => updateActiveWorkspace({ b64UrlSafe: e.target.checked })}
                className="rounded border-border text-accent focus:ring-accent bg-bg-tertiary h-4 w-4"
              />
              <span className="text-xs text-text-secondary font-medium">URL-Safe (+/ to -_)</span>
            </label>
          </div>
        )}

        {state.encodingMode === 'url' && (
          <Select
            label="URI Encoding Strictness"
            options={[
              { value: 'component', label: 'URI Component (Complete Query values)' },
              { value: 'uri', label: 'URI (Preserves http:// schemes)' },
              { value: 'strict', label: 'Strict RFC-3986 (Includes all symbols)' }
            ]}
            value={state.urlMode}
            onChange={(e) => updateActiveWorkspace({ urlMode: e.target.value as 'component' | 'uri' | 'strict' })}
          />
        )}

        {state.encodingMode === 'entities' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Entity Output Format"
              options={[
                { value: 'named', label: 'Named (&amp;)' },
                { value: 'decimal', label: 'Decimal (&#38;)' },
                { value: 'hex', label: 'Hexadecimal (&#x26;)' }
              ]}
              value={state.entMode}
              onChange={(e) => updateActiveWorkspace({ entMode: e.target.value as 'named' | 'decimal' | 'hex' })}
              disabled={state.direction === 'decode'}
            />
            <Select
              label="Characters to Target"
              options={[
                { value: 'markup', label: 'Markup Symbols only (<, >, &, \', ")' },
                { value: 'all', label: 'All Non-ASCII characters' }
              ]}
              value={state.entScope}
              onChange={(e) => updateActiveWorkspace({ entScope: e.target.value as 'markup' | 'all' })}
              disabled={state.direction === 'decode'}
            />
          </div>
        )}
      </div>
    </div>
  );

  const rightPane = (
    <div className="flex flex-col h-full space-y-4 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-base font-semibold text-text-primary">Converted Output</h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleSwap} disabled={!state.output} icon={<Copy className="h-3.5 w-3.5" />}>Swap</Button>
          {state.output && <CopyButton value={state.output} label="Copy Output" />}
        </div>
      </div>
      <div className="flex-1 min-h-[200px] h-full">
        <GradientBox value={state.output} placeholder="Conversion output will appear here..." className="h-full w-full font-mono leading-relaxed overflow-y-auto" />
      </div>

      {/* Decoded payload is JSON: offer to continue in the JSON tool */}
      {decodedIsJson && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-success/20 bg-success/10 shrink-0">
          <div className="flex items-center gap-2 text-sm text-success">
            <Braces className="h-4 w-4 shrink-0" />
            <span>Decoded value is valid JSON</span>
          </div>
          <Button size="sm" onClick={handleOpenInJson} icon={<ArrowRight className="h-3.5 w-3.5" />}>
            Open in JSON Tool
          </Button>
        </div>
      )}

      {/* Decoded bytes are an image: offer to preview it in the Image to Base64 tool */}
      {decodedImageDataUrl && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-accent/20 bg-accent/10 shrink-0">
          <div className="flex items-center gap-2 text-sm text-accent">
            <ImageIcon className="h-4 w-4 shrink-0" />
            <span>Decoded bytes are a {decodedImageDataUrl.slice(11, decodedImageDataUrl.indexOf(';')).toUpperCase()} image</span>
          </div>
          <OpenInMenu
            variant="primary"
            targets={[inputTarget('image-base64', decodedImageDataUrl, 'From Base64', { label: 'Image to Base64' })]}
          />
        </div>
      )}
    </div>
  );

  return (
    <ToolLayout
      name="Encoder & Decoder Sandbox"
      description="Consolidated encoding utility to convert text via Base64 binary wrappers, URL components, and HTML entities"
      category="Encoding"
    >
      <WorkspaceTabs
        workspaces={workspaces}
        activeId={activeWorkspaceId}
        onChange={setActiveWorkspaceId}
        onAdd={addWorkspace}
        onClose={removeWorkspace}
        onRename={renameWorkspace}
        onShare={copyShareLink}
      />
      <SplitPanesView
        toolbarContent={toolbarContent}
        leftPane={leftPane}
        rightPane={rightPane}
      />
    </ToolLayout>
  );
}
