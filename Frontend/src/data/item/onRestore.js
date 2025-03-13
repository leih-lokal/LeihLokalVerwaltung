import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";
import { update } from './adapter.js'

export default async (item, closePopup) => {
  if (confirm("Soll dieser Gegenstand wiederhergestellt werden?")) {
    item.status = "instock";
    await update(item)
      .then((result) => notifier.success("Gegenstand wiederhergestellt"))
      .then(closePopup)
      .catch(error => {
        //const msg = "Gegenstand konnte nicht wiederhergestellt werden!"
        const msg = error.message
        notifier.danger(msg, {
          persist: true,
        });
        Logger.error(error);
      });
  }
};
