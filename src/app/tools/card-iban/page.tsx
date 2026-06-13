'use client';

import * as React from 'react';
import { CreditCard, Banknote, Copy, Check, RotateCcw, Sparkles, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CopyButton } from '@/components/ui/CopyButton';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { cn } from '@/lib/utils';
import {
  CARD_BRANDS,
  generateCardNumber,
  formatCardNumber,
  validateCardNumber,
  identifyBrand,
  type CardBrand,
  type CardValidationResult,
  IBAN_COUNTRIES,
  validateIban,
  type IbanCountry,
  type IbanValidationResult,
} from '@/tools/card-iban/utils';

type Tab = 'card' | 'iban';

const cardExamples = CARD_BRANDS.map((b) => ({ label: b.code.charAt(0).toUpperCase() + b.code.slice(1) }));

const ibanExamples = [
  { label: 'Germany' },
  { label: 'France' },
  { label: 'UK' },
  { label: 'Spain' },
  { label: 'Italy' },
  { label: 'Netherlands' },
];

function CardSection() {
  const [selectedBrand, setSelectedBrand] = React.useState<CardBrand>(CARD_BRANDS[0]);
  const [generatedCard, setGeneratedCard] = React.useState('');
  const [generatedFormatted, setGeneratedFormatted] = React.useState('');
  const [validateInput, setValidateInput] = React.useState('');
  const [validationResult, setValidationResult] = React.useState<CardValidationResult | null>(null);
  const [bulkCount, setBulkCount] = React.useState(5);
  const [bulkCards, setBulkCards] = React.useState<string[]>([]);

  React.useEffect(() => {
    generate();
  }, [selectedBrand]);

  const generate = () => {
    const num = generateCardNumber(selectedBrand);
    setGeneratedCard(num);
    setGeneratedFormatted(formatCardNumber(num, selectedBrand));
  };

  const generateBulk = () => {
    const cards: string[] = [];
    for (let i = 0; i < bulkCount; i++) {
      cards.push(formatCardNumber(generateCardNumber(selectedBrand), selectedBrand));
    }
    setBulkCards(cards);
  };

  const handleValidate = (value: string) => {
    setValidateInput(value);
    if (value.replace(/\D/g, '').length >= 12) {
      setValidationResult(validateCardNumber(value));
    } else {
      setValidationResult(null);
    }
  };

  const applyExample = (index: number) => {
    setSelectedBrand(CARD_BRANDS[index]);
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Generate Section */}
      <div className="space-y-4 p-5 rounded-xl bg-bg-secondary border border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            Generate Test Card Numbers
          </h3>
        </div>

        <ExamplePills examples={cardExamples} activeIndex={CARD_BRANDS.indexOf(selectedBrand)} onSelect={applyExample} />

        <div className="flex items-center gap-3">
          <Select
            options={CARD_BRANDS.map((b) => ({ value: b.code, label: b.name }))}
            value={selectedBrand.code}
            onChange={(e) => {
              const brand = CARD_BRANDS.find((b) => b.code === e.target.value);
              if (brand) setSelectedBrand(brand);
            }}
          />
          <button onClick={generate} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-accent text-bg-primary text-sm font-medium hover:bg-accent-hover transition-colors active:scale-95 shrink-0">
            <RotateCcw className="h-4 w-4" />
            Generate
          </button>
        </div>

        {generatedFormatted && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-bg-tertiary border border-border">
            <CreditCard className="h-6 w-6 text-accent shrink-0" />
            <span className="text-lg font-mono tracking-wider text-text-primary flex-1">{generatedFormatted}</span>
            <CopyButton value={generatedCard} variant="ghost" size="sm" title="Copy raw number" />
          </div>
        )}

        {/* Bulk generate */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">Bulk:</label>
            <input
              type="number" min="1" max="50" value={bulkCount}
              onChange={(e) => setBulkCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              className="w-16 h-8 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm text-center font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <button onClick={generateBulk} className="text-xs px-3 h-8 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors">
            Generate {bulkCount} cards
          </button>
        </div>

        {bulkCards.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {bulkCards.map((card, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary/50 text-sm font-mono text-text-secondary">
                <span className="text-[10px] text-text-muted w-6">{i + 1}.</span>
                <span className="flex-1">{card}</span>
                <CopyButton value={card.replace(/\s/g, '')} variant="ghost" size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validate Section */}
      <div className="space-y-4 p-5 rounded-xl bg-bg-secondary border border-border">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Validate Card Number
        </h3>
        <Input
          value={validateInput}
          onChange={(e) => handleValidate(e.target.value)}
          placeholder="Paste a card number to validate..."
          monospace
          className="min-h-[60px]"
        />
        {validationResult && (
          <div className="space-y-3">
            <div className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg border text-sm',
              validationResult.valid
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-error/30 bg-error/10 text-error'
            )}>
              {validationResult.valid ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span className="font-medium">
                {validationResult.valid ? 'Valid card number' : 'Invalid card number'}
              </span>
            </div>

            {validationResult.brand && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-bg-tertiary border border-border">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Brand</p>
                  <p className="text-text-primary font-medium">{validationResult.brand.name}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-tertiary border border-border">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Formatted</p>
                  <p className="text-text-primary font-mono text-sm">{validationResult.formatted}</p>
                </div>
                <div className={cn('p-3 rounded-lg border', validationResult.luhnPass ? 'bg-bg-tertiary border-border' : 'bg-error/5 border-error/20')}>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Luhn Check</p>
                  <p className={cn('font-medium', validationResult.luhnPass ? 'text-success' : 'text-error')}>
                    {validationResult.luhnPass ? 'Passed' : 'Failed'}
                  </p>
                </div>
                <div className={cn('p-3 rounded-lg border', validationResult.lengthValid ? 'bg-bg-tertiary border-border' : 'bg-error/5 border-error/20')}>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Length</p>
                  <p className={cn('font-medium', validationResult.lengthValid ? 'text-success' : 'text-error')}>
                    {validationResult.lengthValid ? 'Valid' : 'Invalid'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IbanSection() {
  const [input, setInput] = React.useState('');
  const [result, setResult] = React.useState<IbanValidationResult | null>(null);
  const [selectedCountry, setSelectedCountry] = React.useState('');

  React.useEffect(() => {
    if (input.replace(/\s/g, '').length >= 4) {
      setResult(validateIban(input));
    } else {
      setResult(null);
    }
  }, [input]);

  const applyExample = (index: number) => {
    const examples = ['DE89370400440532013000', 'FR1420041010050500013M02606', 'GB29NWBK60161331926819', 'ES9121000418450200051332', 'IT60X0542811101000000123456', 'NL91ABNA0417164300'];
    setInput(examples[index]);
  };

  const countryOptions = [
    { value: '', label: 'Auto-detect country' },
    ...IBAN_COUNTRIES.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` })),
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-4 p-5 rounded-xl bg-bg-secondary border border-border">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Banknote className="h-4 w-4 text-accent" />
          Validate IBAN
        </h3>

        <ExamplePills examples={ibanExamples} activeIndex={-1} onSelect={applyExample} />

        <div className="flex items-center gap-3">
          <Select
            options={countryOptions}
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          />
        </div>

        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter IBAN to validate (e.g. DE89370400440532013000)"
          monospace
          className="min-h-[60px]"
        />

        {result && (
          <div className="space-y-3">
            <div className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg border text-sm',
              result.valid
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-error/30 bg-error/10 text-error'
            )}>
              {result.valid ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span className="font-medium">
                {result.valid ? 'Valid IBAN' : 'Invalid IBAN'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {result.country && (
                <div className="p-3 rounded-lg bg-bg-tertiary border border-border">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Country</p>
                  <p className="text-text-primary font-medium">{result.country.name} ({result.country.code})</p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-bg-tertiary border border-border">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Formatted</p>
                <p className="text-text-primary font-mono text-sm break-all">{result.formatted}</p>
              </div>
              <div className={cn('p-3 rounded-lg border', result.checksumPass ? 'bg-bg-tertiary border-border' : 'bg-error/5 border-error/20')}>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Checksum (Mod 97)</p>
                <p className={cn('font-medium', result.checksumPass ? 'text-success' : 'text-error')}>
                  {result.checksumPass ? 'Passed' : 'Failed'}
                </p>
              </div>
              {result.country && (
                <div className={cn('p-3 rounded-lg border', result.lengthValid ? 'bg-bg-tertiary border-border' : 'bg-error/5 border-error/20')}>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Length</p>
                  <p className={cn('font-medium', result.lengthValid ? 'text-success' : 'text-error')}>
                    {result.lengthValid ? `${result.country.length} chars (correct)` : `Expected ${result.country.length}, got ${input.replace(/\s/g, '').length}`}
                  </p>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-error/5 border border-error/20">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Errors</p>
                <ul className="space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-xs text-error flex items-start gap-1.5">
                      <span>•</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!input.trim() && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-bg-tertiary border border-border text-xs text-text-muted">
            <Info className="h-4 w-4 shrink-0" />
            Type or paste an IBAN above to validate. Detects country and verifies checksum automatically.
          </div>
        )}
      </div>

      {/* IBAN country reference */}
      <details className="group">
        <summary className="text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors select-none">
          IBAN format reference ({IBAN_COUNTRIES.length} countries)
        </summary>
        <div className="mt-3 max-h-80 overflow-y-auto border border-border rounded-xl">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-bg-secondary">
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 text-text-muted font-medium">Code</th>
                <th className="text-left px-4 py-2 text-text-muted font-medium">Country</th>
                <th className="text-right px-4 py-2 text-text-muted font-medium">Length</th>
                <th className="text-left px-4 py-2 text-text-muted font-medium hidden sm:table-cell">Format</th>
              </tr>
            </thead>
            <tbody>
              {IBAN_COUNTRIES.map((c) => (
                <tr key={c.code} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-2 font-mono text-text-primary">{c.code}</td>
                  <td className="px-4 py-2 text-text-primary">{c.name}</td>
                  <td className="px-4 py-2 text-right font-mono text-text-secondary">{c.length}</td>
                  <td className="px-4 py-2 text-text-muted font-mono text-[10px] hidden sm:table-cell">{c.format}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export default function Page() {
  const [tab, setTab] = React.useState<Tab>('card');

  return (
    <ToolLayout
      name="Card & IBAN Helper"
      description="Generate valid test credit card numbers (Luhn-checked) by brand, validate card numbers, and verify IBANs with country-specific checksum validation"
      category="Security"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-secondary border border-border w-fit">
          <button
            onClick={() => setTab('card')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              tab === 'card' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <CreditCard className="h-4 w-4" />
            Credit Card
          </button>
          <button
            onClick={() => setTab('iban')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              tab === 'iban' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Banknote className="h-4 w-4" />
            IBAN Validator
          </button>
        </div>

        {tab === 'card' ? <CardSection /> : <IbanSection />}
      </div>
    </ToolLayout>
  );
}
