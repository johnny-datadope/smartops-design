// Login — matches the IOMETRICS SMART OPS reference: centered light card.
function Login({ onLogin }) {
  const [user, setUser] = React.useState('');
  const [pass, setPass] = React.useState('••••••••');
  const [busy, setBusy] = React.useState(false);
  const [focus, setFocus] = React.useState('user');
  const [role, setRole] = React.useState('Admin');

  const signIn = (method) => {
    setBusy(true);
    setTimeout(() => { setBusy(false); onLogin({ method, role }); }, 450);
  };

  return (
    <div style={{
      minHeight:'100vh',
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'#fafafa',
      padding:24,
      color:'#111',
      fontFamily:"'Geist', system-ui, sans-serif",
    }}>
      <div style={{
        width: 360,
        background:'#fff',
        border:'1px solid #eceef0',
        borderRadius:10,
        padding:'22px 28px 20px',
        boxShadow:'0 1px 2px rgba(0,0,0,0.03)',
      }}>
        {/* Brand lockup */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <Wordmark/>
        </div>

        <div style={{ textAlign:'center', marginBottom:18 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#111', letterSpacing:'-0.01em' }}>Sign in</div>
          <div style={{ fontSize:12, color:'#7a7f86', marginTop:4 }}>Enter your credentials to access SmartOps</div>
        </div>

        <Field label="Username">
          <input
            value={user}
            onChange={e => setUser(e.target.value)}
            onFocus={() => setFocus('user')} onBlur={() => setFocus(null)}
            placeholder="username"
            style={inputStyle(focus === 'user')}
            autoFocus
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onFocus={() => setFocus('pass')} onBlur={() => setFocus(null)}
            placeholder="••••••••"
            style={inputStyle(focus === 'pass')}
          />
        </Field>

        <Field label="Sign in as">
          <div style={{ display:'flex', gap:6 }}>
            {['Admin','SRE'].map(r => {
              const active = role === r;
              return (
                <button key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex:1, padding:'7px 10px', borderRadius:5,
                    background: active ? '#eaf3fb' : '#fff',
                    border: `1px solid ${active ? '#7ab6e3' : '#d9dce0'}`,
                    color: active ? '#2e3a8c' : '#4a5058',
                    fontSize:12, fontWeight: active ? 600 : 500,
                  }}
                >{r}</button>
              );
            })}
          </div>
        </Field>

        <button
          onClick={() => signIn('password')}
          disabled={busy}
          style={{
            width:'100%', marginTop:14, padding:'9px 14px',
            borderRadius:6,
            background:'#7ab6e3',
            border:'1px solid #6fa9d6',
            color:'#fff',
            fontWeight:500, fontSize:13,
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'18px 0 14px' }}>
          <div style={{ flex:1, height:1, background:'#ececec' }}/>
          <span style={{ fontSize:11, color:'#9aa0a6' }}>OR</span>
          <div style={{ flex:1, height:1, background:'#ececec' }}/>
        </div>

        {/* Google "continue as" */}
        <button
          onClick={() => signIn('google')}
          style={{
            width:'100%', padding:'7px 10px',
            borderRadius:6,
            background:'#fff',
            border:'1px solid #e4e7eb',
            display:'flex', alignItems:'center', gap:10,
          }}
        >
          <div style={{
            width:26, height:26, borderRadius:13,
            background:'linear-gradient(135deg, #d8a07a, #8b5e3c)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontSize:10, fontWeight:600,
            flexShrink:0,
          }}>JF</div>
          <div style={{ flex:1, textAlign:'left', lineHeight:1.2 }}>
            <div style={{ fontSize:11.5, color:'#222', fontWeight:500 }}>Continuar como Jonathan</div>
            <div style={{ fontSize:10, color:'#7a7f86', marginTop:1 }}>jonathan.fernandez@datadope.io</div>
          </div>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21.35 11.1h-9.17v2.92h5.26c-.22 1.4-1.62 4.1-5.26 4.1-3.17 0-5.75-2.62-5.75-5.86s2.58-5.86 5.75-5.86c1.8 0 3.01.77 3.7 1.43l2.53-2.44C16.87 3.94 14.78 3 12.18 3 7.12 3 3 7.12 3 12.17s4.12 9.17 9.18 9.17c5.3 0 8.82-3.72 8.82-8.96 0-.6-.07-1.06-.15-1.28z" fill="#4285F4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// IOMETRICS SMART OPS wordmark: navy "I" square + navy outline square, dark text, magenta/pink subtitle
function Wordmark() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:"'Geist Mono', monospace" }}>
      <div style={{ display:'flex', gap:2 }}>
        <div style={{ width:13, height:16, background:'#2e3a8c' }}/>
        <div style={{ width:16, height:16, border:'3px solid #2e3a8c', boxSizing:'border-box' }}/>
      </div>
      <div style={{ lineHeight:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a', letterSpacing:'0.08em' }}>METRICS</div>
        <div style={{ fontSize:8, fontWeight:700, color:'#d14a7e', letterSpacing:'0.28em', marginTop:3 }}>SMART OPS</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:12, fontWeight:500, color:'#1a1a1a', marginBottom:5 }}>{label}</div>
      {children}
    </div>
  );
}

function inputStyle(isFocus) {
  return {
    width:'100%',
    padding:'7px 10px',
    borderRadius:5,
    background:'#fff',
    border: `1px solid ${isFocus ? '#7ab6e3' : '#d9dce0'}`,
    color:'#111',
    fontSize:12.5,
    outline:'none',
    boxShadow: isFocus ? '0 0 0 3px rgba(122,182,227,0.22)' : 'none',
    transition:'all .12s',
    fontFamily:'inherit',
  };
}

Object.assign(window, { Login });
