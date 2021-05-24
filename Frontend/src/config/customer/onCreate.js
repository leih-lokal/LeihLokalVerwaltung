import Database from "../../components/Database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";

export default (customer, closePopup) => {
  closePopup();
  const savePromise = Database.createDoc(customer);

  savePromise
    .then((result) => notifier.success("Kunde angelegt!"))
    .catch((error) => {
      notifier.danger("Kunde konnte nicht angelegt werden!", 6000);
      console.error(error);
    });
};
