import TextInput from "../../components/Input/TextInput.svelte";
import AutocompleteInput from "../../components/Input/AutocompleteInput.svelte";
import DateInput from "../../components/Input/DateInput.svelte";
import SelectInput from "../../components/Input/SelectInput.svelte";
import Checkbox from "../../components/Input/Checkbox.svelte";
import Database from "../../database/ENV_DATABASE";
import ColorDefs from "../../components/Input/ColorDefs";
import onSave from "./onSave";
import onDelete from "./onDelete";
import initialValues from "./initialValues";

export default {
  title: (context) => `Kunde ${context.createNew ? "anlegen" : "bearbeiten"}`,
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
      loadingText: "Kunde wird gelöscht",
    },
    {
      text: "Speichern",
      onClick: () => onSave(context.doc, context.closePopup, context.createNew),
      loadingText: "Kunde wird gespeichert",
    },
  ],
  inputs: [
    {
      id: "firstname",
      label: "Vorname",
      group: "Name",
      component: TextInput,
    },
    {
      id: "lastname",
      label: "Nachname",
      group: "Name",
      component: TextInput,
    },
    {
      id: "street",
      label: "Straße",
      group: "Adresse",
      component: AutocompleteInput,
      props: {
        searchFunction: (context) => (searchTerm) =>
          Database.fetchUniqueCustomerFieldValues("street", searchTerm),
        noResultsText: "Straße noch nicht in Datenbank",
      },
    },
    {
      id: "house_number",
      label: "Hausnummer",
      group: "Adresse",
      component: TextInput,
    },
    {
      id: "postal_code",
      label: "Postleitzahl",
      group: "Adresse",
      component: AutocompleteInput,
      props: {
        onlyNumbers: true,
        searchFunction: (context) => (searchTerm) =>
          Database.fetchUniqueCustomerFieldValues(
            "postal_code",
            searchTerm,
            true
          ),

        noResultsText: "PLZ noch nicht in Datenbank",
      },
    },
    {
      id: "city",
      label: "Stadt",
      group: "Adresse",
      component: AutocompleteInput,
      props: {
        searchFunction: (context) => (searchTerm) =>
          Database.fetchUniqueCustomerFieldValues("city", searchTerm),
        noResultsText: "Stadt noch nicht in Datenbank",
      },
    },
    {
      id: "email",
      label: "E-Mail",
      group: "Kontakt",
      component: TextInput,
    },
    {
      id: "telephone_number",
      label: "Telefonnummer",
      group: "Kontakt",
      component: TextInput,
    },
    {
      id: "subscribed_to_newsletter",
      label: "Newsletter",
      group: "Kontakt",
      component: Checkbox,
    },
    {
      id: "registration_date",
      label: "Beitritt",
      group: "Mitgliedschaft",
      component: DateInput,
      props: {
        container: (context) => context.container,
      },
    },
    {
      id: "renewed_on",
      label: "Verlängert am",
      group: "Mitgliedschaft",
      component: DateInput,
      hidden: (context) => context.createNew,
      props: {
        quickset: { 0: "Heute" },
        container: (context) => context.container,
      },
    },
    {
      id: "heard",
      label: "Aufmerksam geworden",
      group: "Mitgliedschaft",
      component: SelectInput,
      props: {
        selectionOptions: [
          "Internet",
          "Freunde & Bekannte",
          "Zeitung / Medien",
          "Nachbarschaft",
        ],
        isCreatable: true,
        isMulti: true,
        isClearable: true,
      },
    },
    {
      id: "id",
      label: "Kundennummer",
      group: "Sonstiges",
      component: TextInput,
      props: {
        onlyNumbers: true,
      },
    },
    {
      id: "remark",
      label: "Bemerkung",
      group: "Sonstiges",
      component: TextInput,
    },
    {
      id: "highlight",
      label: "Markieren",
      group: "Sonstiges",
      component: SelectInput,
      props: {
        selectionOptions: [
          { value: "", label: "Nicht markieren" },
          {
            value: ColorDefs.HIGHLIGHT_GREEN,
            label:
              "<a style='color:" + ColorDefs.HIGHLIGHT_GREEN + "'>■</a> Grün",
          },
          {
            value: ColorDefs.HIGHLIGHT_BLUE,
            label:
              "<a style='color: " + ColorDefs.HIGHLIGHT_BLUE + "'>■</a> Blau",
          },
          {
            value: ColorDefs.HIGHLIGHT_YELLOW,
            label:
              "<a style='color: " + ColorDefs.HIGHLIGHT_YELLOW + "'>■</a> Gelb",
          },
          {
            value: ColorDefs.HIGHLIGHT_RED,
            label:
              "<a style='color: " + ColorDefs.HIGHLIGHT_RED + "'>■</a> Rot",
          },
        ],
        isClearable: true,
        isMulti: false,
      },
    },
  ],
};
