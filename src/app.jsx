// App shell: login → dashboard; global state for investigation panel + tweaks.
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentHue": 200,
  "density": "comfortable",
  "rowStyle": "flat",
  "statsStyle": "numbers",
  "labelStyle": "chip"
}/*EDITMODE-END*/;

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
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);
  const [, setTick] = React.useState(0);

  // Apply accent hue live
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent',      `oklch(0.80 0.12 ${tweaks.accentHue})`);
    root.style.setProperty('--accent-2',    `oklch(0.70 0.14 ${tweaks.accentHue})`);
    root.style.setProperty('--accent-glow', `oklch(0.80 0.12 ${tweaks.accentHue} / 0.18)`);
  }, [tweaks.accentHue]);

  // Tweaks host protocol
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type:'__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

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

  if (!user) return (
    <>
      <Login onLogin={handleLogin}/>
      <TweaksPanel open={tweaksOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)}/>
    </>
  );

  return (
    <div data-screen-label={route==='settings' ? '02 Settings' : '01 Events Dashboard'} style={{ minHeight:'100vh' }}>
      <TopBar onLogout={handleLogout} route={route} setRoute={setRoute} theme={theme} setTheme={setTheme} currentUser={user}/>
      {route === 'events' ? (
        <EventsPage
          onOpenDetail={setDetailId}
          density={tweaks.density}
        />
      ) : route === 'users' ? (
        <UsersPage/>
      ) : route === 'admin' ? (
        user?.role === 'Admin' ? <AdministrationPage tweaks={tweaks} setTweaks={setTweaks} theme={theme} setTheme={setTheme}/> : <EventsPage onOpenDetail={setDetailId} density={tweaks.density}/>
      ) : (
        <SettingsPage tweaks={tweaks} setTweaks={setTweaks} theme={theme} setTheme={setTheme}/>
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
      <TweaksPanel open={tweaksOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
