// Assignee picker — mirrors Apolo AssigneeSelector (search, “Assigned to me”, checkbox rows).

function AssigneePickerBody({ assigned, hasCase, onToggle, footer }) {
  const { t } = useI18n();
  const [query, setQuery] = React.useState('');
  const lockLast = hasCase && assigned.length === 1;

  const sessionUser = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('smartops.user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return typeof getSessionUser === 'function' ? getSessionUser(parsed) : null;
    } catch {
      return null;
    }
  }, []);

  const allUsers = (window.USERS_SEED || []).filter(u => u.status === 'active');

  const normalized = query.trim().toLowerCase();
  const matchesUser = (user) => {
    if (!normalized) return true;
    const fullName = (user.full_name || user.name || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return fullName.includes(normalized)
      || username.includes(normalized)
      || email.includes(normalized);
  };

  const isSelected = (user) => assigned.some((a) =>
    (user.id != null && a.user_id === user.id)
    || a.initials === user.initials,
  );

  const sessionSeed = sessionUser
    ? allUsers.find(u => u.id === sessionUser.id) || {
      id: sessionUser.id,
      full_name: sessionUser.full_name,
      name: sessionUser.full_name,
      initials: sessionUser.initials,
      username: sessionUser.username,
    }
    : null;

  const currentUserMatches = sessionSeed ? matchesUser(sessionSeed) : false;
  const otherUsers = allUsers
    .filter(u => u.id !== sessionSeed?.id)
    .filter(matchesUser);
  const hasAnyMatch = currentUserMatches || otherUsers.length > 0;
  const hasUsers = allUsers.length > 0 || Boolean(sessionSeed);

  const renderRow = (user, label, testId) => {
    const selected = isSelected(user);
    const disabled = lockLast && selected;
    return (
      <div
        key={user.id || user.initials}
        role="button"
        tabIndex={disabled ? -1 : 0}
        data-testid={testId}
        data-user-id={user.id != null ? String(user.id) : undefined}
        className={'assignee-selector__row' + (disabled ? ' is-disabled' : '')}
        onClick={() => { if (!disabled) onToggle(user); }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(user);
          }
        }}
      >
        <span
          className={'assignee-selector__checkbox' + (selected ? ' is-checked' : '')}
          aria-hidden="true"
        >
          {selected ? <IconCheck size={14} sw={2.5}/> : null}
        </span>
        <span className="assignee-selector__label">{label}</span>
      </div>
    );
  };

  return (
    <div className="assignee-selector">
      {hasUsers && (
        <div className="assignee-selector__search-wrap">
          <span className="assignee-selector__search-icon" aria-hidden="true">
            <IconSearch size={14}/>
          </span>
          <input
            type="search"
            className="assignee-selector__search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
            placeholder={t.filters.searchUsers}
            autoFocus
          />
        </div>
      )}
      <div className="assignee-selector__list">
        {sessionSeed && currentUserMatches && (
          <>
            {renderRow(sessionSeed, t.filters.assignedToMe, 'assign-to-me')}
            {otherUsers.length > 0 && <div className="assignee-selector__divider"/>}
          </>
        )}
        {otherUsers.map(user => renderRow(
          user,
          user.full_name || user.name || user.username,
          'assignee-option',
        ))}
        {!hasUsers && !hasAnyMatch && (
          <div className="assignee-selector__empty">
            {t.alertDetail.noUsersAvailable}
          </div>
        )}
        {hasUsers && !hasAnyMatch && (
          <div className="assignee-selector__empty">
            {t.filters.noUsersFound}
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}

Object.assign(window, { AssigneePickerBody });
