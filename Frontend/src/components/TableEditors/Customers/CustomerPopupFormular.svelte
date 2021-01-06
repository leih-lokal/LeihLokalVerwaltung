<script>
  import PopupFormularConfiguration from "../../Input/PopupFormularConfiguration";
  import InputTypes from "../../Input/InputTypes";
  import PopupFormular from "../../Input/PopupFormular.svelte";
  import { customerDb } from "../../../utils/stores";
  import { notifier } from "@beyonk/svelte-notifications";
  import { keyValueStore } from "../../../utils/stores";
  import { getContext } from "svelte";

  const { close } = getContext("simple-modal");

  export let createNew;
  export let onSave;

  if (createNew) {
    keyValueStore.setValue("currentDoc", {
      registration_date: new Date().getTime(),
    });
    $customerDb.nextUnusedId().then((id) =>
      keyValueStore.setValue("currentDoc", {
        ...$keyValueStore["currentDoc"],
        _id: String(id),
      })
    );
  }

  const attributeStartsWithIgnoreCaseSelector = (field, searchValue) =>
    $customerDb
      .selectorBuilder()
      .withField(field)
      .startsWithIgnoreCase(searchValue)
      .build();

  const popupFormularConfiguration = new PopupFormularConfiguration()
    .setTitle(`Kunde ${createNew ? "anlegen" : "bearbeiten"}`)
    .setDisplayDeleteButton(!createNew)
    .setInputGroups([
      "Name",
      "Adresse",
      "Kontakt",
      "Mitgliedschaft",
      "Sonstiges",
    ])
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
          $customerDb.fetchUniqueDocsBySelector(
            attributeStartsWithIgnoreCaseSelector("street", searchTerm),
            ["street"]
          ),
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
        bindTo: { keyValueStoreKey: "currentDoc", attr: "postal_code" },
        onChange: (selectedItem) => {
          keyValueStore.setValue("currentDoc", {
            ...$keyValueStore["currentDoc"],
            postal_code: selectedItem.postal_code,
          });
        },
        searchFunction: (searchTerm) =>
          $customerDb.fetchUniqueDocsBySelector(
            attributeStartsWithIgnoreCaseSelector("postal_code", searchTerm),
            ["postal_code"]
          ),
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
        searchFunction: (searchTerm) =>
          $customerDb.fetchUniqueDocsBySelector(
            attributeStartsWithIgnoreCaseSelector("city", searchTerm),
            ["city"]
          ),
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
        selectionOptions: [
          "Internet",
          "Freunde & Bekannte",
          "Zeitung / Medien",
          "Nachbarschaft",
        ],
        bindTo: { keyValueStoreKey: "currentDoc", attr: "heard" },
        isCreatable: true,
        isMulti: true,
        isClearable: true,
      },
      {
        id: "id",
        label: "Id",
        group: "Sonstiges",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "_id" },
        readonly: true,
        bindValueToObjectAttr: "_id",
      },
      {
        id: "remark",
        label: "Bemerkung",
        group: "Sonstiges",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "remark" },
      },
    ]);
</script>

<PopupFormular
  {popupFormularConfiguration}
  on:delete={(event) => {
    const doc = $keyValueStore['currentDoc'];
    if (confirm('Soll dieser Kunde wirklich gelöscht werden?')) {
      $customerDb
        .removeDoc(doc)
        .then(() => notifier.success('Kunde gelöscht!'))
        .then(close)
        .catch((error) => {
          console.error(error);
          notifier.danger('Kunde konnte nicht gelöscht werden!', 6000);
        });
    }
  }}
  on:save={(event) => {
    const doc = $keyValueStore['currentDoc'];
    const savePromise = createNew ? $customerDb.createDoc(doc) : $customerDb.updateDoc(doc);

    savePromise
      .then((result) => notifier.success('Kunde gespeichert!'))
      .then(close)
      .then(onSave)
      .catch((error) => {
        notifier.danger('Kunde konnte nicht gespeichert werden!', 6000);
        console.error(error);
        close();
      });
  }}
  on:cancel={close} />
