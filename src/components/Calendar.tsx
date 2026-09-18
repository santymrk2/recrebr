"use client";

import { useMemo, useState } from "react";

const WEEKDAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function Calendar({
  blockedDates,
  selectedDate,
  onSelect,
}: {
  blockedDates: string[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="br-calendar">
      <div className="br-calendar-header">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <strong>
          {MONTHS[month]} {year}
        </strong>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>
      <div className="br-calendar-grid br-calendar-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="br-calendar-grid">
        {cells.map((date, i) => {
          if (!date) return <span key={`empty-${i}`} />;
          const key = toDateKey(date);
          const isPast = date < today;
          const isBlocked = blockedSet.has(key);
          const isSelected = selectedDate === key;
          const disabled = isPast || isBlocked;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(key)}
              className={[
                "br-calendar-day",
                isSelected ? "is-selected" : "",
                disabled ? "is-disabled" : "",
              ].join(" ")}
              title={isBlocked ? "No disponible" : undefined}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
