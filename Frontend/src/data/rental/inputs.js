import TextInput from "../../components/Input/TextInput.svelte";
import AutocompleteInput from "../../components/Input/AutocompleteInput.svelte";
import DateInput from "../../components/Input/DateInput.svelte";
import Checkbox from "../../components/Input/Checkbox.svelte";
import Database from "../../database/ENV_DATABASE";
import onSave from "./onSave";
import onDelete from "./onDelete";
import { recentEmployeesStore } from "../../utils/stores";
import initialValues from "./initialValues";
import { notifier } from "@beyonk/svelte-notifications";
import { get } from "svelte/store";
import {
  customerIdStartsWithSelector,
  itemIdStartsWithAndNotDeletedSelector,
  customerAttributeStartsWithIgnoreCaseSelector,
  itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector,
  activeRentalsForCustomerSelector,
  customerById,
} from "../selectors";

/**
 * Whether the toggle for updateStatusOnWebsite is hidden.
 */
var hideToggleUpdateItemStatus = false;

const updateToggleStatus = (context, itemExistsMoreThanOnce) => {
  if (itemExistsMoreThanOnce) {
    context.contextVars.updateItemStatus = false;
    hideToggleUpdateItemStatus = true;
  } else {
    hideToggleUpdateItemStatus = false;
  }
};

function getRecentEmployees() {
  var employeeList = {};
  for (let employee of get(recentEmployeesStore)) {
    employeeList[employee] = employee;
  }
  return employeeList;
}

const updateItemOfRental = (context, item) => {
  context.updateDoc({
    item_id: item.id,
    item_name: item.name,
    deposit: item.deposit,
  });
  showNotificationsIfNotAvailable(item);
  updateToggleStatus(context, item.exists_more_than_once);
};

const updateCustomerOfRental = (context, customer) => {
  context.updateDoc({
    customer_name: customer.lastname,
    customer_id: customer.id,
  });
  showNotificationsForCustomer(customer.id);
};

const showNotificationsIfNotAvailable = async (item) => {
  var status_mapping = {
    instock: "verfügbar",
    outofstock: "verliehen",
    reserved: "reserviert",
    onbackorder: "temporär nicht verfügbar / in Reparatur",
  };
  var status = status_mapping[item.status];
  if (["outofstock", "reserved", "onbackorder"].includes(item.status)) {
    notifier.danger(
      `Gegenstand ist nicht verfügbar, hat Status: ${status}`,
      6000
    );
  } else if (item.status == "undefined") {
    notifier.warning(
      `Fehler beim Statuscheck, Gegenstand hat Status: ${status}`,
      6000
    );
  }
};

const showNotificationsForCustomer = async (customerId) => {
  Database.fetchAllDocsBySelector(
    activeRentalsForCustomerSelector(customerId),
    ["item_name"]
  )
    .then((results) => results.map((doc) => doc["item_name"]))
    .then((activeRentals) => {
      if (activeRentals.length > 0 && activeRentals.length < 3) {
        notifier.warning(
          `Nutzer hat schon diese Gegenstände ausgeliehen: ${activeRentals.join(
            ", "
          )}`,
          6000
        );
      } else if (activeRentals.length >= 3) {
        notifier.danger(
          `Nutzer hat schon mehr als 2 Gegenstände ausgeliehen: ${activeRentals.join(
            ", "
          )}`,
          6000
        );
      }
    });

  Database.fetchAllDocsBySelector(customerById(customerId), ["remark"]).then(
    (results) => {
      if (
        results.length > 0 &&
        results[0]["remark"] &&
        results[0]["remark"] !== ""
      ) {
        notifier.danger(results[0]["remark"], { persist: true });
      }
    }
  );
};

export default {
  title: (context) =>
    `Leihvorgang ${context.createNew ? "anlegen" : "bearbeiten"}`,
  initialValues,
  onMount: (context) => () => {
    hideToggleUpdateItemStatus = false;
    /**
     * Whether the status of the selected item should be updated when a rental is created or completed.
     * For items existing more than once this should always be false. For other items this can be toggled by the user.
     */
    context.contextVars.updateItemStatus = true;

    /**
     * The id of the item that belongs to this rental at the time of opening the input form. This is required to
     * check if the item was changed when saving the rental.
     */
    context.contextVars.initialItemId = context.doc.item_id;
    context.contextVars.initialItemName = context.doc.item_name;
  },
  footerButtons: (context) => [
    {
      text: "Abbrechen",
      onClick: context.closePopup,
    },
    {
      text: "Löschen",
      onClick: () => onDelete(context.doc, context.closePopup),
      color: "red",
      hidden: context.createNew,
      loadingText: "Leihvorgang wird gelöscht",
    },
    {
      text: "Speichern",
      onClick: () => onSave(context),
      loadingText: "Leihvorgang wird gespeichert",
    },
  ],
  inputs: [
    {
      id: "item_id",
      label: "Nr",
      group: "Gegenstand",
      component: AutocompleteInput,
      nobind: true,
      props: {
        valueField: "id",
        onlyNumbers: true,
        searchFunction: (context) => (searchTerm) =>
          Database.fetchDocsBySelector(
            itemIdStartsWithAndNotDeletedSelector(searchTerm),
            ["id", "name", "deposit", "exists_more_than_once", "status"]
          ),
        suggestionFormat: (context) => (id, item_name) =>
          `${String(id).padStart(4, "0")}: ${item_name}`,
        noResultsText: "Kein Gegenstand mit dieser Id",
        onSelected: (context) => (selectedItem) => {
          updateItemOfRental(context, selectedItem);
        },
      },
    },

    {
      id: "item_name",
      label: "Name",
      group: "Gegenstand",
      component: AutocompleteInput,
      nobind: true,
      props: {
        valueField: "name",
        searchFunction: (context) => (searchTerm) =>
          Database.fetchDocsBySelector(
            itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector(
              "name",
              searchTerm
            ),
            ["id", "name", "deposit", "exists_more_than_once"]
          ),
        suggestionFormat: (context) => (id, item_name) =>
          `${String(id).padStart(4, "0")}: ${item_name}`,
        noResultsText: "Kein Gegenstand mit diesem Name",
        onSelected: (context) => (selectedItem) => {
          updateItemOfRental(context, selectedItem);
        },
      },
    },
    {
      id: "update_status",
      label: "Status aktualisieren",
      group: "Gegenstand",
      component: Checkbox,
      nobind: true,
      hidden: () => hideToggleUpdateItemStatus,
      props: {
        value: (context) => context.contextVars.updateItemStatus,
        // onChange callback necessary because bind only works for doc attributes
        onChange: (context) => (value) =>
          (context.contextVars.updateItemStatus = value),
      },
    },

    {
      id: "rented_on",
      label: "Ausgeliehen am",
      group: "Zeitraum",
      component: DateInput,
      props: {
        container: (context) => context.container,
      },
    },
    {
      id: "extended_on",
      label: "Verlängert am",
      group: "Zeitraum",
      hidden: (context) => context.createNew,
      component: DateInput,
      props: {
        quickset: { 0: "Heute" },
        container: (context) => context.container,
      },
    },
    {
      id: "to_return_on",
      label: "Zurückerwartet am",
      group: "Zeitraum",
      component: DateInput,
      props: {
        quickset: { 7: "1 Woche", 14: "2 Wochen", 21: "3 Wochen" },
        container: (context) => context.container,
      },
    },
    {
      id: "returned_on",
      label: "Zurückgegeben am",
      group: "Zeitraum",
      component: DateInput,
      hidden: (context) => context.createNew,
      props: {
        quickset: { 0: "Heute" },
        container: (context) => context.container,
      },
    },

    {
      id: "customer_id",
      label: "Nr",
      group: "Nutzer",
      component: AutocompleteInput,
      nobind: true,
      props: {
        valueField: "id",
        onlyNumbers: true,
        searchFunction: (context) => (searchTerm) =>
          Database.fetchDocsBySelector(
            customerIdStartsWithSelector(searchTerm),
            ["id", "firstname", "lastname"]
          ),
        suggestionFormat: (context) => (id, firstname, lastname) =>
          `${id}: ${firstname} ${lastname}`,
        noResultsText: "Kein Nutzer mit dieser Nummer",
        onSelected: (context) => (selectedCustomer) => {
          updateCustomerOfRental(context, selectedCustomer);
        },
      },
    },
    {
      id: "customer_name",
      label: "Nachname",
      group: "Nutzer",
      component: AutocompleteInput,
      nobind: true,
      props: {
        valueField: "lastname",
        searchFunction: (context) => (searchTerm) =>
          Database.fetchDocsBySelector(
            customerAttributeStartsWithIgnoreCaseSelector(
              "lastname",
              searchTerm
            ),
            ["id", "firstname", "lastname"]
          ),
        suggestionFormat: (context) => (id, firstname, lastname) =>
          `${id}: ${firstname} ${lastname}`,
        noResultsText: "Kein Nutzer mit diesem Name",
        onSelected: (context) => (selectedCustomer) => {
          updateCustomerOfRental(context, selectedCustomer);
        },
      },
    },

    {
      id: "deposit",
      label: "Pfand",
      group: "Pfand",
      component: TextInput,
      props: {
        onlyNumbers: true,
      },
    },

    {
      id: "deposit_returned",
      label: "Pfand zurück",
      group: "Pfand",
      hidden: (context) => context.createNew,
      component: TextInput,
      props: {
        quickset: (context) => ({ [context.doc.deposit]: context.doc.deposit }),
        onlyNumbers: true,
      },
    },

    {
      id: "passing_out_employee",
      label: "Ausgabe",
      group: "Mitarbeiter",
      component: TextInput,
      props: {
        quickset: getRecentEmployees,
      },
    },
    {
      id: "receiving_employee",
      label: "Rücknahme",
      group: "Mitarbeiter",
      hidden: (context) => context.createNew,
      component: TextInput,
      props: {
        quickset: getRecentEmployees,
      },
    },
    {
      id: "remark",
      label: "Bemerkung",
      group: "Mitarbeiter",
      component: TextInput,
      props: {
        multiline: true,
      },
    },
  ],
};
