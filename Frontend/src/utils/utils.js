function saveParseTimestampToString(millis) {
  const date = new Date(millis);
  if (isNaN(date) || date.getTime() === 0) return "";
  else
    return `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(
      2,
      0
    )}.${date.getFullYear()}`;
}

function saveParseStringToBoolean(maybeBoolean) {
  return ["true", "ja"].includes(String(maybeBoolean).toLowerCase());
}

function millisAtStartOfDay(millis) {
  var msPerDay = 86400 * 1000;
  return millis - (millis % msPerDay);
}

function millisAtStartOfToday() {
  return millisAtStartOfDay(new Date().getTime());
}

export {
  saveParseTimestampToString,
  saveParseStringToBoolean,
  millisAtStartOfToday,
  millisAtStartOfDay,
};
