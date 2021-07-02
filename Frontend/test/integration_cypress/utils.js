const dateToString = (date) =>
  `${String(date.getDate()).padStart(2, 0)}.${String(
    date.getMonth() + 1
  ).padStart(2, 0)}.${date.getFullYear()}`;

const statusOnWebsiteDisplayValue = (status) =>
  status
    .replace("deleted", "gelöscht")
    .replace("instock", "verfügbar")
    .replace("outofstock", "verliehen")
    .replace("onbackorder", "nicht verleihbar");

const waitForPopupToClose = () =>
  cy.get(".fullscreenoverlay", { timeout: 3000 }).should("not.exist");
const clearFilter = () => cy.get(".multiSelectItem_clear").click();

function millisAtStartOfDay(millis) {
  var msPerDay = 86400 * 1000;
  return millis - (millis % msPerDay);
}

function millisAtStartOfToday() {
  return millisAtStartOfDay(new Date().getTime());
}

function isAtSameDay(millis1, millis2) {
  return millisAtStartOfDay(millis1) === millisAtStartOfDay(millis2);
}

function saveParseTimestampToHumanReadableString(millis, today) {
  const date = new Date(millis);
  let dayDiff = daysBetween(date, today);

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

function daysBetween(date1, date2) {
  // The number of milliseconds in one day
  const ONE_DAY = 1000 * 60 * 60 * 24;
  // Calculate the difference in milliseconds
  const differenceMs = date1 - date2;
  // Convert back to days and return
  return Math.round(differenceMs / ONE_DAY);
}

const resetTestData = () =>
  cy.exec("docker start testdata_generator && docker wait testdata_generator");

export {
  resetTestData,
  dateToString,
  statusOnWebsiteDisplayValue,
  waitForPopupToClose,
  clearFilter,
  isAtSameDay,
  millisAtStartOfToday,
  millisAtStartOfDay,
  saveParseTimestampToHumanReadableString,
};
