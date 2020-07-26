import { getNotificationsContext } from "svelte-notifications";

function saveParseDateToString(maybeDateString) {
  const date = new Date(maybeDateString);
  if (isNaN(date)) return "unbekannt";
  else return `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(2, 0)}.${date.getFullYear()}`;
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

export { saveParseDateToString, showNotification };