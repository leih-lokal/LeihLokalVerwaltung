import Database from "../../database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";

export default (customer, closePopup) => {
  if (confirm("Soll diese/r Nutzer:in wirklich gelöscht werden?")) {
    return Database.removeDoc(customer)
      .then(() => notifier.success("Nutzer:in gelöscht!"))
      .then(closePopup)
      .catch((error) => {
        Logger.error(error);
        notifier.danger("Nutzer:in konnte nicht gelöscht werden!", {
          persist: true,
        });
      });
  }
};
