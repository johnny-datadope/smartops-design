// Top app chrome: logo, primary nav, right-side utilities.
function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      {/* IO mark — two squares suggesting I/O / binary */}
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="4" width="6" height="16" fill="var(--fg)"/>
        <rect x="10" y="4" width="12" height="16" fill="none" stroke="var(--fg)" strokeWidth="3"/>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', lineHeight:1 }} className="mono">
        <span style={{ fontWeight:700, letterSpacing:'0.04em', fontSize:13, color:'var(--fg)' }}>IOMETRICS</span>
        <span style={{ fontSize:8.5, color:'var(--fg-3)', letterSpacing:'0.24em', marginTop:3 }}>SMART OPS</span>
      </div>
    </div>
  );
}

function NavPill({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:7,
      padding:'7px 12px', borderRadius:8,
      background: active ? 'var(--bg-3)' : 'transparent',
      border: active ? '1px solid var(--line-2)' : '1px solid transparent',
      color: active ? 'var(--fg)' : 'var(--fg-2)',
      fontSize:13, fontWeight:500,
      transition:'all .15s ease',
    }}>
      {icon}{label}
    </button>
  );
}

function IconBtn({ icon, label, onClick, title, active }) {
  return (
    <button onClick={onClick} title={title} style={{
      display:'flex', alignItems:'center', gap:7,
      padding:'7px 10px', borderRadius:8,
      background: active ? 'var(--accent-glow)' : 'transparent',
      border: active ? '1px solid var(--accent-2)' : '1px solid var(--line)',
      color: active ? 'var(--accent)' : 'var(--fg-2)',
      fontSize:12.5, fontWeight:500,
    }}>
      {icon}{label && <span>{label}</span>}
    </button>
  );
}

function TopBar({ onLogout, route, setRoute, theme, setTheme, currentUser }) {
  const [langOpen, setLangOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  const [lang, setLang] = React.useState(() => localStorage.getItem('smartops.lang') || 'en');
  React.useEffect(() => { localStorage.setItem('smartops.lang', lang); }, [lang]);
  const langs = [
    { code:'es', label:'Español', flag:'🇪🇸' },
    { code:'en', label:'English', flag:'🇬🇧' },
  ];
  const isLight = theme === 'light';
  const isAdmin = currentUser?.role === 'Admin';
  const me = isAdmin
    ? { name: 'Daniel Dorado', role: 'Admin', initials: 'DD', email: 'daniel.dorado@datadope.io' }
    : { name: 'Francisca Molina', role: 'SRE', initials: 'FM', email: 'francisca.molina@datadope.io' };
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'12px 20px', borderBottom:'1px solid var(--line)',
      background:'var(--bg)',
      position:'sticky', top:0, zIndex:20,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:24 }}>
        <Logo />
        <div style={{ width:1, height:22, background:'var(--line)' }}/>
        <div style={{ display:'flex', gap:4 }}>
          <NavPill icon={<IconAlert size={14}/>} label="Events" active={route==='events'} onClick={() => setRoute('events')}/>
          {isAdmin && <NavPill
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/></svg>}
            label="Administration"
            active={route==='admin'}
            onClick={() => setRoute('admin')}
          />}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {/* User menu */}
        <div style={{ position:'relative' }}>
          <button
            onClick={() => setUserOpen(o => !o)}
            style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'4px 10px 4px 4px', borderRadius:99,
              background:'var(--bg-3)',
              border:'1px solid var(--line)',
              color:'var(--fg)',
            }}
          >
            <div style={{
              width:28, height:28, borderRadius:99,
              background:'linear-gradient(135deg, oklch(0.55 0.12 200), oklch(0.45 0.12 260))',
              color:'#fff', fontSize:10.5, fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>{me.initials}</div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', lineHeight:1.15, paddingRight:2 }}>
              <span style={{ fontSize:12, fontWeight:600 }}>{me.name}</span>
              <span style={{ fontSize:10, color:'var(--fg-3)' }}>{me.role}</span>
            </div>
            <IconChevron size={12} style={{ color:'var(--fg-3)', transform:'rotate(90deg)' }}/>
          </button>
          {userOpen && (
            <>
              <div onClick={() => { setUserOpen(false); setLangOpen(false); }} style={{ position:'fixed', inset:0, zIndex:30 }}/>
              <div style={{
                position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:31,
                width:220, background:'var(--bg)',
                border:'1px solid var(--line-2)', borderRadius:10,
                boxShadow:'0 20px 40px -12px rgba(0,0,0,0.45)',
                padding:4, overflow:'hidden',
              }}>
                <div style={{ padding:'10px 12px 10px', borderBottom:'1px solid var(--line)', marginBottom:4 }}>
                  <div style={{ fontSize:12.5, fontWeight:600 }}>{me.name}</div>
                  <div style={{ fontSize:11, color:'var(--fg-3)', marginTop:2, wordBreak:'break-all' }}>{me.email}</div>
                  <div style={{ fontSize:10.5, color:'var(--fg-4)', marginTop:2, letterSpacing:'0.06em', textTransform:'uppercase' }} className="mono">{me.role}</div>
                </div>
                <button
                  onClick={() => setLangOpen(o => !o)}
                  style={userMenuItem}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h8"/><path d="M9 4v4"/><path d="M7 8c0 6 4 8 4 8"/><path d="M13 16c-2 0 -6 -2 -6 -8"/><path d="M13 20l4-10 4 10"/><path d="M14.5 17h5"/></svg>
                  <span style={{ flex:1, textAlign:'left' }}>Language</span>
                  <span style={{ fontSize:11, color:'var(--fg-3)', display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontSize:13 }}>{langs.find(l => l.code === lang)?.flag}</span>
                    {langs.find(l => l.code === lang)?.label}
                  </span>
                  <IconChevron size={11} style={{ color:'var(--fg-3)', transform: langOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition:'transform .15s' }}/>
                </button>
                {langOpen && (
                  <div style={{ margin:'0 6px 4px', padding:3, borderRadius:7, background:'var(--bg-2)', border:'1px solid var(--line)' }}>
                    {langs.map(l => {
                      const active = l.code === lang;
                      return (
                        <button key={l.code}
                          onClick={() => { setLang(l.code); setLangOpen(false); }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                          style={{
                            width:'100%', display:'flex', alignItems:'center', gap:10,
                            padding:'7px 9px', borderRadius:5, fontSize:12,
                            color: active ? 'var(--accent)' : 'var(--fg)',
                            background: active ? 'var(--accent-glow)' : 'transparent',
                            border:0, textAlign:'left',
                          }}
                        >
                          <span style={{ fontSize:13 }}>{l.flag}</span>
                          <span style={{ flex:1 }}>{l.label}</span>
                          {active && <IconCheck size={12}/>}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ height:1, background:'var(--line)', margin:'4px 6px' }}/>
                <button
                  onClick={() => setTheme && setTheme(isLight ? 'dark' : 'light')}
                  style={userMenuItem}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {isLight
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  }
                  <span style={{ flex:1, textAlign:'left' }}>Appearance</span>
                  <span style={{ fontSize:11, color:'var(--fg-3)' }}>{isLight ? 'Light' : 'Dark'}</span>
                </button>
                <div style={{ height:1, background:'var(--line)', margin:'4px 6px' }}/>
                <button
                  onClick={() => { setUserOpen(false); }}
                  style={userMenuItem}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <IconHeadset size={14}/>
                  <span style={{ flex:1, textAlign:'left' }}>Open support ticket</span>
                </button>
                <button
                  onClick={() => { setUserOpen(false); onLogout && onLogout(); }}
                  style={userMenuItem}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <IconLogout size={14}/>
                  <span style={{ flex:1, textAlign:'left' }}>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Logo, NavPill, IconBtn, TopBar });

const userMenuItem = {
  width:'100%', display:'flex', alignItems:'center', gap:10,
  padding:'9px 10px', borderRadius:6, fontSize:12.5,
  color:'var(--fg)', background:'transparent', border:0, textAlign:'left',
};
