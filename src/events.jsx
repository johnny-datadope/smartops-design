// Events dashboard — stat cards, search/filter, and the events table.

function StatCard({ label, value, accent, icon, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={'stat-card card' + (active ? ' stat-card--active' : '')}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, margin: 0 }}>{value}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 8, marginBottom: 0 }}>{label}</p>
        </div>
        <div className="kpi-icon" style={{
          background: `color-mix(in srgb, ${accent} 15%, transparent)`,
          color: accent,
        }}>{icon}</div>
      </div>
    </button>
  );
}

function StatCards({ events, filter, setFilter }) {
  const { t } = useI18n();
  const total = events.length;
  const open = events.filter(e => e.status === 'open').length;
  const cases = events.filter(e => e.case !== '—' && e.caseStatus !== 'closed').length;
  const resolved = events.filter(e => e.caseStatus === 'closed' || e.status === 'closed').length;
  const cards = [
    { key: 'all', label: t.alerts.total, value: total, accent: KPI_COLORS.total, icon: <IconActivity size={16}/> },
    { key: 'open', label: t.alerts.openEvents, value: open, accent: KPI_COLORS.open, icon: <IconAlert size={16}/> },
    { key: 'cases', label: t.alerts.openCases, value: cases, accent: KPI_COLORS.cases, icon: <IconEye size={16}/> },
    { key: 'resolved', label: t.alerts.resolvedCases, value: resolved, accent: KPI_COLORS.resolved, icon: <IconCheck size={16}/> },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {cards.map(c => (
        <StatCard key={c.key} {...c} active={filter === c.key} onClick={() => setFilter(c.key)}/>
      ))}
    </div>
  );
}

function AssigneeCell({ event, assignee, name }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [, setTick] = React.useState(0);

  const list = event
    ? (Array.isArray(event.assignees) ? event.assignees
        : event.assignee ? [{ initials: event.assignee, name: event.assigneeName || '' }] : [])
    : (assignee ? [{ initials: assignee, name: name || '' }] : []);

  const apply = (payload) => {
    if (!event) return;
    let next = Array.isArray(event.assignees)
      ? [...event.assignees]
      : (event.assignee ? [{ initials: event.assignee, name: event.assigneeName || '' }] : []);
    if (payload.clear) next = [];
    else if (payload.toggle) {
      const u = payload.toggle;
      const idx = next.findIndex(a => a.initials === u.initials);
      if (idx >= 0) next.splice(idx, 1);
      else next.push({ initials: u.initials, name: u.name });
    }
    event.assignees = next;
    event.assignee = next[0]?.initials || null;
    event.assigneeName = next[0]?.name || null;
    setTick(n => n + 1);
  };

  const trigger = list.length === 0 ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-foreground)' }}>
      <div className="avatar--empty"/>
      <span style={{ fontSize: '0.875rem' }}>{t.filters.unassigned}</span>
    </div>
  ) : (() => {
    const shown = list.slice(0, 3);
    const rest = list.length - shown.length;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="avatar-stack">
          {shown.map((a, i) => (
            <div key={i} className="avatar" title={a.name} style={{ zIndex: shown.length - i }}>{a.initials}</div>
          ))}
          {rest > 0 && <div className="avatar" style={{ zIndex: 0 }}>+{rest}</div>}
        </div>
        {list.length <= 3 && (
          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
            {list.map(a => a.name).join(', ')}
          </span>
        )}
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
            <AssigneePickerBody
              assigned={list}
              hasCase={event?.case && event.case !== '—'}
              onToggle={u => apply({ toggle: u })}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children, sortable, active, dir, onClick }) {
  if (!sortable) {
    return <th className="table-th">{children}</th>;
  }
  return (
    <th className="table-th">
      <button type="button" className="th-sort-btn" onClick={onClick}>
        {children}
        {active
          ? <IconArrowDown size={12} style={{ transform: dir === 'asc' ? 'rotate(180deg)' : 'none' }}/>
          : <IconSort size={12} style={{ opacity: 0.5 }}/>}
      </button>
    </th>
  );
}

function EventsTable({ events, onOpenDetail, onArchive, showArchived }) {
  const { t } = useI18n();
  const [sort, setSort] = React.useState({ key: 'at', dir: 'desc' });
  const [hoverId, setHoverId] = React.useState(null);
  const [menuId, setMenuId] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const toggleSort = (key) => setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });

  const sorted = React.useMemo(() => {
    const list = [...events];
    const dir = sort.dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (sort.key === 'at') {
        av = parseEventAt(a.at)?.getTime() || 0;
        bv = parseEventAt(b.at)?.getTime() || 0;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return list;
  }, [events, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  React.useEffect(() => { setPage(0); }, [events.length, pageSize]);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)' }}>
              <Th sortable active={sort.key === 'sev'} dir={sort.dir} onClick={() => toggleSort('sev')}>{t.alerts.severity}</Th>
              <Th>{t.alerts.eventStatus}</Th>
              <Th>{t.alerts.analyze}</Th>
              <Th>{t.alerts.alert}</Th>
              <Th>{t.alerts.service}</Th>
              <Th>{t.alerts.customer}</Th>
              <Th>{t.alerts.project}</Th>
              <Th>{t.alerts.environment}</Th>
              <Th>{t.alerts.source}</Th>
              <Th sortable active={sort.key === 'at'} dir={sort.dir} onClick={() => toggleSort('at')}>{t.alerts.time}</Th>
              <Th>{t.alerts.labels}</Th>
              <Th sortable active={sort.key === 'case'} dir={sort.dir} onClick={() => toggleSort('case')}>{t.alerts.caseNum}</Th>
              <Th>{t.alerts.caseStatus}</Th>
              <Th>{t.alerts.assignee}</Th>
              <Th>{t.common.view}</Th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={15} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                  {t.alerts.noAlertsMatching}
                </td>
              </tr>
            ) : pageRows.map((e) => {
              const i = EVENTS.indexOf(e);
              const isHover = hoverId === i;
              return (
                <tr key={i}
                  onMouseEnter={() => setHoverId(i)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{
                    background: isHover ? 'var(--bg-3)' : 'transparent',
                    borderBottom: '1px solid var(--line)',
                    transition: 'background .12s',
                  }}>
                  <td style={td}><SeverityBadge sev={e.sev} severity={e.severity}/></td>
                  <td style={td}><AlertStatusBadge status={e.status} alertStatus={e.alert_status}/></td>
                  <td style={td}>
                    <button
                      type="button"
                      onClick={() => onOpenDetail(i)}
                      title={t.alerts.analyze}
                      className="btn btn--ghost"
                      style={{
                        width: 44, height: 44, padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)',
                      }}
                    >
                      <IconBrainCircuit size={28}/>
                    </button>
                  </td>
                  <td style={{ ...td, minWidth: 280 }}>
                    <button type="button" className="event-cell-link" onClick={() => onOpenDetail && onOpenDetail(i)}>
                      <div className="event-cell-title">{e.title}</div>
                      <div className="event-cell-desc">{e.detail}</div>
                    </button>
                  </td>
                  <td style={{ ...td, color: 'var(--fg-2)' }} className="mono">{e.service}</td>
                  <td style={{ ...td, color: 'var(--fg-2)' }}>{e.source_client || '—'}</td>
                  <td style={{ ...td, color: 'var(--fg-2)' }}>{e.source_project || '—'}</td>
                  <td style={{ ...td, color: 'var(--fg-2)' }}>{e.source_environment || '—'}</td>
                  <td style={{ ...td, color: 'var(--fg-2)' }}>{e.source}</td>
                  <td style={{ ...td, color: 'var(--fg-2)' }} className="mono">{e.at}</td>
                  <td style={td}>
                    {e.labels && e.labels.length > 0
                      ? <TagBadge tagKey="team" value={e.labels[0]} extra={e.labels.length - 1}/>
                      : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                  </td>
                  <td style={{ ...td, color: 'var(--fg-2)' }} className="mono">{e.case}</td>
                  <td style={td}><CaseStatusBadge status={e.caseStatus} caseStatus={e.case_status}/></td>
                  <td style={{ ...td, minWidth: 160 }}><AssigneeCell event={e}/></td>
                  <td style={{ ...td, width: 40, position: 'relative' }}>
                    <button
                      onClick={ev => { ev.stopPropagation(); setMenuId(menuId === i ? null : i); }}
                      title="More actions"
                      style={{
                        width: 26, height: 26, borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: menuId === i ? 'var(--bg-3)' : 'transparent',
                        border: '1px solid transparent',
                        color: 'var(--fg-3)',
                      }}
                      onMouseEnter={ev2 => { ev2.currentTarget.style.background = 'var(--bg-3)'; ev2.currentTarget.style.color = 'var(--fg)'; }}
                      onMouseLeave={ev2 => { if (menuId !== i) { ev2.currentTarget.style.background = 'transparent'; ev2.currentTarget.style.color = 'var(--fg-3)'; } }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
                    </button>
                    {menuId === i && (
                      <>
                        <div onClick={ev => { ev.stopPropagation(); setMenuId(null); }} style={{ position: 'fixed', inset: 0, zIndex: 5 }}/>
                        <div style={{
                          position: 'absolute', top: 'calc(100% - 4px)', right: 8, zIndex: 6,
                          width: 180, background: 'var(--bg)',
                          border: '1px solid var(--line-2)', borderRadius: 8,
                          boxShadow: '0 14px 28px -8px rgba(0,0,0,0.5)',
                          padding: 4, overflow: 'hidden',
                        }}>
                          <button onClick={ev => { ev.stopPropagation(); setMenuId(null); onOpenDetail && onOpenDetail(i); }} style={menuItem}>
                            <IconEye size={13}/> {t.common.viewDetails}
                          </button>
                          <button onClick={ev => { ev.stopPropagation(); setMenuId(null); onArchive && onArchive(i); }} style={menuItem}>
                            <IconArchive size={13}/> {showArchived ? t.common.unarchive : t.common.archive}
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
      <TablePagination
        currentPage={safePage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={sorted.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

function TablePagination({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }) {
  const { t } = useI18n();
  const startItem = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxPages = 5;
    const page1 = currentPage + 1;
    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page1 <= 3) {
        for (let i = 2; i <= 4; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (page1 >= totalPages - 2) {
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push('ellipsis');
        pages.push(page1 - 1);
        pages.push(page1);
        pages.push(page1 + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="table-pagination">
      <span className="mono">{startItem}–{endItem} / {totalItems}</span>
      {totalPages > 1 && (
        <div className="table-pagination__pages">
          <button type="button" className="page-num" disabled={currentPage <= 0} onClick={() => onPageChange(currentPage - 1)}>‹</button>
          {getPageNumbers().map((page, i) =>
            page === 'ellipsis' ? (
              <span key={'e' + i} style={{ padding: '0 2px', userSelect: 'none' }}>…</span>
            ) : (
              <button
                key={page}
                type="button"
                className={'page-num' + (page === currentPage + 1 ? ' is-active' : '')}
                onClick={() => onPageChange(page - 1)}
              >{page}</button>
            )
          )}
          <button type="button" className="page-num" disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)}>›</button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span>{t.common.rows}</span>
        <select value={pageSize} onChange={ev => onPageSizeChange(+ev.target.value)} style={{
          height: 24, width: 56, padding: '0 8px', borderRadius: 6,
          border: '1px solid color-mix(in oklch, var(--border) 40%, transparent)',
          background: 'transparent', color: 'var(--foreground)', fontSize: '0.6875rem',
        }}>
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

function ActiveFiltersBar({ filters, onChange, myInitials }) {
  const { t } = useI18n();
  const allUsers = (window.USERS_SEED || []).filter(u => u.status === 'active');
  const chips = [];

  filters.statuses.forEach(s => {
    const label = (STATUS_META[s] && STATUS_META[s].label) || s;
    chips.push({ key: 'status-' + s, label: t.filters.eventStatus + ': ' + label, remove: () => onChange({ ...filters, statuses: filters.statuses.filter(x => x !== s) }) });
  });
  filters.caseStatuses.forEach(s => {
    const label = (CASE_META[s] && CASE_META[s].label) || s;
    chips.push({ key: 'caseSt-' + s, label: t.filters.caseStatus + ': ' + label, remove: () => onChange({ ...filters, caseStatuses: filters.caseStatuses.filter(x => x !== s) }) });
  });
  if (filters.caseId.trim()) {
    chips.push({ key: 'caseId', label: t.filters.caseId + ': #' + filters.caseId.trim(), remove: () => onChange({ ...filters, caseId: '' }) });
  }
  filters.severities.forEach(s => {
    const label = (SEV_META[s] && SEV_META[s].label) || s;
    chips.push({ key: 'sev-' + s, label: t.filters.severity + ': ' + label, remove: () => onChange({ ...filters, severities: filters.severities.filter(x => x !== s) }) });
  });
  filters.customers.forEach(s => {
    chips.push({ key: 'cust-' + s, label: t.filters.customer + ': ' + s, remove: () => onChange({ ...filters, customers: filters.customers.filter(x => x !== s) }) });
  });
  filters.scopes.forEach(s => {
    chips.push({ key: 'scope-' + s, label: t.filters.project + ': ' + s, remove: () => onChange({ ...filters, scopes: filters.scopes.filter(x => x !== s) }) });
  });
  filters.environments.forEach(s => {
    chips.push({ key: 'env-' + s, label: t.filters.environment + ': ' + s, remove: () => onChange({ ...filters, environments: filters.environments.filter(x => x !== s) }) });
  });
  if (filters.unassigned) {
    chips.push({ key: 'unassigned', label: t.filters.unassigned, remove: () => onChange({ ...filters, unassigned: false }) });
  }
  if (filters.mine) {
    chips.push({ key: 'mine', label: t.filters.assignedToMe, remove: () => onChange({ ...filters, mine: false }) });
  }
  filters.users.forEach(u => {
    const name = allUsers.find(x => x.initials === u)?.name || u;
    chips.push({ key: 'user-' + u, label: t.filters.assignee + ': ' + name, remove: () => onChange({ ...filters, users: filters.users.filter(x => x !== u) }) });
  });
  if (filters.from) {
    chips.push({ key: 'from', label: t.filters.dateFrom + ': ' + filters.from, remove: () => onChange({ ...filters, from: '' }) });
  }
  if (filters.to) {
    chips.push({ key: 'to', label: t.filters.dateTo + ': ' + filters.to, remove: () => onChange({ ...filters, to: '' }) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="active-filters">
      <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{t.filters.activeFilters}:</span>
      {chips.map(c => (
        <span key={c.key} className="badge badge--secondary filter-chip">
          {c.label}
          <button type="button" onClick={c.remove} aria-label={t.filters.clearAll}><IconClose size={12}/></button>
        </span>
      ))}
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

const ADV_FILTERS_INITIAL = {
  statuses: [],
  caseStatuses: [],
  caseId: '',
  severities: [],
  customers: [],
  scopes: [],
  environments: [],
  unassigned: false,
  mine: false,
  users: [],
  from: '',
  to: '',
};

// Parse "DD/MM/YYYY, HH:MM" → Date
function parseEventAt(s) {
  if (!s) return null;
  const [date, time] = s.split(', ');
  const [d, m, y] = date.split('/').map(Number);
  const [hh, mm] = (time || '0:0').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

function advFilterCount(f) {
  let n = 0;
  if (f.statuses.length) n++;
  if (f.caseStatuses.length) n++;
  if (f.caseId.trim()) n++;
  if (f.severities.length) n++;
  if (f.customers.length) n++;
  if (f.scopes.length) n++;
  if (f.environments.length) n++;
  if (f.unassigned) n++;
  if (f.mine) n++;
  if (f.users.length) n++;
  if (f.from) n++;
  if (f.to) n++;
  return n;
}

function EventsPage({ onOpenDetail, currentUser }) {
  const { t } = useI18n();
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [showArchived, setShowArchived] = React.useState(false);
  const [advFilters, setAdvFilters] = React.useState(ADV_FILTERS_INITIAL);
  const [advOpen, setAdvOpen] = React.useState(false);
  const [, setNonce] = React.useState(0);

  const myInitials = (currentUser?.name || '').split(/\s+/).map(s => s[0]).slice(0,2).join('').toUpperCase();

  const filtered = EVENTS.filter(e => {
    if (showArchived) {
      if (!e.archived) return false;
    } else {
      if (e.archived) return false;
    }
    if (filter === 'open' && e.status !== 'open') return false;
    if (filter === 'cases' && (e.case === '—' || e.caseStatus === 'closed')) return false;
    if (filter === 'resolved' && e.caseStatus !== 'closed' && e.status !== 'closed') return false;
    if (query && !(e.title + e.detail + e.service + e.source).toLowerCase().includes(query.toLowerCase())) return false;

    if (advFilters.statuses.length && !advFilters.statuses.includes(e.status)) return false;
    if (advFilters.caseStatuses.length && !advFilters.caseStatuses.includes(e.caseStatus)) return false;
    if (advFilters.caseId.trim()) {
      const needle = advFilters.caseId.trim().toLowerCase().replace(/^#/, '');
      const haystack = (e.case || '').toLowerCase().replace(/^#/, '');
      if (!haystack.includes(needle)) return false;
    }
    if (advFilters.severities.length && !advFilters.severities.includes(e.sev)) return false;
    if (advFilters.customers.length && !advFilters.customers.includes(e.source_client)) return false;
    if (advFilters.scopes.length && !advFilters.scopes.includes(e.scope)) return false;
    if (advFilters.environments.length && !advFilters.environments.includes(e.source_environment)) return false;

    const assignees = Array.isArray(e.assignees)
      ? e.assignees
      : (e.assignee ? [{ initials: e.assignee }] : []);
    if (advFilters.unassigned && assignees.length > 0) return false;
    if (advFilters.mine && !assignees.some(a => a.initials === myInitials)) return false;
    if (advFilters.users.length && !assignees.some(a => advFilters.users.includes(a.initials))) return false;

    if (advFilters.from || advFilters.to) {
      const eventAt = parseEventAt(e.at);
      if (!eventAt) return false;
      if (advFilters.from && eventAt < new Date(advFilters.from + 'T00:00:00')) return false;
      if (advFilters.to && eventAt > new Date(advFilters.to + 'T23:59:59')) return false;
    }
    return true;
  });

  const advCount = advFilterCount(advFilters);

  const archivedCount = EVENTS.filter(e => e.archived).length;

  return (
    <div className="layout-page">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{t.alerts.title}</h1>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: 4 }}>{t.alerts.subtitle}</div>
        </div>
    <button onClick={() => {
      const titles = ['Disk Space Low', 'High API Error Rate', 'Memory Leak Detected', 'Network Latency Spike', 'SSL Certificate Expiring'];
      const sevs = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const components = ['storage', 'api', 'application', 'network', 'security'];
      const sources = ['Prometheus', 'Datadog APM', 'Grafana', 'CloudWatch', 'Cert-Manager'];
      const clients = ['Acme Corp', 'Globex', 'Initech'];
      const projects = ['platform', 'payments', 'analytics'];
      const envs = ['development', 'staging', 'production'];
      const pick = arr => arr[Math.floor(Math.random() * arr.length)];
      const now = new Date();
      const stamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const title = pick(titles);
      const n = EVENTS.length + 1;
      EVENTS.unshift(alertRow({
        severity: pick(sevs),
        alert_status: 'OPEN',
        alert_name: title,
        alert_description: `Auto-generated demo alert #${n}`,
        component: pick(components),
        source_client: pick(clients),
        source_project: pick(projects),
        source_environment: pick(envs),
        source_name: pick(sources),
        created_at: stamp,
        tags: [{ key: 'team', value: 'demo' }, { key: 'tag', value: 'fake' }],
        case_id: 1000 + n,
        case_status: 'AWAITING_ACTION',
        agent_status: 'PENDING',
        assignments: [],
        archived: false,
      }));
      setNonce(x => x + 1);
    }}
    className="btn btn--outline btn--sm"
        >
          <IconPlus size={14}/> {t.alerts.createFake}
        </button>
      </div>

      <StatCards events={EVENTS} filter={filter} setFilter={setFilter}/>

      {/* Search bar + controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="input-wrap" style={{ flex: 1, minWidth: 200 }}>
          <IconSearch size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}/>
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.common.search}
          />
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={'btn btn--sm ' + (showArchived ? 'btn--primary' : 'btn--outline')}
        >
          <IconArchive size={14}/> {showArchived ? t.alerts.hideArchived : t.alerts.showArchived}
          <span className="badge badge--secondary" style={{ marginLeft: 2 }}>{archivedCount}</span>
        </button>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAdvOpen(o => !o)}
            className={'btn btn--sm ' + (advOpen || advCount ? 'btn--primary' : 'btn--outline')}
          >
            <IconFilter size={14}/> {t.filters.advancedFilters}
            <span className="badge badge--secondary" style={{ marginLeft: 2 }}>{advCount}</span>
          </button>
          {advOpen && (
            <AdvancedFiltersPopover
              value={advFilters}
              onChange={setAdvFilters}
              onClose={() => setAdvOpen(false)}
            />
          )}
        </div>
      </div>

      <ActiveFiltersBar filters={advFilters} onChange={setAdvFilters} myInitials={myInitials}/>

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

function AdvancedFiltersPopover({ value, onChange, onClose }) {
  const { t } = useI18n();
  const set = (patch) => onChange({ ...value, ...patch });
  const clearAll = () => onChange(ADV_FILTERS_INITIAL);
  const hasAny = advFilterCount(value) > 0;

  const allUsers = (window.USERS_SEED || []).filter(u => u.status === 'active');
  const scopes = Array.from(new Set(EVENTS.map(e => e.scope).filter(Boolean)));
  const customers = Array.from(new Set(EVENTS.map(e => e.source_client).filter(v => v && v !== '—')));
  const environments = Array.from(new Set(EVENTS.map(e => e.source_environment).filter(v => v && v !== '—')));

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:30 }}/>
      <div style={{
        position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:31,
        width:340, maxHeight:'min(640px, calc(100vh - 140px))',
        background:'var(--bg-2)', border:'1px solid var(--line-2)',
        borderRadius:12, boxShadow:'0 28px 60px -14px rgba(0,0,0,0.45)',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px 10px', borderBottom:'1px solid var(--line)' }}>
          <div style={{ fontSize:14, fontWeight:600 }}>{t.filters.advancedFilters}</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {hasAny && <button type="button" onClick={clearAll} style={{ fontSize:11.5, color:'var(--fg-3)', background:'transparent', border:0, cursor:'pointer' }}>{t.filters.clearAll}</button>}
            <button type="button" onClick={onClose} style={{ width:24, height:24, borderRadius:6, border:'1px solid var(--line)', color:'var(--fg-2)', display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', cursor:'pointer' }}>
              <IconClose size={12}/>
            </button>
          </div>
        </div>

        <div style={{ padding:'12px 16px', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          <AdvSection label={t.filters.eventStatus}>
            <MultiSelect
              placeholder={t.filters.eventStatus}
              options={Object.entries(STATUS_META).map(([v,m]) => ({ value:v, label:m.label }))}
              selected={value.statuses}
              onChange={(statuses) => set({ statuses })}
            />
          </AdvSection>

          <AdvSection label={t.filters.caseStatus}>
            <MultiSelect
              placeholder={t.filters.caseStatus}
              options={Object.entries(CASE_META).map(([v,m]) => ({ value:v, label:m.label }))}
              selected={value.caseStatuses}
              onChange={(caseStatuses) => set({ caseStatuses })}
            />
          </AdvSection>

          <AdvSection label={t.filters.caseId}>
            <input
              className="input"
              value={value.caseId}
              onChange={e => set({ caseId: e.target.value })}
              placeholder={t.filters.caseId}
              style={{ fontSize: '0.8125rem' }}
            />
          </AdvSection>

          <AdvSection label={t.filters.severity}>
            <MultiSelect
              placeholder={t.filters.selectSeverities}
              options={Object.entries(SEV_META).map(([v,m]) => ({ value:v, label:m.label }))}
              selected={value.severities}
              onChange={(severities) => set({ severities })}
            />
          </AdvSection>

          <AdvSection label={t.filters.customer}>
            <MultiSelect
              placeholder={t.filters.customer}
              options={customers.map(s => ({ value:s, label:s }))}
              selected={value.customers}
              onChange={(customers) => set({ customers })}
            />
          </AdvSection>

          <AdvSection label={t.filters.project}>
            <MultiSelect
              placeholder={t.filters.project}
              options={scopes.map(s => ({ value:s, label:s }))}
              selected={value.scopes}
              onChange={(scopes) => set({ scopes })}
            />
          </AdvSection>

          <AdvSection label={t.filters.environment}>
            <MultiSelect
              placeholder={t.filters.environment}
              options={environments.map(s => ({ value:s, label:s }))}
              selected={value.environments}
              onChange={(environments) => set({ environments })}
            />
          </AdvSection>

          <AdvSection label={t.filters.assignee} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
            <label style={advCheckRow}>
              <input type="checkbox" checked={value.unassigned} onChange={e => set({ unassigned: e.target.checked })}/>
              <span>{t.filters.unassigned}</span>
            </label>
            <label style={advCheckRow}>
              <input type="checkbox" checked={value.mine} onChange={e => set({ mine: e.target.checked })}/>
              <span>{t.filters.assignedToMe}</span>
            </label>
            <div style={{ marginTop:10, fontSize:11.5, color:'var(--fg-3)' }}>{t.filters.assignee}</div>
            <MultiSelect
              placeholder={t.filters.assignee}
              options={allUsers.map(u => ({ value:u.initials, label:u.name }))}
              selected={value.users}
              onChange={(users) => set({ users })}
            />
          </AdvSection>

          <AdvSection label={t.filters.dateFrom} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}>
            <div style={{ fontSize:11.5, color:'var(--fg-3)', marginBottom:4 }}>{t.filters.dateFrom}</div>
            <input type="date" value={value.from} onChange={e => set({ from: e.target.value })} style={advInput}/>
            <div style={{ fontSize:11.5, color:'var(--fg-3)', margin:'10px 0 4px' }}>{t.filters.dateTo}</div>
            <input type="date" value={value.to} onChange={e => set({ to: e.target.value })} style={advInput}/>
          </AdvSection>
        </div>
      </div>
    </>
  );
}

function AdvSection({ label, icon, children }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, fontWeight:600, color:'var(--fg)', marginBottom:6 }}>
        {icon}{label}
      </div>
      {children}
    </div>
  );
}

function MultiSelect({ placeholder, options, selected, onChange, searchable = true }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  React.useEffect(() => { if (!open) setQuery(''); }, [open]);
  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? (options.find(o => o.value === selected[0])?.label || selected[0])
      : t.filters.selectedCount.replace('{count}', selected.length);
  const toggle = (v) => {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  };
  const filtered = query
    ? options.filter(o => `${o.label} ${o.value}`.toLowerCase().includes(query.toLowerCase()))
    : options;
  return (
    <div style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          ...advInput,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          color: selected.length ? 'var(--fg)' : 'var(--fg-3)',
          textAlign:'left',
        }}>
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
        <IconFilter size={12} style={{ color:'var(--fg-3)', flexShrink:0 }}/>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:40 }}/>
          <div style={{
            position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:41,
            maxHeight:260,
            background:'var(--bg)', border:'1px solid var(--line-2)',
            borderRadius:8, boxShadow:'0 20px 40px -8px rgba(0,0,0,0.45)',
            display:'flex', flexDirection:'column', overflow:'hidden',
          }}>
            {searchable && (
              <div style={{ padding:6, borderBottom:'1px solid var(--line)' }}>
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t.filters.selectPlaceholder}
                  style={{
                    width:'100%', background:'var(--bg-2)',
                    border:'1px solid var(--line-2)', borderRadius:6,
                    padding:'6px 8px', fontSize:12, color:'var(--fg)', outline:'none',
                  }}
                />
              </div>
            )}
            <div style={{ overflowY:'auto', padding:4 }}>
              {filtered.map(o => {
                const isSel = selected.includes(o.value);
                return (
                  <button key={o.value}
                    onClick={() => toggle(o.value)}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', gap:8,
                      padding:'7px 9px', borderRadius:6,
                      background: isSel ? 'var(--accent-glow)' : 'transparent',
                      fontSize:12, color:'var(--fg)', textAlign:'left',
                    }}>
                    <div style={{
                      width:14, height:14, borderRadius:3,
                      border:`1.5px solid ${isSel ? 'var(--accent)' : 'var(--line-2)'}`,
                      background: isSel ? 'var(--accent)' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    }}>
                      {isSel && <IconCheck size={9} style={{ color:'#fff' }}/>}
                    </div>
                    <span style={{ flex:1 }}>{o.label}</span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ padding:10, fontSize:11.5, color:'var(--fg-3)' }}>
                  {options.length === 0 ? t.filters.noOptions : t.filters.noMatches}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const advInput = {
  width:'100%',
  padding:'8px 10px',
  borderRadius:7,
  background:'var(--bg)',
  border:'1px solid var(--line-2)',
  color:'var(--fg)',
  fontSize:12.5,
  outline:'none',
  fontFamily:'inherit',
};

const advCheckRow = {
  display:'flex', alignItems:'center', gap:8,
  padding:'4px 0',
  fontSize:12.5, color:'var(--fg)',
  cursor:'pointer',
};

Object.assign(window, { EventsPage, StatCard });
