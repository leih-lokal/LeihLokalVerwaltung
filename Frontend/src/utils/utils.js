function saveParseTimestampToString(millis) {
  const date = new Date(millis);
  if (isNaN(date) || date.getTime() === 0) return "";
  else
    return `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(
      2,
      0
    )}.${date.getFullYear()}`;
}

function saveParseStringToTimeMillis(maybeDateString) {
  if (maybeDateString.match(/(\d{2})\.(\d{2})\.(\d{4})/)) {
    const dayMonthYear = maybeDateString.split(".");
    return new Date(dayMonthYear[2], dayMonthYear[1] - 1, dayMonthYear[0]).getTime();
  } else {
    return 0;
  }
}

function saveParseStringToInt(maybeInt) {
  if (isNaN(maybeInt)) return maybeInt;
  else return parseInt(maybeInt);
}

function saveParseStringToBoolean(maybeBoolean) {
  return ["true", "ja"].includes(String(maybeBoolean).toLowerCase());
}

function hashString(text) {
  var hash = 0,
    i,
    chr;
  for (i = 0; i < text.length; i++) {
    chr = text.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return String(hash);
}

function millisAtStartOfDay(millis) {
  var msPerDay = 86400 * 1000;
  return millis - (millis % msPerDay);
}

function isBeforeDay(m1, m2) {
  return millisAtStartOfDay(m1) < millisAtStartOfDay(m2);
}

function isToday(millis) {
  return millisAtStartOfDay(millis) === millisAtStartOfDay(new Date().getTime());
}

function isBeforeToday(millis) {
  return isBeforeDay(millis, new Date().getTime());
}

export {
  saveParseTimestampToString,
  saveParseStringToInt,
  saveParseStringToTimeMillis,
  saveParseStringToBoolean,
  hashString,
  isToday,
  isBeforeToday,
  isBeforeDay,
};
