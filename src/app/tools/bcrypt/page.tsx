'use client';

import * as React from 'react';
import { Shield, Key, CheckCircle, XCircle } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { generateBcryptHash, compareBcryptHash } from '@/tools/bcrypt/utils';

export default function Page() {
  const [password, setPassword] = React.useState('');
  const [rounds, setRounds] = React.useState<number>(10);
  const [hash, setHash] = React.useState('');
  
  const [comparePassword, setComparePassword] = React.useState('');
  const [compareHashStr, setCompareHashStr] = React.useState('');
  const [isMatch, setIsMatch] = React.useState<boolean | null>(null);

  const handleGenerate = () => {
    if (!password) return;
    const res = generateBcryptHash(password, rounds);
    if (res.success) {
      setHash(res.data);
    }
  };

  const handleCompare = () => {
    if (!comparePassword || !compareHashStr) return;
    const res = compareBcryptHash(comparePassword, compareHashStr);
    if (res.success) {
      setIsMatch(res.data);
    } else {
      setIsMatch(null);
    }
  };

  return (
    <ToolLayout
      name="Bcrypt Generator & Checker"
      description="Quickly generate and verify Bcrypt hashes with configurable salt rounds."
      category="Security"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Generator */}
        <div className="space-y-4 p-5 rounded-xl border border-border bg-bg-secondary">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-accent" />
            <h2 className="text-base font-bold text-text-primary">Generate Hash</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Plain Text Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter text to hash..."
              className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Salt Rounds</label>
            <input 
              type="number"
              value={rounds}
              onChange={(e) => setRounds(parseInt(e.target.value) || 10)}
              min={4}
              max={20}
              className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
            <p className="text-xs text-text-muted mt-1">Higher rounds = slower, more secure (Default: 10)</p>
          </div>

          <Button onClick={handleGenerate} className="w-full" disabled={!password}>
            Generate Bcrypt Hash
          </Button>

          {hash && (
            <div className="mt-4 p-3 rounded bg-bg-tertiary border border-border flex items-center justify-between gap-3 font-mono text-sm break-all">
              <span className="text-text-primary break-all">{hash}</span>
              <CopyButton value={hash} />
            </div>
          )}
        </div>

        {/* Checker */}
        <div className="space-y-4 p-5 rounded-xl border border-border bg-bg-secondary">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-accent" />
            <h2 className="text-base font-bold text-text-primary">Verify Hash</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Plain Text</label>
            <input 
              type="text"
              value={comparePassword}
              onChange={(e) => {
                setComparePassword(e.target.value);
                setIsMatch(null);
              }}
              placeholder="Text to verify..."
              className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Bcrypt Hash</label>
            <input 
              type="text"
              value={compareHashStr}
              onChange={(e) => {
                setCompareHashStr(e.target.value);
                setIsMatch(null);
              }}
              placeholder="$2a$10$..."
              className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <Button onClick={handleCompare} className="w-full" variant="secondary" disabled={!comparePassword || !compareHashStr}>
            Compare
          </Button>

          {isMatch !== null && (
            <div className={`mt-4 p-4 rounded-xl flex flex-col items-center justify-center border ${isMatch ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
              {isMatch ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <span className="font-bold text-green-500">Match!</span>
                  <span className="text-xs text-green-600/70 mt-1">The text matches the hash.</span>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-500 mb-2" />
                  <span className="font-bold text-red-500">Do Not Match</span>
                  <span className="text-xs text-red-600/70 mt-1">The text does not correspond to the hash.</span>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </ToolLayout>
  );
}
