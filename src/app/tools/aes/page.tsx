'use client';

import * as React from 'react';
import { processAES } from '@/tools/aes/utils';
import { Shield, ArrowRightLeft, Settings, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function AESCryptoPage() {
  const [action, setAction] = React.useState<'encrypt' | 'decrypt'>('encrypt');
  const [mode, setMode] = React.useState<'CBC' | 'CTR' | 'GCM'>('CBC');
  const [input, setInput] = React.useState('DevTools Pro AES Sandbox');
  const [key, setKey] = React.useState('my-secret-key-32');
  const [keyFormat, setKeyFormat] = React.useState<'utf8' | 'hex'>('utf8');
  const [iv, setIv] = React.useState('my-init-vector-16');
  const [ivFormat, setIvFormat] = React.useState<'utf8' | 'hex'>('utf8');
  const [cipherFormat, setCipherFormat] = React.useState<'base64' | 'hex'>('base64');
  
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function performCrypto() {
      if (!input) {
        setOutput('');
        setError('');
        return;
      }
      if (!key) {
        setOutput('');
        setError('Secret Key is required.');
        return;
      }
      if (!iv) {
        setOutput('');
        setError('IV is required.');
        return;
      }
      
      const result = await processAES(
        action,
        mode,
        input,
        key,
        keyFormat,
        iv,
        ivFormat,
        cipherFormat
      );

      if (result.success) {
        setOutput(result.data);
        setError('');
      } else {
        setOutput('');
        setError(result.error);
      }
    }

    const t = setTimeout(performCrypto, 100);
    return () => clearTimeout(t);
  }, [action, mode, input, key, keyFormat, iv, ivFormat, cipherFormat]);

  const handleSwap = () => {
    if (output && !error) {
      setInput(output);
      setAction(a => a === 'encrypt' ? 'decrypt' : 'encrypt');
      toast({ type: 'success', message: 'Swapped input and output direction!' });
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <ToolLayout
      name="AES Encryption & Decryption"
      description="Encrypt and decrypt text using Advanced Encryption Standard (AES) with CBC, CTR, or GCM modes."
      category="Cryptography"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Direction Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border">
          <button
            onClick={() => setAction('encrypt')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
              action === 'encrypt' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Encrypt
          </button>
          <button
            onClick={() => setAction('decrypt')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
              action === 'decrypt' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Decrypt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Left Side Inputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">
              {action === 'encrypt' ? 'Plaintext Input' : 'Ciphertext Input'}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleClear}>Clear</Button>
          </div>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-[200px]"
            placeholder={action === 'encrypt' ? 'Enter text to encrypt...' : 'Enter ciphertext to decrypt...'}
            monospace
          />

          {/* Configs Panel */}
          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
              <Settings className="h-4 w-4 text-accent" />
              <span>Cryptographic Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="AES Mode"
                options={[
                  { value: 'CBC', label: 'AES-CBC' },
                  { value: 'CTR', label: 'AES-CTR' },
                  { value: 'GCM', label: 'AES-GCM (Authenticated)' }
                ]}
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
              />

              <Select
                label="Ciphertext Format"
                options={[
                  { value: 'base64', label: 'Base64 String' },
                  { value: 'hex', label: 'Hexadecimal Bytes' }
                ]}
                value={cipherFormat}
                onChange={(e) => setCipherFormat(e.target.value as any)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Secret Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter key"
                    className="flex-1 h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 font-mono"
                  />
                  <select
                    value={keyFormat}
                    onChange={(e) => setKeyFormat(e.target.value as any)}
                    className="w-24 h-10 px-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="utf8">UTF-8</option>
                    <option value="hex">HEX</option>
                  </select>
                </div>
                <span className="text-[10px] text-text-muted mt-1 block">Pads/truncates to 16/24/32 bytes</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Initialization Vector (IV)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={iv}
                    onChange={(e) => setIv(e.target.value)}
                    placeholder="Enter IV"
                    className="flex-1 h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 font-mono"
                  />
                  <select
                    value={ivFormat}
                    onChange={(e) => setIvFormat(e.target.value as any)}
                    className="w-24 h-10 px-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="utf8">UTF-8</option>
                    <option value="hex">HEX</option>
                  </select>
                </div>
                <span className="text-[10px] text-text-muted mt-1 block">
                  {mode === 'GCM' ? 'Pads/truncates to 12 bytes' : 'Pads/truncates to 16 bytes'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Outputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">
              {action === 'encrypt' ? 'Ciphertext Output' : 'Plaintext Output'}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSwap} disabled={!output || !!error} icon={<Copy className="h-3.5 w-3.5" />}>Swap</Button>
              {output && !error && <CopyButton value={output} label="Copy Output" />}
            </div>
          </div>
          <div className="relative">
            <GradientBox
              value={error ? '' : output}
              placeholder={error ? '' : "Conversion output will appear here..."}
              className="h-[430px] font-mono leading-relaxed"
            />
            {error && (
              <div className="absolute inset-0 z-20 p-4 rounded-lg bg-error/5 border border-error/20 text-error text-sm font-mono overflow-auto">
                <span className="font-bold block mb-1">Cryptographic Error:</span>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
