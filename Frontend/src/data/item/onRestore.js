import Database from "../../database/ENV_DATABASE";
import WoocommerceClient from "../../database/ENV_WC_CLIENT";
import { notifier } from "@beyonk/svelte-notifications";
import { itemById } from "../selectors";
import Logger from "js-logger";

export default async (item, closePopup) => {
  if (confirm("Soll dieser Gegenstand wiederhergestellt werden?")) {
    let doc = (await Database.fetchDocsBySelector(itemById(item.id)))[0];
    doc.status = "instock";
    await WoocommerceClient.createItem(doc)
      .then((wcDoc) => {
        notifier.success("Gegenstand auf der Webseite erstellt!", 3000);
        doc.wc_url = wcDoc.permalink;
        doc.wc_id = wcDoc.id;
        return Database.updateDoc(doc);
      })
      .then(closePopup)
      .catch((error) => {
        notifier.warning(
          "Gegenstand konnte auf der Webseite nicht erstellt werden!",
          6000
        );
        Logger.error(error);
      });
  }
};
