// Pure formatting helpers — no React, no side-effects.

export function daysToYMD(days) {
  if (!days || isNaN(days) || days < 0) return "0 year(s), 0 month(s), 0 day(s)";

  const YEARS_IN_DAYS = 365;
  const MONTH_IN_DAYS = 30.42;

  const totalDays = Math.floor(days);
  const y = Math.floor(totalDays / YEARS_IN_DAYS);
  const remainingAfterYears = totalDays % YEARS_IN_DAYS;
  const m = Math.floor(remainingAfterYears / MONTH_IN_DAYS);
  const d = Math.floor(remainingAfterYears % MONTH_IN_DAYS);

  return `${y} year(s), ${m} month(s), ${d} day(s)`;
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
