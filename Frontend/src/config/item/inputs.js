import TextInput from "../../components/Input/TextInput.svelte";
import AutocompleteInput from "../../components/Input/AutocompleteInput.svelte";
import DateInput from "../../components/Input/DateInput.svelte";
import SelectInput from "../../components/Input/SelectInput.svelte";
import Checkbox from "../../components/Input/Checkbox.svelte";
import Database from "../../components/Database/ENV_DATABASE";
import InputTypes from "../../components/Input/InputTypes";
import ColorDefs from "../../components/Input/ColorDefs";
import Button from "../../components/Input/Button.svelte";
import onCreate from "./onCreate";
import onDelete from "./onDelete";
import onUpdate from "./onUpdate";

export default {
  title: (context) => `Gegenstand ${context.createNew ? "anlegen" : "bearbeiten"}`,
  footerButtons: (context) => [
    {
      text: "Abbrechen",
      onClick: context.closePopup,
    },
    {
      text: "Löschen",
      onClick: () => onDelete(context.doc, context.closePopup),
      color: "red",
      hidden: context.doc.status !== "deleted",
    },
    {
      text: "Wiederherstellen",
      onClick: () => onDelete(context.doc, context.closePopup),
      color: "green",
      hidden: context.doc.status === "deleted",
    },
    {
      text: "Speichern",
      onClick: () =>
        context.createNew
          ? onCreate(context.doc, context.closePopup)
          : onUpdate(context.doc, context.closePopup),
    },
  ],
  inputs: [
    {
      id: "firstname",
      label: "Vorname",
      group: "Name",
      component: Button,
      props: {
        id: "firstname",
      },
    },
  ],
};
