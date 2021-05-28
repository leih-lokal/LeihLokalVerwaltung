import Database from "../../components/Database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";

export default async (customer, closePopup) => {
  if (
    await Database.fetchByIdAndType(customer.id, "customer").then(
      (results) => results.length > 0
    )
  ) {
    notifier.danger("Ein Kunde mit dieser Nummer existiert bereits!", 6000);
    return;
  }

  await Database.createDoc(customer)
    .then((result) => notifier.success("Kunde angelegt!"))
    .then(closePopup)
    .catch((error) => {
      notifier.danger("Kunde konnte nicht angelegt werden!", 6000);
      console.error(error);
    });
};
