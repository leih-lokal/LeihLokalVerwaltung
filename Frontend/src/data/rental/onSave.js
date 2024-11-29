import Database from "../../database/ENV_DATABASE";
import { recentEmployeesStore } from "../../utils/stores";
import { notifier } from "@beyonk/svelte-notifications";
import WoocommerceClient from "../../database/ENV_WC_CLIENT";
import columns from "./columns";
import { setNumericValuesDefault0 } from "../utils";
import { itemById } from "../selectors";
import Logger from "js-logger";
import {
  millisAtStartOfToday,
  saveParseTimestampToString,
} from "../../utils/utils";


const fetchItemById = async (itemId) => {
  try {
    return (await Database.fetchDocsBySelector(itemById(itemId)))[0];
  } catch (error) {
    Logger.error(error);
    throw `Failed to load item with id ${itemId}`;
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

const getExpReturnDate = (item, rental) => {
  const hasReturnDateInFuture =
    item.status === "outofstock" &&
    rental &&
    rental.to_return_on &&
    rental.to_return_on >= millisAtStartOfToday() &&
    !rental.returned_on;

  let expReturnDate = "";
  if (item.status === "reserved") {
    expReturnDate = "Reserviert und noch nicht abgeholt";
  } else if (hasReturnDateInFuture) {
    expReturnDate = saveParseTimestampToString(rental.to_return_on);
  }
  return expReturnDate;
};

const updateItemStatus = async (item, status, rental) => {
  item.status = status;
  item.expected_return_date = getExpReturnDate(item, rental);
  await Database.updateDoc(item);
  await WoocommerceClient.updateItem(item);
  notifier.success(
    `'${item.name}' wurde als ${
      item.status === "instock" ? "verfügbar" : "verliehen"
    } markiert.`
  );
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

export default async function onSave(context) {
  const { doc, closePopup, createNew, contextVars, form } = context;

  if (!form.wasChecked && !form.checkValidity()) {
    // "Soft-require" temporarily disabled -> mandatorily require all required fields for rentals
    // form.wasChecked = true;
    // notifier.warning('Einige benötigte Felder sind nicht (korrekt) ausgefüllt. Trotzdem speichern?');
    notifier.danger('Nicht alle benötigten Felder sind (korrekt) ausgefüllt.', 3000)
    return;
  }

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
      await updateItemStatus(item, newItemStatus(doc), doc);
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
