import Database from "../../components/Database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";
import WoocommerceClient from "../../components/Database/ENV_WC_CLIENT";
import columns from "./columns";

export default async (item, closePopup) => {
  Object.keys(item).forEach((key) => {
    const colForKey = columns.find((col) => col.key === key);
    if (colForKey && colForKey.numeric && item[key] === "") {
      item[key] = 0; // default value for numbers
    }
  });

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

  // create item on woocommerce first to store wc_id in db afterwards
  await WoocommerceClient.createItem(item)
    .then((wcDoc) => {
      item.wc_url = wcDoc.permalink;
      item.wc_id = wcDoc.id;
      notifier.success("Gegenstand auf der Webseite erstellt!", 3000);
    })
    .catch((error) => {
      notifier.warning(
        "Gegenstand konnte auf der Webseite nicht erstellt werden!",
        6000
      );
      console.error(error);
    })
    // create in db even if creating item in woocommerce fails
    .then(() => Database.createDoc(item))
    .then(closePopup)
    .then(() => notifier.success("Gegenstand gespeichert!"))
    .catch((error) => {
      notifier.danger("Gegenstand konnte nicht gespeichert werden!", 6000);
      console.error(error);
    });
};
