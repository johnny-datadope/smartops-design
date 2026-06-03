// Sortable table headers — mirrors chia SortableTableHead (ghost button + Lucide arrows).

function SortHeaderIcon({ active, direction }) {
  if (!active) {
    return <IconArrowUpDown size={12} className="th-sort-icon" aria-hidden="true"/>;
  }
  if (direction === 'desc') {
    return <IconArrowDown size={12} className="th-sort-icon" aria-hidden="true"/>;
  }
  return <IconArrowUp size={12} className="th-sort-icon" aria-hidden="true"/>;
}

function TableTh({ children, className }) {
  return <th className={'table-th' + (className ? ` ${className}` : '')}>{children}</th>;
}

function SortableTh({ children, active, direction, onClick, className }) {
  return (
    <th className={'table-th' + (className ? ` ${className}` : '')}>
      <button type="button" className="th-sort-btn" onClick={onClick}>
        {children}
        <SortHeaderIcon active={active} direction={direction}/>
      </button>
    </th>
  );
}

Object.assign(window, { SortHeaderIcon, TableTh, SortableTh });
