<script>
  import PopupFormularConfiguration from "../../Input/PopupFormularConfiguration";
  import InputTypes from "../../Input/InputTypes";
  import ColorDefs from "../../Input/ColorDefs";
  import PopupFormular from "../../Input/PopupFormular.svelte";
  import { itemDb, keyValueStore } from "../../../utils/stores";
  import { notifier } from "@beyonk/svelte-notifications";
  import WoocommerceClient from "ENV_WC_CLIENT";
  import { getContext } from "svelte";

  const { close } = getContext("simple-modal");

  const woocommerceClient = new WoocommerceClient();

  export let createNew;
  export let onSave;

  if (createNew) {
    keyValueStore.setValue("currentDoc", {
      added: new Date().getTime(),
      status_on_website: "instock",
    });
    $itemDb.nextUnusedId().then((id) =>
      keyValueStore.setValue("currentDoc", {
        ...$keyValueStore["currentDoc"],
        _id: String(id),
      })
    );
  }

  const docIsDeleted = $keyValueStore["currentDoc"].status_on_website === "deleted";

  keyValueStore.setValue("mock", {
    status_on_website: "gelöscht",
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
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "_id" },
      },
      {
        id: "item_name",
        disabled: docIsDeleted,
        label: "Gegenstand Name",
        group: "Bezeichnung",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "item_name" },
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
        id: "status_on_website",
        disabled: docIsDeleted,
        label: "Status auf Webseite",
        group: "Status",
        type: InputTypes.SELECTION,
        bindTo: {
          keyValueStoreKey: docIsDeleted ? "mock" : "currentDoc",
          attr: "status_on_website",
        },
        selectionOptions: [
          { value: "instock", label: "verfügbar" },
          { value: "outofstock", label: "verliehen" },
          { value: "onbackorder", label: "nicht verleihbar" },
        ],
        isCreatable: false,
        isMulti: false,
        isClearable: false,
      },
      {
        id: "highlight",
        label: "Markieren",
        group: "Status",
        type: InputTypes.SELECTION,
        selectionOptions: [
          { value: "", label: "Nicht markieren" },
          {
            value: ColorDefs.GREEN,
            label: "<a style='color:" + ColorDefs.HIGHLIGHT_GREEN + "'>■</a> Grün",
          },
          {
            value: ColorDefs.BLUE,
            label: "<a style='color: " + ColorDefs.HIGHLIGHT_BLUE + "'>■</a> Blau",
          },
          {
            value: ColorDefs.YELLOW,
            label: "<a style='color: " + ColorDefs.HIGHLIGHT_YELLOW + "'>■</a> Gelb",
          },
          {
            value: ColorDefs.RED,
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
  on:delete={(event) => {
    const doc = $keyValueStore["currentDoc"];
    if (confirm("Soll dieser Gegenstand wirklich gelöscht werden?")) {
      $itemDb
        .removeDoc(doc)
        .then(() => notifier.success("Gegenstand gelöscht!"))
        .then(close)
        .then(onSave)
        .catch((error) => {
          console.error(error);
          notifier.danger("Gegenstand konnte nicht gelöscht werden!", 6000);
        });
    }
  }}
  on:save={async (event) => {
    const doc = $keyValueStore["currentDoc"];
    const savePromise = createNew ? $itemDb.createDoc(doc) : $itemDb.updateDoc(doc);
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
          $itemDb.updateDoc(doc);
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
