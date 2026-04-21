// Settings page — copy of reference: Appearance card with only a Theme control (Light/Dark/System).
function SettingsPage({ tweaks, setTweaks, theme, setTheme }) {

  return (
    <div data-screen-label="02 Settings" style={{
      padding:'40px 20px 40px',
      maxWidth:860, margin:'0 auto',
    }}>
      <h1 style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.015em', margin:'0 0 6px' }}>Settings</h1>
      <div style={{ fontSize:13, color:'var(--fg-3)', marginBottom:22 }}>Configure your Iometrics SmartOps experience</div>

      <div style={{
        background:'var(--bg-2)', border:'1px solid var(--line)',
        borderRadius:12, padding:'18px 20px',
      }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Appearance</div>
        <div style={{ fontSize:12, color:'var(--fg-3)', marginBottom:16 }}>Customize how Iometrics SmartOps looks on your device</div>

        <div style={{ fontSize:12.5, fontWeight:500, marginBottom:8 }}>Theme</div>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { id:'light', label:'Light', icon:
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
              </svg>},
            { id:'dark', label:'Dark', icon:
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
              </svg>},
            { id:'system', label:'System', icon:
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 22h8M12 18v4"/>
              </svg>},
          ].map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)} style={{
              display:'inline-flex', alignItems:'center', gap:7,
              padding:'9px 16px', borderRadius:8, fontSize:12.5, fontWeight:500,
              background: theme === t.id ? 'var(--accent-glow)' : 'var(--bg-3)',
              border: `1px solid ${theme === t.id ? 'var(--accent-2)' : 'var(--line-2)'}`,
              color: theme === t.id ? 'var(--accent)' : 'var(--fg-2)',
            }}>{t.icon}{t.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SettingsPage });
