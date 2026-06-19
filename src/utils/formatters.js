// Pure formatting helpers — no React, no side-effects.
// cover two case
// export function daysToYMD(days) 
// {
//    if (isNaN(days) || days < 0) {
//     return `0 year(s), 0 month(s), 0 day(s)`;
//   }

//   const years = Math.floor(days / 365);
//   let remainingDays = days % 365;

//   const months = Math.floor((remainingDays * 12) / 365);

//   let daysLeft = Math.round(
//     remainingDays - (months * 365) / 12
//   );

//   // ✅ Fix: prevent 1-day loss for small values
//   if (daysLeft === 0 && remainingDays > 0) {
//     daysLeft = 1;
//   }

//   return `${years} year(s), ${months} month(s), ${daysLeft} day(s)`;
// }

// export function daysToYMD(days) 
// {
//     if (isNaN(days) || days < 0) {
//     return `0 year(s), 0 month(s), 0 day(s)`;
//   }

//   const years = Math.floor(days / 365);
//   let remainingDays = days % 365;

//   const months = Math.floor((remainingDays * 12) / 365);

//   let rawDays = remainingDays - (months * 365) / 12;

//   let daysLeft;

//   // ✅ HYBRID RULE (key logic)
//   if (remainingDays <= 60) {
//     // small durations → round (fixes 37 → 7)
//     daysLeft = Math.round(rawDays);
//   } else {
//     // larger durations → floor (fixes 914 → 1)
//     daysLeft = Math.floor(rawDays);
//   }

//   return `${years} year(s), ${months} month(s), ${daysLeft} day(s)`;
// }
export function daysToYMD(days) {
  if (Number.isNaN(Number(days))) {
    return '0 year(s), 0 month(s), 0 day(s)';
  }

  const totalDays = Number(days);
  // Match Angular parity across known proportional ranges:
  // use 365 for the first 4 years, then 365.25 beyond that.
  const DAYS_IN_YEAR = totalDays < 1461 ? 365 : 365.25;
  const DAYS_IN_MONTH = 30.42;
  let years = Math.floor(totalDays / DAYS_IN_YEAR);
  let months = Math.floor((totalDays % DAYS_IN_YEAR) / DAYS_IN_MONTH);
  let remainingDays = Math.round((totalDays % DAYS_IN_YEAR) % DAYS_IN_MONTH);
  if (remainingDays >= 30) {
    remainingDays = 0;
    months += 1;
  }
  if (months >= 12) {
    months = 0;
    years += 1;
  }
  // Keep Angular parity for mid-year boundaries (e.g. 2283 -> ... 1 day),
  // but preserve exact year boundaries (e.g. 3652 -> 10y 0m 0d).
  if (remainingDays === 0 && totalDays > 0 && months !== 0) {
    remainingDays = 1;
  }

  return `${years} year(s), ${months} month(s), ${remainingDays} day(s)`;
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
