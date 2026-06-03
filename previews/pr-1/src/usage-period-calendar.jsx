// Dual-month range calendar — Apolo period-filter.tsx + ui/calendar.tsx

function usageStartOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function usageSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function usageStartOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function usageAddMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function usageWeekdayLabels(locale) {
  const sunday = new Date(2023, 5, 4);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    return day.toLocaleDateString(locale, { weekday: 'short' });
  });
}

function usageBuildMonthCells(viewMonth) {
  const y = viewMonth.getFullYear();
  const m = viewMonth.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDow; i++) {
    cells.push({ date: new Date(y, m, -firstDow + i + 1), outside: true });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(y, m, day), outside: false });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, outside: true });
  }
  return cells;
}

function usageDayModifiers(date, range, today) {
  const day = usageStartOfDay(date);
  const from = range?.from ? usageStartOfDay(range.from) : null;
  const to = range?.to ? usageStartOfDay(range.to) : null;
  const disabled = day > today;
  const isToday = usageSameDay(day, today);
  let rangePart = '';

  if (from && to) {
    if (usageSameDay(day, from)) rangePart = 'range-start';
    else if (usageSameDay(day, to)) rangePart = 'range-end';
    else if (day > from && day < to) rangePart = 'range-middle';
  } else if (from && usageSameDay(day, from)) {
    rangePart = 'selected';
  }

  return { disabled, isToday, rangePart };
}

function UsageMonthGrid({ viewMonth, range, today, locale, onDayClick }) {
  const cells = React.useMemo(() => usageBuildMonthCells(viewMonth), [viewMonth.getTime()]);
  const weekdays = React.useMemo(() => usageWeekdayLabels(locale), [locale]);
  const caption = viewMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="usage-rdp-month">
      <div className="usage-rdp-month__caption">
        <span className="usage-rdp-month__caption-label">{caption}</span>
      </div>
      <div className="usage-rdp-weekdays" aria-hidden="true">
        {weekdays.map((wd, i) => (
          <span key={i} className="usage-rdp-weekday">{wd}</span>
        ))}
      </div>
      <div className="usage-rdp-weeks">
        {weeks.map((week, wi) => (
          <div key={wi} className={'usage-rdp-week' + (wi > 0 ? ' usage-rdp-week--offset' : '')}>
            {week.map((cell) => {
              const mods = usageDayModifiers(cell.date, range, today);
              const outside = cell.outside;
              const cls = [
                'usage-rdp-day',
                outside ? 'is-outside' : '',
                mods.disabled ? 'is-disabled' : '',
                mods.isToday ? 'is-today' : '',
                mods.rangePart ? `is-${mods.rangePart}` : '',
              ].filter(Boolean).join(' ');
              return (
                <div key={cell.date.toISOString()} className={cls}>
                  <button
                    type="button"
                    disabled={mods.disabled}
                    onClick={() => !mods.disabled && onDayClick(cell.date)}
                    aria-label={cell.date.toLocaleDateString(locale)}
                  >
                    {cell.date.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Apolo Calendar: mode=range, numberOfMonths=2, custom click semantics */
function UsageRangeCalendar({ range, onRangeChange, defaultMonth, locale }) {
  const today = usageStartOfDay(new Date());
  const [viewMonth, setViewMonth] = React.useState(() =>
    usageStartOfMonth(defaultMonth || today)
  );

  React.useEffect(() => {
    if (defaultMonth) setViewMonth(usageStartOfMonth(defaultMonth));
  }, [defaultMonth?.getTime()]);

  const handleDayClick = (triggerDate) => {
    const day = usageStartOfDay(triggerDate);
    onRangeChange((current) => {
      const from = current?.from;
      const to = current?.to;
      if (!from || (from && to)) {
        return { from: day, to: undefined };
      }
      if (day < usageStartOfDay(from)) {
        return { from: day, to: undefined };
      }
      return { from, to: day };
    });
  };

  const monthRight = usageAddMonths(viewMonth, 1);

  return (
    <div className="usage-rdp-calendar" data-slot="calendar">
      <div className="usage-rdp-calendar__months">
        <div className="usage-rdp-calendar__nav">
          <button
            type="button"
            className="usage-rdp-nav-btn"
            aria-label="Previous month"
            onClick={() => setViewMonth((m) => usageAddMonths(m, -1))}
          >
            <IconChevronLeft size={16}/>
          </button>
          <button
            type="button"
            className="usage-rdp-nav-btn"
            aria-label="Next month"
            onClick={() => setViewMonth((m) => usageAddMonths(m, 1))}
          >
            <IconChevronRight size={16}/>
          </button>
        </div>
        <div className="usage-rdp-calendar__grid">
          <UsageMonthGrid
            viewMonth={viewMonth}
            range={range}
            today={today}
            locale={locale}
            onDayClick={handleDayClick}
          />
          <UsageMonthGrid
            viewMonth={monthRight}
            range={range}
            today={today}
            locale={locale}
            onDayClick={handleDayClick}
          />
        </div>
      </div>
    </div>
  );
}

/** Footer label — Apolo period-filter (MMM d, yyyy – MMM d, yyyy) */
function formatUsageRangeFooterLabel(from, to, locale) {
  const opts = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${from.toLocaleDateString(locale, opts)} – ${to.toLocaleDateString(locale, opts)}`;
}

Object.assign(window, { UsageRangeCalendar, formatUsageRangeFooterLabel });
