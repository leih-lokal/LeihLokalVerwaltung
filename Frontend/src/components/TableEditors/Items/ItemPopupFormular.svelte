<script>
  import PopupFormularConfiguration from "../../Input/PopupFormularConfiguration";
  import InputTypes from "../../Input/InputTypes";
  import ColorDefs from "../../Input/ColorDefs";
  import PopupFormular from "../../Input/PopupFormular.svelte";
  import { keyValueStore } from "../../../utils/stores";
  import { millisAtStartOfToday } from "../../../utils/utils";
  import Database from "../../Database/ENV_DATABASE";
  import { notifier } from "@beyonk/svelte-notifications";
  import WoocommerceClient from "ENV_WC_CLIENT";
  import { getContext } from "svelte";
  import columns from "./Columns";

  const { close } = getContext("simple-modal");

  const woocommerceClient = new WoocommerceClient();

  export let createNew;
  export let onSave;

  if (createNew) {
    keyValueStore.setValue("currentDoc", {
      added: millisAtStartOfToday(),
      status: "instock",
      type: "item",
      name: "",
      brand: "",
      itype: "",
      category: "",
      deposit: "",
      parts: "",
      exists_more_than_once: false,
      manual: "",
      package: "",
      wc_url: "",
      wc_id: "",
      image: "",
      highlight: "",
      synonyms: "",
      description: "",
    });
    Database.nextUnusedId("item").then((id) =>
      keyValueStore.setValue("currentDoc", {
        ...$keyValueStore["currentDoc"],
        id: id,
      })
    );
  }

  const docIsDeleted = $keyValueStore["currentDoc"].status === "deleted";

  keyValueStore.setValue("mock", {
    status: "gelöscht",
  });

  const popupFormularConfiguration = new PopupFormularConfiguration()
    .setTitle(`Gegenstand ${createNew ? "anlegen" : "bearbeiten"}`)
    .setDisplayDeleteButton(!createNew)
    .setInputGroups(["Bezeichnung", "Beschreibung", "Eigenschaften", "Bild", "Status"])
    .setInputs([
      {
        id: "item_id",
        disabled: docIsDeleted,
        label: "Gegenstand Nr",
        group: "Bezeichnung",
        inputType: "number",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "id" },
      },
      {
        id: "name",
        disabled: docIsDeleted,
        label: "Gegenstand Name",
        group: "Bezeichnung",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "name" },
      },
      {
        id: "brand",
        disabled: docIsDeleted,
        label: "Marke",
        group: "Bezeichnung",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "brand" },
      },
      {
        id: "itype",
        disabled: docIsDeleted,
        label: "Typbezeichnung",
        group: "Bezeichnung",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "itype" },
      },

      {
        id: "category",
        disabled: docIsDeleted,
        label: "Kategorie",
        group: "Eigenschaften",
        type: InputTypes.SELECTION,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "category" },
        selectionOptions: ["Küche", "Haushalt", "Garten", "Kinder", "Freizeit", "Heimwerker"],
        isCreatable: false,
        isMulti: true,
        isClearable: true,
      },
      {
        id: "deposit",
        disabled: docIsDeleted,
        inputType: "number",
        label: "Pfand",
        group: "Eigenschaften",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "deposit" },
      },
      {
        id: "added",
        disabled: docIsDeleted,
        label: "Erfasst am",
        group: "Eigenschaften",
        type: InputTypes.DATE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "added" },
      },
      {
        id: "description",
        disabled: docIsDeleted,
        label: "Beschreibung",
        group: "Beschreibung",
        type: InputTypes.TEXT,
        multiline: true,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "description" },
      },
      {
        id: "synonyms",
        disabled: docIsDeleted,
        label: "Synonyme",
        group: "Beschreibung",
        type: InputTypes.SELECTION,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "synonyms" },
        isCreatable: true,
        isMulti: true,
        isClearable: true,
        placeholder: "Synonyme anlegen",
      },

      {
        id: "parts",
        disabled: docIsDeleted,
        label: "Anzahl Teile",
        group: "Eigenschaften",
        inputType: "number",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "parts" },
      },

      {
        id: "image",
        disabled: docIsDeleted,
        label: "Bild",
        group: "Bild",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "image" },
      },

      {
        id: "status",
        disabled: docIsDeleted,
        label: "Status auf Webseite",
        group: "Status",
        type: InputTypes.SELECTION,
        bindTo: {
          keyValueStoreKey: docIsDeleted ? "mock" : "currentDoc",
          attr: "status",
        },
        selectionOptions: [
          { value: "instock", label: "verfügbar" },
          { value: "outofstock", label: "verliehen" },
          { value: "onbackorder", label: "nicht verleihbar" },
          { value: "reserved", label: "reserviert" },
        ],
        isCreatable: false,
        isMulti: false,
        isClearable: false,
      },
      {
        id: "exists_more_than_once",
        label: "Mehrmals vorhanden",
        group: "Status",
        type: InputTypes.CHECKBOX,
        bindTo: {
          keyValueStoreKey: "currentDoc",
          attr: "exists_more_than_once",
        },
      },
      {
        id: "highlight",
        label: "Markieren",
        group: "Status",
        type: InputTypes.SELECTION,
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
        bindTo: { keyValueStoreKey: "currentDoc", attr: "highlight" },
        isClearable: true,
        isMulti: false,
      },
    ]);
</script>

<PopupFormular
  {popupFormularConfiguration}
  on:delete={async (event) => {
    const doc = $keyValueStore["currentDoc"];
    if (confirm("Soll dieser Gegenstand wirklich gelöscht werden?")) {
      doc.status_on_website = "deleted";
      await Database
        .updateDoc(doc)
        .then(() => notifier.success("Gegenstand als gelöscht markiert!"))
        .then(close)
        .then(onSave)
        .catch((error) => {
          console.error(error);
          notifier.danger("Gegenstand konnte nicht gelöscht werden!", 6000);
        });

      await woocommerceClient
        .deleteItem(doc)
        .then(() => notifier.success("Gegenstand von der Webseite gelöscht!", 3000))
        .catch((error) => {
          notifier.warning("Gegenstand konnte nicht von der Webseite gelöscht werden!", 6000);
          console.error(error);
        });
    }
  }}
  on:save={async (event) => {
    const doc = $keyValueStore["currentDoc"];
    Object.keys(doc).forEach((key) => {
      const colForKey = columns.find((col) => col.key === key);
      if (colForKey && colForKey.numeric && doc[key] === "") {
        doc[key] = 0; // default value for numbers
      }
    });
    const savePromise = createNew ? Database.createDoc(doc) : Database.updateDoc(doc);
    await savePromise
      .then((result) => notifier.success("Gegenstand gespeichert!"))
      .then(close)
      .then(onSave)
      .catch((error) => {
        notifier.danger("Gegenstand konnte nicht gespeichert werden!", 6000);
        console.error(error);
      });

    if (createNew) {
      woocommerceClient
        .createItem(doc)
        .then((wcDoc) => {
          doc.wc_url = wcDoc.permalink;
          doc.wc_id = wcDoc.id;
          Database.updateDoc(doc);
          notifier.success("Gegenstand auf der Webseite erstellt!", 3000);
        })
        .catch((error) => {
          notifier.warning("Gegenstand konnte auf der Webseite nicht erstellt werden!", 6000);
          console.error(error);
        });
    } else {
      woocommerceClient
        .updateItem(doc)
        .then(() => notifier.success("Status auf der Webseite aktualisiert!", 3000))
        .catch((error) => {
          notifier.warning("Status auf der Webseite konnte nicht aktualisiert werden!", 6000);
          console.error(error);
        });
    }
  }}
  on:cancel={close}
/>
