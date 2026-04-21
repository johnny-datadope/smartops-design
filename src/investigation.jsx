// Investigation side panel — slides in when a row's analyze icon is clicked.
function Investigation({ event, onClose }) {
  const [step, setStep] = React.useState(0);
  const [chat, setChat] = React.useState([]);
  const [input, setInput] = React.useState('');

  React.useEffect(() => {
    if (!event) return;
    setStep(0); setChat([]); setInput('');
    const timer = setInterval(() => {
      setStep(s => (s < INVESTIGATION_STEPS.length ? s + 1 : s));
    }, 420);
    return () => clearInterval(timer);
  }, [event]);

  if (!event) return null;

  const sendMsg = () => {
    if (!input.trim()) return;
    const q = input;
    setChat(c => [...c, { role:'user', text:q }]);
    setInput('');
    setTimeout(() => {
      setChat(c => [...c, { role:'assistant', text:
        q.toLowerCase().includes('runbook')
          ? 'Runbook #R-204 “Gateway rolling restart” is compatible with this event. It touches 3 pods in eu-west-prod; ETA 4 min; low blast radius. Want me to queue approval for the on-call?'
          : q.toLowerCase().includes('similar')
          ? 'Found 3 similar events in the last 30 days (all during 14:00–16:00 UTC windows following a gateway deploy). Incidents #2041, #2078, #2103 — 2 of them resolved via rolling restart.'
          : 'Looking at the metric trace for ' + event.service + ', heap usage is growing ~38 MB/hour since the 14:32 deploy. Correlates with the connection-pool size going from 50 → 400. Suggest reverting deploy a34f21 or restarting the pool.'
      }]);
    }, 600);
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:50, pointerEvents:'none',
    }}>
      {/* backdrop */}
      <div onClick={onClose} style={{
        position:'absolute', inset:0,
        background:'oklch(0.1 0 0 / 0.5)', backdropFilter:'blur(2px)',
        pointerEvents:'auto',
        opacity: 1, transition:'opacity .2s',
      }}/>
      {/* panel */}
      <div style={{
        position:'absolute', top:0, right:0, bottom:0,
        width:'min(560px, 92vw)',
        background:'var(--bg-2)',
        borderLeft:'1px solid var(--line-2)',
        boxShadow:'-30px 0 80px -20px rgba(0,0,0,0.5)',
        pointerEvents:'auto',
        display:'flex', flexDirection:'column',
        animation:'slideIn .22s ease',
      }}>
        {/* header */}
        <div style={{
          padding:'14px 18px', borderBottom:'1px solid var(--line)',
          display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12,
        }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{
                width:28, height:28, borderRadius:8,
                background:'var(--accent-glow)', border:'1px solid var(--accent-2)',
                color:'var(--accent)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <IconInvestigate size={16} active/>
              </div>
              <div style={{ fontSize:10.5, letterSpacing:'0.18em', color:'var(--accent)' }} className="mono">INVESTIGATION · LIVE</div>
            </div>
            <div style={{ fontSize:17, fontWeight:600, letterSpacing:'-0.01em' }}>{event.title}</div>
            <div style={{ fontSize:11.5, color:'var(--fg-3)', marginTop:3 }} className="mono">
              case {event.case} · {event.service} · {event.source} · {event.at}
            </div>
          </div>
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:8,
            border:'1px solid var(--line)',
            color:'var(--fg-2)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}><IconClose size={14}/></button>
        </div>

        {/* body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
          {/* signal plot placeholder */}
          <SignalPlot/>

          {/* context */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8, marginTop:14 }}>
            <KV k="Severity" v={<SeverityPill sev={event.sev}/>}/>
            <KV k="Event status" v={<StatusPill status={event.status}/>}/>
            <KV k="Scope" v={<span className="mono">{event.scope}</span>}/>
            <KV k="Assignee" v={<span>{event.assigneeName}</span>}/>
          </div>

          {/* timeline */}
          <div style={{ marginTop:20, marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:11, letterSpacing:'0.16em', color:'var(--fg-3)' }} className="mono">ANALYSIS TIMELINE</div>
            <div style={{ flex:1, height:1, background:'var(--line)' }}/>
            <span className="mono" style={{ fontSize:10.5, color:'var(--accent)' }}>
              {Math.min(step, INVESTIGATION_STEPS.length)}/{INVESTIGATION_STEPS.length}
            </span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {INVESTIGATION_STEPS.map((s, i) => (
              <TimelineRow key={i} step={s} shown={i < step} last={i === INVESTIGATION_STEPS.length - 1}/>
            ))}
          </div>

          {/* chat */}
          {chat.length > 0 && (
            <div style={{ marginTop:18, display:'flex', flexDirection:'column', gap:8 }}>
              {chat.map((m, i) => (
                <div key={i} style={{
                  padding:'9px 11px', borderRadius:10,
                  background: m.role === 'user' ? 'var(--bg-3)' : 'var(--accent-glow)',
                  border: `1px solid ${m.role === 'user' ? 'var(--line-2)' : 'var(--accent-2)'}`,
                  color: m.role === 'user' ? 'var(--fg)' : 'var(--fg)',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth:'88%', fontSize:12.5, lineHeight:1.5,
                }}>
                  <div className="mono" style={{ fontSize:9.5, color:'var(--fg-3)', marginBottom:3, letterSpacing:'0.14em' }}>
                    {m.role === 'user' ? 'YOU' : 'SMART OPS AI'}
                  </div>
                  {m.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* composer */}
        <div style={{
          padding:'12px 18px', borderTop:'1px solid var(--line)',
          background:'var(--bg)',
        }}>
          <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
            {['Find similar incidents', 'Explain this event', 'Suggest a runbook'].map(s => (
              <button key={s} onClick={() => { setInput(s); }} style={{
                fontSize:11, padding:'4px 9px', borderRadius:99,
                background:'var(--bg-3)', border:'1px solid var(--line)',
                color:'var(--fg-2)',
              }}>{s}</button>
            ))}
          </div>
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'8px 10px', borderRadius:10,
            background:'var(--bg-2)', border:'1px solid var(--line-2)',
          }}>
            <IconTerminal size={14} style={{ color:'var(--fg-3)' }}/>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMsg(); }}
              placeholder="Ask Smart Ops about this event…"
              style={{ flex:1, background:'transparent', border:0, outline:'none', color:'var(--fg)', fontSize:12.5 }}
            />
            <button onClick={sendMsg} style={{
              padding:'5px 12px', borderRadius:7,
              background:'var(--accent-glow)', border:'1px solid var(--accent-2)',
              color:'var(--accent)', fontSize:11.5, fontWeight:600,
            }}>Send</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(20px); opacity:0; } to { transform:none; opacity:1; } }
      `}</style>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={{
      padding:'9px 11px', borderRadius:8,
      background:'var(--bg-3)', border:'1px solid var(--line)',
    }}>
      <div style={{ fontSize:10, color:'var(--fg-3)', letterSpacing:'0.12em', marginBottom:4 }} className="mono">{k.toUpperCase()}</div>
      <div style={{ fontSize:12.5 }}>{v}</div>
    </div>
  );
}

function TimelineRow({ step, shown, last }) {
  const kindColor = {
    start:'var(--accent)', data:'var(--sev-info)', hypo:'var(--sev-med)',
    query:'var(--sev-low)', action:'var(--sev-high)',
  }[step.kind] || 'var(--fg-3)';
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'48px 18px 1fr', alignItems:'flex-start',
      gap:10, padding:'8px 0',
      opacity: shown ? 1 : 0.18,
      transition:'opacity .3s',
    }}>
      <div className="mono" style={{ fontSize:10.5, color:'var(--fg-3)', paddingTop:3 }}>{step.t}</div>
      <div style={{ position:'relative', height:'100%' }}>
        <div style={{
          width:10, height:10, borderRadius:99,
          background: shown ? kindColor : 'var(--bg-3)',
          border:`1px solid ${shown ? kindColor : 'var(--line-2)'}`,
          marginTop:3,
          boxShadow: shown ? `0 0 10px ${kindColor}` : 'none',
        }}/>
        {!last && <div style={{
          position:'absolute', left:4.5, top:14, bottom:-8,
          width:1, background:'var(--line)',
        }}/>}
      </div>
      <div style={{ fontSize:12.5, color:'var(--fg-2)', lineHeight:1.5 }}>
        <span className="mono" style={{ fontSize:10, color:kindColor, letterSpacing:'0.12em', marginRight:8 }}>
          {step.kind.toUpperCase()}
        </span>
        {step.text}
      </div>
    </div>
  );
}

function SignalPlot() {
  // static svg placeholder: a signal waveform
  const W = 480, H = 90;
  const pts = Array.from({ length: 120 }).map((_, i) => {
    const x = (i / 119) * W;
    const base = H / 2 + Math.sin(i * 0.2) * 6 + Math.sin(i * 0.5) * 3;
    const spike = i > 70 && i < 90 ? -Math.sin((i - 70) * 0.3) * 30 : 0;
    const growth = i > 60 ? (i - 60) * 0.3 : 0;
    return `${x.toFixed(1)},${(base + spike - growth).toFixed(1)}`;
  }).join(' ');
  return (
    <div style={{
      borderRadius:10, padding:'12px 14px',
      background:'var(--bg-3)', border:'1px solid var(--line)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div className="mono" style={{ fontSize:10.5, color:'var(--fg-3)', letterSpacing:'0.14em' }}>SERVICE SIGNAL · last 60m</div>
        <div className="mono" style={{ fontSize:10.5, color:'var(--accent)' }}>+18.4% ▲</div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
        <defs>
          <linearGradient id="sig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
        <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#sig)"/>
        <line x1="0" y1={H-1} x2={W} y2={H-1} stroke="var(--line)"/>
      </svg>
    </div>
  );
}

Object.assign(window, { Investigation });
