'use client';

import * as React from 'react';
import { RotateCcw, Calendar, AlignLeft, Info, HelpCircle, Briefcase, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { translateCronToEnglish, getNextRuns } from '@/tools/cron/utils';
import { getRelativeTime } from '@/tools/date-toolbox/utils';
import { cn } from '@/lib/utils';

const cronFields5 = [
  { name: 'minute', range: '0-59' },
  { name: 'hour', range: '0-23' },
  { name: 'day of month', range: '1-31' },
  { name: 'month', range: '1-12' },
  { name: 'day of week', range: '0-6 (0=Sun)' },
];

const cronFields6 = [
  { name: 'second', range: '0-59' },
  { name: 'minute', range: '0-59' },
  { name: 'hour', range: '0-23' },
  { name: 'day of month', range: '1-31' },
  { name: 'month', range: '1-12' },
  { name: 'day of week', range: '0-6 (0=Sun)' },
];

const examples = [
  { label: 'Every Minute', value: '* * * * *' },
  { label: 'Weekdays at 9 AM', value: '0 9 * * 1-5' },
  { label: 'Every 15 Minutes', value: '*/15 * * * *' },
  { label: 'Weekly Sunday Noon', value: '0 12 * * 0' },
  { label: 'Every 10 Seconds', value: '*/10 * * * * *' },
];

export default function Page() {
  const [input, setInput] = React.useState(examples[1].value);
  const [activeExample, setActiveExample] = React.useState(1);

  // Quick Builder States
  const [builderPeriod, setBuilderPeriod] = React.useState<'minute' | 'hour' | 'day' | 'week'>('minute');
  const [builderMinuteInterval, setBuilderMinuteInterval] = React.useState('5');
  const [builderHour, setBuilderHour] = React.useState('9');
  const [builderWeekdays, setBuilderWeekdays] = React.useState<number[]>([1, 2, 3, 4, 5]); // Monday to Friday

  // Parse result & next executions
  const parsedDescription = React.useMemo(() => {
    if (!input.trim()) return '';
    try {
      return translateCronToEnglish(input);
    } catch {
      return 'Invalid cron expression';
    }
  }, [input]);

  const upcomingRuns = React.useMemo(() => {
    if (!input.trim()) return null;
    const res = getNextRuns(input, 5);
    if (res.success) {
      return res.dates;
    }
    return null;
  }, [input]);

  // Sync quick builder changes to raw input
  const syncBuilderToRaw = React.useCallback(() => {
    let cron = '';
    if (builderPeriod === 'minute') {
      cron = `*/${builderMinuteInterval} * * * *`;
    } else if (builderPeriod === 'hour') {
      cron = `0 * * * *`;
    } else if (builderPeriod === 'day') {
      cron = `0 ${builderHour} * * *`;
    } else if (builderPeriod === 'week') {
      const dows = builderWeekdays.length > 0 ? builderWeekdays.sort().join(',') : '*';
      cron = `0 ${builderHour} * * ${dows}`;
    }
    setInput(cron);
    setActiveExample(-1);
  }, [builderPeriod, builderMinuteInterval, builderHour, builderWeekdays]);

  // Detect which field structure (5 or 6) is in use
  const fieldStructure = React.useMemo(() => {
    const parts = input.trim().split(/\s+/);
    return parts.length === 6 ? cronFields6 : cronFields5;
  }, [input]);

  const handleClear = () => {
    setInput('');
    setActiveExample(-1);
  };

  const handleWeekdayToggle = (day: number) => {
    if (builderWeekdays.includes(day)) {
      setBuilderWeekdays(builderWeekdays.filter(d => d !== day));
    } else {
      setBuilderWeekdays([...builderWeekdays, day]);
    }
  };

  return (
    <ToolLayout
      name="Cron Expression Parser"
      description="Validate, parse, and translate standard Linux (5-field) and Quartz (6-field) Cron expressions into clear English, with next-run schedules"
      category="Date & Time"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={(i) => { setActiveExample(i); setInput(examples[i].value); }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Input & Builder */}
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-text-secondary">Cron Expression Input</h2>
              <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
                Clear
              </Button>
            </div>
            
            <Input
              value={input}
              onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
              placeholder="e.g. 0 9 * * 1-5 or */15 * * * * *"
              monospace
              className="text-lg text-center h-12 flex items-center justify-center font-bold tracking-widest"
            />
          </div>

          {/* Quick Builder Card */}
          <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-outfit">Quick Cron Builder</span>
              <Button variant="ghost" size="sm" onClick={syncBuilderToRaw} icon={<RefreshCw className="h-3.5 w-3.5" />}>
                Apply to Raw
              </Button>
            </div>

            <div className="space-y-4 text-sm text-text-secondary">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase">Execution Period</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'minute', label: 'Every X Mins' },
                    { value: 'hour', label: 'Hourly' },
                    { value: 'day', label: 'Daily' },
                    { value: 'week', label: 'Weekly' }
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setBuilderPeriod(p.value as any)}
                      className={cn(
                        'px-2 py-2 rounded-lg border text-xs font-semibold transition-all duration-200',
                        builderPeriod === p.value
                          ? 'border-accent bg-accent/10 text-accent font-bold shadow-sm'
                          : 'border-border bg-bg-tertiary text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {builderPeriod === 'minute' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Minute Interval</label>
                  <select
                    value={builderMinuteInterval}
                    onChange={(e) => setBuilderMinuteInterval(e.target.value)}
                    className="w-full h-10 px-4 pr-10 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="1">Every 1 Minute (* * * * *)</option>
                    <option value="5">Every 5 Minutes (*/5 * * * *)</option>
                    <option value="10">Every 10 Minutes (*/10 * * * *)</option>
                    <option value="15">Every 15 Minutes (*/15 * * * *)</option>
                    <option value="30">Every 30 Minutes (*/30 * * * *)</option>
                  </select>
                </div>
              )}

              {builderPeriod === 'day' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Trigger Hour</label>
                  <select
                    value={builderHour}
                    onChange={(e) => setBuilderHour(e.target.value)}
                    className="w-full h-10 px-4 pr-10 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent cursor-pointer font-mono"
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, '0')}:00 {h >= 12 ? 'PM' : 'AM'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {builderPeriod === 'week' && (
                <div className="space-y-3.5 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Trigger Hour</label>
                      <select
                        value={builderHour}
                        onChange={(e) => setBuilderHour(e.target.value)}
                        className="w-full h-10 px-4 pr-10 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:border-accent cursor-pointer font-mono"
                      >
                        {Array.from({ length: 24 }).map((_, h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, '0')}:00 {h >= 12 ? 'PM' : 'AM'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase">Target Weekdays</label>
                    <div className="flex flex-wrap gap-1.5 select-none">
                      {[
                        { val: 1, name: 'Mon' },
                        { val: 2, name: 'Tue' },
                        { val: 3, name: 'Wed' },
                        { val: 4, name: 'Thu' },
                        { val: 5, name: 'Fri' },
                        { val: 6, name: 'Sat' },
                        { val: 0, name: 'Sun' }
                      ].map((day) => {
                        const active = builderWeekdays.includes(day.val);
                        return (
                          <button
                            key={day.val}
                            onClick={() => handleWeekdayToggle(day.val)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150',
                              active
                                ? 'bg-accent border-accent text-white shadow-sm'
                                : 'bg-bg-tertiary border-border text-text-secondary hover:border-border-hover hover:text-text-primary'
                            )}
                          >
                            {day.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fields formatting visual descriptor */}
          <div className="p-5 rounded-xl bg-bg-secondary border border-border space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
              <Info className="h-4 w-4 text-accent" />
              <span>Cron Parameter Mapping ({fieldStructure.length} Fields)</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {fieldStructure.map((f, i) => {
                // Match visual segment index in user's expression
                const parts = input.trim().split(/\s+/);
                const activeSegment = parts[i] || '';

                return (
                  <div 
                    key={f.name} 
                    className={cn(
                      'text-center p-2.5 rounded-lg border transition-all duration-200',
                      activeSegment 
                        ? 'bg-accent/5 border-accent/30 shadow-[0_0_10px_rgba(34,211,238,0.05)]' 
                        : 'bg-bg-tertiary border-border'
                    )}
                  >
                    <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold truncate">{f.name}</p>
                    <p className="text-sm font-extrabold font-mono text-accent mt-0.5">{activeSegment || '-'}</p>
                    <p className="text-[9px] font-mono text-text-muted mt-1 opacity-70">({f.range})</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="space-y-6">
          {/* English translation panel */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <AlignLeft className="h-4 w-4 text-accent" />
              <span>Human Readable Translation</span>
            </span>
            
            <div className="p-5 rounded-xl border border-border bg-bg-tertiary shadow-inner flex flex-col justify-center min-h-[90px]">
              {parsedDescription ? (
                <p className="text-base font-bold font-outfit text-text-primary leading-relaxed">
                  {parsedDescription}
                </p>
              ) : (
                <p className="text-xs text-text-muted italic select-none">
                  Enter a cron expression on the left to see description.
                </p>
              )}
            </div>
          </div>

          {/* Next execution runs schedule list */}
          <div className="space-y-3.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-accent" />
              <span>Upcoming Execution Runs (Next 5)</span>
            </span>

            {upcomingRuns ? (
              <div className="border border-border rounded-xl bg-bg-tertiary overflow-hidden shadow-sm divide-y divide-border/60 animate-fade-in">
                {upcomingRuns.map((run, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-bg-secondary/40 transition-colors">
                    <div>
                      <span className="text-[10px] font-extrabold text-accent uppercase tracking-wider">Run {idx + 1}</span>
                      <p className="text-sm font-semibold text-text-primary mt-0.5">
                        {run.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>

                    <span className="text-xs font-mono text-text-muted font-semibold bg-bg-secondary border border-border/80 px-2.5 py-1 rounded-lg">
                      {getRelativeTime(run.getTime())}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-border border-dashed rounded-xl text-text-muted text-xs italic select-none">
                No upcoming executions could be parsed. Verify the cron syntax above.
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
