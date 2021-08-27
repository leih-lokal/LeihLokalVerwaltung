import Database from "../../database/ENV_DATABASE";
import WoocommerceClient from "../../database/ENV_WC_CLIENT";
import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";

export default async (item, closePopup) => {
  if (confirm("Soll dieser Gegenstand wirklich gelöscht werden?")) {
    item.status = "deleted";
    await Database.updateDoc(item)
      .then(() => notifier.success("Gegenstand als gelöscht markiert!"))
      .then(closePopup)
      .catch((error) => {
        Logger.error(error);
        notifier.danger("Gegenstand konnte nicht gelöscht werden!", {
          persist: true,
        });
      });

    await WoocommerceClient.deleteItem(item)
      .then(() =>
        notifier.success("Gegenstand von der Webseite gelöscht!", 3000)
      )
      .catch((error) => {
        notifier.warning(
          "Gegenstand konnte nicht von der Webseite gelöscht werden!",
          {
            persist: true,
          }
        );
        Logger.error(error);
      });
  }
};
