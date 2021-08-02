import TextInput from "../../components/Input/TextInput.svelte";
import AutocompleteInput from "../../components/Input/AutocompleteInput.svelte";
import InputMultiplier from "../../components/Input/InputMultiplier.svelte";
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
  customerById,
  itemsByIds,
} from "../selectors";

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
    updateItemStatus = true;
    hideToggleUpdateItemStatus = false;
  }
};

const itemToString = (item) => {
  if (item && item["id"] && item["name"]) {
    return `${String(item["id"]).padStart(4, "0")}: ${item["name"]}`;
  } else {
    return "";
  }
};

const customerToString = (customer) => {
  if (customer && customer["id"] && customer["lastname"]) {
    return `${customer.id}: ${customer.firstname} ${customer.lastname}`;
  } else {
    return "";
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
      onClick: () =>
        onSave(
          context.doc,
          context.closePopup,
          updateItemStatus,
          context.createNew
        ),
      loadingText: "Leihvorgang wird gespeichert",
    },
  ],
  inputs: [
    {
      id: "item",
      group: "Gegenstände",
      component: InputMultiplier,
      nobind: true, // bind cannot handle multiple values
      props: {
        childComponent: (context) => AutocompleteInput,
        // only allow multiple items when creating a new rental
        allowAdditionalInputs: (context) => context.createNew,
        initialChildComponentValue: {
          id: undefined,
          name: undefined,
        },
        firstChildComponentProps: {
          placeholder: "Nummer oder Name",
        },
        injectChildIndexInto: "onSelected",
        childComponentProps: {
          singleValue: false,
          showClear: true,
          searchFunction: (context) => (searchTerm) => {
            const requiredKeys = [
              "id",
              "name",
              "deposit",
              "exists_more_than_once",
            ];

            // determine if user searches for id (a number) or name (not a number)
            if (isNaN(searchTerm)) {
              return Database.fetchDocsBySelector(
                itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector(
                  "name",
                  searchTerm
                ),
                requiredKeys
              );
            } else {
              return Database.fetchDocsBySelector(
                itemIdStartsWithAndNotDeletedSelector(searchTerm),
                requiredKeys
              );
            }
          },
          value: (context) => ({
            id: context.doc.item_id,
            name: context.doc.item_name,
            deposit: context.doc.deposit,
          }),
          placeholder: "Noch ein Gegenstand?",
          // returns the string displayed as select option
          labelFunction: (context) => (item) => itemToString(item),
          noResultsText: "Kein Gegenstand gefunden",
          onSelected: (context) => (childIndex) => (selectedItem) => {
            let items = context.doc["items"] ? [...context.doc["items"]] : [];
            items[childIndex] = {
              id: selectedItem.id,
              name: selectedItem.name,
              deposit: selectedItem.deposit,
            };
            context.updateDoc({
              items: items,
              item_id: items[0].id,
              item_name: items[0].name,
              deposit: items.reduce(
                (currentSum, item) =>
                  currentSum + (item && item.deposit ? item.deposit : 0),
                0
              ),
            });

            Database.fetchDocsBySelector(
              itemsByIds(items.map((item) => item.id)),
              ["exists_more_than_once"]
            ).then((items) => {
              const atLeastOneItemExsitsMoreThanOnce = items.some(
                (item) => item.exists_more_than_once
              );
              // TODO: hide toggle not working yet
              updateToggleStatus(atLeastOneItemExsitsMoreThanOnce);
            });
          },
        },
      },
    },

    {
      id: "update_status",
      label: "Status automatisch aktualisieren",
      group: "Gegenstände",
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
      id: "customer",
      group: "Nutzer",
      component: AutocompleteInput,
      nobind: true,
      props: {
        singleValue: false,
        showClear: true,
        searchFunction: (context) => (searchTerm) => {
          if (isNaN(searchTerm)) {
            return Database.fetchDocsBySelector(
              customerAttributeStartsWithIgnoreCaseSelector(
                "lastname",
                searchTerm
              ),
              ["id", "firstname", "lastname"]
            );
          } else {
            return Database.fetchDocsBySelector(
              customerIdStartsWithSelector(searchTerm),
              ["id", "firstname", "lastname"]
            );
          }
        },
        placeholder: "Nummer oder Nachname",
        labelFunction: (context) => (customer) => customerToString(customer),
        value: (context) => ({
          id: context.doc.customer_id,
          lastname: context.doc.customer_name,
          firstname: "", // not stored in rental doc
        }),
        noResultsText: "Kein Nutzer gefunden",
        onSelected: (context) => (selectedCustomer) => {
          context.updateDoc({
            customer_name: selectedCustomer.lastname,
            customer_id: selectedCustomer.id,
          });
          showNotificationsForCustomer(selectedCustomer.id);
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
      props: {
        multiline: true,
      },
    },
  ],
};
