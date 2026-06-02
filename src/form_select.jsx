// Apolo Radix Select — shared trigger + listbox (full and compact table footer).

function FormSelect({
  id,
  testId,
  value,
  onChange,
  options,
  compact = false,
  placement = 'bottom',
  showCheck = true,
  className = '',
  'aria-label': ariaLabel,
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const selected = options.find(o => o.value === value);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const rootClass = [
    'form-select',
    compact ? 'form-select--compact' : '',
    className,
  ].filter(Boolean).join(' ');

  const contentClass = [
    'form-select__content',
    placement === 'top' ? 'form-select__content--top' : '',
    compact ? 'form-select__content--align-end' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClass} ref={rootRef}>
      <button
        type="button"
        id={id}
        data-testid={testId}
        className="form-select__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected?.label ?? value}</span>
        <span className="form-select__chevron" aria-hidden="true">
          <IconChevronDown size={compact ? 12 : 16}/>
        </span>
      </button>
      {open && (
        <div className={contentClass} role="listbox" aria-label={ariaLabel || id}>
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={'form-select__item' + (isSelected ? ' is-selected' : '')}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {opt.label}
                {showCheck && isSelected && (
                  <span className="form-select__check" aria-hidden="true">
                    <IconCheck size={16}/>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FormSelect });
