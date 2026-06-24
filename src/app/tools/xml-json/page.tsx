'use client';

import * as React from 'react';
import { RotateCcw, ArrowRight, Settings, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import {
  xmlToJson,
  jsonToXml,
  validateXml
} from '@/tools/xml-json/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

import { HistoryDrawer } from '@/components/tool/HistoryDrawer';
import { useAppStore, type HistoryItem } from '@/lib/store/useStore';

const indentOptions = [
  { value: '2', label: '2 Spaces' },
  { value: '4', label: '4 Spaces' },
];

const examples = [
  {
    label: 'XML → JSON (Web App Config)',
    input: `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <appSettings>
    <add key="Environment" value="Production" />
    <add key="EnableLogging" value="true" />
    <add key="MaxRetries" value="5" />
  </appSettings>
  <connectionStrings>
    <add name="DefaultConnection" connectionString="Server=db.example.com;Database=prod;" providerName="System.Data.SqlClient" />
  </connectionStrings>
</configuration>`,
    mode: 'xml' as const,
  },
  {
    label: 'XML → JSON (Book Catalog)',
    input: `<?xml version="1.0"?>
<catalog>
  <book id="bk101">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <genre>Computer</genre>
    <price>44.95</price>
    <publish_date>2000-10-01</publish_date>
    <description>An in-depth look at creating XML structures.</description>
  </book>
  <book id="bk102">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <genre>Fantasy</genre>
    <price>5.95</price>
    <publish_date>2000-12-16</publish_date>
    <description>A former athlete decides to marry his sweetheart.</description>
  </book>
</catalog>`,
    mode: 'xml' as const,
  },
  {
    label: 'JSON → XML (Store Inventory)',
    input: `{
  "store": {
    "@_name": "Tech Emporium",
    "@_location": "San Francisco",
    "products": {
      "product": [
        {
          "id": 101,
          "name": "Wireless Mouse",
          "price": 29.99,
          "instock": true,
          "categories": {
            "category": ["Electronics", "Accessories"]
          }
        },
        {
          "id": 102,
          "name": "Mechanical Keyboard",
          "price": 89.99,
          "instock": false,
          "categories": {
            "category": ["Electronics", "Peripherals"]
          }
        }
      ]
    }
  }
}`,
    mode: 'json' as const,
  }
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].input);
  const [output, setOutput] = React.useState('');
  const [mode, setMode] = React.useState<'xml' | 'json'>('xml');
  const [indent, setIndent] = React.useState('2');
  const [ignoreAttributes, setIgnoreAttributes] = React.useState(false);
  const [attributePrefix, setAttributePrefix] = React.useState('@_');
  const [parseValues, setParseValues] = React.useState(true);
  const [activeExample, setActiveExample] = React.useState(0);
  const { addHistoryItem } = useAppStore();

  // Live validation
  const validation = React.useMemo(() => {
    if (!input.trim() || mode !== 'xml') return null;
    return validateXml(input);
  }, [input, mode]);

  const handleProcess = React.useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      const indentVal = parseInt(indent, 10);
      const opts = {
        indent: indentVal,
        ignoreAttributes,
        attributePrefix,
        parseValues,
        format: true
      };

      const result = mode === 'xml'
        ? xmlToJson(input, opts)
        : jsonToXml(input, opts);

      setOutput(result);

      if (!result.startsWith('Error') && !result.startsWith('Invalid')) {
        addHistoryItem('xml-json', input.slice(0, 1000), result.slice(0, 1000), { mode });
      }
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, mode, indent, ignoreAttributes, attributePrefix, parseValues, addHistoryItem]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setMode(examples[i].mode);
    setInput(examples[i].input);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setActiveExample(-1);
  };

  const handleSwap = () => {
    if (!output || output.startsWith('Invalid')) return;
    setMode((m) => m === 'xml' ? 'json' : 'xml');
    setInput(output);
    setOutput('');
    setActiveExample(-1);
    toast({ type: 'success', message: 'Swapped conversion direction and input data!' });
  };

  const handleDownload = () => {
    if (!output || output.startsWith('Invalid')) return;
    const isTargetXml = mode === 'json';
    const blob = new Blob([output], { type: isTargetXml ? 'application/xml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isTargetXml ? 'converted.xml' : 'converted.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: 'success', message: `Downloaded converted.${isTargetXml ? 'xml' : 'json'}` });
  };

  const handleRestore = (item: HistoryItem) => {
    setInput(item.input);
    if (item.metadata?.mode) {
      setMode(item.metadata.mode);
    }
  };

  return (
    <ToolLayout 
      name="XML ↔ JSON Converter" 
      description="Convert bidirectionally between XML and JSON documents with support for node attributes, parsing options, value conversion, and precise syntax validation" 
      category="Formatting"
      historyComponent={<HistoryDrawer toolId="xml-json" onRestore={handleRestore} />}
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side Inputs */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-text-secondary">Input Code</h2>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider',
                mode === 'xml' 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              )}>
                {mode === 'xml' ? 'XML' : 'JSON'}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
              Clear
            </Button>
          </div>

          <Input 
            value={input} 
            onChange={(e) => { 
              setInput(e.target.value); 
              setActiveExample(-1); 
            }} 
            onDropText={(text) => {
              setInput(text);
              setActiveExample(-1);
            }}
            placeholder={mode === 'json' ? '{"key": "value"}' : '<root><key>value</key></root>'} 
            monospace 
            className="h-[320px]" 
          />

          {/* Validation Banner (XML only) */}
          {validation && (
            <div className={cn(
              'p-3.5 rounded-xl border flex items-start gap-2.5 text-xs shadow-sm animate-fade-in',
              validation.valid 
                ? 'bg-success/5 border-success/20 text-success font-semibold' 
                : 'bg-error/10 border-error/20 text-error'
            )}>
              {validation.valid ? (
                <>
                  <CheckCircle className="h-4 w-4 shrink-0 text-success mt-0.5" />
                  <span>Valid XML Structure</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 shrink-0 text-error mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">XML Parse Alert</span>
                    <p className="leading-relaxed">
                      {validation.error} {validation.line ? `(Line: ${validation.line})` : ''}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Advanced Configurations */}
          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
              <Settings className="h-4 w-4 text-accent" />
              <span>Conversion Preferences</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Indent Spacing"
                options={indentOptions}
                value={indent}
                onChange={(e) => setIndent(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Attribute Prefix</label>
                <input
                  type="text"
                  value={attributePrefix}
                  onChange={(e) => setAttributePrefix(e.target.value)}
                  placeholder="@_"
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ignoreAttributes}
                  onChange={(e) => setIgnoreAttributes(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent bg-bg-tertiary h-4 w-4"
                />
                <span className="text-xs text-text-secondary font-medium">Ignore Attributes</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={parseValues}
                  onChange={(e) => setParseValues(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent bg-bg-tertiary h-4 w-4"
                />
                <span className="text-xs text-text-secondary font-medium">Auto-Parse Values</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side Outputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-text-secondary">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent font-bold">
                  Converted Output
                </span>
              </h2>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider',
                mode === 'xml' 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              )}>
                {mode === 'xml' ? 'JSON' : 'XML'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSwap} 
                disabled={!output || output.startsWith('Invalid') || output.startsWith('Error')}
                icon={<ArrowRight className="h-4 w-4" />}
                title="Swap Inputs"
              >
                Swap
              </Button>
              <CopyButton value={output} disabled={!output || output.startsWith('Invalid')} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={!output || output.startsWith('Invalid')}
                icon={<Download className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
          </div>

          <GradientBox value={output} placeholder="Output code will appear here..." className="h-[400px]" />
          
          {output && !output.startsWith('Invalid') && (
            <span className="text-xs text-text-muted font-medium block">
              {output.length.toLocaleString()} characters · {output.split('\n').length.toLocaleString()} lines
            </span>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
