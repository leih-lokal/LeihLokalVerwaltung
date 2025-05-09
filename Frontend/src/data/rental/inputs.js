import TextInput from "../../components/Input/TextInput.svelte";
import AutocompleteInput from "../../components/Input/AutocompleteInput.svelte";
import DateInput from "../../components/Input/DateInput.svelte";
import onSave from "./onSave";
import onDelete from "./onDelete";
import {
  customerColorToDescription,
  itemColorToDescription,
} from "../../components/Input/ColorDefs";
import { millisAtStartOfToday } from "../../utils/utils";
import { recentEmployeesStore } from "../../utils/stores";
import initialValues from "./initialValues";
import { notifier } from "@beyonk/svelte-notifications";
import { get } from "svelte/store";
import * as itemAdapter from "../item/adapter";
import * as customerAdapter from "../customer/adapter";
import { getApiClient } from "../../utils/api";

const apiClient = getApiClient()

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
  var employeeObj = {};
  for (let employee of get(recentEmployeesStore)) {
    employeeObj[employee] = employee;
  }
  return employeeObj;
}

function suggestReceivingEmployee(context) {
  if (context.doc.receiving_employee != "") {
    return context.doc.receiving_employee;
  }

  let mostRecent;
  // retrieve last element of array
  for (mostRecent of get(recentEmployeesStore));

  if (!mostRecent) {
    // if none is in the store, assume the passing out employee is currently working
    mostRecent = context.doc.passing_out_employee;
  }
  return mostRecent;
}

const updateItemOfRental = (context, item) => {
  if (context.doc.item_id !== item.iid) {
    context.updateDoc({
      item_id: item.iid,
      item_name: item.name,
      deposit: item.deposit,
    });
    updateToggleStatus(context, item.exists_more_than_once);
    showNotificationsForItem(item);
  }
};

const updateCustomerOfRental = (context, customer) => {
  context.updateDoc({
    customer_name: customer.lastname,
    customer_id: customer.iid,
  });
  showNotificationsForCustomer(customer);
};

const showNotificationsForItem = async (item) => {
  // show notification if not available
  var statusMapping = {
    instock: "verfügbar",
    outofstock: "verliehen",
    reserved: "reserviert",
    onbackorder: "temporär nicht verfügbar / in Reparatur",
    lost: "verschollen",
    repairing: "in Reparatur",
    forsale: "zu verkaufen",
  };
  var status = statusMapping[item.status];
  if (["outofstock", "reserved", "onbackorder", "lost", "repairing", "forsale"].includes(item.status)) {
    notifier.danger(
      `${item.name} (${item.iid}) ist nicht verfügbar, hat Status: ${status}`,
      10000
    );
  } else if (item.status == "undefined") {
    notifier.warning(
      `Fehler beim Statuscheck, ${item.name} (${item.iid}) hat Status: ${status}`,
      10000
    );
  }
  // show notification it item is highlighted in a color
  if (item.highlight_color && item.highlight_color !== "") {
    const colorDescription = itemColorToDescription(item.highlight_color);
    notifier.info(
      `${item.name} (${item.iid}) wurde farblich markiert: ${colorDescription}`,
      {
        persist: true,
      }
    );
  }
};

let sortItemByIdOrName = (itemA, itemB) => {
  // check if itemX exists at all
  if ((itemA == undefined) | (itemB == undefined)) {
    return 0;
  }
  // if has id and id is numerical compare id
  if (
    (itemA.iid !== undefined) &
    (itemB.iid !== undefined) &
    !(isNaN(itemA.iid) | isNaN(itemB.iid))
  ) {
    return itemA.iid - itemB.iid;
  }

  // maybe itemA and itemB themselve are numerical?
  if (!(isNaN(itemA) | isNaN(itemB))) {
    return itemA - itemB;
  }

  // inputs are not numerically sortable
  return 0;
};

const showNotificationsForCustomer = async (customer) => {
  apiClient.getActiveRentalsByCustomer(customer.id)
    .then((result) => result.items.flatMap((r) => r.expand.items.map(i => i.name)))
    .then((rentedItems) => {
      if (rentedItems.length > 0 && rentedItems.length < 3) {
        notifier.warning(
          `Nutzer:in hat schon diese Gegenstände ausgeliehen: ${rentedItems.join(", ")}`,
          6000
        );
      } else if (rentedItems.length >= 3) {
        notifier.danger(
          `Nutzer:in hat schon mehr als 2 Gegenstände ausgeliehen: ${rentedItems.join(", ")}`,
          6000
        );
      }
    });

  apiClient.getCustomerByIid(customer.iid)
    .then((c) => {
      if (c.remark && c.remark !== "") {  // first check if there is a remark
        notifier.danger(c.remark, { persist: true });
      }
      if (c.highlight_color && c.highlight_color !== "") {  // then check if customer is highlighted
        const colorDescription = customerColorToDescription(c.highlight_color);
        notifier.info(
          "Diese/r Nutzer:in wurde farblich markiert: " + colorDescription,
          { persist: true }
        );
      }
    });
};

export default {
  title: (context) => `Leihvorgang ${context.createNew ? "anlegen" : "bearbeiten"}`,
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

    if (context.doc.item_id) {
      apiClient.getItemByIid(context.doc.item_id).then(item => {
        updateItemOfRental(context, item)
      })
    }
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
      text: `Zurückgeben ${suggestReceivingEmployee(context) ? `\n(als ${suggestReceivingEmployee(context)})` : ""}`,
      onClick: async () => {
        if (context.createNew) {
          Logger.error("createNew is true if it should be false");
          return; // just for safety
        }

        const doc = context.doc
        doc.deposit_returned = doc.deposit_returned || doc.deposit
        doc.receiving_employee = doc.receiving_employee || suggestReceivingEmployee(context)
        doc.returned_on = doc.returned_on || millisAtStartOfToday()
        await onSave(context.doc, context.closePopup, context.createNew, context.form, context.contextVars)
      },
      color: "green",
      hidden: context.createNew || context.doc.returned_on,
      loadingText: "Leihvorgang wird abgeschlossen",
    },

    {
      text: "Speichern",
      onClick: async () => await onSave(context.doc, context.closePopup, context.createNew, context.form, context.contextVars),
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
      resolve: (doc) => doc.expand.items[0].iid,
      props: {
        required: true,
        localSorting: true,
        sortByMatchedKeywords: true,
        itemSortFunction: () => sortItemByIdOrName,
        valueField: "iid",
        onlyNumbers: true,
        searchFunction: (context) => (searchTerm) => itemAdapter.query({ searchTerm }).then(res => res.docs),
        suggestionFormat: (context) => ({ iid, name }) => `${String(iid).padStart(4, "0")}: ${name}`,
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
        searchFunction: (context) => (searchTerm) => itemAdapter.query({ searchTerm }).then(res => res.docs),
        suggestionFormat: (context) => ({ iid, name }) => `${String(iid).padStart(4, "0")}: ${name}`,
        noResultsText: "Kein Gegenstand mit diesem Name",
        onSelected: (context) => (selectedItem) => {
          updateItemOfRental(context, selectedItem);
        },
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
      id: "expected_on",
      label: "Zurückerwartet am",
      group: "Zeitraum",
      component: DateInput,
      props: {
        quickset: { 7: "1 Woche", 14: "2 Wochen", 21: "3 Wochen" },
        container: (context) => context.container,
        showAlertOnPastDateSelection: true,
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
      group: "Nutzer:in",
      component: AutocompleteInput,
      nobind: true,
      props: {
        required: true,
        localSorting: true,
        sortByMatchedKeywords: true,
        itemSortFunction: () => sortItemByIdOrName,
        localFiltering: true,
        valueField: "iid",
        onlyNumbers: true,
        searchFunction: (context) => (searchTerm) => customerAdapter.query({ searchTerm }).then(res => res.docs),
        suggestionFormat: (context) => ({ iid, firstname, lastname }) => `${iid}: ${firstname} ${lastname}`,
        noResultsText: "Kein/e Nutzer:in mit dieser Nummer",
        onSelected: (context) => (selectedCustomer) => {
          updateCustomerOfRental(context, selectedCustomer);
        },
      },
    },
    {
      id: "customer_name",
      label: "Nachname",
      group: "Nutzer:in",
      component: AutocompleteInput,
      nobind: true,
      props: {
        valueField: "lastname",
        searchFunction: (context) => (searchTerm) => customerAdapter.query({ searchTerm }).then(res => res.docs),
        suggestionFormat: (context) => ({ iid, firstname, lastname }) => `${iid}: ${firstname} ${lastname}`,
        noResultsText: "Kein/e Nutzer:in mit diesem Name",
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
        required: true,
        pattern: "[0-9]+",
        onlyNumbers: true,
      },
    },
    {
      id: "deposit_back",
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
      id: "employee",
      label: "Ausgabe",
      group: "Mitarbeiter",
      component: TextInput,
      props: {
        required: true,
        quickset: getRecentEmployees,
      },
    },
    {
      id: "employee_back",
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
