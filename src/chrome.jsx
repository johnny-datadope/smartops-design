// Top app chrome — aligned with Apolo app-header.

function Logo({ theme }) {
  const src = theme === 'light'
    ? 'uploads/smartops-logo.svg'
    : 'uploads/smartops-logo-white.svg';
  return (
    <img
      src={src}
      alt="Datadope SmartOps"
      className="header-logo"
    />
  );
}

function NavPill({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={'btn btn--ghost btn--sm' + (active ? ' is-active' : '')}>
      {icon}{label}
    </button>
  );
}

function LogoutDialog({ open, onCancel, onConfirm, t }) {
  if (!open) return null;
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100,
      background:'rgb(0 0 0 / 0.5)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth:380, background:'var(--card)',
        border:'1px solid var(--line-2)', borderRadius:12, padding:'22px 24px',
        boxShadow:'0 24px 48px -12px rgba(0,0,0,0.45)',
      }}>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>{t.logout.confirmTitle}</div>
        <div style={{ fontSize:13, color:'var(--fg-3)', marginBottom:20 }}>{t.logout.confirmDescription}</div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onCancel} className="btn btn--outline btn--sm">{t.common.cancel}</button>
          <button onClick={onConfirm} className="btn btn--primary btn--sm">{t.logout.button}</button>
        </div>
      </div>
    </div>
  );
}

function TopBar({ onLogout, route, setRoute, theme, setTheme, currentUser }) {
  const { lang, setLang, t } = useI18n();
  const [langOpen, setLangOpen] = React.useState(false);
  const [themeOpen, setThemeOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  const [logoutOpen, setLogoutOpen] = React.useState(false);

  const langs = [
    { code:'en-GB', label:'English', flag:'🇬🇧' },
    { code:'es-ES', label:'Español', flag:'🇪🇸' },
  ];
  const themes = [
    { key:'light', label: t.theme.light },
    { key:'dark', label: t.theme.dark },
  ];
  const isAdmin = currentUser?.role === 'Admin';
  const me = isAdmin
    ? { name: 'Daniel Dorado', role: t.roles.admin, initials: 'DD', email: 'daniel.dorado@datadope.io' }
    : { name: 'Francisca Molina', role: t.roles.operator, initials: 'FM', email: 'francisca.molina@datadope.io' };

  const resolvedTheme = theme === 'light' ? 'light' : 'dark';
  const themeLabel = themes.find(th => th.key === theme)?.label || t.theme.dark;

  return (
    <>
      <header className="layout-header">
      <div className="layout-header-inner">
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <Logo theme={resolvedTheme} />
          <div style={{ width:1, height:22, background:'var(--line)' }}/>
          <div style={{ display:'flex', gap:4 }}>
            <NavPill
              icon={<IconTriangle size={14}/>}
              label={t.nav.alerts}
              active={route==='events'}
              onClick={() => setRoute('events')}
            />
            {isAdmin && (
              <NavPill
                icon={<IconShieldCheck size={14}/>}
                label={t.nav.administration}
                active={route==='admin'}
                onClick={() => setRoute('admin')}
              />
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ position:'relative' }}>
            <button
              type="button"
              onClick={() => setUserOpen(o => !o)}
              className="user-menu-trigger"
              aria-label={t.userMenu.openMenu || 'User menu'}
            >
              <div className="user-avatar">{me.initials}</div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', lineHeight:1.25, minWidth:0 }}>
                <span className="user-menu-name">{me.name}</span>
                <span className="user-menu-role">{me.role}</span>
              </div>
              <IconChevronDown size={16} style={{ color:'var(--muted-foreground)', flexShrink:0 }}/>
            </button>
            {userOpen && (
              <>
                <div onClick={() => { setUserOpen(false); setLangOpen(false); setThemeOpen(false); }} style={{ position:'fixed', inset:0, zIndex:30 }}/>
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:31,
                  width:256, background:'var(--card)', border:'1px solid var(--border)', borderRadius:10,
                  boxShadow:'0 20px 40px -12px rgba(0,0,0,0.45)', padding:4, overflow:'hidden',
                }}>
                  <div style={{ padding:'8px 10px', marginBottom:4 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div className="user-avatar" style={{ width:40, height:40, fontSize:'0.875rem' }}>{me.initials}</div>
                      <div style={{ minWidth:0, flex:1, textAlign:'left' }}>
                        <div style={{ fontSize:'0.875rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{me.name}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--muted-foreground)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{me.email}</div>
                        <span className="user-identity-role">{me.role}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ height:1, background:'var(--border)', margin:'4px 0' }}/>
                  <div style={{ padding:'4px 10px', fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--muted-foreground)' }}>
                    {t.userMenu.preferences || 'Preferences'}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLangOpen(o => !o); setThemeOpen(false); }}
                    style={userMenuItem}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    <span style={{ flex:1, textAlign:'left' }}>{t.userMenu.language}</span>
                    <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>{langs.find(l => l.code === lang)?.label}</span>
                  </button>
                  {langOpen && (
                    <div style={{ margin:'0 6px 4px', padding:3, borderRadius:7, background:'var(--bg-2)', border:'1px solid var(--line)' }}>
                      {langs.map(l => {
                        const active = l.code === lang;
                        return (
                          <button key={l.code}
                            onClick={() => { setLang(l.code); setLangOpen(false); }}
                            style={{
                              width:'100%', display:'flex', alignItems:'center', gap:10,
                              padding:'7px 9px', borderRadius:5, fontSize:12,
                              color: active ? 'var(--primary)' : 'var(--fg)',
                              background: active ? 'var(--accent-glow)' : 'transparent', border:0, textAlign:'left',
                            }}
                          >
                            <span>{l.flag}</span><span style={{ flex:1 }}>{l.label}</span>
                            {active && <IconCheck size={12}/>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ height:1, background:'var(--line)', margin:'4px 6px' }}/>
                  <button
                    type="button"
                    onClick={() => { setThemeOpen(o => !o); setLangOpen(false); }}
                    style={userMenuItem}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {resolvedTheme === 'light'
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    }
                    <span style={{ flex:1, textAlign:'left' }}>{t.theme.label}</span>
                    <span style={{ fontSize:11, color:'var(--muted-foreground)' }}>{themeLabel}</span>
                  </button>
                  {themeOpen && (
                    <div style={{ margin:'0 6px 4px', padding:3, borderRadius:7, background:'var(--bg-2)', border:'1px solid var(--line)' }}>
                      {themes.map(th => {
                        const active = th.key === theme;
                        return (
                          <button key={th.key} type="button"
                            onClick={() => { setTheme && setTheme(th.key); setThemeOpen(false); }}
                            style={{
                              width:'100%', display:'flex', alignItems:'center', gap:10,
                              padding:'7px 9px', borderRadius:5, fontSize:12,
                              color: active ? 'var(--primary)' : 'var(--fg)',
                              background: active ? 'var(--accent-glow)' : 'transparent', border:0, textAlign:'left',
                            }}
                          >
                            <span style={{ flex:1 }}>{th.label}</span>
                            {active && <IconCheck size={12}/>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ height:1, background:'var(--border)', margin:'4px 0' }}/>
                  <div style={{ padding:'4px 10px', fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--muted-foreground)' }}>
                    {t.userMenu.account}
                  </div>
                  <a
                    href="https://helpdesk.datadope.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setUserOpen(false)}
                    style={{ ...userMenuItem, textDecoration:'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <IconLifeBuoy size={14}/>
                    <span style={{ flex:1, textAlign:'left' }}>{t.userMenu.openTicket}</span>
                  </a>
                  <button
                    onClick={() => { setUserOpen(false); setLogoutOpen(true); }}
                    style={{ ...userMenuItem, color:'var(--destructive)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <IconLogout size={14}/>
                    <span style={{ flex:1, textAlign:'left' }}>{t.logout.title || t.common.logout}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </header>
      <LogoutDialog
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => { setLogoutOpen(false); onLogout && onLogout(); }}
        t={t}
      />
    </>
  );
}

Object.assign(window, { Logo, NavPill, TopBar, LogoutDialog });

const userMenuItem = {
  width:'100%', display:'flex', alignItems:'center', gap:10,
  padding:'9px 10px', borderRadius:6, fontSize:12.5,
  color:'var(--fg)', background:'transparent', border:0, textAlign:'left',
};
