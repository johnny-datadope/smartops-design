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
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)',
      padding: 24,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 384, padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Wordmark/>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: '1.375rem', fontWeight: 600, margin: 0 }}>{t.login.title}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: 4 }}>
            {t.login.subtitle}
          </div>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{t.login.or}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        </div>

        <button onClick={() => signIn('google')} className="btn btn--outline" style={{ width: '100%' }}>
          <IconGoogle size={18}/>
          <span style={{ flex: 1, textAlign: 'left', fontSize: '0.8125rem' }}>{t.login.continueWithGoogle}</span>
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
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

Object.assign(window, { Login });
