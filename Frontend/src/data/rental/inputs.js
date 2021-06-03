import TextInput from "../../components/Input/TextInput.svelte";
import AutocompleteInput from "../../components/Input/AutocompleteInput.svelte";
import DateInput from "../../components/Input/DateInput.svelte";
import Checkbox from "../../components/Input/Checkbox.svelte";
import Database from "../../database/ENV_DATABASE";
import onSave from "./onSave";
import onDelete from "./onDelete";
import initialValues from "./initialValues";
import { notifier } from "@beyonk/svelte-notifications";
import {
  customerIdStartsWithSelector,
  itemIdStartsWithAndNotDeletedSelector,
  customerAttributeStartsWithIgnoreCaseSelector,
  itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector,
  activeRentalsForCustomerSelector,
  itemById,
  customerById,
  customerByLastname,
  itemByName,
} from "./selectors";

/**
 * Whether the status of the selected item should be updated when a rental is created or completed.
 * For items existing more than once this should always be false. For other items this can be toggled by the user.
 */
var updateItemStatus = true;

/**
 * Whether the toggle for updateStatusOnWebsite is hidden.
 */
var hideToggleUpdateItemStatus = false;

const updateToggleStatus = (itemExistsMoreThanOnce) => {
  if (itemExistsMoreThanOnce) {
    updateItemStatus = false;
    hideToggleUpdateItemStatus = true;
  } else {
    hideToggleUpdateItemStatus = false;
  }
};

const notifyActiveRentalsForCustomer = async (customerId) => {
  const activeRentals = await Database.fetchAllDocsBySelector(
    activeRentalsForCustomerSelector(customerId),
    ["item_name"]
  ).then((results) => results.map((doc) => doc["item_name"]));

  if (activeRentals.length > 0 && activeRentals.length < 3) {
    notifier.warning(
      `Kunde hat schon diese Gegenstände ausgeliehen: ${activeRentals.join(
        ", "
      )}`,
      6000
    );
  } else if (activeRentals.length >= 3) {
    notifier.danger(
      `Kunde hat schon mehr als 2 Gegenstände ausgeliehen: ${activeRentals.join(
        ", "
      )}`,
      6000
    );
  }
};

export default {
  title: (context) =>
    `Leihvorgang ${context.createNew ? "anlegen" : "bearbeiten"}`,
  initialValues,
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
    },
    {
      text: "Speichern",
      onClick: onSave(
        context.doc,
        context.closePopup,
        updateItemStatus,
        context.createNew
      ),
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
            ["id", "name"]
          ),
        suggestionFormat: (context) => (id, item_name) =>
          `${String(id).padStart(4, "0")}: ${item_name}`,
        noResultsText: "Kein Gegenstand mit dieser Id",
        onSelected: (context) => (selectedItemId) => {
          Database.fetchDocsBySelector(itemById(selectedItemId), [
            "id",
            "name",
            "deposit",
            "exists_more_than_once",
          ])
            .then((results) => results[0])
            .then((result) => {
              context.updateDoc({
                item_id: result.id,
                item_name: result.name,
                deposit: result.deposit,
              });
              updateToggleStatus(result.exists_more_than_once);
            });
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
            ["id", "name"]
          ),
        suggestionFormat: (context) => (id, item_name) =>
          `${String(id).padStart(4, "0")}: ${item_name}`,
        noResultsText: "Kein Gegenstand mit diesem Name",
        onSelected: (context) => (selectedItemName) => {
          Database.fetchDocsBySelector(itemByName(selectedItemName), [
            "id",
            "name",
            "deposit",
            "exists_more_than_once",
          ])
            .then((results) => results[0])
            .then((result) => {
              context.updateDoc({
                item_id: result.id,
                item_name: result.name,
                deposit: result.deposit,
              });
              updateToggleStatus(result.exists_more_than_once);
            });
        },
      },
    },
    {
      id: "update_status",
      label: "Status des Gegenstandes aktualisieren",
      group: "Gegenstand",
      component: Checkbox,
      nobind: true,
      hidden: () => hideToggleUpdateItemStatus,
      props: {
        value: updateItemStatus,
        // onChange callback necessary because bind only works for doc attributes
        onChange: (context) => (value) => (updateItemStatus = value),
      },
    },

    {
      id: "rented_on",
      label: "Ausgeliehen am",
      group: "Zeitraum",
      component: DateInput,
    },
    {
      id: "extended_on",
      label: "Verlängert am",
      group: "Zeitraum",
      hidden: (context) => context.createNew,
      component: DateInput,
      props: {
        quickset: { 0: "Heute" },
      },
    },
    {
      id: "to_return_on",
      label: "Zurückerwartet am",
      group: "Zeitraum",
      component: DateInput,
      props: {
        quickset: { 7: "1 Woche", 14: "2 Wochen", 21: "3 Wochen" },
      },
    },
    {
      id: "returned_on",
      label: "Zurückgegeben am",
      group: "Zeitraum",
      hidden: (context) => context.createNew,
      props: {
        quickset: { 0: "Heute" },
      },
    },

    {
      id: "customer_id",
      label: "Nr",
      group: "Kunde",
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
        noResultsText: "Kein Kunde mit dieser Id",
        onSelected: (context) => (selectedCustomerId) => {
          Database.fetchDocsBySelector(customerById(selectedCustomerId), [
            "id",
            "lastname",
          ])
            .then((results) => results[0])
            .then((result) => {
              context.updateDoc({
                customer_name: result.lastname,
                customer_id: result.id,
              });
              notifyActiveRentalsForCustomer(result.id);
            });
        },
      },
    },
    {
      id: "customer_name",
      label: "Nachname",
      group: "Kunde",
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
        noResultsText: "Kein Kunde mit diesem Name",
        onSelected: (context) => (selectedCustomerName) => {
          Database.fetchDocsBySelector(
            customerByLastname(selectedCustomerName),
            ["id", "lastname"]
          )
            .then((results) => results[0])
            .then((result) => {
              context.updateDoc({
                customer_name: result.lastname,
                customer_id: result.id,
              });
              notifyActiveRentalsForCustomer(result.id);
            });
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
        onlyNumbers: true,
      },
    },

    {
      id: "passing_out_employee",
      label: "Ausgabe",
      group: "Mitarbeiter",
      component: TextInput,
    },
    {
      id: "receiving_employee",
      label: "Rücknahme",
      group: "Mitarbeiter",
      hidden: (context) => context.createNew,
      component: TextInput,
    },
    {
      id: "remark",
      label: "Bemerkung",
      group: "Mitarbeiter",
      component: TextInput,
    },
  ],
};
