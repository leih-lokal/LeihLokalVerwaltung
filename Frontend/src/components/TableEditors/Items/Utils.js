import WoocommerceClient from "ENV_WC_CLIENT";
import Database from "../../Database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";

const createOnWooCommerceAndUpdateInDb = (doc) =>
  WoocommerceClient.createItem(doc)
    .then((wcDoc) => {
      doc.wc_url = wcDoc.permalink;
      doc.wc_id = wcDoc.id;
      Database.updateDoc(doc);
      notifier.success("Gegenstand auf der Webseite erstellt!", 3000);
    })
    .catch((error) => {
      notifier.warning("Gegenstand konnte auf der Webseite nicht erstellt werden!", 6000);
      console.error(error);
    });

export { createOnWooCommerceAndUpdateInDb };
