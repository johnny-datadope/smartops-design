// Table footer — mirrors chia/src/apolo/components/table-pagination.tsx

function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) {
  const { t } = useI18n();
  const startItem = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxPages = 5;
    const page1 = currentPage + 1;
    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page1 <= 3) {
        for (let i = 2; i <= 4; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (page1 >= totalPages - 2) {
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push('ellipsis');
        pages.push(page1 - 1);
        pages.push(page1);
        pages.push(page1 + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const sizeOptions = pageSizeOptions.map(n => ({ value: String(n), label: String(n) }));

  return (
    <div className="table-pagination">
      <span className="table-pagination__range mono">{startItem}–{endItem} / {totalItems}</span>
      {totalPages > 1 && (
        <div className="table-pagination__pages">
          <button type="button" className="page-num" disabled={currentPage <= 0} onClick={() => onPageChange(currentPage - 1)} aria-label="Previous page">‹</button>
          {getPageNumbers().map((page, i) =>
            page === 'ellipsis' ? (
              <span key={'e' + i} className="table-pagination__ellipsis" aria-hidden="true">…</span>
            ) : (
              <button
                key={page}
                type="button"
                className={'page-num' + (page === currentPage + 1 ? ' is-active' : '')}
                onClick={() => onPageChange(page - 1)}
                aria-current={page === currentPage + 1 ? 'page' : undefined}
              >{page}</button>
            )
          )}
          <button type="button" className="page-num" disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)} aria-label="Next page">›</button>
        </div>
      )}
      <div className="table-pagination__rows">
        <span className="table-pagination__rows-label">{t.common.rows}</span>
        <FormSelect
          compact
          placement="top"
          showCheck={false}
          value={String(pageSize)}
          onChange={v => onPageSizeChange(Number(v))}
          options={sizeOptions}
          aria-label={t.common.rows}
        />
      </div>
    </div>
  );
}

Object.assign(window, { TablePagination });
