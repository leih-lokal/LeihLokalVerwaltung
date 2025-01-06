import TextInput from "../../components/Input/TextInput.svelte";
import AutocompleteInput from "../../components/Input/AutocompleteInput.svelte";
import DateInput from "../../components/Input/DateInput.svelte";
import SelectInput from "../../components/Input/SelectInput.svelte";
import Checkbox from "../../components/Input/Checkbox.svelte";
import Database from "../../database/ENV_DATABASE";
import ApiClient from "../../database/Api";
import onSave from "./onSave";
import onDelete from "./onDelete";
import initialValues from "./initialValues";
import { customerIdStartsWithSelector } from "../selectors";
import { getApiClient } from "../../utils/api";

const api = getApiClient()

const selectedItemOptions = []  // { value, label, _ref }

const updateReservationCustomer = (context, customer) => {
  context.updateDoc({
    customer_name: `${customer.firstname} ${customer.lastname}`,
    customer_iid: customer.id,
    customer_email: customer.email,
    customer_phone: customer.telephone_number?.replace(/\s/, '').trim(),
  });
};

const updateAddReservationItem = (context, item) => {
  const selectedItemsPrev = selectedItemOptions.map(o => o._ref)
  if (selectedItemsPrev.find(i => i.id === item.id)) return
  const selectedItems = [...selectedItemsPrev, item]

  selectedItemOptions.splice(0, selectedItemOptions.length)
  selectedItemOptions.push(...selectedItems.map(item => ({
    value: item.id,
    label: `${String(item.iid).padStart(4, "0")} - ${item.name}`,
    _ref: item
  })))

  context.updateDoc({ item_ids: selectedItems.map(item => item.id).join(', ') });
  context.reloadById('item_ids')
};

export default {
  title: (context) => `Reservierung ${context.createNew ? "anlegen" : "bearbeiten"}`,
  initialValues,
  onMount: (context) => () => {
    selectedItemOptions.splice(0, selectedItemOptions.length)

    if (!context.createNew) {
      context.doc.item_ids = context.doc.items.join(', ')
      context.doc.expand.items.forEach(item => updateAddReservationItem(context, item))
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
      loadingText: "Reservierung wird gelöscht",
    },
    {
      text: "Speichern",
      onClick: () => {
        onSave(context.doc, context.closePopup, context.createNew, context.form)
      },
      loadingText: "Reservierung wird gespeichert",
    },
  ],
  inputs: [
    {
      id: "customer_iid",
      label: "Nutzer Nr.",
      group: "Nutzer",
      component: AutocompleteInput,
      nobind: true,
      props: {
        required: false,
        localFiltering: true,
        valueField: "id",
        onlyNumbers: true,
        searchFunction: (context) => (searchTerm) =>
          Database.fetchDocsBySelector(
            customerIdStartsWithSelector(searchTerm),
            ["id", "firstname", "lastname", "telephone_number", "email"],
            ["id"]
          ),
        suggestionFormat: (context) => (id, firstname, lastname) => `${id}: ${firstname} ${lastname}`,
        noResultsText: "Kein/e Nutzer:in mit dieser Nummer",
        onSelected: (context) => (selectedCustomer) => {
          updateReservationCustomer(context, selectedCustomer);
        },
      },
    },
    {
      id: "customer_name",
      label: "Nutzer Name",
      group: "Nutzer",
      component: TextInput,
      props: { required: true },
    },
    {
      id: "customer_email",
      label: "Nutzer E-Mail",
      group: "Nutzer",
      component: TextInput,
      props: {
        required: true,
        pattern: ".+@.+\.[a-zA-Z]+",
      },
    },
    {
      id: "customer_phone",
      label: "Nutzer Telefon",
      group: "Nutzer",
      component: TextInput,
      props: {
        required: true,
      },
    },
    {
      id: "is_new_customer",
      label: "Neukunde?",
      group: "Nutzer",
      component: Checkbox,
    },
    {
      id: "pickup",
      label: "Abholungstermin",
      group: "Abholung",
      component: DateInput,
      props: {
        required: true,
        time: true,
      },
    },
    {
      id: "_item_search",
      required: false,
      label: "Suche",
      group: "Gegenstände",
      component: AutocompleteInput,
      nobind: true,
      props: {
        valueField: "id",
        localFiltering: false,
        searchFunction: (context) => (searchTerm) =>
          api.findItems(1, 30, { status: 'instock', query: searchTerm }).then(result => result.items)
        ,
        suggestionFormat: (context) => (...values) => `${String(values[11])} - ${values[17]}`,  // TODO: what the heck?!
        noResultsText: "Kein Gegenstand mit dieser ID",
        onSelected: (context) => (selectedItem) => {
          updateAddReservationItem(context, selectedItem);
        }
      }
    },
    {
      id: "item_ids",
      label: "Ausgewählt",
      group: "Gegenstände",
      component: SelectInput,
      props: {
        required: true,
        isCreatable: false,
        isMulti: true,
        isClearable: true,
        selectionOptions: selectedItemOptions,
      }
    },
    {
      id: "comments",
      label: "Kommentare",
      group: "Sonstiges",
      component: TextInput,
      props: {
        required: false,
        multiline: true,
      },
    },
    {
      id: "done",
      label: "Erledigt?",
      group: "Sonstiges",
      component: Checkbox,
    },
  ],
};
