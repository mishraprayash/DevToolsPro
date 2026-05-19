'use client';

import * as React from 'react';
import { Calendar, Plus, Minus, ArrowRight, RotateCcw, Briefcase, Clock, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { addSubtractDate, computeDateDifference, type DateOffset, type DateDiffResult } from '@/tools/date-calculator/utils';
import { getRelativeTime } from '@/tools/timestamp/utils';
import { cn } from '@/lib/utils';

export default function Page() {
  const [activeTab, setActiveTab] = React.useState<'add-subtract' | 'difference'>('add-subtract');

  // --- Add/Subtract Date States ---
  const [baseDateStr, setBaseDateStr] = React.useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [action, setAction] = React.useState<'add' | 'subtract'>('add');
  const [years, setYears] = React.useState<number>(0);
  const [months, setMonths] = React.useState<number>(0);
  const [weeks, setWeeks] = React.useState<number>(0);
  const [days, setDays] = React.useState<number>(0);
  const [calcResult, setCalcResult] = React.useState<Date | null>(null);

  // --- Difference States ---
  const [startDateStr, setStartDateStr] = React.useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDateStr, setEndDateStr] = React.useState<string>(() => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return future.toISOString().split('T')[0];
  });
  const [diffResult, setDiffResult] = React.useState<DateDiffResult | null>(null);

  // Add/Subtract Calculation
  const handleCalc = React.useCallback(() => {
    if (!baseDateStr) {
      setCalcResult(null);
      return;
    }
    const base = new Date(baseDateStr);
    const offset: DateOffset = { years, months, weeks, days };
    const result = addSubtractDate(base, offset, action);
    setCalcResult(result);
  }, [baseDateStr, action, years, months, weeks, days]);

  React.useEffect(() => {
    handleCalc();
  }, [handleCalc]);

  // Difference Calculation
  const handleDiff = React.useCallback(() => {
    if (!startDateStr || !endDateStr) {
      setDiffResult(null);
      return;
    }
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const result = computeDateDifference(start, end);
    setDiffResult(result);
  }, [startDateStr, endDateStr]);

  React.useEffect(() => {
    handleDiff();
  }, [handleDiff]);

  const handleResetCalc = () => {
    setYears(0);
    setMonths(0);
    setWeeks(0);
    setDays(0);
    setAction('add');
    setBaseDateStr(new Date().toISOString().split('T')[0]);
  };

  const handleResetDiff = () => {
    setStartDateStr(new Date().toISOString().split('T')[0]);
    const future = new Date();
    future.setDate(future.getDate() + 30);
    setEndDateStr(future.toISOString().split('T')[0]);
  };

  return (
    <ToolLayout
      name="Date Calculator & Business Day Counter"
      description="Perform calendar math by adding or subtracting dates, or calculate business days and precise duration between two dates"
      category="Date & Time"
    >
      {/* Tab Switcher */}
      <div className="flex border-b border-border/80 mb-6">
        <button
          onClick={() => setActiveTab('add-subtract')}
          className={cn(
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200',
            activeTab === 'add-subtract'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          Add / Subtract Days
        </button>
        <button
          onClick={() => setActiveTab('difference')}
          className={cn(
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200',
            activeTab === 'difference'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          Date Difference & Working Days
        </button>
      </div>

      {activeTab === 'add-subtract' ? (
        /* Tab 1: Add/Subtract Date Math */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in animate-duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-text-secondary">Calendar Constants</h2>
              <Button variant="ghost" size="sm" onClick={handleResetCalc} icon={<RotateCcw className="h-4 w-4" />}>
                Reset
              </Button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Base Starting Date</label>
                <input
                  type="date"
                  value={baseDateStr}
                  onChange={(e) => setBaseDateStr(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-accent [color-scheme:dark] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Operation</label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    onClick={() => setAction('add')}
                    className={cn(
                      'flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all duration-200',
                      action === 'add'
                        ? 'border-success bg-success/10 text-success shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                        : 'border-border bg-bg-tertiary text-text-secondary hover:text-text-primary hover:border-border-hover'
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Time</span>
                  </button>
                  <button
                    onClick={() => setAction('subtract')}
                    className={cn(
                      'flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all duration-200',
                      action === 'subtract'
                        ? 'border-error bg-error/10 text-error shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                        : 'border-border bg-bg-tertiary text-text-secondary hover:text-text-primary hover:border-border-hover'
                    )}
                  >
                    <Minus className="h-4 w-4" />
                    <span>Subtract Time</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Years</label>
                    <input
                      type="number"
                      min="0"
                      value={years || ''}
                      onChange={(e) => setYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-center font-semibold text-text-primary focus:outline-none focus:border-accent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Months</label>
                    <input
                      type="number"
                      min="0"
                      value={months || ''}
                      onChange={(e) => setMonths(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-center font-semibold text-text-primary focus:outline-none focus:border-accent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Weeks</label>
                    <input
                      type="number"
                      min="0"
                      value={weeks || ''}
                      onChange={(e) => setWeeks(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-center font-semibold text-text-primary focus:outline-none focus:border-accent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Days</label>
                    <input
                      type="number"
                      min="0"
                      value={days || ''}
                      onChange={(e) => setDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-center font-semibold text-text-primary focus:outline-none focus:border-accent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sizing Output Grid */}
          <div className="space-y-4">
            <h2 className="text-base font-medium text-text-secondary">Destination Date</h2>
            
            {calcResult && !isNaN(calcResult.getTime()) ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-6 rounded-xl bg-gradient-to-br from-bg-tertiary via-bg-secondary to-bg-tertiary border border-accent/20 shadow-md relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-violet-500/5" />
                  
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider relative z-10">
                    Calculated Result
                  </span>
                  
                  <h3 className="text-xl font-bold font-outfit text-accent mt-1.5 relative z-10 leading-snug">
                    {calcResult.toDateString()}
                  </h3>
                  
                  <p className="text-sm font-semibold font-mono text-text-primary mt-1 relative z-10">
                    {calcResult.toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-3 relative z-10 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{getRelativeTime(calcResult.getTime())}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-bg-secondary">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">ISO Format</span>
                    <p className="text-xs font-mono font-semibold text-text-primary mt-1 truncate">{calcResult.toISOString()}</p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-bg-secondary">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Epoch Unix Time</span>
                    <p className="text-xs font-mono font-semibold text-text-primary mt-1">{Math.floor(calcResult.getTime() / 1000)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 rounded-xl bg-bg-tertiary border border-border border-dashed text-text-muted text-sm italic">
                Set variables on the left to calculate target date.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Date Difference & Working Days */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in animate-duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-text-secondary">Selected Dates</h2>
              <Button variant="ghost" size="sm" onClick={handleResetDiff} icon={<RotateCcw className="h-4 w-4" />}>
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-accent [color-scheme:dark] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">End Date</label>
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-accent [color-scheme:dark] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sizing Output Grid */}
          <div className="space-y-4">
            <h2 className="text-base font-medium text-text-secondary">Precise Time Difference</h2>
            
            {diffResult ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {/* Total Days */}
                <div className="p-4 rounded-xl border border-border bg-bg-secondary flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Days</span>
                    <p className="text-xl font-bold font-mono text-text-primary mt-0.5">{diffResult.totalDays} Days</p>
                  </div>
                </div>

                {/* Business Days */}
                <div className="p-4 rounded-xl border border-border bg-bg-secondary flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Business Days (Mon-Fri)</span>
                    <p className="text-xl font-bold font-mono text-success mt-0.5">{diffResult.businessDays} Days</p>
                  </div>
                </div>

                {/* Weeks Breakdown */}
                <div className="p-4 rounded-xl border border-border bg-bg-secondary flex items-start gap-3">
                  <Clock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Weeks Format</span>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">
                      {diffResult.weeks > 0 
                        ? `${diffResult.weeks} Week${diffResult.weeks > 1 ? 's' : ''}${diffResult.remainingDays > 0 ? ` & ${diffResult.remainingDays} Day${diffResult.remainingDays > 1 ? 's' : ''}` : ''}`
                        : `${diffResult.remainingDays} Day${diffResult.remainingDays !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>

                {/* Months Breakdown */}
                <div className="p-4 rounded-xl border border-border bg-bg-secondary flex items-start gap-3">
                  <Compass className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Months Format</span>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">
                      {diffResult.months > 0 
                        ? `${diffResult.months} Month${diffResult.months > 1 ? 's' : ''}${diffResult.remainingDaysInMonth > 0 ? ` & ${diffResult.remainingDaysInMonth} Day${diffResult.remainingDaysInMonth > 1 ? 's' : ''}` : ''}`
                        : `${diffResult.remainingDaysInMonth} Day${diffResult.remainingDaysInMonth !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>

                {/* Full Calendar Format */}
                <div className="col-span-full p-4 rounded-xl border border-border bg-accent/5 flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Unified Calendar Difference</span>
                    <p className="text-base font-bold font-outfit text-text-primary mt-0.5 leading-snug">
                      {diffResult.years > 0 ? `${diffResult.years} Year${diffResult.years > 1 ? 's' : ''}, ` : ''}
                      {diffResult.remainingMonths > 0 ? `${diffResult.remainingMonths} Month${diffResult.remainingMonths > 1 ? 's' : ''}, ` : ''}
                      {diffResult.remainingDaysInMonth} Day{diffResult.remainingDaysInMonth !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 rounded-xl bg-bg-tertiary border border-border border-dashed text-text-muted text-sm italic">
                Choose start and end dates to calculate the difference.
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
