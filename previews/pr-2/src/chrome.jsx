// Top app chrome — aligned with Apolo app-header (desktop nav + user menu, mobile Sheet).

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

function NavPill({ icon, label, active, onClick, testId }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={'btn btn--ghost btn--sm' + (active ? ' is-active' : '')}
    >
      {icon}{label}
    </button>
  );
}

function LogoutDialog({ open, onCancel, onConfirm, t }) {
  if (!open) return null;
  return (
    <div className="logout-dialog-backdrop" onClick={onCancel}>
      <div className="logout-dialog card" onClick={e => e.stopPropagation()}>
        <div className="logout-dialog__title">{t.logout.confirmTitle}</div>
        <div className="logout-dialog__desc">{t.logout.confirmDescription}</div>
        <div className="logout-dialog__actions">
          <button type="button" onClick={onCancel} className="btn btn--outline btn--sm">{t.common.cancel}</button>
          <button type="button" onClick={onConfirm} className="btn btn--primary btn--sm">{t.logout.button}</button>
        </div>
      </div>
    </div>
  );
}

const USER_MENU_THEMES = [
  { code: 'light', Icon: IconSun },
  { code: 'dark', Icon: IconMoon },
];

function UserIdentityBlock({ me, className }) {
  return (
    <div className={'user-identity-card' + (className ? ' ' + className : '')}>
      <div className="user-avatar user-identity-card__avatar">{me.initials}</div>
      <div className="user-identity-card__text">
        <div className="user-identity-card__name">{me.name}</div>
        <div className="user-identity-card__email">{me.email}</div>
        <span className="user-identity-role">{me.role}</span>
      </div>
    </div>
  );
}

function MobileNavDrawer({
  open,
  onClose,
  route,
  setRoute,
  theme,
  setTheme,
  isAdmin,
  me,
  langs,
  lang,
  setLang,
  t,
  onLogout,
}) {
  if (!open) return null;

  const resolvedTheme = theme === 'light' ? 'light' : 'dark';

  return (
    <>
      <div className="mobile-nav-backdrop" onClick={onClose} aria-hidden="true"/>
      <aside className="mobile-nav-sheet" role="dialog" aria-modal="true" aria-label={t.userMenu.openMenu || 'Menu'}>
        <header className="mobile-nav-sheet__header">
          <UserIdentityBlock me={me} className="mobile-nav-sheet__identity"/>
          <button type="button" className="btn btn--ghost btn--icon mobile-nav-sheet__close" onClick={onClose} aria-label={t.common.close}>
            <IconClose size={18}/>
          </button>
        </header>

        <div className="mobile-nav-sheet__body">
          <nav className="mobile-nav-sheet__nav">
            <button
              type="button"
              data-testid="navbar-events-mobile"
              className={'mobile-nav-link' + (route === 'events' ? ' is-active' : '')}
              onClick={() => { setRoute('events'); onClose(); }}
            >
              <IconTriangle size={16}/> {t.nav.alerts}
            </button>
            {isAdmin ? (
              <button
                type="button"
                data-testid="navbar-admin-mobile"
                className={'mobile-nav-link' + (route === 'admin' ? ' is-active' : '')}
                onClick={() => { setRoute('admin'); onClose(); }}
              >
                <IconShieldCheck size={16}/> {t.nav.administration}
              </button>
            ) : null}
          </nav>

          <div className="mobile-nav-divider"/>

          <div className="user-menu-section-label">{t.userMenu.preferences || 'Preferences'}</div>
          <div className="mobile-nav-prefs">
            <div className="mobile-nav-prefs__block">
              <div className="mobile-nav-prefs__label">{t.userMenu.language}</div>
              <div className="mobile-nav-prefs__chips">
                {langs.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    className={'btn btn--sm ' + (lang === l.code ? 'btn--primary' : 'btn--outline')}
                    onClick={() => setLang(l.code)}
                  >
                    <span aria-hidden="true">{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mobile-nav-prefs__block">
              <div className="mobile-nav-prefs__label">{t.theme.label}</div>
              <div className="mobile-nav-prefs__chips">
                {USER_MENU_THEMES.map(({ code, Icon }) => (
                  <button
                    key={code}
                    type="button"
                    className={'btn btn--sm ' + (resolvedTheme === code ? 'btn--primary' : 'btn--outline')}
                    onClick={() => setTheme && setTheme(code)}
                  >
                    <Icon size={14}/> {t.theme[code]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mobile-nav-divider"/>

          <div className="user-menu-section-label">{t.userMenu.account}</div>
          <button
            type="button"
            className="mobile-nav-account-item mobile-nav-account-item--danger"
            onClick={() => { onClose(); onLogout(); }}
          >
            <IconLogout size={14}/> {t.logout.title || t.common.logout}
          </button>
        </div>
      </aside>
    </>
  );
}

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
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [logoutOpen, setLogoutOpen] = React.useState(false);

  const langs = [
    { code: 'en-GB', label: 'English', flag: '🇬🇧' },
    { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
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
          <div className="header-brand">
            <Logo theme={resolvedTheme}/>
            <div className="header-nav-divider" aria-hidden="true"/>
            <nav className="header-nav" aria-label="Main">
              <NavPill
                testId="navbar-events-desktop"
                icon={<IconTriangle size={14}/>}
                label={t.nav.alerts}
                active={route === 'events'}
                onClick={() => setRoute('events')}
              />
              {isAdmin && (
                <NavPill
                  testId="navbar-admin-desktop"
                  icon={<IconShieldCheck size={14}/>}
                  label={t.nav.administration}
                  active={route === 'admin'}
                  onClick={() => setRoute('admin')}
                />
              )}
            </nav>
          </div>

          <div className="header-actions">
            <div className="user-menu-desktop" style={{ position: 'relative' }}>
              <button
                type="button"
                data-testid="navbar-user-menu"
                onClick={() => setUserOpen(o => !o)}
                className="user-menu-trigger"
                aria-label={t.userMenu.openMenu || 'User menu'}
                aria-expanded={userOpen}
              >
                <div className="user-avatar">{me.initials}</div>
                <div className="user-menu-trigger__text">
                  <span className="user-menu-name">{me.name}</span>
                  <span className="user-menu-role">{me.role}</span>
                </div>
                <IconChevronDown size={16} className="user-menu-trigger__chevron"/>
              </button>
              {userOpen && (
                <>
                  <div onClick={() => setUserOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }}/>
                  <div className="user-menu-dropdown">
                    <div style={{ padding: '8px 10px', marginBottom: 4 }}>
                      <UserIdentityBlock me={me}/>
                    </div>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }}/>
                    <div className="user-menu-section-label">
                      {t.userMenu.preferences || 'Preferences'}
                    </div>
                    <UserMenuLanguageSub langs={langs} lang={lang} setLang={setLang} t={t}/>
                    <UserMenuThemeSub theme={theme} setTheme={setTheme} t={t}/>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }}/>
                    <div className="user-menu-section-label">{t.userMenu.account}</div>
                    {isAdmin ? (
                      <button
                        type="button"
                        className="user-menu-item"
                        onClick={() => { setUserOpen(false); setRoute('admin'); }}
                      >
                        <IconShieldCheck size={14}/>
                        <span className="user-menu-item__label">{t.nav.administration}</span>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="user-menu-item user-menu-item--destructive"
                      onClick={() => { setUserOpen(false); setLogoutOpen(true); }}
                    >
                      <IconLogout size={14}/>
                      <span className="user-menu-item__label">{t.logout.title || t.common.logout}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className="btn btn--ghost btn--icon header-menu-btn"
              aria-label={t.userMenu.openMenu || 'Menu'}
              onClick={() => setMobileNavOpen(true)}
            >
              <IconMenu size={20}/>
            </button>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        route={route}
        setRoute={setRoute}
        theme={theme}
        setTheme={setTheme}
        isAdmin={isAdmin}
        me={me}
        langs={langs}
        lang={lang}
        setLang={setLang}
        t={t}
        onLogout={() => setLogoutOpen(true)}
      />

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
