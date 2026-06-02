'use client';

import * as React from 'react';
import { processAES } from '@/tools/aes/utils';
import { Shield, ArrowRightLeft, Copy, Check } from 'lucide-react';

export default function AESCryptoPage() {
  const [action, setAction] = React.useState<'encrypt' | 'decrypt'>('encrypt');
  const [mode, setMode] = React.useState<'CBC' | 'CTR' | 'GCM'>('CBC');
  const [input, setInput] = React.useState('');
  const [key, setKey] = React.useState('');
  const [keyFormat, setKeyFormat] = React.useState<'utf8' | 'hex'>('utf8');
  const [iv, setIv] = React.useState('');
  const [ivFormat, setIvFormat] = React.useState<'utf8' | 'hex'>('utf8');
  const [cipherFormat, setCipherFormat] = React.useState<'base64' | 'hex'>('base64');
  
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    async function performCrypto() {
      if (!input || !key || !iv) {
        setOutput('');
        setError('');
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

    performCrypto();
  }, [action, mode, input, key, keyFormat, iv, ivFormat, cipherFormat]);

  const copyToClipboard = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-indigo-500" />
          AES Encryption & Decryption
        </h1>
        <p className="text-zinc-400">
          Encrypt and decrypt text using Advanced Encryption Standard (AES) with CBC or CTR modes.
          Note: This tool runs entirely in your browser using the Web Crypto API.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <div className="flex bg-zinc-800/50 p-1 rounded-lg">
              <button
                onClick={() => setAction('encrypt')}
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                  action === 'encrypt' ? 'bg-indigo-500 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Encrypt
              </button>
              <button
                onClick={() => setAction('decrypt')}
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                  action === 'decrypt' ? 'bg-indigo-500 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Decrypt
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'CBC' | 'CTR' | 'GCM')}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="CBC">AES-CBC</option>
              <option value="CTR">AES-CTR</option>
              <option value="GCM">AES-GCM (Authenticated)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex justify-between">
              <span>Secret Key</span>
              <span className="text-zinc-500 text-xs">Pads/truncates to 16/24/32 bytes</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter secret key"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <select
                value={keyFormat}
                onChange={(e) => setKeyFormat(e.target.value as 'utf8' | 'hex')}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
              >
                <option value="utf8">UTF-8</option>
                <option value="hex">HEX</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex justify-between">
              <span>Initialization Vector (IV)</span>
              <span className="text-zinc-500 text-xs">
                {mode === 'GCM' ? 'Pads/truncates to 12 bytes' : 'Pads/truncates to 16 bytes'}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={iv}
                onChange={(e) => setIv(e.target.value)}
                placeholder="Enter IV"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <select
                value={ivFormat}
                onChange={(e) => setIvFormat(e.target.value as 'utf8' | 'hex')}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
              >
                <option value="utf8">UTF-8</option>
                <option value="hex">HEX</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Ciphertext Format</label>
            <select
              value={cipherFormat}
              onChange={(e) => setCipherFormat(e.target.value as 'base64' | 'hex')}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="base64">Base64</option>
              <option value="hex">HEX</option>
            </select>
          </div>
        </div>

        {/* I/O Fields */}
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-zinc-300">
              {action === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder={action === 'encrypt' ? 'Enter text to encrypt...' : 'Enter ciphertext to decrypt...'}
              spellCheck="false"
            />
          </div>

          <div className="flex justify-center">
            <ArrowRightLeft className={`w-6 h-6 text-zinc-600 ${action === 'encrypt' ? 'rotate-90' : '-rotate-90 md:rotate-0'} md:rotate-90`} />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-zinc-300 flex justify-between items-center">
              <span>{action === 'encrypt' ? 'Ciphertext' : 'Plaintext'} Output</span>
              {output && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </label>
            <textarea
              value={error ? '' : output}
              readOnly
              className={`w-full h-32 bg-zinc-900/80 border rounded-xl p-4 text-sm font-mono resize-none focus:outline-none ${
                error ? 'border-red-500/50 text-red-400' : 'border-zinc-800 text-indigo-300'
              }`}
              placeholder="Output will appear here..."
              spellCheck="false"
            />
            {error && (
              <div className="absolute inset-0 top-7 p-4 pointer-events-none text-red-400 text-sm font-mono">
                Error: {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
