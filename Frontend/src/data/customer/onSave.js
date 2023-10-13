import Database from "../../database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";

export default async (customer, closePopup, createNew, formRef) => {
  if (!formRef.wasChecked && !formRef.checkValidity()) {
    formRef.wasChecked = true;
    notifier.warning('Einige benötigte Felder sind nicht (korrekt) ausgefüllt. Trotzdem speichern?');
    return;
  }

  if (
    await Database.fetchByIdAndType(customer.id, "customer").then((results) => {
      if (createNew) {
        return results.length > 0;
      } else {
        return results.some((result) => result._id !== customer._id);
      }
    })
  ) {
    notifier.danger("Ein/e Nutzer:in mit dieser Nummer existiert bereits!", 6000);
    return;
  }

  await (createNew
    ? Database.createDoc(customer)
    : Database.updateDoc(customer)
  )
    .then((result) => notifier.success("Nutzer:in gespeichert!"))
    .then(closePopup)
    .catch((error) => {
      notifier.danger("Nutzer:in konnte nicht gespeichert werden!", {
        persist: true,
      });
      Logger.error(error);
    });
};
