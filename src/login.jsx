// Login — centered card aligned with Apolo login-form.

function Login({ onLogin }) {
  const { t } = useI18n();
  const [user, setUser] = React.useState('');
  const [pass, setPass] = React.useState('••••••••');
  const [busy, setBusy] = React.useState(false);
  const [role, setRole] = React.useState('Admin');

  const signIn = (method) => {
    setBusy(true);
    setTimeout(() => { setBusy(false); onLogin({ method, role }); }, 450);
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="login-card__logo">
          <Wordmark/>
        </div>

        <div className="login-card__intro">
          <div className="login-card__title">{t.login.title}</div>
          <div className="login-card__subtitle">{t.login.subtitle}</div>
        </div>

        <Field label={t.login.username}>
          <input
            className="input"
            value={user}
            onChange={e => setUser(e.target.value)}
            placeholder={t.login.usernamePlaceholder}
            autoFocus
          />
        </Field>
        <Field label={t.login.password}>
          <input
            className="input"
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Field label={t.login.submit}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Admin', 'Operator'].map(r => {
              const active = role === r;
              const label = r === 'Admin' ? t.roles.admin : t.roles.operator;
              return (
                <button key={r}
                  onClick={() => setRole(r)}
                  className={'btn btn--sm ' + (active ? 'btn--ghost is-active' : 'btn--outline')}
                  style={{ flex: 1 }}
                >{label}</button>
              );
            })}
          </div>
        </Field>

        <button
          onClick={() => signIn('password')}
          disabled={busy}
          className="btn btn--primary"
          style={{ width: '100%', marginTop: 14 }}
        >
          {busy ? t.login.submitting : t.login.submit}
        </button>

        <div className="login-divider">
          <div className="login-divider__line"/>
          <span className="login-divider__text">{t.login.or}</span>
          <div className="login-divider__line"/>
        </div>

        <button onClick={() => signIn('google')} className="btn btn--outline" style={{ width: '100%' }}>
          <IconGoogle size={18}/>
          <span className="login-google__text">{t.login.continueWithGoogle}</span>
        </button>
      </div>
    </div>
  );
}

function Wordmark() {
  const [src, setSrc] = React.useState(() => {
    const theme = localStorage.getItem('smartops.theme') || 'dark';
    const resolved = theme === 'light' ? 'light' : 'dark';
    return resolved === 'light' ? 'uploads/smartops-logo.svg' : 'uploads/smartops-logo-white.svg';
  });
  React.useEffect(() => {
    const obs = new MutationObserver(() => {
      const th = document.documentElement.getAttribute('data-theme') || 'dark';
      setSrc(th === 'light' ? 'uploads/smartops-logo.svg' : 'uploads/smartops-logo-white.svg');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return <img src={src} alt="SmartOps" className="header-logo"/>;
}

function Field({ label, children }) {
  return (
    <div className="login-field">
      <div className="login-field__label">{label}</div>
      {children}
    </div>
  );
}

Object.assign(window, { Login });
