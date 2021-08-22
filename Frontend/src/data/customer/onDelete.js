import Database from "../../database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";

export default (customer, closePopup) => {
  if (confirm("Soll dieser Nutzer wirklich gelöscht werden?")) {
    return Database.removeDoc(customer)
      .then(() => notifier.success("Nutzer gelöscht!"))
      .then(closePopup)
      .catch((error) => {
        Logger.error(error);
        notifier.danger("Nutzer konnte nicht gelöscht werden!", {
          persist: true,
        });
      });
  }
};
