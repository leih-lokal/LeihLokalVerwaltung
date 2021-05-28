import Database from "../../components/Database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";

export default async (customer, closePopup) => {
  if (
    await Database.fetchByIdAndType(customer.id, "customer").then((results) =>
      results.some((result) => result._id !== customer._id)
    )
  ) {
    notifier.danger("Ein Kunde mit dieser Nummer existiert bereits!", 6000);
    return;
  }

  await Database.updateDoc(customer)
    .then((result) => notifier.success("Kunde gespeichert!"))
    .then(closePopup)
    .catch((error) => {
      notifier.danger("Kunde konnte nicht gespeichert werden!", 6000);
      console.error(error);
    });
};
