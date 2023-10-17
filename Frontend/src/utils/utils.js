function saveParseTimestampToString(millis) {
  const date = new Date(millis);
  if (isNaN(date) || date.getTime() === 0) return "";
  else
    return `${String(date.getDate()).padStart(2, 0)}.${String(
      date.getMonth() + 1
    ).padStart(2, 0)}.${date.getFullYear()}`;
}

function saveParseTimestampToHumanReadableString(millis) {
  const date = new Date(millis);
  let dayDiff = daysBetween(millis, millisAtStartOfToday());

  if (isNaN(date) || date.getTime() === 0) return "";
  else if (dayDiff >= -2 && dayDiff <= 2) {
    switch (dayDiff) {
      case -2:
        return "Vorgestern";
      case -1:
        return "Gestern";
      case 0:
        return "Heute";
      case 1:
        return "Morgen";
      case 2:
        return "Übermorgen";
    }
  } else if (dayDiff >= -7 && dayDiff < 0) {
    return `Vor ${Math.abs(dayDiff)} Tagen`;
  } else if (dayDiff <= 7 && dayDiff > 0) {
    return `In ${dayDiff} Tagen`;
  } else
    return `${String(date.getDate()).padStart(2, 0)}.${String(
      date.getMonth() + 1
    ).padStart(2, 0)}.${date.getFullYear()}`;
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

function daysBetween(date1, date2) {
  // The number of milliseconds in one day
  const ONE_DAY = 1000 * 60 * 60 * 24;
  // Calculate the difference in milliseconds
  const differenceMs = date1 - date2;
  // Convert back to days and return
  return Math.round(differenceMs / ONE_DAY);
}

function isElementInViewport (el) {
  if (typeof jQuery === "function" && el instanceof jQuery) {
      el = el[0];
  }
  const rect = el.getBoundingClientRect();
  return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /* or $(window).height() */
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
  );
}

export {
  saveParseTimestampToHumanReadableString,
  saveParseTimestampToString,
  saveParseStringToBoolean,
  millisAtStartOfToday,
  millisAtStartOfDay,
  isElementInViewport,
};
