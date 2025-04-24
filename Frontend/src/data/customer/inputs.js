import TextInput from "../../components/Input/TextInput.svelte";
import AutocompleteInput from "../../components/Input/AutocompleteInput.svelte";
import DateInput from "../../components/Input/DateInput.svelte";
import SelectInput from "../../components/Input/SelectInput.svelte";
import Checkbox from "../../components/Input/Checkbox.svelte";
import ColorDefs from "../../components/Input/ColorDefs";
import onSave from "./onSave";
import onDelete from "./onDelete";
import initialValues from "./initialValues";
import { getApiClient } from "../../utils/api";
import { getAutocompleteField } from './adapter.js'

const apiClient = getApiClient()

export default {
  title: (context) => `Nutzer:in ${context.createNew ? "anlegen" : "bearbeiten"}`,
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
      loadingText: "Nutzer:in wird gelöscht",
    },
    {
      text: "Speichern",
      onClick: () => onSave(context.doc, context.closePopup, context.createNew, context.form),
      loadingText: "Nutzer:in wird gespeichert",
    },
  ],
  inputs: [
    {
      id: "iid",
      label: "Nutzernummer",
      group: "ID und Name",
      component: TextInput,
      props: {
        pattern: "[0-9]+",
        required: true,
        onlyNumbers: true,
      },
    },
    {
      id: "firstname",
      label: "Vorname",
      group: "ID und Name",
      component: TextInput,
      props: { required: true },
    },
    {
      id: "lastname",
      label: "Nachname",
      group: "ID und Name",
      component: TextInput,
      props: { required: true },
    },
    {
      id: "street",
      label: "Straße + Nr.",
      group: "Adresse",
      component: AutocompleteInput,
      props: {
        required: true,
        // searchFunction: (context) => (searchTerm) => getAutocompleteField('street', searchTerm),
        // noResultsText: "Straße noch nicht in Datenbank",
        valueField: "street",
      },
    },
    {
      id: "postal_code",
      label: "Postleitzahl",
      group: "Adresse",
      component: TextInput,
      props: {
        required: true,
        onlyNumbers: true,
      },
    },
    {
      id: "city",
      label: "Stadt",
      group: "Adresse",
      component: TextInput,
      props: {
        required: true,
      },
    },
    {
      id: "email",
      label: "E-Mail",
      group: "Kontakt",
      component: TextInput,
      props: {
        required: true,
        pattern: ".+@.+\.[a-zA-Z]+",
      }
    },
    {
      id: "phone",
      label: "Telefonnummer",
      group: "Kontakt",
      component: TextInput,
    },
    {
      id: "newsletter",
      label: "Newsletter",
      group: "Kontakt",
      component: Checkbox,
    },
    {
      id: "registered_on",
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
          "Sonstige"
        ],
        isCreatable: true,
        isMulti: true,
        isClearable: true,
      },
    },
    {
      id: "remark",
      label: "Bemerkung",
      group: "Sonstiges",
      component: TextInput,
    },
    {
      id: "highlight_color",
      label: "Markieren",
      group: "Sonstiges",
      component: SelectInput,
      props: {
        selectionOptions: [
          { value: "", label: "Nicht markieren" },
          {
            value: ColorDefs.HIGHLIGHT_GREEN,
            label: "<a style='color:" + ColorDefs.HIGHLIGHT_GREEN + "'>■</a> Grün",
          },
          {
            value: ColorDefs.HIGHLIGHT_BLUE,
            label: "<a style='color: " + ColorDefs.HIGHLIGHT_BLUE + "'>■</a> Blau",
          },
          {
            value: ColorDefs.HIGHLIGHT_YELLOW,
            label: "<a style='color: " + ColorDefs.HIGHLIGHT_YELLOW + "'>■</a> Gelb",
          },
          {
            value: ColorDefs.HIGHLIGHT_RED,
            label: "<a style='color: " + ColorDefs.HIGHLIGHT_RED + "'>■</a> Rot",
          },
        ],
        isClearable: true,
        isMulti: false,
      },
    },
  ],
};
