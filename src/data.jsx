// Seed data for the Events table.
const EVENTS = [
  { sev:'info',     status:'open',         title:'Disk Space Low',         detail:'Disk usage at 87% on /var partition (storage-04, prod cluster eu-west)', service:'storage',    scope:'development', source:'Prometheus',    at:'17/04/2026, 17:46', labels:['platform','disk','prod'],        case:'#9', caseStatus:'awaiting', assignee:'FM', assigneeName:'Francisca Molina' },
  { sev:'low',      status:'closed',       title:'High API Error Rate',    detail:'/api/v1/payments endpoint: 23% error rate (p95 latency +340ms)',             service:'api',        scope:'staging',     source:'Datadog APM',   at:'17/04/2026, 16:59', labels:['backend','api','payments'],       case:'#8', caseStatus:'awaiting', assignee:'DD', assigneeName:'Daniel Dorado' },
  { sev:'high',     status:'flapping',     title:'Memory Leak Detected',   detail:'Service api-gateway showing memory leak pattern (+40MB/hr over 6h)',         service:'application',scope:'qa',          source:'Grafana',       at:'17/04/2026, 16:55', labels:['backend','gateway','memory'],     case:'#7', caseStatus:'awaiting', assignee:'DD', assigneeName:'Daniel Dorado' },
  { sev:'medium',   status:'closed',       title:'Network Latency Spike',  detail:'Cross-region latency increased from 45ms to 180ms (us-east ↔ eu-west)',      service:'network',    scope:'qa',          source:'CloudWatch',    at:'17/04/2026, 15:13', labels:['infrastructure','network','xregion'],case:'#6', caseStatus:'awaiting', assignee:'DD', assigneeName:'Daniel Dorado' },
  { sev:'info',     status:'closed',       title:'SSL Certificate Expiring', detail:'Certificate for *.example.com expires in 5 days (issuer: Let\'s Encrypt)',   service:'security',   scope:'qa',          source:'Cert-Manager',  at:'17/04/2026, 15:07', labels:['backend','cert','dns'],           case:'#5', caseStatus:'processing', assignee:'DD', assigneeName:'Daniel Dorado' },
  { sev:'ok',       status:'open',         title:'Redis Cache Miss Rate High', detail:'Redis cache miss rate at 45% (normal >85%) — web-prod node redis-3',      service:'cache',      scope:'—',           source:'Datadog',       at:'16/04/2026, 21:46', labels:['infrastructure','cache','redis'], case:'—',  caseStatus:null,       assignee:null, assigneeName:'Unassigned' },
  { sev:'info',     status:'closed',       title:'Network Latency Spike',  detail:'Cross-region latency increased from 45ms to 180ms (us-east ↔ eu-west)',      service:'network',    scope:'development', source:'CloudWatch',    at:'16/04/2026, 21:17', labels:['platform','network'],             case:'#4', caseStatus:'awaiting', assignee:'MR', assigneeName:'Marelys Rodríguez' },
  { sev:'info',     status:'acknowledged', title:'High CPU Usage',         detail:'Server web-prod-01 CPU usage at 94% for 5+ minutes (load avg 12.4)',          service:'compute',    scope:'qa',          source:'Prometheus',    at:'16/04/2026, 18:23', labels:['backend','cpu','prod'],           case:'#3', caseStatus:'awaiting', assignee:'DD', assigneeName:'Daniel Dorado' },
  { sev:'low',      status:'closed',       title:'Memory Leak Detected',   detail:'Service api-gateway showing memory leak pattern (+40MB/hr over 6h)',         service:'application',scope:'qa',          source:'Grafana',       at:'16/04/2026, 18:21', labels:['backend','gateway','memory'],     case:'#2', caseStatus:'awaiting', assignee:'DD', assigneeName:'Daniel Dorado' },
];

const SEV_META = {
  critical:{ label:'Crit',   color:'var(--sev-crit)' },
  high:    { label:'High',   color:'var(--sev-high)' },
  medium:  { label:'Med',    color:'var(--sev-med)'  },
  low:     { label:'Low',    color:'var(--sev-low)'  },
  info:    { label:'Info',   color:'var(--sev-info)' },
  ok:      { label:'OK',     color:'var(--sev-ok)'   },
};

const STATUS_META = {
  open:         { label:'Open',          hue:25 },
  closed:       { label:'Closed',        hue:250 },
  flapping:     { label:'Flapping',      hue:45 },
  acknowledged: { label:'Acknowledged',  hue:320 },
};

const CASE_META = {
  awaiting:   { label:'Awaiting Action', hue:200 },
  processing: { label:'Processing',      hue:320 },
};

// A mock investigation timeline for the side panel.
const INVESTIGATION_STEPS = [
  { t:'00:00', kind:'start',   text:'Investigation started — pulling event context' },
  { t:'00:03', kind:'data',    text:'Fetched 6 related events in the last 30 min on the same service' },
  { t:'00:07', kind:'data',    text:'Loaded dashboards: API latency, Gateway memory, JVM GC' },
  { t:'00:11', kind:'hypo',    text:'Hypothesis: memory leak in connection pool (high correlation with deploy at 14:32)' },
  { t:'00:14', kind:'query',   text:'Ran metric query: heap_used{service="api-gateway"} — confirmed linear growth' },
  { t:'00:18', kind:'hypo',    text:'Runbook suggests rolling restart — confidence 0.81' },
  { t:'00:22', kind:'action',  text:'Awaiting on-call approval to trigger runbook #R-204' },
];

Object.assign(window, { EVENTS, SEV_META, STATUS_META, CASE_META, INVESTIGATION_STEPS });
