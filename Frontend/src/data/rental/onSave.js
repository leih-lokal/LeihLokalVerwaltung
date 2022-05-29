import Database from "../../database/ENV_DATABASE";
import { recentEmployeesStore } from "../../utils/stores";
import { notifier } from "@beyonk/svelte-notifications";
import WoocommerceClient from "../../database/ENV_WC_CLIENT";
import columns from "./columns";
import { setNumericValuesDefault0 } from "../utils";
import { itemById } from "../selectors";
import Logger from "js-logger";
import { now } from "svelte/internal";
import { millisAtStartOfToday } from "../../utils/utils";

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

export async function onReturnAndSave(context, employee) {
  const { doc, closePopup, createNew, contextVars } = context;

  if (createNew) {
    Logger.error("createNew is true if it should be false");
    return; // just for safety
  }
  doc.deposit_returned = doc.deposit_returned
    ? doc.deposit_returned
    : doc.deposit;
  doc.receiving_employee = doc.receiving_employee
    ? doc.receiving_employee
    : employee;
  doc.returned_on = doc.returned_on ? doc.returned_on : millisAtStartOfToday();
  await onSave(context);
}

const updateItemStatus = async (item, status) => {
  item.status = status;
  await Database.updateDoc(item);
  await WoocommerceClient.updateItem(item);
  notifier.success(
    `'${item.name}' wurde als ${
      item.status === "instock" ? "verfügbar" : "verliehen"
    } markiert.`
  );
};

export default async function onSave(context) {
  const { doc, closePopup, createNew, contextVars } = context;
  setNumericValuesDefault0(doc, columns);

  // item changed, reset initial item to status available
  if (
    contextVars.initialItemId !== undefined &&
    contextVars.initialItemId !== doc.item_id
  ) {
    try {
      const initialItem = await fetchItemById(contextVars.initialItemId);
      await updateItemStatus(initialItem, "instock");
      notifier.warning(
        `Status von '${contextVars.initialItemName}' wurde auf 'verfügbar' geändert. Bitter überprüfe ob das stimmt.`,
        { persist: true }
      );
    } catch (error) {
      Logger.error(
        `Failed to update status of initial item with name ${contextVars.initialItemName} id ${contextVars.initialItemId}, ${error}`
      );
      notifier.warning(
        `Status von '${contextVars.initialItemName}' konnte nicht aktualisiert werden. Bitte überprüfe den Status dieses Gegenstandes.`,
        { persist: true }
      );
    }
  }

  if (contextVars.updateItemStatus) {
    try {
      const item = await fetchItemById(doc.item_id);
      doc.image = item.image;
      await updateItemStatus(item, newItemStatus(doc));
    } catch (error) {
      Logger.error(
        `Failed to update status of item with id ${doc.item_id}, ${error}`
      );

      notifier.danger(
        `Status des Gegenstandes mit ID '${doc.item_id}' konnte nicht aktualisiert werden!`,
        { persist: true }
      );
    }
  } else {
    Logger.debug(
      `Did not update item of rental ${doc._id} because updateItemStatus is false.`
    );
  }

  await (createNew ? Database.createDoc(doc) : Database.updateDoc(doc))
    .then((_) => notifier.success("Leihvorgang gespeichert!"))
    .then(() => recentEmployeesStore.add(doc.passing_out_employee))
    .then(() => recentEmployeesStore.add(doc.receiving_employee))
    .then(closePopup)
    .catch((error) => {
      notifier.danger("Leihvorgang konnte nicht gespeichert werden!", {
        persist: true,
      });
      Logger.error(error);
    });
}
