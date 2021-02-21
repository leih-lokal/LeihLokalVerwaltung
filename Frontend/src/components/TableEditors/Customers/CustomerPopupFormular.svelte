<script>
  import PopupFormularConfiguration from "../../Input/PopupFormularConfiguration";
  import InputTypes from "../../Input/InputTypes";
  import ColorDefs from "../../Input/ColorDefs";
  import PopupFormular from "../../Input/PopupFormular.svelte";
  import Database from "../../Database/ENV_DATABASE";
  import { notifier } from "@beyonk/svelte-notifications";
  import { keyValueStore } from "../../../utils/stores";
  import { millisAtStartOfToday } from "../../../utils/utils";
  import { getContext } from "svelte";

  const { close } = getContext("simple-modal");

  export let createNew;
  export let onSave;

  if (createNew) {
    keyValueStore.setValue("currentDoc", {
      registration_date: millisAtStartOfToday(),
      type: "customer",
      lastname: "",
      firstname: "",
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: false,
      email: "",
      street: "",
      house_number: "",
      postal_code: "",
      city: "",
      telephone_number: "",
      heard: "",
      highlight: "",
    });
    Database.nextUnusedId("customer").then((id) =>
      keyValueStore.setValue("currentDoc", {
        ...$keyValueStore["currentDoc"],
        id: id,
      })
    );
  }

  const popupFormularConfiguration = new PopupFormularConfiguration()
    .setTitle(`Kunde ${createNew ? "anlegen" : "bearbeiten"}`)
    .setDisplayDeleteButton(!createNew)
    .setInputGroups(["Name", "Adresse", "Kontakt", "Mitgliedschaft", "Sonstiges"])
    .setInputs([
      {
        id: "firstname",
        label: "Vorname",
        group: "Name",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "firstname" },
      },
      {
        id: "lastname",
        label: "Nachname",
        group: "Name",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "lastname" },
      },
      {
        id: "street",
        label: "Strasse",
        group: "Adresse",
        type: InputTypes.AUTOCOMPLETE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "street" },
        onChange: (selectedItem) => {
          keyValueStore.setValue("currentDoc", {
            ...$keyValueStore["currentDoc"],
            street: selectedItem.street,
          });
        },
        searchFunction: (searchTerm) =>
          Database.fetchUniqueCustomerFieldValues("street", searchTerm),
        suggestionFormat: (street) => `${street}`,
        noResultsText: "Straße noch nicht in Datenbank",
      },
      {
        id: "house_number",
        label: "Hausnummer",
        group: "Adresse",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "house_number" },
      },
      {
        id: "postal_code",
        label: "Postleitzahl",
        group: "Adresse",
        type: InputTypes.AUTOCOMPLETE,
        inputType: "number",
        bindTo: { keyValueStoreKey: "currentDoc", attr: "postal_code" },
        onChange: (selectedItem) => {
          keyValueStore.setValue("currentDoc", {
            ...$keyValueStore["currentDoc"],
            postal_code: selectedItem.postal_code,
          });
        },
        searchFunction: (searchTerm) =>
          Database.fetchUniqueCustomerFieldValues("postal_code", searchTerm, true),
        suggestionFormat: (postal_code) => `${postal_code}`,
        noResultsText: "PLZ noch nicht in Datenbank",
      },
      {
        id: "city",
        label: "Stadt",
        group: "Adresse",
        type: InputTypes.AUTOCOMPLETE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "city" },
        onChange: (selectedItem) => {
          keyValueStore.setValue("currentDoc", {
            ...$keyValueStore["currentDoc"],
            city: selectedItem.city,
          });
        },
        searchFunction: (searchTerm) => Database.fetchUniqueCustomerFieldValues("city", searchTerm),
        suggestionFormat: (city) => `${city}`,
        noResultsText: "Stadt noch nicht in Datenbank",
      },
      {
        id: "email",
        label: "E-Mail",
        group: "Kontakt",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "email" },
      },
      {
        id: "telephone_number",
        label: "Telefonnummer",
        group: "Kontakt",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "telephone_number" },
      },
      {
        id: "subscribed_to_newsletter",
        label: "Newsletter",
        group: "Kontakt",
        type: InputTypes.CHECKBOX,
        bindTo: {
          keyValueStoreKey: "currentDoc",
          attr: "subscribed_to_newsletter",
        },
      },
      {
        id: "registration_date",
        label: "Beitritt",
        group: "Mitgliedschaft",
        type: InputTypes.DATE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "registration_date" },
      },
      {
        id: "renewed_on",
        label: "Verlängert am",
        group: "Mitgliedschaft",
        hidden: createNew,
        quickset: { 0: "Heute" },
        type: InputTypes.DATE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "renewed_on" },
      },
      {
        id: "heard",
        label: "Aufmerksam geworden",
        group: "Mitgliedschaft",
        type: InputTypes.SELECTION,
        selectionOptions: ["Internet", "Freunde & Bekannte", "Zeitung / Medien", "Nachbarschaft"],
        bindTo: { keyValueStoreKey: "currentDoc", attr: "heard" },
        isCreatable: true,
        isMulti: true,
        isClearable: true,
      },
      {
        id: "id",
        label: "Id",
        group: "Sonstiges",
        inputType: "number",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "id" },
        bindValueToObjectAttr: "id",
      },
      {
        id: "remark",
        label: "Bemerkung",
        group: "Sonstiges",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "remark" },
      },
      {
        id: "highlight",
        label: "Markieren",
        group: "Sonstiges",
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
  on:delete={(event) => {
    const doc = $keyValueStore["currentDoc"];
    if (confirm("Soll dieser Kunde wirklich gelöscht werden?")) {
      Database.removeDoc(doc)
        .then(() => notifier.success("Kunde gelöscht!"))
        .then(close)
        .then(onSave)
        .catch((error) => {
          console.error(error);
          notifier.danger("Kunde konnte nicht gelöscht werden!", 6000);
        });
    }
  }}
  on:save={(event) => {
    const doc = $keyValueStore["currentDoc"];
    const savePromise = createNew ? Database.createDoc(doc) : Database.updateDoc(doc);

    savePromise
      .then((result) => notifier.success("Kunde gespeichert!"))
      .then(close)
      .then(onSave)
      .catch((error) => {
        notifier.danger("Kunde konnte nicht gespeichert werden!", 6000);
        console.error(error);
        close();
      });
  }}
  on:cancel={close}
/>
