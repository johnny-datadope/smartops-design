// Administration shell — Apolo-aligned sidebar (Manage Users + Usage only).

function AdministrationPage({ section, setSection, currentUser }) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = React.useState(() =>
    localStorage.getItem('smartops.admin-collapsed') === '1'
  );

  const toggleCollapsed = () => {
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem('smartops.admin-collapsed', next ? '1' : '0');
      return next;
    });
  };

  const items = [
    { key: 'users', label: t.admin.manageUsers, icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )},
    { key: 'usage', label: t.admin.usage, icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="20" x2="21" y2="20"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="18" y1="20" x2="18" y2="10"/>
      </svg>
    )},
  ];

  return (
    <div data-screen-label="04 Administration" style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>
      <aside style={{
        width: collapsed ? 56 : 240,
        flexShrink: 0,
        borderRight: '1px solid var(--line)',
        padding: collapsed ? '22px 8px' : '22px 14px',
        background: 'var(--bg-2)',
        display: 'flex', flexDirection: 'column', gap: 4,
        transition: 'width .2s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '4px 0 10px' : '4px 10px 10px',
        }}>
          {!collapsed && (
            <div style={{
              fontSize: 10.5, color: 'var(--fg-4)', letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }} className="mono">{t.nav.administration}</div>
          )}
          <button onClick={toggleCollapsed} title={collapsed ? t.admin.sidebar.expand : t.admin.sidebar.collapse} style={{
            width: 28, height: 28, borderRadius: 6, border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)',
          }}>
            <IconChevron size={12} style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(90deg)' }}/>
          </button>
        </div>
        {items.map(it => {
          const active = section === it.key;
          return (
            <button key={it.key}
              onClick={() => setSection(it.key)}
              title={collapsed ? it.label : undefined}
              className={'btn btn--ghost btn--sm' + (active ? ' is-active' : '')}
              style={{
                display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                width: collapsed ? 36 : '100%',
                padding: collapsed ? '9px 0' : '9px 10px',
              }}
            >
              {it.icon}
              {!collapsed && <span style={{ flex: 1 }}>{it.label}</span>}
            </button>
          );
        })}
      </aside>
      <main className="layout-page" style={{ flex: 1, minWidth: 0, paddingTop: 0, paddingBottom: 0 }}>
        {section === 'users' && <UsersPage currentUser={currentUser}/>}
        {section === 'usage' && <UsageMetricsPage/>}
      </main>
    </div>
  );
}

Object.assign(window, { AdministrationPage });
