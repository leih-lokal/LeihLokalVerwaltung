import TextInput from "../../components/Input/TextInput.svelte";
import AutocompleteInput from "../../components/Input/AutocompleteInput.svelte";
import DateInput from "../../components/Input/DateInput.svelte";
import SelectInput from "../../components/Input/SelectInput.svelte";
import Checkbox from "../../components/Input/Checkbox.svelte";
import Database from "../../components/Database/ENV_DATABASE";
import InputTypes from "../../components/Input/InputTypes";
import ColorDefs from "../../components/Input/ColorDefs";
import onCreate from "./onCreate";
import onDelete from "./onDelete";
import onUpdate from "./onUpdate";
import initialValues from "./initialValues";
import {
  customerIdStartsWithSelector,
  itemIdStartsWithAndNotDeletedSelector,
  customerAttributeStartsWithIgnoreCaseSelector,
  itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector,
  activeRentalsForCustomerSelector,
} from "./selectors";

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
      onClick: context.createNew
        ? () => onCreate(context.doc, context.closePopup)
        : () => onUpdate(context.doc, context.closePopup),
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
        inputType: InputTypes.NUMBER,
        valueField: "id",
        searchFunction: (context) => (searchTerm) =>
          Database.fetchDocsBySelector(
            itemIdStartsWithAndNotDeletedSelector(searchTerm),
            ["id", "name"]
          ),
        suggestionFormat: (context) => (id, item_name) =>
          `${String(id).padStart(4, "0")}: ${item_name}`,
        noResultsText: "Kein Gegenstand mit dieser Id",
        onSelected: (context) => (selectedItemId) => {
          //TODO
          //hideToggleStatusOnWebsiteIfExistsMoreThanOnce(selectedItem);
          Database.fetchDocsBySelector(
            itemIdStartsWithAndNotDeletedSelector(selectedItemId),
            ["id", "name", "deposit", "exists_more_than_once"]
          )
            .then((results) => results[0])
            .then((result) =>
              context.updateDoc({
                ...context.doc,
                item_id: result.id,
                item_name: result.name,
                deposit: result.deposit,
              })
            );
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
          //TODO
          //hideToggleStatusOnWebsiteIfExistsMoreThanOnce(selectedItem);
          Database.fetchDocsBySelector(
            itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector(
              "name",
              selectedItemName
            ),
            ["id", "name", "deposit", "exists_more_than_once"]
          )
            .then((results) => results[0])
            .then((result) =>
              context.updateDoc({
                ...context.doc,
                item_id: result.id,
                item_name: result.name,
                deposit: result.deposit,
              })
            );
        },
      },
    },
    /**
    {
      id: "update_status",
      label: "Status auf Webseite aktualisieren",
      group: "Gegenstand",
      component: Checkbox,
      bindTo: {
        keyValueStoreKey: "options",
        attr: "updateStatusOnWebsite",
      },
      hidden: () => $keyValueStore["options"]["disableToggleStatusOnWebsite"],
      type: InputTypes.CHECKBOX,
    },

    {
      id: "rented_on",
      label: "Erfasst am",
      group: "Zeitraum",
      type: InputTypes.DATE,
      bindTo: { keyValueStoreKey: "currentDoc", attr: "rented_on" },
    },
    {
      id: "extended_on",
      label: "Verlängert",
      group: "Zeitraum",
      hidden: () => createNew,
      quickset: { 0: "Heute" },
      type: InputTypes.DATE,
      bindTo: { keyValueStoreKey: "currentDoc", attr: "extended_on" },
    },
    {
      id: "to_return_on",
      label: "Zurückerwartet",
      group: "Zeitraum",
      quickset: { 7: "1 Woche", 14: "2 Wochen", 21: "3 Wochen" },
      type: InputTypes.DATE,
      bindTo: {
        keyValueStoreKey: "currentDoc",
        attr: "to_return_on",
      },
    },
    {
      id: "returned_on",
      label: "Zurückgegeben",
      group: "Zeitraum",
      hidden: () => createNew,
      quickset: { 0: "Heute" },
      type: InputTypes.DATE,
      bindTo: { keyValueStoreKey: "currentDoc", attr: "returned_on" },
    },

    {
      id: "customer_id",
      label: "Nr",
      group: "Kunde",
      inputType: "number",
      type: InputTypes.AUTOCOMPLETE,
      bindTo: { keyValueStoreKey: "currentDoc", attr: "customer_id" },
      onChange: setCustomer,
      searchFunction: (searchTerm) =>
        Database.fetchDocsBySelector(customerIdStartsWithSelector(searchTerm), [
          "id",
          "firstname",
          "lastname",
        ]),
      suggestionFormat: (id, firstname, lastname) =>
        `${id}: ${firstname} ${lastname}`,
      noResultsText: "Kein Kunde mit dieser Id",
    },
    {
      id: "customer_name",
      label: "Nachname",
      group: "Kunde",
      type: InputTypes.AUTOCOMPLETE,
      bindTo: { keyValueStoreKey: "currentDoc", attr: "customer_name" },
      onChange: setCustomer,
      searchFunction: (searchTerm) =>
        Database.fetchDocsBySelector(
          customerAttributeStartsWithIgnoreCaseSelector("lastname", searchTerm),
          ["id", "firstname", "lastname"]
        ),
      suggestionFormat: (id, firstname, lastname) =>
        `${id}: ${firstname} ${lastname}`,
      noResultsText: "Kein Kunde mit diesem Name",
    },

    {
      id: "deposit",
      label: "Pfand",
      group: "Pfand",
      inputType: "number",
      type: InputTypes.TEXT,
      bindTo: { keyValueStoreKey: "currentDoc", attr: "deposit" },
    },
    {
      id: "deposit_returned",
      label: "Pfand zurück",
      group: "Pfand",
      hidden: () => createNew,
      inputType: "number",
      type: InputTypes.TEXT,
      bindTo: {
        keyValueStoreKey: "currentDoc",
        attr: "deposit_returned",
      },
    },

    {
      id: "passing_out_employee",
      label: "Ausgabe",
      group: "Mitarbeiter",
      type: InputTypes.TEXT,
      bindTo: {
        keyValueStoreKey: "currentDoc",
        attr: "passing_out_employee",
      },
    },
    {
      id: "receiving_employee",
      label: "Rücknahme",
      group: "Mitarbeiter",
      hidden: () => createNew,
      type: InputTypes.TEXT,
      bindTo: {
        keyValueStoreKey: "currentDoc",
        attr: "receiving_employee",
      },
    },
    {
      id: "remark",
      label: "Bemerkung",
      group: "Mitarbeiter",
      type: InputTypes.TEXT,
      bindTo: {
        keyValueStoreKey: "currentDoc",
        attr: "remark",
      },
    },*/
  ],
};
