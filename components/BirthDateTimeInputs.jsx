"use client";

import { useEffect, useState } from "react";

// English Month / Day / Year and Hour / Minute / AM-PM pickers.
// The browser's own date/time inputs follow the visitor's system language
// (e.g. "yyyy/月/dd" on a Chinese computer), so these keep the page English.
// Values stay in the same formats as before: "YYYY-MM-DD" and 24-hour "HH:MM".

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const selectClass =
  "w-full min-w-0 rounded border border-[#8EB1D1]/40 bg-white px-2 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";

const pad = (n) => String(n).padStart(2, "0");

function daysInMonth(year, month) {
  if (!month) return 31;
  return new Date(Number(year) || 2000, Number(month), 0).getDate();
}

function splitDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  return match ? { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) } : null;
}

export function BirthDateSelect({ value, onChange, idPrefix = "birth" }) {
  const [parts, setParts] = useState(() => splitDate(value) || { year: "", month: "", day: "" });

  // Follow outside changes (e.g. saved birth details filled in).
  useEffect(() => {
    const next = splitDate(value);
    if (next) setParts(next);
  }, [value]);

  function update(key, nextValue) {
    const next = { ...parts, [key]: nextValue };
    const maxDay = daysInMonth(next.year, next.month);
    if (Number(next.day) > maxDay) next.day = "";
    setParts(next);
    onChange(
      next.year && next.month && next.day
        ? `${next.year}-${pad(next.month)}-${pad(next.day)}`
        : ""
    );
  }

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 111 }, (_, i) => String(thisYear - i));
  const days = Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, i) => String(i + 1));

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_0.8fr_1fr]">
      <select aria-label="Birth month" id={`${idPrefix}-month`} value={parts.month} onChange={(e) => update("month", e.target.value)} className={`${selectClass} col-span-2 sm:col-span-1`}>
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={String(i + 1)}>{name}</option>
        ))}
      </select>
      <select aria-label="Birth day" value={parts.day} onChange={(e) => update("day", e.target.value)} className={selectClass}>
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select aria-label="Birth year" value={parts.year} onChange={(e) => update("year", e.target.value)} className={selectClass}>
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

function splitTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || "");
  if (!match) return null;
  const hour24 = Number(match[1]);
  return {
    hour: String(hour24 % 12 === 0 ? 12 : hour24 % 12),
    minute: match[2],
    period: hour24 < 12 ? "AM" : "PM",
  };
}

export function BirthTimeSelect({ value, onChange }) {
  const [parts, setParts] = useState(() => splitTime(value) || { hour: "", minute: "", period: "" });

  useEffect(() => {
    const next = splitTime(value);
    if (next) setParts(next);
  }, [value]);

  function update(key, nextValue) {
    const next = { ...parts, [key]: nextValue };
    setParts(next);
    if (next.hour && next.minute && next.period) {
      const hour12 = Number(next.hour) % 12;
      const hour24 = next.period === "PM" ? hour12 + 12 : hour12;
      onChange(`${pad(hour24)}:${next.minute}`);
    } else {
      onChange("");
    }
  }

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = Array.from({ length: 60 }, (_, i) => pad(i));

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <select aria-label="Birth hour" value={parts.hour} onChange={(e) => update("hour", e.target.value)} className={selectClass}>
        <option value="">Hour</option>
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <select aria-label="Birth minute" value={parts.minute} onChange={(e) => update("minute", e.target.value)} className={selectClass}>
        <option value="">Min</option>
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select aria-label="AM or PM" value={parts.period} onChange={(e) => update("period", e.target.value)} className={`${selectClass} col-span-2 sm:col-span-1`}>
        <option value="">AM/PM</option>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
