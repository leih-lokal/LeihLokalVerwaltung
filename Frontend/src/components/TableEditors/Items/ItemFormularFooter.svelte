<script>
  import Footer from "../../Input/PopupFormular/Footer.svelte";
  import Database from "../../Database/ENV_DATABASE";
  import WoocommerceClient from "ENV_WC_CLIENT";
  import columns from "./Columns";
  import { notifier } from "@beyonk/svelte-notifications";

  export let itemDoc = {};
  export let createNew = false;
  export let closePopup = () => {};
</script>

<Footer
  displayDeleteButton={!createNew && !itemDoc.status !== "deleted"}
  displaySaveButton={!itemDoc.status !== "deleted"}
  on:delete={async (event) => {
    if (confirm("Soll dieser Gegenstand wirklich gelöscht werden?")) {
      itemDoc.status = "deleted";
      await Database.updateDoc(itemDoc)
        .then(() => notifier.success("Gegenstand als gelöscht markiert!"))
        .then(closePopup)
        .catch((error) => {
          console.error(error);
          notifier.danger("Gegenstand konnte nicht gelöscht werden!", 6000);
        });

      await WoocommerceClient.deleteItem(itemDoc)
        .then(() => notifier.success("Gegenstand von der Webseite gelöscht!", 3000))
        .catch((error) => {
          notifier.warning("Gegenstand konnte nicht von der Webseite gelöscht werden!", 6000);
          console.error(error);
        });
    }
  }}
  on:save={async (event) => {
    Object.keys(itemDoc).forEach((key) => {
      const colForKey = columns.find((col) => col.key === key);
      if (colForKey && colForKey.numeric && itemDoc[key] === "") {
        itemDoc[key] = 0; // default value for numbers
      }
    });

    if (createNew && (await Database.itemWithIdExists(itemDoc.id))) {
      notifier.danger("Ein Gegenstand mit dieser Nummer existiert bereits!", 6000);
      return;
    }

    if (createNew) {
      // create item on woocommerce first to store wc_id in db afterwards
      WoocommerceClient.createItem(itemDoc)
        .then((wcDoc) => {
          itemDoc.wc_url = wcDoc.permalink;
          itemDoc.wc_id = wcDoc.id;
          notifier.success("Gegenstand auf der Webseite erstellt!", 3000);
        })
        .catch((error) => {
          notifier.warning("Gegenstand konnte auf der Webseite nicht erstellt werden!", 6000);
          console.error(error);
        })
        // create in db even if creating item in woocommerce fails
        .then(() => Database.createDoc(itemDoc))
        .then(closePopup)
        .then(() => notifier.success("Gegenstand gespeichert!"))
        .catch((error) => {
          notifier.danger("Gegenstand konnte nicht gespeichert werden!", 6000);
          console.error(error);
        });
    } else {
      // update in db and woocommerce simultaneously
      Database.updateDoc(itemDoc)
        .then(closePopup)
        .then(() => notifier.success("Gegenstand gespeichert!"))
        .catch((error) => {
          notifier.danger("Gegenstand konnte nicht gespeichert werden!", 6000);
          console.error(error);
        });
      WoocommerceClient.updateItem(itemDoc)
        .then(() => notifier.success("Gegenstand auf der Webseite aktualisiert!", 3000))
        .catch((error) => {
          notifier.warning("Gegenstand auf der Webseite konnte nicht aktualisiert werden!", 6000);
          console.error(error);
        });
    }
  }}
  on:cancel={closePopup}
/>
