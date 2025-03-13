import { notifier } from "@beyonk/svelte-notifications";
import Logger from "js-logger";
import { update, create } from './adapter.js'
import { getApiClient } from "../../utils/api.js";
import { setNumericValuesDefault0 } from "../utils";
import columns from "./columns";

const apiClient = getApiClient()

export default async (item, closePopup, createNew, formRef) => {
  if (!formRef.wasChecked && !formRef.checkValidity()) {
    formRef.wasChecked = true;
    notifier.warning('Einige benötigte Felder sind nicht (korrekt) ausgefüllt. Trotzdem speichern?');
    return;
  }

  const existingItem = await apiClient.getItemByIid(item.iid)
  if (existingItem && (createNew || existingItem.id !== item.id)) {
    notifier.danger("Ein Gegenstand mit dieser Nummer existiert bereits!", 6000);
    return;
  }

  setNumericValuesDefault0(item, columns);

  await (createNew
    ? create(item)
    : update(item)
  )
    .then((result) => notifier.success("Gegenstand gespeichert!"))
    .then(closePopup)
    .catch((error) => {
      //const msg = "Gegenstand konnte nicht gespeichert werden!"
      const msg = error.message
      notifier.danger(msg, {
        persist: true,
      });
      Logger.error(error);
    });
};
