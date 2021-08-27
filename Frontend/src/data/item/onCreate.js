import Database from "../../database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";
import WoocommerceClient from "../../database/ENV_WC_CLIENT";
import columns from "./columns";
import { setNumericValuesDefault0 } from "../utils";
import Logger from "js-logger";

export default async (item, closePopup) => {
  if (
    await Database.fetchByIdAndType(item.id, "item").then(
      (results) => results.length > 0
    )
  ) {
    notifier.danger(
      "Ein Gegenstand mit dieser Nummer existiert bereits!",
      6000
    );
    return;
  }

  setNumericValuesDefault0(item, columns);

  // create item on woocommerce first to store wc_id in db afterwards
  // await needed here so that a wc_id is created and stored in db before the user can edit the item again
  await WoocommerceClient.createItem(item)
    .then((wcDoc) => {
      item.wc_url = wcDoc.permalink;
      item.wc_id = wcDoc.id;
      notifier.success("Gegenstand auf der Webseite erstellt!", 3000);
    })
    .catch((error) => {
      notifier.warning(
        "Gegenstand konnte auf der Webseite nicht erstellt werden!",
        {
          persist: true,
        }
      );
      Logger.error(error);
    })
    // create in db even if creating item in woocommerce fails
    .then(() => Database.createDoc(item))
    .then(closePopup)
    .then(() => notifier.success("Gegenstand gespeichert!"))
    .catch((error) => {
      notifier.danger("Gegenstand konnte nicht gespeichert werden!", {
        persist: true,
      });
      Logger.error(error);
    });
};
