import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";
import { getApiClient } from "../../utils/api.js";
import { update, create } from './adapter.js'
import { setNumericValuesDefault0 } from "../utils";
import columns from "./columns";

const apiClient = getApiClient()

export default async (customer, closePopup, createNew, formRef) => {
  if (!formRef.wasChecked && !formRef.checkValidity()) {
    formRef.wasChecked = true;
    notifier.warning('Einige benötigte Felder sind nicht (korrekt) ausgefüllt. Trotzdem speichern?');
    return;
  }

  const existingCustomer = await apiClient.getCustomerByIid(customer.iid)
  if (existingCustomer && (createNew || existingCustomer.id !== customer.id)) {
    notifier.danger("Ein Nutzer mit dieser Nummer existiert bereits!", 6000);
    return;
  }

  setNumericValuesDefault0(customer, columns);

  await (createNew
    ? create(customer)
    : update(customer)
  )
    .then((result) => notifier.success("Nutzer gespeichert!"))
    .then(closePopup)
    .catch((error) => {
      //const msg = "Nutzer konnte nicht gespeichert werden!"
      const msg = error.message
      notifier.danger(msg, {
        persist: true,
      });
      Logger.error(error);
    });
};
