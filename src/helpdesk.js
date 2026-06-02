// Helpdesk ticket URLs — aligned with Chia useHelpdeskUrl + buildHelpdeskUrl.

function buildHelpdeskUrl(baseUrl, user, context) {
  if (!baseUrl) return '';
  const params = new URLSearchParams();
  if (user?.full_name) params.set('x_studio_user', user.full_name);
  if (user?.email) params.set('x_studio_email', user.email);
  if (context?.environment) params.set('x_studio_entorno', context.environment);
  if (context?.caseId != null) params.set('x_studio_case_id', String(context.caseId));
  if (context?.title) params.set('name', context.title);
  if (context?.description) params.set('description', context.description);
  if (context?.url) params.set('x_studio_case_url', context.url);
  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

function caseIdFromEvent(event) {
  if (!event) return null;
  if (event.case_id != null) return event.case_id;
  if (event.case && event.case !== '—') return String(event.case).replace('#', '');
  return null;
}

function helpdeskUserFromSession(currentUser) {
  if (!currentUser) return null;
  return {
    email: currentUser.email,
    full_name: currentUser.name || currentUser.full_name,
  };
}

function rcaFromTurns(turns) {
  const analysis = [...(turns || [])].reverse().find(t => t.kind === 'analysis' && t.rca);
  if (!analysis?.rca) return { rootCause: '', solution: '' };
  const rootCause = typeof analysis.rca.title === 'string' ? analysis.rca.title.trim() : '';
  const solutionSteps = Array.isArray(analysis.solution)
    ? analysis.solution.map(s => (typeof s === 'string' ? s : '')).filter(Boolean)
    : [];
  return {
    rootCause,
    solution: solutionSteps.length ? solutionSteps.join('\n') : '',
  };
}

function buildAlertHelpdeskUrl({ baseUrl, event, alertId, currentUser, turns }) {
  if (!baseUrl || !event) return '';

  const caseId = caseIdFromEvent(event);
  const alertName = event.alert_name || event.title;
  const severity = event.severity || (event.sev && String(event.sev).toUpperCase());
  const component = (event.component || event.service || '').trim();
  const host = (event.source_host || '').trim();

  const titleParts = [];
  if (severity) titleParts.push(`[${severity}]`);
  if (alertName) titleParts.push(alertName);
  if (caseId != null) titleParts.push(`- Case #${caseId}`);

  const bodyLines = [];
  if (alertName) bodyLines.push(`Alert: ${alertName}`);
  if (severity) bodyLines.push(`Severity: ${severity}`);
  if (component) bodyLines.push(`Component: ${component}`);
  if (host) bodyLines.push(`Host: ${host}`);

  const { rootCause, solution } = rcaFromTurns(turns);
  if (rootCause) {
    bodyLines.push('', '--- Root Cause ---', rootCause);
  }
  if (solution) {
    bodyLines.push('', '--- Proposed Solution ---', solution);
  }

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const caseUrl = caseId != null && alertId != null && appOrigin
    ? `${appOrigin}/#/events/${alertId}`
    : undefined;

  return buildHelpdeskUrl(baseUrl, helpdeskUserFromSession(currentUser), {
    environment: appOrigin || undefined,
    caseId: caseId ?? undefined,
    title: titleParts.length > 0 ? titleParts.join(' ') : undefined,
    description: bodyLines.length > 0
      ? bodyLines.map((line, i) => (i === 0 || line === '' ? line : `    ${line}`)).join('\n')
      : undefined,
    url: caseUrl,
  });
}

function getSmartopsConfig() {
  const cfg = typeof window !== 'undefined' ? window.SMARTOPS_CONFIG : null;
  return Promise.resolve({
    helpdeskTicketUrl: (cfg && cfg.helpdeskTicketUrl) || '',
  });
}

function useAlertHelpdeskUrl(event, alertId, currentUser, turns) {
  const [baseUrl, setBaseUrl] = React.useState('');
  React.useEffect(() => {
    getSmartopsConfig()
      .then(c => setBaseUrl(c.helpdeskTicketUrl || ''))
      .catch(() => setBaseUrl(''));
  }, []);
  return React.useMemo(
    () => buildAlertHelpdeskUrl({ baseUrl, event, alertId, currentUser, turns }),
    [baseUrl, event, alertId, currentUser, turns],
  );
}

if (typeof window !== 'undefined' && !window.SMARTOPS_CONFIG) {
  window.SMARTOPS_CONFIG = { helpdeskTicketUrl: '' };
}

Object.assign(window, {
  buildHelpdeskUrl,
  buildAlertHelpdeskUrl,
  getSmartopsConfig,
  useAlertHelpdeskUrl,
});
