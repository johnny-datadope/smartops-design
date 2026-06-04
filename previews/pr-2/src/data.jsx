// Seed data for the Alerts table (Apolo-aligned schema + legacy aliases for JSX).

function alertRow(o) {
  const assignments = o.assignments || (o.assignee ? [{
    user_id: { DD: 1, FM: 2, MR: 3 }[o.assignee] ?? 1,
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
    severity: o.severity,
    alert_status: o.alert_status,
    component: o.component,
    source_client: o.source_client,
    source_project: o.source_project,
    source_environment: o.source_environment,
    source_name: o.source_name,
    source_host: o.source_host ?? null,
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
    mock_turns: o.mock_turns,
    mock_scenario: o.mock_scenario ?? null,
    investigation_started: o.investigation_started ?? false,
    _streamComplete: o._streamComplete ?? false,
  };
  return row;
}

const ALERTS = [
  alertRow({ id:'1', alert_name:'Disk Space Low', alert_description:'Disk usage at 87% on /var partition (storage-01, prod cluster eu-west)', severity:'INFO', alert_status:'OPEN', component:'storage', source_client:'Acme Corp', source_project:'platform', source_environment:'development', source_name:'Prometheus', source_host:'storage-01.example.com', case_id:9, case_status:'AWAITING_ACTION', agent_status:'PENDING', created_at:'17/04/2026, 17:46', labels:['platform','disk','prod'], assignee:'FM', assigneeName:'Francisca Molina', mock_scenario:'disk_space', _streamComplete: true }),
  alertRow({ id:'2', alert_name:'High API Error Rate', alert_description:'/api/v1/payments endpoint: 23% error rate (p95 latency +340ms)', severity:'LOW', alert_status:'CLOSED', component:'api', source_client:'Acme Corp', source_project:'payments', source_environment:'staging', source_name:'Datadog APM', source_host:'api-prod-03.example.com', case_id:8, case_status:'AWAITING_ACTION', agent_status:'COMPLETED', created_at:'17/04/2026, 16:59', labels:['backend','api','payments'], assignee:'DD', assigneeName:'Daniel Dorado', mock_scenario:'api_errors', _streamComplete: true }),
  alertRow({ id:'3', alert_name:'Memory Leak Detected', alert_description:'Service api-gateway showing memory leak pattern (+40MB/hr over 6h)', severity:'HIGH', alert_status:'FLAPPING', component:'api-gateway', source_client:'Acme Corp', source_project:'gateway', source_environment:'qa', source_name:'Grafana', source_host:'api-gateway-02.example.com', case_id:7, case_status:'AWAITING_ACTION', agent_status:'PROCESSING', created_at:'17/04/2026, 16:55', labels:['backend','gateway','memory'], assignee:'DD', assigneeName:'Daniel Dorado', mock_scenario:'memory_leak', _streamComplete: true }),
  alertRow({ id:'4', alert_name:'Network Latency Spike', alert_description:'Cross-region latency increased from 45ms to 180ms (us-east ↔ eu-west)', severity:'MEDIUM', alert_status:'CLOSED', component:'network', source_client:'Acme Corp', source_project:'infra', source_environment:'qa', source_name:'CloudWatch', source_host:'router-eu-west-1.example.com', case_id:6, case_status:'AWAITING_ACTION', created_at:'17/04/2026, 15:13', labels:['infrastructure','network','xregion'], assignee:'DD', assigneeName:'Daniel Dorado', mock_scenario:'network_latency', _streamComplete: true }),
  alertRow({ id:'5', alert_name:'SSL Certificate Expiring', alert_description:"Certificate for *.example.com expires in 5 days (issuer: Let's Encrypt)", severity:'INFO', alert_status:'CLOSED', component:'security', source_client:'Acme Corp', source_project:'security', source_environment:'qa', source_name:'Cert-Manager', source_host:'lb-01.example.com', case_id:5, case_status:'CLOSED', created_at:'17/04/2026, 15:07', labels:['backend','cert','dns'], assignee:'DD', assigneeName:'Daniel Dorado', mock_scenario:'ssl_expiring', _streamComplete: true }),
  alertRow({ id:'6', alert_name:'Redis Cache Miss Rate High', alert_description:'Redis cache miss rate at 45% (normal >85%) — web-prod node redis-3', severity:'OK', alert_status:'OPEN', component:'cache', source_client:'—', source_project:'—', source_environment:'—', source_name:'Datadog', source_host:'redis-cluster-01.example.com', case_id:null, case_status:null, created_at:'16/04/2026, 21:46', labels:['infrastructure','cache','redis'] }),
  alertRow({ id:'7', alert_name:'Network Latency Spike', alert_description:'Cross-region latency increased from 45ms to 180ms (us-east ↔ eu-west)', severity:'INFO', alert_status:'CLOSED', component:'network', source_client:'Acme Corp', source_project:'platform', source_environment:'development', source_name:'CloudWatch', source_host:'router-eu-west-1.example.com', case_id:4, case_status:'AWAITING_ACTION', created_at:'16/04/2026, 21:17', labels:['platform','network'], assignee:'MR', assigneeName:'Marelys Rodríguez', mock_scenario:'network_latency', _streamComplete: true }),
  alertRow({ id:'8', alert_name:'High CPU Usage', alert_description:'Server web-prod-01 CPU usage at 94% for 5+ minutes (load avg 12.4)', severity:'INFO', alert_status:'ACK', component:'compute', source_client:'Acme Corp', source_project:'backend', source_environment:'qa', source_name:'Prometheus', source_host:'web-prod-01.example.com', case_id:3, case_status:'AWAITING_ACTION', agent_status:'PROCESSING', created_at:'16/04/2026, 18:23', labels:['backend','cpu','prod'], assignee:'DD', assigneeName:'Daniel Dorado', mock_scenario:'high_cpu', _streamComplete: true }),
  alertRow({ id:'9', alert_name:'Memory Leak Detected', alert_description:'Service api-gateway showing memory leak pattern (+40MB/hr over 6h)', severity:'LOW', alert_status:'CLOSED', component:'api-gateway', source_client:'Acme Corp', source_project:'gateway', source_environment:'qa', source_name:'Grafana', source_host:'api-gateway-02.example.com', case_id:2, case_status:'AWAITING_ACTION', created_at:'16/04/2026, 18:21', labels:['backend','gateway','memory'], assignee:'DD', assigneeName:'Daniel Dorado', mock_scenario:'memory_leak', _streamComplete: true }),
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

Object.assign(window, { ALERTS, EVENTS, MOCK_FILTER_STATS, INVESTIGATION_STEPS, alertRow });
