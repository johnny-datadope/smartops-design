// Usage & Costs — daily breakdown of tokens consumed, spend, and resolved
// investigations for a selected time range. Admin-only; lives at
// #/admin/usage. All data here is mocked deterministically so the chart is
// stable as the user flips between range presets.

function formatBucketShort(d, bucket) {
  if (bucket === 'hour')  return d.toLocaleTimeString('en-US', { hour: 'numeric' }).replace(' ', '');
  if (bucket === 'day')   return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (bucket === 'week')  return `wk ${weekOfYear(d) + 1}`;
  if (bucket === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  return String(d.getFullYear());
}

function formatBucketLong(d, bucket) {
  if (bucket === 'hour') {
    return d.toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric' });
  }
  if (bucket === 'week') {
    const end = new Date(d); end.setDate(end.getDate() + 6);
    return `${formatDayShort(d)} → ${formatDayShort(end)}`;
  }
  if (bucket === 'month') return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  if (bucket === 'year')  return String(d.getFullYear());
  return formatDayLong(d);
}

function pickBucket(startDate, endDate) {
  // <24h → hour, ≤31d → day, ≤6mo → week, ≤3y → month, else year.
  const ms = endDate - startDate;
  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;
  if (ms < 24 * HOUR) return 'hour';
  if (ms <= 31 * DAY) return 'day';
  if (ms <= 186 * DAY) return 'week';     // ~6 months
  if (ms <= 1095 * DAY) return 'month';   // ~3 years
  return 'year';
}

function bucketBoundaries(startDate, endDate, bucket) {
  // Emit the start of each bucket inside [startDate, endDate]. The first
  // bucket is anchored at the rounded-down boundary that contains startDate.
  const out = [];
  const start = floorToBucket(startDate, bucket);
  let cur = start;
  while (cur <= endDate) {
    out.push(cur);
    cur = nextBucket(cur, bucket);
  }
  return out;
}

function floorToBucket(d, bucket) {
  const c = new Date(d);
  if (bucket === 'hour') { c.setMinutes(0, 0, 0); return c; }
  if (bucket === 'day')  { c.setHours(0, 0, 0, 0); return c; }
  if (bucket === 'week') {
    c.setHours(0, 0, 0, 0);
    const dow = (c.getDay() + 6) % 7; // Monday = 0
    c.setDate(c.getDate() - dow);
    return c;
  }
  if (bucket === 'month') return new Date(c.getFullYear(), c.getMonth(), 1);
  return new Date(c.getFullYear(), 0, 1);
}

function nextBucket(d, bucket) {
  const c = new Date(d);
  if (bucket === 'hour')  c.setHours(c.getHours() + 1);
  else if (bucket === 'day')   c.setDate(c.getDate() + 1);
  else if (bucket === 'week')  c.setDate(c.getDate() + 7);
  else if (bucket === 'month') c.setMonth(c.getMonth() + 1);
  else                         c.setFullYear(c.getFullYear() + 1);
  return c;
}

function bucketSeed(d, bucket) {
  // Stable per-bucket seed — same boundary always yields the same numbers.
  const k = bucket === 'hour'
    ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`
    : bucket === 'day'
    ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    : bucket === 'week'
    ? `${d.getFullYear()}-${weekOfYear(d)}`
    : bucket === 'month'
    ? `${d.getFullYear()}-${d.getMonth()}`
    : `${d.getFullYear()}`;
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) {
    h ^= k.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function weekOfYear(d) {
  const a = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d - a) / (7 * 86400000));
}

/** Reference curve for “Últimos 7 días” — matches Apolo usage screenshot (May 27 – Jun 2). */
const USAGE_DEMO_7D_PATTERN = [
  { cost: 0, investigations: 0 },
  { cost: 1.05, investigations: 2 },
  { cost: 0.55, investigations: 4 },
  { cost: 0, investigations: 0 },
  { cost: 0, investigations: 0 },
  { cost: 0, investigations: 0 },
  { cost: 0.15, investigations: 3 },
];

function generateUsageData(startDate, endDate, bucket) {
  const boundaries = bucketBoundaries(startDate, endDate, bucket);

  if (bucket === 'day' && boundaries.length === 7) {
    return boundaries.map((date, i) => {
      const p = USAGE_DEMO_7D_PATTERN[i];
      const tokens = Math.max(0, Math.round(p.cost / 0.0000054));
      return { date, tokens, cost: p.cost, investigations: p.investigations };
    });
  }

  const out = [];
  // Per-bucket multipliers so the volume of a week/month bucket is plausibly
  // larger than a single hour or day.
  const scale = { hour: 1 / 24, day: 1, week: 7, month: 30, year: 365 }[bucket];

  for (let i = 0; i < boundaries.length; i++) {
    const d = boundaries[i];
    let s = bucketSeed(d, bucket);
    const rand = () => {
      s ^= s << 13; s ^= s >> 17; s ^= s << 5;
      return ((s >>> 0) % 10000) / 10000;
    };
    let weekendOrNight;
    if (bucket === 'hour') {
      const h = d.getHours();
      // Quiet at night, peaks late morning + mid afternoon.
      const morning = Math.max(0, 1 - Math.abs(h - 11) / 6);
      const afternoon = Math.max(0, 1 - Math.abs(h - 16) / 6);
      weekendOrNight = 0.25 + 0.9 * Math.max(morning, afternoon);
    } else if (bucket === 'day') {
      const dow = d.getDay();
      weekendOrNight = dow === 0 || dow === 6 ? 0.55 : 1;
    } else {
      weekendOrNight = 1;
    }
    const trend = 0.75 + 0.45 * (i / Math.max(boundaries.length - 1, 1));
    const noise = 0.75 + rand() * 0.5;
    const tokens = Math.max(800, Math.round(34000 * scale * weekendOrNight * trend * noise));
    const cost = +(tokens * 0.0000054).toFixed(3);
    const investigations = Math.max(0, Math.round(17 * scale * weekendOrNight * trend * noise));
    out.push({ date: d, tokens, cost, investigations });
  }
  return out;
}

const USAGE_RANGE_PRESETS = [
  { key: 'today', today: true },
  { key: '7d', days: 7 },
  { key: '30d', days: 30 },
  { key: '90d', days: 90 },
];

function usageRangeLabel(t, key) {
  const p = t.admin.usage.period;
  if (key === 'today') return p.today;
  if (key === '7d') return p.last7Days;
  if (key === '30d') return p.last30Days;
  if (key === '90d') return p.last90Days;
  return key;
}

/** Period in panel subtitles — Apolo usage-cost-reports-page + period-filter. */
function formatUsagePeriodIsoRange(start, end) {
  const s = toISODate(startOfDay(start));
  const e = toISODate(startOfDay(end));
  return s === e ? s : `${s} – ${e}`;
}

/** Custom tab button label only — Apolo period-filter (MMM d – MMM d). */
function formatUsageCustomRangeLabel(from, to, locale) {
  const loc = usageLocale(locale);
  const fmt = (d) => d.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
  const a = fmt(from);
  const b = fmt(to);
  return a === b ? a : `${a} – ${b}`;
}

/** Panel subtitles — Apolo formatPeriodLabel(breakdownRange): ISO dates only. */
function usagePeriodScopeLabel(startDate, endDate, focusDay) {
  if (focusDay?.date) {
    return formatUsagePeriodIsoRange(focusDay.date, focusDay.date);
  }
  return formatUsagePeriodIsoRange(startDate, endDate);
}

// ---- date helpers (local TZ, no UTC drift) ----

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function daysBetweenInclusive(start, end) {
  const ms = startOfDay(end) - startOfDay(start);
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

function toISODate(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
}

function fromISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDMY(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// Each metric gets its own slice of the bar's vertical budget. Since the three
// metrics are in wildly different units (tokens, $, count), we normalise each
// to its own period max and stack the resulting heights. A fully filled bar
// means "this day was at the period's peak for all three metrics".

// Apolo usage-cost-reports/formatters.ts
function usageLocale(lang) {
  return lang === 'es-ES' ? 'es-ES' : 'en-GB';
}

function formatCompactNumber(value, locale) {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatAverageCompact(total, days, locale) {
  if (days <= 0) return formatCompactNumber(0, locale);
  return formatCompactNumber(total / days, locale);
}

function formatUsageCurrency(value) {
  const n = typeof value === 'number' ? value : parseFloat(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

function formatAverageCurrency(total, days) {
  if (days <= 0) return formatUsageCurrency(0);
  return formatUsageCurrency(total / days);
}

function formatAverageDecimal(total, days, locale) {
  if (days <= 0) return '0';
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(total / days);
}

function formatInteger(value, locale) {
  return new Intl.NumberFormat(locale).format(Math.round(value));
}

function UsageMetricsPage() {
  const { lang, t } = useI18n();
  const locale = usageLocale(lang);
  const [range, setRange] = React.useState('30d');
  const [customRange, setCustomRange] = React.useState(null);
  const [drillIdx, setDrillIdx] = React.useState(null);

  const { startDate, endDate } = React.useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    if (range === 'custom' && customRange) {
      const end = new Date(customRange.to);
      end.setHours(23, 59, 59, 999);
      return { startDate: startOfDay(customRange.from), endDate: end };
    }
    const cfg = USAGE_RANGE_PRESETS.find(r => r.key === range);
    if (cfg?.today) {
      const end = new Date(now);
      end.setMinutes(0, 0, 0);
      return { startDate: today, endDate: end };
    }
    const days = cfg?.days || 30;
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    return { startDate: start, endDate: today };
  }, [range, customRange]);

  const bucket = React.useMemo(() => pickBucket(startDate, endDate), [startDate, endDate]);

  const data = React.useMemo(
    () => generateUsageData(startDate, endDate, bucket),
    [startDate.getTime(), endDate.getTime(), bucket]
  );

  // Clear the selected day whenever the range changes so we don't index out
  // of bounds against the new (shorter or shifted) data array.
  React.useEffect(() => { setDrillIdx(null); }, [range, customRange]);

  const totals = data.reduce((a, d) => ({
    tokens: a.tokens + d.tokens,
    cost: a.cost + d.cost,
    investigations: a.investigations + d.investigations,
  }), { tokens: 0, cost: 0, investigations: 0 });

  const periodDays = daysBetweenInclusive(startDate, endDate);

  const focusDay = drillIdx != null ? data[drillIdx] : null;

  const scopePeriodLabel = React.useMemo(
    () => usagePeriodScopeLabel(startDate, endDate, focusDay),
    [startDate.getTime(), endDate.getTime(), focusDay],
  );
  const topUsers = React.useMemo(
    () => buildTopUsers(focusDay ? [focusDay] : data),
    [focusDay, data]
  );

  return (
    <div className="layout-page layout-page--usage" data-screen-label="05 Usage & Costs">
      <p className="admin-mobile-label" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', margin: 0 }}>
        {t.admin.sidebar.title}
      </p>
      <div className="usage-header">
        <div>
          <h1 className="users-title" style={{ fontWeight:700, letterSpacing:'-0.02em', margin:0 }}>{t.admin.usage.title}</h1>
          <div className="users-subtitle" style={{ color:'var(--muted-foreground)', marginTop:4 }}>{t.admin.usage.subtitle}</div>
        </div>
        <UsageRangePicker
          range={range}
          customRange={customRange}
          onChange={(next) => { setRange(next.key); setCustomRange(next.customRange); }}
        />
      </div>

      <div className="usage-kpi-grid">
        <UsageSummary
          label={t.admin.usage.kpi.totalCost}
          value={formatUsageCurrency(totals.cost)}
          sub={t.admin.usage.kpi.averagePerDay.replace('{value}', formatAverageCurrency(totals.cost, periodDays))}
          iconBg="color-mix(in srgb, #f43f5e 10%, transparent)" iconColor="#fb7185"
          icon={<IconDollarSign size={16}/>}
        />
        <UsageSummary
          label={t.admin.usage.kpi.tokensConsumed}
          value={formatCompactNumber(totals.tokens, locale)}
          sub={t.admin.usage.kpi.averagePerDay.replace('{value}', formatAverageCompact(totals.tokens, periodDays, locale))}
          iconBg="color-mix(in srgb, #10b981 10%, transparent)" iconColor="#34d399"
          icon={<IconSparkles size={16}/>}
        />
        <UsageSummary
          label={t.admin.usage.kpi.cases}
          value={formatCompactNumber(totals.investigations, locale)}
          sub={t.admin.usage.kpi.averagePerDay.replace('{value}', formatAverageDecimal(totals.investigations, periodDays, locale))}
          iconBg="color-mix(in srgb, #06b6d4 10%, transparent)" iconColor="#22d3ee"
          icon={<IconActivity size={16}/>}
        />
      </div>

      <div className="usage-chart-grid">
        <UsageDailyBreakdown
          data={data}
          bucket={bucket}
          totals={totals}
          selectedIdx={drillIdx}
          onSelect={setDrillIdx}
          t={t}
        />
        <UsageTopUsers users={topUsers} scopeLabel={scopePeriodLabel} t={t} locale={locale}/>
      </div>

      <UsageDrilldown
        day={drillIdx != null ? data[drillIdx] : null}
        rangeData={data}
        rangeTotals={totals}
        scopePeriodLabel={scopePeriodLabel}
        bucket={bucket}
      />
    </div>
  );
}

/** Period tabs + custom range popover — Apolo period-filter.tsx */
function UsageRangePicker({ range, customRange, onChange }) {
  const { lang, t } = useI18n();
  const locale = usageLocale(lang);
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const today = startOfDay(new Date());

  const [draftRange, setDraftRange] = React.useState(
    () => (range === 'custom' && customRange
      ? { from: startOfDay(customRange.from), to: startOfDay(customRange.to) }
      : undefined)
  );

  const isCustom = range === 'custom';
  const canApply = Boolean(draftRange?.from && draftRange?.to);
  const customLabel = isCustom && customRange
    ? formatUsageCustomRangeLabel(customRange.from, customRange.to, locale)
    : t.admin.usage.period.custom;

  const defaultCalendarMonth = draftRange?.from
    ?? (isCustom && customRange ? customRange.from : null)
    ?? (() => { const d = new Date(today); d.setDate(d.getDate() - 29); return d; })();

  const footerHint = draftRange?.from && draftRange?.to
    ? formatUsageRangeFooterLabel(draftRange.from, draftRange.to, locale)
    : t.admin.usage.period.selectRange;

  const handleOpen = (next) => {
    setOpen(next);
    if (next) {
      if (isCustom && customRange) {
        setDraftRange({
          from: startOfDay(customRange.from),
          to: startOfDay(customRange.to),
        });
      } else {
        setDraftRange(undefined);
      }
    }
  };

  const applyCustom = () => {
    if (!draftRange?.from || !draftRange?.to) return;
    onChange({
      key: 'custom',
      customRange: { from: draftRange.from, to: draftRange.to },
    });
    setOpen(false);
  };

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onDoc);
    return () => window.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="usage-period-filter">
      <div className="usage-period-tabs">
        {USAGE_RANGE_PRESETS.map((r) => {
          const active = !isCustom && r.key === range;
          return (
            <button
              key={r.key}
              type="button"
              className={'usage-period-tab' + (active ? ' is-active' : '')}
              aria-pressed={active}
              onClick={() => { onChange({ key: r.key, customRange: null }); setOpen(false); }}
            >
              {usageRangeLabel(t, r.key)}
            </button>
          );
        })}
        <button
          type="button"
          className={'usage-period-tab' + (isCustom ? ' is-active' : '')}
          aria-pressed={isCustom}
          aria-expanded={open}
          onClick={() => handleOpen(!open)}
        >
          <IconCalendar size={16} aria-hidden="true"/>
          <span>{customLabel}</span>
        </button>
      </div>

      {open && (
        <div className="usage-period-popover" role="dialog" aria-label={t.admin.usage.period.custom}>
          <UsageRangeCalendar
            range={draftRange}
            onRangeChange={setDraftRange}
            defaultMonth={defaultCalendarMonth}
            locale={locale}
          />
          <div className="usage-period-popover__footer">
            <span className="usage-period-popover__hint">{footerHint}</span>
            <button
              type="button"
              className="btn btn--primary btn--sm usage-period-popover__apply"
              disabled={!canApply}
              onClick={applyCustom}
            >
              {t.admin.usage.period.applyRange}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UsageSummary({ label, value, sub, iconBg, iconColor, icon }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div style={{ minWidth:0, display:'flex', flexDirection:'column', gap:4 }}>
          <span style={{ fontSize:'0.875rem', color:'var(--muted-foreground)' }}>{label}</span>
          <span style={{ fontSize:'1.875rem', fontWeight:700, lineHeight:1.1, letterSpacing:'-0.02em' }}>{value}</span>
          <span style={{ fontSize:'0.75rem', color:'var(--muted-foreground)', marginTop:4 }}>{sub}</span>
        </div>
        <span style={{
          width:'2.25rem', height:'2.25rem', borderRadius:'0.375rem', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: iconBg, color: iconColor,
        }}>{icon}</span>
      </div>
    </div>
  );
}

// Apolo daily-breakdown-chart.tsx — Recharts 2.15.4 (same UMD bundle as chia/src/apolo)
const {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} = Recharts;

const USAGE_COST_COLOR = '#22d3ee'; // cyan-400
const USAGE_COST_SELECTED = '#0891b2';
const USAGE_CASES_COLOR = '#f87171'; // rose-400
const USAGE_CHART_HEIGHT = 280;

/** UTC labels — Apolo billing-series-chart.ts */
const UTC_MONTH_DAY_LABEL = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
});

function usageBucketChartLabel(d, bucket) {
  if (bucket === 'day' || bucket === 'week') return UTC_MONTH_DAY_LABEL.format(d);
  return formatBucketShort(d, bucket);
}

/** Mock rows → Recharts points (BillingChartPoint shape) */
function usageSeriesToChartPoints(data, bucket) {
  return data.map((d) => ({
    label: usageBucketChartLabel(d.date, bucket),
    bucketStart: toISODate(startOfDay(d.date)),
    cost: d.cost,
    costWithMarkup: d.cost.toFixed(2),
    cases: d.investigations,
  }));
}

function UsageLegendSwatch({ type, color, label }) {
  return (
    <span className="usage-daily-breakdown__legend-item">
      <span
        aria-hidden="true"
        className={'usage-daily-breakdown__legend-mark' + (type === 'line' ? ' is-line' : '')}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

/** Card shell + empty state — Apolo DailyBreakdownChart */
function UsageDailyBreakdown({ data, bucket, totals, selectedIdx, onSelect, t }) {
  const isEmpty = totals.cost === 0 && totals.investigations === 0;
  const costHint = t.admin.usage.chart.costSeries + ' · ' + t.admin.usage.chart.leftAxisHint;
  const casesHint = t.admin.usage.chart.casesSeries + ' · ' + t.admin.usage.chart.rightAxisHint;

  return (
    <div className="card usage-daily-breakdown">
      <div className="usage-daily-breakdown__head">
        <div style={{ minWidth: 0 }}>
          <h2 className="usage-daily-breakdown__title">{t.admin.usage.chart.title}</h2>
          <p className="usage-daily-breakdown__subtitle">{t.admin.usage.chart.subtitle}</p>
        </div>
        <div className="usage-daily-breakdown__legend">
          <UsageLegendSwatch type="bar" color={USAGE_COST_COLOR} label={costHint}/>
          <UsageLegendSwatch type="line" color={USAGE_CASES_COLOR} label={casesHint}/>
        </div>
      </div>

      {isEmpty ? (
        <div className="usage-daily-breakdown__empty">
          <div className="usage-daily-breakdown__empty-inner">
            <IconLineChart size={32} className="usage-daily-breakdown__empty-icon" aria-hidden="true"/>
            <p className="usage-daily-breakdown__empty-title">{t.admin.usage.chart.unavailableTitle}</p>
            <p className="usage-daily-breakdown__empty-desc">{t.admin.usage.chart.unavailableDescription}</p>
          </div>
        </div>
      ) : (
        <UsageChart
          data={data}
          bucket={bucket}
          selectedIdx={selectedIdx}
          onSelect={onSelect}
          t={t}
        />
      )}
    </div>
  );
}

/** Tooltip — copy of Apolo ChartTooltip (daily-breakdown-chart.tsx) */
function UsageChartTooltipContent({ active, payload, label, costLabel, casesLabel, casesNote }) {
  if (!active || !payload?.length) return null;
  const costItem = payload.find((p) => p.dataKey === 'cost');
  const cost = costItem?.payload?.costWithMarkup ?? costItem?.value ?? 0;
  const cases = payload.find((p) => p.dataKey === 'cases')?.value ?? 0;
  return (
    <div className="usage-chart-tooltip">
      <div className="usage-chart-tooltip__label">{label}</div>
      <div className="usage-chart-tooltip__row">
        <span aria-hidden="true" className="usage-daily-breakdown__legend-mark" style={{ backgroundColor: USAGE_COST_COLOR }}/>
        <span className="usage-chart-tooltip__muted">{costLabel}</span>
        <span>{formatUsageCurrency(cost)}</span>
      </div>
      <div className="usage-chart-tooltip__row">
        <span aria-hidden="true" className="usage-daily-breakdown__legend-mark is-line" style={{ backgroundColor: USAGE_CASES_COLOR }}/>
        <span className="usage-chart-tooltip__muted">{casesLabel}</span>
        <span>{cases}</span>
      </div>
      <p className="usage-chart-tooltip__note">{casesNote}</p>
    </div>
  );
}

/** ComposedChart — 1:1 Apolo DailyBreakdownChart */
function UsageChart({ data, bucket = 'day', selectedIdx, onSelect, t }) {
  const chartData = React.useMemo(() => usageSeriesToChartPoints(data, bucket), [data, bucket]);
  const selectedBucketStart = selectedIdx != null ? chartData[selectedIdx]?.bucketStart : null;
  const maxCost = chartData.reduce((max, point) => Math.max(max, point.cost), 0);
  const costAxisDecimals = maxCost < 10 ? 2 : 0;
  const xAxisInterval = chartData.length <= 12 ? 0 : Math.max(1, Math.floor(chartData.length / 8));
  const compactXLabels = chartData.length > 12;
  const canSelectBucket = Boolean(onSelect);
  const axisTickStyle = { fill: 'currentColor', fontSize: 11 };
  const chart = t.admin.usage.chart;

  const handleBarClick = (barData) => {
    if (!barData?.payload || !onSelect) return;
    const idx = chartData.findIndex((p) => p.bucketStart === barData.payload.bucketStart);
    if (idx < 0) return;
    onSelect(selectedIdx === idx ? null : idx);
  };

  return (
    <div className="usage-daily-breakdown__chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{
            top: 8,
            right: 12,
            bottom: compactXLabels ? 40 : 10,
            left: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
          <XAxis
            dataKey="label"
            tick={axisTickStyle}
            tickLine={false}
            axisLine={false}
            interval={xAxisInterval}
            minTickGap={compactXLabels ? 28 : 12}
            angle={compactXLabels ? -35 : 0}
            textAnchor={compactXLabels ? 'end' : 'middle'}
            height={compactXLabels ? 44 : 28}
          />
          <YAxis
            yAxisId="cost"
            tick={axisTickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(costAxisDecimals)}`}
            width={48}
          />
          <YAxis
            yAxisId="cases"
            orientation="right"
            tick={axisTickStyle}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            cursor={{ fill: 'color-mix(in oklch, var(--accent) 35%, transparent)' }}
            content={
              <UsageChartTooltipContent
                costLabel={chart.costSeries}
                casesLabel={chart.casesSeries}
                casesNote={chart.casesTooltipNote}
              />
            }
          />
          <Bar
            yAxisId="cost"
            dataKey="cost"
            fill={USAGE_COST_COLOR}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
            onClick={canSelectBucket ? handleBarClick : undefined}
          >
            {chartData.map((point) => {
              const isSelected = point.bucketStart === selectedBucketStart;
              return (
                <Cell
                  key={point.bucketStart}
                  cursor={canSelectBucket ? 'pointer' : undefined}
                  fill={isSelected ? USAGE_COST_SELECTED : USAGE_COST_COLOR}
                  stroke={isSelected ? 'var(--foreground)' : undefined}
                  strokeWidth={isSelected ? 1 : 0}
                />
              );
            })}
          </Bar>
          <Line
            yAxisId="cases"
            type="monotone"
            dataKey="cases"
            stroke={USAGE_CASES_COLOR}
            strokeWidth={2}
            dot={{ r: 2.5, fill: USAGE_CASES_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDayShort(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDayLong(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ------- top users -------

const USAGE_TOP_USERS = [
  { initials:'DD', name:'Daniel Dorado',     team:'Platform SRE'  },
  { initials:'MR', name:'Marelys Rodríguez', team:'Application'   },
  { initials:'FM', name:'Francisca Molina',  team:'Platform SRE'  },
  { initials:'JV', name:'Jorge Vázquez',     team:'Data'          },
  { initials:'AS', name:'Alex Soto',         team:'Networking'    },
  { initials:'NK', name:'Nadia Kowalski',    team:'Application'   },
  { initials:'TY', name:'Tomás Yáñez',       team:'Security'      },
  { initials:'RP', name:'Rita Park',         team:'Platform SRE'  },
  { initials:'LB', name:'Lucía Bravo',       team:'Data'          },
  { initials:'OW', name:'Owen Wright',       team:'Application'   },
  { initials:'SC', name:'Soraya Câmara',     team:'Networking'    },
  { initials:'EB', name:'Ezra Bahar',        team:'Security'      },
];

function initialsFromName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function buildTopUsers(days) {
  // Aggregate the supplied days into per-user totals using a deterministic
  // weighting derived from the day seed so identical filters yield identical
  // top-user lists.
  const totals = USAGE_TOP_USERS.map(u => ({ ...u, cases:0, tokens:0, cost:0 }));
  if (!days || !days.length) return totals.slice(0, 10);

  for (const d of days) {
    const dayKey = d.date.getTime();
    let s = (Math.floor(d.tokens) ^ dayKey) >>> 0;
    const rand = () => {
      s ^= s << 13; s ^= s >> 17; s ^= s << 5;
      return ((s >>> 0) % 10000) / 10000;
    };
    // long-tail weights so a few power users consume most of the budget
    const weights = USAGE_TOP_USERS.map((_, i) => 0.15 + Math.pow(rand(), 1.6) * (1 + (USAGE_TOP_USERS.length - i) * 0.08));
    const totalW = weights.reduce((a, b) => a + b, 0);

    let casesLeft = d.investigations;
    let tokensLeft = d.tokens;
    let costLeft = d.cost;
    for (let i = 0; i < USAGE_TOP_USERS.length; i++) {
      const isLast = i === USAGE_TOP_USERS.length - 1;
      const share = weights[i] / totalW;
      const cases = isLast ? casesLeft : Math.round(d.investigations * share);
      const tokens = isLast ? tokensLeft : Math.round(d.tokens * share);
      const cost = isLast ? costLeft : +(d.cost * share).toFixed(3);
      totals[i].cases += Math.max(0, cases);
      totals[i].tokens += Math.max(0, tokens);
      totals[i].cost += Math.max(0, cost);
      casesLeft -= cases;
      tokensLeft -= tokens;
      costLeft -= cost;
    }
  }

  totals.sort((a, b) => b.cost - a.cost);
  return totals.slice(0, 5);
}

// Top consumidores — mirrors chia/.../top-users-panel.tsx
function UsageTopUsers({ users, scopeLabel, t, locale }) {
  const top = users.slice(0, 5);
  const hasData = top.some(u => u.cost > 0 || u.tokens > 0);

  return (
    <div className="usage-top-users card" aria-live="polite">
      <div className="usage-panel-header">
        <h2 className="usage-panel-header__title">{t.admin.usage.topUsers.title}</h2>
        <p className="usage-panel-header__subtitle">
          {t.admin.usage.topUsers.subtitle.replace('{period}', scopeLabel)}
        </p>
      </div>

      {!hasData ? (
        <div className="usage-top-users-empty">
          <div className="usage-top-users-empty__icon">
            <IconUsersRound size={24}/>
          </div>
          <p className="usage-top-users-empty__title">{t.admin.usage.topUsers.unavailableTitle}</p>
          <p className="usage-top-users-empty__desc">{t.admin.usage.topUsers.unavailableDescription}</p>
        </div>
      ) : (
        <div className="usage-top-users-list">
          {top.map(u => (
            <div key={`${u.initials}-${u.name}`} className="usage-top-users-row">
              <div className="usage-top-users-avatar" aria-hidden="true">
                {u.initials || initialsFromName(u.name)}
              </div>
              <div className="usage-top-users-body">
                <span className="usage-top-users-name">{u.name}</span>
                <p className="usage-top-users-meta">
                  {formatInteger(u.cases, locale)} {t.admin.usage.topUsers.casesShort} ·{' '}
                  {formatCompactNumber(u.tokens, locale)} {t.admin.usage.topUsers.tokensShort}
                </p>
              </div>
              <p className="usage-top-users-cost">{formatUsageCurrency(u.cost)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------- drilldown -------

const USAGE_DRILLDOWN_TITLES = [
  ['Disk Space Low', 'low', 'PROCESSING'], ['High API Error Rate', 'high', 'PROCESSING'], ['Memory Leak Detected', 'high', 'CLOSED'],
  ['Network Latency Spike', 'medium', 'AWAITING_ACTION'], ['SSL Certificate Expiring', 'info', 'CLOSED'], ['Redis Cache Miss Rate High', 'low', 'PROCESSING'],
  ['High CPU Usage', 'medium', 'PROCESSING'], ['Pod CrashLoopBackOff', 'high', 'AWAITING_ACTION'], ['Queue Backlog Growing', 'medium', 'PROCESSING'],
  ['Database Connection Saturation', 'high', 'CLOSED'], ['Certificate rotation reminder', 'info', 'CLOSED'], ['DNS resolution slow', 'low', 'PROCESSING'],
];

function buildUsageDayCases(day) {
  // Distribute the day's totals across N cases with a long-tail pattern so
  // a few cases dominate the cost (which is realistic for AI-assisted ops).
  const n = day.investigations;
  let s = Math.floor(day.tokens) + 7;
  const rand = () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
  const weights = Array.from({ length: n }, () => 0.2 + rand());
  const totalW = weights.reduce((a, b) => a + b, 0);
  const out = [];
  for (let i = 0; i < n; i++) {
    const tokens = Math.round((day.tokens * weights[i]) / totalW);
    const cost = +(tokens * 0.0000054).toFixed(3);
    const [title, sev, caseStatus] = USAGE_DRILLDOWN_TITLES[Math.floor(rand() * USAGE_DRILLDOWN_TITLES.length)];
    const caseNum = 100 + Math.floor(rand() * 900);
    out.push({
      caseId: caseNum,
      case_id: caseNum,
      alert_name: title,
      title, sev,
      case_status: caseStatus,
      caseStatus: caseStatus === 'CLOSED' ? 'closed' : caseStatus === 'AWAITING_ACTION' ? 'awaiting' : 'processing',
      tokens, cost,
      cost_with_markup: String(cost),
    });
  }
  out.sort((a, b) => b.cost - a.cost);
  return out;
}

/** Resolve EVENTS array index for top-cases row (Apolo alert detail link). */
function findEventIndexForCase(c) {
  const events = typeof EVENTS !== 'undefined' ? EVENTS : [];
  if (!events.length) return null;
  const caseId = c.case_id ?? c.caseId;
  if (caseId != null) {
    const byCase = events.findIndex(e => e.case_id === caseId);
    if (byCase >= 0) return byCase;
  }
  const name = c.alert_name || c.title;
  if (name) {
    const byName = events.findIndex(e => e.alert_name === name || e.title === name);
    if (byName >= 0) return byName;
  }
  return null;
}

function UsageTopCasesEventCell({ c }) {
  const label = c.alert_name || c.title;
  const idx = findEventIndexForCase(c);
  if (idx == null) {
    return <span className="usage-top-cases-event-text">{label}</span>;
  }
  return (
    <a href={`#/events/${idx}`} className="usage-top-cases-event-link">
      {label}
    </a>
  );
}

function UsageDrilldown({ day, rangeData, rangeTotals, scopePeriodLabel, bucket = 'day' }) {
  const { lang, t } = useI18n();
  const locale = usageLocale(lang);
  const isDay = day != null;

  const cases = React.useMemo(() => {
    const all = isDay
      ? buildUsageDayCases(day)
      : rangeData.flatMap(d => buildUsageDayCases(d));
    all.sort((a, b) => b.cost - a.cost);
    return all.slice(0, 10);
  }, [isDay, day, rangeData]);

  const summaryTokens = cases.reduce((s, c) => s + c.tokens, 0);
  const summaryCost = cases.reduce((s, c) => s + c.cost, 0);
  const summaryText = t.admin.usage.topCases.summary
    .replace('{count}', formatInteger(cases.length, locale))
    .replace('{tokens}', formatCompactNumber(summaryTokens, locale))
    .replace('{cost}', formatUsageCurrency(summaryCost));

  const cols = t.admin.usage.topCases.columns;

  return (
    <div className="card" style={{
      marginTop: 14, overflow: 'hidden',
      border: isDay ? '1px solid var(--accent-2)' : undefined,
      boxShadow: isDay ? '0 0 0 3px var(--accent-glow)' : undefined,
    }}>
      <div className="usage-top-cases-header">
        <div style={{ minWidth: 0 }}>
          <h2 className="usage-top-cases-header__title">{t.admin.usage.topCases.title}</h2>
          <p className="usage-top-cases-header__subtitle">
            {t.admin.usage.topCases.subtitle.replace('{period}', scopePeriodLabel)}
          </p>
        </div>
        {cases.length > 0 && (
          <p className="usage-top-cases-header__summary">{summaryText}</p>
        )}
      </div>
      {cases.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.admin.usage.topCases.emptyTitle}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 6 }}>{t.admin.usage.topCases.emptyDescription}</div>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ background: 'color-mix(in oklch, var(--muted) 40%, transparent)' }}>
              <th style={usageDrillTh}>{cols.case}</th>
              <th style={usageDrillTh}>{cols.title}</th>
              <th style={usageDrillTh}>{cols.status}</th>
              <th style={{ ...usageDrillTh, textAlign: 'right' }}>{cols.tokens}</th>
              <th style={{ ...usageDrillTh, textAlign: 'right' }}>{cols.cost}</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--line)' }}>
                <td className="mono" style={{ ...usageDrillTd, paddingLeft: 20, fontSize: '0.75rem', fontWeight: 600 }}>#{c.case_id || c.caseId}</td>
                <td className="usage-top-cases-event-cell" style={usageDrillTd}>
                  <UsageTopCasesEventCell c={c}/>
                </td>
                <td style={usageDrillTd}>
                  <CaseStatusBadge caseStatus={c.case_status} status={c.caseStatus}/>
                </td>
                <td className="mono" style={{ ...usageDrillTd, textAlign: 'right', color: 'var(--fg-2)' }}>{formatInteger(c.tokens, locale)}</td>
                <td className="mono" style={{ ...usageDrillTd, fontWeight: 600, textAlign: 'right' }}>{formatUsageCurrency(c.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const usageDrillTh = {
  textAlign:'left', fontWeight:500, fontSize:'0.75rem', color:'var(--muted-foreground)',
  padding:'12px 16px', whiteSpace:'nowrap',
};
const usageDrillTd = { padding:'12px 16px', verticalAlign:'middle' };

Object.assign(window, { UsageMetricsPage });
