// Mock investigation scenarios — Apolo-aligned reasoning + RCA for smartops-design demo.

function fillTemplate(str, params) {
  if (!str) return '';
  return String(str).replace(/\{(\w+)\}/g, (_, key) => (params[key] != null ? String(params[key]) : `{${key}}`));
}

function eventParams(event) {
  const service = event.service || event.component || 'api-gateway';
  const component = event.component || service;
  const defaultHost = component === 'storage'
    ? 'storage-01.example.com'
    : `${String(service).replace(/[^a-z0-9-]/gi, '-')}-02.example.com`;
  const host = event.source_host || defaultHost;
  const hostShort = String(host).split('.')[0];
  return {
    service,
    component,
    host,
    hostShort,
    namespace: event.namespace || event.scope || event.source_project || 'default',
    alertName: event.alert_name || event.title || 'Alert',
    alertDescription: event.alert_description || event.detail || '',
    memoryUsed: '12GB',
    memoryNormal: '4GB',
    durationMinutes: 39,
    endpoint: '/api/v1/payments',
    diskUsage: 87,
    latencyNormal: '45ms',
    latencyPeak: '180ms',
    hitRate: 45,
    cpuUsage: 94,
    loadAvg: 12.4,
    domain: '*.example.com',
    daysLeft: 5,
  };
}

function buildDiskKubectlFindNodeCommand(params) {
  const nodeKey = params.hostShort || 'storage-01';
  return `run code=
import json
result = query_mcp("kubectl", "kubectl_impl", { "command": "get nodes -o json" })

if result["returncode"] != 0:
    print(json.dumps({"error": "kubectl failed", "stderr": result["stderr"][:200]}))
else:
    nodes = json.loads(result["stdout"])["items"]
    storage_node = None
    for node in nodes:
        if "${nodeKey}" in node["metadata"]["name"]:
            storage_node = node
            break

    if storage_node:
        print(json.dumps({
            "node_found": True,
            "node_name": storage_node["metadata"]["name"],
            "conditions": storage_node.get("status", {}).get("conditions", [])[-3:],
            "capacity": storage_node.get("status", {}).get("capacity", {}),
            "allocatable": storage_node.get("status", {}).get("allocatable", {})
        }))
    else:
        print(json.dumps({
            "node_found": False,
            "all_nodes": [n["metadata"]["name"] for n in nodes][:5]
        }))`;
}

function buildDiskKubectlListNodesCommand() {
  return `run code=
import json
result = query_mcp("kubectl", "kubectl_impl", { "command": "get nodes -o json" })

if result["returncode"] != 0:
    print(json.dumps({"error": "kubectl failed", "stderr": result["stderr"][:200]}))
else:
    nodes = json.loads(result["stdout"])["items"]
    print(json.dumps({
        "total_nodes": len(nodes),
        "node_names": [n["metadata"]["name"] for n in nodes][:10]
    }))`;
}

function buildDiskKubectlNamespacesCommand() {
  return `run code=
import json
result = query_mcp("kubectl", "kubectl_impl", {"command": "get namespaces -o json"})
if result["returncode"] != 0:
    print(json.dumps({"error": result["stderr"][:200]}))
else:
    ns = json.loads(result["stdout"])["items"]
    print(json.dumps({"namespace_count": len(ns), "names": [n["metadata"]["name"] for n in ns][:5]}))`;
}

function buildDiskKubectlVersionCommand() {
  return `run code=
import json
try:
    result = query_mcp("kubectl", "kubectl_impl", {"command": "version --short"})
    print(json.dumps({"test": "success", "returncode": result.get("returncode")}))
except Exception as e:
    print(json.dumps({"error": str(e)[:150]}))`;
}

function buildDiskKubectlPodsCommand(params) {
  const nodeName = params.host.includes('.') ? params.host : `${params.hostShort}.example.com`;
  return `run code=
import json
import time
time.sleep(2)

result = query_mcp("kubectl", "kubectl_impl", {"command": "get pods -A --field-selector spec.nodeName=${nodeName} -o json"})

if result["returncode"] != 0:
    print(json.dumps({"error": result["stderr"][:300]}))
else:
    pods = json.loads(result["stdout"]).get("items", [])
    pod_list = []
    for p in pods[:10]:
        pod_list.append({
            "name": p["metadata"]["name"],
            "namespace": p["metadata"]["namespace"],
            "phase": p["status"].get("phase")
        })
    print(json.dumps({"pod_count": len(pods), "sample_pods": pod_list}))`;
}

function getDiskSpaceCommands(params) {
  return [
    buildDiskKubectlFindNodeCommand(params),
    buildDiskKubectlListNodesCommand(),
    buildDiskKubectlNamespacesCommand(),
    buildDiskKubectlVersionCommand(),
    buildDiskKubectlPodsCommand(params),
  ];
}

function getScenarioCommands(scenarioKey, params) {
  switch (scenarioKey) {
    case 'disk_space':
      return getDiskSpaceCommands(params);
    case 'memory_leak':
      return [];
    default:
      return [];
  }
}

function getScenarioKey(event, override) {
  if (override) return override;
  if (event?.mock_scenario) return event.mock_scenario;
  const component = String(event?.service || event?.component || '').toLowerCase();
  const name = String(event?.alert_name || event?.title || '').toLowerCase();
  if (component === 'api-gateway' || component === 'application' || name.includes('memory leak')) {
    return 'memory_leak';
  }
  if (component === 'api' || name.includes('error rate')) return 'api_errors';
  if (component === 'storage' || name.includes('disk')) return 'disk_space';
  if (component === 'network' || name.includes('latency')) return 'network_latency';
  if (component === 'cache' || name.includes('redis')) return 'cache_miss';
  if (component === 'compute' || name.includes('cpu')) return 'high_cpu';
  if (component === 'security' || name.includes('ssl') || name.includes('certificate')) {
    return 'ssl_expiring';
  }
  return 'memory_leak';
}

function buildAlertDataCommand(params) {
  return `run code=
import json

alert_data = {
  "service": "${params.service}",
  "host": "${params.host}",
  "component": "${params.component === 'api-gateway' ? 'application' : params.component}",
  "memory_used": "${params.memoryUsed}",
  "memory_normal": "${params.memoryNormal}",
  "duration_minutes": ${params.durationMinutes},
  "pattern": "memory leak - steady growth without GC"
}

print(json.dumps(alert_data))`;
}

function buildAlertDataOutput(params) {
  return JSON.stringify({
    service: params.service,
    host: params.host,
    component: params.component === 'api-gateway' ? 'application' : params.component,
    memory_used: params.memoryUsed,
    memory_normal: params.memoryNormal,
    duration_minutes: params.durationMinutes,
    pattern: 'memory leak - steady growth without GC',
  });
}

function buildMockRcaMarkdown(t, scenarioKey, params) {
  const map = {
    memory_leak: 'memoryLeak',
    api_errors: 'apiErrors',
    disk_space: 'diskSpace',
    network_latency: 'networkLatency',
    cache_miss: 'cacheMiss',
    high_cpu: 'highCpu',
    ssl_expiring: 'sslExpiring',
    reinvestigate: 'reinvestigate',
  };
  const blockKey = map[scenarioKey] || 'memoryLeak';
  const block = t.mockInvestigation?.[blockKey] || {};
  const title = fillTemplate(block.rcaTitle, params);
  const body = fillTemplate(block.rcaBody, params);
  const evidence = fillTemplate(block.evidence, params);
  const solutions = [block.solution1, block.solution2, block.solution3, block.solution4]
    .filter(Boolean)
    .map(s => `- ${fillTemplate(s, params)}`)
    .join('\n');
  return `### {{root_cause_analysis}}
**${title}**

${body}

### {{evidence}}
${evidence}

### {{proposed_solution}}
${solutions}`;
}

function buildMemoryLeakSteps(t, params) {
  return [
    { label: t.chat.mockStepAnalyzing, isCompleted: true, toolCalls: [] },
    {
      label: t.chat.mockStepStarting,
      isCompleted: true,
      toolCalls: [{
        toolName: 'run_code',
        command: buildAlertDataCommand(params),
        output: buildAlertDataOutput(params),
        isCompleted: true,
      }],
    },
  ];
}

function buildApiErrorsSteps(t, params) {
  const kubectlCmd = `kubectl get pods -A -l app=${params.service} -o json`;
  return [
    { label: t.chat.mockStepAnalyzing, isCompleted: true, toolCalls: [] },
    {
      label: t.chat.mockStepStarting,
      isCompleted: true,
      toolCalls: [{
        toolName: 'run_code',
        command: kubectlCmd,
        output: "unknown tool name: 'kubectl_impl', available tools: ['fnctl_*', …]",
        isCompleted: true,
      }],
    },
  ];
}

function buildDiskSpaceSteps(t, params) {
  const kubectlTools = getDiskSpaceCommands(params).slice(0, 2).map((command, idx) => ({
    toolName: 'run_code',
    command,
    output: idx === 0
      ? JSON.stringify({
        node_found: true,
        node_name: params.host,
        capacity: { cpu: '8', memory: '32Gi', 'ephemeral-storage': '100Gi' },
        allocatable: { cpu: '7800m', memory: '30Gi', 'ephemeral-storage': '87Gi' },
      })
      : JSON.stringify({
        total_nodes: 5,
        node_names: [params.host, 'worker-01.example.com', 'worker-02.example.com'],
      }),
    isCompleted: true,
  }));
  return [
    { label: t.chat.mockStepAnalyzing, isCompleted: true, toolCalls: [] },
    {
      label: t.chat.mockStepStarting,
      isCompleted: true,
      toolCalls: kubectlTools,
    },
  ];
}

function buildNetworkLatencySteps(t, params) {
  return [
    { label: t.chat.mockStepAnalyzing, isCompleted: true, toolCalls: [] },
    {
      label: t.chat.mockStepCorrelating,
      isCompleted: true,
      toolCalls: [{
        toolName: 'run_code',
        command: `metrics.query latency{region="eu-west",peer="us-east"} since=30m`,
        output: `p50: ${params.latencyNormal} → ${params.latencyPeak} · sustained 15m · service=${params.service}`,
        isCompleted: true,
      }],
    },
  ];
}

function buildCacheMissSteps(t, params) {
  return [
    { label: t.chat.mockStepAnalyzing, isCompleted: true, toolCalls: [] },
    {
      label: t.chat.mockStepStarting,
      isCompleted: true,
      toolCalls: [{
        toolName: 'run_code',
        command: `redis.info stats\n# node: ${params.host}`,
        output: `keyspace_hits: 4521\nkeyspace_misses: 5520\nhit_rate: ${params.hitRate}%`,
        isCompleted: true,
      }],
    },
  ];
}

function buildHighCpuSteps(t, params) {
  return [
    { label: t.chat.mockStepAnalyzing, isCompleted: true, toolCalls: [] },
    {
      label: t.chat.mockStepCorrelating,
      isCompleted: true,
      toolCalls: [{
        toolName: 'run_code',
        command: `top -bn1 -p $(pgrep -f ${params.service})`,
        output: `CPU: ${params.cpuUsage}% · load avg: ${params.loadAvg} · host=${params.host}`,
        isCompleted: true,
      }],
    },
  ];
}

function buildSslExpiringSteps(t, params) {
  return [
    { label: t.chat.mockStepAnalyzing, isCompleted: true, toolCalls: [] },
    {
      label: t.chat.mockStepStarting,
      isCompleted: true,
      toolCalls: [{
        toolName: 'run_code',
        command: `openssl x509 -in /etc/ssl/certs/${params.domain.replace(/\*/g, 'wildcard')} -noout -dates`,
        output: `notAfter=... expires in ${params.daysLeft} days · host=${params.host}`,
        isCompleted: true,
      }],
    },
  ];
}

function buildReinvestigateSteps(t, params) {
  return [
    { label: t.chat.mockStepReinvestigate, isCompleted: true, toolCalls: [] },
    {
      label: t.chat.mockStepLogs,
      isCompleted: true,
      toolCalls: [{
        toolName: 'run_code',
        command: `logs.search service=${params.service} status>=500 since=30m`,
        output: '142 hits · p95 latency 920ms · top path: /api/v1/payments',
        isCompleted: true,
      }],
    },
    {
      label: t.chat.mockStepDeploys,
      isCompleted: true,
      toolCalls: [{
        toolName: 'run_code',
        command: `deploys.list service=${params.service} since=2h`,
        output: 'api-gateway@v2.14.3 rolled out 48m ago',
        isCompleted: true,
      }],
    },
  ];
}

function buildScenarioSteps(scenarioKey, t, params) {
  switch (scenarioKey) {
    case 'memory_leak': return buildMemoryLeakSteps(t, params);
    case 'api_errors': return buildApiErrorsSteps(t, params);
    case 'disk_space': return buildDiskSpaceSteps(t, params);
    case 'network_latency': return buildNetworkLatencySteps(t, params);
    case 'cache_miss': return buildCacheMissSteps(t, params);
    case 'high_cpu': return buildHighCpuSteps(t, params);
    case 'ssl_expiring': return buildSslExpiringSteps(t, params);
    case 'reinvestigate': return buildReinvestigateSteps(t, params);
    default: return buildMemoryLeakSteps(t, params);
  }
}

function buildMockInvestigation(event, t, options) {
  if (!event || !t) {
    return { reasoningSteps: [], analysisTurn: { markdown: '' } };
  }
  const scenarioKey = getScenarioKey(event, options?.scenario);
  const params = eventParams(event);
  const reasoningSteps = buildScenarioSteps(scenarioKey, t, params);
  const analysisTurn = {
    markdown: buildMockRcaMarkdown(t, scenarioKey, params),
    commands: getScenarioCommands(scenarioKey, params),
  };
  return { reasoningSteps, analysisTurn, scenarioKey };
}

function buildMockDemoTurns(event, t, scenarioOverride) {
  const { reasoningSteps, analysisTurn } = buildMockInvestigation(event, t, {
    scenario: scenarioOverride || event?.mock_scenario,
  });
  return [
    { id: 'r0', kind: 'reasoning', isStreaming: false, steps: reasoningSteps },
    { id: 'a0', kind: 'analysis', ...analysisTurn },
  ];
}

function resolveInitialTurns(event, t) {
  if (!event) return [];
  if (Array.isArray(event.mock_turns) && event.mock_turns.length) {
    return [...event.mock_turns];
  }
  if (event.mock_scenario) {
    return buildMockDemoTurns(event, t, event.mock_scenario);
  }
  return [];
}

function streamMockInvestigation({
  event,
  t,
  setTurns,
  setBusy,
  scenario,
  resetTurns = false,
  appendAnalysis = true,
  onComplete,
}) {
  const { reasoningSteps, analysisTurn } = buildMockInvestigation(event, t, { scenario });
  const rid = 'r' + Date.now();
  setBusy(true);
  setTurns(prev => {
    const base = resetTurns ? [] : prev;
    return [...base, { id: rid, kind: 'reasoning', isStreaming: true, steps: [] }];
  });
  let i = 0;
  const pushStep = () => {
    if (i >= reasoningSteps.length) {
      setTurns(ts => {
        const updated = ts.map(turn => (turn.id === rid ? { ...turn, isStreaming: false } : turn));
        if (!appendAnalysis) return updated;
        return [...updated, { id: 'a' + Date.now(), kind: 'analysis', ...analysisTurn }];
      });
      if (onComplete) onComplete(event);
      setBusy(false);
      return;
    }
    const step = reasoningSteps[i++];
    setTurns(ts => ts.map(turn => (turn.id === rid
      ? { ...turn, steps: [...turn.steps, step] }
      : turn)));
    setTimeout(pushStep, 650);
  };
  setTimeout(pushStep, 350);
}

Object.assign(window, {
  fillTemplate,
  eventParams,
  getScenarioKey,
  buildMockInvestigation,
  buildMockDemoTurns,
  resolveInitialTurns,
  streamMockInvestigation,
});
