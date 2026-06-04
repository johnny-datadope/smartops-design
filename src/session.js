// Session helpers — maps mock login to USERS_SEED identity (Apolo-aligned).

function getSessionUser(currentUser) {
  const seed = window.USERS_SEED || [];
  const isAdmin = currentUser?.role === 'Admin';
  const match = isAdmin ? seed[0] : seed[1];
  if (match) {
    return {
      id: match.id,
      username: match.username,
      full_name: match.full_name,
      initials: match.initials || getInitialsFromName(match.full_name || match.username),
      email: match.email,
      role: match.role,
    };
  }
  return {
    id: isAdmin ? 1 : 2,
    full_name: isAdmin ? 'Daniel Dorado' : 'Francisca Molina',
    initials: isAdmin ? 'DD' : 'FM',
    email: isAdmin ? 'daniel.dorado@datadope.io' : 'francisca.molina@datadope.io',
    role: isAdmin ? 'admin' : 'operator',
  };
}

function getInitialsFromName(name) {
  const parts = String(name || '').split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isCurrentUserAssigned(event, sessionUser) {
  if (!event || !sessionUser) return false;
  const uid = sessionUser.id;
  const initials = sessionUser.initials;
  if (Array.isArray(event.assignments) && event.assignments.length > 0) {
    return event.assignments.some((a) =>
      (uid != null && a.user_id === uid)
      || (initials && a.initials === initials),
    );
  }
  if (Array.isArray(event.assignees) && event.assignees.length > 0) {
    return event.assignees.some((a) => a.initials === initials);
  }
  return false;
}

function nextMockCaseId() {
  const events = window.EVENTS || [];
  let max = 0;
  events.forEach((e) => {
    if (e.case_id != null && Number.isFinite(Number(e.case_id))) {
      max = Math.max(max, Number(e.case_id));
    }
  });
  return max + 1;
}

function eventHasCaseForStages(event) {
  return event && event.case && event.case !== '—';
}

function initInvestigationStages() {
  const now = new Date().toISOString();
  // Apolo (case_investigation.py): closed_started = case.created_at
  return {
    current_stage: 'triage',
    triage: { started_at: now, finished_at: null },
    post_mortem: null,
    closed: { started_at: now, finished_at: null },
  };
}

function ensureClosedStageStarted(stages, fallbackStart) {
  if (!stages) return stages;
  const start = stages.closed?.started_at || stages.triage?.started_at || fallbackStart;
  if (!start) return stages;
  return {
    ...stages,
    closed: {
      started_at: start,
      finished_at: stages.closed?.finished_at ?? null,
    },
  };
}

function completeTriageStage(stages) {
  const now = new Date().toISOString();
  const triage = stages?.triage || {};
  const closedStart = stages?.closed?.started_at || triage.started_at || now;
  return ensureClosedStageStarted({
    current_stage: 'post_mortem',
    triage: {
      started_at: triage.started_at || now,
      finished_at: now,
    },
    post_mortem: stages?.post_mortem ?? null,
    closed: { started_at: closedStart, finished_at: stages?.closed?.finished_at ?? null },
  });
}

function startPostMortemStage(stages) {
  const now = new Date().toISOString();
  let s = stages ? {
    ...stages,
    triage: stages.triage ? { ...stages.triage } : null,
    post_mortem: stages.post_mortem ? { ...stages.post_mortem } : null,
    closed: stages.closed ? { ...stages.closed } : null,
  } : initInvestigationStages();
  if (!s.triage?.finished_at) {
    s = completeTriageStage(s);
  }
  const closedStart = s.closed?.started_at || s.triage?.started_at || now;
  return ensureClosedStageStarted({
    ...s,
    current_stage: 'post_mortem',
    post_mortem: { started_at: now, finished_at: null },
    closed: { started_at: closedStart, finished_at: s.closed?.finished_at ?? null },
  });
}

/** Apolo: POST_MORTEM COMPLETED → current_stage closed, post_mortem + closed finished_at set */
function completePostMortemStage(stages) {
  const now = new Date().toISOString();
  const s = stages || initInvestigationStages();
  const pmStart = s.post_mortem?.started_at || now;
  const closedStart = s.closed?.started_at || s.triage?.started_at || pmStart;
  return {
    ...s,
    current_stage: 'closed',
    post_mortem: { started_at: pmStart, finished_at: now },
    closed: { started_at: closedStart, finished_at: now },
  };
}

/** Ceres: auto-close case when POST_MORTEM completes successfully */
function mockAutoCloseCaseAfterPostMortem(event) {
  if (!event) return event;
  event.case_status = 'CLOSED';
  event.caseStatus = 'closed';
  event.agent_status = 'COMPLETED';
  event.investigation_stages = completePostMortemStage(
    event.investigation_stages
      || (typeof seedInvestigationStages === 'function' ? seedInvestigationStages(event) : initInvestigationStages()),
  );
  return event;
}

function closeCaseInvestigationStages(stages) {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  let s = stages?.triage ? { ...stages, triage: { ...stages.triage } } : initInvestigationStages();
  if (!s.triage.finished_at) {
    s = completeTriageStage(s);
  }
  const triageEndMs = new Date(s.triage.finished_at).getTime();
  let post = s.post_mortem;
  if (!post?.finished_at) {
    const postStart = triageEndMs + 1000;
    const postEnd = postStart + 60000;
    post = { started_at: iso(postStart), finished_at: iso(postEnd) };
  }
  const closedStart = s.closed?.started_at || s.triage?.started_at || iso(now);
  return {
    current_stage: 'closed',
    triage: s.triage,
    post_mortem: post,
    closed: { started_at: closedStart, finished_at: iso(now) },
  };
}

function seedInvestigationStages(event) {
  const parse = typeof parseFlexibleDate === 'function' ? parseFlexibleDate : () => null;
  const base = parse(event.at) || new Date();
  const iso = (d) => d.toISOString();
  const triageStart = new Date(base.getTime() + 60000);
  const triageEnd = new Date(triageStart.getTime() + 21000);
  const isCaseClosed = event.case_status === 'CLOSED' || event.caseStatus === 'closed';

  if (isCaseClosed) {
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

  if (event._streamComplete || event.mock_scenario) {
    return ensureClosedStageStarted({
      current_stage: 'post_mortem',
      triage: { started_at: iso(triageStart), finished_at: iso(triageEnd) },
      post_mortem: null,
      closed: { started_at: iso(triageStart), finished_at: null },
    });
  }

  return initInvestigationStages();
}

function resolveInvestigationStages(event) {
  if (!eventHasCaseForStages(event)) {
    return { current_stage: 'triage', triage: null, post_mortem: null, closed: null };
  }
  const parse = typeof parseFlexibleDate === 'function' ? parseFlexibleDate : () => null;
  const fallbackStart = (parse(event.at) || new Date()).toISOString();
  if (event.investigation_stages) {
    return ensureClosedStageStarted(event.investigation_stages, fallbackStart);
  }
  return seedInvestigationStages(event);
}

function shouldShowInvestigationStages(event) {
  if (!eventHasCaseForStages(event)) return false;
  return !!(event.investigation_stages
    || event.investigation_started
    || event._streamComplete
    || event.mock_scenario);
}

function mockCloseCase(event) {
  if (!event) return event;
  event.case_status = 'CLOSED';
  event.caseStatus = 'closed';
  event.agent_status = 'COMPLETED';
  event.investigation_stages = closeCaseInvestigationStages(
    event.investigation_stages || seedInvestigationStages(event),
  );
  return event;
}

function mockCreateCase(event, sessionUser) {
  if (!event) return event;
  const caseId = nextMockCaseId();
  event.case_id = caseId;
  event.case = `#${caseId}`;
  event.case_status = 'PROCESSING';
  event.caseStatus = 'processing';
  event.agent_status = 'PROCESSING';
  event.investigation_started = true;
  event._streamComplete = false;
  event.investigation_stages = initInvestigationStages();
  delete event.mock_turns;

  if (sessionUser && !isCurrentUserAssigned(event, sessionUser)) {
    const entry = {
      user_id: sessionUser.id,
      initials: sessionUser.initials,
      full_name: sessionUser.full_name,
    };
    event.assignments = [...(event.assignments || []), entry];
    event.assignees = [...(event.assignees || []), { initials: entry.initials, name: entry.full_name }];
    event.assignee = event.assignees[0]?.initials || null;
    event.assigneeName = event.assignees[0]?.name || null;
  }

  return event;
}

Object.assign(window, {
  getSessionUser,
  isCurrentUserAssigned,
  nextMockCaseId,
  mockCreateCase,
  mockCloseCase,
  initInvestigationStages,
  completeTriageStage,
  startPostMortemStage,
  completePostMortemStage,
  mockAutoCloseCaseAfterPostMortem,
  closeCaseInvestigationStages,
  resolveInvestigationStages,
  shouldShowInvestigationStages,
  eventHasCaseForStages,
});
