// Datadope SmartOps — badge class maps aligned with Apolo.

// Chia alerts-table-row: CRITICAL → destructive solid; WARNING → purple solid;
// all other severities → primary solid (default Badge variant).
const SEVERITY_BADGE_CLASS = {
  CRITICAL: 'badge badge--destructive',
  WARNING:  'badge badge--purple-solid',
  HIGH:     'badge badge--primary-solid',
  MEDIUM:   'badge badge--primary-solid',
  LOW:      'badge badge--primary-solid',
  INFO:     'badge badge--primary-solid',
  OK:       'badge badge--primary-solid',
};

const ALERT_STATUS_BADGE_CLASS = {
  OPEN:     'badge badge--outline badge--dd-pink',
  ACK:      'badge badge--outline badge--dd-purple',
  CLOSED:   'badge badge--outline badge--dd-teal',
  FLAPPING: 'badge badge--outline badge--dd-teal',
};

const CASE_STATUS_BADGE_CLASS = {
  AWAITING_ACTION: 'badge badge--outline badge--dd-blue',
  PROCESSING:      'badge badge--outline badge--dd-purple',
  CLOSED:          'badge badge--muted',
};

const AGENT_STATUS_BADGE_CLASS = {
  PENDING:        'badge badge--outline badge--muted',
  PROCESSING:     'badge badge--outline badge--dd-blue',
  WAITING_ACTION: 'badge badge--outline badge--warning-tint',
  COMPLETED:      'badge badge--outline badge--dd-teal',
  FAILED:         'badge badge--destructive-outline',
  TIMEOUT:        'badge badge--outline badge--warning-tint',
};

const AGENT_STATUS_LEGACY = {
  READING: 'PROCESSING',
  ANALYZING: 'PROCESSING',
  RESOLVED: 'COMPLETED',
};

const LEGACY_SEV_TO_UPPER = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
  info: 'INFO',
  ok: 'OK',
  warning: 'WARNING',
};

const LEGACY_STATUS_TO_ALERT = {
  open: 'OPEN',
  acknowledged: 'ACK',
  closed: 'CLOSED',
  flapping: 'FLAPPING',
};

const LEGACY_CASE_TO_API = {
  awaiting: 'AWAITING_ACTION',
  processing: 'PROCESSING',
  closed: 'CLOSED',
};

const KPI_COLORS = {
  total:    'var(--datadope-blue)',
  open:     'var(--datadope-pink)',
  cases:    'var(--datadope-purple)',
  resolved: 'var(--datadope-teal)',
};

function resolveSeverityKey(severity, sev) {
  if (severity) return String(severity).toUpperCase();
  return LEGACY_SEV_TO_UPPER[sev] || 'INFO';
}

function resolveAlertStatusKey(alertStatus, status) {
  if (alertStatus) return String(alertStatus).toUpperCase();
  return LEGACY_STATUS_TO_ALERT[status] || 'OPEN';
}

function resolveCaseStatusKey(caseStatus, status) {
  if (caseStatus) return String(caseStatus).toUpperCase();
  if (status) return LEGACY_CASE_TO_API[status] || null;
  return null;
}

function resolveAgentStatusKey(agentStatus) {
  if (!agentStatus) return null;
  const upper = String(agentStatus).toUpperCase();
  return AGENT_STATUS_LEGACY[upper] || upper;
}

function severityBadgeClass(severity, sev) {
  const key = resolveSeverityKey(severity, sev);
  return SEVERITY_BADGE_CLASS[key] || SEVERITY_BADGE_CLASS.INFO;
}

function alertStatusBadgeClass(alertStatus, status) {
  const key = resolveAlertStatusKey(alertStatus, status);
  return ALERT_STATUS_BADGE_CLASS[key] || ALERT_STATUS_BADGE_CLASS.OPEN;
}

function caseStatusBadgeClass(caseStatus, status) {
  const key = resolveCaseStatusKey(caseStatus, status);
  if (!key) return null;
  return CASE_STATUS_BADGE_CLASS[key] || 'badge badge--muted';
}

function agentStatusBadgeClass(agentStatus) {
  const key = resolveAgentStatusKey(agentStatus);
  if (!key) return null;
  return AGENT_STATUS_BADGE_CLASS[key] || 'badge badge--muted';
}

// Legacy exports kept for any remaining references
const SEV_META = Object.fromEntries(
  Object.entries(LEGACY_SEV_TO_UPPER).map(([k, v]) => [k, { label: v }])
);
const STATUS_META = {
  open: { label: 'Open', hue: 358 },
  closed: { label: 'Closed', hue: 180 },
  flapping: { label: 'Flapping', hue: 323 },
  acknowledged: { label: 'Acknowledged', hue: 323 },
};
const CASE_META = {
  awaiting: { label: 'Awaiting Action', hue: 237 },
  processing: { label: 'Processing', hue: 323 },
};

function parseFlexibleDate(timestamp) {
  if (!timestamp) return null;
  if (String(timestamp).includes('/')) {
    const [date, time] = String(timestamp).split(', ');
    const [d, m, y] = date.split('/').map(Number);
    const [hh, mm] = (time || '0:0').split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm);
  }
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
}

function formatTimestamp(timestamp) {
  const date = parseFlexibleDate(timestamp);
  if (!date) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
}

function formatDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return '';
  const start = parseFlexibleDate(startedAt);
  const end = parseFlexibleDate(finishedAt);
  if (!start || !end) return '';
  const durationMs = end.getTime() - start.getTime();
  if (durationMs < 0) return '';
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

function modalSeverityBadgeClass(severity, sev) {
  const key = resolveSeverityKey(severity, sev);
  if (key === 'CRITICAL') return 'modal-sev-badge modal-sev-badge--critical';
  if (key === 'WARNING') return 'modal-sev-badge modal-sev-badge--warning';
  return 'modal-sev-badge modal-sev-badge--info';
}

Object.assign(window, {
  SEVERITY_BADGE_CLASS, ALERT_STATUS_BADGE_CLASS, CASE_STATUS_BADGE_CLASS,
  AGENT_STATUS_BADGE_CLASS, AGENT_STATUS_LEGACY, KPI_COLORS,
  resolveSeverityKey, resolveAlertStatusKey, resolveCaseStatusKey, resolveAgentStatusKey,
  severityBadgeClass, alertStatusBadgeClass, caseStatusBadgeClass, agentStatusBadgeClass,
  parseFlexibleDate, formatTimestamp, formatDuration, modalSeverityBadgeClass,
  SEV_META, STATUS_META, CASE_META,
});
