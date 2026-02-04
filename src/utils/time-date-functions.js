//TIME CONSTANTS
const yearLength = 365.2425;
const earthRotations = 366.2425;

export const sDay = 1 / yearLength;
//equals 0,0027379070069885
export const sYear = sDay * 365;
export const sMonth = sDay * 30;
const sWeek = sDay * 7;
const sHour = sDay / 24;
const sMinute = sHour / 60;
const sSecond = sMinute / 60;

// { "1 minute": 1, "1 hour": 10 }

export const speedFactOpts = {
  seconds: sSecond,
  minutes: sMinute,
  hours: sHour,
  days: sDay,
  weeks: sWeek,
  months: sMonth,
  years: sYear,
};

//Note: Julian day and Julian Date are two different terms easily confused.
//Julian Day is used in astronomy. Julian Date are dates before the Gregorian calendar.

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

export function posToDays(pos) {
  pos += sHour * 12; //Set the clock to tweleve for pos 0
  // FIX: Added epsilon (0.00001) ONLY here.
  // This handles the floating point drift (x.99999 -> x+1) ensuring the day index is correct.
  // Because we floor here, the result 'g' passed to other functions remains a clean integer.
  return Math.floor(pos / sDay + 0.00001);
}

export function posToDate(pos) {
  return daysToDate(posToDays(pos));
}

export function posToJulianDay(pos) {
  return daysToJulianDays(posToDays(pos));
}
export function posToTime(pos) {
  pos += sHour * 12; //Set the clock to twelve for pos 0

  // Get the fractional part of the day (0.0 to 1.0)
  let days = pos / sDay - Math.floor(pos / sDay);

  // Convert fraction to hours, minutes, seconds
  let hours = Math.floor(days * 24);
  let minutes = Math.floor((days * 24 - hours) * 60);
  let seconds = Math.round(((days * 24 - hours) * 60 - minutes) * 60);

  // Handle rounding rollovers
  if (seconds === 60) {
    seconds = 0;
    minutes += 1;
  }

  if (minutes === 60) {
    minutes = 0;
    hours += 1;
  }

  // --- FIX: Handle 24:00:00 case ---
  if (hours === 24) {
    hours = 0;
  }
  // ---------------------------------

  let hh = ("0" + hours).slice(-2);
  let mm = ("0" + minutes).slice(-2);
  let ss = ("0" + seconds).slice(-2);

  return hh + ":" + mm + ":" + ss;
}
export function timeToPos(value) {
  let aTime = value.split(":");
  let pos = aTime[0] * sHour + aTime[1] * sMinute + aTime[2] * sSecond;
  return (pos -= sHour * 12); //Set the clock to tweleve for pos 0
}

export function daysToDate(g) {
  // REVERTED: No epsilon here. 'g' must remain an integer.
  if (g < -152556) return julianCalDayToDate(g); //Julian dates earlier than 1582-10-15
  g += 730597;
  let y = Math.floor((10000 * g + 14780) / 3652425);
  let ddd =
    g -
    (365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400));
  if (ddd < 0) {
    y = y - 1;
    ddd =
      g -
      (365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400));
  }
  let mi = Math.floor((100 * ddd + 52) / 3060);
  let mm = ((mi + 2) % 12) + 1;
  y = y + Math.floor((mi + 2) / 12);
  let dd = ddd - Math.floor((mi * 306 + 5) / 10) + 1;

  mm = ("0" + mm).slice(-2);
  dd = ("0" + dd).slice(-2);

  return y + "-" + mm + "-" + dd;
}

export function daysToJulianDays(days) {
  return (days + 2451717).toString();
}

export function julianDayTimeToPos(julianDays, time) {
  return sDay * (julianDays - 2451717) + timeToPos(time);
  //return (days + 2451717).toString();
}

export function isValidTime(value) {
  //check input
  if (!value) {
    return false;
  }

  let aTime = value.split(":");
  if (aTime.length > 3) {
    //Only hh:mm:ss
    return false;
  }
  //Check with regex that we only have numbers and a valid time
  if (!/^\d+$/.test(aTime[0]) || aTime[0].length !== 2) return false;
  if (aTime[0] > 24) return false;
  if (!/^\d+$/.test(aTime[1]) || aTime[1].length !== 2) return false;
  if (aTime[1] > 59) return false;
  if (!/^\d+$/.test(aTime[2]) || aTime[2].length !== 2) return false;
  if (aTime[2] > 59) return false;

  return true;
}

export function isValidDate(value) {
  //check input
  if (!value) {
    return false;
  }
  let aDate = value.split("-");
  if (aDate.length > 3) {
    //Assume we have a minus sign first
    aDate.shift();
  }
  if (aDate.length > 3) {
    //Only year-month-day allowed
    return false;
  }
  //Check with regex that we only have numbers and a (probably) valid date
  if (!/^\d+$/.test(aDate[0]) || aDate[0].length > 20) {
    return false;
  }
  if (!/^\d+$/.test(aDate[1]) || aDate[1].length !== 2) {
    return false;
  }
  if (aDate[1] > 12 || aDate[1] < 1) {
    return false;
  }
  if (!/^\d+$/.test(aDate[2]) || aDate[2].length !== 2) {
    return false;
  }
  if (aDate[2] > 31 || aDate[2] < 1) {
    return false;
  }
  // if (Number(aDate[0]) === 0) return false; //Year 0 is not allowed
  if (Number(aDate[0]) === 1582 && Number(aDate[1]) === 10) {
    if (aDate[2] > 4 && aDate[2] < 15) return false; //Day 5-14, oct 1582 are not dates
  }

  return true;
}

export function dateTimeToPos(date, time) {
  return sDay * dateToDays(date) + timeToPos(time);
}

export function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export function dateToDays(sDate) {
  //Calculates the number of days passed since 2000-06-21 for a date. Positive or negative
  //Taken from https://alcor.concordia.ca/~gpkatch/gdate-algorithm.html
  let aDate = sDate.split("-");
  let y, m, d;
  if (aDate.length > 3) {
    //We had a minus sign first (a BC date)
    y = -Number(aDate[1]);
    m = Number(aDate[2]);
    d = Number(aDate[3]);
  } else {
    y = Number(aDate[0]);
    m = Number(aDate[1]);
    d = Number(aDate[2]);
  }

  if (y < 1582) return julianDateToDays(sDate);
  if (y === 1582 && m < 10) return julianDateToDays(sDate);
  if (y === 1582 && m === 10 && d < 15) return julianDateToDays(sDate);

  m = (m + 9) % 12;
  y = y - Math.floor(m / 10);
  return (
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) +
    Math.floor((m * 306 + 5) / 10) +
    (d - 1) -
    730597
  );
}

export function addYears(sDate, years) {
  const aDate = sDate.split("-");
  let y;
  let date;
  if (aDate.length > 3) {
    //We had a minus sign first = a BC date
    y = -Number(aDate[1]);
    date = `${y + years}-${aDate[2]}-${aDate[3]}`;
  } else {
    y = Number(aDate[0]);
    date = `${y + years}-${aDate[1]}-${aDate[2]}`;
  }
  return date;
}

export function addMonths(sDate, inMonths) {
  const years = Math.floor(Math.abs(inMonths) / 12);
  const months = Math.abs(inMonths) % 12;
  const aDate = sDate.split("-");
  let y, m, d;
  if (aDate.length > 3) {
    //We had a minus sign first = a BC date
    y = -Number(aDate[1]);
    m = Number(aDate[2]);
    d = Number(aDate[3]);
  } else {
    y = Number(aDate[0]);
    m = Number(aDate[1]);
    d = Number(aDate[2]);
  }
  if (inMonths > 0) {
    y += years;
    m += months;
  } else {
    y -= years;
    m -= months;
  }
  if (m === 0) {
    y = y - 1;
    m = 12;
  }
  if (m === 13) {
    y = y + 1;
    m = 1;
  }
  return (
    y +
    "-" +
    m.toString().padStart(2, "0") +
    "-" +
    d.toString().padStart(2, "0")
  );
}

function julianDateToDays(sDate) {
  //Calculates the number of days passed since 2000-06-21 for a date. Positive or negative
  //Taken from https://alcor.concordia.ca/~gpkatch/gdate-algorithm.html
  let aDate = sDate.split("-");
  let y, m, d, jd;
  if (aDate.length > 3) {
    //We had a minus sign first (a BC date)
    y = -Number(aDate[1]);
    m = Number(aDate[2]);
    d = Number(aDate[3]);
  } else {
    y = Number(aDate[0]);
    m = Number(aDate[1]);
    d = Number(aDate[2]);
  }

  if (m < 3) {
    m += 12;
    y -= 1;
  }
  //Math.trunc(x)
  jd =
    Math.trunc(365.25 * (y + 4716)) + Math.trunc(30.6001 * (m + 1)) + d - 1524;

  return jd - 2451717;
}

function julianCalDayToDate(g) {
  let jDay = g + 2451717; //+ 10;
  // REVERTED: No epsilon here.
  let z = Math.floor(jDay - 1721116.5);
  let r = jDay - 1721116.5 - z;
  let year = Math.floor((z - 0.25) / 365.25);
  let c = z - Math.floor(365.25 * year);
  let month = Math.trunc((5 * c + 456) / 153);
  let day = c - Math.trunc((153 * month - 457) / 5) + r - 0.5;
  if (month > 12) {
    year = year + 1;
    month = month - 12;
  }
  month = ("0" + month).slice(-2);
  day = ("0" + day).slice(-2);
  // if (year <= 0) year -= 1;
  return year + "-" + month + "-" + day;
}
