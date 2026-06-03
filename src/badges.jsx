// Apolo-aligned badge components (rounded-md, Datadope tints).

function Badge({ className, children }) {
  return <span className={className || 'badge'}>{children}</span>;
}

function IconClock({ spin }) {
  return (
    <svg className={'badge-icon' + (spin ? ' badge-icon--spin' : '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  );
}

function IconCheckSmall() {
  return (
    <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}

function IconXSmall() {
  return (
    <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
    </svg>
  );
}

function IconMessageSmall() {
  return (
    <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function agentStatusIcon(status) {
  const key = resolveAgentStatusKey(status);
  if (key === 'PROCESSING') return <IconClock spin />;
  if (key === 'COMPLETED') return <IconCheckSmall />;
  if (key === 'FAILED' || key === 'TIMEOUT') return <IconXSmall />;
  if (key === 'WAITING_ACTION') return <IconMessageSmall />;
  if (key === 'PENDING') return <IconClock />;
  return null;
}

function SeverityBadge({ severity, sev }) {
  const { t } = useI18n();
  const key = resolveSeverityKey(severity, sev);
  const label = (t.alertSeverity && t.alertSeverity[key]) || key;
  return <Badge className={severityBadgeClass(severity, sev)}>{label}</Badge>;
}

function AlertStatusBadge({ alertStatus, status }) {
  const { t } = useI18n();
  const key = resolveAlertStatusKey(alertStatus, status);
  const label = (t.alertStatus && t.alertStatus[key]) || key;
  return <Badge className={alertStatusBadgeClass(alertStatus, status)}>{label}</Badge>;
}

function CaseStatusBadge({ caseStatus, status }) {
  const { t } = useI18n();
  const key = resolveCaseStatusKey(caseStatus, status);
  if (!key) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>;
  const label = (t.caseStatus && t.caseStatus[key]) || key;
  return <Badge className={caseStatusBadgeClass(caseStatus, status)}>{label}</Badge>;
}

function AgentStatusBadge({ agentStatus, status }) {
  const { t } = useI18n();
  const key = resolveAgentStatusKey(agentStatus || status);
  if (!key) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>;
  const label = (t.agentStatus && t.agentStatus[key]) || key;
  return (
    <Badge className={agentStatusBadgeClass(key)}>
      {agentStatusIcon(key)}
      {label}
    </Badge>
  );
}

function TagBadge({ tagKey, value, extra }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {value != null && value !== '' && (
        <Badge className="badge badge--secondary">{tagKey}: {value}</Badge>
      )}
      {extra > 0 && (
        <Badge className="badge badge--secondary">+{extra} more</Badge>
      )}
    </div>
  );
}

// Legacy aliases
const SeverityPill = ({ sev, severity }) => <SeverityBadge sev={sev} severity={severity}/>;
const StatusPill = ({ status, alertStatus }) => <AlertStatusBadge status={status} alertStatus={alertStatus}/>;
const CaseStatus = ({ status, caseStatus }) => <CaseStatusBadge status={status} caseStatus={caseStatus}/>;
const AgentStatusPill = ({ status, agentStatus }) => <AgentStatusBadge status={status} agentStatus={agentStatus}/>;
const LabelChip = ({ text, extra }) => <TagBadge tagKey="team" value={text} extra={extra}/>;

Object.assign(window, {
  Badge, SeverityBadge, AlertStatusBadge, CaseStatusBadge, AgentStatusBadge, TagBadge,
  SeverityPill, StatusPill, CaseStatus, AgentStatusPill, LabelChip,
});
