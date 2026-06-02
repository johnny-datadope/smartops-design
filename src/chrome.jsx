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

const USER_MENU_THEMES = [
  { code: 'light', Icon: IconSun },
  { code: 'dark', Icon: IconMoon },
];

function UserMenuThemeSub({ theme, setTheme, t }) {
  const resolved = theme === 'light' ? 'light' : 'dark';
  const activeTheme = USER_MENU_THEMES.find((th) => th.code === resolved) || USER_MENU_THEMES[1];
  const ActiveIcon = activeTheme.Icon;
  const themeValueLabel = t.theme[resolved] || t.theme.dark;

  return (
    <div className="user-menu-sub">
      <button type="button" className="user-menu-sub-trigger">
        <span className="user-menu-sub-trigger__icon" aria-hidden="true">
          <ActiveIcon size={16}/>
        </span>
        <span className="user-menu-sub-trigger__label">{t.theme.label}</span>
        <span className="user-menu-value">{themeValueLabel}</span>
      </button>
      <div className="user-menu-sub-content" role="menu">
        <div className="user-menu-sub-content-inner">
          {USER_MENU_THEMES.map(({ code, Icon }) => {
            const isActive = resolved === code;
            return (
              <button
                key={code}
                type="button"
                role="menuitem"
                className={'user-menu-item' + (isActive ? ' is-active' : '')}
                onClick={() => setTheme && setTheme(code)}
              >
                <span className="user-menu-item__icon" aria-hidden="true">
                  <Icon size={16}/>
                </span>
                <span className="user-menu-item__label">{t.theme[code]}</span>
                {isActive ? <span className="user-menu-check" aria-hidden="true">✓</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UserMenuLanguageSub({ langs, lang, setLang, t }) {
  const active = langs.find((l) => l.code === lang);

  return (
    <div className="user-menu-sub">
      <button type="button" className="user-menu-sub-trigger">
        <span className="user-menu-flag" aria-hidden="true">{active?.flag ?? '🌐'}</span>
        <span className="user-menu-sub-trigger__label">{t.userMenu.language}</span>
        <span className="user-menu-value">{active?.label}</span>
      </button>
      <div className="user-menu-sub-content" role="menu">
        <div className="user-menu-sub-content-inner">
          {langs.map((l) => {
            const isActive = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                role="menuitem"
                className={'user-menu-item' + (isActive ? ' is-active' : '')}
                onClick={() => setLang(l.code)}
              >
                <span className="user-menu-item__flag" aria-hidden="true">{l.flag}</span>
                <span className="user-menu-item__label">{l.label}</span>
                {isActive ? <span className="user-menu-check" aria-hidden="true">✓</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TopBar({ onLogout, route, setRoute, theme, setTheme, currentUser }) {
  const { lang, setLang, t } = useI18n();
  const [userOpen, setUserOpen] = React.useState(false);
  const [logoutOpen, setLogoutOpen] = React.useState(false);

  const langs = [
    { code:'en-GB', label:'English', flag:'🇬🇧' },
    { code:'es-ES', label:'Español', flag:'🇪🇸' },
  ];
  const isAdmin = currentUser?.role === 'Admin';
  const me = isAdmin
    ? { name: 'Daniel Dorado', role: t.roles.admin, initials: 'DD', email: 'daniel.dorado@datadope.io' }
    : { name: 'Francisca Molina', role: t.roles.operator, initials: 'FM', email: 'francisca.molina@datadope.io' };

  const resolvedTheme = theme === 'light' ? 'light' : 'dark';

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
                <div onClick={() => setUserOpen(false)} style={{ position:'fixed', inset:0, zIndex:30 }}/>
                <div className="user-menu-dropdown">
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
                  <div className="user-menu-section-label">
                    {t.userMenu.preferences || 'Preferences'}
                  </div>
                  <UserMenuLanguageSub langs={langs} lang={lang} setLang={setLang} t={t}/>
                  <UserMenuThemeSub theme={theme} setTheme={setTheme} t={t}/>
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
