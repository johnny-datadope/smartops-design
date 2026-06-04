// Event detail modal — opens when a row title is clicked.

const PANEL_RIGHT_PCT_KEY = 'smartops-alert-detail-right-pct';
const PANEL_RIGHT_DEFAULT = 45;
const PANEL_RIGHT_MIN = 30;
const PANEL_RIGHT_MAX = 65;
/** Must match .panel-resize-handle flex-basis in index.html */
const PANEL_RESIZE_HANDLE_PX = 1;

function panelSplitWidth(pct) {
  return `calc((100% - ${PANEL_RESIZE_HANDLE_PX}px) * ${pct / 100})`;
}

/** Max textarea height (~20 lines at 13px + leading-relaxed). Update if typography changes. */
const COMMENT_TEXTAREA_MAX_HEIGHT = 420;
const COMMENT_TEXTAREA_MIN_HEIGHT = 20;
const COMMENT_MAX_LENGTH = 3000;

/** AI chat input — mirrors chia AiChatPanel (13px, leading-relaxed, max 8 lines). */
const CHAT_TEXTAREA_FONT_SIZE_PX = 13;
const CHAT_TEXTAREA_LINE_HEIGHT = 1.625;
const CHAT_TEXTAREA_MAX_LINES = 8;
const CHAT_TEXTAREA_MIN_HEIGHT = 20;
const CHAT_TEXTAREA_MAX_HEIGHT = Math.ceil(
  CHAT_TEXTAREA_FONT_SIZE_PX * CHAT_TEXTAREA_LINE_HEIGHT * CHAT_TEXTAREA_MAX_LINES,
);

function loadStoredRightPct() {
  try {
    const raw = localStorage.getItem(PANEL_RIGHT_PCT_KEY);
    const v = parseFloat(raw);
    if (!Number.isNaN(v) && v >= PANEL_RIGHT_MIN && v <= PANEL_RIGHT_MAX) return v;
  } catch (_) { /* ignore */ }
  return PANEL_RIGHT_DEFAULT;
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

/** Session display for comment authors — same mock identities as TopBar. */
function sessionCommentAuthor(currentUser) {
  const isAdmin = currentUser?.role === 'Admin';
  if (isAdmin) {
    return { name: 'Daniel Dorado', initials: 'DD' };
  }
  return { name: 'Francisca Molina', initials: 'FM' };
}

function commentInitials(name, fallback = '?') {
  const source = (name && name.trim()) || fallback;
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function eventHasCase(event) {
  return event && event.case && event.case !== '—';
}

function ModalAlertStatusBadge({ alertStatus, status }) {
  const { t } = useI18n();
  const key = resolveAlertStatusKey(alertStatus, status);
  const label = (t.alertStatus && t.alertStatus[key]) || key;
  return <span className={modalAlertStatusBadgeClass()}>{label}</span>;
}

function StageNode({ isCompleted, isActive }) {
  return (
    <div className={'investigation-stages__node' + (isCompleted ? ' is-done' : isActive ? ' is-active' : '')}>
      {isCompleted ? <IconCheck size={14} sw={2.5}/> : isActive ? <span className="investigation-stages__dot"/> : null}
    </div>
  );
}

function InvestigationStageDetails({ stageData, isCompleted, isActive, nowIso, t, layout = 'wide' }) {
  if (!stageData?.started_at) {
    return <span className="investigation-stages__dash">—</span>;
  }
  if (layout === 'compact') {
    return (
      <p className="investigation-stages__times">
        {formatTimestamp(stageData.started_at)}
        {stageData.finished_at && ` → ${formatTimestamp(stageData.finished_at)}`}
      </p>
    );
  }
  const tone = isCompleted ? '' : isActive ? 'is-active' : '';
  const duration = formatDuration(stageData.started_at, stageData.finished_at || nowIso);
  return (
    <>
      <span className={'investigation-stages__start ' + tone}>
        {t.alertDetail.stageStart} {formatTimestamp(stageData.started_at)}
      </span>
      {stageData.finished_at && (
        <span className="investigation-stages__end">
          {t.alertDetail.stageEnd} {formatTimestamp(stageData.finished_at)}
        </span>
      )}
      <span className={'investigation-stages__duration ' + (isCompleted ? 'is-done' : '')}>{duration}</span>
    </>
  );
}

function InvestigationStagesTimeline({ stages, t }) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const keys = ['triage', 'post_mortem', 'closed'];
  const nowIso = now.toISOString();

  const renderStage = (key, index, layout) => {
    const stageData = stages[key];
    const isCompleted = stageData?.finished_at != null;
    const isActive = stages.current_stage === key;
    const isLast = index === keys.length - 1;
    const titleClass = 'investigation-stages__title'
      + (isActive ? ' is-active' : isCompleted ? ' is-done' : '');

    if (layout === 'compact') {
      return (
        <div key={key} className="investigation-stages__v-item">
          <div className="investigation-stages__v-rail">
            <StageNode isCompleted={isCompleted} isActive={isActive}/>
            {!isLast && <div className={'investigation-stages__v-line' + (isCompleted ? ' is-done' : '')}/>}
          </div>
          <div className="investigation-stages__v-body">
            <div className="investigation-stages__v-head">
              <span className={titleClass}>{t.investigationStage[key]}</span>
              {stageData?.started_at && (
                <span className={'investigation-stages__duration ' + (isCompleted ? 'is-done' : isActive ? '' : '')}>
                  {formatDuration(stageData.started_at, stageData.finished_at || nowIso)}
                </span>
              )}
            </div>
            <InvestigationStageDetails
              stageData={stageData}
              isCompleted={isCompleted}
              isActive={isActive}
              nowIso={nowIso}
              t={t}
              layout="compact"
            />
          </div>
        </div>
      );
    }

    return (
      <div key={key} className={'investigation-stages__item' + (isLast ? ' investigation-stages__item--last' : '')}>
        <div className="investigation-stages__stage">
          <StageNode isCompleted={isCompleted} isActive={isActive}/>
          <div className="investigation-stages__label">
            <span className={titleClass}>{t.investigationStage[key]}</span>
            <InvestigationStageDetails stageData={stageData} isCompleted={isCompleted} isActive={isActive} nowIso={nowIso} t={t}/>
          </div>
        </div>
        {!isLast && <div className={'investigation-stages__connector' + (isCompleted ? ' is-done' : '')}/>}
      </div>
    );
  };

  return (
    <div className="investigation-stages">
      <div className="investigation-stages--compact">
        <div className="investigation-stages__vertical">
          {keys.map((key, index) => renderStage(key, index, 'compact'))}
        </div>
      </div>
      <div className="investigation-stages__row investigation-stages__row--wide">
        {keys.map((key, index) => renderStage(key, index, 'wide'))}
      </div>
    </div>
  );
}

function AlertModalHeader({
  event, severityKey, onClose, isMaximized, onToggleMaximize,
}) {
  const { t } = useI18n();
  const namespace = event.namespace || event.scope || 'default';
  return (
    <div className="modal-alert-header">
      <div className="modal-alert-header__main">
        <div className="modal-alert-header__badges">
          <span className={modalSeverityBadgeClass(event.severity, event.sev)}>{severityKey}</span>
          <ModalAlertStatusBadge alertStatus={event.alert_status} status={event.status}/>
        </div>
        <h1 className="modal-alert-header__title">{event.title}</h1>
        <p className="modal-alert-header__meta">
          <span>{event.service}</span>
          <span className="modal-alert-header__meta-sep">·</span>
          <span>{namespace}</span>
          <span className="modal-alert-header__meta-sep">·</span>
          <span>{formatTimestamp(event.at)}</span>
        </p>
      </div>
      <div className="modal-alert-header__actions">
        {onToggleMaximize && (
          <button
            type="button"
            className="modal-alert-header__action-btn"
            onClick={onToggleMaximize}
            aria-label={isMaximized ? t.common.back : t.alertDetail.openFullPage}
          >
            {isMaximized ? <IconMinimize2 size={16}/> : <IconExternalLink size={16}/>}
          </button>
        )}
        <button
          type="button"
          className="modal-alert-header__action-btn"
          onClick={onClose}
          aria-label={t.common.close}
        >
          <IconClose size={16}/>
        </button>
      </div>
    </div>
  );
}

function EventDetail({ event, onClose, onCreateCase, onAssign, onEventUpdate, currentUser, sessionUser, alertId, isCreatingCase }) {
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
  const streamStartedRef = React.useRef(null);
  const [stageRev, setStageRev] = React.useState(0);

  const resolvedSessionUser = sessionUser || (currentUser ? getSessionUser(currentUser) : null);
  const isUserAssigned = event && resolvedSessionUser
    ? isCurrentUserAssigned(event, resolvedSessionUser)
    : false;

  const [turns, setTurns] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef(null);

  const submitComment = () => {
    const text = comment.trim();
    if (!text || text.length > COMMENT_MAX_LENGTH) return;
    const now = new Date();
    const at = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const author = sessionCommentAuthor(currentUser);
    setComments(cs => [...cs, {
      id: `c-${Date.now()}-${cs.length}`,
      text,
      author: author.name,
      initials: commentInitials(author.name),
      at,
    }]);
    setComment('');
  };

  React.useEffect(() => {
    if (!event) {
      setTurns([]);
      streamStartedRef.current = null;
      return;
    }
    const isLiveInvestigation = event.investigation_started && !event._streamComplete
      && !event.mock_scenario && !(Array.isArray(event.mock_turns) && event.mock_turns.length);
    if (!isLiveInvestigation) {
      streamStartedRef.current = null;
      setTurns(prev => {
        if (prev.some(turn => turn.kind === 'analysis') && event._streamComplete) {
          return prev;
        }
        return typeof resolveInitialTurns === 'function' ? resolveInitialTurns(event, t) : [];
      });
      setBusy(false);
    }
    setFeedback(null);
    setAiInput('');
  }, [event?.id, event?.case_id, event?.investigation_started, event?.mock_scenario, event?._streamComplete, t]);

  const runInitialInvestigationStream = React.useCallback(() => {
    if (!event || busy || typeof streamMockInvestigation !== 'function') return;
    if (!event.source_host) {
      event.source_host = 'api-gateway-02.example.com';
    }
    streamMockInvestigation({
      event,
      t,
      setTurns,
      setBusy,
      scenario: 'memory_leak',
      resetTurns: true,
      appendAnalysis: true,
      onComplete: () => {
        event._streamComplete = true;
        event.mock_scenario = 'memory_leak';
        event.case_status = 'AWAITING_ACTION';
        event.caseStatus = 'awaiting';
        event.agent_status = 'COMPLETED';
        event.investigation_stages = typeof completeTriageStage === 'function'
          ? completeTriageStage(event.investigation_stages || initInvestigationStages())
          : event.investigation_stages;
        setStageRev((n) => n + 1);
        onEventUpdate?.();
      },
    });
  }, [event, event?.case_id, event?.investigation_started, busy, t, onEventUpdate]);

  const investigationStarted = !!event?.investigation_started;
  const streamComplete = !!event?._streamComplete;

  React.useEffect(() => {
    if (!event) return;
    if (event.mock_turns?.length) return;
    if (event.mock_scenario && streamComplete) return;
    if (!investigationStarted || streamComplete) return;
    const key = String(event.id || event.case_id);
    if (streamStartedRef.current === key) return;
    streamStartedRef.current = key;
    runInitialInvestigationStream();
  }, [event, event?.case_id, investigationStarted, streamComplete, runInitialInvestigationStream]);

  const handleCloseCase = React.useCallback(() => {
    if (!event || event.caseStatus === 'closed') return;
    if (typeof mockCloseCase === 'function') {
      mockCloseCase(event);
    } else {
      event.case_status = 'CLOSED';
      event.caseStatus = 'closed';
    }
    setStageRev((n) => n + 1);
    onEventUpdate?.();
  }, [event, onEventUpdate]);

  const alertSupportUrl = useAlertHelpdeskUrl(event, alertId, currentUser, turns);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  const rcaHasBeenGenerated = turns.some(t => t.kind === 'analysis');
  const postMortemGenerated = turns.some(t => t.kind === 'postmortem');
  const canReinvestigate = turns.some(t => t.kind === 'user');

  const handleFeedback = (type) => {
    if (!rcaHasBeenGenerated) return;
    setFeedback(type);
  };

  const runReinvestigate = () => {
    if (busy || typeof streamMockInvestigation !== 'function') return;
    setFeedback('PENDING_REVIEW');
    streamMockInvestigation({
      event,
      t,
      setTurns,
      setBusy,
      scenario: 'reinvestigate',
      appendAnalysis: true,
    });
  };

  const runPostmortem = () => {
    if (busy || postMortemGenerated) return;
    setBusy(true);
    if (typeof startPostMortemStage === 'function') {
      event.investigation_stages = startPostMortemStage(
        event.investigation_stages
          || (typeof resolveInvestigationStages === 'function' ? resolveInvestigationStages(event) : null),
      );
      setStageRev((n) => n + 1);
      onEventUpdate?.();
    }
    const rid = 'r' + Date.now();
    const stepLabel = t.irisAgentStep?.postMortem || t.chat.postMortem;
    const reasoningStep = { label: stepLabel, isCompleted: false, toolCalls: [] };
    setTurns(ts => [...ts, { id: rid, kind: 'reasoning', isStreaming: true, steps: [reasoningStep] }]);

    const finish = () => {
      const markdown = typeof buildMockPostMortemMarkdown === 'function'
        ? buildMockPostMortemMarkdown(event, t)
        : '';
      setTurns(ts => [
        ...ts.map(turn => turn.id === rid
          ? { ...turn, isStreaming: false, steps: [{ label: stepLabel, isCompleted: true, toolCalls: [] }] }
          : turn),
        { id: 'p' + Date.now(), kind: 'postmortem', markdown },
      ]);
      if (typeof mockAutoCloseCaseAfterPostMortem === 'function') {
        mockAutoCloseCaseAfterPostMortem(event);
      } else if (typeof completePostMortemStage === 'function') {
        event.investigation_stages = completePostMortemStage(event.investigation_stages);
      }
      setStageRev((n) => n + 1);
      onEventUpdate?.();
      setBusy(false);
    };

    setTimeout(finish, 2200);
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
  const severityKey = resolveSeverityKey(event.severity, event.sev);
  const showInvestigationStages = typeof shouldShowInvestigationStages === 'function'
    ? shouldShowInvestigationStages(event)
    : hasCase && (event.investigation_stages || event.investigation_started || event._streamComplete || event.mock_scenario);
  const investigationStages = showInvestigationStages && typeof resolveInvestigationStages === 'function'
    ? resolveInvestigationStages(event)
    : null;
  void stageRev;
  const tabs = [
    { id: 'overview', label: t.alertDetail.overview, shortLabel: t.alertDetail.overview },
    { id: 'activity', label: t.alertDetail.activity, shortLabel: t.alertDetail.activity },
    {
      id: 'info',
      label: t.alertDetail.additionalInfo,
      shortLabel: t.alertDetail.additionalInfoShort,
    },
  ];

  const startResize = (e) => {
    e.preventDefault();
    setHandleActive(true);
    const onMove = (ev) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const available = rect.width - PANEL_RESIZE_HANDLE_PX;
      if (available <= 0) return;
      const splitX = Math.max(rect.left, Math.min(ev.clientX, rect.right - PANEL_RESIZE_HANDLE_PX));
      const rightPx = rect.right - splitX - PANEL_RESIZE_HANDLE_PX;
      const pct = (rightPx / available) * 100;
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
    <div className="modal-split__panel alert-left-panel">
      <div className="modal-left-fixed">
        <AlertModalHeader
          event={event}
          severityKey={severityKey}
          onClose={onClose}
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized(m => !m)}
        />

        {investigationStages && (
          <InvestigationStagesTimeline stages={investigationStages} t={t}/>
        )}

        <div className="modal-detail-tabs">
          {tabs.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={'detail-tab' + (tab === item.id ? ' is-active' : '')}
            >
              <span className="detail-tab__short">{item.shortLabel}</span>
              <span className="detail-tab__long">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="alert-left-scroll">
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
    <div className="chat-panel chat-scroll">
      <div className="chat-panel__section--shrink">
        <CaseManagementHeader
          event={event}
          hasCase={hasCase}
          t={t}
          assignOpen={assignOpen}
          setAssignOpen={setAssignOpen}
          onAssign={onAssign}
          onCloseCase={handleCloseCase}
        />
      </div>

      <div className="chat-panel__section--shrink">
        <ChatPanelHeader
          t={t}
          feedbackValue={feedback}
          onFeedback={handleFeedback}
          feedbackEnabled={rcaHasBeenGenerated}
          shareOpen={shareOpen}
          setShareOpen={setShareOpen}
          copied={copied}
          alertSupportUrl={alertSupportUrl}
          onCopyChat={() => {
            navigator.clipboard.writeText(JSON.stringify(turns, null, 2));
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
              setShareOpen(false);
            }, 1500);
          }}
        />
      </div>

      {!hasCase ? (
        <div className="chat-panel__scroll chat-panel__scroll--center">
          <EmptyCaseState
            t={t}
            isUserAssigned={isUserAssigned}
            isCreating={isCreatingCase}
            onCreateCase={onCreateCase}
          />
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="chat-panel__scroll">
            <div className="chat-panel__thread">
              {turns.map((turn, idx) => {
                if (turn.kind === 'analysis' && idx > 0 && turns[idx - 1].kind === 'reasoning') {
                  return null;
                }
                if (turn.kind === 'postmortem' && idx > 0 && turns[idx - 1].kind === 'reasoning') {
                  return null;
                }
                if (turn.kind === 'reasoning' && turns[idx + 1]?.kind === 'analysis') {
                  return (
                    <ThreadTurnCombined
                      key={turn.id}
                      reasoning={turn}
                      analysis={turns[idx + 1]}
                      t={t}
                    />
                  );
                }
                if (turn.kind === 'reasoning' && turns[idx + 1]?.kind === 'postmortem') {
                  return (
                    <ThreadTurnPostMortemCombined
                      key={turn.id}
                      reasoning={turn}
                      postMortem={turns[idx + 1]}
                      t={t}
                    />
                  );
                }
                return <ThreadTurn key={turn.id} turn={turn} t={t}/>;
              })}
              {busy && !turns.some(tr => tr.kind === 'thinking') && (
                <AgentTypingIndicator/>
              )}
            </div>
          </div>
          <div className="chat-panel__hitl">
            <div className="chat-panel__hitl-actions">
              {!canReinvestigate && !busy ? (
                <SimpleTooltip content={t.chat.reinvestigateTooltip} className="simple-tooltip--hitl">
                  <span tabIndex={0}>
                    <button type="button" disabled className="chat-footer-btn">
                      <IconRotateCcw size={14}/> {t.chat.reinvestigate}
                    </button>
                  </span>
                </SimpleTooltip>
              ) : canReinvestigate ? (
                <button
                  type="button"
                  onClick={runReinvestigate}
                  disabled={busy || postMortemGenerated}
                  className="chat-footer-btn"
                >
                  <IconRotateCcw size={14}/> {t.chat.reinvestigate}
                </button>
              ) : null}
              {!postMortemGenerated && (
              <button type="button" onClick={runPostmortem} disabled={busy || !rcaHasBeenGenerated} className="chat-footer-btn">
                <IconFileText size={14}/> {t.chat.postMortem}
              </button>
              )}
            </div>
            <div className="chat-panel__hitl-input">
              <ChatAgentInput
                t={t}
                value={aiInput}
                onChange={setAiInput}
                onSend={sendMessage}
                disabled={busy || postMortemGenerated}
              />
            </div>
          </div>
        </>
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
          <div style={{ display:'flex', flexDirection:'column', minHeight:0, flex:1, background:'var(--background)' }}>
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
      <div className="modal-split__left" style={{ flex: `0 0 ${panelSplitWidth(100 - rightPct)}` }}>
        {leftPanel}
      </div>
      <div
        className={'panel-resize-handle' + (handleActive ? ' is-active' : '')}
        onMouseDown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        tabIndex={0}
      >
        <span className="panel-resize-handle__grip" aria-hidden="true">
          <IconGripVertical size={10}/>
        </span>
      </div>
      <div className="modal-split__right" style={{ flex: `0 0 ${panelSplitWidth(rightPct)}` }}>
        {rightPanel}
      </div>
    </div>
  );

  const modalNode = isMaximized ? (
    <div className="modal-fullscreen">
      {shell}
    </div>
  ) : (
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

  // Apolo DialogPortal — render outside #root so z-50 stacks above layout-header (z-50)
  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(modalNode, document.body);
  }
  return modalNode;
}

function CaseManagementHeader({ event, hasCase, t, assignOpen, setAssignOpen, onAssign, onCloseCase }) {
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const list = currentAssignees(event);
  const caseNum = caseNumberFromEvent(event);
  const cannotUnassignLast = hasCase && list.length <= 1;
  const isCaseClosed = event?.caseStatus === 'closed' || event?.case_status === 'CLOSED';

  const unassignOne = (initials) => {
    if (cannotUnassignLast) return;
    const u = list.find(a => a.initials === initials);
    if (u && onAssign) onAssign({ toggle: u });
  };

  return (
    <div className="case-mgmt">
      <div className="case-mgmt__top">
        <div className="case-mgmt__title">
          <div className="case-mgmt__title-icon" aria-hidden="true">
            <IconBriefcase size={14}/>
          </div>
          <span className="case-mgmt__title-text">
            {hasCase && caseNum != null ? `${t.cases.title} #${caseNum}` : t.cases.title}
          </span>
        </div>
        {hasCase ? (
          <div className="case-mgmt__status-col">
            <CaseStatusBadge status={event.caseStatus} caseStatus={event.case_status}/>
            {!isCaseClosed && (
            <div style={{ position:'relative' }}>
              <button
                type="button"
                className="case-actions-btn"
                onClick={() => setActionsOpen(o => !o)}
                aria-expanded={actionsOpen}
              >
                <IconChevronDown size={12}/> {t.cases.actions}
              </button>
              {actionsOpen && (
                <>
                  <div onClick={() => setActionsOpen(false)} style={{ position:'fixed', inset:0, zIndex:1 }}/>
                  <div className="dropdown-menu" role="menu">
                    <button
                      type="button"
                      className="dropdown-menu__item"
                      role="menuitem"
                      onClick={() => {
                        setActionsOpen(false);
                        onCloseCase?.();
                      }}
                    >
                      <span className="dropdown-menu__item-icon" aria-hidden="true">
                        <IconCheckCircle2 size={14}/>
                      </span>
                      <span className="dropdown-menu__item-label">{t.cases.closeCase}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            )}
          </div>
        ) : (
          <span className="case-mgmt__unassigned">{t.cases.noCaseOpened}</span>
        )}
      </div>

      <div className="case-mgmt__assignees">
        <span className="case-mgmt__users-icon" aria-hidden="true">
          <IconUsers size={12}/>
        </span>
        <div className="case-mgmt__assignee-list">
          {list.length > 0 ? (
            list.map(a => {
              const displayName = a.name || a.initials;
              const initials = String(a.initials || displayName).slice(0, 2).toUpperCase();
              return (
                <div key={a.initials} className="assignee-chip">
                  <span className="assignee-chip__avatar">{initials}</span>
                  <span className="assignee-chip__name">{displayName}</span>
                  {onAssign && hasCase && !cannotUnassignLast && (
                    <button
                      type="button"
                      className="assignee-chip__remove"
                      onClick={() => unassignOne(a.initials)}
                      aria-label={displayName}
                    >
                      <IconClose size={12}/>
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <span className="case-mgmt__unassigned">{t.cases.noOneAssigned}</span>
          )}
        </div>
        {onAssign && (
          <div style={{ position:'relative' }}>
            <button
              type="button"
              className="assign-to-btn"
              onClick={() => setAssignOpen(o => !o)}
              aria-expanded={assignOpen}
            >
              <IconPlus size={12}/> {t.alerts.assignTo}
            </button>
            {assignOpen && (
              <>
                <div onClick={() => setAssignOpen(false)} style={{ position:'fixed', inset:0, zIndex:1 }}/>
                <div className="case-assign-popover">
                  <AssigneePickerBody
                    assigned={list}
                    hasCase={hasCase}
                    onToggle={u => onAssign({ toggle: u })}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SimpleTooltip({ content, children, className = '', maxWidth = 250 }) {
  const tipId = React.useId();
  const triggerRef = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  const updatePosition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const show = () => {
    updatePosition();
    setVisible(true);
  };
  const hide = () => setVisible(false);

  React.useEffect(() => {
    if (!visible) return undefined;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [visible, updatePosition]);

  const portal = visible && typeof document !== 'undefined'
    ? ReactDOM.createPortal(
      <span
        id={tipId}
        role="tooltip"
        className={'simple-tooltip__portal' + (className ? ' ' + className : '')}
        style={{ top: coords.top, left: coords.left, maxWidth }}
      >
        {content}
      </span>,
      document.body,
    )
    : null;

  return (
    <>
      <span
        ref={triggerRef}
        className="simple-tooltip__trigger-wrap"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={visible ? tipId : undefined}
      >
        {children}
      </span>
      {portal}
    </>
  );
}

function ChatPanelHeader({
  t,
  feedbackValue,
  onFeedback,
  feedbackEnabled,
  shareOpen,
  setShareOpen,
  copied,
  onCopyChat,
  alertSupportUrl,
}) {
  const [shouldFeedbackGlow, setShouldFeedbackGlow] = React.useState(false);

  const hasFeedback = feedbackValue === 'ACCEPTED'
    || feedbackValue === 'REJECTED'
    || feedbackValue === 'PENDING_REVIEW';

  React.useEffect(() => {
    if (feedbackEnabled && !hasFeedback) {
      setShouldFeedbackGlow(true);
      const timer = setTimeout(() => setShouldFeedbackGlow(false), 2000);
      return () => clearTimeout(timer);
    }
    if (hasFeedback) setShouldFeedbackGlow(false);
    return undefined;
  }, [feedbackEnabled, hasFeedback]);

  const helpfulTip = feedbackEnabled ? t.chat.helpful : t.chat.feedbackDisabled;
  const notHelpfulTip = feedbackEnabled ? t.chat.notHelpful : t.chat.feedbackDisabled;

  const helpfulClass = [
    'chat-feedback-btn',
    'chat-feedback-btn--up',
    !feedbackEnabled && 'is-disabled',
    shouldFeedbackGlow && feedbackEnabled && 'is-glow',
    feedbackValue === 'ACCEPTED' && 'is-active',
  ].filter(Boolean).join(' ');

  const notHelpfulClass = [
    'chat-feedback-btn',
    'chat-feedback-btn--down',
    !feedbackEnabled && 'is-disabled',
    shouldFeedbackGlow && feedbackEnabled && 'is-glow',
    feedbackValue === 'REJECTED' && 'is-active',
  ].filter(Boolean).join(' ');

  return (
    <div className="chat-panel-header">
      <div className="chat-panel-header__icon">
        <IconBrainCircuit size={16}/>
        <span className="chat-panel-header__dot"/>
      </div>
      <div className="chat-panel-header__title">
        <h3>{t.chat.aiAssistant}</h3>
        {t.chat.aiAssistantDescription ? (
          <p className="chat-panel-header__desc">{t.chat.aiAssistantDescription}</p>
        ) : null}
      </div>
      <div className="chat-panel-header__actions">
        {alertSupportUrl ? (
          <a
            href={alertSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-support-link"
            title={t.support.openAlertTicket}
            aria-label={t.support.openAlertTicket}
          >
            <IconLifeBuoy size={14}/>
            <span className="chat-support-link__label">{t.support.openAlertTicket}</span>
          </a>
        ) : null}
        <SimpleTooltip content={helpfulTip} className="simple-tooltip--feedback">
          <button
            type="button"
            className={helpfulClass}
            aria-label={t.chat.helpful}
            disabled={!feedbackEnabled}
            onClick={() => onFeedback('ACCEPTED')}
          >
            <IconThumbsUp size={14}/>
          </button>
        </SimpleTooltip>
        <SimpleTooltip content={notHelpfulTip} className="simple-tooltip--feedback">
          <button
            type="button"
            className={notHelpfulClass}
            aria-label={t.chat.notHelpful}
            disabled={!feedbackEnabled}
            onClick={() => onFeedback('REJECTED')}
          >
            <IconThumbsDown size={14}/>
          </button>
        </SimpleTooltip>
        <div className="chat-share-wrap">
          <button
            type="button"
            className="chat-share-btn"
            onClick={() => setShareOpen(o => !o)}
            aria-label={t.rca.share}
            aria-expanded={shareOpen}
          >
            <IconShare size={14}/>
            <span className="chat-share-btn__label">{t.rca.share}</span>
          </button>
          {shareOpen && (
            <>
              <div className="chat-share-backdrop" onClick={() => setShareOpen(false)} aria-hidden="true"/>
              <div className="chat-share-menu" role="menu">
                <p className="chat-share-menu__label">{t.rca.share}</p>
                <button
                  type="button"
                  className={'chat-share-menu__item' + (copied ? ' is-copied' : '')}
                  role="menuitem"
                  onClick={onCopyChat}
                >
                  <span className="chat-share-menu__item-icon" aria-hidden="true">
                    {copied ? <IconCheck size={16}/> : <IconCopy size={16}/>}
                  </span>
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

function EmptyCaseState({ t, isUserAssigned, isCreating, onCreateCase }) {
  return (
    <div className="empty-case-state">
      <div className={'empty-case-state__icon ' + (isUserAssigned ? 'is-assigned' : 'is-unassigned')}>
        {isUserAssigned ? <IconBrainCircuit size={32}/> : <IconUserX size={32}/>}
      </div>
      <div className="empty-case-state__title">
        {isUserAssigned ? t.cases.noCaseOpened : t.alertDetail.notAssigned}
      </div>
      <p className="empty-case-state__desc">
        {isUserAssigned ? t.alerts.createCaseDescription : t.alertDetail.notAssignedDescription}
      </p>
      {isUserAssigned && (
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={isCreating}
          onClick={() => onCreateCase && onCreateCase()}
        >
          <IconBrainCircuit size={14}/>
          {isCreating ? t.common.loading : t.investigate.startInvestigation}
        </button>
      )}
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
      <div className="card overview-card">
        <div className="overview-card__head">
          <div className="overview-card__head-icon" aria-hidden="true">
            <IconClock size={14}/>
          </div>
          <h3 className="overview-card__head-title">{t.alerts.description}</h3>
        </div>
        <div className="overview-card__body">
          <div>
            <p className="overview-label">{t.alertDetail.summary}</p>
            <p className="overview-body">{event.detail}</p>
          </div>
          <hr className="overview-divider"/>
          <div>
            <p className="overview-label">{t.alertDetail.details}</p>
            <p className="overview-body">{event.detail}</p>
          </div>
          <hr className="overview-divider"/>
          <div>
            <p className="overview-label overview-label--labels">{t.alerts.labels}</p>
            <div className="overview-labels">
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

function ChatAgentInput({ t, value, onChange, onSend, disabled }) {
  const textareaRef = React.useRef(null);
  const [editorHeight, setEditorHeight] = React.useState(CHAT_TEXTAREA_MIN_HEIGHT);

  const autoResizeTextarea = React.useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const contentHeight = Math.max(ta.scrollHeight, CHAT_TEXTAREA_MIN_HEIGHT);
    ta.style.height = `${contentHeight}px`;
    setEditorHeight(Math.min(contentHeight, CHAT_TEXTAREA_MAX_HEIGHT));
  }, []);

  React.useLayoutEffect(() => {
    autoResizeTextarea();
  }, [value, autoResizeTextarea]);

  const canSend = value.trim().length > 0 && !disabled;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className={'chat-input-composer' + (disabled ? ' is-disabled' : '')}>
      <div className="chat-input-composer__field-wrap" style={{ height: editorHeight }}>
        <textarea
          ref={textareaRef}
          className="chat-input-composer__textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.chat.askPlaceholder}
          rows={1}
          disabled={disabled}
          aria-label={t.chat.askPlaceholder}
        />
      </div>
      <button
        type="button"
        className="chat-input-composer__send"
        onClick={onSend}
        disabled={!canSend}
        aria-label={t.chat.sendMessage}
      >
        <IconSend size={14}/>
      </button>
    </div>
  );
}

function CommentsSection({ t, comments, comment, setComment, submitComment }) {
  const textareaRef = React.useRef(null);
  const [editorHeight, setEditorHeight] = React.useState(COMMENT_TEXTAREA_MIN_HEIGHT);

  const autoResizeTextarea = React.useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const contentHeight = Math.max(ta.scrollHeight, COMMENT_TEXTAREA_MIN_HEIGHT);
    ta.style.height = `${contentHeight}px`;
    setEditorHeight(Math.min(contentHeight, COMMENT_TEXTAREA_MAX_HEIGHT));
  }, []);

  React.useLayoutEffect(() => {
    autoResizeTextarea();
  }, [comment, autoResizeTextarea]);

  const isOverCommentLimit = comment.length > COMMENT_MAX_LENGTH;
  const canSendComment = comment.trim().length > 0 && !isOverCommentLimit;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSendComment) submitComment();
    }
  };

  return (
    <div className="case-comments">
      <div className="case-comments__header">
        <div className="case-comments__icon">
          <IconPenLine size={14}/>
        </div>
        <h3 className="case-comments__title">{t.cases.caseComments}</h3>
        <span className="case-comments__count">
          {comments.length} {comments.length === 1 ? t.cases.comment : t.cases.comments}
        </span>
      </div>
      <div className="case-comments__content">
        {comments.length > 0 && (
          <div className="case-comments__list">
            {comments.map((c) => (
              <article key={c.id} className="case-comment">
                <div className="case-comment__avatar" aria-hidden="true">
                  {c.initials}
                </div>
                <div className="case-comment__body">
                  <div className="case-comment__meta">
                    <span className="case-comment__author">{c.author}</span>
                    <time className="case-comment__date" dateTime={c.at}>{c.at}</time>
                  </div>
                  <p className="case-comment__text">{c.text}</p>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="case-comments__composer">
          <div className="comment-composer">
            <div
              className="comment-composer__scroll"
              data-slot="scroll-area"
              style={{ height: editorHeight }}
            >
              <div className="comment-composer__scroll-viewport" data-slot="scroll-area-viewport">
                <textarea
                  ref={textareaRef}
                  className="comment-composer__textarea"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.cases.addComment}
                  rows={1}
                  aria-label={t.cases.addComment}
                />
              </div>
            </div>
            <button
              type="button"
              className="comment-composer__send"
              onClick={submitComment}
              disabled={!canSendComment}
              aria-label={t.cases.addComment}
            >
              <IconSend size={14}/>
            </button>
          </div>
          <p
            className={'comment-counter' + (isOverCommentLimit ? ' is-over-limit' : '')}
            aria-live="polite"
          >
            {comment.length}/{COMMENT_MAX_LENGTH}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActivityPane({ t }) {
  const acts = [
    { t:'17:00', who:'System', text: t.alertDetail.alertCreated },
    { t:'16:59', who:'SmartOps AI', text:'Root cause analysis generated · confidence 0.72'},
    { t:'16:59', who:'Prometheus', text:'Alert fired · /api/v1/payments 500 rate above 15%'},
  ];
  return (
    <div className="card overview-card">
      <div className="overview-card__head">
        <div className="overview-card__head-icon" aria-hidden="true">
          <IconMessageSquare size={14}/>
        </div>
        <h3 className="overview-card__head-title">{t.alertDetail.activity}</h3>
      </div>
      <div className="activity-timeline overview-card__body">
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
        <div className="json-payload-card__header-main">
          <div className="json-payload-card__icon"><IconDatabase size={14}/></div>
          <span className="json-payload-card__title">{t.alertDetail.jsonPayload}</span>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={handleCopy}>
          {copied ? <><IconCheck size={12}/> {t.common.copied}</> : <><IconCopy size={12}/> {t.common.copy}</>}
        </button>
      </div>
      <pre className="json-payload-card__body mono">{jsonString}</pre>
    </div>
  );
}

// ----- AI chat thread (mirrors chia ChatMessageBubble + ReasoningDisplay) -----

function normalizeReasoningSteps(steps) {
  if (!steps?.length) return [];
  return steps.map((s) => {
    if (s.label != null) return s;
    return {
      label: s.text || '',
      isCompleted: true,
      toolCalls: s.code ? [{
        toolName: 'run_code',
        command: String(s.code).replace(/^\$\s*/, '').split('\n')[0].trim(),
        output: String(s.code).includes('\n') ? String(s.code).split('\n').slice(1).join('\n').trim() : undefined,
        isCompleted: true,
      }] : [],
    };
  });
}

function ReasoningDisplay({ steps, isStreaming, t }) {
  const normalized = normalizeReasoningSteps(steps);
  const [isCollapsed, setIsCollapsed] = React.useState(() => !isStreaming);
  const [expandedKey, setExpandedKey] = React.useState(null);
  const wasStreamingRef = React.useRef(isStreaming);

  React.useEffect(() => {
    if (isStreaming) setIsCollapsed(false);
  }, [isStreaming]);

  React.useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) setIsCollapsed(true);
    wasStreamingRef.current = isStreaming;
  }, [isStreaming]);

  if (normalized.length === 0 && !isStreaming) return null;

  const completedCount = normalized.filter(s => s.isCompleted).length;
  const activeStep = isStreaming
    ? [...normalized].reverse().find(s => !s.isCompleted) ?? normalized[normalized.length - 1]
    : null;

  const activeToolCall = (() => {
    if (!isStreaming) return null;
    for (let i = normalized.length - 1; i >= 0; i--) {
      const tcs = normalized[i].toolCalls || [];
      if (!tcs.length) continue;
      const pending = [...tcs].reverse().find(tc => !tc.isCompleted);
      return pending || tcs[tcs.length - 1];
    }
    return null;
  })();

  return (
    <div className="reasoning-display">
      <button
        type="button"
        className={'reasoning-display__toggle' + (isStreaming ? ' is-streaming' : '')}
        onClick={() => setIsCollapsed(v => !v)}
      >
        <div className="reasoning-display__toggle-row">
          <IconChevron
            size={14}
            className={'reasoning-display__chevron' + (isCollapsed ? '' : ' is-open')}
          />
          <span className="reasoning-display__title">
            {isStreaming ? t.chat.reasoningActive : t.chat.reasoning}
          </span>
          {isStreaming ? (
            <span className="reasoning-display__streaming-dots" aria-hidden="true">
              <span/><span/><span/>
            </span>
          ) : (
            <span className="reasoning-display__count">
              {t.chat.reasoningStepCount.replace('{count}', String(completedCount))}
            </span>
          )}
        </div>
        {isStreaming && activeStep && (
          <div className="reasoning-display__preview">
            <span className="reasoning-display__preview-label">{activeStep.label}</span>
            {activeToolCall && (
              <span className="reasoning-display__preview-cmd">
                <strong>{activeToolCall.toolName}</strong> {activeToolCall.command}
              </span>
            )}
          </div>
        )}
      </button>

      {!isCollapsed && (
        <div className="reasoning-display__timeline">
          {normalized.map((step, stepIdx) => {
            const isLastStep = stepIdx === normalized.length - 1;
            const isActive = isLastStep && isStreaming && !step.isCompleted;
            return (
              <div key={stepIdx} className="reasoning-step">
                <div className={'reasoning-step__dot' + (isActive ? ' reasoning-step__dot--active' : step.isCompleted ? ' reasoning-step__dot--done' : ' reasoning-step__dot--pending')}>
                  {step.isCompleted && !isActive ? <IconCheck size={8}/> : isActive ? <span className="reasoning-step__dot--pending"/> : null}
                </div>
                <p className={'reasoning-step__label' + (isActive ? ' is-active' : '')}>{step.label}</p>
                {(step.toolCalls || []).length > 0 && (
                  <div className="reasoning-step__tools">
                    {(step.toolCalls || []).map((tc, tcIdx) => {
                      const key = `${stepIdx}-${tcIdx}`;
                      const isOutExpanded = expandedKey === key;
                      const command = (tc.command || '').replace(/\\n/g, '\n');
                      const commandPreview = command.split('\n')[0].trim();
                      const output = (tc.output || '').replace(/\\n/g, '\n');
                      const hasDetails = Boolean(command || output);
                      return (
                        <div key={tcIdx} className="reasoning-tool">
                          <button
                            type="button"
                            className="reasoning-tool__head"
                            disabled={!hasDetails}
                            aria-expanded={hasDetails ? isOutExpanded : undefined}
                            onClick={() => hasDetails && setExpandedKey(isOutExpanded ? null : key)}
                          >
                            {hasDetails ? (
                              <IconChevron size={10} className={'reasoning-display__chevron' + (isOutExpanded ? ' is-open' : '')}/>
                            ) : (
                              <IconTerminal size={10}/>
                            )}
                            <span className="reasoning-tool__prompt">&gt;</span>
                            <span className="reasoning-tool__badge">{tc.toolName}</span>
                            {commandPreview ? (
                              <span className="reasoning-tool__cmd-preview">{commandPreview}</span>
                            ) : null}
                          </button>
                          {hasDetails && isOutExpanded && (
                            <div className="reasoning-tool__body">
                              {command && (
                                <>
                                  <div className="reasoning-tool__section-head">
                                    <IconTerminal size={12}/> {t.chat.query}
                                  </div>
                                  <div className="reasoning-tool__query">
                                    {typeof renderTerminalQuery === 'function'
                                      ? renderTerminalQuery(command)
                                      : command}
                                  </div>
                                </>
                              )}
                              {output && (
                                <>
                                  <div className="reasoning-tool__section-head">
                                    <IconTerminal size={12}/> {t.chat.output}
                                  </div>
                                  <pre className="reasoning-tool__output">
                                    {typeof renderTerminalQuery === 'function'
                                      ? renderTerminalQuery(output)
                                      : output}
                                  </pre>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AgentMessageShell({ children }) {
  return (
    <div className="chat-msg so-turn">
      <div className="chat-msg__avatar" aria-hidden="true">
        <IconBrainCircuit size={14}/>
      </div>
      <div className="chat-msg__body">
        {children}
      </div>
    </div>
  );
}

function AgentTypingIndicator() {
  return (
    <div className="chat-msg so-turn">
      <div className="chat-msg__avatar" aria-hidden="true">
        <IconBrainCircuit size={14}/>
      </div>
      <div className="chat-msg__bubble chat-msg__bubble--agent">
        <div className="reasoning-display__streaming-dots" style={{ gap: '6px' }}>
          <span style={{ width: 6, height: 6 }}/><span style={{ width: 6, height: 6 }}/><span style={{ width: 6, height: 6 }}/>
        </div>
      </div>
    </div>
  );
}

/** User message bubble — mirrors chia ChatMessageBubble (role USER). */
function ChatUserMessage({ content }) {
  return (
    <div className="chat-msg chat-msg--user so-turn">
      <div className="chat-msg__avatar chat-msg__avatar--user" aria-hidden="true">
        <IconUser size={14}/>
      </div>
      <div className="chat-msg__body">
        <div className="chat-msg__bubble chat-msg__bubble--user">
          <p className="chat-msg__prose chat-prose">{content}</p>
        </div>
      </div>
    </div>
  );
}

function AnalysisContent({ turn, t }) {
  return <ChatMarkdownBubble turn={turn} t={t}/>;
}

function ThreadTurnCombined({ reasoning, analysis, t }) {
  return (
    <AgentMessageShell>
      <ReasoningDisplay steps={reasoning.steps} isStreaming={!!reasoning.isStreaming} t={t}/>
      <AnalysisContent turn={analysis} t={t}/>
    </AgentMessageShell>
  );
}

function ThreadTurnPostMortemCombined({ reasoning, postMortem, t }) {
  return (
    <AgentMessageShell>
      <ReasoningDisplay steps={reasoning.steps} isStreaming={!!reasoning.isStreaming} t={t}/>
      <ChatMarkdownBubble turn={postMortem} t={t}/>
    </AgentMessageShell>
  );
}

function ThreadTurn({ turn, t }) {
  if (turn.kind === 'reasoning') {
    return (
      <AgentMessageShell>
        <ReasoningDisplay steps={turn.steps} isStreaming={!!turn.isStreaming} t={t}/>
      </AgentMessageShell>
    );
  }

  if (turn.kind === 'analysis') {
    return (
      <AgentMessageShell>
        <AnalysisContent turn={turn} t={t}/>
      </AgentMessageShell>
    );
  }

  if (turn.kind === 'postmortem') {
    return (
      <AgentMessageShell>
        <ChatMarkdownBubble turn={turn} t={t}/>
      </AgentMessageShell>
    );
  }

  if (turn.kind === 'user') {
    return <ChatUserMessage content={turn.text}/>;
  }

  if (turn.kind === 'assistant') {
    return (
      <AgentMessageShell>
        <div className="chat-msg__bubble chat-msg__bubble--agent">
          <p className="chat-msg__prose chat-prose">{turn.text}</p>
        </div>
      </AgentMessageShell>
    );
  }

  if (turn.kind === 'thinking') {
    return <AgentTypingIndicator/>;
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
      <span className="assignee-stack__label">
        {list.length === 1 ? list[0].name : `${list.length} assignees`}
      </span>
    </div>
  );
}
