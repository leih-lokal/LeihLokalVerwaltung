import Database from "../../components/Database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";

export default (customer, closePopup) => {
  closePopup();
  const savePromise = Database.updateDoc(customer);

  savePromise
    .then((result) => notifier.success("Kunde gespeichert!"))
    .catch((error) => {
      notifier.danger("Kunde konnte nicht gespeichert werden!", 6000);
      console.error(error);
    });
};
