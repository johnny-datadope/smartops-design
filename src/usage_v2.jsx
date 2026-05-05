// Usage & Costs · Proposal (v2)
//
// Builds on top of the basic v1 dashboard with:
//   1. ROI framing — time + $ saved alongside spend.
//   2. Budget tracking with end-of-month projection.
//   3. Period-over-period deltas in every KPI.
//   4. Click-to-drilldown: any bar opens that day's case list inline.
//   5. Top cost-driving alerts (noise-reduction lever for SREs).
//   6. AI accuracy panel sourced from the existing 👍/👎 feedback.
//
// All data is mocked deterministically (xorshift seed) so the view stays
// stable while the user explores it. v1 is intentionally untouched and
// stays accessible at #/admin/usage.

function generateUsageDataV2(startDate, endDate, seed = 73) {
  let s = seed;
  const rand = () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
  const out = [];
  const days = daysBetweenInclusiveV2(startDate, endDate);
  // Synthetic spike a few days into the window to keep the in-chart marker
  // demonstrable across any range length.
  const spikeIdx = Math.max(2, Math.floor(days / 6));
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6 ? 0.55 : 1;
    const trend = 0.75 + 0.45 * (i / Math.max(days - 1, 1));
    const noise = 0.75 + rand() * 0.5;
    const spike = i === spikeIdx ? 2.4 : 1;
    const tokens = Math.max(4200, Math.round(34000 * weekend * trend * noise * spike));
    const cost = +(tokens * 0.0000054).toFixed(3);
    const investigations = Math.max(1, Math.round(17 * weekend * trend * noise));
    out.push({ date: d, tokens, cost, investigations, isSpike: spike > 1 });
  }
  return out;
}

const USAGE_RANGES_V2 = [
  { key: '7d',  label: 'Last 7 days',  days: 7  },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
];

// ---- date helpers (local TZ) ----

function startOfDayV2(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function daysBetweenInclusiveV2(start, end) {
  const ms = startOfDayV2(end) - startOfDayV2(start);
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

function toISODateV2(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
}

function fromISODateV2(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDMYV2(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const METRIC_ALLOC_V2 = { cost: 0.28, tokens: 0.44, investigations: 0.28 };

// Knobs for the ROI calculation. In a real workspace these would live in
// settings; here they're constants so the demo is reproducible.
//   - SRE_HOURLY_RATE: fully-loaded cost of an SRE hour ($/h).
//   - MIN_SAVED_PER_INVESTIGATION: average minutes saved when the AI resolves
//     (or pre-investigates) an alert that an SRE would otherwise triage.
//   - MONTHLY_BUDGET: workspace-level monthly cap admins set in Billing.
//   - BLENDED_TOKEN_RATE: $/token used to translate tokens → cost
//     (80% input @ $3/Mtok + 20% output @ $15/Mtok ≈ $5.4/Mtok).
const SRE_HOURLY_RATE = 75;
const MIN_SAVED_PER_INVESTIGATION = 18;
const MONTHLY_BUDGET = 50;
const BLENDED_TOKEN_RATE = 0.0000054;

const TOP_ALERTS_MOCK = [
  { title: 'Memory Leak Detected',     service: 'api-gateway',    fires: 47, tokens: 312000, cost: 1.68, autoPct: 12, trend: 'up'   },
  { title: 'Disk Space Low',           service: 'storage-04',     fires: 31, tokens: 198000, cost: 1.07, autoPct: 64, trend: 'flat' },
  { title: 'High API Error Rate',      service: 'payments',       fires: 24, tokens: 174000, cost: 0.94, autoPct: 41, trend: 'up'   },
  { title: 'Network Latency Spike',    service: 'edge-eu-west',   fires: 19, tokens: 122000, cost: 0.66, autoPct: 78, trend: 'down' },
  { title: 'High CPU Usage',           service: 'web-prod-01',    fires: 16, tokens:  98000, cost: 0.53, autoPct: 88, trend: 'flat' },
  { title: 'Pod CrashLoopBackOff',     service: 'workers-eu',     fires: 11, tokens:  74000, cost: 0.40, autoPct: 27, trend: 'up'   },
];

const LOW_RATED_MOCK = [
  { caseId: '#7',  title: 'Memory Leak Detected',      service: 'api-gateway',  why: 'Suggested rollback to wrong version', when: '2h ago' },
  { caseId: '#3',  title: 'High CPU Usage',            service: 'web-prod-01',  why: 'Missed root cause (deploy gap)',      when: 'Yesterday' },
  { caseId: '#41', title: 'SSL Certificate Expiring',  service: 'security',     why: 'Suggested a deprecated runbook',      when: '3 days ago' },
];

const DRILLDOWN_TITLES = [
  ['Disk Space Low','low'], ['High API Error Rate','high'], ['Memory Leak Detected','high'],
  ['Network Latency Spike','medium'], ['SSL Certificate Expiring','info'], ['Redis Cache Miss Rate High','low'],
  ['High CPU Usage','medium'], ['Pod CrashLoopBackOff','high'], ['Queue Backlog Growing','medium'],
  ['Database Connection Saturation','high'], ['Certificate rotation reminder','info'], ['DNS resolution slow','low'],
];

function UsageMetricsV2Page() {
  const [range, setRange] = React.useState('30d');
  const [customRange, setCustomRange] = React.useState(null);
  const [drillIdx, setDrillIdx] = React.useState(null);

  const { startDate, endDate, days } = React.useMemo(() => {
    const today = startOfDayV2(new Date());
    if (range === 'custom' && customRange) {
      const s = startOfDayV2(customRange.from);
      const e = startOfDayV2(customRange.to);
      return { startDate: s, endDate: e, days: daysBetweenInclusiveV2(s, e) };
    }
    const presetDays = USAGE_RANGES_V2.find(r => r.key === range)?.days || 30;
    const start = new Date(today);
    start.setDate(start.getDate() - (presetDays - 1));
    return { startDate: start, endDate: today, days: presetDays };
  }, [range, customRange]);

  const data = React.useMemo(
    () => generateUsageDataV2(startDate, endDate),
    [startDate.getTime(), endDate.getTime()]
  );

  const prevData = React.useMemo(() => {
    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (days - 1));
    return generateUsageDataV2(prevStart, prevEnd, 73 + days * 7);
  }, [startDate.getTime(), endDate.getTime(), days]);

  // Reset selected day when the range changes so we don't index out of bounds.
  React.useEffect(() => { setDrillIdx(null); }, [range, customRange]);

  const totals = aggregateV2(data);
  const prevTotals = aggregateV2(prevData);

  const maxes = {
    cost: Math.max(...data.map(d => d.cost), 0.01),
    tokens: Math.max(...data.map(d => d.tokens), 1),
    investigations: Math.max(...data.map(d => d.investigations), 1),
  };

  const minSaved = totals.investigations * MIN_SAVED_PER_INVESTIGATION;
  const hoursSaved = minSaved / 60;
  const dollarsSaved = hoursSaved * SRE_HOURLY_RATE;
  const roiMultiplier = dollarsSaved / Math.max(totals.cost, 0.01);

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const projectedMonthCost = (totals.cost / data.length) * daysInMonth;
  const budgetPct = Math.min(100, (totals.cost / MONTHLY_BUDGET) * 100);
  const overBudget = projectedMonthCost > MONTHLY_BUDGET;

  return (
    <div data-screen-label="06 Usage & Costs · Proposal" style={{ padding:'22px 28px 40px' }}>
      <V2Header
        range={range}
        customRange={customRange}
        onChangeRange={(next) => { setRange(next.key); setCustomRange(next.customRange); }}
      />

      <V2KpiRow
        totals={totals}
        prevTotals={prevTotals}
        days={days}
        hoursSaved={hoursSaved}
        dollarsSaved={dollarsSaved}
        roiMultiplier={roiMultiplier}
        budgetPct={budgetPct}
        projectedMonthCost={projectedMonthCost}
        overBudget={overBudget}
      />

      <V2ChartCard
        data={data}
        maxes={maxes}
        selectedIdx={drillIdx}
        onSelect={setDrillIdx}
      />

      {drillIdx != null && data[drillIdx] && (
        <V2Drilldown
          day={data[drillIdx]}
          onClose={() => setDrillIdx(null)}
        />
      )}

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1.4fr) minmax(0, 1fr)', gap:14, marginTop:18 }}>
        <V2TopAlertsCard alerts={TOP_ALERTS_MOCK}/>
        <V2AccuracyCard rate={78} good={142} bad={40} lowRated={LOW_RATED_MOCK}/>
      </div>
    </div>
  );
}

function aggregateV2(data) {
  return data.reduce((a, d) => ({
    tokens: a.tokens + d.tokens,
    cost: a.cost + d.cost,
    investigations: a.investigations + d.investigations,
  }), { tokens: 0, cost: 0, investigations: 0 });
}

function deltaPctV2(curr, prev) {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

// ------- header / range / export -------

function V2Header({ range, customRange, onChangeRange }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, marginBottom:18, flexWrap:'wrap' }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <h1 style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.02em', margin:0 }}>Usage & Costs</h1>
          <span className="mono" style={{
            padding:'2px 9px', borderRadius:99, fontSize:10.5, fontWeight:600,
            background:'var(--accent-glow)', border:'1px solid var(--accent-2)',
            color:'var(--accent)', letterSpacing:'0.06em',
          }}>PROPOSAL · v2</span>
        </div>
        <div style={{ fontSize:12.5, color:'var(--fg-3)', marginTop:4 }}>
          ROI, accuracy, top cost drivers and per-day drill-down
        </div>
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <V2RangePicker range={range} customRange={customRange} onChange={onChangeRange}/>
        <button title="Export the breakdown to CSV" style={{
          padding:'7px 12px', borderRadius:8,
          background:'var(--bg-2)', border:'1px solid var(--line)',
          color:'var(--fg-2)', fontSize:12,
          display:'inline-flex', alignItems:'center', gap:6,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}

function V2RangePicker({ range, customRange, onChange }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  const today = startOfDayV2(new Date());
  const todayISO = toISODateV2(today);

  const defaultFrom = React.useMemo(() => {
    if (customRange) return customRange.from;
    const d = new Date(today); d.setDate(d.getDate() - 29);
    return d;
  }, [customRange]);
  const defaultTo = customRange?.to || today;

  const [from, setFrom] = React.useState(toISODateV2(defaultFrom));
  const [to, setTo] = React.useState(toISODateV2(defaultTo));

  React.useEffect(() => {
    if (open) {
      setFrom(toISODateV2(defaultFrom));
      setTo(toISODateV2(defaultTo));
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
  const valid = from && to && fromISODateV2(from) <= fromISODateV2(to);
  const customLabel = isCustom && customRange
    ? `${formatDMYV2(customRange.from)} → ${formatDMYV2(customRange.to)}`
    : 'Custom';

  const apply = () => {
    if (!valid) return;
    onChange({ key: 'custom', customRange: { from: fromISODateV2(from), to: fromISODateV2(to) } });
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position:'relative', display:'inline-flex' }}>
      <div style={{
        display:'inline-flex', gap:2, padding:3, borderRadius:9,
        background:'var(--bg-2)', border:'1px solid var(--line)',
      }}>
        {USAGE_RANGES_V2.map(r => {
          const active = !isCustom && r.key === range;
          return (
            <button key={r.key} onClick={() => onChange({ key: r.key, customRange: null })} style={{
              padding:'6px 12px', borderRadius:6,
              background: active ? 'var(--bg-3)' : 'transparent',
              border: active ? '1px solid var(--line-2)' : '1px solid transparent',
              color: active ? 'var(--fg)' : 'var(--fg-2)',
              fontSize:12, fontWeight: active ? 600 : 500,
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
            <label style={v2PickerLabel}>
              From
              <input type="date" value={from} max={to || todayISO}
                onChange={e => setFrom(e.target.value)} style={v2PickerInput}/>
            </label>
            <label style={v2PickerLabel}>
              To
              <input type="date" value={to} min={from} max={todayISO}
                onChange={e => setTo(e.target.value)} style={v2PickerInput}/>
            </label>
          </div>
          {!valid && (
            <div style={{ fontSize:11, color:'var(--sev-crit)', marginBottom:10 }}>
              "From" must be on or before "To".
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={() => setOpen(false)} style={v2PickerSecondary}>Cancel</button>
            <button onClick={apply} disabled={!valid} style={v2PickerPrimary(!valid)}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

const v2PickerLabel = {
  display:'flex', flexDirection:'column', gap:5,
  fontSize:11, color:'var(--fg-3)', letterSpacing:'0.02em',
};
const v2PickerInput = {
  background:'var(--bg)', border:'1px solid var(--line-2)', borderRadius:7,
  padding:'7px 9px', color:'var(--fg)', fontSize:12, fontFamily:'inherit',
  colorScheme:'inherit',
};
const v2PickerSecondary = {
  padding:'6px 12px', borderRadius:7, fontSize:11.5,
  background:'var(--bg)', border:'1px solid var(--line-2)', color:'var(--fg-2)',
};
const v2PickerPrimary = (disabled) => ({
  padding:'6px 14px', borderRadius:7, fontSize:11.5, fontWeight:600,
  background: disabled ? 'var(--bg-3)' : 'var(--accent)',
  border: '1px solid ' + (disabled ? 'var(--line-2)' : 'var(--accent)'),
  color: disabled ? 'var(--fg-4)' : 'var(--accent-ink)',
  opacity: disabled ? 0.6 : 1,
});

// ------- KPI cards -------

function V2KpiRow({ totals, prevTotals, days, hoursSaved, dollarsSaved, roiMultiplier, budgetPct, projectedMonthCost, overBudget }) {
  const dCost = deltaPctV2(totals.cost, prevTotals.cost);
  const dTokens = deltaPctV2(totals.tokens, prevTotals.tokens);
  const dInv = deltaPctV2(totals.investigations, prevTotals.investigations);
  const costPer1k = (totals.cost / Math.max(totals.tokens, 1)) * 1000;
  const costPerCase = totals.cost / Math.max(totals.investigations, 1);
  const prevLabel = `vs previous ${days} day${days === 1 ? '' : 's'}`;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', gap:14, marginBottom:18 }}>
      <V2KpiCard
        label="Total cost"
        value={`$${totals.cost.toFixed(2)}`}
        delta={dCost}
        deltaLabel={prevLabel}
        deltaInverse
        accent="var(--sev-crit)"
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        info={
          <>
            Sum of daily AI spend across the selected period — tokens × the
            blended Anthropic rate of <b>${(BLENDED_TOKEN_RATE * 1_000_000).toFixed(2)}</b> per
            million tokens (80% input @ $3, 20% output @ $15).
            <br/><br/>
            The delta compares this period against the same number of days
            immediately before it.
          </>
        }
      >
        <BudgetMini
          spent={totals.cost}
          pct={budgetPct}
          projected={projectedMonthCost}
          budget={MONTHLY_BUDGET}
          over={overBudget}
        />
      </V2KpiCard>

      <V2KpiCard
        label="Tokens consumed"
        value={formatTokensV2(totals.tokens)}
        delta={dTokens}
        deltaLabel={prevLabel}
        deltaInverse
        accent="var(--sev-ok)"
        icon={<IconSparkle size={16}/>}
        info={
          <>
            Total input + output tokens billed by Anthropic for AI
            investigations and chat in the selected period.
            <br/><br/>
            "Cost per 1k tokens" is the realised average for this period:
            total cost ÷ total tokens × 1,000.
          </>
        }
      >
        <div style={{ fontSize:11.5, color:'var(--fg-3)', marginTop:8, lineHeight:1.5 }}>
          Avg <span className="mono" style={{ color:'var(--fg-2)', fontWeight:600 }}>${costPer1k.toFixed(4)}</span> per 1,000 tokens
          <div style={{ fontSize:10.5, color:'var(--fg-4)', marginTop:2 }}>
            Blended rate: input + output mix
          </div>
        </div>
      </V2KpiCard>

      <V2KpiCard
        label="Investigations resolved"
        value={totals.investigations.toLocaleString()}
        delta={dInv}
        deltaLabel={prevLabel}
        accent="var(--accent)"
        icon={<IconInvestigate size={16} active/>}
        info={
          <>
            Cases the AI either auto-resolved or pre-investigated for an SRE
            in this period.
            <br/><br/>
            "Cost per case" = total AI cost ÷ total resolved investigations.
            Lower is better, but watch it next to AI accuracy below.
          </>
        }
      >
        <div style={{ fontSize:11.5, color:'var(--fg-3)', marginTop:8, lineHeight:1.5 }}>
          Avg <span className="mono" style={{ color:'var(--fg-2)', fontWeight:600 }}>${costPerCase.toFixed(2)}</span> AI cost per case
          <div style={{ fontSize:10.5, color:'var(--fg-4)', marginTop:2 }}>
            Across the selected period
          </div>
        </div>
      </V2KpiCard>

      {/* ROI lens — formula made explicit. */}
      <V2KpiCard
        label="Net ROI"
        value={`${roiMultiplier.toFixed(1)}×`}
        valueColor="var(--sev-ok)"
        accent="var(--sev-ok)"
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        info={
          <>
            Estimated value created for every $1 spent on AI.
            <br/><br/>
            <b>Formula</b><br/>
            value = investigations × {MIN_SAVED_PER_INVESTIGATION} min ÷ 60 × ${SRE_HOURLY_RATE}/h<br/>
            ROI = value ÷ AI cost
            <br/><br/>
            <b>Assumptions</b> (configurable in Billing settings):<br/>
            · {MIN_SAVED_PER_INVESTIGATION} min of SRE time saved per AI-handled case<br/>
            · ${SRE_HOURLY_RATE}/h fully-loaded SRE rate
          </>
        }
      >
        <div style={{ fontSize:11.5, color:'var(--fg-3)', marginTop:8, lineHeight:1.55 }}>
          <span className="mono" style={{ color:'var(--sev-ok)', fontWeight:600 }}>~${dollarsSaved.toFixed(0)}</span> value
          {' '}vs <span className="mono" style={{ color:'var(--fg-2)', fontWeight:600 }}>${totals.cost.toFixed(2)}</span> spent
          <div style={{ fontSize:10.5, color:'var(--fg-4)', marginTop:3 }}>
            ≈ {hoursSaved.toFixed(0)}h of SRE work avoided ({MIN_SAVED_PER_INVESTIGATION} min × {totals.investigations} cases)
          </div>
        </div>
      </V2KpiCard>
    </div>
  );
}

function V2KpiCard({ label, value, valueColor, delta, deltaLabel, deltaInverse, accent, icon, info, children }) {
  return (
    <div style={{
      padding:'16px 18px', borderRadius:12,
      background:'var(--bg-2)', border:'1px solid var(--line)',
      display:'flex', flexDirection:'column', minWidth:0,
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11.5, color:'var(--fg-3)' }}>
            <span>{label}</span>
            {info && <V2InfoTip>{info}</V2InfoTip>}
          </div>
          <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.02em', marginTop:4, color: valueColor || 'var(--fg)' }}>{value}</div>
          {delta != null && <DeltaPill pct={delta} inverse={deltaInverse} label={deltaLabel}/>}
        </div>
        <div style={{
          width:34, height:34, borderRadius:9,
          background:`color-mix(in oklch, ${accent} 18%, transparent)`,
          border:`1px solid color-mix(in oklch, ${accent} 35%, transparent)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color: accent, flexShrink:0,
        }}>{icon}</div>
      </div>
      {children}
    </div>
  );
}

function V2InfoTip({ children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      style={{ position:'relative', display:'inline-flex', cursor:'help', outline:'none' }}
    >
      <span style={{
        width:13, height:13, borderRadius:99,
        background:'var(--bg-3)', border:'1px solid var(--line-2)',
        color:'var(--fg-3)', fontSize:9, fontWeight:700,
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        lineHeight:1, fontStyle:'italic',
      }}>i</span>
      {open && (
        <span style={{
          position:'absolute', top:'calc(100% + 6px)', left:-4, zIndex:40,
          width:260, padding:'10px 12px',
          background:'var(--bg)', border:'1px solid var(--line-2)', borderRadius:8,
          fontSize:11.5, lineHeight:1.55, color:'var(--fg-2)', fontWeight:400,
          fontStyle:'normal', letterSpacing:0,
          boxShadow:'0 22px 40px -12px rgba(0,0,0,0.55)',
          pointerEvents:'none', whiteSpace:'normal',
        }}>{children}</span>
      )}
    </span>
  );
}

function DeltaPill({ pct, inverse, label }) {
  const isUp = pct >= 0;
  // For "cost going up" we want red; for "investigations going up" we want green.
  const isGood = inverse ? !isUp : isUp;
  const c = isGood ? 'var(--sev-ok)' : 'var(--sev-crit)';
  return (
    <div className="mono" style={{
      display:'inline-flex', alignItems:'center', gap:4,
      marginTop:6, padding:'2px 8px', borderRadius:99,
      background:`color-mix(in oklch, ${c} 14%, transparent)`,
      border:`1px solid color-mix(in oklch, ${c} 30%, transparent)`,
      color: c, fontSize:10.5, fontWeight:600,
      maxWidth:'100%',
    }}>
      <span>{isUp ? '↑' : '↓'}</span>
      <span>{Math.abs(pct).toFixed(1)}%</span>
      <span style={{ color:'var(--fg-4)', fontWeight:500 }}>{label || 'vs prev'}</span>
    </div>
  );
}

function BudgetMini({ spent, pct, projected, budget, over }) {
  const c = over ? 'var(--sev-crit)' : 'var(--sev-ok)';
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ fontSize:11.5, color:'var(--fg-3)', marginBottom:6, lineHeight:1.4 }}>
        Spent <span className="mono" style={{ color:'var(--fg-2)', fontWeight:600 }}>${spent.toFixed(2)}</span>
        {' '}of <span className="mono">${budget}</span> monthly budget
      </div>
      <div style={{
        height:6, borderRadius:3, background:'var(--bg-3)', overflow:'hidden',
        border:'1px solid var(--line)',
      }}>
        <div style={{ width:`${pct}%`, height:'100%', background:c, transition:'width .25s' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'var(--fg-4)', marginTop:5, gap:8 }}>
        <span className="mono">{pct.toFixed(0)}% used</span>
        <span style={{ color: over ? 'var(--sev-crit)' : 'var(--fg-3)', whiteSpace:'nowrap' }}>
          Projected <span className="mono">${projected.toFixed(0)}</span> by month-end · {over ? 'over budget' : 'on track'}
        </span>
      </div>
    </div>
  );
}

// ------- chart -------

function V2ChartCard({ data, maxes, selectedIdx, onSelect }) {
  return (
    <div style={{
      background:'var(--bg-2)', border:'1px solid var(--line)',
      borderRadius:12, padding:'18px 20px 22px',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, gap:16, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:13.5, fontWeight:600 }}>Daily breakdown</div>
          <div style={{ fontSize:11.5, color:'var(--fg-3)', marginTop:2 }}>
            Hover for exact values · click a day to see its cases
          </div>
        </div>
        <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
          <V2LegendDot color="var(--accent)" label="Investigations"/>
          <V2LegendDot color="var(--sev-ok)" label="Tokens"/>
          <V2LegendDot color="var(--sev-crit)" label="Cost"/>
          <span style={{ width:1, height:16, background:'var(--line)' }}/>
          <V2LegendLine color="var(--fg-3)" label="7-day moving avg"/>
        </div>
      </div>
      <V2Chart data={data} maxes={maxes} selectedIdx={selectedIdx} onSelect={onSelect}/>
    </div>
  );
}

function V2LegendDot({ color, label }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11.5, color:'var(--fg-2)' }}>
      <span style={{
        width:10, height:10, borderRadius:3, background:color,
        border:`1px solid color-mix(in oklch, ${color} 45%, transparent)`,
      }}/>
      {label}
    </div>
  );
}

function V2LegendLine({ color, label }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11.5, color:'var(--fg-2)' }}>
      <svg width="18" height="10" viewBox="0 0 18 10">
        <path d="M0 5 L18 5" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" fill="none"/>
      </svg>
      {label}
    </div>
  );
}

function V2Chart({ data, maxes, selectedIdx, onSelect }) {
  const W = 1000;
  const H = 300;
  const PAD_L = 48, PAD_R = 14, PAD_T = 16, PAD_B = 34;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const bandW = innerW / data.length;
  const barW = Math.max(5, Math.min(26, bandW * 0.58));
  const bottom = PAD_T + innerH;

  const heights = React.useMemo(() => data.map(d => ({
    cost: (d.cost / maxes.cost) * innerH * METRIC_ALLOC_V2.cost,
    tokens: (d.tokens / maxes.tokens) * innerH * METRIC_ALLOC_V2.tokens,
    investigations: (d.investigations / maxes.investigations) * innerH * METRIC_ALLOC_V2.investigations,
  })), [data, maxes, innerH]);

  const gridSteps = 5;
  const yLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const y = PAD_T + innerH * (1 - i / gridSteps);
    const tokensAtLine = ((i / gridSteps) / METRIC_ALLOC_V2.tokens) * maxes.tokens;
    return { y, tokensAtLine, isBase: i === 0 };
  });

  const tickEvery = data.length <= 10 ? 1 : data.length <= 35 ? 5 : 10;

  // Moving average overlay anchored above the average cost segment.
  const windowSize = Math.min(7, data.length);
  const avgCostHeight = (data.reduce((s, d) => s + d.cost, 0) / data.length / maxes.cost) * innerH * METRIC_ALLOC_V2.cost;
  const avgLine = data.map((_, i) => {
    const from = Math.max(0, i - windowSize + 1);
    const slice = data.slice(from, i + 1);
    const avg = slice.reduce((s, d) => s + d.tokens, 0) / slice.length;
    const h = (avg / maxes.tokens) * innerH * METRIC_ALLOC_V2.tokens;
    const y = bottom - avgCostHeight - h;
    const x = PAD_L + i * bandW + bandW / 2;
    return { x, y };
  });
  const avgPath = avgLine.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const containerRef = React.useRef(null);
  const [hover, setHover] = React.useState(null);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const svgX = (localX / rect.width) * W;
    const idx = Math.floor((svgX - PAD_L) / bandW);
    if (idx < 0 || idx >= data.length) { setHover(null); return; }
    const h = heights[idx];
    const cx = PAD_L + idx * bandW + bandW / 2;
    const topY = bottom - h.cost - h.tokens - h.investigations;
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
        {yLines.map((l, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={l.y} y2={l.y}
              stroke="var(--line)" strokeWidth="1"
              strokeDasharray={l.isBase ? '' : '2 4'}
              opacity={l.isBase ? 1 : 0.7}/>
            <text x={PAD_L - 10} y={l.y + 3} textAnchor="end"
              fontSize="10" fill="var(--fg-4)" fontFamily="Geist Mono, monospace">
              {formatTokensV2(l.tokensAtLine)}
            </text>
          </g>
        ))}

        {data.map((day, i) => {
          const h = heights[i];
          const bandX = PAD_L + i * bandW;
          const cx = bandX + bandW / 2;
          const x = cx - barW / 2;
          const costY = bottom - h.cost;
          const tokensY = costY - h.tokens;
          const investY = tokensY - h.investigations;
          const isHover = hover?.idx === i;
          const isSelected = selectedIdx === i;
          const dim = selectedIdx != null && !isSelected;
          return (
            <g key={i} onClick={() => onSelect(isSelected ? null : i)} style={{ cursor:'pointer' }}>
              {/* hover/selected column highlight */}
              <rect x={bandX} y={PAD_T} width={bandW} height={innerH}
                fill={isSelected ? 'var(--accent-glow)' : 'var(--bg-hover)'}
                opacity={isSelected ? 0.55 : isHover ? 0.35 : 0}/>
              <rect x={x} y={costY} width={barW} height={Math.max(h.cost, 0.5)}
                fill="var(--sev-crit)" opacity={dim ? 0.45 : (isHover || isSelected ? 1 : 0.88)}/>
              <rect x={x} y={tokensY} width={barW} height={Math.max(h.tokens, 0.5)}
                fill="var(--sev-ok)" opacity={dim ? 0.45 : (isHover || isSelected ? 1 : 0.88)}/>
              <rect x={x} y={investY} width={barW} height={Math.max(h.investigations, 0.5)}
                fill="var(--accent)" opacity={dim ? 0.45 : (isHover || isSelected ? 1 : 0.88)}
                rx="1.5" ry="1.5"/>
              {day.isSpike && (
                <circle cx={cx} cy={investY - 8} r="3"
                  fill="var(--sev-high)" stroke="var(--bg-2)" strokeWidth="1.5"/>
              )}
            </g>
          );
        })}

        <path d={avgPath} fill="none" stroke="var(--fg-3)" strokeWidth="1.4" strokeDasharray="3 2" opacity="0.75"/>

        {hover && (
          <line x1={hover.cx} x2={hover.cx} y1={PAD_T} y2={bottom}
            stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6"/>
        )}

        {data.map((day, i) => {
          if (i % tickEvery !== 0 && i !== data.length - 1) return null;
          const cx = PAD_L + i * bandW + bandW / 2;
          return (
            <text key={i} x={cx} y={H - PAD_B + 18} textAnchor="middle"
              fontSize="10" fill={selectedIdx === i ? 'var(--accent)' : 'var(--fg-3)'}
              fontFamily="Geist Mono, monospace"
              fontWeight={selectedIdx === i ? 600 : 400}>
              {formatDayShortV2(day.date)}
            </text>
          );
        })}
      </svg>

      {hover && (
        <V2ChartTooltip
          day={data[hover.idx]}
          svgCx={hover.cx}
          svgTopY={hover.topY}
          svgW={W} svgH={H}
          containerRef={containerRef}
        />
      )}
    </div>
  );
}

function V2ChartTooltip({ day, svgCx, svgTopY, svgW, svgH, containerRef }) {
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
      width: 240, padding:'11px 13px',
      background:'var(--bg)', border:'1px solid var(--line-2)', borderRadius:10,
      boxShadow:'0 22px 40px -12px rgba(0,0,0,0.55)',
      pointerEvents:'none', zIndex:5,
      opacity: pos.ready ? 1 : 0,
      transition:'opacity .12s ease',
    }}>
      <div className="mono" style={{ fontSize:11, color:'var(--fg-3)', letterSpacing:'0.08em', marginBottom:8, display:'flex', justifyContent:'space-between' }}>
        <span>{formatDayLongV2(day.date).toUpperCase()}</span>
        {day.isSpike && (
          <span style={{ color:'var(--sev-high)', fontWeight:600 }}>SPIKE</span>
        )}
      </div>
      <V2TipRow color="var(--accent)" label="Investigations" value={day.investigations.toLocaleString()}/>
      <V2TipRow color="var(--sev-ok)" label="Tokens" value={day.tokens.toLocaleString()}/>
      <V2TipRow color="var(--sev-crit)" label="Cost" value={`$${day.cost.toFixed(2)}`}/>
      <div style={{ height:1, background:'var(--line)', margin:'8px 0 6px' }}/>
      <div className="mono" style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'var(--fg-4)' }}>
        <span>cost / 1k tokens</span>
        <span>${costPerK.toFixed(4)}</span>
      </div>
      <div style={{ marginTop:8, fontSize:10.5, color:'var(--fg-3)', textAlign:'center' }}>
        Click the bar to see this day's cases
      </div>
    </div>
  );
}

function V2TipRow({ color, label, value }) {
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

// ------- drilldown -------

function V2Drilldown({ day, onClose }) {
  // Synthesise per-case rows for this day from the day's totals so the demo
  // is internally consistent (total cases ≈ day.investigations).
  const cases = React.useMemo(() => buildDayCases(day), [day]);

  return (
    <div style={{
      marginTop:14,
      background:'var(--bg-2)', border:'1px solid var(--accent-2)',
      borderRadius:12, overflow:'hidden',
      boxShadow:'0 0 0 3px var(--accent-glow)',
      animation:'fadeUp .18s ease',
    }}>
      <div style={{
        padding:'12px 18px', borderBottom:'1px solid var(--line)',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap',
      }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600 }}>
            Cases on {formatDayLongV2(day.date)}
          </div>
          <div className="mono" style={{ fontSize:11, color:'var(--fg-3)', marginTop:3 }}>
            {day.investigations} investigations · {day.tokens.toLocaleString()} tokens · ${day.cost.toFixed(2)}
          </div>
        </div>
        <button onClick={onClose} style={{
          padding:'5px 10px', borderRadius:7,
          background:'var(--bg-3)', border:'1px solid var(--line-2)',
          color:'var(--fg-2)', fontSize:11.5,
          display:'inline-flex', alignItems:'center', gap:5,
        }}>
          <IconClose size={11}/> Close
        </button>
      </div>
      <div style={{ maxHeight:280, overflowY:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'var(--bg-2)' }}>
              <th style={drillTh}>Case</th>
              <th style={drillTh}>Severity</th>
              <th style={drillTh}>Title</th>
              <th style={drillTh}>Service</th>
              <th style={drillTh}>Resolution</th>
              <th style={{ ...drillTh, textAlign:'right' }}>Tokens</th>
              <th style={{ ...drillTh, textAlign:'right' }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, i) => (
              <tr key={i} style={{ borderTop:'1px solid var(--line)' }}>
                <td className="mono" style={drillTd}>{c.caseId}</td>
                <td style={drillTd}><SeverityPill sev={c.sev}/></td>
                <td style={drillTd}>{c.title}</td>
                <td className="mono" style={{ ...drillTd, color:'var(--fg-2)' }}>{c.service}</td>
                <td style={drillTd}>
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
                <td className="mono" style={{ ...drillTd, color:'var(--fg-2)', textAlign:'right' }}>{c.tokens.toLocaleString()}</td>
                <td className="mono" style={{ ...drillTd, fontWeight:600, textAlign:'right' }}>${c.cost.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const drillTh = {
  textAlign:'left', fontWeight:500, fontSize:11, color:'var(--fg-3)',
  padding:'9px 12px', borderBottom:'1px solid var(--line)', whiteSpace:'nowrap',
};
const drillTd = { padding:'9px 12px', verticalAlign:'middle' };

function buildDayCases(day) {
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
    const [title, sev] = DRILLDOWN_TITLES[Math.floor(rand() * DRILLDOWN_TITLES.length)];
    const services = ['api-gateway','storage-04','payments','web-prod-01','workers-eu','edge-eu-west','redis-3'];
    out.push({
      caseId: `#${100 + Math.floor(rand() * 900)}`,
      title, sev,
      service: services[Math.floor(rand() * services.length)],
      tokens, cost,
      auto: rand() > 0.45,
    });
  }
  out.sort((a, b) => b.cost - a.cost);
  return out;
}

// ------- top alerts -------

function V2TopAlertsCard({ alerts }) {
  return (
    <div style={{
      background:'var(--bg-2)', border:'1px solid var(--line)',
      borderRadius:12, padding:'18px 20px 10px',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:13.5, fontWeight:600 }}>Top cost-driving alerts</div>
          <div style={{ fontSize:11.5, color:'var(--fg-3)', marginTop:2 }}>The biggest opportunities to reduce noise and spend</div>
        </div>
        <span className="mono" style={{
          fontSize:10, color:'var(--fg-3)', letterSpacing:'0.1em',
          padding:'2px 8px', borderRadius:99, border:'1px solid var(--line)', background:'var(--bg-3)',
        }}>{alerts.length} ALERTS</span>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr>
            <th style={drillTh}>Alert</th>
            <th style={{ ...drillTh, textAlign:'right' }}>Fires</th>
            <th style={{ ...drillTh, textAlign:'right' }}>Tokens</th>
            <th style={{ ...drillTh, textAlign:'right' }}>Cost</th>
            <th style={{ ...drillTh, textAlign:'right' }}>AI auto</th>
            <th style={drillTh}></th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a, i) => (
            <tr key={i} style={{ borderTop:'1px solid var(--line)' }}>
              <td style={drillTd}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <TrendIcon trend={a.trend}/>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500 }}>{a.title}</div>
                    <div className="mono" style={{ fontSize:10.5, color:'var(--fg-3)', marginTop:2 }}>{a.service}</div>
                  </div>
                </div>
              </td>
              <td className="mono" style={{ ...drillTd, color:'var(--fg-2)', textAlign:'right' }}>{a.fires}</td>
              <td className="mono" style={{ ...drillTd, color:'var(--fg-2)', textAlign:'right' }}>{formatTokensV2(a.tokens)}</td>
              <td className="mono" style={{ ...drillTd, fontWeight:600, textAlign:'right' }}>${a.cost.toFixed(2)}</td>
              <td style={{ ...drillTd, textAlign:'right' }}>
                <AutoBar pct={a.autoPct}/>
              </td>
              <td style={{ ...drillTd, textAlign:'right' }}>
                <button title="Tune threshold / silence" style={{
                  padding:'4px 9px', borderRadius:6, fontSize:11,
                  background:'var(--bg-3)', border:'1px solid var(--line-2)',
                  color:'var(--fg-2)',
                }}>Tune</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendIcon({ trend }) {
  if (trend === 'up') {
    return <span title="Trending up" style={{ width:16, height:16, borderRadius:4, background:'color-mix(in oklch, var(--sev-crit) 16%, transparent)', color:'var(--sev-crit)', fontSize:10, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>↑</span>;
  }
  if (trend === 'down') {
    return <span title="Trending down" style={{ width:16, height:16, borderRadius:4, background:'color-mix(in oklch, var(--sev-ok) 16%, transparent)', color:'var(--sev-ok)', fontSize:10, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>↓</span>;
  }
  return <span title="Stable" style={{ width:16, height:16, borderRadius:4, background:'var(--bg-3)', color:'var(--fg-3)', fontSize:10, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>→</span>;
}

function AutoBar({ pct }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:7, justifyContent:'flex-end' }}>
      <div style={{
        width:60, height:5, borderRadius:3,
        background:'var(--bg-3)', border:'1px solid var(--line)', overflow:'hidden',
      }}>
        <div style={{ width:`${pct}%`, height:'100%', background:'var(--sev-ok)' }}/>
      </div>
      <span className="mono" style={{ fontSize:10.5, color:'var(--fg-2)', minWidth:28, textAlign:'right' }}>{pct}%</span>
    </div>
  );
}

// ------- AI accuracy -------

function V2AccuracyCard({ rate, good, bad, lowRated }) {
  const total = good + bad;
  return (
    <div style={{
      background:'var(--bg-2)', border:'1px solid var(--line)',
      borderRadius:12, padding:'18px 20px 16px',
      display:'flex', flexDirection:'column', gap:14,
    }}>
      <div>
        <div style={{ fontSize:13.5, fontWeight:600 }}>AI accuracy</div>
        <div style={{ fontSize:11.5, color:'var(--fg-3)', marginTop:2 }}>From SRE 👍 / 👎 feedback in case detail</div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <div style={{
          width:78, height:78, borderRadius:99,
          background:`conic-gradient(var(--sev-ok) 0 ${rate * 3.6}deg, var(--bg-3) ${rate * 3.6}deg 360deg)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0, position:'relative',
        }}>
          <div style={{
            width:62, height:62, borderRadius:99,
            background:'var(--bg-2)', border:'1px solid var(--line)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          }}>
            <span style={{ fontSize:18, fontWeight:600, color:'var(--sev-ok)' }}>{rate}%</span>
            <span style={{ fontSize:9, color:'var(--fg-3)' }} className="mono">APPROVAL</span>
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="mono" style={{ fontSize:10.5, color:'var(--fg-3)', marginBottom:6, letterSpacing:'0.08em' }}>
            {total} feedbacks this period
          </div>
          <FeedbackBar good={good} bad={bad}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:11, color:'var(--sev-ok)' }}>👍 {good}</span>
            <span style={{ fontSize:11, color:'var(--sev-crit)' }}>👎 {bad}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="mono" style={{ fontSize:10, color:'var(--fg-3)', letterSpacing:'0.12em', marginBottom:8 }}>
          NEEDS REVIEW
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {lowRated.map((c, i) => (
            <div key={i} style={{
              padding:'9px 11px', borderRadius:8,
              background:'var(--bg-3)', border:'1px solid var(--line)',
              cursor:'pointer',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <span className="mono" style={{ fontSize:11, color:'var(--accent)' }}>{c.caseId}</span>
                <span style={{ fontSize:10.5, color:'var(--fg-4)' }}>{c.when}</span>
              </div>
              <div style={{ fontSize:12, fontWeight:500, marginTop:3 }}>{c.title}</div>
              <div style={{ fontSize:11, color:'var(--fg-3)', marginTop:2 }}>{c.why}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedbackBar({ good, bad }) {
  const total = good + bad || 1;
  return (
    <div style={{
      display:'flex', height:8, borderRadius:4,
      background:'var(--bg-3)', border:'1px solid var(--line)',
      overflow:'hidden',
    }}>
      <div style={{ width:`${(good / total) * 100}%`, background:'var(--sev-ok)' }}/>
      <div style={{ width:`${(bad / total) * 100}%`, background:'var(--sev-crit)' }}/>
    </div>
  );
}

// ------- formatting -------

function formatTokensV2(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'k';
  return Math.round(n).toString();
}

function formatDayShortV2(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDayLongV2(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

Object.assign(window, { UsageMetricsV2Page });
