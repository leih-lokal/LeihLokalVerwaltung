import Database from "../../components/Database/ENV_DATABASE";
import WoocommerceClient from "../../components/Database/ENV_WC_CLIENT";
import { notifier } from "@beyonk/svelte-notifications";

export default async (item, closePopup) => {
  if (confirm("Soll dieser Gegenstand wirklich gelöscht werden?")) {
    item.status = "deleted";
    await Database.updateDoc(item)
      .then(() => notifier.success("Gegenstand als gelöscht markiert!"))
      .then(closePopup)
      .catch((error) => {
        console.error(error);
        notifier.danger("Gegenstand konnte nicht gelöscht werden!", 6000);
      });

    await WoocommerceClient.deleteItem(item)
      .then(() =>
        notifier.success("Gegenstand von der Webseite gelöscht!", 3000)
      )
      .catch((error) => {
        notifier.warning(
          "Gegenstand konnte nicht von der Webseite gelöscht werden!",
          6000
        );
        console.error(error);
      });
  }
};
