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
  delete event.mock_turns;
  delete event.mock_stages;

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
});
