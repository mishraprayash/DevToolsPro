'use client';

import * as React from 'react';
import { ArrowLeftRight, Clock, Search, Check, Sun, Moon, Briefcase } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { convertTime, getCommonTimezones, getGroupedTimezones, getTimezoneOffsetStr, type TimezoneInfo } from '@/tools/timezone/utils';

const commonTzs = getCommonTimezones();
// Placeholder date for the server render; the real local zone and time are set after mount
// so server HTML and the first client render match (no hydration mismatch).
const INITIAL_DATE_STR = '2026-01-01T09:00';

function formatLocalDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

export default function Page() {
  const [fromTz, setFromTz] = React.useState('UTC');
  const [toTz, setToTz] = React.useState('UTC');
  const [dateStr, setDateStr] = React.useState(INITIAL_DATE_STR);
  const [resultIndex, setResultIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setFromTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setDateStr(formatLocalDateTime(new Date()));
  }, []);

  const grouped = React.useMemo(() => getGroupedTimezones(), []);

  const result = React.useMemo(() => {
    const d = new Date(dateStr);
    return convertTime(d, fromTz, toTz);
  }, [dateStr, fromTz, toTz]);

  const swapTimezones = React.useCallback(() => {
    setFromTz(toTz);
    setToTz(fromTz);
  }, [toTz, fromTz]);

  const pickCommon = React.useCallback((tz: string) => {
    if (resultIndex === 0) {
      setToTz(tz);
    } else {
      setFromTz(tz);
    }
  }, [resultIndex]);

  const setNow = React.useCallback(() => {
    setDateStr(formatLocalDateTime(new Date()));
  }, []);

  // Compute hour mappings for meeting planner
  const plannerTimeline = React.useMemo(() => {
    const baseDate = new Date(dateStr);
    const getHoursForZone = (targetTz: string) => {
      const arr = [];
      for (let h = 0; h < 24; h++) {
        const temp = new Date(baseDate);
        temp.setHours(h, 0, 0, 0);
        try {
          const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: targetTz,
            hour: 'numeric',
            hour12: false,
          }).formatToParts(temp);
          const hrPart = parts.find(p => p.type === 'hour');
          arr.push(hrPart ? parseInt(hrPart.value, 10) % 24 : h);
        } catch {
          arr.push(h);
        }
      }
      return arr;
    };

    return {
      fromHours: getHoursForZone(fromTz),
      toHours: getHoursForZone(toTz),
    };
  }, [dateStr, fromTz, toTz]);

  return (
    <ToolLayout name="Time Zone Converter" description="Convert time between world zones and plan overlapping meetings visually" category="Date & Time">
      {/* Times depend on the browser's zone and clock, so render only on the client (avoids a hydration mismatch) */}
      {!mounted ? (
        <div className="h-[28rem] rounded-xl border border-border bg-bg-secondary animate-pulse" aria-hidden="true" />
      ) : (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResultIndex(0)}
              className={resultIndex === 0 ? 'text-accent' : ''}>
              Target: To
            </Button>
            <span className="text-text-muted text-sm">→</span>
            <Button variant="ghost" size="sm" onClick={() => setResultIndex(1)}
              className={resultIndex === 1 ? 'text-accent' : ''}>
              Source: From
            </Button>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs text-text-muted mb-1.5 block">From (Source)</label>
              {mounted && <SearchableTimezoneSelect value={fromTz} onChange={setFromTz} groups={grouped} />}
            </div>

            <button onClick={swapTimezones}
              className="p-2 rounded-lg bg-bg-tertiary border border-border hover:border-accent transition-colors mb-0.5"
              title="Swap timezone roles"
            >
              <ArrowLeftRight className="h-4 w-4 text-text-secondary" />
            </button>

            <div className="flex-1">
              <label className="text-xs text-text-muted mb-1.5 block">To (Destination)</label>
              {mounted && <SearchableTimezoneSelect value={toTz} onChange={setToTz} groups={grouped} />}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Date &amp; Time</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input type="datetime-local" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
                  className={cn(
                    'w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border',
                    'text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
                    'transition-all duration-200 [color-scheme:dark]'
                  )} />
              </div>
              <Button variant="secondary" size="sm" onClick={setNow}>
                Current Time
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Quick Select</label>
            <div className="flex flex-wrap gap-1.5">
              {commonTzs.slice(0, 8).map((tz) => (
                <button key={tz.name} onClick={() => pickCommon(tz.name)}
                  className="px-2.5 py-1 rounded-full text-xs bg-bg-tertiary border border-border hover:border-accent hover:text-accent transition-colors">
                  {tz.abbr || (tz.name.split('/').pop() ?? '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-medium text-text-secondary">Converted Time</h2>

          {result.success ? (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-bg-tertiary border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{result.source.abbr} ({result.source.offset})</span>
                  <span className="text-xs text-text-muted">{result.source.label}</span>
                </div>
                <p className="text-base font-semibold font-outfit text-text-primary">{result.sourceTime}</p>
              </div>

              <div className="flex justify-center select-none">
                <ArrowLeftRight className="h-4 w-4 text-accent" />
              </div>

              <div className="p-5 rounded-xl bg-accent/5 border border-accent/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 bg-accent/10 rounded-bl-lg text-[9px] text-accent font-bold uppercase tracking-wider px-2.5">
                  Result
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{result.target.abbr} ({result.target.offset})</span>
                  <span className="text-xs text-text-muted">{result.target.label}</span>
                </div>
                <p className="text-base font-semibold font-outfit text-accent">{result.targetTime}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 rounded-lg bg-bg-tertiary text-text-muted text-sm italic">
              {result.error}
            </div>
          )}

          <div className="p-4 rounded-xl bg-bg-secondary border border-border">
            <h3 className="text-xs font-semibold mb-2.5 flex items-center gap-1.5 text-text-secondary">
              <Clock className="h-4 w-4 text-accent" /> Global Comparison Grid
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {commonTzs.map((tz) => {
                const c = convertTime(new Date(dateStr), fromTz, tz.name);
                if (!c.success) return null;
                const shortName = tz.abbr || (tz.name.split('/').pop() ?? '');
                return (
                  <div key={tz.name} className="p-2 rounded-lg bg-bg-tertiary border border-border/40 text-xs">
                    <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">{shortName}</span>
                    <p className="font-mono text-text-primary mt-0.5">{c.targetTime.split(' at ')[1] || c.targetTime}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline Meeting Planner */}
      <div className="p-5 rounded-xl bg-bg-secondary border border-border mt-8 space-y-4 shadow-sm animate-slide-up">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-semibold font-outfit text-text-primary">Meeting & Collaboration Planner</h3>
            <p className="text-xs text-text-muted">Compare hour-by-hour availability between both zones. Click any block to shift the clock.</p>
          </div>
          <div className="hidden sm:flex items-center gap-3.5 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-success" /> Work (9am-5pm)</span>
            <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-warning" /> Off-hours</span>
            <span className="flex items-center gap-1"><Moon className="h-3.5 w-3.5 text-error" /> Sleep (10pm-6am)</span>
          </div>
        </div>

        <div className="space-y-4 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { role: 'From: Source', name: fromTz, hours: plannerTimeline.fromHours },
            { role: 'To: Target', name: toTz, hours: plannerTimeline.toHours }
          ].map((zone) => {
            const shortTzName = zone.name.split('/').pop()?.replace(/_/g, ' ') || zone.name;
            const currentHour = new Date(dateStr).getHours();

            return (
              <div key={zone.name} className="min-w-[800px] flex items-center gap-4">
                <div className="w-48 shrink-0">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{zone.role}</p>
                  <p className="text-xs font-bold truncate text-text-primary mt-0.5">{shortTzName}</p>
                  <p className="text-[10px] font-mono text-text-muted">{getTimezoneOffsetStr(zone.name, new Date(dateStr))}</p>
                </div>

                <div className="flex items-center gap-1 flex-1">
                  {zone.hours.map((displayHour, hourIdx) => {
                    const isSleep = displayHour >= 22 || displayHour < 6;
                    const isWork = displayHour >= 9 && displayHour < 17;

                    const isCurrent = hourIdx === currentHour;

                    const boxClass = cn(
                      'flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md text-[10px] border transition-all h-14 cursor-pointer select-none',
                      isSleep && 'bg-error/5 text-error/80 border-error/20 hover:bg-error/15',
                      isWork && 'bg-success/10 text-success font-semibold border-success/30 hover:bg-success/20',
                      !isSleep && !isWork && 'bg-warning/5 text-warning/80 border-warning/20 hover:bg-warning/15',
                      isCurrent && 'ring-2 ring-accent ring-offset-2 ring-offset-bg-primary font-bold border-accent/50 scale-105'
                    );

                    return (
                      <button
                        key={hourIdx}
                        onClick={() => {
                          const temp = new Date(dateStr);
                          temp.setHours(hourIdx);
                          setDateStr(formatLocalDateTime(temp));
                        }}
                        className={boxClass}
                        title={`Select ${hourIdx}:00 in source timezone`}
                      >
                        <span className="font-mono text-xs">{String(displayHour).padStart(2, '0')}</span>
                        <span className="text-[8px] opacity-70 mt-0.5">{displayHour >= 12 ? 'PM' : 'AM'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}
    </ToolLayout>
  );
}

interface SearchableTimezoneSelectProps {
  value: string;
  onChange: (v: string) => void;
  groups: Record<string, TimezoneInfo[]>;
}

function SearchableTimezoneSelect({ value, onChange, groups }: SearchableTimezoneSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const flatList = React.useMemo(() => {
    const items: ({ type: 'item' } & TimezoneInfo)[] = [];
    for (const [, tzs] of Object.entries(groups)) {
      for (const tz of tzs) {
        items.push({ ...tz, type: 'item' });
      }
    }
    return items;
  }, [groups]);

  const selected = React.useMemo(
    () => flatList.find((tz) => tz.name === value),
    [flatList, value],
  );

  const filtered = React.useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return flatList.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.name.toLowerCase().includes(q) ||
        tz.offset.toLowerCase().includes(q) ||
        tz.abbr.toLowerCase().includes(q) ||
        tz.region.toLowerCase().includes(q),
    );
  }, [flatList, query]);

  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = React.useCallback(
    (tzName: string) => {
      onChange(tzName);
      setOpen(false);
      setQuery('');
    },
    [onChange],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    },
    [],
  );

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-full h-10 px-4 pr-10 rounded-lg bg-bg-tertiary border border-border text-left',
          'text-text-primary cursor-pointer',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
          'transition-all duration-200 flex items-center gap-2',
        )}>
        <span className="truncate flex-1 text-sm">
          {selected ? `${selected.label} (${selected.offset})` : value}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-text-muted shrink-0">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-border bg-bg-secondary shadow-lg max-h-80 flex flex-col">
          <div className="relative p-2 border-b border-border">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search timezones..."
              className="w-full h-9 pl-8 pr-3 rounded-md bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {query.trim() ? (
              filtered && filtered.length > 0 ? (
                <div className="py-1">
                  {filtered.map((tz) => (
                    <button
                      key={tz.name}
                      type="button"
                      onClick={() => handleSelect(tz.name)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                        tz.name === value
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-primary hover:bg-bg-hover',
                      )}>
                      <span className={cn(
                        'w-4 h-4 flex items-center justify-center shrink-0',
                        tz.name === value ? 'text-accent' : 'text-transparent',
                      )}>
                        {tz.name === value && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="flex-1 truncate">{tz.label}</span>
                      <span className="text-xs text-text-muted shrink-0">{tz.offset}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-text-muted">
                  No timezones match &ldquo;{query}&rdquo;
                </div>
              )
            ) : (
              <div className="py-1">
                {Object.entries(groups).map(([region, tzs]) => (
                  <div key={region}>
                    <div className="px-3 py-1.5 text-xs text-text-muted uppercase tracking-wider font-medium">
                      {region}
                    </div>
                    {tzs.map((tz) => (
                      <button
                        key={tz.name}
                        type="button"
                        onClick={() => handleSelect(tz.name)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                          tz.name === value
                            ? 'bg-accent/10 text-accent'
                            : 'text-text-primary hover:bg-bg-hover',
                        )}>
                        <span className={cn(
                          'w-4 h-4 flex items-center justify-center shrink-0',
                          tz.name === value ? 'text-accent' : 'text-transparent',
                        )}>
                          {tz.name === value && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className="flex-1 truncate">{tz.label}</span>
                        <span className="text-xs text-text-muted shrink-0">{tz.offset}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
