import Database from "../../components/Database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";

export default (customer, closePopup) => {
  if (confirm("Soll dieser Kunde wirklich gelöscht werden?")) {
    return Database.removeDoc(customer)
      .then(() => notifier.success("Kunde gelöscht!"))
      .then(closePopup)
      .catch((error) => {
        console.error(error);
        notifier.danger("Kunde konnte nicht gelöscht werden!", 6000);
      });
  }
};
