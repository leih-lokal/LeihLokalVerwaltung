import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";
import { remove } from './adapter.js'

export default async (customer, closePopup) => {
  if (confirm("Soll diese/r Nutzer:in wirklich gelöscht werden?")) {
    await remove(customer)
      .then((result) => notifier.success("Nutzer:in gelöscht"))
      .then(closePopup)
      .catch(error => {
        //const msg = "Nutzer:in konnte nicht gelöscht werden!"
        const msg = error.message
        notifier.danger(msg, {
          persist: true,
        });
        Logger.error(error);
      });
  }
};
