// Shared assignee picker: search input + selected-count header + togglable user rows.
// Used by both the events table (AssigneeCell) and the event detail panel.
//
// Props:
//   assigned: [{ initials, name }]       — current assignees for the event
//   hasCase:  boolean                    — when true, the last remaining assignee is locked
//   onToggle: (user) => void             — called with a USERS_SEED entry
function AssigneePickerBody({ assigned, hasCase, onToggle }) {
  const [query, setQuery] = React.useState('');
  const lockLast = hasCase && assigned.length === 1;

  const rows = (window.USERS_SEED || [])
    .filter(u => u.status === 'active')
    .filter(u => !query || (u.name + u.email).toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div style={{ padding:'8px 10px', borderBottom:'1px solid var(--line)' }}>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search users…"
          style={{
            width:'100%', background:'var(--bg-2)',
            border:'1px solid var(--line-2)', borderRadius:6,
            padding:'6px 8px', fontSize:12, color:'var(--fg)', outline:'none',
          }}
        />
      </div>
      <div style={{ padding:'6px 10px', fontSize:10.5, color:'var(--fg-4)', letterSpacing:'0.12em', textTransform:'uppercase', borderBottom:'1px solid var(--line)' }} className="mono">
        {assigned.length} selected · click to toggle
      </div>
      <div style={{ overflowY:'auto', flex:1 }}>
        {rows.map(u => {
          const isSelected = assigned.some(a => a.initials === u.initials);
          const disabled = lockLast && isSelected;
          return (
            <button key={u.id}
              onClick={() => { if (!disabled) onToggle(u); }}
              disabled={disabled}
              title={disabled ? 'An open case must have at least one assignee.' : undefined}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:10,
                padding:'8px 10px', border:0, borderBottom:'1px solid var(--line)',
                background: isSelected ? 'var(--accent-glow)' : 'transparent',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.7 : 1,
                textAlign:'left',
              }}>
              <div style={{
                width:16, height:16, borderRadius:4,
                border:`1.5px solid ${isSelected ? 'var(--accent)' : 'var(--line-2)'}`,
                background: isSelected ? 'var(--accent)' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                {isSelected && <IconCheck size={11} style={{ color:'#fff' }}/>}
              </div>
              <div style={{
                width:22, height:22, borderRadius:99,
                background:'linear-gradient(135deg, oklch(0.55 0.12 200), oklch(0.45 0.12 260))',
                color:'#fff', fontSize:9.5, fontWeight:600,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>{u.initials}</div>
              <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                <div style={{ fontSize:12, color:'var(--fg)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</div>
                <div style={{ fontSize:10.5, color:'var(--fg-4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.role}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

Object.assign(window, { AssigneePickerBody });
