import Database from "../../database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";

export default async (rental, closePopup) => {
  if (confirm("Soll dieser Leihvorgang wirklich gelöscht werden?")) {
    Database.removeDoc(rental)
      .then(() => notifier.success("Leihvorgang gelöscht!"))
      .then(closePopup)
      .catch((error) => {
        console.error(error);
        notifier.danger("Leihvorgang konnte nicht gelöscht werden!", 6000);
      });
  }
};
