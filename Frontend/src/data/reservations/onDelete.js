import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";

export default (reservation, closePopup) => {
  if (confirm("Soll diese Reservierung wirklich gelöscht werden?")) {
    return Promise.reject()  // TODO!
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
