// App shell: login → dashboard; global state for investigation panel.
function App() {
  const [user, setUser] = React.useState(() => {
    const raw = localStorage.getItem('smartops.user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return { method: raw, role: 'Admin' }; }
  });
  const [detailId, setDetailId] = React.useState(null);
  const [route, setRoute] = React.useState(() => localStorage.getItem('smartops.route') || 'events');
  const [theme, setTheme] = React.useState(() => localStorage.getItem('smartops.theme') || 'dark');
  React.useEffect(() => { localStorage.setItem('smartops.route', route); }, [route]);
  React.useEffect(() => {
    localStorage.setItem('smartops.theme', theme);
    const resolved = theme === 'system'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
  }, [theme]);
  const [, setTick] = React.useState(0);

  const handleLogin = (info) => {
    const obj = typeof info === 'string' ? { method: info, role: 'Admin' } : info;
    localStorage.setItem('smartops.user', JSON.stringify(obj));
    setUser(obj);
    if (obj.role !== 'Admin' && route === 'admin') setRoute('events');
  };
  const handleLogout = () => {
    localStorage.removeItem('smartops.user');
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin}/>;

  return (
    <div data-screen-label="01 Events Dashboard" style={{ minHeight:'100vh' }}>
      <TopBar onLogout={handleLogout} route={route} setRoute={setRoute} theme={theme} setTheme={setTheme} currentUser={user}/>
      {route === 'users' ? (
        <UsersPage/>
      ) : route === 'admin' && user?.role === 'Admin' ? (
        <AdministrationPage theme={theme} setTheme={setTheme}/>
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

          setDetailId(d => d);
          setTick(t => t + 1);
        }}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
