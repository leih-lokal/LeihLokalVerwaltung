import Database from "../../database/ENV_DATABASE";
import { notifier } from "@beyonk/svelte-notifications";
import WoocommerceClient from "../../database/ENV_WC_CLIENT";
import columns from "./columns";
import { setNumericValuesDefault0 } from "../utils";
import { itemById, itemsByIds } from "../selectors";
import Logger from "js-logger";

const fetchItem = async (rental) => {
  if (rental.item_id) {
    try {
      const item = (
        await Database.fetchDocsBySelector(itemById(rental.item_id))
      )[0];
      rental.image = item.image;
      return item;
    } catch (error) {
      notifier.warning(
        `Gegenstand '${rental.item_id}' konnte nicht geladen werden!`,
        6000
      );
      Logger.error(error);
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

const updateItemStatus = async (rental) => {
  // fetch item again for _id and latest _rev
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
        Logger.error(error);
      });
  }
};

const createOrUpdateRentalDoc = async (rental, createNew) => {
  await (createNew ? Database.createDoc(rental) : Database.updateDoc(rental))
    .then((result) => notifier.success("Leihvorgang gespeichert!"))
    .then(closePopup)
    .catch((error) => {
      notifier.danger("Leihvorgang konnte nicht gespeichert werden!", 6000);
      Logger.error(error);
    });
};

export default async (rental, closePopup, updateItemStatus, createNew) => {
  setNumericValuesDefault0(rental, columns);

  // save a new rental for each item
  let items = rental.items.filter((item) => item && item.id);
  delete rental["items"];
  let rentalsWithSingleItem = items.map((item) => ({
    ...rental,
    item_id: item.id,
    item_name: item.name,
    deposit: item.deposit,
  }));

  // TODO: if items.length > 0 update status for all items existing_once and ignore updateItemStatus

  if (updateItemStatus) {
    // fetch items again for _id and latest version
    items = await Database.fetchDocsBySelector(
      itemsByIds(items.map((item) => item.id))
    );
    items.forEach((item) => (item.status = newItemStatus(rental)));

    await Database.batchUpdateOrCreateDocs(items)
      .then(() => WoocommerceClient.batchUpdateItems(items))
      .catch((error) => {
        notifier.warning(
          `Status von '${item.name}' konnte nicht aktualisiert werden!`,
          6000
        );
        Logger.error(error);
      });
  }

  console.log(rentalsWithSingleItem);
  /**

  await Promise.allSettled([
    ...rentalsWithSingleItem.map(updateItemStatus),
    ...rentalsWithSingleItem.map((rentalWithSingleItem) =>
      createOrUpdateRentalDoc(rentalWithSingleItem, createNew)
    ),
  ]);*/

  // TODO: closePopup, handle errors when saving?
};
