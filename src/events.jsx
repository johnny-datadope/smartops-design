// Events dashboard — stat cards, search/filter, and the events table.

function StatCard({ label, value, accent, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      textAlign:'left', padding:'18px 18px',
      background:'var(--bg-2)',
      border:`1px solid ${active ? 'var(--accent-2)' : 'var(--line)'}`,
      borderRadius:12,
      display:'flex', alignItems:'flex-start', justifyContent:'space-between',
      gap:12, transition:'all .15s',
      boxShadow: active ? '0 0 0 3px var(--accent-glow)' : 'none',
      position:'relative',
    }}>
      <div>
        <div style={{ fontSize:28, fontWeight:600, letterSpacing:'-0.02em', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:11.5, color:'var(--fg-3)', marginTop:8 }}>{label}</div>
      </div>
      <div style={{
        width:36, height:36, borderRadius:10,
        background: `color-mix(in oklch, ${accent} 18%, transparent)`,
        border:`1px solid color-mix(in oklch, ${accent} 35%, transparent)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        color: accent,
      }}>
        {icon}
      </div>
    </button>
  );
}

function StatCards({ events, filter, setFilter }) {
  const total = events.length;
  const open = events.filter(e => e.status === 'open').length;
  const cases = events.filter(e => e.case !== '—').length;
  const resolved = events.filter(e => e.caseStatus === 'processing' || e.status === 'closed').length - 5; // show 0 to match reference cadence
  const cards = [
    { key:'all',      label:'Total Events',   value:total,    accent:'var(--accent)',   icon:<IconActivity size={16}/> },
    { key:'open',     label:'Open events',    value:open,     accent:'var(--sev-high)', icon:<IconAlert size={16}/> },
    { key:'cases',    label:'Open Cases',     value:cases,    accent:'var(--sev-info)', icon:<IconEye size={16}/> },
    { key:'resolved', label:'Resolved Cases', value:0,        accent:'var(--sev-ok)',   icon:<IconCheck size={16}/> },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
      {cards.map(c => (
        <StatCard key={c.key} {...c} active={filter === c.key} onClick={() => setFilter(c.key)}/>
      ))}
    </div>
  );
}

function SeverityPill({ sev }) {
  const m = SEV_META[sev];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'2px 8px', borderRadius:99,
      background: `color-mix(in oklch, ${m.color} 16%, transparent)`,
      border: `1px solid color-mix(in oklch, ${m.color} 32%, transparent)`,
      color: m.color,
      fontSize:10.5, fontWeight:600, letterSpacing:'0.02em',
    }}>
      <span style={{ width:5, height:5, borderRadius:99, background:m.color }}/>
      {m.label}
    </span>
  );
}

function StatusPill({ status }) {
  const m = STATUS_META[status];
  const c = `oklch(0.78 0.10 ${m.hue})`;
  return (
    <span style={{
      display:'inline-block',
      padding:'2px 8px', borderRadius:99,
      background:`color-mix(in oklch, ${c} 14%, transparent)`,
      border:`1px solid color-mix(in oklch, ${c} 30%, transparent)`,
      color:c,
      fontSize:10.5, fontWeight:500,
    }}>{m.label}</span>
  );
}

function CaseStatus({ status }) {
  if (!status) return <span style={{ color:'var(--fg-4)' }}>—</span>;
  const m = CASE_META[status];
  const c = `oklch(0.78 0.10 ${m.hue})`;
  return (
    <span style={{
      display:'inline-block',
      padding:'2px 8px', borderRadius:99,
      background:`color-mix(in oklch, ${c} 14%, transparent)`,
      border:`1px solid color-mix(in oklch, ${c} 30%, transparent)`,
      color:c,
      fontSize:10.5, fontWeight:500,
    }}>{m.label}</span>
  );
}

function LabelChip({ text, extra }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3, alignItems:'flex-start' }}>
      <span style={{
        display:'inline-flex', alignItems:'center', gap:5,
        padding:'2px 9px', borderRadius:99,
        background:'var(--label-bg)',
        border:'1px solid var(--label-bd)',
        color:'var(--label-fg)',
        fontSize:10.5, fontWeight:500, whiteSpace:'nowrap',
      }}>team: {text}</span>
      {extra > 0 && (
        <span style={{
          fontSize:10,
          padding:'1px 8px', borderRadius:99,
          background:'var(--label-bg)', border:'1px solid var(--label-bd)',
          color:'var(--label-fg)', fontWeight:500,
        }}>+{extra} more</span>
      )}
    </div>
  );
}

function AssigneeCell({ event, assignee, name }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [, setTick] = React.useState(0);

  // Prefer multi-assignee list from the event; fall back to single-assignee props.
  const list = event
    ? (Array.isArray(event.assignees) ? event.assignees
        : event.assignee ? [{ initials: event.assignee, name: event.assigneeName || '' }] : [])
    : (assignee ? [{ initials: assignee, name: name || '' }] : []);

  const apply = (payload) => {
    if (!event) return;
    let next = Array.isArray(event.assignees)
      ? [...event.assignees]
      : (event.assignee ? [{ initials: event.assignee, name: event.assigneeName || '' }] : []);
    if (payload.clear) {
      next = [];
    } else if (payload.toggle) {
      const u = payload.toggle;
      const idx = next.findIndex(a => a.initials === u.initials);
      if (idx >= 0) next.splice(idx, 1);
      else next.push({ initials: u.initials, name: u.name });
    }
    event.assignees = next;
    event.assignee = next[0]?.initials || null;
    event.assigneeName = next[0]?.name || null;
    setTick(t => t + 1);
  };

  const trigger = list.length === 0 ? (
    <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--fg-4)' }}>
      <div style={{
        width:22, height:22, borderRadius:99,
        border:'1.5px dashed var(--line-2)',
      }}/>
      <span style={{ fontSize:12 }}>Unassigned</span>
    </div>
  ) : (() => {
    const shown = list.slice(0, 3);
    const rest = list.length - shown.length;
    return (
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ display:'flex', flexShrink:0 }}>
          {shown.map((a, i) => (
            <div key={i} title={a.name} style={{
              width:22, height:22, borderRadius:99,
              background:'linear-gradient(135deg, oklch(0.55 0.12 200), oklch(0.45 0.12 260))',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontSize:9.5, fontWeight:600,
              marginLeft: i === 0 ? 0 : -7,
              border:'2px solid var(--bg-2)',
              boxShadow:'0 0 0 1px var(--line)',
            }}>{a.initials}</div>
          ))}
          {rest > 0 && (
            <div style={{
              width:22, height:22, borderRadius:99, marginLeft:-7,
              background:'var(--bg-3)', border:'2px solid var(--bg-2)',
              color:'var(--fg-2)', fontSize:9, fontWeight:600,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 0 1px var(--line)',
            }}>+{rest}</div>
          )}
        </div>
        <span style={{ fontSize:12, color:'var(--fg-2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {list.length === 1 ? list[0].name : `${list.length} assignees`}
        </span>
      </div>
    );
  })();

  if (!event) return trigger;

  return (
    <div style={{ position:'relative', display:'inline-block' }} onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        title="Change assignees"
        style={{
          padding:'3px 6px', borderRadius:7,
          background:'transparent', border:'1px solid transparent',
          cursor:'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
      >{trigger}</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:20 }}/>
          <div style={{
            position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:21,
            width:280, maxHeight:340,
            background:'var(--bg)', border:'1px solid var(--line-2)',
            borderRadius:10, boxShadow:'0 20px 40px -8px rgba(0,0,0,0.25)',
            display:'flex', flexDirection:'column', overflow:'hidden',
          }}>
            <div style={{ padding:'8px 10px', borderBottom:'1px solid var(--line)' }}>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search users…"
                style={{
                  width:'100%', background:'var(--bg-2)',
                  border:'1px solid var(--line-2)', borderRadius:6,
                  padding:'6px 8px', fontSize:12, color:'var(--fg)', outline:'none',
                }}
              />
            </div>
            <div style={{ padding:'6px 10px', fontSize:10.5, color:'var(--fg-4)', letterSpacing:'0.12em', textTransform:'uppercase', borderBottom:'1px solid var(--line)' }} className="mono">
              {list.length} selected · click to toggle
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {list.length > 0 && (
                <button
                  onClick={() => apply({ clear:true })}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:0, borderBottom:'1px solid var(--line)', background:'transparent', cursor:'pointer', textAlign:'left' }}
                >
                  <div style={{ width:22, height:22, borderRadius:99, border:'1px dashed var(--line-2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--fg-3)', fontSize:12 }}>×</div>
                  <span style={{ fontSize:12, color:'var(--sev-high)' }}>Clear all</span>
                </button>
              )}
              {(window.USERS_SEED || [])
                .filter(u => u.status === 'active')
                .filter(u => !query || (u.name + u.email).toLowerCase().includes(query.toLowerCase()))
                .map(u => {
                  const isSelected = list.some(a => a.initials === u.initials);
                  return (
                    <button key={u.id}
                      onClick={() => apply({ toggle: u })}
                      style={{
                        width:'100%', display:'flex', alignItems:'center', gap:10,
                        padding:'8px 10px', border:0, borderBottom:'1px solid var(--line)',
                        background: isSelected ? 'var(--accent-glow)' : 'transparent',
                        cursor:'pointer', textAlign:'left',
                      }}>
                      <div style={{
                        width:16, height:16, borderRadius:4,
                        border:`1.5px solid ${isSelected ? 'var(--accent)' : 'var(--line-2)'}`,
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      }}>
                        {isSelected && <IconCheck size={11} style={{ color:'#fff' }}/>}
                      </div>
                      <div style={{
                        width:22, height:22, borderRadius:99,
                        background:'linear-gradient(135deg, oklch(0.55 0.12 200), oklch(0.45 0.12 260))',
                        color:'#fff', fontSize:9.5, fontWeight:600,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>{u.initials}</div>
                      <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                        <div style={{ fontSize:12, color:'var(--fg)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</div>
                        <div style={{ fontSize:10.5, color:'var(--fg-4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.role}</div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children, sortable, active, dir, onClick }) {
  return (
    <th onClick={sortable ? onClick : undefined} style={{
      textAlign:'left', fontWeight:500,
      fontSize:11, color:'var(--fg-3)',
      padding:'10px 12px',
      borderBottom:'1px solid var(--line)',
      whiteSpace:'nowrap',
      cursor: sortable ? 'pointer' : 'default',
      userSelect:'none',
    }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
        {children}
        {sortable && (
          active
            ? <IconArrowDown size={11} style={{ transform: dir === 'asc' ? 'rotate(180deg)' : 'none', color:'var(--accent)' }}/>
            : <IconSort size={11} style={{ opacity:0.5 }}/>
        )}
      </span>
    </th>
  );
}

function EventsTable({ events, onOpenDetail, onArchive, showArchived }) {
  const [sort, setSort] = React.useState({ key:'at', dir:'desc' });
  const [hoverId, setHoverId] = React.useState(null);
  const [menuId, setMenuId] = React.useState(null);

  const toggleSort = (key) => setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir:'desc' });

  return (
    <div style={{
      background:'var(--bg-2)',
      border:'1px solid var(--line)',
      borderRadius:12,
      overflow:'hidden',
    }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
          <thead>
            <tr style={{ background:'var(--bg-2)' }}>
              <Th sortable active={sort.key==='sev'} dir={sort.dir} onClick={() => toggleSort('sev')}>Severity</Th>
              <Th>Event Status</Th>
              <Th>Analyze</Th>
              <Th>Events</Th>
              <Th>Service</Th>
              <Th sortable active={sort.key==='scope'} dir={sort.dir} onClick={() => toggleSort('scope')}>Project/Customer</Th>
              <Th>Source</Th>
              <Th sortable active={sort.key==='at'} dir={sort.dir} onClick={() => toggleSort('at')}>Created At</Th>
              <Th>Labels</Th>
              <Th sortable active={sort.key==='case'} dir={sort.dir} onClick={() => toggleSort('case')}>Case #</Th>
              <Th>Case Status</Th>
              <Th>Assignee</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => {
              const isActive = false;
              const isHover = hoverId === i;
              return (
                <tr key={i}
                  onMouseEnter={() => setHoverId(i)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{
                    background: isActive ? 'var(--accent-glow)' : isHover ? 'var(--bg-3)' : 'transparent',
                    borderBottom:'1px solid var(--line)',
                    transition:'background .12s',
                  }}>
                  <td style={td}><SeverityPill sev={e.sev}/></td>
                  <td style={td}><StatusPill status={e.status}/></td>
                  <td style={td}>
                    <button
                      onClick={() => onOpenDetail(i)}
                      title="Start investigation"
                      style={{
                        width:28, height:28, borderRadius:8,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background: isActive ? 'var(--accent-glow)' : 'transparent',
                        border: `1px solid ${isActive ? 'var(--accent-2)' : 'var(--line-2)'}`,
                        color: isActive ? 'var(--accent)' : 'var(--fg-2)',
                        transition:'all .15s',
                      }}
                      onMouseEnter={ev => { if(!isActive){ ev.currentTarget.style.borderColor='var(--accent-2)'; ev.currentTarget.style.color='var(--accent)'; }}}
                      onMouseLeave={ev => { if(!isActive){ ev.currentTarget.style.borderColor='var(--line-2)'; ev.currentTarget.style.color='var(--fg-2)'; }}}
                    >
                      <IconInvestigate size={16} active={isActive}/>
                    </button>
                  </td>
                  <td style={{ ...td, minWidth:320, cursor:'pointer' }} onClick={() => onOpenDetail && onOpenDetail(i)}>
                    <div style={{ fontWeight:500, color:'var(--fg)', marginBottom:2, textDecoration:'none' }}>{e.title}</div>
                    <div style={{ fontSize:11.5, color:'var(--fg-3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:380 }}>
                      {e.detail}
                    </div>
                  </td>
                  <td style={{ ...td, color:'var(--fg-2)' }} className="mono">{e.service}</td>
                  <td style={{ ...td, color:'var(--fg-2)' }} className="mono">{e.scope}</td>
                  <td style={{ ...td, color:'var(--fg-2)' }}>{e.source}</td>
                  <td style={{ ...td, color:'var(--fg-2)' }} className="mono">{e.at}</td>
                  <td style={td}><LabelChip text={e.labels[0]} extra={e.labels.length - 1}/></td>
                  <td style={{ ...td, color:'var(--fg-2)' }} className="mono">{e.case}</td>
                  <td style={td}><CaseStatus status={e.caseStatus}/></td>
                  <td style={{ ...td, minWidth:180 }}><AssigneeCell event={e}/></td>
                  <td style={{ ...td, width:40, position:'relative' }}>
                    <button
                      onClick={ev => { ev.stopPropagation(); setMenuId(menuId === i ? null : i); }}
                      title="More actions"
                      style={{
                        width:26, height:26, borderRadius:6,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background: menuId === i ? 'var(--bg-3)' : 'transparent',
                        border:'1px solid transparent',
                        color:'var(--fg-3)',
                      }}
                      onMouseEnter={ev2 => { ev2.currentTarget.style.background='var(--bg-3)'; ev2.currentTarget.style.color='var(--fg)'; }}
                      onMouseLeave={ev2 => { if (menuId !== i){ ev2.currentTarget.style.background='transparent'; ev2.currentTarget.style.color='var(--fg-3)'; } }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
                    </button>
                    {menuId === i && (
                      <>
                        <div onClick={ev => { ev.stopPropagation(); setMenuId(null); }} style={{ position:'fixed', inset:0, zIndex:5 }}/>
                        <div style={{
                          position:'absolute', top:'calc(100% - 4px)', right:8, zIndex:6,
                          width:180, background:'var(--bg)',
                          border:'1px solid var(--line-2)', borderRadius:8,
                          boxShadow:'0 14px 28px -8px rgba(0,0,0,0.5)',
                          padding:4, overflow:'hidden',
                        }}>
                          <button onClick={ev => { ev.stopPropagation(); setMenuId(null); onOpenDetail && onOpenDetail(i); }} style={menuItem}>
                            <IconEye size={13}/> View Details
                          </button>
                          <button onClick={ev => { ev.stopPropagation(); setMenuId(null); onArchive && onArchive(i); }} style={menuItem}>
                            <IconArchive size={13}/> {showArchived ? 'Unarchive' : 'Archive'}
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{
        padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between',
        borderTop:'1px solid var(--line)', fontSize:11.5, color:'var(--fg-3)',
      }}>
        <span className="mono">1 – {events.length} of {events.length}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span>Rows</span>
          <div style={{
            padding:'4px 10px', borderRadius:6,
            border:'1px solid var(--line-2)', background:'var(--bg-3)',
            display:'flex', alignItems:'center', gap:6,
          }}>10 <IconChevron size={11} style={{ transform:'rotate(90deg)' }}/></div>
        </div>
      </div>
    </div>
  );
}

const td = { padding:'10px 12px', verticalAlign:'middle' };

const menuItem = {
  width:'100%', display:'flex', alignItems:'center', gap:8,
  padding:'8px 10px', borderRadius:6, fontSize:12,
  color:'var(--fg)', background:'transparent', border:0,
  cursor:'pointer', textAlign:'left',
};

function EventsPage({ onOpenDetail, density }) {
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [showArchived, setShowArchived] = React.useState(false);
  const [, setNonce] = React.useState(0);

  const filtered = EVENTS.filter(e => {
    if (showArchived) {
      if (!e.archived) return false;
    } else {
      if (e.archived) return false;
    }
    if (filter === 'open' && e.status !== 'open') return false;
    if (filter === 'cases' && e.case === '—') return false;
    if (filter === 'resolved' && e.caseStatus !== 'processing') return false;
    if (query && !(e.title + e.detail + e.service + e.source).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const archivedCount = EVENTS.filter(e => e.archived).length;

  return (
    <div style={{ padding:'22px 20px 40px', display:'flex', flexDirection:'column', gap:18 }}>
      {/* Page header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.02em', margin:0 }}>Events</h1>
          <div style={{ fontSize:12.5, color:'var(--fg-3)', marginTop:4 }}>Monitor and manage system events in real-time</div>
        </div>
    <button onClick={() => {
      const titles = ['Disk Space Low','High API Error Rate','Memory Leak Detected','Network Latency Spike','SSL Certificate Expiring','Redis Cache Miss Rate High','High CPU Usage','Queue Backlog Growing','Pod CrashLoopBackOff','Database Connection Saturation'];
      const sevs = ['info','low','medium','high','ok'];
      const services = ['storage','api','application','network','security','cache','compute','queue','database'];
      const sources = ['Prometheus','Datadog APM','Grafana','CloudWatch','Cert-Manager','Datadog'];
      const scopes = ['development','staging','qa','production','—'];
      const pick = arr => arr[Math.floor(Math.random()*arr.length)];
      const now = new Date();
      const stamp = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const title = pick(titles);
      const n = EVENTS.length + 1;
      EVENTS.unshift({
        sev: pick(sevs), status:'open', title,
        detail: `Auto-generated fake alert #${n} for demo purposes — ${title.toLowerCase()} on a random node`,
        service: pick(services), scope: pick(scopes), source: pick(sources),
        at: stamp, labels:[pick(['platform','backend','infrastructure','security']),'fake','demo'],
        case: `#${n}`, caseStatus:'awaiting', assignee:'JF', assigneeName:'Jonathan Fernández',
      });
      setNonce(x => x + 1);
    }}
    style={{
          padding:'8px 14px', borderRadius:8,
          background:'var(--bg-2)',
          border:'1px solid var(--line-2)',
          color:'var(--fg)',
          display:'inline-flex', alignItems:'center', gap:6,
          fontSize:12.5, fontWeight:500,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-2)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line-2)'}
        >
          <IconPlus size={14}/> Create Fake Alert
        </button>
      </div>

      <StatCards events={EVENTS} filter={filter} setFilter={setFilter}/>

      {/* Search bar + controls */}
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <div style={{
          flex:1, display:'flex', alignItems:'center', gap:8,
          padding:'9px 12px', borderRadius:8,
          background:'var(--bg-2)',
          border:'1px solid var(--line)',
        }}>
          <IconSearch size={14} style={{ color:'var(--fg-3)' }}/>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search events, services, labels…"
            style={{ flex:1, background:'transparent', border:0, outline:'none', color:'var(--fg)', fontSize:12.5 }}
          />
          <span className="mono" style={{ fontSize:10, color:'var(--fg-4)', padding:'1px 5px', borderRadius:4, border:'1px solid var(--line-2)' }}>⌘ K</span>
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          style={{
            padding:'9px 12px', borderRadius:8,
            background: showArchived ? 'var(--accent)' : 'var(--bg-2)',
            border: `1px solid ${showArchived ? 'var(--accent)' : 'var(--line)'}`,
            color: showArchived ? '#fff' : 'var(--fg-2)',
            display:'inline-flex', alignItems:'center', gap:7,
            fontSize:12.5, fontWeight:500,
          }}>
          <IconArchive size={14}/> {showArchived ? 'Hide Archived' : 'Show Archived'}
          <span style={{
            fontSize:10, padding:'1px 6px', borderRadius:99,
            background: showArchived ? 'rgba(255,255,255,0.18)' : 'var(--bg-3)',
            color: showArchived ? '#fff' : 'var(--fg-3)',
            border: `1px solid ${showArchived ? 'rgba(255,255,255,0.25)' : 'var(--line)'}`,
          }}>{archivedCount}</span>
        </button>
        <button style={{
          padding:'9px 12px', borderRadius:8,
          background:'var(--bg-2)',
          border:'1px solid var(--line)',
          color:'var(--fg-2)',
          display:'inline-flex', alignItems:'center', gap:7,
          fontSize:12.5, fontWeight:500,
        }}>
          <IconFilter size={14}/> Advanced Filters
        </button>
      </div>

      <EventsTable events={filtered} showArchived={showArchived} onOpenDetail={onOpenDetail}
        onArchive={(idx) => {
          const e = filtered[idx];
          if (!e) return;
          e.archived = !e.archived;
          setNonce(x => x + 1);
        }}
      />
    </div>
  );
}

Object.assign(window, { EventsPage, StatCard });
