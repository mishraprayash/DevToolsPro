'use client';

import * as React from 'react';
import { KeyRound, Download, RefreshCw, Eye, EyeOff, Shield, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { signPayloadRsa, verifySignatureRsa, type GeneratedKeypair } from '@/tools/rsa-sandbox/utils';

const keySizeOptions = [
  { value: '1024', label: '1024 bits (Weak - Testing only)' },
  { value: '2048', label: '2048 bits (Standard - Recommended)' },
  { value: '4096', label: '4096 bits (Extra Secure)' },
];

const hashOptions = [
  { value: 'SHA-256', label: 'SHA-256' },
  { value: 'SHA-384', label: 'SHA-384' },
  { value: 'SHA-512', label: 'SHA-512' },
];

export default function Page() {
  const [activeTab, setActiveTab] = React.useState<'generate' | 'sign' | 'verify'>('generate');

  // --- Generate Tab States ---
  const [keySize, setKeySize] = React.useState('2048');
  const [hashAlgo, setHashAlgo] = React.useState('SHA-256');
  const [keypair, setKeypair] = React.useState<GeneratedKeypair | null>(null);
  const [generateLoading, setGenerateLoading] = React.useState(false);
  const [showPrivateKey, setShowPrivateKey] = React.useState(false);

  // --- Sign Tab States ---
  const [privateKey, setPrivateKey] = React.useState('');
  const [signPayload, setSignPayload] = React.useState('Hello World! Sign this payload using RSA.');
  const [signHash, setSignHash] = React.useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256');
  const [signatureOutput, setSignatureOutput] = React.useState('');
  const [signError, setSignError] = React.useState<string | null>(null);
  const [signLoading, setSignLoading] = React.useState(false);

  // --- Verify Tab States ---
  const [publicKey, setPublicKey] = React.useState('');
  const [verifyPayload, setVerifyPayload] = React.useState('Hello World! Sign this payload using RSA.');
  const [verifySignature, setVerifySignature] = React.useState('');
  const [verifyHash, setVerifyHash] = React.useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256');
  const [verificationResult, setVerificationResult] = React.useState<boolean | null>(null);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = React.useState(false);

  // Sync generated keys directly into Sign / Verify inputs for seamless UX
  const loadGeneratedToSign = () => {
    if (!keypair) return;
    setPrivateKey(keypair.privateKey);
    setActiveTab('sign');
    toast({ type: 'success', message: 'Private Key loaded into Signer tool!' });
  };

  const loadGeneratedToVerify = () => {
    if (!keypair) return;
    setPublicKey(keypair.publicKey);
    setActiveTab('verify');
    toast({ type: 'success', message: 'Public Key loaded into Verifier tool!' });
  };

  const handleGenerate = async () => {
    setGenerateLoading(true);
    setKeypair(null);
    try {
      const worker = new Worker(new URL('@/tools/rsa-sandbox/rsa-worker.ts', import.meta.url), { type: 'module' });
      const result = await new Promise<GeneratedKeypair>((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data.success) {
            resolve(e.data.result);
          } else {
            reject(new Error(e.data.error));
          }
          worker.terminate();
        };
        worker.onerror = () => {
          reject(new Error("Worker generation error"));
          worker.terminate();
        };
        worker.postMessage({
          keySize: parseInt(keySize, 10),
          hashAlgorithm: hashAlgo,
        });
      });

      setKeypair(result);
      toast({ type: 'success', message: 'RSA Key pair generated successfully via Web Worker!' });
    } catch (e) {
      toast({ type: 'error', message: `Generation failed: ${(e as Error).message}` });
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleSign = async () => {
    if (!privateKey.trim()) {
      toast({ type: 'error', message: 'Please enter a Private Key first.' });
      return;
    }
    setSignLoading(true);
    setSignatureOutput('');
    setSignError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const sig = await signPayloadRsa(privateKey, signPayload, signHash);
      setSignatureOutput(sig);
      toast({ type: 'success', message: 'Signature generated!' });
    } catch (e) {
      setSignError((e as Error).message);
    } finally {
      setSignLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!publicKey.trim()) {
      toast({ type: 'error', message: 'Please enter a Public Key.' });
      return;
    }
    if (!verifySignature.trim()) {
      toast({ type: 'error', message: 'Please enter the Signature.' });
      return;
    }
    setVerifyLoading(true);
    setVerificationResult(null);
    setVerifyError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const isValid = await verifySignatureRsa(publicKey, verifyPayload, verifySignature, verifyHash);
      setVerificationResult(isValid);
      if (isValid) {
        toast({ type: 'success', message: 'Signature is VALID!' });
      } else {
        toast({ type: 'error', message: 'Signature is INVALID!' });
      }
    } catch (e) {
      setVerifyError((e as Error).message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDownload = (keyText: string, filename: string) => {
    const blob = new Blob([keyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: 'success', message: `Downloaded ${filename}` });
  };

  return (
    <ToolLayout
      name="RSA Cryptography Sandbox"
      description="All-in-one RSA sandbox to generate secure keys, generate signatures, and verify cryptographic payloads"
      category="Security"
    >
      {/* Navigation tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border overflow-x-auto scrollbar-hide max-w-md">
        <button
          onClick={() => setActiveTab('generate')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'generate'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Key Generator
        </button>
        <button
          onClick={() => setActiveTab('sign')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'sign'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Signature Signer
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'verify'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Shield className="h-3.5 w-3.5" />
          Signature Verifier
        </button>
      </div>

      <div className="mt-6">
        {/* GENERATOR TAB */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-text-primary">Key Configuration</h2>
              <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-4 shadow-sm">
                <Select
                  label="RSA Modulus Length (Key Size)"
                  options={keySizeOptions}
                  value={keySize}
                  onChange={(e) => setKeySize(e.target.value)}
                />
                <Select
                  label="Hashing Signature Algorithm"
                  options={hashOptions}
                  value={hashAlgo}
                  onChange={(e) => setHashAlgo(e.target.value)}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateLoading}
                className="w-full h-12 text-sm font-semibold"
                icon={generateLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              >
                {generateLoading ? 'Computing Prime Factors...' : 'Generate New RSA Keypair'}
              </Button>
            </div>

            <div className="space-y-6">
              <h2 className="text-base font-semibold text-text-primary">Exported PEM Keys</h2>
              {keypair ? (
                <div className="space-y-6">
                  {/* Public Key Display */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Public Key</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={loadGeneratedToVerify} className="text-accent hover:bg-accent/5">
                          Load to Verifier
                        </Button>
                        <CopyButton value={keypair.publicKey} size="sm" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(keypair.publicKey, 'id_rsa_pub.pem')}
                          icon={<Download className="h-3.5 w-3.5" />}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                    <GradientBox value={keypair.publicKey} className="min-h-[120px] text-xs" />
                  </div>

                  {/* Private Key Display */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Private Key</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={loadGeneratedToSign} className="text-accent hover:bg-accent/5">
                          Load to Signer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          icon={showPrivateKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        >
                          {showPrivateKey ? 'Hide Key' : 'Reveal'}
                        </Button>
                        <CopyButton value={keypair.privateKey} size="sm" disabled={!showPrivateKey} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(keypair.privateKey, 'id_rsa.pem')}
                          icon={<Download className="h-3.5 w-3.5" />}
                          disabled={!showPrivateKey}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                    {showPrivateKey ? (
                      <GradientBox value={keypair.privateKey} className="min-h-[180px] text-xs" />
                    ) : (
                      <div className="w-full h-24 rounded-lg bg-bg-tertiary border border-border border-dashed flex flex-col items-center justify-center text-text-muted text-xs gap-1">
                        <EyeOff className="h-4 w-4 opacity-40" />
                        <span>Private key is hidden. Click Reveal to inspect.</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[260px] rounded-xl bg-bg-tertiary border border-border border-dashed text-text-muted text-sm italic gap-2 text-center p-6">
                  <KeyRound className="h-8 w-8 opacity-30 animate-pulse-glow" />
                  <div>
                    <p className="font-semibold text-text-secondary not-italic text-sm">No Keypair Generated</p>
                    <p className="text-xs text-text-muted max-w-xs mt-0.5">Click 'Generate New RSA Keypair' on the left to compute a secure key pair.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SIGNER TAB */}
        {activeTab === 'sign' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-text-primary">Sign Configuration</h2>
              <div className="space-y-4 p-5 rounded-xl border border-border bg-bg-secondary shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Private Key (PEM format)</label>
                  <textarea
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                    className="w-full min-h-[160px] p-3 rounded-lg bg-bg-tertiary border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Message Payload to Sign</label>
                  <textarea
                    value={signPayload}
                    onChange={(e) => setSignPayload(e.target.value)}
                    className="w-full min-h-[80px] p-3 rounded-lg bg-bg-tertiary border border-border text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <Select
                  label="Signature Hashing Algorithm"
                  options={hashOptions}
                  value={signHash}
                  onChange={(e) => setSignHash(e.target.value as any)}
                />
              </div>

              <Button
                onClick={handleSign}
                disabled={signLoading}
                className="w-full h-11 text-sm font-semibold"
                icon={signLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              >
                {signLoading ? 'Signing Payload...' : 'Generate Cryptographic Signature'}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">Base64 Signature Output</h2>
                {signatureOutput && <CopyButton value={signatureOutput} label="Copy Signature" />}
              </div>

              {signatureOutput ? (
                <div className="space-y-4">
                  <GradientBox value={signatureOutput} className="min-h-[180px] text-xs font-mono" />
                  <div className="p-3.5 rounded-lg bg-success/5 border border-success/20 text-success text-xs flex items-start gap-2">
                    <Check className="h-4.5 w-4.5 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold block">Signature successfully generated!</span>
                      <span className="text-text-secondary mt-0.5 block leading-relaxed">
                        Copy this signature along with the payload message to verify the transmission integrity.
                      </span>
                    </div>
                  </div>
                </div>
              ) : signError ? (
                <div className="p-4 rounded-xl border border-error/20 bg-error/5 text-error flex items-start gap-2.5 text-xs">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Signing Failure</span>
                    <p className="mt-1 leading-relaxed text-text-secondary">{signError}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[220px] rounded-xl bg-bg-tertiary border border-border border-dashed text-text-muted text-sm italic gap-2 text-center p-6">
                  <Sparkles className="h-8 w-8 opacity-30 animate-pulse-glow" />
                  <div>
                    <p className="font-semibold text-text-secondary not-italic text-sm">No Active Signature</p>
                    <p className="text-xs text-text-muted max-w-xs mt-0.5">Input a secure private key and message payload, then click sign.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VERIFIER TAB */}
        {activeTab === 'verify' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-text-primary">Verification Parameters</h2>
              <div className="space-y-4 p-5 rounded-xl border border-border bg-bg-secondary shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Public Key (PEM format)</label>
                  <textarea
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="-----BEGIN PUBLIC KEY-----&#10;..."
                    className="w-full min-h-[140px] p-3 rounded-lg bg-bg-tertiary border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Original Message Payload</label>
                  <textarea
                    value={verifyPayload}
                    onChange={(e) => setVerifyPayload(e.target.value)}
                    className="w-full min-h-[70px] p-3 rounded-lg bg-bg-tertiary border border-border text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Base64 Signature</label>
                  <textarea
                    value={verifySignature}
                    onChange={(e) => setVerifySignature(e.target.value)}
                    placeholder="Paste signature generated by signer..."
                    className="w-full min-h-[70px] p-3 rounded-lg bg-bg-tertiary border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                  />
                </div>
                <Select
                  label="Hashing Signature Algorithm"
                  options={hashOptions}
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value as any)}
                />
              </div>

              <Button
                onClick={handleVerify}
                disabled={verifyLoading}
                className="w-full h-11 text-sm font-semibold"
                icon={verifyLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              >
                {verifyLoading ? 'Validating Signature...' : 'Verify Signature Integrity'}
              </Button>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-semibold text-text-primary">Verification Status</h2>
              {verificationResult !== null ? (
                <div className={cn(
                  'p-5 rounded-xl border flex flex-col items-center justify-center text-center gap-4 animate-fade-in min-h-[220px]',
                  verificationResult 
                    ? 'bg-success/5 border-success/20 text-success' 
                    : 'bg-error/5 border-error/20 text-error'
                )}>
                  {verificationResult ? (
                    <>
                      <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20 shadow-sm">
                        <Check className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-outfit">Cryptographically Verified!</h3>
                        <p className="text-xs text-text-secondary mt-1 max-w-xs leading-relaxed">
                          The signature perfectly matches the original payload message and the public key provided. Integrity is intact.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-full bg-error/10 flex items-center justify-center text-error border border-error/20 shadow-sm">
                        <X className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-outfit">Signature Mismatch!</h3>
                        <p className="text-xs text-text-secondary mt-1 max-w-xs leading-relaxed">
                          Verification failed. The payload has either been modified in transit, or the keypair/algorithm signature does not align.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : verifyError ? (
                <div className="p-4 rounded-xl border border-error/20 bg-error/5 text-error flex items-start gap-2.5 text-xs">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Verification Error</span>
                    <p className="mt-1 leading-relaxed text-text-secondary">{verifyError}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[220px] rounded-xl bg-bg-tertiary border border-border border-dashed text-text-muted text-sm italic gap-2 text-center p-6">
                  <Shield className="h-8 w-8 opacity-30 animate-pulse-glow" />
                  <div>
                    <p className="font-semibold text-text-secondary not-italic text-sm">Awaiting Parameters</p>
                    <p className="text-xs text-text-muted max-w-xs mt-0.5">Fill out all public signature variables on the left, then click verify.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
