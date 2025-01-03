import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";
import { update, create } from './adapter.js'

export default async (reservation, closePopup, createNew, formRef) => {
  reservation.items = reservation.item_ids.split(', ')

  await (createNew
    ? create(reservation)
    : update(reservation)
  )
    .then((result) => notifier.success("Reservierung gespeichert!"))
    .then(closePopup)
    .catch((error) => {
      //const msg = "Reservierung konnte nicht gespeichert werden!"
      const msg = error.message
      notifier.danger(msg, {
        persist: true,
      });
      Logger.error(error);
    });
};
