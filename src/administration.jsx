// Administration shell — left-rail with sections. Section driven by the URL.
function AdministrationPage({ theme, setTheme, section, setSection, currentUser }) {
  const items = [
    { key:'users', label:'Manage Users', icon:(
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )},
    { key:'roles', label:'Roles & Permissions', icon:(
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    )},
    { key:'audit', label:'Audit Log', icon:(
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/>
      </svg>
    )},
  ];

  return (
    <div data-screen-label="04 Administration" style={{ display:'grid', gridTemplateColumns:'240px 1fr', minHeight:'calc(100vh - 58px)' }}>
      <aside style={{
        borderRight:'1px solid var(--line)',
        padding:'22px 14px',
        background:'var(--bg-2)',
        display:'flex', flexDirection:'column', gap:4,
      }}>
        <div style={{
          fontSize:10.5, color:'var(--fg-4)', letterSpacing:'0.14em',
          textTransform:'uppercase', padding:'4px 10px 10px',
        }} className="mono">Administration</div>
        {items.map(it => {
          const active = section === it.key;
          return (
            <button key={it.key}
              onClick={() => setSection(it.key)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 10px', borderRadius:8,
                background: active ? 'var(--bg-3)' : 'transparent',
                border: active ? '1px solid var(--line-2)' : '1px solid transparent',
                color: active ? 'var(--fg)' : 'var(--fg-2)',
                fontSize:12.5, fontWeight:500, textAlign:'left',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {it.icon}
              <span style={{ flex:1 }}>{it.label}</span>
            </button>
          );
        })}
      </aside>
      <main style={{ minWidth:0 }}>
        {section === 'users' && <UsersPage currentUser={currentUser}/>}
        {section === 'roles' && <AdminPlaceholder title="Roles & Permissions" sub="Define custom roles and fine-grained access for your team."/>}
        {section === 'audit' && <AdminPlaceholder title="Audit Log" sub="Trace every admin action — who changed what and when."/>}
      </main>
    </div>
  );
}

function AdminPlaceholder({ title, sub }) {
  return (
    <div style={{ padding:'22px 28px 40px' }}>
      <div style={{ marginBottom:18 }}>
        <h1 style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.02em', margin:0 }}>{title}</h1>
        <div style={{ fontSize:12.5, color:'var(--fg-3)', marginTop:4 }}>{sub}</div>
      </div>
      <div style={{
        padding:'60px 24px', borderRadius:12,
        background:'var(--bg-2)', border:'1px dashed var(--line-2)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:10, color:'var(--fg-3)', textAlign:'center',
      }}>
        <div style={{
          width:44, height:44, borderRadius:10,
          background:'var(--bg-3)', border:'1px solid var(--line-2)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'var(--fg-3)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
        </div>
        <div style={{ fontSize:13.5, fontWeight:500, color:'var(--fg-2)' }}>Coming soon</div>
        <div style={{ fontSize:12, maxWidth:360 }}>This section is a placeholder. {sub}</div>
      </div>
    </div>
  );
}

Object.assign(window, { AdministrationPage });
