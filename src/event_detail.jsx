// Event detail modal — opens when a row title is clicked.
function EventDetail({ event, onClose, onInvestigate, onAssign }) {
  const [tab, setTab] = React.useState('overview');
  const [comment, setComment] = React.useState('');
  const [comments, setComments] = React.useState([]);
  const [aiInput, setAiInput] = React.useState('');
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null); // null | 'up' | 'down'

  const submitComment = () => {
    const text = comment.trim();
    if (!text) return;
    const now = new Date();
    const at = now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    const palette = [
      'linear-gradient(135deg, oklch(0.55 0.12 200), oklch(0.45 0.12 260))',
      'linear-gradient(135deg, oklch(0.55 0.18 330), oklch(0.45 0.16 290))',
      'linear-gradient(135deg, oklch(0.60 0.14 150), oklch(0.50 0.14 200))',
      'linear-gradient(135deg, oklch(0.58 0.16 30),  oklch(0.50 0.15 350))',
    ];
    setComments(cs => [...cs, {
      text,
      user: 'admin',
      initials: 'AD',
      at,
      avatarBg: palette[cs.length % palette.length],
    }]);
    setComment('');
  };

  // Reasoning thread — each turn is a kind + payload, rendered in order.
  const initialTurns = React.useMemo(() => ([
    { id: 'r0', kind: 'reasoning', open: true, steps: [
        { text: 'Analysing the alert and planning next steps…', code: null },
        { text: 'Starting investigation…', code: '$ kubectl get pods -A -l app=api -o json\n  > unknown tool name: \'kubectl_impl\', available tools: [\'fnctl_*\', …]' },
    ]},
    { id: 'a0', kind: 'analysis',
      rca: { title: 'unknown: kubectl tool unavailable in this workspace',
             body: <>The <code style={codeInline}>kubectl</code> tool is not available in this environment for inspecting pods, services, and events related to the <code style={codeInline}>/api/v1/payments</code> endpoint returning 500 errors.</> },
      evidence: <>The MCP <code style={codeInline}>kubectl_impl</code> call failed; no direct cluster observability is reachable from this runner.</>,
      solution: [
        <>Verify <code style={codeInline}>kubectl</code> is configured and reachable for this operator.</>,
        <>Once available, inspect pods of component <code style={codeInline}>api</code> with <code style={codeInline}>kubectl get pods -l app=api -o wide</code>.</>,
        <>Review logs with <code style={codeInline}>kubectl logs &lt;pod&gt;</code> to identify 500 errors on <code style={codeInline}>/api/v1/payments</code>.</>,
        <>Inspect recent events: <code style={codeInline}>kubectl get events --sort-by=.lastTimestamp</code>.</>,
      ],
    },
  ]), []);
  const [turns, setTurns] = React.useState(initialTurns);
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef(null);

  // Autoscroll the reasoning pane whenever turns change.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  const runReinvestigate = () => {
    if (busy) return;
    setBusy(true);
    const rid = 'r' + Date.now();
    // Push a new reasoning turn with empty steps, then stream-in each step.
    setTurns(ts => [...ts, { id: rid, kind: 'reasoning', open: true, steps: [] }]);
    const stream = [
      { text: 'Re-running the investigation with fresh signals…', code: null },
      { text: 'Correlating the last 30m of logs and traces…', code: '$ logs.search service=api status>=500 since=30m\n  > 142 hits · p95 latency 920ms · top path: /api/v1/payments' },
      { text: 'Cross-checking recent deployments…', code: '$ deploys.list service=api since=2h\n  > api-gateway@v2.14.3 rolled out 48m ago' },
    ];
    let i = 0;
    const pushStep = () => {
      if (i >= stream.length) {
        // Finally, add a new analysis turn.
        setTurns(ts => [...ts, {
          id: 'a' + Date.now(), kind: 'analysis',
          rca: { title: 'Regression introduced by api-gateway@v2.14.3',
                 body: <>The latest rollout of <code style={codeInline}>api-gateway</code> shipped a change to connection-pool sizing that starves downstream payments calls under load, producing intermittent 500s on <code style={codeInline}>/api/v1/payments</code>.</> },
          evidence: <>Error-rate step-change aligns with deploy timestamp (48m ago). Pool saturation visible in <code style={codeInline}>db.pool.waiters</code> jumping from 0 → 36. No infra events in the window.</>,
          solution: [
            <>Roll back <code style={codeInline}>api-gateway</code> to <code style={codeInline}>v2.14.2</code> to restore previous pool sizing.</>,
            <>Raise <code style={codeInline}>DB_POOL_MAX</code> from 20 → 48 for staging + prod to absorb peak.</>,
            <>Add a regression test covering pool saturation under 2× baseline RPS.</>,
            <>Open a follow-up ticket to review the deploy gating for <code style={codeInline}>api-gateway</code>.</>,
          ],
        }]);
        setBusy(false);
        return;
      }
      const step = stream[i++];
      setTurns(ts => ts.map(t => t.id === rid
        ? { ...t, steps: [...t.steps, step] }
        : t));
      setTimeout(pushStep, 650);
    };
    setTimeout(pushStep, 350);
  };

  const runPostmortem = () => {
    if (busy) return;
    setBusy(true);
    const rid = 'r' + Date.now();
    setTurns(ts => [...ts, { id: rid, kind: 'reasoning', open: true, steps: [] }]);
    const stream = [
      { text: 'Drafting post-mortem…', code: null },
      { text: 'Gathering timeline from alerts, deploys and comments…', code: null },
      { text: 'Summarising impact and writing action items…', code: null },
    ];
    let i = 0;
    const pushStep = () => {
      if (i >= stream.length) {
        setTurns(ts => [...ts, { id: 'p' + Date.now(), kind: 'postmortem' }]);
        setBusy(false);
        return;
      }
      const step = stream[i++];
      setTurns(ts => ts.map(t => t.id === rid
        ? { ...t, steps: [...t.steps, step] }
        : t));
      setTimeout(pushStep, 600);
    };
    setTimeout(pushStep, 300);
  };

  const sendMessage = () => {
    const text = aiInput.trim();
    if (!text || busy) return;
    setAiInput('');
    const uid = 'u' + Date.now();
    setTurns(ts => [...ts, { id: uid, kind: 'user', text }]);
    setBusy(true);
    // Thinking indicator, then a reply.
    const tid = 't' + Date.now();
    setTimeout(() => {
      setTurns(ts => [...ts, { id: tid, kind: 'thinking' }]);
      setTimeout(() => {
        setTurns(ts => ts.filter(t => t.id !== tid).concat({
          id: 'm' + Date.now(), kind: 'assistant',
          text: fakeReply(text, event),
        }));
        setBusy(false);
      }, 1100);
    }, 280);
  };

  if (!event) return null;

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:40,
      background:'oklch(0.1 0 0 / 0.55)', backdropFilter:'blur(3px)',
      display:'flex', alignItems:'stretch', justifyContent:'center',
      padding:'24px',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth:1200, height:'100%', maxHeight:'calc(100vh - 48px)',
        background:'var(--bg)', border:'1px solid var(--line-2)',
        borderRadius:14, overflow:'hidden',
        display:'grid', gridTemplateColumns:'1fr 480px', gridTemplateRows:'1fr',
        boxShadow:'0 60px 120px -30px rgba(0,0,0,0.6)',
        animation:'fadeUp .22s ease',
      }}>
        {/* Left: overview */}
        <div style={{ display:'flex', flexDirection:'column', borderRight:'1px solid var(--line)', minWidth:0, minHeight:0, overflow:'hidden' }}>
          <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--line)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <SeverityPill sev={event.sev}/>
                <StatusPill status={event.status}/>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button style={iconBtn} title="Open in new tab"><IconLink size={14}/></button>
                <button style={iconBtn} onClick={onClose} title="Close"><IconClose size={14}/></button>
              </div>
            </div>
            <div style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.015em' }}>{event.title}</div>
            <div className="mono" style={{ fontSize:11.5, color:'var(--fg-3)', marginTop:4 }}>
              {event.service} · {event.scope} · {event.at}
            </div>

            <div style={{ display:'flex', alignItems:'flex-start', gap:0, marginTop:20 }}>
              <Step n={1} label="Triage + RCA" active meta="Start: 17/04/2026, 16:59 · 1m"/>
              <Connector active/>
              <Step n={2} label="Post Mortem" meta="—"/>
              <Connector/>
              <Step n={3} label="Closed" meta="17/04/2026 · 7h 28m"/>
            </div>
          </div>

          {/* tabs */}
          <div style={{ display:'flex', gap:2, padding:'0 22px', borderBottom:'1px solid var(--line)' }}>
            {['overview','activity','additional info'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'11px 14px', fontSize:12.5,
                color: tab === t ? 'var(--fg)' : 'var(--fg-3)',
                fontWeight: tab === t ? 600 : 500,
                borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                textTransform:'capitalize',
              }}>{t}</button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
            {tab === 'overview' && <OverviewPane event={event}/>}
            {tab === 'activity' && <ActivityPane/>}
            {tab === 'additional info' && <ExtraPane event={event}/>}
          </div>

          {/* comments */}
          <div style={{ padding:'14px 22px', borderTop:'1px solid var(--line)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <IconAlert size={13} style={{ color:'var(--fg-3)' }}/>
                <span style={{ fontSize:12.5, fontWeight:500 }}>Case Comments</span>
              </div>
              <span className="mono" style={{ fontSize:10.5, color:'var(--fg-4)' }}>{comments.length} comment{comments.length === 1 ? '' : 's'}</span>
            </div>
            {comments.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:10 }}>
                {comments.map((c, i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <div style={{
                      width:26, height:26, borderRadius:99, flexShrink:0,
                      background: c.avatarBg,
                      color:'#fff', fontSize:10.5, fontWeight:600,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>{c.initials}</div>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                        <span style={{ fontSize:12.5, fontWeight:600 }}>{c.user}</span>
                        <span style={{ fontSize:11, color:'var(--fg-4)' }}>{c.at}</span>
                      </div>
                      <div style={{ fontSize:12.5, color:'var(--accent)', wordBreak:'break-word' }}>{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'8px 10px', borderRadius:8,
              background:'var(--bg-2)', border:'1px solid var(--line-2)',
            }}>
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                    e.preventDefault();
                    submitComment();
                  }
                }}
                placeholder="Add a comment…"
                style={{ flex:1, background:'transparent', border:0, outline:'none', color:'var(--fg)', fontSize:12.5 }}
              />
              <button
                onClick={submitComment}
                disabled={!comment.trim()}
                style={{
                  width:26, height:26, borderRadius:6,
                  background:'var(--accent-glow)', border:'1px solid var(--accent-2)',
                  color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center',
                  opacity: comment.trim() ? 1 : 0.5, cursor: comment.trim() ? 'pointer' : 'default',
                }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right: case + AI reasoning */}
        <div style={{ display:'flex', flexDirection:'column', background:'var(--bg-2)', minWidth:0, minHeight:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--line)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <IconEye size={14} style={{ color:'var(--fg-3)' }}/>
                <span style={{ fontSize:13, fontWeight:600 }}>Case {event.case}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <CaseStatus status={event.caseStatus || 'awaiting'}/>
                <button style={{ fontSize:11.5, color:'var(--fg-2)', display:'inline-flex', alignItems:'center', gap:4 }}>
                  Actions <IconChevron size={11} style={{ transform:'rotate(90deg)' }}/>
                </button>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, gap:8 }}>
              {(() => {
                const list = currentAssignees(event);
                return list.length
                  ? <AssigneeStack list={list}/>
                  : <span style={{ fontSize:12, color:'var(--fg-4)' }}>Unassigned</span>;
              })()}
              <div style={{ position:'relative' }}>
                <button onClick={() => setAssignOpen(o => !o)} style={{
                  padding:'4px 9px', borderRadius:7,
                  border:`1px solid ${assignOpen ? 'var(--accent-2)' : 'var(--line-2)'}`,
                  background: assignOpen ? 'var(--accent-glow)' : 'var(--bg-3)',
                  fontSize:11.5, color: assignOpen ? 'var(--accent)' : 'var(--fg-2)',
                  display:'inline-flex', alignItems:'center', gap:5,
                }}>
                  <IconPlus size={11}/> Assign
                </button>
                {assignOpen && (
                  <>
                    <div onClick={() => setAssignOpen(false)} style={{ position:'fixed', inset:0, zIndex:1 }}/>
                    <div style={{
                      position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:2,
                      width:280, maxHeight:360,
                      background:'var(--bg)', border:'1px solid var(--line-2)',
                      borderRadius:10, boxShadow:'0 20px 40px -8px rgba(0,0,0,0.5)',
                      display:'flex', flexDirection:'column', overflow:'hidden',
                    }}>
                      <AssigneePickerBody
                        assigned={currentAssignees(event)}
                        hasCase={event.case && event.case !== '—'}
                        onToggle={u => onAssign && onAssign({ toggle: u })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* AI summary card */}
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--line)' }}>
            <div style={{
              padding:'10px 12px', borderRadius:10,
              background:'var(--bg-3)', border:'1px solid var(--line-2)',
              display:'flex', alignItems:'flex-start', gap:10,
            }}>
              <div style={{
                width:30, height:30, borderRadius:8,
                background:'var(--accent-glow)', border:'1px solid var(--accent-2)',
                color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                <IconSparkle size={15}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:500, marginBottom:4 }}>Case management by Smart Ops AI</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <MiniBtn icon={<IconLink size={11}/>} label="Open ticket for this alert"/>
                  <MiniBtn label="👍" raw active={feedback === 'up'} onClick={() => setFeedback(f => f === 'up' ? null : 'up')}/>
                  <MiniBtn label="👎" raw tone="danger" active={feedback === 'down'} onClick={() => setFeedback(f => f === 'down' ? null : 'down')}/>
                  <MiniBtn icon={<IconCopy size={11}/>} label="Share"/>
                </div>
              </div>
            </div>
          </div>

          {/* Reasoning thread */}
          <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'14px 18px' }}>
            {turns.map((turn, idx) => (
              <ThreadTurn key={turn.id} turn={turn} onToggle={() => {
                setTurns(ts => ts.map(t => t.id === turn.id ? { ...t, open: !t.open } : t));
              }}/>
            ))}
          </div>

          {/* footer actions */}
          <div style={{ padding:'10px 18px', borderTop:'1px solid var(--line)', display:'flex', gap:8 }}>
            <button onClick={runReinvestigate} disabled={busy} style={{...footerBtn, opacity: busy ? 0.6 : 1}}>
              <IconInvestigate size={13}/> Reinvestigate
            </button>
            <button onClick={runPostmortem} disabled={busy} style={{...footerBtn, opacity: busy ? 0.6 : 1}}>
              <IconAlert size={13}/> Post-mortem
            </button>
          </div>

          {/* composer */}
          <div style={{ padding:'12px 18px', borderTop:'1px solid var(--line)' }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'8px 10px', borderRadius:10,
              background:'var(--bg)', border:'1px solid var(--line-2)',
            }}>
              <input
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Ask about this alert…"
                style={{ flex:1, background:'transparent', border:0, outline:'none', color:'var(--fg)', fontSize:12.5 }}
              />
              <button onClick={sendMessage} style={{
                width:26, height:26, borderRadius:6,
                background:'var(--accent-glow)', border:'1px solid var(--accent-2)',
                color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes stepIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes dotPulse { 0%,100% { opacity:0.3; } 50% { opacity:1; } }
        .so-turn { animation: stepIn .32s ease both; }
        .so-step { animation: stepIn .3s ease both; }
        .so-think span { display:inline-block; width:5px; height:5px; border-radius:99px; background:var(--accent); margin:0 2px; animation: dotPulse 1s ease-in-out infinite; }
        .so-think span:nth-child(2) { animation-delay: .18s; }
        .so-think span:nth-child(3) { animation-delay: .36s; }
      `}</style>
    </div>
  );
}

const iconBtn = {
  width:28, height:28, borderRadius:7,
  border:'1px solid var(--line)', color:'var(--fg-2)',
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  background:'transparent',
};

const footerBtn = {
  padding:'7px 11px', borderRadius:8, background:'var(--bg-3)',
  border:'1px solid var(--line-2)', color:'var(--fg-2)',
  fontSize:12, fontWeight:500,
  display:'inline-flex', alignItems:'center', gap:6,
};

const codeInline = {
  fontFamily:'Geist Mono, monospace', fontSize:11,
  padding:'1px 5px', borderRadius:4,
  background:'var(--bg-3)', border:'1px solid var(--line)',
  color:'var(--accent)',
};

function Step({ n, label, meta, active }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:6, minWidth:110 }}>
      <div style={{
        width:36, height:36, borderRadius:99,
        background: active ? 'var(--accent-glow)' : 'var(--bg-2)',
        border:`1px solid ${active ? 'var(--accent-2)' : 'var(--line-2)'}`,
        color: active ? 'var(--accent)' : 'var(--fg-3)',
        display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0,
      }}>
        {active ? <IconCheck size={15}/> : <span style={{ fontSize:12, fontWeight:600 }}>{n}</span>}
      </div>
      <div style={{ fontSize:12, fontWeight:500, color: active ? 'var(--fg)' : 'var(--fg-2)' }}>{label}</div>
      <div className="mono" style={{ fontSize:10, color:'var(--fg-4)', lineHeight:1.5, minHeight:30, whiteSpace:'nowrap' }}>{meta}</div>
    </div>
  );
}

function Connector({ active }) {
  return (
    <div style={{
      height:1, background: active ? 'var(--accent-2)' : 'var(--line-2)',
      marginTop:-44, minWidth:20,
    }}/>
  );
}

function OverviewPane({ event }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <Card title="Description" icon={<IconAlert size={13}/>}>
        <KVRow k="SUMMARY" v={`${event.service === 'api' ? 'API endpoint returning 500 errors at elevated rate' : event.detail}`}/>
        <KVRow k="DETAILS"  v={event.detail}/>
        <KVRow k="LABELS" v={
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[['app','sim-pod-unhealthy'],['job','kubernetes-pods'],['severity', event.sev?.toLowerCase() || 'info'],['alertname', (event.title || '').replace(/\s+/g,'')],['namespace', event.scope || 'default']].map(([k, v]) => (
              <span key={k} style={{
                padding:'3px 9px', borderRadius:99, fontSize:11,
                background:'oklch(0.94 0.03 230)',
                border:'1px solid oklch(0.85 0.05 230)',
                color:'oklch(0.45 0.15 240)',
              }}>
                <span>{k}: </span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </span>
            ))}
          </div>
        }/>
      </Card>
    </div>
  );
}

function ActivityPane() {
  const acts = [
    { t:'17:00', who:'System', text:'Case created and triaged automatically'},
    { t:'16:59', who:'Smart Ops AI', text:'Root cause analysis generated · confidence 0.72'},
    { t:'16:59', who:'Prometheus', text:'Alert fired · /api/v1/payments 500 rate above 15%'},
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {acts.map((a, i) => (
        <div key={i} style={{
          display:'grid', gridTemplateColumns:'50px 1fr', gap:12,
          padding:'10px 12px', borderRadius:8,
          background:'var(--bg-2)', border:'1px solid var(--line)',
        }}>
          <div className="mono" style={{ fontSize:10.5, color:'var(--fg-3)' }}>{a.t}</div>
          <div>
            <div style={{ fontSize:11, color:'var(--fg-3)' }} className="mono">{a.who.toUpperCase()}</div>
            <div style={{ fontSize:12.5, marginTop:2 }}>{a.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExtraPane({ event }) {
  const rows = [
    ['Event ID', `evt_${(event.case || '').replace('#','')}_01H8`],
    ['Fingerprint', '4d:8a:21:bb:61'],
    ['Runbook', 'R-204 · Gateway rolling restart'],
    ['Ingested at', event.at],
    ['Source host', 'monitor-prod-03.eu-west-1'],
    ['Retention', '30 days'],
  ];
  return (
    <div style={{ border:'1px solid var(--line)', borderRadius:10, overflow:'hidden' }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display:'grid', gridTemplateColumns:'160px 1fr',
          padding:'10px 12px',
          background: i % 2 ? 'var(--bg-2)' : 'transparent',
          borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--line)',
          fontSize:12.5,
        }}>
          <div className="mono" style={{ color:'var(--fg-3)', fontSize:11 }}>{r[0]}</div>
          <div className="mono" style={{ color:'var(--fg)' }}>{r[1]}</div>
        </div>
      ))}
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10, color:'var(--fg-2)' }}>
        {icon}
        <span style={{ fontSize:12.5, fontWeight:500 }}>{title}</span>
      </div>
      <div style={{
        padding:'14px 14px 4px', borderRadius:10,
        background:'var(--bg-2)', border:'1px solid var(--line)',
      }}>{children}</div>
    </div>
  );
}

function KVRow({ k, v }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div className="mono" style={{ fontSize:10, color:'var(--fg-3)', letterSpacing:'0.14em', marginBottom:5 }}>{k}</div>
      <div style={{ fontSize:12.5, color:'var(--fg)' }}>{v}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop:18 }}>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:12.5, lineHeight:1.6 }}>{children}</div>
    </div>
  );
}

function CodeBlock({ children }) {
  return (
    <pre className="mono" style={{
      margin:'8px 0', padding:'8px 10px', borderRadius:7,
      background:'var(--bg)', border:'1px solid var(--line)',
      fontSize:10.5, color:'var(--fg-2)', lineHeight:1.5,
      whiteSpace:'pre-wrap', overflowX:'auto',
    }}>{children}</pre>
  );
}

function MiniBtn({ icon, label, raw, active, onClick, tone }) {
  const isDanger = tone === 'danger';
  const activeBg = isDanger ? 'color-mix(in oklch, var(--sev-crit) 18%, transparent)' : 'var(--accent-glow)';
  const activeBorder = isDanger ? 'var(--sev-crit)' : 'var(--accent-2)';
  const activeFg = isDanger ? 'var(--sev-crit)' : 'var(--accent)';
  return (
    <button onClick={onClick} style={{
      padding:'3px 8px', borderRadius:6, fontSize:10.5,
      border: `1px solid ${active ? activeBorder : 'var(--line)'}`,
      background: active ? activeBg : 'var(--bg-2)',
      color: active ? activeFg : 'var(--fg-2)',
      display:'inline-flex', alignItems:'center', gap:4,
      cursor: onClick ? 'pointer' : 'default',
      transition:'all .12s',
    }}>
      {icon}{label}
    </button>
  );
}

// ----- reasoning thread -----

function ThreadTurn({ turn, onToggle }) {
  if (turn.kind === 'reasoning') {
    return (
      <div className="so-turn" style={{ marginBottom:18 }}>
        <button onClick={onToggle} style={{
          display:'flex', alignItems:'center', gap:8, marginBottom:8, color:'var(--fg)',
          background:'transparent', border:0, padding:0, cursor:'pointer',
        }}>
          <IconChevron size={12} style={{ transform: turn.open ? 'rotate(90deg)' : 'none', color:'var(--fg-3)', transition:'transform .15s' }}/>
          <IconSparkle size={13} style={{ color:'var(--accent)' }}/>
          <span style={{ fontSize:12.5, fontWeight:500 }}>Reasoning</span>
          <span className="mono" style={{ fontSize:10, color:'var(--fg-4)' }}>{turn.steps.length} step{turn.steps.length === 1 ? '' : 's'}</span>
        </button>
        {turn.open && (
          <div style={{ fontSize:12.5, color:'var(--fg-2)', lineHeight:1.6, paddingLeft:20, borderLeft:'1px solid var(--line)', marginLeft:5 }}>
            {turn.steps.map((s, i) => (
              <div key={i} className="so-step" style={{ marginBottom:8 }}>
                <p style={{ margin:0 }}>{s.text}</p>
                {s.code && <CodeBlock>{s.code}</CodeBlock>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (turn.kind === 'analysis') {
    return (
      <div className="so-turn" style={{ marginBottom:18 }}>
        <Section title="Root Cause Analysis">
          <p style={{ margin:'0 0 8px', fontWeight:500 }}>{turn.rca.title}</p>
          <p style={{ margin:0, color:'var(--fg-2)' }}>{turn.rca.body}</p>
        </Section>
        <Section title="Evidence">
          <p style={{ margin:0, color:'var(--fg-2)' }}>{turn.evidence}</p>
        </Section>
        <Section title="Proposed Solution">
          <ul style={{ margin:0, paddingLeft:16, color:'var(--fg-2)' }}>
            {turn.solution.map((item, i) => <li key={i} style={{ marginBottom:4 }}>{item}</li>)}
          </ul>
        </Section>
      </div>
    );
  }

  if (turn.kind === 'postmortem') {
    return (
      <div className="so-turn" style={{ marginBottom:18 }}>
        <Section title="Post-mortem">
          <div style={{ fontSize:11, color:'var(--fg-3)', marginBottom:6 }} className="mono">DRAFT · GENERATED BY SMART OPS AI</div>
          <p style={{ margin:'0 0 10px', fontWeight:500 }}>Payments 500s triggered by api-gateway v2.14.3 pool regression</p>
        </Section>
        <Section title="Summary">
          <p style={{ margin:0, color:'var(--fg-2)' }}>
            Between 16:48 and 17:12 UTC, ~4.1% of requests to <code style={codeInline}>/api/v1/payments</code> returned HTTP 500. The regression was introduced by the <code style={codeInline}>api-gateway v2.14.3</code> rollout at 16:12 and remediated by a rollback at 17:12.
          </p>
        </Section>
        <Section title="Timeline">
          <ul style={{ margin:0, paddingLeft:16, color:'var(--fg-2)' }}>
            <li><b>16:12</b> — api-gateway v2.14.3 deployed to prod eu-west-1.</li>
            <li><b>16:48</b> — Prometheus alert fires; 5xx rate &gt; 2%.</li>
            <li><b>16:59</b> — Case opened; Smart Ops AI begins triage.</li>
            <li><b>17:03</b> — Rollback initiated after evidence correlates to deploy.</li>
            <li><b>17:12</b> — Error rate back to baseline; case closed.</li>
          </ul>
        </Section>
        <Section title="Impact">
          <p style={{ margin:0, color:'var(--fg-2)' }}>~2,840 failed payment attempts, p95 latency +580ms, 0 successful retries lost.</p>
        </Section>
        <Section title="Action items">
          <ul style={{ margin:0, paddingLeft:16, color:'var(--fg-2)' }}>
            <li>Add a regression test covering pool saturation under 2× baseline RPS.</li>
            <li>Gate api-gateway rollouts on a synthetic payments canary.</li>
            <li>Alert when <code style={codeInline}>db.pool.waiters</code> &gt; 10 for 2m.</li>
          </ul>
        </Section>
      </div>
    );
  }

  if (turn.kind === 'user') {
    return (
      <div className="so-turn" style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
        <div style={{
          maxWidth:'85%',
          padding:'8px 11px', borderRadius:10, borderTopRightRadius:2,
          background:'var(--accent-glow)', border:'1px solid var(--accent-2)',
          color:'var(--fg)', fontSize:12.5, lineHeight:1.5,
        }}>{turn.text}</div>
      </div>
    );
  }

  if (turn.kind === 'assistant') {
    return (
      <div className="so-turn" style={{ display:'flex', gap:8, marginBottom:14, alignItems:'flex-start' }}>
        <div style={{
          width:24, height:24, borderRadius:99, flexShrink:0,
          background:'var(--accent-glow)', border:'1px solid var(--accent-2)',
          color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center',
        }}><IconSparkle size={12}/></div>
        <div style={{ fontSize:12.5, lineHeight:1.6, color:'var(--fg-2)', paddingTop:3 }}>{turn.text}</div>
      </div>
    );
  }

  if (turn.kind === 'thinking') {
    return (
      <div className="so-turn" style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
        <div style={{
          width:24, height:24, borderRadius:99, flexShrink:0,
          background:'var(--accent-glow)', border:'1px solid var(--accent-2)',
          color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center',
        }}><IconSparkle size={12}/></div>
        <div className="so-think" style={{ paddingTop:2 }}>
          <span/><span/><span/>
        </div>
      </div>
    );
  }

  return null;
}

function fakeReply(q, event) {
  const qq = q.toLowerCase();
  if (qq.includes('rollback') || qq.includes('roll back')) {
    return `The safest rollback is api-gateway@v2.14.2 — it was the last version with baseline payments error rate. A rolling restart should take ~90s; I can queue the command against ${event.service || 'api'}/eu-west-1 if you want.`;
  }
  if (qq.includes('owner') || qq.includes('who')) {
    return `Ownership for ${event.service || 'this service'} is the Backend squad (Slack #eng-backend). The on-call is Daniel Dorado Talavera based on the current rotation.`;
  }
  if (qq.includes('impact') || qq.includes('customers')) {
    return `Current impact: ~4.1% of requests to /api/v1/payments returning 500s. That's ≈2,840 failed attempts in the last 24m. No revenue loss yet — client-side retries are succeeding.`;
  }
  return `Looking at the signals for this alert: the regression began right after the api-gateway v2.14.3 rollout. Want me to draft the rollback, or dig into a specific metric?`;
}

Object.assign(window, { EventDetail });

// Returns array of {initials, name} for the event, reading either the new
// `assignees` array or falling back to the legacy single `assignee`/`assigneeName`.
function currentAssignees(event) {
  if (!event) return [];
  if (Array.isArray(event.assignees)) return event.assignees;
  if (event.assignee) return [{ initials: event.assignee, name: event.assigneeName || '' }];
  return [];
}

function AssigneeStack({ list }) {
  const shown = list.slice(0, 3);
  const rest = list.length - shown.length;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
      <div style={{ display:'flex' }}>
        {shown.map((a, i) => (
          <div key={a.initials + i} title={a.name} style={{
            width:24, height:24, borderRadius:99,
            background:'linear-gradient(135deg, oklch(0.55 0.12 200), oklch(0.45 0.12 260))',
            color:'#fff', fontSize:9.5, fontWeight:600,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'2px solid var(--bg-2)',
            marginLeft: i === 0 ? 0 : -8,
            boxShadow:'0 0 0 1px var(--line-2)',
          }}>{a.initials}</div>
        ))}
        {rest > 0 && (
          <div style={{
            width:24, height:24, borderRadius:99, marginLeft:-8,
            background:'var(--bg-3)', border:'2px solid var(--bg-2)',
            color:'var(--fg-2)', fontSize:9.5, fontWeight:600,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 0 1px var(--line-2)',
          }}>+{rest}</div>
        )}
      </div>
      <span style={{ fontSize:12, color:'var(--fg-2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
        {list.length === 1 ? list[0].name : `${list.length} assignees`}
      </span>
    </div>
  );
}
