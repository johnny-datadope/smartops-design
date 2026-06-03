// Seed data for the Alerts table (Apolo-aligned schema + legacy aliases for JSX).

/** Ceres t_input_alerts — one-line summary for lists and Overview → Summary. */
function alertSummaryText(row) {
  if (!row) return '';
  const summary = (row.summary || '').trim();
  if (summary) return summary;
  return (row.alert_description || row.detail || '').trim();
}

/** Ceres t_input_alerts — operational description for Overview → Details. */
function alertDetailsText(row) {
  if (!row) return '';
  const description = (row.alert_description || row.detail || '').trim();
  if (description) return description;
  return (row.additional_details || '').trim();
}

function alertRow(o) {
  const assignments = o.assignments || (o.assignee ? [{
    user_id: 1,
    initials: o.assignee,
    full_name: o.assigneeName || o.assignee,
  }] : []);
  const tags = o.tags || (o.labels || []).map((l, i) =>
    typeof l === 'string' ? { key: i === 0 ? 'team' : 'tag', value: l } : l
  );
  const row = {
    id: o.id,
    alert_name: o.alert_name,
    alert_description: o.alert_description,
    summary: o.summary ?? null,
    additional_details: o.additional_details ?? null,
    severity: o.severity,
    alert_status: o.alert_status,
    component: o.component,
    source_client: o.source_client,
    source_project: o.source_project,
    source_environment: o.source_environment,
    source_name: o.source_name,
    case_id: o.case_id,
    case_status: o.case_status,
    agent_status: o.agent_status ?? null,
    assignments,
    tags,
    archived: o.archived ?? false,
    created_at: o.created_at,
    // Legacy aliases (events.jsx / event_detail.jsx during migration)
    title: o.alert_name,
    detail: o.alert_description,
    sev: (o.severity || 'INFO').toLowerCase(),
    status: { OPEN: 'open', ACK: 'acknowledged', CLOSED: 'closed', FLAPPING: 'flapping' }[o.alert_status] || 'open',
    service: o.component,
    scope: o.source_project,
    source: o.source_name,
    namespace: o.namespace || o.source_project || 'default',
    at: o.created_at,
    labels: tags.map(t => t.value || t.key),
    case: o.case_id != null ? `#${o.case_id}` : '—',
    caseStatus: o.case_status ? { AWAITING_ACTION: 'awaiting', PROCESSING: 'processing', CLOSED: 'closed' }[o.case_status] : null,
    assignee: assignments[0]?.initials || null,
    assigneeName: assignments[0]?.full_name || null,
    assignees: assignments.map(a => ({ initials: a.initials, name: a.full_name })),
  };
  return row;
}

const ALERTS = [
  alertRow({
    id: '1', alert_name: 'Disk Space Low',
    summary: 'Disk usage at 87% on /var partition (storage-04)',
    alert_description: 'Available disk space below 15% threshold on /var partition. Host storage-04, prod cluster eu-west.',
    additional_details: 'Partition /var · Threshold 15% · Firing 12m',
    severity: 'INFO', alert_status: 'OPEN', component: 'storage',
    source_client: 'Acme Corp', source_project: 'platform', source_environment: 'development',
    source_name: 'Prometheus', case_id: 9, case_status: 'AWAITING_ACTION', agent_status: 'PENDING',
    created_at: '17/04/2026, 17:46', labels: ['platform', 'disk', 'prod'],
    assignee: 'FM', assigneeName: 'Francisca Molina',
  }),
  alertRow({
    id: '2', alert_name: 'High API Error Rate',
    summary: '/api/v1/payments endpoint: 23% error rate (normal: <1%)',
    alert_description: 'HTTP 500 responses spiked after api-gateway v2.14.3 deploy. p95 latency +340ms, error budget burn 12% in 30m. Affects staging payments checkout flow.',
    additional_details: 'Region eu-west-1 staging · Threshold 15% 5xx · Firing since 16:48 UTC',
    severity: 'LOW', alert_status: 'CLOSED', component: 'api',
    source_client: 'Acme Corp', source_project: 'payments', source_environment: 'staging',
    source_name: 'Datadog APM', case_id: 8, case_status: 'AWAITING_ACTION', agent_status: 'COMPLETED',
    created_at: '17/04/2026, 16:59', labels: ['backend', 'api', 'payments'],
    assignee: 'DD', assigneeName: 'Daniel Dorado',
  }),
  alertRow({
    id: '3', alert_name: 'Memory Leak Detected',
    summary: 'Service api-gateway memory leak (+40MB/hr over 6h)',
    alert_description: 'Heap usage growing linearly without GC recovery on api-gateway pods in qa. Current heap 12GB vs baseline 4GB. Pattern started 6h ago; correlates with connection pool config change in v2.14.2.',
    additional_details: 'Pod api-gateway-7f8b9c · JVM heap trend +40MB/hr · No OOMKill yet',
    severity: 'HIGH', alert_status: 'FLAPPING', component: 'api-gateway',
    source_client: 'Acme Corp', source_project: 'gateway', source_environment: 'qa',
    source_name: 'Grafana', case_id: 7, case_status: 'AWAITING_ACTION', agent_status: 'PROCESSING',
    created_at: '17/04/2026, 16:55', labels: ['backend', 'gateway', 'memory'],
    assignee: 'DD', assigneeName: 'Daniel Dorado',
  }),
  alertRow({
    id: '4', alert_name: 'Network Latency Spike',
    summary: 'Cross-region latency 45ms → 180ms (us-east ↔ eu-west)',
    alert_description: 'Inter-region link saturation detected between us-east-1 and eu-west-1. P99 latency 3× baseline over a 10m window; packet loss 0.2%.',
    additional_details: 'Path us-east-1 ↔ eu-west-1 · Baseline 45ms · Current p99 180ms',
    severity: 'MEDIUM', alert_status: 'CLOSED', component: 'network',
    source_client: 'Acme Corp', source_project: 'infra', source_environment: 'qa',
    source_name: 'CloudWatch', case_id: 6, case_status: 'AWAITING_ACTION',
    created_at: '17/04/2026, 15:13', labels: ['infrastructure', 'network', 'xregion'],
    assignee: 'DD', assigneeName: 'Daniel Dorado',
  }),
  alertRow({
    id: '5', alert_name: 'SSL Certificate Expiring',
    summary: 'Certificate *.example.com expires in 5 days',
    alert_description: "TLS certificate issued by Let's Encrypt expires on 22/04/2026. Automated renewal did not run on security-01; manual renewal required before cutover.",
    additional_details: 'Issuer Let\'s Encrypt · SAN *.example.com · Expires 22/04/2026',
    severity: 'INFO', alert_status: 'CLOSED', component: 'security',
    source_client: 'Acme Corp', source_project: 'security', source_environment: 'qa',
    source_name: 'Cert-Manager', case_id: 5, case_status: 'CLOSED',
    created_at: '17/04/2026, 15:07', labels: ['backend', 'cert', 'dns'],
    assignee: 'DD', assigneeName: 'Daniel Dorado',
  }),
  alertRow({
    id: '6', alert_name: 'Redis Cache Miss Rate High',
    summary: 'Redis cache hit rate at 45% (normal >85%)',
    alert_description: 'Cache miss rate elevated on web-prod node redis-3. Hit ratio below SLO for 8 consecutive samples; upstream DB load increased ~18%.',
    additional_details: 'Node redis-3 · Namespace web-prod · SLO hit ratio >85%',
    severity: 'OK', alert_status: 'OPEN', component: 'cache',
    source_client: '—', source_project: '—', source_environment: '—',
    source_name: 'Datadog', case_id: null, case_status: null,
    created_at: '16/04/2026, 21:46', labels: ['infrastructure', 'cache', 'redis'],
  }),
  alertRow({
    id: '7', alert_name: 'Network Latency Spike',
    summary: 'Cross-region latency 45ms → 180ms (us-east ↔ eu-west)',
    alert_description: 'Inter-region latency spike on platform development mesh. Elevated RTT between us-east and eu-west peering links; no route flap detected.',
    additional_details: 'Environment development · Peering acme-platform-dev · Duration 22m',
    severity: 'INFO', alert_status: 'CLOSED', component: 'network',
    source_client: 'Acme Corp', source_project: 'platform', source_environment: 'development',
    source_name: 'CloudWatch', case_id: 4, case_status: 'AWAITING_ACTION',
    created_at: '16/04/2026, 21:17', labels: ['platform', 'network'],
    assignee: 'MR', assigneeName: 'Marelys Rodríguez',
  }),
  alertRow({
    id: '8', alert_name: 'High CPU Usage',
    summary: 'Server web-prod-01 CPU usage at 94% for 5+ minutes',
    alert_description: 'CPU usage exceeded 90% threshold on production server web-prod-01. Load avg 12.4 sustained 5m+. No deploy in window; possible runaway cron or thread pool saturation on checkout dependency.',
    additional_details: 'Host web-prod-01.example.com · Threshold 90% · Load avg 12.4',
    severity: 'INFO', alert_status: 'ACK', component: 'compute',
    source_client: 'Acme Corp', source_project: 'backend', source_environment: 'qa',
    source_name: 'Prometheus', case_id: 3, case_status: 'AWAITING_ACTION', agent_status: 'PROCESSING',
    created_at: '16/04/2026, 18:23', labels: ['backend', 'cpu', 'prod'],
    assignee: 'DD', assigneeName: 'Daniel Dorado',
  }),
  alertRow({
    id: '9', alert_name: 'Memory Leak Detected',
    summary: 'Service api-gateway memory leak (+40MB/hr over 6h)',
    alert_description: 'Resolved memory leak on api-gateway after rolling restart. Root cause traced to unreleased buffers in v2.14.1; case closed after 24h stable heap.',
    additional_details: 'Closed after rollback to v2.14.0 · Heap stable 4.1GB post-restart',
    severity: 'LOW', alert_status: 'CLOSED', component: 'api-gateway',
    source_client: 'Acme Corp', source_project: 'gateway', source_environment: 'qa',
    source_name: 'Grafana', case_id: 2, case_status: 'AWAITING_ACTION',
    created_at: '16/04/2026, 18:21', labels: ['backend', 'gateway', 'memory'],
    assignee: 'DD', assigneeName: 'Daniel Dorado',
  }),
];

const EVENTS = ALERTS;

// Distinct source values for filter dropdowns (Chia dashboard stats — available_source_*).
const MOCK_FILTER_STATS = {
  available_source_clients: ['Acme Corp', 'Globex', 'Initech'],
  available_source_projects: [
    'billing', 'billing-api', 'checkout', 'infra', 'observability',
    'payments', 'platform', 'search',
  ],
  available_source_environments: [
    'development', 'mock-demo', 'production', 'qa', 'staging',
  ],
};

const INVESTIGATION_STEPS = [
  { t:'00:00', kind:'start',   text:'Investigation started — pulling alert context' },
  { t:'00:03', kind:'data',    text:'Fetched 6 related alerts in the last 30 min on the same service' },
  { t:'00:07', kind:'data',    text:'Loaded dashboards: API latency, Gateway memory, JVM GC' },
  { t:'00:11', kind:'hypo',    text:'Hypothesis: memory leak in connection pool (high correlation with deploy at 14:32)' },
  { t:'00:14', kind:'query',   text:'Ran metric query: heap_used{service="api-gateway"} — confirmed linear growth' },
  { t:'00:18', kind:'hypo',    text:'Runbook suggests rolling restart — confidence 0.81' },
  { t:'00:22', kind:'action',  text:'Awaiting on-call approval to trigger runbook #R-204' },
];

Object.assign(window, {
  ALERTS, EVENTS, MOCK_FILTER_STATS, INVESTIGATION_STEPS, alertRow,
  alertSummaryText, alertDetailsText,
});
