import Database from "../../components/Database/ENV_DATABASE";
import WoocommerceClient from "../../components/Database/ENV_WC_CLIENT";
import { notifier } from "@beyonk/svelte-notifications";

export default async (item, closePopup) => {
  if (
    await Database.fetchByIdAndType(item.id, "item").then((results) =>
      results.some((result) => result._id !== item._id)
    )
  ) {
    notifier.danger(
      "Ein Gegenstand mit dieser Nummer existiert bereits!",
      6000
    );
    return;
  }

  await Database.updateDoc(item)
    .then(closePopup)
    .then(() => notifier.success("Gegenstand gespeichert!"))
    .catch((error) => {
      notifier.danger("Gegenstand konnte nicht gespeichert werden!", 6000);
      console.error(error);
    });

  await WoocommerceClient.updateItem(item)
    .then(() =>
      notifier.success("Gegenstand auf der Webseite aktualisiert!", 3000)
    )
    .catch((error) => {
      notifier.warning(
        "Gegenstand auf der Webseite konnte nicht aktualisiert werden!",
        6000
      );
      console.error(error);
    });
};
