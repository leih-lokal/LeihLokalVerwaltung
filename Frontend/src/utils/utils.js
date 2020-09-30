function saveParseTimestampToString(millis) {
  const date = new Date(millis);
  if (isNaN(date) || date.getTime() === 0) return "";
  else return `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(2, 0)}.${date.getFullYear()}`;
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
  return ['true', 'ja'].includes(String(maybeBoolean).toLowerCase());
}

export { saveParseTimestampToString, saveParseStringToInt, saveParseStringToTimeMillis, saveParseStringToBoolean };