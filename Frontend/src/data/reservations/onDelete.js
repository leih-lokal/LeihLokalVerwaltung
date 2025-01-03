import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";
import { remove } from './adapter.js'

export default (reservation, closePopup) => {
  if (confirm("Soll diese Reservierung wirklich gelöscht werden?")) {
    return remove(reservation.id)
      .then(() => notifier.success("Reservierung gelöscht!"))
      .then(closePopup)
      .catch((error) => {
        Logger.error(error);
        notifier.danger("Reservierung konnte nicht gelöscht werden!", {
          persist: true,
        });
      });
  }
};
