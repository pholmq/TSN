// TIME CONSTANTS
const yearLength = 365.2425;

export const sDay = 1 / yearLength;
// A true Julian/Gregorian year is exactly 365.2425 days.
// (In this math, sYear will conveniently equal exactly 1)
export const sYear = sDay * 365.2425;

// An average month is a 12th of a true year (approx 30.4368 days)
export const sMonth = sYear / 12;

const sWeek = sDay * 7;
const sHour = sDay / 24;
const sMinute = sHour / 60;
const sSecond = sMinute / 60;

export const speedFactOpts = {
  seconds: sSecond,
  minutes: sMinute,
  hours: sHour,
  days: sDay,
  weeks: sWeek,
  months: sMonth,
  years: sYear,
};

// Tychosium Epoch: 2000-06-21 12:00:00 UT
const TYCHOS_EPOCH_JD = 2451717.0;

export function getDefaultSpeedFact() {
  return sWeek;
}
export function getSpeedFact(fact) {
  if (fact === "sSecond") return sSecond;
  if (fact === "sMinute") return sMinute;
  if (fact === "sHour") return sHour;
  if (fact === "sDay") return sDay;
  if (fact === "sWeek") return sWeek;
  if (fact === "sMonth") return sMonth;
  if (fact === "sYear") return sYear;
}

// --- STANDARD ASTRONOMICAL MEEUS ALGORITHMS ---

export function calendarToJD(y, m, d, h = 0, min = 0, s = 0) {
  let year = y;
  let month = m;
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  let A = Math.floor(year / 100);
  let B = 2 - A + Math.floor(A / 4);

  // Julian calendar check (before Oct 15, 1582)
  if (y < 1582 || (y === 1582 && (m < 10 || (m === 10 && d < 15)))) {
    B = 0;
  }

  let JD =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    d +
    B -
    1524.5;
  JD += (h + min / 60 + s / 3600) / 24;
  return JD;
}

export function jdToCalendar(jd) {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  let A = Z;

  if (Z >= 2299161) {
    // Oct 15, 1582
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const dayFrac = B - D - Math.floor(30.6001 * E) + F;
  let d = Math.floor(dayFrac);
  const month = E < 14 ? E - 1 : E - 13;
  let year = month > 2 ? C - 4716 : C - 4715;

  const hoursFrac = (dayFrac - d) * 24;
  let h = Math.floor(hoursFrac);
  const minsFrac = (hoursFrac - h) * 60;
  let m = Math.floor(minsFrac);
  let sec = Math.round((minsFrac - m) * 60);

  if (sec >= 60) {
    sec = 0;
    m++;
  }
  if (m >= 60) {
    m = 0;
    h++;
  }
  if (h >= 24) {
    h = 0;
    d++;
  }

  return { year, month, day: d, hour: h, minute: m, second: sec };
}

// --- REWIRED TYCHOS FUNCTIONS ---

export function posToJulianDay(pos) {
  return pos / sDay + TYCHOS_EPOCH_JD;
}

export function daysToJulianDays(days) {
  return (days + TYCHOS_EPOCH_JD).toString();
}

export function posToDays(pos) {
  return Math.floor(pos / sDay + 0.00001);
}

export function posToDate(pos) {
  const cal = jdToCalendar(posToJulianDay(pos));
  return `${cal.year}-${String(cal.month).padStart(2, "0")}-${String(
    cal.day
  ).padStart(2, "0")}`;
}

export function posToTime(pos) {
  const cal = jdToCalendar(posToJulianDay(pos));
  return `${String(cal.hour).padStart(2, "0")}:${String(cal.minute).padStart(
    2,
    "0"
  )}:${String(cal.second).padStart(2, "0")}`;
}

function parseDateStr(sDate) {
  const aDate = sDate.split("-");
  if (aDate.length > 3)
    return { y: -Number(aDate[1]), m: Number(aDate[2]), d: Number(aDate[3]) };
  return { y: Number(aDate[0]), m: Number(aDate[1]), d: Number(aDate[2]) };
}

export function dateToDays(sDate) {
  const { y, m, d } = parseDateStr(sDate);
  const jd = calendarToJD(y, m, d, 12, 0, 0); // Default to noon for pure day mapping
  return jd - TYCHOS_EPOCH_JD;
}

export function timeToPos(value) {
  let aTime = value.split(":");
  let pos = aTime[0] * sHour + aTime[1] * sMinute + aTime[2] * sSecond;
  return (pos -= sHour * 12);
}

export function dateTimeToPos(dateStr, timeStr) {
  const { y, m, d } = parseDateStr(dateStr);
  const tParts = timeStr.split(":");
  const jd = calendarToJD(
    y,
    m,
    d,
    Number(tParts[0]),
    Number(tParts[1]),
    Number(tParts[2])
  );
  return sDay * (jd - TYCHOS_EPOCH_JD);
}

export function daysToDate(days) {
  return posToDate(days * sDay);
}

export function julianDayTimeToPos(julianDays, time) {
  return sDay * (julianDays - TYCHOS_EPOCH_JD) + timeToPos(time);
}

export function addYears(sDate, years) {
  const { y, m, d } = parseDateStr(sDate);
  const targetYear = y + years;
  return `${targetYear}-${String(m).padStart(2, "0")}-${String(d).padStart(
    2,
    "0"
  )}`;
}

export function addMonths(sDate, inMonths) {
  const { y, m, d } = parseDateStr(sDate);
  let newM = m + inMonths;
  let newY = y;
  while (newM > 12) {
    newM -= 12;
    newY += 1;
  }
  while (newM < 1) {
    newM += 12;
    newY -= 1;
  }
  return `${newY}-${String(newM).padStart(2, "0")}-${String(d).padStart(
    2,
    "0"
  )}`;
}

export function isValidTime(value) {
  if (!value) return false;
  let aTime = value.split(":");
  if (aTime.length > 3) return false;
  if (!/^\d+$/.test(aTime[0]) || aTime[0].length !== 2 || aTime[0] > 24)
    return false;
  if (!/^\d+$/.test(aTime[1]) || aTime[1].length !== 2 || aTime[1] > 59)
    return false;
  if (!/^\d+$/.test(aTime[2]) || aTime[2].length !== 2 || aTime[2] > 59)
    return false;
  return true;
}

export function isValidDate(value) {
  if (!value) return false;
  let aDate = value.split("-");
  if (aDate.length > 3) aDate.shift();
  if (aDate.length > 3) return false;
  if (!/^\d+$/.test(aDate[0]) || aDate[0].length > 20) return false;
  if (
    !/^\d+$/.test(aDate[1]) ||
    aDate[1].length !== 2 ||
    aDate[1] > 12 ||
    aDate[1] < 1
  )
    return false;
  if (
    !/^\d+$/.test(aDate[2]) ||
    aDate[2].length !== 2 ||
    aDate[2] > 31 ||
    aDate[2] < 1
  )
    return false;
  if (Number(aDate[0]) === 1582 && Number(aDate[1]) === 10) {
    if (aDate[2] > 4 && aDate[2] < 15) return false;
  }
  return true;
}

export function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
