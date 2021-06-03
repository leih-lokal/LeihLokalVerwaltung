import Database from "../../database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";
import WoocommerceClient from "../../database/ENV_WC_CLIENT";
import columns from "./columns";
import { setNumericValuesDefault0 } from "../utils";

const fetchItem = async (rental) => {
  if (rental.item_id) {
    try {
      const item = await Database.fetchItemById(rental.item_id);
      rental.image = item.image;
      return item;
    } catch (error) {
      notifier.warning(
        `Gegenstand '${rental.item_id}' konnte nicht geladen werden!`,
        6000
      );
      console.error(error);
      return undefined;
    }
  } else {
    return undefined;
  }
};

const newItemStatus = (rental) => {
  if (
    (rental.returned_on &&
      rental.returned_on !== 0 &&
      rental.returned_on <= new Date().getTime()) || // already returned
    rental.rented_on > new Date().getTime() // or not yet rented
  ) {
    return "instock";
  } else {
    return "outofstock";
  }
};

export default async (rental, closePopup, updateItemStatus, createNew) => {
  setNumericValuesDefault0(rental, columns);

  const item = await fetchItem(rental);
  if (item && updateItemStatus) {
    item.status = newItemStatus(rental);
    await Database.updateDoc(item)
      .then(() => WoocommerceClient.updateItem(item))
      .then(() => {
        notifier.success(
          `'${item.name}' wurde auf als ${
            item.status === "instock" ? "verfügbar" : "verliehen"
          } markiert.`
        );
      })
      .catch((error) => {
        notifier.warning(
          `Status von '${item.name}' konnte nicht aktualisiert werden!`,
          6000
        );
        console.error(error);
      });
  }

  await (createNew ? Database.createDoc(rental) : Database.updateDoc(rental))
    .then((result) => notifier.success("Leihvorgang gespeichert!"))
    .then(closePopup)
    .catch((error) => {
      notifier.danger("Leihvorgang konnte nicht gespeichert werden!", 6000);
      console.error(error);
    });
};
