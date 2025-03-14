import TextInput from "../../components/Input/TextInput.svelte";
import ImageUpload from "../../components/Input/ImageUpload.svelte";
import SelectInput from "../../components/Input/SelectInput.svelte";
import ColorDefs from "../../components/Input/ColorDefs";
import onDelete from "./onDelete";
import onRestore from "./onRestore";
import onSave from "./onSave";
import initialValues from "./initialValues";

const isEditing = (context) => !context.createNew
const isDeleted = (context) => context.doc.status === "deleted";

export default {
  title: (context) => `Gegenstand ${context.createNew ? "anlegen" : "bearbeiten"}`,
  initialValues,
  height: "20rem",
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
      onClick: () => {
        onSave(context.doc, context.closePopup, context.createNew, context.form)
      },
      loadingText: "Gegenstand wird gespeichert",
    },
  ],
  inputs: [
    {
      id: "iid",
      label: "Nr",
      group: "Bezeichnung",
      component: TextInput,
      props: {
        required: true,
        onlyNumbers: true,
        pattern: "[0-9]+",
        disabled: (ctx) => isDeleted(ctx) || isEditing(ctx),
      },
    },
    {
      id: "name",
      label: "Name",
      group: "Bezeichnung",
      component: TextInput,
      props: {
        required: true,
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
      id: "model",
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
          "Sonstige",
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
      id: "packaging",
      label: "Verpackung",
      group: "Eigenschaften",
      component: TextInput,
      props: {
        disabled: isDeleted,
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
      id: "manual",
      label: "Anleitung",
      group: "Beschreibung",
      component: TextInput,
      props: {
        disabled: isDeleted,
      },
    },
    {
      id: "parts",
      label: "Anzahl Teile",
      group: "Eigenschaften",
      component: TextInput,
      props: {
        onlyNumbers: true,
        disabled: isDeleted,
      },
    },
    // value of this will be an array of urls for retrieved objects and a FileList after a new file has been chosen, hacky hack hack
    {
      id: "images",
      label: "Bild",
      group: "Bild",
      component: ImageUpload,
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
          { value: "lost", label: "verschollen" },
          { value: "repairing", label: "in Reparatur" },
          { value: "forsale", label: "zu verkaufen" },
        ],
        isCreatable: false,
        isMulti: false,
        isClearable: false,
        disabled: isDeleted,
      },
    },
    {
      id: "copies",
      label: "Anzahl Exemplare",
      group: "Status",
      component: TextInput,
      props: {
        onlyNumbers: true,
        disabled: isDeleted,
      },
    },
    {
      id: "highlight_color",
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
    {
      id: "internal_note",
      label: "Interne Notiz",
      group: "Status",
      component: TextInput,
      props: {
        multiline: true,
      },
    },
  ],
};
