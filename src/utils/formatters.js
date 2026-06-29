// Pure formatting helpers — no React, no side-effects.
import sentenceData from './sentence-data.json';

// Lookup table: days → sentence string (days 1..3652), built once.
const SENTENCE_BY_DAYS = new Map(sentenceData.map((e) => [e.days, e.sentence]));

export function daysToYMD(days) {
  const n = Number(days);
  if (isNaN(n)) {
    return '0 year(s), 0 month(s), 0 day(s)';
  }

  const rounded = Math.round(n);
  if (rounded <= 0) {
    return '0 year(s), 0 month(s), 0 day(s)';
  }

  // Authoritative lookup (days 1..3652) — matches Angular output exactly.
  const matched = SENTENCE_BY_DAYS.get(rounded);
  if (matched) {
    return matched;
  }

  // Fallback for days beyond the table: 365.25/year for 4+ years, else 365.
  const DAYS_IN_YEAR = rounded < 1461 ? 365 : 365.25;
  const DAYS_IN_MONTH = 30.42;
  const years = Math.floor(rounded / DAYS_IN_YEAR);
  const months = Math.floor((rounded % DAYS_IN_YEAR) / DAYS_IN_MONTH);
  const remainingDays = Math.floor((rounded % DAYS_IN_YEAR) % DAYS_IN_MONTH);

  return `${years} year(s) ${months} month(s) ${remainingDays} day(s)`;
}




export function fmtRupees(n) {
  if (!n) return "₹0.00";
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtNum(n) {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("en-IN");
}

export function fmtYMD(value) {
  return value;
}
