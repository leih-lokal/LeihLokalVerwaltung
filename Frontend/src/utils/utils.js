import { getNotificationsContext } from "svelte-notifications";

function saveParseDateToString(maybeDateString) {
  // TODO: date and month might be mixed up
  const date = new Date(maybeDateString);
  if (isNaN(date)) return "unbekannt";
  else return `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(2, 0)}.${date.getFullYear()}`;
}

function saveParseStringToTimeMillis(maybeDateString) {
  if (maybeDateString.match(/(\d{2})\.(\d{2})\.(\d{4})/)) {
    const dayMonthYear = maybeDateString.split(".");
    return new Date(dayMonthYear[2], dayMonthYear[1], dayMonthYear[0]).getTime();
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

function showNotification(text, type = 'success') {
  const notificationsContext = getNotificationsContext();
  const { addNotification } = notificationsContext;

  addNotification({
    text: text,
    type: type,
    position: 'top-right',
    removeAfter: type == 'success' ? 3000 : 10000,
  })
}

export { saveParseDateToString, showNotification, saveParseStringToInt, saveParseStringToTimeMillis, saveParseStringToBoolean };