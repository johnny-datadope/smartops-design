// Manage Users — Apolo-aligned admin CRUD (mock data, no API).

const USER_ROLES = ['admin', 'operator'];

function userLegacyFields(u) {
  const name = u.full_name || u.username || '';
  return {
    name,
    initials: getInitials(u),
    status: u.is_active ? 'active' : 'disabled',
  };
}

function withLegacy(u) {
  return { ...u, ...userLegacyFields(u) };
}

const USERS_SEED = [
  withLegacy({ id: 1, username: 'ddorado', full_name: 'Daniel Dorado', email: 'daniel.dorado@datadope.io', avatar: null, role: 'admin', auth_provider: 'google', is_active: true }),
  withLegacy({ id: 2, username: 'fmolina', full_name: 'Francisca Molina', email: 'francisca.molina@datadope.io', avatar: null, role: 'operator', auth_provider: 'google', is_active: true }),
  withLegacy({ id: 3, username: 'mrodriguez', full_name: 'Marelys Rodríguez', email: 'marelys.r@datadope.io', avatar: null, role: 'operator', auth_provider: 'local', is_active: true }),
  withLegacy({ id: 4, username: 'jfernandez', full_name: 'Jonathan Fernández', email: 'jonathan.f@datadope.io', avatar: null, role: 'admin', auth_provider: 'google', is_active: true }),
  withLegacy({ id: 5, username: 'apereira', full_name: 'Ana Pereira', email: 'ana.pereira@datadope.io', avatar: null, role: 'operator', auth_provider: 'local', is_active: true }),
  withLegacy({ id: 6, username: 'msilva', full_name: 'Mateo Silva', email: 'mateo.silva@datadope.io', avatar: null, role: 'operator', auth_provider: 'local', is_active: false }),
];
window.USERS_SEED = USERS_SEED;

function getInitials(user) {
  const source = (user.full_name || user.username || user.name || '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function isSsoUser(user) {
  return user.auth_provider !== 'local';
}

function roleLabel(t, role) {
  return (t.roles && t.roles[role]) || role;
}

function providerLabel(t, provider) {
  return (t.admin.providers && t.admin.providers[provider]) || provider;
}

function UserRoleBadge({ role }) {
  const { t } = useI18n();
  const cls = role === 'admin' ? 'badge badge--pill badge--primary-tint' : 'badge badge--pill badge--amber-tint';
  return <Badge className={cls}>{roleLabel(t, role)}</Badge>;
}

function UserStatusBadge({ active }) {
  const { t } = useI18n();
  const cls = active ? 'badge badge--pill badge--emerald-tint' : 'badge badge--pill badge--muted';
  return <Badge className={cls}>{active ? t.admin.status.active : t.admin.status.disabled}</Badge>;
}

function GoogleGlyph({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58Z"/>
    </svg>
  );
}

function UserProviderBadge({ provider, small }) {
  const { t } = useI18n();
  const isGoogle = provider === 'google';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      paddingLeft: 6, paddingRight: 8, paddingTop: small ? 0 : 2, paddingBottom: small ? 0 : 2,
      borderRadius: 9999, fontSize: small ? 10 : '0.75rem', fontWeight: 500, lineHeight: 1.25,
      border: `1px solid ${isGoogle ? 'var(--border)' : 'color-mix(in oklch, var(--primary) 40%, transparent)'}`,
      background: isGoogle ? 'var(--background)' : 'color-mix(in oklch, var(--primary) 10%, transparent)',
      color: isGoogle ? 'var(--foreground)' : 'var(--primary)',
    }}>
      {isGoogle ? <GoogleGlyph size={12}/> : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      )}
      {providerLabel(t, provider)}
    </span>
  );
}

function UsersStatCard({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '1rem 1.25rem' }}>
      <div style={{ minWidth: 0 }}>
        <div className="users-stat-value" style={{ fontWeight: 600, lineHeight: 1 }}>{value}</div>
        <div style={{ marginTop: 8, fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.025em', color: 'var(--muted-foreground)' }}>{label}</div>
      </div>
      <div className="users-stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
    </div>
  );
}

function UsersStatsGrid({ stats }) {
  const { t } = useI18n();
  return (
    <div className="users-stats-grid">
      <UsersStatCard label={t.admin.stats.totalLabel} value={stats.total}
        iconBg="color-mix(in oklch, var(--primary) 10%, transparent)" iconColor="var(--primary)"
        icon={<IconUsers size={18}/>}/>
      <UsersStatCard label={t.admin.stats.adminsLabel} value={stats.admins}
        iconBg="color-mix(in srgb, #f59e0b 10%, transparent)" iconColor="#fbbf24"
        icon={<IconShieldCheck size={18}/>}/>
      <UsersStatCard label={t.admin.stats.activeLabel} value={stats.active}
        iconBg="color-mix(in srgb, #10b981 10%, transparent)" iconColor="#10b981"
        icon={<IconCheckCircle2 size={18}/>}/>
      <UsersStatCard label={t.admin.stats.disabledLabel} value={stats.disabled}
        iconBg="color-mix(in oklch, var(--destructive) 10%, transparent)" iconColor="var(--destructive)"
        icon={<IconXCircle size={18}/>}/>
    </div>
  );
}

function UsersTableRow({ user, canDelete, onEdit, onRemove }) {
  const { t } = useI18n();
  const displayName = user.full_name || user.username;

  return (
    <tr style={{ borderBottom: '1px solid var(--line)', transition: 'background 0.15s' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div className="users-avatar">{getInitials(user)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{displayName}</span>
              <UserProviderBadge provider={user.auth_provider} small/>
            </div>
            <span className="users-table-mobile-meta" style={{ display: 'none', fontSize: 11, color: 'var(--muted-foreground)' }}>{user.username}</span>
            <span className="users-table-mobile-email" style={{ display: 'none', fontSize: 11, color: 'var(--muted-foreground)' }}>{user.email}</span>
            <div className="users-table-mobile-badges" style={{ display: 'none', marginTop: 4, gap: 6, flexWrap: 'wrap' }}>
              <UserRoleBadge role={user.role}/>
              <UserStatusBadge active={user.is_active}/>
            </div>
          </div>
        </div>
      </td>
      <td className="users-col-username" style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{user.username}</td>
      <td className="users-col-email" style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{user.email}</td>
      <td className="users-col-password" style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--muted-foreground)' }} aria-label="masked password">••••••••</td>
      <td className="users-col-role" style={{ padding: '12px 16px' }}><UserRoleBadge role={user.role}/></td>
      <td className="users-col-status" style={{ padding: '12px 16px' }}><UserStatusBadge active={user.is_active}/></td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--outline btn--sm users-btn-edit" onClick={() => onEdit(user)} title={t.admin.actions.edit}>{t.admin.actions.edit}</button>
          <button type="button" className="btn btn--outline btn--sm users-btn-remove" disabled={!canDelete} onClick={() => canDelete && onRemove(user)}
            style={{ color: 'var(--destructive)', borderColor: 'color-mix(in oklch, var(--destructive) 30%, var(--border))' }}
            title={t.admin.actions.remove}>{t.admin.actions.remove}</button>
        </div>
      </td>
    </tr>
  );
}

function UsersTable({ users, isLoading, currentUserId, onEdit, onRemove }) {
  const { t } = useI18n();
  const colSpan = 7;

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ background: 'color-mix(in oklch, var(--muted) 40%, transparent)' }}>
            <th style={usersThStyle}>{t.admin.table.user}</th>
            <th className="users-col-username" style={usersThStyle}>{t.admin.table.username}</th>
            <th className="users-col-email" style={usersThStyle}>{t.admin.table.email}</th>
            <th className="users-col-password" style={usersThStyle}>{t.admin.table.password}</th>
            <th className="users-col-role" style={usersThStyle}>{t.admin.table.role}</th>
            <th className="users-col-status" style={usersThStyle}>{t.admin.table.status}</th>
            <th style={{ ...usersThStyle, textAlign: 'right' }}>{t.admin.table.actions}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && users.length === 0 ? (
            <tr><td colSpan={colSpan} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>{t.admin.table.loading}</td></tr>
          ) : users.length === 0 ? (
            <tr><td colSpan={colSpan} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>{t.admin.table.empty}</td></tr>
          ) : users.map(u => (
            <UsersTableRow key={u.id} user={u}
              canDelete={currentUserId === undefined || u.id !== currentUserId}
              onEdit={onEdit} onRemove={onRemove}/>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const usersThStyle = {
  textAlign: 'left', fontWeight: 500, fontSize: '0.75rem',
  padding: '12px 16px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]+$/;

function UserFormDialog({ mode, user, open, onClose, onSubmit, isSubmitting }) {
  const { t } = useI18n();
  const sso = mode === 'edit' && user && isSsoUser(user);

  const emptyState = () => ({
    username: '', full_name: '', email: '', role: 'operator', password: '', is_active: true,
  });

  const fromUser = (u) => ({
    username: u.username || '',
    full_name: u.full_name || '',
    email: u.email || '',
    role: u.role || 'operator',
    password: '',
    is_active: u.is_active !== false,
  });

  const [form, setForm] = React.useState(() => (mode === 'edit' && user ? fromUser(user) : emptyState()));
  const [showPassword, setShowPassword] = React.useState(false);
  const [attempted, setAttempted] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm(mode === 'edit' && user ? fromUser(user) : emptyState());
    setAttempted(false);
    setShowPassword(false);
  }, [open, mode, user?.id]);

  if (!open) return null;

  const errors = {};
  if (!sso) {
    if (!form.username.trim()) errors.username = t.admin.form.errors.required;
    else if (!USERNAME_RE.test(form.username.trim())) errors.username = t.admin.form.errors.invalidUsername;
    if (!form.full_name.trim()) errors.full_name = t.admin.form.errors.required;
    if (!form.email.trim()) errors.email = t.admin.form.errors.required;
    else if (!EMAIL_RE.test(form.email.trim())) errors.email = t.admin.form.errors.invalidEmail;
    if (mode === 'create') {
      if (!form.password) errors.password = t.admin.form.errors.required;
      else if (form.password.length < 8) errors.password = t.admin.form.errors.passwordMin;
    } else if (form.password && form.password.length < 8) {
      errors.password = t.admin.form.errors.passwordMin;
    }
  }
  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttempted(true);
    if (hasErrors || isSubmitting) return;

    if (mode === 'create') {
      onSubmit({
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password,
        auth_provider: 'local',
        is_active: true,
      });
      return;
    }

    const payload = {};
    if (!sso) {
      if (form.username.trim() !== user.username) payload.username = form.username.trim();
      if (form.full_name.trim() !== user.full_name) payload.full_name = form.full_name.trim();
      if (form.email.trim() !== user.email) payload.email = form.email.trim();
      if (form.password) payload.password = form.password;
    }
    if (form.role !== user.role) payload.role = form.role;
    if (form.is_active !== user.is_active) payload.is_active = form.is_active;
    onSubmit(payload);
  };

  const title = mode === 'create' ? t.admin.form.createTitle : t.admin.form.editTitle;
  const description = mode === 'create' ? t.admin.form.createDescription : t.admin.form.editDescription;
  const submitLabel = mode === 'create' ? t.admin.actions.createUser : t.common.save || 'Save';

  return (
    <Modal onClose={() => { if (!isSubmitting) onClose(); }} title={title} sub={description} width={520}>
      <form onSubmit={handleSubmit} noValidate>
        {sso && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14,
            padding: 12, borderRadius: 8, border: '1px solid var(--border)',
            background: 'color-mix(in oklch, var(--muted) 40%, transparent)',
            fontSize: '0.8125rem', color: 'var(--muted-foreground)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <span>{t.admin.form.ssoNotice}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label={t.admin.form.username} required={!sso} error={attempted && errors.username}>
            <input value={form.username} disabled={sso} onChange={e => setForm(s => ({ ...s, username: e.target.value }))} style={inputStyle(attempted && errors.username)}/>
          </FormField>
          <FormField label={t.admin.form.fullName} required={!sso} error={attempted && errors.full_name}>
            <input value={form.full_name} disabled={sso} onChange={e => setForm(s => ({ ...s, full_name: e.target.value }))} style={inputStyle(attempted && errors.full_name)}/>
          </FormField>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label={t.admin.form.email} required={!sso} error={attempted && errors.email}>
              <input type="email" value={form.email} disabled={sso} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} style={inputStyle(attempted && errors.email)}/>
            </FormField>
          </div>
          <FormField label={t.admin.form.role} required>
            <select value={form.role} onChange={e => setForm(s => ({ ...s, role: e.target.value }))} style={inputStyle(false)}>
              {USER_ROLES.map(r => <option key={r} value={r}>{roleLabel(t, r)}</option>)}
            </select>
          </FormField>
          {mode === 'edit' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'color-mix(in oklch, var(--muted) 30%, transparent)',
            }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{t.admin.form.active}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', marginTop: 2 }}>
                  {form.is_active ? t.admin.status.active : t.admin.status.disabled}
                </div>
              </div>
              <button type="button" role="switch" aria-checked={form.is_active}
                onClick={() => setForm(s => ({ ...s, is_active: !s.is_active }))}
                className="switch-toggle" aria-label={t.admin.form.active}/>
            </div>
          )}
          {!sso && (
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label={
                <span>{t.admin.form.password}{mode === 'create' ? <span style={{ color: 'var(--destructive)' }}> *</span> : (
                  <span style={{ marginLeft: 4, fontSize: '0.6875rem', fontWeight: 400, color: 'var(--muted-foreground)' }}>({t.admin.form.passwordOptional})</span>
                )}</span>
              } error={attempted && errors.password}>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    placeholder={mode === 'edit' ? t.admin.form.passwordPlaceholder : undefined}
                    onChange={e => setForm(s => ({ ...s, password: e.target.value }))}
                    style={{ ...inputStyle(attempted && errors.password), paddingRight: 40 }}/>
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 4 }}
                    aria-label={showPassword ? t.admin.form.hidePassword : t.admin.form.showPassword}>
                    {showPassword ? <IconEyeOff size={16}/> : <IconEye size={16}/>}
                  </button>
                </div>
              </FormField>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn--outline btn--sm">{t.common.cancel}</button>
          <button type="submit" disabled={isSubmitting || (attempted && hasErrors)} className="btn btn--primary btn--sm">{submitLabel}</button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmRemove({ user, onCancel, onConfirm, isDeleting }) {
  const { t } = useI18n();
  const name = user.full_name || user.username;
  return (
    <Modal onClose={() => { if (!isDeleting) onCancel(); }} title={t.admin.deleteDialog.title}
      sub={t.admin.deleteDialog.description.replace('{name}', name)} width={420}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button type="button" onClick={onCancel} disabled={isDeleting} className="btn btn--outline btn--sm">{t.common.cancel}</button>
        <button type="button" onClick={onConfirm} disabled={isDeleting} className="btn btn--sm"
          style={{ background: 'color-mix(in oklch, var(--destructive) 18%, transparent)', border: '1px solid color-mix(in oklch, var(--destructive) 40%, transparent)', color: 'var(--destructive)', fontWeight: 600 }}>
          {t.admin.actions.remove}
        </button>
      </div>
    </Modal>
  );
}

function UsersToast({ message }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 60,
      padding: '11px 16px', borderRadius: 10,
      background: 'color-mix(in oklch, var(--sev-ok) 18%, var(--bg-2))',
      border: '1px solid color-mix(in oklch, var(--sev-ok) 45%, var(--line-2))',
      color: 'var(--fg)', fontSize: 12.5, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 9,
      boxShadow: '0 20px 40px -14px rgba(0,0,0,0.5)',
    }}>
      <IconCheck size={14} style={{ color: 'var(--sev-ok)' }}/>
      {message}
    </div>
  );
}

function UsersPage({ currentUser }) {
  const { t } = useI18n();
  const [users, setUsers] = React.useState(USERS_SEED);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState(null);
  const [deletingUser, setDeletingUser] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  const currentUserId = currentUser?.id;

  const sortedUsers = React.useMemo(() =>
    [...users].sort((a, b) => (a.full_name || a.username).localeCompare(b.full_name || b.username)),
  [users]);

  const stats = React.useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.is_active).length,
    disabled: users.filter(u => !u.is_active).length,
  }), [users]);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(t => (t === msg ? null : t)), 3200);
  };

  const handleCreate = async (input) => {
    setIsSubmitting(true);
    try {
      const created = withLegacy({
        id: Date.now(),
        username: input.username,
        full_name: input.full_name,
        email: input.email,
        avatar: null,
        role: input.role,
        auth_provider: input.auth_provider || 'local',
        is_active: input.is_active !== false,
      });
      setUsers(us => [created, ...us]);
      showToastMsg(t.admin.toasts.createdDescription.replace('{name}', created.full_name || created.username));
      setCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (input) => {
    if (!editingUser) return;
    if (Object.keys(input).length === 0) {
      setEditingUser(null);
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = withLegacy({ ...editingUser, ...input });
      setUsers(us => us.map(x => x.id === editingUser.id ? updated : x));
      showToastMsg(t.admin.toasts.updatedDescription.replace('{name}', updated.full_name || updated.username));
      setEditingUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const label = deletingUser.full_name || deletingUser.username;
      setUsers(us => us.filter(x => x.id !== deletingUser.id));
      showToastMsg(t.admin.toasts.deletedDescription.replace('{name}', label));
      setDeletingUser(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="layout-page" data-screen-label="03 Manage Users" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p className="admin-mobile-label" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', margin: 0 }}>
        {t.admin.sidebar.title}
      </p>
      <div className="users-header">
        <div style={{ minWidth: 0 }}>
          <h1 className="users-title" style={{ fontWeight: 700, margin: 0 }}>{t.admin.title}</h1>
          <p className="users-subtitle" style={{ marginTop: 4, color: 'var(--muted-foreground)' }}>{t.admin.subtitle}</p>
        </div>
        <button type="button" className="btn btn--primary btn--sm users-create-btn" onClick={() => setCreateOpen(true)} style={{ gap: 6 }}>
          <IconPlus size={14}/> {t.admin.actions.createUser}
        </button>
      </div>

      <UsersStatsGrid stats={stats}/>
      <UsersTable users={sortedUsers} isLoading={false} currentUserId={currentUserId}
        onEdit={setEditingUser} onRemove={setDeletingUser}/>

      <UserFormDialog mode="create" open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} isSubmitting={isSubmitting}/>
      {editingUser && (
        <UserFormDialog mode="edit" user={editingUser} open={!!editingUser}
          onClose={() => setEditingUser(null)} onSubmit={handleEdit} isSubmitting={isSubmitting}/>
      )}
      {deletingUser && (
        <ConfirmRemove user={deletingUser} onCancel={() => !isDeleting && setDeletingUser(null)}
          onConfirm={handleDelete} isDeleting={isDeleting}/>
      )}
      {toast && <UsersToast message={toast}/>}
    </div>
  );
}

function inputStyle(hasError) {
  return {
    width: '100%', padding: '9px 11px', borderRadius: 7,
    background: 'var(--bg)', border: `1px solid ${hasError ? 'var(--sev-crit)' : 'var(--line-2)'}`,
    color: 'var(--fg)', fontSize: 12.5, outline: 'none', boxSizing: 'border-box',
  };
}

function Modal({ title, sub, children, onClose, width = 520 }) {
  return (
    <div onClick={onClose} className="modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgb(0 0 0 / 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width, maxWidth: '100%',
        background: 'var(--bg-2)', border: '1px solid var(--line-2)',
        borderRadius: 12, padding: '18px 20px',
        boxShadow: '0 40px 80px -30px rgba(0,0,0,0.5)',
        animation: 'fadeUp .22s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
            {sub && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 3 }}>{sub}</div>}
          </div>
          <button type="button" onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--line)', color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClose size={13}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--fg-2)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'var(--sev-crit)', marginLeft: 3 }}>*</span>}
      </div>
      {children}
      {error && (
        <div style={{ fontSize: 11, color: 'var(--sev-crit)', marginTop: 5 }}>{error}</div>
      )}
    </div>
  );
}

Object.assign(window, { UsersPage, getInitials });
