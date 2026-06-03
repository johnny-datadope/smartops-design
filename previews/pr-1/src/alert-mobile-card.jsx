// Mobile alert row — mirrors chia/src/apolo/components/alert-mobile-card.tsx

const ALERT_MOBILE_SEV_CLASS = {
  CRITICAL: 'alert-mobile-card--sev-critical',
  HIGH: 'alert-mobile-card--sev-critical',
  WARNING: 'alert-mobile-card--sev-warning',
  MEDIUM: 'alert-mobile-card--sev-warning',
  LOW: 'alert-mobile-card--sev-info',
  INFO: 'alert-mobile-card--sev-info',
  OK: 'alert-mobile-card--sev-info',
};

function AlertMobileCard({
  event,
  eventIndex,
  showArchived,
  onOpenDetail,
  onArchive,
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const sevKey = resolveSeverityKey(event.severity, event.sev);
  const statusKey = resolveAlertStatusKey(event.alert_status, event.status);
  const caseKey = resolveCaseStatusKey(event.case_status, event.caseStatus);
  const sevClass = ALERT_MOBILE_SEV_CLASS[sevKey] || 'alert-mobile-card--sev-muted';

  const caseLabel = event.case && event.case !== '—' ? event.case : null;

  return (
    <article
      className={'alert-mobile-card card' + (sevClass ? ' ' + sevClass : '')}
      onClick={() => onOpenDetail && onOpenDetail(eventIndex)}
    >
      <div className="alert-mobile-card__inner">
        <div className="alert-mobile-card__main">
          <div className="alert-mobile-card__badges">
            <SeverityBadge sev={event.sev} severity={event.severity}/>
            <AlertStatusBadge status={event.status} alertStatus={event.alert_status}/>
            {caseLabel && (
              <span className="alert-mobile-card__case-num mono">{caseLabel}</span>
            )}
          </div>

          <div className="alert-mobile-card__title-block">
            <p className="alert-mobile-card__title">
              {event.title || event.alert_name || t.alerts.unnamedAlert}
            </p>
            {(alertSummaryText(event) || event.alert_description) && (
              <p className="alert-mobile-card__desc">
                {alertSummaryText(event) || event.alert_description}
              </p>
            )}
          </div>

          <div className="alert-mobile-card__meta">
            <span className="alert-mobile-card__meta-item">
              <IconClock size={12}/>
              {event.at || event.created_at}
            </span>
            {event.service && (
              <span className="alert-mobile-card__meta-item">
                <IconServer size={12}/>
                {event.service}
              </span>
            )}
            {caseKey && (
              <CaseStatusBadge caseStatus={event.case_status} status={event.caseStatus}/>
            )}
          </div>

          <div className="alert-mobile-card__assignee" onClick={e => e.stopPropagation()}>
            <AssigneeCell event={event}/>
          </div>
        </div>

        <div className="alert-mobile-card__actions">
          <div className="alert-mobile-card__menu-wrap" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="btn btn--ghost btn--icon alert-mobile-card__menu-btn"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(o => !o)}
            >
              <IconMoreVertical size={14}/>
            </button>
            {menuOpen && (
              <>
                <div className="alert-mobile-card__menu-backdrop" onClick={() => setMenuOpen(false)}/>
                <div className="alert-mobile-card__menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="alert-mobile-card__menu-item"
                    onClick={() => { setMenuOpen(false); onOpenDetail && onOpenDetail(eventIndex); }}
                  >
                    <IconEye size={13}/> {t.common.viewDetails}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="alert-mobile-card__menu-item"
                    onClick={() => { setMenuOpen(false); onArchive && onArchive(event); }}
                  >
                    <IconArchive size={13}/> {showArchived ? t.common.unarchive : t.common.archive}
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--icon alert-mobile-card__analyze"
            title={t.alerts.investigate}
            onClick={e => {
              e.stopPropagation();
              onOpenDetail && onOpenDetail(eventIndex);
            }}
          >
            <IconBrainCircuit size={20}/>
          </button>
        </div>
      </div>
    </article>
  );
}

Object.assign(window, { AlertMobileCard });
