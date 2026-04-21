// Manage Users — create / edit / disable users. Admin-facing CRUD.
const USERS_SEED = [
  { id:1, name:'Daniel Dorado',     email:'daniel.dorado@datadope.io',   role:'Admin', status:'active',  lastSeen:'2m ago',   source:'Google',    initials:'DD' },
  { id:2, name:'Francisca Molina',  email:'francisca.molina@datadope.io',role:'SRE',   status:'active',  lastSeen:'11m ago',  source:'Google',    initials:'FM' },
  { id:3, name:'Marelys Rodríguez', email:'marelys.r@datadope.io',       role:'SRE',   status:'active',  lastSeen:'1h ago',   source:'Smart Ops', initials:'MR' },
  { id:4, name:'Jonathan Fernández',email:'jonathan.f@datadope.io',      role:'Admin', status:'active',  lastSeen:'just now', source:'Google',    initials:'JF' },
  { id:5, name:'Ana Pereira',       email:'ana.pereira@datadope.io',     role:'SRE',   status:'active',  lastSeen:'3h ago',    source:'Smart Ops', initials:'AP' },
  { id:6, name:'Mateo Silva',       email:'mateo.silva@datadope.io',     role:'SRE',   status:'disabled',lastSeen:'14d ago',  source:'Smart Ops', initials:'MS' },
];
window.USERS_SEED = USERS_SEED;

const ROLES = ['Admin','SRE'];

function UsersPage() {
  const [users, setUsers] = React.useState(USERS_SEED);
  const [statFilter, setStatFilter] = React.useState('all'); // all | admins | active | disabled
  const [editing, setEditing] = React.useState(null);   // user object or 'new'
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const filtered = users.filter(u => {
    if (statFilter === 'admins' && u.role !== 'Admin') return false;
    if (statFilter === 'active' && u.status !== 'active') return false;
    if (statFilter === 'disabled' && u.status !== 'disabled') return false;
    return true;
  });

  const saveUser = (u) => {
    if (u.id) setUsers(us => us.map(x => x.id === u.id ? { ...x, ...u } : x));
    else setUsers(us => [{ ...u, id: Date.now(), status: u.status || 'active', lastSeen:'—', source: u.source || 'Smart Ops', initials: initialsOf(u.name) }, ...us]);
    setEditing(null);
  };
  const deleteUser = (id) => { setUsers(us => us.filter(x => x.id !== id)); setConfirmDelete(null); };

  return (
    <div data-screen-label="03 Manage Users" style={{ padding:'22px 28px 40px' }}>
      {/* header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.02em', margin:0 }}>Manage Users</h1>
          <div style={{ fontSize:12.5, color:'var(--fg-3)', marginTop:4 }}>Create, edit, and control access for your team</div>
        </div>
        <button onClick={() => setEditing('new')} style={{
          padding:'8px 14px', borderRadius:8,
          background:'var(--accent)', border:'1px solid var(--accent-2)',
          color:'#fff', fontSize:12.5, fontWeight:600,
          display:'inline-flex', alignItems:'center', gap:6,
        }}>
          <IconPlus size={14}/> Create user
        </button>
      </div>

      {/* stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:18 }}>
        <StatCard label="Total users"
          value={users.length}
          accent="var(--accent)" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          active={statFilter==='all'} onClick={()=>setStatFilter('all')}/>
        <StatCard label="Admins"
          value={users.filter(u=>u.role==='Admin').length}
          accent="var(--sev-high)" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
          active={statFilter==='admins'} onClick={()=>setStatFilter(statFilter==='admins' ? 'all' : 'admins')}/>
        <StatCard label="Active"
          value={users.filter(u=>u.status==='active').length}
          accent="var(--sev-ok)" icon={<IconCheck size={16}/>}
          active={statFilter==='active'} onClick={()=>setStatFilter(statFilter==='active' ? 'all' : 'active')}/>
        <StatCard label="Disabled"
          value={users.filter(u=>u.status==='disabled').length}
          accent="var(--fg-3)" icon={<IconClose size={16}/>}
          active={statFilter==='disabled'} onClick={()=>setStatFilter(statFilter==='disabled' ? 'all' : 'disabled')}/>
      </div>

      {/* table */}
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--line)', borderRadius:12, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
          <thead>
            <tr>
              <Th>User</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Source</Th><Th>Last active</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom:'1px solid var(--line)' }}>
                <td style={{ padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:28, height:28, borderRadius:99, background:'linear-gradient(135deg, oklch(0.55 0.12 200), oklch(0.45 0.12 260))', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600 }}>{u.initials}</div>
                    <span style={{ fontWeight:500 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding:'10px 12px', color:'var(--fg-2)' }} className="mono">{u.email}</td>
                <td style={{ padding:'10px 12px' }}><RolePill role={u.role}/></td>
                <td style={{ padding:'10px 12px' }}><UserStatusPill status={u.status}/></td>
                <td style={{ padding:'10px 12px' }}><SourcePill source={u.source}/></td>
                <td style={{ padding:'10px 12px', color:'var(--fg-3)' }} className="mono">{u.lastSeen}</td>
                <td style={{ padding:'10px 12px', textAlign:'right' }}>
                  <div style={{ display:'inline-flex', gap:6 }}>
                    <button onClick={()=>setEditing(u)} style={rowBtn}>Edit</button>
                    <button onClick={()=>setConfirmDelete(u)} style={{ ...rowBtn, color:'var(--sev-crit)', borderColor:'color-mix(in oklch, var(--sev-crit) 30%, var(--line))' }}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--fg-3)', fontSize:12.5 }}>No users match these filters.</div>
        )}
      </div>

      {editing && <UserForm user={editing === 'new' ? null : editing} onClose={()=>setEditing(null)} onSave={saveUser}/>}
      {confirmDelete && <ConfirmRemove user={confirmDelete} onCancel={()=>setConfirmDelete(null)} onConfirm={()=>deleteUser(confirmDelete.id)}/>}
    </div>
  );
}

function initialsOf(name='') {
  return name.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();
}

const rowBtn = {
  padding:'4px 10px', borderRadius:6, fontSize:11.5,
  border:'1px solid var(--line-2)', background:'var(--bg-3)', color:'var(--fg-2)',
};

function MiniStat({ label, value, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', textAlign:'left',
      padding:'14px 16px', borderRadius:10,
      background: active ? 'var(--accent-glow)' : 'var(--bg-2)',
      border:`1px solid ${active ? 'var(--accent-2)' : 'var(--line)'}`,
      cursor:'pointer', transition:'background .15s, border-color .15s',
    }}>
      <div style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.02em', color: active ? 'var(--accent)' : 'var(--fg)' }}>{value}</div>
      <div style={{ fontSize:11, color: active ? 'var(--accent)' : 'var(--fg-3)', marginTop:4 }}>{label}</div>
    </button>
  );
}

function RolePill({ role }) {
  const hue = role === 'Admin' ? 25 : 200;
  const c = `oklch(0.78 0.10 ${hue})`;
  return (
    <span style={{
      padding:'2px 8px', borderRadius:99, fontSize:10.5, fontWeight:500,
      background:`color-mix(in oklch, ${c} 14%, transparent)`,
      border:`1px solid color-mix(in oklch, ${c} 30%, transparent)`,
      color:c,
    }}>{role}</span>
  );
}

function SourcePill({ source }) {
  const isGoogle = source === 'Google';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'2px 8px', borderRadius:99, fontSize:10.5, fontWeight:500,
      background:'var(--bg-3)', border:'1px solid var(--line-2)',
      color:'var(--fg-2)',
    }}>
      {isGoogle
        ? <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.35 11.1h-9.17v2.92h5.26c-.22 1.4-1.62 4.1-5.26 4.1-3.17 0-5.75-2.62-5.75-5.86s2.58-5.86 5.75-5.86c1.8 0 3.01.77 3.7 1.43l2.53-2.44C16.87 3.94 14.78 3 12.18 3 7.12 3 3 7.12 3 12.17s4.12 9.17 9.18 9.17c5.3 0 8.82-3.72 8.82-8.96 0-.6-.07-1.06-.15-1.28z" fill="currentColor"/></svg>
        : <span style={{ width:8, height:8, borderRadius:2, background:'var(--accent)' }}/>}
      {source}
    </span>
  );
}

function UserStatusPill({ status }) {
  const map = {
    active:   { label:'Active',   c:'var(--sev-ok)' },
    disabled: { label:'Disabled', c:'var(--fg-4)' },
  };
  const m = map[status];
  return (
    <span style={{
      padding:'2px 8px', borderRadius:99, fontSize:10.5, fontWeight:500,
      background:`color-mix(in oklch, ${m.c} 14%, transparent)`,
      border:`1px solid color-mix(in oklch, ${m.c} 30%, transparent)`,
      color:m.c,
    }}>{m.label}</span>
  );
}

function UserForm({ user, onClose, onSave }) {
  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [role, setRole] = React.useState(user?.role || 'SRE');
  const [password, setPassword] = React.useState('');
  const [status, setStatus] = React.useState(user?.status || 'active');
  const [source, setSource] = React.useState(user?.source || 'Smart Ops');

  const isEditing = !!user;
  const isGoogle = source === 'Google';
  const sourceLocked = isEditing;         // source can never change on edit
  const emailLocked = isEditing && isGoogle;
  const passwordLocked = isEditing && isGoogle;

  const canSave = name.trim() && /\S+@\S+/.test(email);

  return (
    <Modal onClose={onClose} title={user ? 'Edit user' : 'Create user'} sub={user ? `Update details for ${user.name}` : 'Set up a new account and role'}>
      <FormField label="Full name">
        <input value={name} onChange={e=>setName(e.target.value)} style={formInput}/>
      </FormField>
      <FormField label="Email">
        <input value={email} onChange={e=>setEmail(e.target.value)} disabled={emailLocked} placeholder="name@company.com" style={{ ...formInput, ...(emailLocked ? lockedInput : null) }}/>
        {emailLocked && <div style={lockedHint}>Managed by Google — email cannot be changed here.</div>}
      </FormField>
      <FormField label="Role">
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {ROLES.map(r => (
            <button key={r} onClick={()=>setRole(r)} style={{
              padding:'7px 12px', borderRadius:7, fontSize:12,
              background: role===r ? 'var(--accent-glow)' : 'var(--bg-3)',
              border:`1px solid ${role===r ? 'var(--accent-2)' : 'var(--line-2)'}`,
              color: role===r ? 'var(--accent)' : 'var(--fg-2)',
            }}>{r}</button>
          ))}
        </div>
      </FormField>
      {!passwordLocked && (
        <FormField label={user ? 'New password (leave blank to keep)' : 'Temporary password'}>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={formInput}/>
        </FormField>
      )}
      {passwordLocked && (
        <FormField label="Password">
          <div style={{ ...formInput, ...lockedInput, display:'flex', alignItems:'center' }}>
            <span style={{ color:'var(--fg-3)', fontSize:12 }}>Managed by Google SSO</span>
          </div>
        </FormField>
      )}
      {user && (
        <FormField label="Status">
          <div style={{ display:'flex', gap:6 }}>
            {['active','disabled'].map(s => (
              <button key={s} onClick={()=>setStatus(s)} style={{
                padding:'6px 11px', borderRadius:7, fontSize:11.5, textTransform:'capitalize',
                background: status===s ? 'var(--bg-3)' : 'transparent',
                border:`1px solid ${status===s ? 'var(--line-2)' : 'var(--line)'}`,
                color: status===s ? 'var(--fg)' : 'var(--fg-2)',
              }}>{s}</button>
            ))}
          </div>
        </FormField>
      )}
      <FormField label="Source">
        <div style={{ display:'flex', gap:6 }}>
          {['Google','Smart Ops'].map(s => {
            const active = source===s;
            const disabled = sourceLocked;
            return (
              <button key={s} disabled={disabled} onClick={()=> !disabled && setSource(s)} style={{
                padding:'7px 12px', borderRadius:7, fontSize:12,
                background: active ? 'var(--accent-glow)' : 'var(--bg-3)',
                border:`1px solid ${active ? 'var(--accent-2)' : 'var(--line-2)'}`,
                color: active ? 'var(--accent)' : 'var(--fg-2)',
                opacity: disabled && !active ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}>{s}</button>
            );
          })}
        </div>
        {sourceLocked && <div style={lockedHint}>Source cannot be changed after creation.</div>}
      </FormField>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:6, paddingTop:14, borderTop:'1px solid var(--line)' }}>
        <button onClick={onClose} style={{ padding:'8px 14px', borderRadius:8, background:'var(--bg-3)', border:'1px solid var(--line-2)', color:'var(--fg-2)', fontSize:12.5 }}>Cancel</button>
        <button disabled={!canSave} onClick={()=>onSave({ id:user?.id, name, email, role, status, source })} style={{
          padding:'8px 16px', borderRadius:8,
          background: canSave ? 'var(--accent)' : 'var(--bg-3)',
          border:`1px solid ${canSave ? 'var(--accent-2)' : 'var(--line)'}`,
          color: canSave ? '#fff' : 'var(--fg-4)',
          fontSize:12.5, fontWeight:600, cursor: canSave ? 'pointer' : 'not-allowed',
        }}>{user ? 'Save changes' : 'Create user'}</button>
      </div>
    </Modal>
  );
}

function ConfirmRemove({ user, onCancel, onConfirm }) {
  return (
    <Modal onClose={onCancel} title="Remove user?" sub={`${user.name} (${user.email}) will lose access immediately.`} width={420}>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:14 }}>
        <button onClick={onCancel} style={{ padding:'8px 14px', borderRadius:8, background:'var(--bg-3)', border:'1px solid var(--line-2)', color:'var(--fg-2)', fontSize:12.5 }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding:'8px 16px', borderRadius:8, background:'color-mix(in oklch, var(--sev-crit) 18%, transparent)', border:'1px solid color-mix(in oklch, var(--sev-crit) 40%, transparent)', color:'var(--sev-crit)', fontSize:12.5, fontWeight:600 }}>Remove user</button>
      </div>
    </Modal>
  );
}

function Modal({ title, sub, children, onClose, width = 520 }) {
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:50,
      background:'oklch(0.1 0 0 / 0.55)', backdropFilter:'blur(3px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width, maxWidth:'100%',
        background:'var(--bg-2)', border:'1px solid var(--line-2)',
        borderRadius:12, padding:'18px 20px',
        boxShadow:'0 40px 80px -30px rgba(0,0,0,0.5)',
        animation:'fadeUp .22s ease',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:600 }}>{title}</div>
            {sub && <div style={{ fontSize:12, color:'var(--fg-3)', marginTop:3 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ width:26, height:26, borderRadius:6, border:'1px solid var(--line)', color:'var(--fg-2)', display:'flex', alignItems:'center', justifyContent:'center' }}><IconClose size={13}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:11.5, fontWeight:500, color:'var(--fg-2)', marginBottom:5 }}>{label}</div>
      {children}
    </div>
  );
}

const formInput = {
  width:'100%', padding:'9px 11px', borderRadius:7,
  background:'var(--bg)', border:'1px solid var(--line-2)',
  color:'var(--fg)', fontSize:12.5, outline:'none',
};

const lockedInput = {
  background:'var(--bg-3)', color:'var(--fg-3)',
  cursor:'not-allowed', opacity:0.85,
};

const lockedHint = {
  fontSize:10.5, color:'var(--fg-4)', marginTop:5,
  display:'flex', alignItems:'center', gap:5,
};

Object.assign(window, { UsersPage });
