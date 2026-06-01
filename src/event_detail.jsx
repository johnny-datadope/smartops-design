// Event detail modal — opens when a row title is clicked.

const PANEL_RIGHT_PCT_KEY = 'smartops-alert-detail-right-pct';
const PANEL_RIGHT_DEFAULT = 45;
const PANEL_RIGHT_MIN = 30;
const PANEL_RIGHT_MAX = 65;

function loadStoredRightPct() {
  try {
    const raw = localStorage.getItem(PANEL_RIGHT_PCT_KEY);
    const v = parseFloat(raw);
    if (!Number.isNaN(v) && v >= PANEL_RIGHT_MIN && v <= PANEL_RIGHT_MAX) return v;
  } catch (_) { /* ignore */ }
  return PANEL_RIGHT_DEFAULT;
}

function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const subscribe = React.useCallback((cb) => {
    if (typeof window === 'undefined') return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener('change', cb);
    return () => mql.removeEventListener('change', cb);
  }, [query]);
  const getSnapshot = React.useCallback(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
    [breakpoint],
  );
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function parseEventAtLocal(s) {
  if (!s) return null;
  return parseFlexibleDate(s);
}

function caseNumberFromEvent(event) {
  if (event.case_id != null) return event.case_id;
  if (event.case && event.case !== '—') return String(event.case).replace('#', '');
  return null;
}

function eventHasCase(event) {
  return event && event.case && event.case !== '—';
}

function mockInvestigationStages(event) {
  const base = parseEventAtLocal(event.at) || new Date();
  const iso = (d) => d.toISOString();
  const hasCase = eventHasCase(event);
  if (!hasCase) {
    return { current_stage: 'triage', triage: null, post_mortem: null, closed: null };
  }

  const triageStart = new Date(base.getTime() + 60000);
  const triageEnd = new Date(triageStart.getTime() + 21000);
  const isClosed = event.alert_status === 'CLOSED' || event.caseStatus === 'closed';

  if (isClosed) {
    const postStart = new Date(triageEnd.getTime() + 60000);
    const postEnd = new Date(postStart.getTime() + 3600000);
    const closedStart = new Date(postEnd.getTime());
    const closedEnd = new Date(closedStart.getTime() + (3 * 24 + 6) * 3600000);
    return {
      current_stage: 'closed',
      triage: { started_at: iso(triageStart), finished_at: iso(triageEnd) },
      post_mortem: { started_at: iso(postStart), finished_at: iso(postEnd) },
      closed: { started_at: iso(closedStart), finished_at: iso(closedEnd) },
    };
  }

  return {
    current_stage: 'triage',
    triage: { started_at: iso(triageStart), finished_at: null },
    post_mortem: null,
    closed: null,
  };
}

function ModalAlertStatusBadge({ alertStatus, status }) {
  const { t } = useI18n();
  const key = resolveAlertStatusKey(alertStatus, status);
  const label = (t.alertStatus && t.alertStatus[key]) || key;
  return <span className="modal-status-badge">{label}</span>;
}

function InvestigationStagesTimeline({ stages, t }) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const keys = ['triage', 'post_mortem', 'closed'];
  return (
    <div className="investigation-stages">
      <div className="investigation-stages__row">
        {keys.map((key, index) => {
          const stageData = stages[key];
          const isCompleted = stageData?.finished_at != null;
          const isActive = stages.current_stage === key;
          const isLast = index === keys.length - 1;
          const endIso = stageData?.finished_at || (isActive ? now.toISOString() : null);
          const duration = stageData?.started_at && endIso
            ? formatDuration(stageData.started_at, endIso)
            : '';
          return (
            <div key={key} className="investigation-stages__item">
              <div className="investigation-stages__stage">
                <div className={'investigation-stages__node' + (isCompleted ? ' is-done' : isActive ? ' is-active' : '')}>
                  {isCompleted ? <IconCheck size={14}/> : isActive ? <span className="investigation-stages__dot"/> : null}
                </div>
                <div className="investigation-stages__label">
                  <span className={'investigation-stages__title' + (isActive ? ' is-active' : isCompleted ? ' is-done' : '')}>
                    {t.investigationStage[key]}
                  </span>
                  {stageData?.started_at ? (
                    <>
                      <span className={'investigation-stages__duration' + (isCompleted ? ' is-done' : '')}>{duration}</span>
                      <span className="investigation-stages__meta">
                        {formatTimestamp(stageData.started_at)}
                        {stageData.finished_at ? ` → ${formatTimestamp(stageData.finished_at)}` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="investigation-stages__meta">—</span>
                  )}
                </div>
              </div>
              {!isLast && <div className={'investigation-stages__connector' + (isCompleted ? ' is-done' : '')}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventDetail({ event, onClose, onInvestigate, onAssign }) {
  const { t } = useI18n();
  const [tab, setTab] = React.useState('overview');
  const [comment, setComment] = React.useState('');
  const [comments, setComments] = React.useState([]);
  const [aiInput, setAiInput] = React.useState('');
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = React.useState('detail');
  const containerRef = React.useRef(null);
  const [rightPct, setRightPct] = React.useState(loadStoredRightPct);
  const [handleActive, setHandleActive] = React.useState(false);

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

  const hasCase = eventHasCase(event);
  const namespace = event.namespace || event.scope || 'default';
  const metaLine = [event.service, namespace, formatTimestamp(event.at)].filter(Boolean).join(' · ');
  const severityKey = resolveSeverityKey(event.severity, event.sev);
  const tabs = [
    { id: 'overview', label: t.alertDetail.overview },
    { id: 'activity', label: t.alertDetail.activity },
    { id: 'info', label: t.alertDetail.additionalInfo },
  ];

  const startResize = (e) => {
    e.preventDefault();
    setHandleActive(true);
    const onMove = (ev) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = ((rect.right - ev.clientX) / rect.width) * 100;
      setRightPct(Math.min(PANEL_RIGHT_MAX, Math.max(PANEL_RIGHT_MIN, pct)));
    };
    const onUp = () => {
      setHandleActive(false);
      setRightPct((cur) => {
        const rounded = Math.round(cur * 10) / 10;
        try { localStorage.setItem(PANEL_RIGHT_PCT_KEY, String(rounded)); } catch (_) { /* ignore */ }
        return rounded;
      });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const leftPanel = (
    <div style={{ display:'flex', flexDirection:'column', minWidth:0, minHeight:0, overflow:'hidden', height:'100%' }}>
      <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--line)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className={modalSeverityBadgeClass(event.severity, event.sev)}>{severityKey}</span>
            <ModalAlertStatusBadge alertStatus={event.alert_status} status={event.status}/>
          </div>
          {!isMobile && (
            <div style={{ display:'flex', gap:6 }}>
              <button type="button" className="btn btn--ghost btn--icon" onClick={() => setIsMaximized(m => !m)} title={isMaximized ? t.common.back : t.alertDetail.openFullPage}>
                {isMaximized ? <IconMinimize size={14}/> : <IconExternalLink size={14}/>}
              </button>
              <button type="button" className="btn btn--ghost btn--icon" onClick={onClose} title={t.common.close}><IconClose size={14}/></button>
            </div>
          )}
        </div>
        <div style={{ fontSize:'1.375rem', fontWeight:600, letterSpacing:'-0.015em' }}>{event.title}</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: 4 }}>{metaLine}</div>
      </div>

      <div style={{ padding:'12px 22px 0', borderBottom:'1px solid var(--line)' }}>
        <InvestigationStagesTimeline stages={mockInvestigationStages(event)} t={t}/>
      </div>

      <div style={{ display:'flex', gap:2, padding:'0 22px', borderBottom:'1px solid var(--line)' }}>
        {tabs.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className={'detail-tab' + (tab === item.id ? ' is-active' : '')}>
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
        {tab === 'overview' && (
          <OverviewPane
            event={event}
            t={t}
            comments={comments}
            comment={comment}
            setComment={setComment}
            submitComment={submitComment}
          />
        )}
        {tab === 'activity' && <ActivityPane t={t}/>}
        {tab === 'info' && <ExtraPane event={event} t={t}/>}
      </div>
    </div>
  );

  const rightPanel = (
    <div className="chat-panel">
      <CaseManagementHeader
        event={event}
        hasCase={hasCase}
        t={t}
        assignOpen={assignOpen}
        setAssignOpen={setAssignOpen}
        onAssign={onAssign}
      />

      {hasCase ? (
        <>
          <ChatPanelHeader
            t={t}
            feedback={feedback}
            setFeedback={setFeedback}
            shareOpen={shareOpen}
            setShareOpen={setShareOpen}
            copied={copied}
            onCopyChat={() => {
              navigator.clipboard.writeText(JSON.stringify(turns, null, 2));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          />
          <div ref={scrollRef} className="chat-panel__scroll">
            {turns.map((turn) => (
              <ThreadTurn key={turn.id} turn={turn} t={t} onToggle={() => {
                setTurns(ts => ts.map(item => item.id === turn.id ? { ...item, open: !item.open } : item));
              }}/>
            ))}
          </div>
          <div className="chat-panel__footer">
            <button onClick={runReinvestigate} disabled={busy} className="chat-footer-btn">
              <IconRotateCcw size={13}/> {t.chat.reinvestigate}
            </button>
            <button onClick={runPostmortem} disabled={busy} className="chat-footer-btn">
              <IconFileText size={13}/> {t.chat.postMortem}
            </button>
          </div>
          <div className="chat-panel__input">
            <div className="chat-input-wrap">
              <input
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder={t.chat.askPlaceholder}
              />
              <button type="button" className="chat-send-btn" onClick={sendMessage}>
                <IconSend size={13}/>
              </button>
            </div>
          </div>
        </>
      ) : (
        <EmptyCaseState event={event} t={t} onInvestigate={onInvestigate}/>
      )}
    </div>
  );

  const shell = isMobile ? (
    <div
      className={'modal-dialog' + (isMaximized ? ' is-maximized' : '')}
      onClick={e => e.stopPropagation()}
    >
      <div className="modal-mobile-bar">
        <button type="button" className={'modal-mobile-tab' + (mobileView === 'detail' ? ' is-active' : '')} onClick={() => setMobileView('detail')}>
          <IconFileText size={14}/> {t.alertDetail.overview}
        </button>
        <button type="button" className={'modal-mobile-tab' + (mobileView === 'chat' ? ' is-active' : '')} onClick={() => setMobileView('chat')}>
          <IconBrainCircuit size={14}/> {t.chat.aiChatTab}
        </button>
        <button type="button" className="modal-mobile-close" onClick={onClose} aria-label={t.common.close}>
          <IconClose size={16}/>
        </button>
      </div>
      <div className="modal-mobile-body">
        {mobileView === 'detail' ? leftPanel : (
          <div style={{ display:'flex', flexDirection:'column', minHeight:0, flex:1, background:'var(--bg-2)', padding:12 }}>
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div
      ref={containerRef}
      className={'modal-dialog modal-dialog--split' + (isMaximized ? ' is-maximized' : '')}
      onClick={e => e.stopPropagation()}
    >
      <div className="modal-split__left" style={{ width: `calc(${100 - rightPct}% - 3px)` }}>
        {leftPanel}
      </div>
      <div
        className={'panel-resize-handle' + (handleActive ? ' is-active' : '')}
        onMouseDown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
      >
        <span className="panel-resize-handle__grip"><IconGripVertical size={10}/></span>
      </div>
      <div className="modal-split__right" style={{ width: `calc(${rightPct}% - 3px)` }}>
        {rightPanel}
      </div>
    </div>
  );

  if (isMaximized) {
    return (
      <div style={{ position:'fixed', inset:0, zIndex:40, background:'var(--background)' }}>
        {shell}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {shell}
      <style>{`
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

const codeInline = {
  fontFamily:'Geist Mono, monospace', fontSize:11,
  padding:'1px 5px', borderRadius:4,
  background:'var(--bg-3)', border:'1px solid var(--line)',
  color:'var(--accent)',
};

function CaseManagementHeader({ event, hasCase, t, assignOpen, setAssignOpen, onAssign }) {
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const list = currentAssignees(event);
  const caseNum = caseNumberFromEvent(event);

  const unassignOne = (initials) => {
    const u = list.find(a => a.initials === initials);
    if (u && onAssign) onAssign({ toggle: u });
  };

  return (
    <div className="case-mgmt">
      <div className="case-mgmt__top">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{
            width:24, height:24, borderRadius:6,
            background:'color-mix(in oklch, var(--primary) 15%, transparent)',
            color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <IconBriefcase size={14}/>
          </div>
          <span style={{ fontSize:14, fontWeight:600 }}>
            {hasCase && caseNum != null ? `${t.cases.title} #${caseNum}` : t.cases.title}
          </span>
        </div>
        {hasCase && (
          <div className="case-mgmt__status-col">
            <CaseStatusBadge status={event.caseStatus} caseStatus={event.case_status}/>
            <div style={{ position:'relative' }}>
              <button onClick={() => setActionsOpen(o => !o)} style={{
                fontSize:11, color:'var(--foreground)', display:'inline-flex', alignItems:'center', gap:4,
                padding:'4px 8px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', height:24,
              }}>
                <IconChevronDown size={12}/> {t.cases.actions}
              </button>
              {actionsOpen && (
                <>
                  <div onClick={() => setActionsOpen(false)} style={{ position:'fixed', inset:0, zIndex:1 }}/>
                  <div style={{
                    position:'absolute', top:'calc(100% + 4px)', right:0, zIndex:2,
                    minWidth:160, background:'var(--bg)', border:'1px solid var(--line-2)',
                    borderRadius:8, boxShadow:'0 12px 24px -6px rgba(0,0,0,0.35)', padding:4,
                  }}>
                    <button style={menuItemStyle} onClick={() => setActionsOpen(false)}>{t.cases.closeCase}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {hasCase && (
        <div className="case-mgmt__assignees">
          <IconUsers size={12} style={{ color:'var(--muted-foreground)', flexShrink:0, marginTop:2 }}/>
          {list.length === 0 && (
            <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>{t.cases.noOneAssigned}</span>
          )}
          {list.map(a => (
            <span key={a.initials} className="assignee-chip">
              <span className="avatar" style={{ width:16, height:16, fontSize:8, marginLeft:0 }}>{a.initials}</span>
              <span style={{ fontSize:11 }}>{a.name || a.initials}</span>
              <button type="button" onClick={() => unassignOne(a.initials)} aria-label={t.alerts.unassignAll}>
                <IconClose size={10}/>
              </button>
            </span>
          ))}
          <div style={{ position:'relative' }}>
            <button onClick={() => setAssignOpen(o => !o)} className="assign-to-btn">
              <IconPlus size={11}/> {t.alerts.assignTo}
            </button>
            {assignOpen && (
              <>
                <div onClick={() => setAssignOpen(false)} style={{ position:'fixed', inset:0, zIndex:1 }}/>
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:2,
                  width:280, maxHeight:360,
                  background:'var(--bg)', border:'1px solid var(--line-2)',
                  borderRadius:10, boxShadow:'0 20px 40px -8px rgba(0,0,0,0.5)',
                  display:'flex', flexDirection:'column', overflow:'hidden',
                }}>
                  <AssigneePickerBody
                    assigned={list}
                    hasCase={hasCase}
                    onToggle={u => onAssign && onAssign({ toggle: u })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  width:'100%', display:'flex', alignItems:'center', gap:8,
  padding:'8px 10px', borderRadius:6, fontSize:12,
  color:'var(--fg)', background:'transparent', border:0, cursor:'pointer', textAlign:'left',
};

function ChatPanelHeader({ t, feedback, setFeedback, shareOpen, setShareOpen, copied, onCopyChat }) {
  return (
    <div className="chat-panel-header">
      <div className="chat-panel-header__icon">
        <IconBrainCircuit size={16}/>
        <span className="chat-panel-header__dot"/>
      </div>
      <div className="chat-panel-header__title">
        <h3>{t.chat.aiAssistant}</h3>
      </div>
      <div className="chat-panel-header__actions">
        <button type="button" className="chat-icon-btn" title={t.support.openAlertTicket} aria-label={t.support.openAlertTicket}>
          <IconLifeBuoy size={14}/>
        </button>
        <button
          type="button"
          className={'chat-icon-btn' + (feedback === 'up' ? ' is-active' : '')}
          aria-label={t.chat.helpful}
          onClick={() => setFeedback(f => f === 'up' ? null : 'up')}
        >
          <IconThumbsUp size={14}/>
        </button>
        <button
          type="button"
          className={'chat-icon-btn' + (feedback === 'down' ? ' is-danger-active' : '')}
          aria-label={t.chat.notHelpful}
          onClick={() => setFeedback(f => f === 'down' ? null : 'down')}
        >
          <IconThumbsDown size={14}/>
        </button>
        <div style={{ position:'relative' }}>
          <button type="button" className="chat-share-btn" onClick={() => setShareOpen(o => !o)} aria-label={t.rca.share}>
            <IconShare size={14}/> <span>{t.rca.share}</span>
          </button>
          {shareOpen && (
            <>
              <div onClick={() => setShareOpen(false)} style={{ position:'fixed', inset:0, zIndex:1 }}/>
              <div style={{
                position:'absolute', top:'calc(100% + 4px)', right:0, zIndex:2,
                minWidth:180, background:'var(--bg)', border:'1px solid var(--line-2)',
                borderRadius:10, boxShadow:'0 12px 24px -6px rgba(0,0,0,0.35)', padding:4, overflow:'hidden',
              }}>
                <button style={menuItemStyle} onClick={() => { onCopyChat(); setShareOpen(false); }}>
                  {copied ? <IconCheck size={12}/> : <IconCopy size={12}/>}
                  {copied ? t.rca.copied : t.chat.copyFullChat}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyCaseState({ event, t, onInvestigate }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px', textAlign:'center', minHeight:300 }}>
      <div style={{
        width:64, height:64, borderRadius:9999, marginBottom:16,
        background:'color-mix(in oklch, var(--primary) 10%, transparent)',
        border:'2px solid color-mix(in oklch, var(--primary) 20%, transparent)',
        color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <IconBrainCircuit size={32}/>
      </div>
      <div style={{ fontSize:18, fontWeight:600, marginBottom:6 }}>{t.cases.noCaseOpened}</div>
      <p style={{ fontSize:14, color:'var(--muted-foreground)', maxWidth:280, lineHeight:1.5, margin:'0 0 20px' }}>
        {t.alerts.createCaseDescription}
      </p>
      <button type="button" className="btn btn--primary btn--sm" onClick={() => onInvestigate && onInvestigate(event)}>
        <IconBrainCircuit size={14}/> {t.investigate.startInvestigation}
      </button>
    </div>
  );
}

function OverviewPane({ event, t, comments, comment, setComment, submitComment }) {
  const primaryLabels = [
    ['app', event.service || 'unknown'],
    ['severity', (event.sev || 'info').toLowerCase()],
    ['namespace', event.namespace || event.scope || 'default'],
    ['alertname', (event.title || '').replace(/\s+/g, '')],
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div className="card" style={{ padding:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <div style={{
            width:24, height:24, borderRadius:6,
            background:'color-mix(in oklch, var(--primary) 15%, transparent)',
            color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <IconClock size={14}/>
          </div>
          <h3 style={{ fontSize:'0.875rem', fontWeight:600, margin:0 }}>{t.alerts.description}</h3>
        </div>
        <div style={{ marginLeft:32, display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <p className="overview-label">{t.alertDetail.summary}</p>
            <p style={{ fontSize:'0.875rem', lineHeight:1.6, margin:0 }}>{event.detail}</p>
          </div>
          <div style={{ height:1, background:'var(--border)' }}/>
          <div>
            <p className="overview-label">{t.alertDetail.details}</p>
            <p style={{ fontSize:'0.875rem', lineHeight:1.6, margin:0 }}>{event.detail}</p>
          </div>
          <div style={{ height:1, background:'var(--border)' }}/>
          <div>
            <p className="overview-label">{t.alerts.labels}</p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {primaryLabels.map(([k, v]) => (
                <span key={k} className="alert-label-chip">
                  <span className="alert-label-chip__key">{k}:</span>
                  <span className="alert-label-chip__val">{v}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <CommentsSection t={t} comments={comments} comment={comment} setComment={setComment} submitComment={submitComment}/>
    </div>
  );
}

function CommentsSection({ t, comments, comment, setComment, submitComment }) {
  return (
    <div className="card" style={{ padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <div style={{
          width:24, height:24, borderRadius:6,
          background:'color-mix(in oklch, var(--primary) 15%, transparent)',
          color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <IconPenLine size={14}/>
        </div>
        <h3 style={{ fontSize:'0.875rem', fontWeight:600, margin:0, flex:1 }}>{t.cases.caseComments}</h3>
        <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>
          {comments.length} {comments.length === 1 ? t.cases.comment : t.cases.comments}
        </span>
      </div>
      <div style={{ marginLeft:32 }}>
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
        <div className="comment-composer">
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                e.preventDefault();
                submitComment();
              }
            }}
            placeholder={t.alertDetail.addComment}
          />
          <button type="button" onClick={submitComment} disabled={!comment.trim() || comment.length > COMMENT_MAX_LENGTH}>
            <IconSend size={13}/>
          </button>
        </div>
        <p className="comment-counter" style={{ color: comment.length > COMMENT_MAX_LENGTH ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
          {comment.length}/{COMMENT_MAX_LENGTH}
        </p>
      </div>
    </div>
  );
}

const COMMENT_MAX_LENGTH = 3000;

function ActivityPane({ t }) {
  const acts = [
    { t:'17:00', who:'System', text: t.alertDetail.alertCreated },
    { t:'16:59', who:'SmartOps AI', text:'Root cause analysis generated · confidence 0.72'},
    { t:'16:59', who:'Prometheus', text:'Alert fired · /api/v1/payments 500 rate above 15%'},
  ];
  return (
    <div className="card" style={{ padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <div style={{
          width:24, height:24, borderRadius:6,
          background:'color-mix(in oklch, var(--primary) 15%, transparent)',
          color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <IconMessageSquare size={14}/>
        </div>
        <h3 style={{ fontSize:'0.875rem', fontWeight:600, margin:0 }}>{t.alertDetail.activity}</h3>
      </div>
      <div className="activity-timeline" style={{ marginLeft:32 }}>
        {acts.map((a, i) => (
          <div key={i} className="activity-timeline__item">
            <div className="activity-timeline__rail">
              <div className="activity-timeline__dot"/>
              {i < acts.length - 1 && <div className="activity-timeline__line"/>}
            </div>
            <div className="activity-timeline__body">
              <div className="activity-timeline__meta">
                <span className="mono">{a.t}</span>
                <span className="mono">{a.who.toUpperCase()}</span>
              </div>
              <div className="activity-timeline__text">{a.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExtraPane({ event, t }) {
  const [copied, setCopied] = React.useState(false);
  const payload = {
    id: event.id,
    alert_name: event.title,
    alert_description: event.detail,
    severity: event.severity || event.sev?.toUpperCase(),
    alert_status: event.alert_status,
    component: event.service,
    source_client: event.source_client,
    source_project: event.source_project,
    source_environment: event.source_environment,
    source_name: event.source,
    case_id: event.case !== '—' ? event.case.replace('#', '') : null,
    case_status: event.case_status,
    agent_status: event.agent_status,
    created_at: event.at,
    tags: event.labels,
  };
  const jsonString = JSON.stringify(payload, null, 2);
  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="json-payload-card">
      <div className="json-payload-card__header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="json-payload-card__icon"><IconDatabase size={14}/></div>
          <span style={{ fontSize:'0.8125rem', fontWeight:600 }}>{t.alertDetail.jsonPayload}</span>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={handleCopy}>
          {copied ? <><IconCheck size={12}/> {t.common.copied}</> : <><IconCopy size={12}/> {t.common.copy}</>}
        </button>
      </div>
      <pre className="json-payload-card__body mono">{jsonString}</pre>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10, color:'var(--muted-foreground)' }}>
        {icon}
        <span style={{ fontSize:'0.8125rem', fontWeight:500 }}>{title}</span>
      </div>
      <div className="card" style={{ padding:'14px 14px 4px' }}>{children}</div>
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

function ThreadTurn({ turn, onToggle, t }) {
  if (turn.kind === 'reasoning') {
    return (
      <div className="so-turn" style={{ marginBottom:18 }}>
        <button onClick={onToggle} style={{
          display:'flex', alignItems:'center', gap:8, marginBottom:8, color:'var(--fg)',
          background:'transparent', border:0, padding:0, cursor:'pointer',
        }}>
          <IconChevron size={12} style={{ transform: turn.open ? 'rotate(90deg)' : 'none', color:'var(--fg-3)', transition:'transform .15s' }}/>
          <IconBrainCircuit size={14} style={{ color:'var(--primary)' }}/>
          <span style={{ fontSize:12.5, fontWeight:500 }}>{t.chat.reasoning}</span>
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
          background:'color-mix(in oklch, var(--primary) 15%, transparent)', border:'1px solid color-mix(in oklch, var(--primary) 30%, transparent)',
          color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center',
        }}><IconBrainCircuit size={12}/></div>
        <div style={{ fontSize:12.5, lineHeight:1.6, color:'var(--fg-2)', paddingTop:3 }}>{turn.text}</div>
      </div>
    );
  }

  if (turn.kind === 'thinking') {
    return (
      <div className="so-turn" style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
        <div style={{
          width:24, height:24, borderRadius:99, flexShrink:0,
          background:'color-mix(in oklch, var(--primary) 15%, transparent)', border:'1px solid color-mix(in oklch, var(--primary) 30%, transparent)',
          color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center',
        }}><IconBrainCircuit size={12}/></div>
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
      <div className="avatar-stack">
        {shown.map((a, i) => (
          <div key={a.initials + i} className="avatar" title={a.name} style={{ zIndex: shown.length - i }}>{a.initials}</div>
        ))}
        {rest > 0 && <div className="avatar" style={{ zIndex: 0 }}>+{rest}</div>}
      </div>
      <span style={{ fontSize:'0.875rem', color:'var(--muted-foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
        {list.length === 1 ? list[0].name : `${list.length} assignees`}
      </span>
    </div>
  );
}
