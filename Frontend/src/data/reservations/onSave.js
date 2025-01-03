import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";

export default async (reservation, closePopup, createNew, formRef) => {
  reservation = {
    ...reservation,
    items: reservation.item_ids.split(', ')
  }
  delete reservation.item_ids

  await (createNew
    ? Promise.reject()  // TODO!
    : Promise.reject()  // TODO!
  )
    .then((result) => notifier.success("Reservierung gespeichert!"))
    .then(closePopup)
    .catch((error) => {
      notifier.danger("Reservierung konnte nicht gespeichert werden!", {
        persist: true,
      });
      Logger.error(error);
    });
};
