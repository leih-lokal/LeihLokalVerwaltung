import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";
import { remove } from './adapter.js'

export default async (rental, closePopup) => {
  if (confirm("Soll dieser Leihvorgang wirklich gelöscht werden?")) {
    await remove(rental)
      .then((result) => notifier.success("Leihvorgang gelöscht"))
      .then(closePopup)
      .catch(error => {
        //const msg = "Leihvorgang konnte nicht gelöscht werden!"
        const msg = error.message
        notifier.danger(msg, { persist: true });
        Logger.error(error);
      });
  }
};
