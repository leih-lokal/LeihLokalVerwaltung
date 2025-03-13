import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";
import { update } from './adapter.js'

export default async (item, closePopup) => {
  if (confirm("Soll dieser Gegenstand wirklich gelöscht werden?")) {
    item.status = "deleted";
    await update(item)
      .then((result) => notifier.success("Gegenstand gelöscht"))
      .then(closePopup)
      .catch(error => {
        //const msg = "Gegenstand konnte nicht gelöscht werden!"
        const msg = error.message
        notifier.danger(msg, {
          persist: true,
        });
        Logger.error(error);
      });
  }
};
