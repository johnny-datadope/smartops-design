// Events dashboard — stat cards, search/filter, and the events table.

function StatCard({ label, value, accent, Icon, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={'stat-card card' + (active ? ' stat-card--active' : '')}>
      <div className="stat-card__content">
        <div className="stat-card__row">
          <div className="stat-card__text">
            <p className="stat-card__value">{value}</p>
            <p className="stat-card__label">{label}</p>
          </div>
          <div className="kpi-icon" style={{
            background: `color-mix(in srgb, ${accent} 15%, transparent)`,
            color: accent,
          }}>
            <Icon />
          </div>
        </div>
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
    { key: 'all', label: t.alerts.total, value: total, accent: KPI_COLORS.total, Icon: IconActivity },
    { key: 'open', label: t.alerts.openEvents, value: open, accent: KPI_COLORS.open, Icon: IconAlert },
    { key: 'cases', label: t.alerts.openCases, value: cases, accent: KPI_COLORS.cases, Icon: IconEye },
    { key: 'resolved', label: t.alerts.resolvedCases, value: resolved, accent: KPI_COLORS.resolved, Icon: IconCheckCircle2 },
  ];
  return (
    <div className="stat-cards-grid">
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
      ? event.assignees.map(a => ({ ...a }))
      : (event.assignee ? [{ initials: event.assignee, name: event.assigneeName || '', user_id: event.assignments?.[0]?.user_id }] : []);
    if (payload.clear) next = [];
    else if (payload.toggle) {
      const u = payload.toggle;
      const seedUser = (window.USERS_SEED || []).find(s => s.initials === u.initials || s.id === u.id);
      const entry = {
        initials: u.initials || seedUser?.initials,
        name: u.name || u.full_name || seedUser?.full_name,
        user_id: u.id ?? seedUser?.id,
      };
      const idx = next.findIndex(a => a.initials === entry.initials);
      if (idx >= 0) next.splice(idx, 1);
      else next.push(entry);
    }
    event.assignees = next;
    event.assignments = next.map(a => ({
      user_id: a.user_id,
      initials: a.initials,
      full_name: a.name || a.full_name,
    }));
    event.assignee = next[0]?.initials || null;
    event.assigneeName = next[0]?.name || next[0]?.full_name || null;
    setTick(n => n + 1);
  };

  const trigger = list.length === 0 ? (
    <div className="unassigned-assignee">
      <div className="unassigned-assignee__icon" aria-hidden="true">
        <IconPlus size={16}/>
      </div>
      <span className="unassigned-assignee__label">{t.filters.unassigned}</span>
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
        type="button"
        className="group"
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
          <div className="assignee-popover">
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

function Th({ children, sortable, active, dir, onClick, className }) {
  if (!sortable) {
    return <TableTh className={className}>{children}</TableTh>;
  }
  return (
    <SortableTh active={active} direction={dir} onClick={onClick} className={className}>
      {children}
    </SortableTh>
  );
}

const DEFAULT_TABLE_SORT = { key: 'time', dir: 'desc' };

const SEVERITY_SORT_WEIGHT = {
  CRITICAL: 7,
  HIGH: 6,
  WARNING: 5,
  MEDIUM: 4,
  LOW: 3,
  INFO: 2,
  OK: 1,
};

const ALERT_STATUS_SORT_WEIGHT = {
  OPEN: 4,
  ACK: 3,
  FLAPPING: 2,
  CLOSED: 1,
};

const CASE_STATUS_SORT_WEIGHT = {
  PROCESSING: 3,
  AWAITING_ACTION: 2,
  CLOSED: 1,
};

function getCaseNumber(event) {
  if (event.case_id != null) {
    const num = Number(event.case_id);
    return Number.isFinite(num) ? num : 0;
  }
  const fromLegacy = String(event.case || '').replace('#', '');
  const num = Number(fromLegacy);
  return Number.isFinite(num) ? num : 0;
}

function getAssigneeSortText(event) {
  if (Array.isArray(event.assignments) && event.assignments.length > 0) {
    const first = event.assignments[0];
    return (first.full_name || first.initials || '').toLowerCase();
  }
  if (Array.isArray(event.assignees) && event.assignees.length > 0) {
    const first = event.assignees[0];
    return (first.name || first.initials || '').toLowerCase();
  }
  return '';
}

function getLabelsSortText(event) {
  if (Array.isArray(event.tags) && event.tags.length > 0) {
    return event.tags
      .map((tag) => `${tag.key || ''}:${tag.value || ''}`.toLowerCase())
      .join('|');
  }
  if (Array.isArray(event.labels)) {
    return event.labels.join('|').toLowerCase();
  }
  return '';
}

function getSortValue(event, key) {
  switch (key) {
    case 'severity':
      return SEVERITY_SORT_WEIGHT[resolveSeverityKey(event.severity, event.sev)] || 0;
    case 'eventStatus':
      return ALERT_STATUS_SORT_WEIGHT[resolveAlertStatusKey(event.alert_status, event.status)] || 0;
    case 'title':
      return String(event.alert_name || event.title || '').toLowerCase();
    case 'service':
      return String(event.component || event.service || '').toLowerCase();
    case 'customer':
      return String(event.source_client || '').toLowerCase();
    case 'project':
      return String(event.source_project || event.scope || '').toLowerCase();
    case 'environment':
      return String(event.source_environment || '').toLowerCase();
    case 'source':
      return String(event.source_name || event.source || '').toLowerCase();
    case 'time':
      return parseFlexibleDate(event.created_at || event.at)?.getTime() || 0;
    case 'labels':
      return getLabelsSortText(event);
    case 'case':
      return getCaseNumber(event);
    case 'caseStatus':
      return CASE_STATUS_SORT_WEIGHT[resolveCaseStatusKey(event.case_status, event.caseStatus)] || 0;
    case 'assignee':
      return getAssigneeSortText(event);
    default:
      return '';
  }
}

function EventsTable({ events, onOpenDetail, onAnalyzeClick, onArchive, showArchived, creatingCaseIndex }) {
  const { t } = useI18n();
  const [sort, setSort] = React.useState(DEFAULT_TABLE_SORT);
  const [menuId, setMenuId] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const toggleSort = (key) => {
    setSort((state) => {
      if (state.key !== key) return { key, dir: 'desc' };
      if (state.dir === 'desc') return { key, dir: 'asc' };
      return DEFAULT_TABLE_SORT;
    });
  };

  const sorted = React.useMemo(() => {
    const list = [...events];
    const dir = sort.dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const av = getSortValue(a, sort.key);
      const bv = getSortValue(b, sort.key);
      if (typeof av === 'number' && typeof bv === 'number') {
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      }
      if (String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true }) < 0) return -1 * dir;
      if (String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true }) > 0) return 1 * dir;
      return 0;
    });
    return list;
  }, [events, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  React.useEffect(() => { setPage(0); }, [events.length, pageSize]);

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="card alert-mobile-list">
        <div className="alert-mobile-list__body">
          {pageRows.length === 0 ? (
            <p className="alert-mobile-list__empty">{t.alerts.noAlertsMatching}</p>
          ) : (
            pageRows.map((e) => {
              const i = EVENTS.indexOf(e);
              const rowKey = e.id || i;
              return (
                <AlertMobileCard
                  key={rowKey}
                  event={e}
                  eventIndex={i}
                  showArchived={showArchived}
                  onOpenDetail={onOpenDetail}
                  onAnalyzeClick={onAnalyzeClick}
                  creatingCaseIndex={creatingCaseIndex}
                  onArchive={onArchive}
                />
              );
            })
          )}
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

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)' }}>
              <Th sortable active={sort.key === 'severity'} dir={sort.dir} onClick={() => toggleSort('severity')}>{t.alerts.severity}</Th>
              <Th>{t.alerts.eventStatus}</Th>
              <Th>{t.alerts.analyze}</Th>
              <Th>{t.alerts.alert}</Th>
              <Th>{t.alerts.service}</Th>
              <Th sortable active={sort.key === 'customer'} dir={sort.dir} onClick={() => toggleSort('customer')}>{t.alerts.customer}</Th>
              <Th sortable active={sort.key === 'project'} dir={sort.dir} onClick={() => toggleSort('project')}>{t.alerts.project}</Th>
              <Th sortable active={sort.key === 'environment'} dir={sort.dir} onClick={() => toggleSort('environment')}>{t.alerts.environment}</Th>
              <Th>{t.alerts.source}</Th>
              <Th sortable active={sort.key === 'time'} dir={sort.dir} onClick={() => toggleSort('time')}>{t.alerts.time}</Th>
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
              const rowKey = e.id || i;
              const canAnalyze = e.case_id == null;
              const isCreatingCase = creatingCaseIndex === i;
              return (
                <tr key={rowKey} className="events-table__row" style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={td}><SeverityBadge sev={e.sev} severity={e.severity}/></td>
                  <td style={td}><AlertStatusBadge status={e.status} alertStatus={e.alert_status}/></td>
                  <td style={td}>
                    <button
                      type="button"
                      onClick={() => onAnalyzeClick && onAnalyzeClick(i)}
                      title={canAnalyze ? t.alerts.investigate : t.alerts.viewRCA}
                      disabled={!canAnalyze || isCreatingCase}
                      data-testid="alert-row-investigate"
                      className="btn btn--ghost"
                      style={{
                        width: 44, height: 44, padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)',
                        opacity: canAnalyze && !isCreatingCase ? 1 : 0.5,
                        cursor: canAnalyze && !isCreatingCase ? 'pointer' : 'not-allowed',
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
                  <td style={{ ...td, width: 50, position: 'relative' }}>
                    <button
                      type="button"
                      onClick={ev => { ev.stopPropagation(); setMenuId(menuId === rowKey ? null : rowKey); }}
                      title={t.common.view}
                      className={'btn btn--ghost btn--icon table-row-menu-btn' + (menuId === rowKey ? ' is-active' : '')}
                    >
                      <IconMoreVertical size={16}/>
                    </button>
                    {menuId === rowKey && (
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
                          <button onClick={ev => { ev.stopPropagation(); setMenuId(null); onArchive && onArchive(e); }} style={menuItem}>
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

function ActiveFiltersBar({ filters, onChange, myInitials }) {
  const { t, lang } = useI18n();
  const allUsers = (window.USERS_SEED || []).filter(u => u.status === 'active');
  const chips = [];

  filters.statuses.forEach(s => {
    const key = window.LEGACY_STATUS_TO_ALERT && window.LEGACY_STATUS_TO_ALERT[s];
    const label = (key && t.alertStatus[key]) || (STATUS_META[s] && STATUS_META[s].label) || s;
    chips.push({ key: 'status-' + s, label: t.filters.eventStatus + ': ' + label, remove: () => onChange({ ...filters, statuses: filters.statuses.filter(x => x !== s) }) });
  });
  filters.caseStatuses.forEach(s => {
    const key = window.LEGACY_CASE_TO_API && window.LEGACY_CASE_TO_API[s];
    const label = (key && t.caseStatus[key]) || (CASE_META[s] && CASE_META[s].label) || s;
    chips.push({ key: 'caseSt-' + s, label: t.filters.caseStatus + ': ' + label, remove: () => onChange({ ...filters, caseStatuses: filters.caseStatuses.filter(x => x !== s) }) });
  });
  (filters.caseIds || []).forEach((id) => {
    chips.push({
      key: 'caseId-' + id,
      label: (t.alerts.caseNum || t.filters.caseNumber) + ' #' + id,
      remove: () => onChange({ ...filters, caseIds: filters.caseIds.filter(x => x !== id) }),
    });
  });
  filters.severities.forEach(s => {
    const key = window.LEGACY_SEV_TO_UPPER && window.LEGACY_SEV_TO_UPPER[s];
    const label = (key && t.alertSeverity[key]) || (SEV_META[s] && SEV_META[s].label) || s;
    chips.push({ key: 'sev-' + s, label: t.filters.severity + ': ' + label, remove: () => onChange({ ...filters, severities: filters.severities.filter(x => x !== s) }) });
  });
  filters.customers.forEach(s => {
    const display = s === '' ? t.filters.unspecified : s;
    chips.push({
      key: 'cust-' + (s === '' ? '__empty__' : s),
      label: t.filters.customer + ': ' + display,
      remove: () => onChange({ ...filters, customers: filters.customers.filter(x => x !== s) }),
    });
  });
  filters.scopes.forEach(s => {
    const display = s === '' ? t.filters.unspecified : s;
    chips.push({
      key: 'scope-' + (s === '' ? '__empty__' : s),
      label: t.filters.project + ': ' + display,
      remove: () => onChange({ ...filters, scopes: filters.scopes.filter(x => x !== s) }),
    });
  });
  filters.environments.forEach(s => {
    const display = s === '' ? t.filters.unspecified : s;
    chips.push({
      key: 'env-' + (s === '' ? '__empty__' : s),
      label: t.filters.environment + ': ' + display,
      remove: () => onChange({ ...filters, environments: filters.environments.filter(x => x !== s) }),
    });
  });
  if (filters.unassigned) {
    chips.push({ key: 'unassigned', label: t.filters.unassigned, remove: () => onChange({ ...filters, unassigned: false }) });
  }
  filters.users.forEach(u => {
    const name = allUsers.find(x => x.initials === u)?.name || u;
    chips.push({ key: 'user-' + u, label: t.filters.assignee + ': ' + name, remove: () => onChange({ ...filters, users: filters.users.filter(x => x !== u) }) });
  });
  if (filters.from) {
    chips.push({
      key: 'from',
      label: t.filters.from + ': ' + formatFilterDateDisplay(filters.from, lang),
      remove: () => onChange({ ...filters, from: '' }),
    });
  }
  if (filters.to) {
    chips.push({
      key: 'to',
      label: t.filters.to + ': ' + formatFilterDateDisplay(filters.to, lang),
      remove: () => onChange({ ...filters, to: '' }),
    });
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

function normalizeSourceFilterValue(value) {
  if (value == null || value === '' || value === '—') return '';
  return String(value);
}

function buildSourceFilterOptions(events, field, unspecifiedLabel, statsPool) {
  const specified = new Set(Array.isArray(statsPool) ? statsPool.filter(Boolean) : []);
  let hasUnspecified = false;
  events.forEach((e) => {
    const raw = e[field];
    if (raw == null || raw === '' || raw === '—') hasUnspecified = true;
    else specified.add(String(raw));
  });
  const sorted = Array.from(specified).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const values = hasUnspecified ? ['', ...sorted] : sorted;
  return values.map((value) => ({
    value,
    label: value === '' ? unspecifiedLabel : value,
  }));
}

/** Chia stats.available_source_* — distinct non-empty values, sorted, no “Sin especificar”. */
function parseFilterIsoDate(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

function toFilterIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatFilterDateDisplay(iso, lang) {
  const d = parseFilterIsoDate(iso);
  if (!d) return '';
  const locale = lang === 'es-ES' ? 'es' : 'en';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function shiftFilterMonth(year, month, delta) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function buildCalendarCells(viewYear, viewMonth) {
  const startDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  const prev = shiftFilterMonth(viewYear, viewMonth, -1);
  const prevDays = new Date(prev.year, prev.month + 1, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, year: prev.year, month: prev.month, outside: true });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, year: viewYear, month: viewMonth, outside: false });
  }
  const next = shiftFilterMonth(viewYear, viewMonth, 1);
  let day = 1;
  while (cells.length < 42) {
    cells.push({ day, year: next.year, month: next.month, outside: true });
    day += 1;
  }
  return cells;
}

function calendarCellIso(cell) {
  return toFilterIsoDate(new Date(cell.year, cell.month, cell.day));
}

function buildDistinctFilterOptions(events, field, statsPool) {
  const values = new Set(Array.isArray(statsPool) ? statsPool : []);
  events.forEach((e) => {
    const raw = field === 'source_project' ? (e.source_project || e.scope) : e[field];
    if (raw != null && raw !== '' && raw !== '—') values.add(String(raw));
  });
  return Array.from(values)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map((value) => ({ value, label: value }));
}

const ADV_FILTERS_INITIAL = {
  statuses: [],
  caseStatuses: [],
  caseIds: [],
  severities: [],
  customers: [],
  scopes: [],
  environments: [],
  unassigned: false,
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
  return (
    f.statuses.length +
    f.caseStatuses.length +
    (f.caseIds || []).length +
    f.severities.length +
    f.customers.length +
    f.scopes.length +
    f.environments.length +
    (f.unassigned ? 1 : 0) +
    f.users.length +
    (f.from ? 1 : 0) +
    (f.to ? 1 : 0)
  );
}

function EventsPage({ onOpenDetail, onAnalyzeClick, creatingCaseIndex, currentUser, onEventsChange }) {
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
    if (advFilters.caseIds && advFilters.caseIds.length) {
      const eventCaseId = e.case_id != null
        ? String(e.case_id)
        : (e.case || '').replace(/^#/, '').trim();
      if (!advFilters.caseIds.some((id) => String(id) === eventCaseId)) return false;
    }
    if (advFilters.severities.length) {
      const eventSev = e.sev || (e.severity ? String(e.severity).toLowerCase() : '');
      if (!advFilters.severities.includes(eventSev)) return false;
    }
    if (advFilters.customers.length) {
      const client = normalizeSourceFilterValue(e.source_client);
      if (!advFilters.customers.includes(client)) return false;
    }
    if (advFilters.scopes.length) {
      const project = normalizeSourceFilterValue(e.source_project || e.scope);
      if (!advFilters.scopes.includes(project)) return false;
    }
    if (advFilters.environments.length) {
      const env = normalizeSourceFilterValue(e.source_environment);
      if (!advFilters.environments.includes(env)) return false;
    }

    const assignees = Array.isArray(e.assignees)
      ? e.assignees
      : (e.assignee ? [{ initials: e.assignee }] : []);
    if (advFilters.unassigned || advFilters.users.length) {
      const matchesUnassigned = advFilters.unassigned && assignees.length === 0;
      const matchesUser = advFilters.users.length > 0
        && assignees.some(a => advFilters.users.includes(a.initials));
      if (!matchesUnassigned && !matchesUser) return false;
    }

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
      <div className="events-page-header">
        <div className="events-page-header__text">
          <h1 className="events-page-title">{t.alerts.title}</h1>
          <p className="events-page-subtitle">{t.alerts.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => {
      const now = new Date();
      const stamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      EVENTS.unshift(alertRow({
        id: 'fake-' + Date.now(),
        severity: 'HIGH',
        alert_status: 'OPEN',
        alert_name: 'Memory Leak Detected',
        alert_description: 'Application memory usage growing steadily without garbage collection',
        component: 'api-gateway',
        source_client: 'Acme Corp',
        source_project: 'gateway',
        source_environment: 'qa',
        source_name: 'Grafana',
        source_host: 'api-gateway-02.example.com',
        created_at: stamp,
        tags: [{ key: 'team', value: 'demo' }, { key: 'tag', value: 'fake' }, { key: 'tag', value: 'memory' }],
        case_id: null,
        case_status: null,
        agent_status: null,
        assignments: [],
        archived: false,
      }));
      setNonce(x => x + 1);
      onEventsChange && onEventsChange();
    }}
          className="btn btn--outline btn--sm events-page-header__action"
        >
          <IconPlus size={14}/> {t.alerts.createFake}
        </button>
      </div>

      <StatCards events={EVENTS} filter={filter} setFilter={setFilter}/>

      <div className="events-filter-bar">
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
          <span className={'count-badge' + (showArchived ? ' count-badge--secondary' : '')}>{archivedCount}</span>
        </button>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAdvOpen(o => !o)}
            className="btn btn--sm btn--outline"
          >
            <IconFilter size={14}/> {t.filters.advancedFilters}
            {advCount > 0 && <span className="count-badge">{advCount}</span>}
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

      <EventsTable
        events={filtered}
        showArchived={showArchived}
        onOpenDetail={onOpenDetail}
        onAnalyzeClick={onAnalyzeClick}
        creatingCaseIndex={creatingCaseIndex}
        onArchive={(eventRow) => {
          const e = eventRow;
          if (!e) return;
          e.archived = !e.archived;
          setNonce(x => x + 1);
          onEventsChange && onEventsChange();
        }}
      />
    </div>
  );
}

function AdvancedFiltersPopover({ value, onChange, onClose }) {
  const { t, lang } = useI18n();
  const set = (patch) => onChange({ ...value, ...patch });
  const clearAll = () => onChange({ ...ADV_FILTERS_INITIAL });
  const hasAny = advFilterCount(value) > 0;

  const allUsers = (window.USERS_SEED || []).filter(u => u.status === 'active');
  const filterStats = window.MOCK_FILTER_STATS || {};
  const customerOptions = buildSourceFilterOptions(
    EVENTS, 'source_client', t.filters.unspecified, filterStats.available_source_clients,
  );
  const projectOptions = buildDistinctFilterOptions(
    EVENTS,
    'source_project',
    filterStats.available_source_projects,
  );
  const environmentOptions = buildSourceFilterOptions(
    EVENTS, 'source_environment', t.filters.unspecified, filterStats.available_source_environments,
  );

  const { LEGACY_STATUS_TO_ALERT, LEGACY_CASE_TO_API, LEGACY_SEV_TO_UPPER } = window;
  const statusOptions = ['open', 'acknowledged', 'closed', 'flapping'].map((v) => ({
    value: v,
    label: t.alertStatus[LEGACY_STATUS_TO_ALERT[v]] || v,
  }));
  const caseStatusOptions = ['processing', 'awaiting', 'closed'].map((v) => ({
    value: v,
    label: t.caseStatus[LEGACY_CASE_TO_API[v]] || v,
  }));
  const severityOptions = ['critical', 'high', 'warning', 'medium', 'low', 'info', 'ok'].map((v) => ({
    value: v,
    label: t.alertSeverity[LEGACY_SEV_TO_UPPER[v]] || v,
  }));

  return (
    <>
      <div className="filter-panel-backdrop" onClick={onClose} role="presentation"/>
      <div className="filter-panel" role="dialog" aria-label={t.filters.title}>
        <div className="filter-panel__header">
          <h4>{t.filters.title}</h4>
          {hasAny && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={clearAll}>
              {t.filters.clearAll}
            </button>
          )}
        </div>

        <div className="filter-panel__body">
          <FilterField label={t.filters.eventStatus}>
            <FilterMultiSelect
              emptyLabel={t.filters.selectStatuses}
              options={statusOptions}
              selected={value.statuses}
              onChange={(statuses) => set({ statuses })}
            />
          </FilterField>

          <FilterField label={t.filters.caseStatus}>
            <FilterMultiSelect
              emptyLabel={t.filters.selectCaseStatuses}
              options={caseStatusOptions}
              selected={value.caseStatuses}
              onChange={(caseStatuses) => set({ caseStatuses })}
            />
          </FilterField>

          <FilterField label={t.alerts.caseNum || t.filters.caseNumber} labelIcon={<IconHash size={16}/>}>
            <input
              type="number"
              min={1}
              step={1}
              className="filter-input"
              placeholder={t.filters.enterCaseId}
              onChange={(e) => {
                if (e.target.value !== '' && Number(e.target.value) < 1) e.target.value = '';
              }}
              onKeyDown={(e) => {
                if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                  e.preventDefault();
                  return;
                }
                if (e.key === 'Enter') {
                  const num = parseInt(e.currentTarget.value, 10);
                  if (!Number.isNaN(num) && num > 0 && !(value.caseIds || []).includes(num)) {
                    set({ caseIds: [...(value.caseIds || []), num] });
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
            {(value.caseIds || []).length > 0 && (
              <div className="filter-badge-row">
                {(value.caseIds || []).map((caseId) => (
                  <span key={caseId} className="filter-badge">
                    #{caseId}
                    <button
                      type="button"
                      aria-label={t.filters.clearAll}
                      onClick={() => set({ caseIds: value.caseIds.filter((id) => id !== caseId) })}
                    >
                      <IconClose size={12}/>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FilterField>

          <FilterField label={t.filters.severity}>
            <FilterMultiSelect
              emptyLabel={t.filters.selectSeverities}
              placeholderMuted
              options={severityOptions}
              selected={value.severities}
              onChange={(severities) => set({ severities })}
            />
          </FilterField>

          <FilterField label={t.filters.customer}>
            <FilterMultiSelect
              emptyLabel={`Select ${t.filters.customer.toLowerCase()}`}
              placeholderMuted
              options={customerOptions}
              selected={value.customers}
              onChange={(customers) => set({ customers })}
            />
          </FilterField>

          <FilterField label={t.filters.project}>
            <FilterMultiSelect
              emptyLabel={`Select ${t.filters.project.toLowerCase()}`}
              placeholderMuted
              options={projectOptions}
              selected={value.scopes}
              onChange={(scopes) => set({ scopes })}
            />
          </FilterField>

          <FilterField label={t.filters.environment}>
            <FilterMultiSelect
              emptyLabel={`Select ${t.filters.environment.toLowerCase()}`}
              placeholderMuted
              options={environmentOptions}
              selected={value.environments}
              onChange={(environments) => set({ environments })}
            />
          </FilterField>

          <FilterField label={t.filters.assignee} labelIcon={<IconUser size={16}/>}>
            <div className="filter-assignee-block">
              <button
                type="button"
                className="filter-check-row"
                style={{ width: '100%', border: 0, background: 'transparent', font: 'inherit', textAlign: 'left' }}
                onClick={() => set({ unassigned: !value.unassigned })}
              >
                <span className={'filter-check-box' + (value.unassigned ? ' is-checked' : '')}>
                  {value.unassigned && <IconCheck size={10}/>}
                </span>
                <span>{t.filters.unassigned}</span>
              </button>
              <div className="filter-assignee-divider"/>
              <p className="filter-assignee-users-label">{t.users.title}</p>
              <FilterAssigneePicker
                users={allUsers}
                selected={value.users}
                onChange={(users) => set({ users })}
                placeholder={t.filters.assignee}
              />
              {value.users.length > 0 && (
                <div className="filter-badge-row">
                  {value.users.map((initials) => {
                    const name = allUsers.find(u => u.initials === initials)?.name || initials;
                    return (
                      <span key={initials} className="filter-badge">
                        {name}
                        <button
                          type="button"
                          onClick={() => set({ users: value.users.filter(u => u !== initials) })}
                        >
                          <IconClose size={12}/>
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </FilterField>

          <FilterField label={t.filters.dateRange} labelIcon={<IconCalendar size={16}/>}>
            <FilterDateRange
              from={value.from}
              to={value.to}
              lang={lang}
              t={t}
              onChange={(patch) => set(patch)}
            />
          </FilterField>
        </div>
      </div>
    </>
  );
}

function FilterField({ label, labelIcon, children }) {
  return (
    <div className="filter-field">
      <div className="filter-field__label">{labelIcon}{label}</div>
      {children}
    </div>
  );
}

const FILTER_CALENDAR_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function FilterCalendar({ selectedIso, minIso, onSelect, lang }) {
  const selected = parseFilterIsoDate(selectedIso);
  const minDate = parseFilterIsoDate(minIso);
  const [view, setView] = React.useState(() => {
    const base = selected || minDate || new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  React.useEffect(() => {
    if (selected) setView({ year: selected.getFullYear(), month: selected.getMonth() });
  }, [selectedIso]);

  const locale = lang === 'es-ES' ? 'es' : 'en';
  const monthTitle = new Date(view.year, view.month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  const cells = buildCalendarCells(view.year, view.month);

  return (
    <div className="filter-calendar">
      <div className="filter-calendar__header">
        <button
          type="button"
          className="filter-calendar__nav"
          aria-label="Previous month"
          onClick={() => setView((v) => shiftFilterMonth(v.year, v.month, -1))}
        >
          <IconChevron size={16} style={{ transform: 'rotate(180deg)' }}/>
        </button>
        <span className="filter-calendar__title">{monthTitle}</span>
        <button
          type="button"
          className="filter-calendar__nav"
          aria-label="Next month"
          onClick={() => setView((v) => shiftFilterMonth(v.year, v.month, 1))}
        >
          <IconChevron size={16}/>
        </button>
      </div>
      <div className="filter-calendar__weekdays">
        {FILTER_CALENDAR_WEEKDAYS.map((d) => (
          <span key={d} className="filter-calendar__weekday">{d}</span>
        ))}
      </div>
      <div className="filter-calendar__grid">
        {cells.map((cell, idx) => {
          const iso = calendarCellIso(cell);
          const cellDate = parseFilterIsoDate(iso);
          const isDisabled = minDate && cellDate && cellDate < minDate;
          const isSelected = selectedIso === iso;
          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              className={'filter-calendar__day'
                + (cell.outside ? ' is-outside' : '')
                + (isSelected ? ' is-selected' : '')}
              onClick={() => onSelect(iso)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterDateField({
  label, value, onChange, minValue, selectDateLabel, formatLabel, open, onOpenChange, lang,
}) {
  return (
    <div className="filter-date-field">
      <span className="filter-date-sub">{label}</span>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className={'filter-date-btn' + (!value ? ' is-empty' : '') + (open ? ' is-open' : '')}
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
        >
          <IconCalendar size={16}/>
          <span>{value ? formatLabel(value) : selectDateLabel}</span>
        </button>
        {open && (
          <>
            <div className="filter-panel-backdrop" style={{ zIndex: 49 }} onClick={() => onOpenChange(false)}/>
            <div className="filter-calendar-popover">
              <FilterCalendar
                selectedIso={value}
                minIso={minValue}
                lang={lang}
                onSelect={(iso) => {
                  onChange(iso);
                  onOpenChange(false);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterDateRange({ from, to, onChange, t, lang }) {
  const [openField, setOpenField] = React.useState(null);
  const formatLabel = (iso) => formatFilterDateDisplay(iso, lang);

  const setFrom = (iso) => {
    const patch = { from: iso };
    if (to && iso && to < iso) patch.to = '';
    onChange(patch);
  };

  return (
    <div className="filter-date-range">
      <FilterDateField
        label={t.filters.from}
        value={from}
        onChange={setFrom}
        minValue={null}
        selectDateLabel={t.filters.selectDate}
        formatLabel={formatLabel}
        lang={lang}
        open={openField === 'from'}
        onOpenChange={(o) => setOpenField(o ? 'from' : null)}
      />
      <FilterDateField
        label={t.filters.to}
        value={to}
        onChange={(iso) => onChange({ to: iso })}
        minValue={from || null}
        selectDateLabel={t.filters.selectDate}
        formatLabel={formatLabel}
        lang={lang}
        open={openField === 'to'}
        onOpenChange={(o) => setOpenField(o ? 'to' : null)}
      />
    </div>
  );
}

function FilterMultiSelect({ label, emptyLabel, placeholderMuted, options, selected, onChange }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const display = selected.length > 0
    ? (t.filters.selectedCount || '{count} selected').replace('{count}', String(selected.length))
    : emptyLabel;
  const toggle = (v) => {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  };
  const btnClass = 'filter-select-btn'
    + (selected.length === 0 ? ' is-placeholder' : '')
    + (selected.length === 0 && placeholderMuted ? ' is-muted' : '');

  const field = (
    <>
      <button
        type="button"
        className={btnClass}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span>{display}</span>
        <IconFilter size={16}/>
      </button>
      {open && (
        <>
          <div className="filter-panel-backdrop" style={{ zIndex: 49 }} onClick={() => setOpen(false)}/>
          <div className="filter-select-menu" onClick={(e) => e.stopPropagation()}>
            {options.length > 0 ? options.map(o => {
              const isSel = selected.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  className="filter-check-row"
                  style={{ width: '100%', border: 0, background: 'transparent', font: 'inherit', textAlign: 'left', padding: 0 }}
                  onClick={() => toggle(o.value)}
                >
                  <span className={'filter-check-box' + (isSel ? ' is-checked' : '')}>
                    {isSel && <IconCheck size={10}/>}
                  </span>
                  <span>{o.label}</span>
                </button>
              );
            }) : (
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0, padding: '0.25rem' }}>
                {t.filters.unspecified}
              </p>
            )}
          </div>
        </>
      )}
    </>
  );

  if (label) {
    return (
      <div className="filter-field">
        <div className="filter-field__label">{label}</div>
        <div style={{ position: 'relative' }}>{field}</div>
      </div>
    );
  }
  return <div style={{ position: 'relative' }}>{field}</div>;
}

function FilterAssigneePicker({ users, selected, onChange, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const toggle = (initials) => {
    onChange(selected.includes(initials) ? selected.filter(x => x !== initials) : [...selected, initials]);
  };
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="filter-select-btn is-placeholder"
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: 'var(--muted-foreground)' }}>{placeholder}</span>
        <IconChevronDown size={16} style={{ opacity: 0.5 }}/>
      </button>
      {open && (
        <>
          <div className="filter-panel-backdrop" style={{ zIndex: 49 }} onClick={() => setOpen(false)}/>
          <div className="filter-select-menu" style={{ maxHeight: '14rem' }}>
            {users.map(u => {
              const isSel = selected.includes(u.initials);
              return (
                <button
                  key={u.id || u.initials}
                  type="button"
                  className="filter-check-row"
                  style={{ width: '100%', border: 0, background: 'transparent', font: 'inherit', textAlign: 'left' }}
                  onClick={() => toggle(u.initials)}
                >
                  <span className={'filter-check-box' + (isSel ? ' is-checked' : '')}>
                    {isSel && <IconCheck size={10}/>}
                  </span>
                  <span>{u.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { EventsPage, StatCard, AssigneeCell });
