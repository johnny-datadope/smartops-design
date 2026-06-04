// Confirm create case — mirrors Apolo ConfirmCreateCaseDialog.

function ConfirmCreateCaseDialog({ open, onOpenChange, onConfirm, isConfirming }) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 60 }}
      onClick={() => !isConfirming && onOpenChange && onOpenChange(false)}
      data-testid="confirm-case-creation-dialog"
    >
      <div
        className="card"
        role="dialog"
        aria-modal="true"
        style={{ width: '100%', maxWidth: 420, padding: '1.25rem 1.5rem' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 8px' }}>
          {t.alerts.createCaseTitle}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {t.alerts.createCaseDescription}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            disabled={isConfirming}
            onClick={() => onOpenChange && onOpenChange(false)}
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            disabled={isConfirming}
            data-testid="confirm-case-creation-continue"
            onClick={onConfirm}
          >
            {isConfirming ? t.common.loading : t.alerts.createCaseConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ConfirmCreateCaseDialog });
