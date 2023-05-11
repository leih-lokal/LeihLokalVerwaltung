import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";
import Database from "../../database/ENV_DATABASE";

export default async (rental, closePopup) => {
  if (confirm("Soll dieser Leihvorgang wirklich gelöscht werden?")) {
    Database.removeDoc(rental)
      .then(() => notifier.success("Leihvorgang gelöscht!"))
      .then(closePopup)
      .catch((error) => {
        Logger.error(error);
        notifier.danger("Leihvorgang konnte nicht gelöscht werden!", 6000);
      });
  }
};
