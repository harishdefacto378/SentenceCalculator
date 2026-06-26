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
  if (isNaN(days)) {
    return '0 year(s), 0 month(s), 0 day(s)';
  }

  // For sentences spanning 4+ years use 365.25 days/year to account for leap
  // years (matches Angular); shorter sentences use a flat 365.
  const DAYS_IN_YEAR = days < 1461 ? 365 : 365.25;
  const DAYS_IN_MONTH = 30.42;

  const years = Math.floor(days / DAYS_IN_YEAR);
  const months = Math.floor((days % DAYS_IN_YEAR) / DAYS_IN_MONTH);
  const remainingDays = Math.floor((days % DAYS_IN_YEAR) % DAYS_IN_MONTH);

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
