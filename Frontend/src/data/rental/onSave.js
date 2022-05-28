import Database from "../../database/ENV_DATABASE";
import { recentEmployeesStore } from "../../utils/stores";
import { notifier } from "@beyonk/svelte-notifications";
import WoocommerceClient from "../../database/ENV_WC_CLIENT";
import columns from "./columns";
import { setNumericValuesDefault0 } from "../utils";
import { itemById } from "../selectors";
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
    Logger.warn(
      `Could not update item because rental ${rental._id} does not have an item_id.`
    );
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

function duplicateRentalWithoutItemInfo(rental) {
  var rental_copy = new Object();
  Object.keys(rental).forEach(function (key) {
    if (["deposit", "item_name", "item_id"].indexOf(key) == -1) {
      rental_copy[key] = () => rental[key];
    }
  });
  return rental_copy;
}

export default async (
  rental,
  closePopup,
  updateItemStatus,
  createNew,
  duplicateForm
) => {
  setNumericValuesDefault0(rental, columns);

  if (updateItemStatus) {
    const item = await fetchItem(rental);
    if (item) {
      item.status = newItemStatus(rental);
      await Database.updateDoc(item)
        .then(() => WoocommerceClient.updateItem(item))
        .then(() => {
          notifier.success(
            `'${item.name}' wurde als ${
              item.status === "instock" ? "verfügbar" : "verliehen"
            } markiert.`
          );
        })
        .catch((error) => {
          notifier.danger(
            `Status von '${item.name}' konnte nicht aktualisiert werden!`,
            { persist: true }
          );
          Logger.error(error);
        });
      console.log(duplicateForm);

      // show a persistent info notifier of previous items when duplicating a form
      // this makes it easier to keep in mind what previous items you just rented for
      // the same person
      if (duplicateForm) {
        notifier.info(
          `Gespeichert: '${rental.item_name}', Pfand: ${rental.deposit}€ bis ${rental.to_return_on}`,
          {
            persist: true,
          }
        );
      }
    } else {
      Logger.warn(
        `Did not update item of rental ${rental._id} because item not found.`
      );
    }
  } else {
    Logger.debug(
      `Did not update item of rental ${rental._id} because updateItemStatus is false.`
    );
  }

  await (createNew ? Database.createDoc(rental) : Database.updateDoc(rental))
    .then((result) => notifier.success("Leihvorgang gespeichert!"))
    .then(() => recentEmployeesStore.add(rental.passing_out_employee))
    .then(() => recentEmployeesStore.add(rental.receiving_employee))
    .then(() =>
      closePopup(duplicateForm ? duplicateRentalWithoutItemInfo(rental) : null)
    )
    .catch((error) => {
      notifier.danger("Leihvorgang konnte nicht gespeichert werden!", {
        persist: true,
      });
      Logger.error(error);
    });
};
