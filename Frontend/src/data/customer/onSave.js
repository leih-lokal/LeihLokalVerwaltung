import Database from "../../database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";

export default async (customer, closePopup, createNew) => {
  if (
    await Database.fetchByIdAndType(customer.id, "customer").then((results) => {
      if (createNew) {
        return results.length > 0;
      } else {
        return results.some((result) => result._id !== customer._id);
      }
    })
  ) {
    notifier.danger("Ein Nutzer mit dieser Nummer existiert bereits!", 6000);
    return;
  }

  await (createNew
    ? Database.createDoc(customer)
    : Database.updateDoc(customer)
  )
    .then((result) => notifier.success("Nutzer gespeichert!"))
    .then(closePopup)
    .catch((error) => {
      notifier.danger("Nutzer konnte nicht gespeichert werden!", {
        persist: true,
      });
      Logger.error(error);
    });
};
