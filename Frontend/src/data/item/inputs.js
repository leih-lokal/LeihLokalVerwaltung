import TextInput from "../../components/Input/TextInput.svelte";
import DateInput from "../../components/Input/DateInput.svelte";
import SelectInput from "../../components/Input/SelectInput.svelte";
import Checkbox from "../../components/Input/Checkbox.svelte";
import ColorDefs from "../../components/Input/ColorDefs";
import onCreate from "./onCreate";
import onDelete from "./onDelete";
import onUpdate from "./onUpdate";
import onRestore from "./onRestore";
import initialValues from "./initialValues";

const isDeleted = (context) => context.doc.status === "deleted";

export default {
  title: (context) =>
    `Gegenstand ${context.createNew ? "anlegen" : "bearbeiten"}`,
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
      hidden: context.doc.status === "deleted" || context.createNew,
      loadingText: "Gegenstand wird gelöscht",
    },
    {
      text: "Wiederherstellen",
      onClick: () => onRestore(context.doc, context.closePopup),
      color: "green",
      hidden: context.doc.status !== "deleted",
      loadingText: "Gegenstand wird wiederhergestellt",
    },
    {
      text: "Speichern",
      onClick: context.createNew
        ? () => onCreate(context.doc, context.closePopup)
        : () => onUpdate(context.doc, context.closePopup),
      loadingText: "Gegenstand wird gespeichert",
    },
  ],
  inputs: [
    {
      id: "id",
      label: "Gegenstand Nr",
      group: "Bezeichnung",
      component: TextInput,
      props: {
        onlyNumbers: true,
        disabled: isDeleted,
      },
    },
    {
      id: "name",
      label: "Gegenstand Name",
      group: "Bezeichnung",
      component: TextInput,
      props: {
        disabled: isDeleted,
      },
    },
    {
      id: "brand",
      label: "Marke",
      group: "Bezeichnung",
      component: TextInput,
      props: {
        disabled: isDeleted,
      },
    },
    {
      id: "itype",
      label: "Typbezeichnung",
      group: "Bezeichnung",
      component: TextInput,
      props: {
        disabled: isDeleted,
      },
    },
    {
      id: "category",
      label: "Kategorie",
      group: "Eigenschaften",
      component: SelectInput,
      props: {
        disabled: isDeleted,
        selectionOptions: [
          "Küche",
          "Haushalt",
          "Garten",
          "Kinder",
          "Freizeit",
          "Heimwerker",
        ],
        isCreatable: false,
        isMulti: true,
        isClearable: true,
      },
    },
    {
      id: "deposit",
      label: "Pfand",
      group: "Eigenschaften",
      component: TextInput,
      props: {
        onlyNumbers: true,
        disabled: isDeleted,
      },
    },
    {
      id: "added",
      label: "Erfasst am",
      group: "Eigenschaften",
      component: DateInput,
      props: {
        disabled: isDeleted,
        container: (context) => context.container,
      },
    },
    {
      id: "description",
      label: "Beschreibung",
      group: "Beschreibung",
      component: TextInput,
      props: {
        multiline: true,
        disabled: isDeleted,
      },
    },
    {
      id: "synonyms",
      label: "Synonyme",
      group: "Beschreibung",
      component: SelectInput,
      props: {
        isCreatable: true,
        isMulti: true,
        isClearable: true,
        placeholder: "Synonyme anlegen",
        disabled: isDeleted,
      },
    },

    {
      id: "parts",
      label: "Anzahl Teile",
      group: "Eigenschaften",
      component: TextInput,
      props: {
        disabled: isDeleted,
      },
    },

    {
      id: "image",
      label: "Bild",
      group: "Bild",
      component: TextInput,
      props: {
        disabled: isDeleted,
      },
    },

    {
      id: "status",
      label: "Status",
      group: "Status",
      component: SelectInput,
      props: {
        selectionOptions: [
          { value: "instock", label: "verfügbar" },
          { value: "outofstock", label: "verliehen" },
          { value: "onbackorder", label: "nicht verleihbar" },
          { value: "reserved", label: "reserviert" },
        ],
        isCreatable: false,
        isMulti: false,
        isClearable: false,
        disabled: isDeleted,
      },
    },
    {
      id: "exists_more_than_once",
      label: "Mehrmals vorhanden",
      group: "Status",
      component: Checkbox,
      props: {
        disabled: isDeleted,
      },
    },
    {
      id: "highlight",
      label: "Markieren",
      group: "Status",
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
        disabled: isDeleted,
      },
    },
  ],
};
