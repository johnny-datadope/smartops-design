// App shell: login → dashboard; hash-based routing so views are linkable.
//
// URL formats:
//   #/login                #/events            #/events/:index
//   #/users                #/admin             #/admin/:section   (users|roles|audit)

// URL slug ↔ internal section key. Slugs are what team members see in Jira links;
// internal keys are what the admin page renders against.
const ADMIN_SLUG_TO_SECTION = { 'manage-users':'users', 'roles':'roles', 'audit':'audit' };
const ADMIN_SECTION_TO_SLUG = { 'users':'manage-users', 'roles':'roles', 'audit':'audit' };

function parseHash(hash) {
  const raw = (hash || '').replace(/^#\/?/, '');
  const [head, ...rest] = raw.split('/').filter(Boolean);
  const seg = head || 'events';
  if (seg === 'login')  return { route:'login' };
  if (seg === 'users')  return { route:'users' };
  if (seg === 'admin') {
    const section = ADMIN_SLUG_TO_SECTION[rest[0]] || 'users';
    return { route:'admin', section };
  }
  if (seg === 'events') {
    const idx = rest[0] != null && /^\d+$/.test(rest[0]) ? +rest[0] : null;
    return { route:'events', detailId: idx != null && idx >= 0 && idx < EVENTS.length ? idx : null };
  }
  return { route:'events', detailId: null };
}

function buildHash({ route, detailId, section }) {
  if (route === 'login') return '#/login';
  if (route === 'users') return '#/users';
  if (route === 'admin') {
    const slug = ADMIN_SECTION_TO_SLUG[section] || 'manage-users';
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
  const [theme, setTheme] = React.useState(() => localStorage.getItem('smartops.theme') || 'dark');
  React.useEffect(() => {
    localStorage.setItem('smartops.theme', theme);
    const resolved = theme === 'system'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
  }, [theme]);
  const [, setTick] = React.useState(0);

  // Seed the URL if none was provided.
  React.useEffect(() => {
    if (!window.location.hash) {
      window.location.replace('#/' + (user ? 'events' : 'login'));
    }
  }, []);

  // Logged-out users can only see #/login. Remember where they wanted to go.
  const pendingHashRef = React.useRef(null);
  React.useEffect(() => {
    if (user) return;
    if (hashState.route !== 'login') {
      pendingHashRef.current = buildHash(hashState);
      navigate({ route:'login' });
    }
  }, [user, hashState, navigate]);

  // Non-admin users can't see the admin route.
  React.useEffect(() => {
    if (user && hashState.route === 'admin' && user.role !== 'Admin') {
      navigate({ route:'events', detailId:null });
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
    navigate({ route:'login' });
  };

  if (!user) return <Login onLogin={handleLogin}/>;

  const { route, detailId, section } = hashState;
  const setRoute = (r) => navigate({ route:r, detailId:null, section:undefined });
  const setDetailId = (id) => navigate({ route:'events', detailId:id });
  const setAdminSection = (s) => navigate({ route:'admin', section:s });

  return (
    <div data-screen-label="01 Events Dashboard" style={{ minHeight:'100vh' }}>
      <TopBar onLogout={handleLogout} route={route} setRoute={setRoute} theme={theme} setTheme={setTheme} currentUser={user}/>
      {route === 'users' ? (
        <UsersPage currentUser={user}/>
      ) : route === 'admin' && user?.role === 'Admin' ? (
        <AdministrationPage theme={theme} setTheme={setTheme} section={section} setSection={setAdminSection} currentUser={user}/>
      ) : (
        <EventsPage onOpenDetail={setDetailId}/>
      )}
      <EventDetail
        event={detailId != null ? EVENTS[detailId] : null}
        onClose={() => setDetailId(null)}
        onAssign={(payload) => {
          if (detailId == null || !payload) return;
          const ev = EVENTS[detailId];
          // Normalise to the array form on first write so we never lose state.
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
          // Keep legacy single fields mirrored to the first assignee so table
          // cells and other views keep working unchanged.
          ev.assignee = list[0]?.initials || null;
          ev.assigneeName = list[0]?.name || null;

          setTick(t => t + 1);
        }}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
