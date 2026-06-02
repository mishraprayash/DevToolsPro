'use client';

import * as React from 'react';
import { Clock, Calendar, Earth, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  parseInput,
  toEpochSeconds,
  toEpochMilliseconds,
  toEpochMicroseconds,
  toEpochNanoseconds,
  formatInTimezone,
  listTimeZones,
  getRelativeTime,
  addSubtractDate,
  computeDateDifference
} from '@/tools/date-toolbox/utils';

export default function Page() {
  const [activeTab, setActiveTab] = React.useState<'converter' | 'calculator'>('converter');

  // --- Converter States ---
  const [epochInput, setEpochInput] = React.useState('');
  const [liveEpoch, setLiveEpoch] = React.useState(0);
  const [targetTz, setTargetTz] = React.useState('UTC');
  const [convResult, setConvResult] = React.useState<any>(null);

  React.useEffect(() => {
    setLiveEpoch(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => setLiveEpoch(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!epochInput) {
      setConvResult(null);
      return;
    }
    const res = parseInput(epochInput);
    if (res.success) {
      setConvResult({
        date: new Date(res.dateMs),
        sec: toEpochSeconds(res.dateMs),
        ms: toEpochMilliseconds(res.dateMs),
        relative: getRelativeTime(res.dateMs),
        tzFormat: formatInTimezone(res.dateMs, targetTz)
      });
    } else {
      setConvResult(null);
    }
  }, [epochInput, targetTz]);

  const loadLiveEpoch = () => {
    setEpochInput(String(liveEpoch));
    toast({ type: 'success', message: 'Current epoch timestamp loaded!' });
  };

  // --- Calculator States ---
  const [calcAction, setCalcAction] = React.useState<'add' | 'subtract' | 'difference'>('add');
  const [baseDate, setBaseDate] = React.useState('');
  const [offsetYears, setOffsetYears] = React.useState(0);
  const [offsetMonths, setOffsetMonths] = React.useState(0);
  const [offsetDays, setOffsetDays] = React.useState(0);
  
  const [endDate, setEndDate] = React.useState('');
  const [calcResult, setCalcResult] = React.useState<string | null>(null);

  const handleCalculate = () => {
    try {
      const d1 = baseDate ? new Date(baseDate) : new Date();
      if (isNaN(d1.getTime())) {
        toast({ type: 'error', message: 'Invalid base date format.' });
        return;
      }

      if (calcAction === 'difference') {
        const d2 = endDate ? new Date(endDate) : new Date();
        if (isNaN(d2.getTime())) {
          toast({ type: 'error', message: 'Invalid end date format.' });
          return;
        }
        const diff = computeDateDifference(d1, d2);
        setCalcResult(
          `Difference Metrics:\n- Total Calendar Days: ${diff.totalDays}\n- Week Layout: ${diff.weeks} weeks and ${diff.remainingDays} days\n- Split Breakdown: ${diff.years} years, ${diff.remainingMonths} months, and ${diff.remainingDaysInMonth} days\n- Mon-Fri Business Days: ${diff.businessDays}`
        );
      } else {
        const outDate = addSubtractDate(d1, { years: offsetYears, months: offsetMonths, weeks: 0, days: offsetDays }, calcAction);
        setCalcResult(`Modified Date Result:\n- Local format: ${outDate.toLocaleString()}\n- ISO Standard: ${outDate.toISOString()}\n- Unix Epoch: ${Math.floor(outDate.getTime() / 1000)}`);
      }
    } catch (err) {
      toast({ type: 'error', message: `Calculation failed: ${(err as Error).message}` });
    }
  };

  return (
    <ToolLayout
      name="Date, Time & Epoch Sandbox"
      description="Consolidated calendar workspace to parse Unix epoch values, offset timestamps, and calculate accurate calendar business day spans"
      category="Date & Time"
    >
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border overflow-x-auto scrollbar-hide max-w-md">
        <button
          onClick={() => setActiveTab('converter')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'converter'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Epoch Converter
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'calculator'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          Date Arithmetic
        </button>
      </div>

      <div className="mt-6">
        {/* CONVERTER TAB */}
        {activeTab === 'converter' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-border bg-bg-secondary flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Live Epoch Timestamp</span>
                  <span className="text-xl font-bold font-mono text-accent leading-none mt-1 block">{liveEpoch}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={loadLiveEpoch} icon={<RefreshCw className="h-3.5 w-3.5" />}>Load Live</Button>
              </div>

              <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-4 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Timestamp or ISO String</label>
                  <input
                    type="text"
                    value={epochInput}
                    onChange={(e) => setEpochInput(e.target.value)}
                    placeholder="e.g. 1717282800 or 2026-06-01T00:00:00Z"
                    className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                  />
                </div>

                <Select
                  label="Target Format Timezone"
                  options={listTimeZones().map(tz => ({ value: tz, label: tz }))}
                  value={targetTz}
                  onChange={(e) => setTargetTz(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-semibold text-text-primary">Parsed Date Results</h2>
              {convResult ? (
                <div className="grid grid-cols-1 gap-3.5">
                  <div className="bg-bg-secondary p-4 rounded-xl border border-border">
                    <span className="text-xs text-text-muted block mb-1">Timezone representation ({targetTz})</span>
                    <span className="text-sm font-semibold text-text-primary font-mono">{convResult.tzFormat}</span>
                  </div>
                  <div className="bg-bg-secondary p-4 rounded-xl border border-border">
                    <span className="text-xs text-text-muted block mb-1">Relative time</span>
                    <span className="text-sm font-semibold text-success font-outfit">{convResult.relative}</span>
                  </div>
                  <div className="bg-bg-secondary p-4 rounded-xl border border-border">
                    <span className="text-xs text-text-muted block mb-1">Epoch Seconds</span>
                    <span className="text-sm font-semibold text-text-primary font-mono">{convResult.sec}</span>
                  </div>
                  <div className="bg-bg-secondary p-4 rounded-xl border border-border">
                    <span className="text-xs text-text-muted block mb-1">Epoch Milliseconds</span>
                    <span className="text-sm font-semibold text-text-primary font-mono">{convResult.ms}</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 rounded-xl bg-bg-tertiary border border-dashed border-border flex items-center justify-center text-text-muted italic text-sm">
                  Enter a numeric epoch value or date string above to display parse results.
                </div>
              )}
            </div>
          </div>
        )}

        {/* CALCULATOR TAB */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-text-primary">Calculation Configurations</h2>
              <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-4 shadow-sm">
                <Select
                  label="Select Action Type"
                  options={[
                    { value: 'add', label: 'Add Offset Time' },
                    { value: 'subtract', label: 'Subtract Offset Time' },
                    { value: 'difference', label: 'Calculate Date Difference Spans' }
                  ]}
                  value={calcAction}
                  onChange={(e) => setCalcAction(e.target.value as any)}
                />

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Base Reference Date</label>
                  <input
                    type="date"
                    value={baseDate}
                    onChange={(e) => setBaseDate(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                {calcAction !== 'difference' ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1 block">Years</label>
                      <input
                        type="number"
                        value={offsetYears}
                        onChange={(e) => setOffsetYears(parseInt(e.target.value, 10) || 0)}
                        className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1 block">Months</label>
                      <input
                        type="number"
                        value={offsetMonths}
                        onChange={(e) => setOffsetMonths(parseInt(e.target.value, 10) || 0)}
                        className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1 block">Days</label>
                      <input
                        type="number"
                        value={offsetDays}
                        onChange={(e) => setOffsetDays(parseInt(e.target.value, 10) || 0)}
                        className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Target End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>

              <Button onClick={handleCalculate} className="w-full h-11" icon={<Calendar className="h-4 w-4" />}>
                Execute Date Calculation
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">Calculation Results</h2>
                {calcResult && <CopyButton value={calcResult} label="Copy Results" />}
              </div>
              <GradientBox value={calcResult || ''} placeholder="Calculated results will appear here..." className="min-h-[220px] font-mono leading-relaxed" />
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
