// Usage & Costs — daily breakdown of tokens consumed, spend, and resolved
// investigations for a selected time range. Admin-only; lives at
// #/admin/usage. All data here is mocked deterministically so the chart is
// stable as the user flips between range presets.

const BUCKET_NOUN  = { hour:'hour',  day:'day',   week:'week',   month:'month',  year:'year'   };
const BUCKET_TITLE = { hour:'Hourly breakdown', day:'Daily breakdown', week:'Weekly breakdown', month:'Monthly breakdown', year:'Yearly breakdown' };

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

function generateUsageData(startDate, endDate, bucket) {
  const boundaries = bucketBoundaries(startDate, endDate, bucket);
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

const USAGE_RANGES = [
  { key: 'today', label: 'Today',        today: true },
  { key: '7d',    label: 'Last 7 days',  days: 7  },
  { key: '30d',   label: 'Last 30 days', days: 30 },
  { key: '90d',   label: 'Last 90 days', days: 90 },
];

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

function UsageMetricsPage() {
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
    const cfg = USAGE_RANGES.find(r => r.key === range);
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

  const maxes = {
    cost: Math.max(...data.map(d => d.cost), 0.01),
    tokens: Math.max(...data.map(d => d.tokens), 1),
    investigations: Math.max(...data.map(d => d.investigations), 1),
  };
  const avg = {
    tokens: Math.round(totals.tokens / data.length),
    cost: totals.cost / data.length,
    investigations: totals.investigations / data.length,
  };

  const rangeLabel = React.useMemo(() => {
    if (range === 'custom' && customRange) {
      return `${formatDMY(customRange.from)} → ${formatDMY(customRange.to)}`;
    }
    return USAGE_RANGES.find(r => r.key === range)?.label || 'Selected range';
  }, [range, customRange]);

  const focusDay = drillIdx != null ? data[drillIdx] : null;
  const topUsers = React.useMemo(
    () => buildTopUsers(focusDay ? [focusDay] : data),
    [focusDay, data]
  );

  const bucketNoun = BUCKET_NOUN[bucket];
  const bucketTitle = BUCKET_TITLE[bucket];

  return (
    <div data-screen-label="05 Usage & Costs" style={{ padding:'22px 28px 40px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.02em', margin:0 }}>Usage & Costs</h1>
          <div style={{ fontSize:12.5, color:'var(--fg-3)', marginTop:4 }}>Monitor AI consumption and automation ROI over time</div>
        </div>
        <UsageRangePicker
          range={range}
          customRange={customRange}
          onChange={(next) => { setRange(next.key); setCustomRange(next.customRange); }}
        />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, marginBottom:18 }}>
        <UsageSummary
          label="Total cost"
          value={`$${totals.cost.toFixed(2)}`}
          sub={`avg $${avg.cost.toFixed(2)} / ${bucketNoun}`}
          accent="var(--sev-crit)"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <UsageSummary
          label="Tokens consumed"
          value={formatTokens(totals.tokens)}
          sub={`avg ${formatTokens(avg.tokens)} / ${bucketNoun}`}
          accent="var(--sev-ok)"
          icon={<IconSparkle size={16}/>}
        />
        <UsageSummary
          label="Investigations resolved"
          value={totals.investigations.toLocaleString()}
          sub={`avg ${avg.investigations.toFixed(1)} / ${bucketNoun}`}
          accent="var(--accent)"
          icon={<IconInvestigate size={16} active/>}
        />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1fr) 320px', gap:14, alignItems:'start' }}>
        <div style={{
          background:'var(--bg-2)', border:'1px solid var(--line)',
          borderRadius:12, padding:'18px 20px 22px',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, gap:16, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:13.5, fontWeight:600 }}>{bucketTitle}</div>
              <div style={{ fontSize:11.5, color:'var(--fg-3)', marginTop:2 }}>
                Hover for exact values · click a {bucketNoun} to filter the case list below
              </div>
            </div>
            <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
              <UsageLegendDot color="var(--accent)" label="Cost ($) · left axis"/>
              <UsageLegendLine color="var(--sev-crit)" label="Cases · right axis"/>
            </div>
          </div>
          <UsageChart
            data={data}
            maxes={maxes}
            bucket={bucket}
            selectedIdx={drillIdx}
            onSelect={setDrillIdx}
          />
        </div>
        <UsageTopUsers users={topUsers} scopeLabel={focusDay ? formatBucketLong(focusDay.date, bucket) : rangeLabel}/>
      </div>

      <UsageDrilldown
        day={drillIdx != null ? data[drillIdx] : null}
        rangeData={data}
        rangeTotals={totals}
        rangeLabel={rangeLabel}
        bucket={bucket}
        onClose={() => setDrillIdx(null)}
      />
    </div>
  );
}

function UsageRangePicker({ range, customRange, onChange }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  const today = startOfDay(new Date());
  const todayISO = toISODate(today);

  const defaultFrom = React.useMemo(() => {
    if (customRange) return customRange.from;
    const d = new Date(today); d.setDate(d.getDate() - 29);
    return d;
  }, [customRange]);
  const defaultTo = customRange?.to || today;

  const [from, setFrom] = React.useState(toISODate(defaultFrom));
  const [to, setTo] = React.useState(toISODate(defaultTo));

  React.useEffect(() => {
    if (open) {
      setFrom(toISODate(defaultFrom));
      setTo(toISODate(defaultTo));
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onDoc);
    return () => window.removeEventListener('mousedown', onDoc);
  }, [open]);

  const isCustom = range === 'custom';
  const valid = from && to && fromISODate(from) <= fromISODate(to);
  const customLabel = isCustom && customRange
    ? `${formatDMY(customRange.from)} → ${formatDMY(customRange.to)}`
    : 'Custom';

  const apply = () => {
    if (!valid) return;
    onChange({ key: 'custom', customRange: { from: fromISODate(from), to: fromISODate(to) } });
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position:'relative', display:'inline-flex' }}>
      <div style={{
        display:'inline-flex', gap:2, padding:3, borderRadius:9,
        background:'var(--bg-2)', border:'1px solid var(--line)',
      }}>
        {USAGE_RANGES.map(r => {
          const active = !isCustom && r.key === range;
          return (
            <button key={r.key} onClick={() => onChange({ key: r.key, customRange: null })} style={{
              padding:'6px 12px', borderRadius:6,
              background: active ? 'var(--bg-3)' : 'transparent',
              border: active ? '1px solid var(--line-2)' : '1px solid transparent',
              color: active ? 'var(--fg)' : 'var(--fg-2)',
              fontSize:12, fontWeight: active ? 600 : 500,
              transition:'all .12s',
            }}>{r.label}</button>
          );
        })}
        <button onClick={() => setOpen(o => !o)} title="Custom range" style={{
          padding:'6px 12px', borderRadius:6,
          background: isCustom ? 'var(--bg-3)' : 'transparent',
          border: isCustom ? '1px solid var(--line-2)' : '1px solid transparent',
          color: isCustom ? 'var(--fg)' : 'var(--fg-2)',
          fontSize:12, fontWeight: isCustom ? 600 : 500,
          display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {customLabel}
        </button>
      </div>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:30,
          background:'var(--bg-2)', border:'1px solid var(--line-2)', borderRadius:10,
          padding:'14px', minWidth:300,
          boxShadow:'0 22px 40px -12px rgba(0,0,0,0.55)',
        }}>
          <div style={{ fontSize:12, color:'var(--fg-3)', marginBottom:10, letterSpacing:'0.02em' }}>
            Custom range
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <label style={pickerLabelStyle}>
              From
              <input type="date" value={from} max={to || todayISO}
                onChange={e => setFrom(e.target.value)} style={pickerInputStyle}/>
            </label>
            <label style={pickerLabelStyle}>
              To
              <input type="date" value={to} min={from} max={todayISO}
                onChange={e => setTo(e.target.value)} style={pickerInputStyle}/>
            </label>
          </div>
          {!valid && (
            <div style={{ fontSize:11, color:'var(--sev-crit)', marginBottom:10 }}>
              "From" must be on or before "To".
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={() => setOpen(false)} style={pickerSecondaryStyle}>Cancel</button>
            <button onClick={apply} disabled={!valid} style={pickerPrimaryStyle(!valid)}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

const pickerLabelStyle = {
  display:'flex', flexDirection:'column', gap:5,
  fontSize:11, color:'var(--fg-3)', letterSpacing:'0.02em',
};
const pickerInputStyle = {
  background:'var(--bg)', border:'1px solid var(--line-2)', borderRadius:7,
  padding:'7px 9px', color:'var(--fg)', fontSize:12, fontFamily:'inherit',
  colorScheme:'inherit',
};
const pickerSecondaryStyle = {
  padding:'6px 12px', borderRadius:7, fontSize:11.5,
  background:'var(--bg)', border:'1px solid var(--line-2)', color:'var(--fg-2)',
};
const pickerPrimaryStyle = (disabled) => ({
  padding:'6px 14px', borderRadius:7, fontSize:11.5, fontWeight:600,
  background: disabled ? 'var(--bg-3)' : 'var(--accent)',
  border: '1px solid ' + (disabled ? 'var(--line-2)' : 'var(--accent)'),
  color: disabled ? 'var(--fg-4)' : 'var(--accent-ink)',
  opacity: disabled ? 0.6 : 1,
});

function UsageSummary({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      padding:'16px 18px', borderRadius:12,
      background:'var(--bg-2)', border:'1px solid var(--line)',
      display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12,
    }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:11.5, color:'var(--fg-3)' }}>{label}</div>
        <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.02em', marginTop:4 }}>{value}</div>
        <div className="mono" style={{ fontSize:11, color:'var(--fg-4)', marginTop:4 }}>{sub}</div>
      </div>
      <div style={{
        width:34, height:34, borderRadius:9,
        background:`color-mix(in oklch, ${accent} 18%, transparent)`,
        border:`1px solid color-mix(in oklch, ${accent} 35%, transparent)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        color: accent, flexShrink:0,
      }}>{icon}</div>
    </div>
  );
}

function UsageLegendDot({ color, label }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11.5, color:'var(--fg-2)' }}>
      <span style={{
        width:10, height:10, borderRadius:3,
        background: color,
        border:`1px solid color-mix(in oklch, ${color} 45%, transparent)`,
      }}/>
      {label}
    </div>
  );
}

function UsageLegendLine({ color, label }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11.5, color:'var(--fg-2)' }}>
      <svg width="18" height="10" viewBox="0 0 18 10">
        <path d="M0 5 L18 5" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" fill="none"/>
      </svg>
      {label}
    </div>
  );
}

function UsageChart({ data, maxes, bucket = 'day', selectedIdx, onSelect }) {
  const W = 1000;
  const H = 400;
  const PAD_L = 56, PAD_R = 56, PAD_T = 16, PAD_B = 34;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const bandW = innerW / data.length;
  const barW = Math.max(5, Math.min(26, bandW * 0.62));
  const bottom = PAD_T + innerH;

  // Bars = cost (left axis, $). Line = investigations / cases (right axis).
  const yMaxCost = niceCeil(maxes.cost);
  const yMaxCases = niceCeil(maxes.investigations);

  const gridSteps = 5;
  const yLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const y = PAD_T + innerH * (1 - i / gridSteps);
    const costAt = (i / gridSteps) * yMaxCost;
    const casesAt = (i / gridSteps) * yMaxCases;
    return { y, costAt, casesAt, isBase: i === 0 };
  });

  const tickEvery = data.length <= 10 ? 1 : data.length <= 35 ? 5 : 10;

  const linePoints = data.map((d, i) => {
    const x = PAD_L + i * bandW + bandW / 2;
    const y = bottom - (d.investigations / yMaxCases) * innerH;
    return { x, y };
  });
  const linePath = linePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const containerRef = React.useRef(null);
  const [hover, setHover] = React.useState(null);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const svgX = (localX / rect.width) * W;
    const idx = Math.floor((svgX - PAD_L) / bandW);
    if (idx < 0 || idx >= data.length) { setHover(null); return; }
    const cx = PAD_L + idx * bandW + bandW / 2;
    const barH = (data[idx].cost / yMaxCost) * innerH;
    const topY = bottom - barH;
    setHover({ idx, cx, topY });
  };

  return (
    <div ref={containerRef} style={{ position:'relative', width:'100%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display:'block', height:'auto', aspectRatio: `${W} / ${H}`, overflow:'visible', cursor: hover ? 'pointer' : 'default' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid + dual axis labels */}
        {yLines.map((l, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={l.y} y2={l.y}
              stroke="var(--line)" strokeWidth="1"
              strokeDasharray={l.isBase ? '' : '2 4'}
              opacity={l.isBase ? 1 : 0.7}/>
            <text x={PAD_L - 10} y={l.y + 3} textAnchor="end"
              fontSize="10" fill="var(--fg-4)" fontFamily="Geist Mono, monospace">
              ${formatAxisCost(l.costAt)}
            </text>
            <text x={W - PAD_R + 10} y={l.y + 3} textAnchor="start"
              fontSize="10" fill="var(--fg-4)" fontFamily="Geist Mono, monospace">
              {Math.round(l.casesAt)}
            </text>
          </g>
        ))}

        {/* Axis titles */}
        <text x={PAD_L - 38} y={PAD_T - 4} textAnchor="start"
          fontSize="10" fill="var(--fg-3)" fontWeight="500">Cost ($)</text>
        <text x={W - PAD_R + 38} y={PAD_T - 4} textAnchor="end"
          fontSize="10" fill="var(--fg-3)" fontWeight="500">Cases</text>

        {/* Bars (cost) */}
        {data.map((day, i) => {
          const bandX = PAD_L + i * bandW;
          const cx = bandX + bandW / 2;
          const x = cx - barW / 2;
          const barH = (day.cost / yMaxCost) * innerH;
          const y = bottom - barH;
          const isHover = hover?.idx === i;
          const isSelected = selectedIdx === i;
          const dim = selectedIdx != null && !isSelected;
          const handleClick = () => onSelect && onSelect(isSelected ? null : i);
          return (
            <g key={i} onClick={handleClick} style={{ cursor:'pointer' }}>
              <rect x={bandX} y={PAD_T} width={bandW} height={innerH}
                fill={isSelected ? 'var(--accent-glow)' : 'var(--bg-hover)'}
                opacity={isSelected ? 0.55 : isHover ? 0.35 : 0}/>
              <rect x={x} y={y} width={barW} height={Math.max(barH, 0.5)}
                rx="2" ry="2"
                fill="var(--accent)"
                opacity={dim ? 0.4 : (isHover || isSelected ? 1 : 0.88)}/>
            </g>
          );
        })}

        {/* Cases line (right axis) */}
        <path d={linePath} fill="none"
          stroke="var(--sev-crit)" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
        {linePoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hover?.idx === i ? 3.2 : 2.2}
            fill="var(--bg-2)" stroke="var(--sev-crit)" strokeWidth="1.4"/>
        ))}

        {/* Hover guide */}
        {hover && (
          <line x1={hover.cx} x2={hover.cx}
            y1={PAD_T} y2={bottom}
            stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6"/>
        )}

        {/* X-axis labels */}
        {data.map((day, i) => {
          if (i % tickEvery !== 0 && i !== data.length - 1) return null;
          const cx = PAD_L + i * bandW + bandW / 2;
          return (
            <text key={i} x={cx} y={H - PAD_B + 18} textAnchor="middle"
              fontSize="10" fill={selectedIdx === i ? 'var(--accent)' : 'var(--fg-3)'}
              fontFamily="Geist Mono, monospace"
              fontWeight={selectedIdx === i ? 600 : 400}>
              {formatBucketShort(day.date, bucket)}
            </text>
          );
        })}
      </svg>

      {hover && (
        <UsageTooltip
          day={data[hover.idx]}
          bucket={bucket}
          svgCx={hover.cx}
          svgTopY={hover.topY}
          svgW={W}
          svgH={H}
          containerRef={containerRef}
        />
      )}
    </div>
  );
}

function niceCeil(v) {
  if (!isFinite(v) || v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  let nf;
  if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 2.5) nf = 2.5;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * exp;
}

function formatAxisCost(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  if (v >= 100) return v.toFixed(0);
  return v.toFixed(1);
}

function UsageTooltip({ day, bucket = 'day', svgCx, svgTopY, svgW, svgH, containerRef }) {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ left: 0, top: 0, ready: false });

  React.useLayoutEffect(() => {
    const el = ref.current;
    const box = containerRef.current?.getBoundingClientRect();
    if (!el || !box) return;
    const ratioX = box.width / svgW;
    const ratioY = box.height / svgH;
    const anchorX = svgCx * ratioX;
    const anchorY = svgTopY * ratioY;
    const tipW = el.offsetWidth;
    const tipH = el.offsetHeight;
    let left = anchorX - tipW / 2;
    let top = anchorY - tipH - 12;
    left = Math.max(4, Math.min(left, box.width - tipW - 4));
    if (top < 4) top = anchorY + 18;
    setPos({ left, top, ready: true });
  }, [svgCx, svgTopY, svgW, svgH]);

  const costPerK = day.tokens > 0 ? (day.cost / day.tokens) * 1000 : 0;

  return (
    <div ref={ref} style={{
      position:'absolute', left: pos.left, top: pos.top,
      width: 232, padding:'11px 13px',
      background:'var(--bg)', border:'1px solid var(--line-2)', borderRadius:10,
      boxShadow:'0 22px 40px -12px rgba(0,0,0,0.55)',
      pointerEvents:'none', zIndex:5,
      opacity: pos.ready ? 1 : 0,
      transition:'opacity .12s ease',
    }}>
      <div className="mono" style={{ fontSize:11, color:'var(--fg-3)', letterSpacing:'0.08em', marginBottom:8 }}>
        {formatBucketLong(day.date, bucket).toUpperCase()}
      </div>
      <UsageTipRow color="var(--accent)" label="Cost" value={`$${day.cost.toFixed(2)}`}/>
      <UsageTipRow color="var(--sev-crit)" label="Cases" value={day.investigations.toLocaleString()}/>
      <UsageTipRow color="var(--fg-3)" label="Tokens" value={day.tokens.toLocaleString()}/>
      <div style={{ height:1, background:'var(--line)', margin:'8px 0 6px' }}/>
      <div className="mono" style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'var(--fg-4)' }}>
        <span>cost / 1k tokens</span>
        <span>${costPerK.toFixed(4)}</span>
      </div>
    </div>
  );
}

function UsageTipRow({ color, label, value }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'3px 0' }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
        <span style={{ width:8, height:8, borderRadius:2, background:color }}/>
        <span style={{ fontSize:12, color:'var(--fg-2)' }}>{label}</span>
      </span>
      <span className="mono" style={{ fontSize:12, fontWeight:600, color:'var(--fg)' }}>{value}</span>
    </div>
  );
}

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'k';
  return Math.round(n).toString();
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

const USAGE_USER_COLORS = [
  'var(--accent)', 'var(--sev-ok)', 'var(--sev-crit)', 'var(--sev-warn)',
  'var(--sev-med)', 'var(--sev-low)', 'var(--sev-info)', 'var(--fg-2)',
  'var(--accent-2)', 'var(--sev-high)',
];

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
  return totals.slice(0, 10);
}

function UsageTopUsers({ users, scopeLabel }) {
  return (
    <div style={{
      background:'var(--bg-2)', border:'1px solid var(--line)',
      borderRadius:12, display:'flex', flexDirection:'column', minHeight:0,
    }}>
      <div style={{ padding:'10px 16px 8px', borderBottom:'1px solid var(--line)' }}>
        <div style={{ fontSize:13, fontWeight:600 }}>Top users</div>
        <div style={{ fontSize:11, color:'var(--fg-3)', marginTop:1 }}>
          Highest spend · {scopeLabel}
        </div>
      </div>
      <div style={{ padding:'4px 6px 6px', overflowY:'auto' }}>
        {users.map((u, i) => {
          const color = USAGE_USER_COLORS[i % USAGE_USER_COLORS.length];
          return (
            <div key={u.initials} style={{
              display:'grid',
              gridTemplateColumns:'16px 24px minmax(0, 1fr) auto',
              alignItems:'center', gap:9,
              padding:'4px 10px', borderRadius:8,
            }}>
              <div className="mono" style={{ fontSize:10.5, color:'var(--fg-3)', textAlign:'right' }}>
                {i + 1}
              </div>
              <div style={{
                width:24, height:24, borderRadius:'50%',
                background:`color-mix(in oklch, ${color} 18%, transparent)`,
                border:`1px solid color-mix(in oklch, ${color} 45%, transparent)`,
                color, fontSize:10, fontWeight:600,
                display:'inline-flex', alignItems:'center', justifyContent:'center',
              }}>{u.initials}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:1.2 }}>{u.name}</div>
                <div className="mono" style={{ fontSize:10, color:'var(--fg-3)', marginTop:1, display:'flex', gap:6, flexWrap:'wrap', lineHeight:1.2 }}>
                  <span>{u.cases} cases</span>
                  <span>·</span>
                  <span>{formatTokens(u.tokens)} tok</span>
                </div>
              </div>
              <div className="mono" style={{ fontSize:11.5, fontWeight:600, textAlign:'right', whiteSpace:'nowrap' }}>
                ${u.cost.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------- drilldown -------

const USAGE_DRILLDOWN_TITLES = [
  ['Disk Space Low', 'low'], ['High API Error Rate', 'high'], ['Memory Leak Detected', 'high'],
  ['Network Latency Spike', 'medium'], ['SSL Certificate Expiring', 'info'], ['Redis Cache Miss Rate High', 'low'],
  ['High CPU Usage', 'medium'], ['Pod CrashLoopBackOff', 'high'], ['Queue Backlog Growing', 'medium'],
  ['Database Connection Saturation', 'high'], ['Certificate rotation reminder', 'info'], ['DNS resolution slow', 'low'],
];

const USAGE_DRILLDOWN_SERVICES = [
  'api-gateway', 'storage-04', 'payments', 'web-prod-01', 'workers-eu', 'edge-eu-west', 'redis-3',
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
    const [title, sev] = USAGE_DRILLDOWN_TITLES[Math.floor(rand() * USAGE_DRILLDOWN_TITLES.length)];
    out.push({
      caseId: `#${100 + Math.floor(rand() * 900)}`,
      title, sev,
      service: USAGE_DRILLDOWN_SERVICES[Math.floor(rand() * USAGE_DRILLDOWN_SERVICES.length)],
      tokens, cost,
      auto: rand() > 0.45,
    });
  }
  out.sort((a, b) => b.cost - a.cost);
  return out;
}

function UsageDrilldown({ day, rangeData, rangeTotals, rangeLabel, bucket = 'day', onClose }) {
  const isDay = day != null;
  const cases = React.useMemo(() => {
    const all = isDay
      ? buildUsageDayCases(day)
      : rangeData.flatMap(d => buildUsageDayCases(d));
    all.sort((a, b) => b.cost - a.cost);
    return all.slice(0, 10);
  }, [isDay, day, rangeData]);

  const headerTitle = isDay
    ? `Top 10 cases · ${formatBucketLong(day.date, bucket)}`
    : `Top 10 cases · ${rangeLabel}`;
  const headerSub = isDay
    ? `${day.investigations} investigations · ${day.tokens.toLocaleString()} tokens · $${day.cost.toFixed(2)}`
    : `${rangeTotals.investigations.toLocaleString()} investigations · ${rangeTotals.tokens.toLocaleString()} tokens · $${rangeTotals.cost.toFixed(2)}`;

  return (
    <div style={{
      marginTop:14,
      background:'var(--bg-2)',
      border: isDay ? '1px solid var(--accent-2)' : '1px solid var(--line)',
      borderRadius:12, overflow:'hidden',
      boxShadow: isDay ? '0 0 0 3px var(--accent-glow)' : 'none',
    }}>
      <div style={{
        padding:'12px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap',
      }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600 }}>{headerTitle}</div>
          <div className="mono" style={{ fontSize:11, color:'var(--fg-3)', marginTop:3 }}>{headerSub}</div>
        </div>
      </div>
      <div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'var(--bg-2)' }}>
              <th style={usageDrillTh}>Case</th>
              <th style={usageDrillTh}>Severity</th>
              <th style={usageDrillTh}>Title</th>
              <th style={usageDrillTh}>Service</th>
              <th style={usageDrillTh}>Resolution</th>
              <th style={{ ...usageDrillTh, textAlign:'right' }}>Tokens</th>
              <th style={{ ...usageDrillTh, textAlign:'right' }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, i) => (
              <tr key={i} style={{ borderTop:'1px solid var(--line)' }}>
                <td className="mono" style={usageDrillTd}>{c.caseId}</td>
                <td style={usageDrillTd}><SeverityPill sev={c.sev}/></td>
                <td style={usageDrillTd}>{c.title}</td>
                <td className="mono" style={{ ...usageDrillTd, color:'var(--fg-2)' }}>{c.service}</td>
                <td style={usageDrillTd}>
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:5,
                    padding:'1px 8px', borderRadius:99,
                    background: c.auto ? 'color-mix(in oklch, var(--sev-ok) 14%, transparent)' : 'var(--bg-3)',
                    border:`1px solid ${c.auto ? 'color-mix(in oklch, var(--sev-ok) 30%, transparent)' : 'var(--line)'}`,
                    color: c.auto ? 'var(--sev-ok)' : 'var(--fg-3)',
                    fontSize:10.5,
                  }}>
                    {c.auto ? 'AI auto' : 'SRE assisted'}
                  </span>
                </td>
                <td className="mono" style={{ ...usageDrillTd, color:'var(--fg-2)', textAlign:'right' }}>{c.tokens.toLocaleString()}</td>
                <td className="mono" style={{ ...usageDrillTd, fontWeight:600, textAlign:'right' }}>${c.cost.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const usageDrillTh = {
  textAlign:'left', fontWeight:500, fontSize:11, color:'var(--fg-3)',
  padding:'9px 12px', borderBottom:'1px solid var(--line)', whiteSpace:'nowrap',
};
const usageDrillTd = { padding:'9px 12px', verticalAlign:'middle' };

Object.assign(window, { UsageMetricsPage });
