// Administration shell — mirrors chia/src/apolo/components/admin/admin-sidebar.tsx

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

  const toggleLabel = collapsed ? t.admin.sidebar.expand : t.admin.sidebar.collapse;

  // Same icons as Apolo: Users, BarChart3 (lucide-react in admin-sidebar.tsx)
  const items = [
    { key: 'users', label: t.admin.sidebar.manageUsers, Icon: IconUsers },
    { key: 'usage', label: t.admin.sidebar.usageAndCosts, Icon: IconBarChart3 },
  ];

  return (
    <div data-screen-label="04 Administration" style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>
      <aside className="admin-sidebar" style={{
        width: collapsed ? 56 : 240,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        padding: collapsed ? '24px 8px' : '24px 12px',
        background: 'color-mix(in oklch, var(--background) 60%, transparent)',
        flexDirection: 'column',
        transition: 'width .2s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0 0 12px' : '0 12px 12px',
        }}>
          {!collapsed && (
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground)',
            }}>{t.admin.sidebar.title}</p>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            title={toggleLabel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-foreground)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
          >
            {collapsed ? <IconChevronRight size={16}/> : <IconChevronLeft size={16}/>}
          </button>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(({ key, label, Icon }) => {
            const active = section === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSection(key)}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                className={'btn btn--ghost btn--sm' + (active ? ' is-active' : '')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? 0 : 12,
                  width: collapsed ? 36 : '100%',
                  height: collapsed ? 36 : undefined,
                  alignSelf: collapsed ? 'center' : undefined,
                  padding: collapsed ? 0 : '8px 12px',
                  color: active ? undefined : 'var(--muted-foreground)',
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }}/>
                {!collapsed && <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="layout-page" style={{ flex: 1, minWidth: 0, paddingTop: 0, paddingBottom: 0 }}>
        {section === 'users' && <UsersPage currentUser={currentUser}/>}
        {section === 'usage' && <UsageMetricsPage/>}
      </main>
    </div>
  );
}

Object.assign(window, { AdministrationPage });
