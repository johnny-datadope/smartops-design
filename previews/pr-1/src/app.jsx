// App shell: login → dashboard; hash-based routing so views are linkable.
//
// URL formats:
//   #/login                #/events            #/events/:index
//   #/admin                #/admin/:section    (users|usage)

const ADMIN_SLUG_TO_SECTION = { 'users': 'users', 'manage-users': 'users', 'usage': 'usage' };
const ADMIN_SECTION_TO_SLUG = { 'users': 'users', 'usage': 'usage' };

function parseHash(hash) {
  const raw = (hash || '').replace(/^#\/?/, '');
  const [head, ...rest] = raw.split('/').filter(Boolean);
  const seg = head || 'events';
  if (seg === 'login') return { route: 'login' };
  if (seg === 'admin') {
    const section = ADMIN_SLUG_TO_SECTION[rest[0]] || 'users';
    return { route: 'admin', section };
  }
  if (seg === 'events') {
    const idx = rest[0] != null && /^\d+$/.test(rest[0]) ? +rest[0] : null;
    return { route: 'events', detailId: idx != null && idx >= 0 && idx < EVENTS.length ? idx : null };
  }
  return { route: 'events', detailId: null };
}

function buildHash({ route, detailId, section }) {
  if (route === 'login') return '#/login';
  if (route === 'admin') {
    const slug = ADMIN_SECTION_TO_SLUG[section] || 'users';
    return `#/admin/${slug}`;
  }
  if (route === 'events') return detailId != null ? `#/events/${detailId}` : '#/events';
  return '#/events';
}

function useHashRoute() {
  const [state, setState] = React.useState(() => parseHash(window.location.hash));
  React.useEffect(() => {
    const onHash = () => setState(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = React.useCallback((next) => {
    const hash = buildHash({ ...parseHash(window.location.hash), ...next });
    if (hash !== window.location.hash) window.location.hash = hash;
  }, []);
  return [state, navigate];
}

function App() {
  const [user, setUser] = React.useState(() => {
    const raw = localStorage.getItem('smartops.user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return { method: raw, role: 'Admin' }; }
  });
  const [hashState, navigate] = useHashRoute();
  const [theme, setTheme] = React.useState(() => {
    const stored = localStorage.getItem('smartops.theme') || 'dark';
    return stored === 'system' ? 'dark' : stored;
  });
  React.useEffect(() => {
    localStorage.setItem('smartops.theme', theme);
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  }, [theme]);
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!window.location.hash) {
      window.location.replace('#/' + (user ? 'events' : 'login'));
    }
  }, []);

  const pendingHashRef = React.useRef(null);
  React.useEffect(() => {
    if (user) return;
    if (hashState.route !== 'login') {
      pendingHashRef.current = buildHash(hashState);
      navigate({ route: 'login' });
    }
  }, [user, hashState, navigate]);

  React.useEffect(() => {
    if (user && hashState.route === 'admin' && user.role !== 'Admin') {
      navigate({ route: 'events', detailId: null });
    }
  }, [user, hashState, navigate]);

  const handleLogin = (info) => {
    const obj = typeof info === 'string' ? { method: info, role: 'Admin' } : info;
    localStorage.setItem('smartops.user', JSON.stringify(obj));
    setUser(obj);
    const target = pendingHashRef.current && pendingHashRef.current !== '#/login'
      ? pendingHashRef.current
      : '#/events';
    pendingHashRef.current = null;
    if (window.location.hash !== target) window.location.hash = target;
  };
  const handleLogout = () => {
    localStorage.removeItem('smartops.user');
    setUser(null);
    navigate({ route: 'login' });
  };

  if (!user) return <Login onLogin={handleLogin}/>;

  const { route, detailId, section } = hashState;
  const setRoute = (r) => navigate({ route: r, detailId: null, section: undefined });
  const setDetailId = (id) => navigate({ route: 'events', detailId: id });
  const setAdminSection = (s) => navigate({ route: 'admin', section: s });

  return (
    <div data-screen-label="01 Events Dashboard" style={{ minHeight: '100vh', display:'flex', flexDirection:'column' }}>
      <TopBar onLogout={handleLogout} route={route} setRoute={setRoute} theme={theme} setTheme={setTheme} currentUser={user}/>
      <div style={{ flex:1 }}>
      {route === 'admin' && user?.role === 'Admin' ? (
        <AdministrationPage theme={theme} setTheme={setTheme} section={section} setSection={setAdminSection} currentUser={user}/>
      ) : (
        <EventsPage onOpenDetail={setDetailId} currentUser={user}/>
      )}
      </div>
      <AppFooter/>
      <EventDetail
        event={detailId != null ? EVENTS[detailId] : null}
        alertId={detailId}
        currentUser={user}
        onClose={() => setDetailId(null)}
        onAssign={(payload) => {
          if (detailId == null || !payload) return;
          const ev = EVENTS[detailId];
          let list = Array.isArray(ev.assignees)
            ? [...ev.assignees]
            : (ev.assignee ? [{ initials: ev.assignee, name: ev.assigneeName || '' }] : []);

          if (payload.clear) {
            list = [];
          } else if (payload.toggle) {
            const u = payload.toggle;
            const idx = list.findIndex(a => a.initials === u.initials);
            if (idx >= 0) list.splice(idx, 1);
            else list.push({ initials: u.initials, name: u.name });
          }

          ev.assignees = list;
          ev.assignments = list.map(a => ({ initials: a.initials, full_name: a.name }));
          ev.assignee = list[0]?.initials || null;
          ev.assigneeName = list[0]?.name || null;
          setTick(t => t + 1);
        }}
      />
    </div>
  );
}

function AppFooter() {
  const { t } = useI18n();
  return (
    <footer style={{
      padding:'10px 24px', borderTop:'1px solid var(--line)',
      fontSize:11, color:'var(--muted-foreground)', textAlign:'center',
    }}>
      {t.footer.version.replace('{version}', '0.1.0-mock')}
    </footer>
  );
}

function bootApp() {
  if (!window.__ICONS_READY__ || typeof App !== 'function') {
    requestAnimationFrame(bootApp);
    return;
  }
  ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
}
bootApp();
