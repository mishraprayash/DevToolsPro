'use client';

import * as React from 'react';
import { Calendar, RefreshCw, ArrowLeftRight, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { 
  convertBsToAd, 
  convertAdToBs, 
  getBsMonthDays, 
  nepaliMonths, 
  type NepaliDateObj 
} from '@/tools/nepali-calendar/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const devnagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const devnagariMonths = [
  'वैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 
  'कात्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत'
];

function toDevnagariNum(num: number): string {
  return String(num)
    .split('')
    .map(digit => devnagariDigits[parseInt(digit, 10)] || digit)
    .join('');
}

const nepaliYearsList = Array.from({ length: 101 }, (_, i) => ({
  value: String(2000 + i),
  label: `${2000 + i} BS`
}));

const nepaliMonthsList = nepaliMonths.map(m => ({
  value: String(m.value),
  label: `${m.label} (${toDevnagariNum(m.value)})`
}));

export default function Page() {
  const [activeTab, setActiveTab] = React.useState<'bs-to-ad' | 'ad-to-bs'>('bs-to-ad');

  // --- BS to AD States ---
  const [bsYear, setBsYear] = React.useState<string>('2080');
  const [bsMonth, setBsMonth] = React.useState<string>('1');
  const [bsDay, setBsDay] = React.useState<string>('1');
  const [adResult, setAdResult] = React.useState<Date | null>(null);
  const [bsToAdError, setBsToAdError] = React.useState<string | null>(null);

  // --- AD to BS States ---
  const [adDateStr, setAdDateStr] = React.useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [bsResult, setBsResult] = React.useState<NepaliDateObj | null>(null);
  const [adToBsError, setAdToBsError] = React.useState<string | null>(null);

  // Dynamic days capping based on selected BS Year & Month
  const availableBsDays = React.useMemo(() => {
    const y = parseInt(bsYear, 10) || 2080;
    const m = parseInt(bsMonth, 10) || 1;
    const daysCount = getBsMonthDays(y, m);
    return Array.from({ length: daysCount }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1)
    }));
  }, [bsYear, bsMonth]);

  // Adjust BS Day if it exceeds maximum month days
  React.useEffect(() => {
    const maxDays = availableBsDays.length;
    const currentDay = parseInt(bsDay, 10) || 1;
    if (currentDay > maxDays) {
      setBsDay(String(maxDays));
    }
  }, [availableBsDays, bsDay]);

  // Execute BS to AD conversion
  const handleBsToAd = React.useCallback(() => {
    const y = parseInt(bsYear, 10);
    const m = parseInt(bsMonth, 10);
    const d = parseInt(bsDay, 10);

    const res = convertBsToAd({ year: y, month: m, day: d });

    if (res.success) {
      setAdResult(res.date);
      setBsToAdError(null);
    } else {
      setBsToAdError(res.error);
      setAdResult(null);
    }
  }, [bsYear, bsMonth, bsDay]);

  React.useEffect(() => {
    handleBsToAd();
  }, [handleBsToAd]);

  // Execute AD to BS conversion
  const handleAdToBs = React.useCallback(() => {
    if (!adDateStr) {
      setBsResult(null);
      return;
    }

    const parts = adDateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1; // JS Date Month is 0-indexed
    const d = parseInt(parts[2], 10);

    const res = convertAdToBs(new Date(y, m, d));

    if (res.success) {
      setBsResult(res.bsDate);
      setAdToBsError(null);
    } else {
      setAdToBsError(res.error);
      setBsResult(null);
    }
  }, [adDateStr]);

  React.useEffect(() => {
    handleAdToBs();
  }, [handleAdToBs]);

  const handleResetBsToAd = () => {
    setBsYear('2080');
    setBsMonth('1');
    setBsDay('1');
  };

  const handleResetAdToBs = () => {
    setAdDateStr(new Date().toISOString().split('T')[0]);
  };

  return (
    <ToolLayout
      name="Nepali Bikram Sambat Calendar Converter"
      description="Convert calendar dates bidirectionally between Nepalese Bikram Sambat (BS) and English Gregorian (AD) instantly"
      category="Date & Time"
    >
      {/* Tab Switcher */}
      <div className="flex border-b border-border/80 mb-6">
        <button
          onClick={() => setActiveTab('bs-to-ad')}
          className={cn(
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200',
            activeTab === 'bs-to-ad'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          Nepali (BS) → English (AD)
        </button>
        <button
          onClick={() => setActiveTab('ad-to-bs')}
          className={cn(
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200',
            activeTab === 'ad-to-bs'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          English (AD) → Nepali (BS)
        </button>
      </div>

      {activeTab === 'bs-to-ad' ? (
        /* Tab 1: BS to AD */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-text-secondary">Nepali Date (BS)</h2>
              <Button variant="ghost" size="sm" onClick={handleResetBsToAd} icon={<RefreshCw className="h-4 w-4" />}>
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Year (BS)"
                options={nepaliYearsList}
                value={bsYear}
                onChange={(e) => setBsYear(e.target.value)}
              />

              <Select
                label="Month (BS)"
                options={nepaliMonthsList}
                value={bsMonth}
                onChange={(e) => setBsMonth(e.target.value)}
              />

              <Select
                label="Day"
                options={availableBsDays}
                value={bsDay}
                onChange={(e) => setBsDay(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-secondary flex gap-3 text-xs text-text-muted">
              <BookOpen className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="font-semibold text-text-primary mb-0.5">Nepali Bikram Sambat Calendar</p>
                <p className="leading-relaxed">Bikram Sambat is approximately 56 years and 8.5 months ahead of the Gregorian calendar. The number of days in each month is determined astronomically and varies dynamically between 29 and 32 days.</p>
              </div>
            </div>
          </div>

          {/* BS to AD Output */}
          <div className="space-y-4">
            <h2 className="text-base font-medium text-text-secondary">Converted English Date (AD)</h2>

            {adResult ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-6 rounded-xl bg-gradient-to-br from-bg-tertiary via-bg-secondary to-bg-tertiary border border-accent/20 shadow-md relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-violet-500/5" />
                  
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider relative z-10">
                    Gregorian Date (AD)
                  </span>

                  <h3 className="text-xl font-bold font-outfit text-accent mt-2 relative z-10 leading-snug">
                    {adResult.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>

                  <p className="text-sm font-semibold font-mono text-text-primary mt-1 relative z-10">
                    Standard Format: {adResult.toISOString().split('T')[0]}
                  </p>

                  <p className="text-xs text-text-muted mt-3 relative z-10 font-mono">
                    Time elapsed: {Math.floor((Date.now() - adResult.getTime()) / (1000 * 60 * 60 * 24)).toLocaleString()} days ago
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-text-muted border border-border border-dashed rounded-xl italic">
                {bsToAdError || 'Select a valid Nepali date to convert.'}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: AD to BS */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-text-secondary">English Date (AD)</h2>
              <Button variant="ghost" size="sm" onClick={handleResetAdToBs} icon={<RefreshCw className="h-4 w-4" />}>
                Reset
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Select Date (AD)</label>
              <input
                type="date"
                value={adDateStr}
                onChange={(e) => setAdDateStr(e.target.value)}
                min="1943-04-13"
                max="2044-04-13"
                className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-accent [color-scheme:dark] transition-all"
              />
            </div>
          </div>

          {/* AD to BS Output */}
          <div className="space-y-4">
            <h2 className="text-base font-medium text-text-secondary">Converted Nepali Date (BS)</h2>

            {bsResult ? (
              <div className="space-y-4 animate-fade-in">
                {/* Traditional Devnagari Output card */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-bg-tertiary via-bg-secondary to-bg-tertiary border border-success/20 shadow-md relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-emerald-500/5" />
                  
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-success uppercase tracking-wider relative z-10 select-none">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>पारंपरिक नेपाली मिति (Traditional)</span>
                  </div>

                  <h3 className="text-2xl font-bold font-outfit text-success mt-2 relative z-10 leading-snug">
                    {devnagariMonths[bsResult.month - 1]} {toDevnagariNum(bsResult.day)}, {toDevnagariNum(bsResult.year)} वि.सं.
                  </h3>

                  <p className="text-sm font-semibold font-mono text-text-primary mt-1 relative z-10">
                    Standard Numeral: {bsResult.year}-{String(bsResult.month).padStart(2, '0')}-{String(bsResult.day).padStart(2, '0')} BS
                  </p>

                  <p className="text-xs text-text-muted mt-2 relative z-10">
                    Nepali Month: {nepaliMonths[bsResult.month - 1]?.label} ({devnagariMonths[bsResult.month - 1]})
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-text-muted border border-border border-dashed rounded-xl italic">
                {adToBsError || 'Select a valid English date to convert.'}
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
