import { recentEmployeesStore } from "../../utils/stores";
import { notifier } from "@beyonk/svelte-notifications";
import columns from "./columns";
import { setNumericValuesDefault0 } from "../utils";
import Logger from "js-logger";
import { update, create } from './adapter.js'


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
    // Note: before refactoring to pocketbase, there was logic to reset the status of the previous item.
    // Nowadays, this should be handled by the backend implicitly.
    // Otherwisee revert to 5ebdd753b4adfbf7035ee25f3ada41bd609dd3ba to see old code
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
