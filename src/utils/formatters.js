// Pure formatting helpers — no React, no side-effects.

export function daysToYMD(days) {
  if (!days || isNaN(days)) return { y: 0, m: 0, d: 0 };
  const totalDays = Math.floor(days);
  const y = Math.floor(totalDays / 365);
  const remAfterYears = totalDays % 365;
  const m = Math.floor(remAfterYears / 30);
  const d = remAfterYears % 30;
  return { y, m, d };
}
// export function daysToYMD(days) {
//   if (!days || isNaN(days)) return { y: 0, m: 0, d: 0 };

//   const totalDays = Math.floor(days);

//   const y = Math.floor(totalDays / 365);
//   const remAfterYears = totalDays % 365;

//   const m = Math.floor(remAfterYears / 30.42);
//   const d = Math.floor(remAfterYears % 30.42);

//   return { y, m, d };
// }
export function fmtRupees(n) {
  if (!n) return "₹0.00";
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtNum(n) {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("en-IN");
}

export function fmtYMD({ y, m, d }) {
  return `${y} year(s) ${m} month(s) ${d} day(s)`;
}
