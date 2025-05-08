import Database from "../../database/ENV_DATABASE";
import { recentEmployeesStore } from "../../utils/stores";
import { notifier } from "@beyonk/svelte-notifications";
import columns from "./columns";
import { setNumericValuesDefault0 } from "../utils";
import Logger from "js-logger";
import {
  millisAtStartOfToday,
  parseTimestampToString,
} from "../../utils/utils";
import { update, create } from './adapter.js'
import { getApiClient } from "../../utils/api";

const apiClient = getApiClient()

const fetchItemById = async (itemId) => {
  try {
    return await apiClient.getItemByIid(itemId)
  } catch (error) {
    Logger.error(error);
    throw `Failed to load item with id ${itemId}`;
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

export default async (rental, closePopup, createNew, formRef, contextVars) => {
  if (!formRef.wasChecked && !formRef.checkValidity()) {
    // "Soft-require" temporarily disabled -> mandatorily require all required fields for rentals
    // formRef.wasChecked = true;
    // notifier.warning('Einige benötigte Felder sind nicht (korrekt) ausgefüllt. Trotzdem speichern?');
    notifier.danger('Nicht alle benötigten Felder sind (korrekt) ausgefüllt.', 3000)
    return;
  }

  setNumericValuesDefault0(rental, columns);

  if (
    contextVars.initialItemId !== undefined &&
    contextVars.initialItemId !== rental.item_id
  ) {
    console.log('Item of reservation was changed.')
    // note: before refactoring to pocketbase, there was logic to reset the status of the previous item
    // nowadays, this should be handled by the backend implicitly
    // otherwisee revert to 5ebdd753b4adfbf7035ee25f3ada41bd609dd3ba to see old code
  }

  await (createNew
    ? create(rental)
    : update(rental)
  )
    .then((_) => notifier.success("Leihvorgang gespeichert!"))
    .then(() => recentEmployeesStore.add(rental.employee))
    .then(() => recentEmployeesStore.add(rental.employee_back))
    .then(closePopup)
    .catch((error) => {
      notifier.danger("Leihvorgang konnte nicht gespeichert werden!", {
        persist: true,
      });
      Logger.error(error);
    });
}
