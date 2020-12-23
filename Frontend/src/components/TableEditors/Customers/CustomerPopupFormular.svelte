<script>
  import PopupFormularConfiguration from "../../Input/PopupFormularConfiguration";
  import InputTypes from "../../Input/InputTypes";
  import PopupFormular from "../../Input/PopupFormular.svelte";
  import { customerDb } from "../../../utils/stores";
  import { notifier } from "@beyonk/svelte-notifications";

  export let createNew;
  export let doc = {};

  const popupFormularConfiguration = new PopupFormularConfiguration()
    .setDocName("Kunde")
    .setCreateInitialDoc(async (doc) => {
      doc.registration_date = new Date().getTime();
      doc._id = String(await $customerDb.nextUnusedId());
    })
    .setOnDeleteButtonClicked((doc, close) => {
      if (confirm("Soll dieser Kunde wirklich gelöscht werden?")) {
        $customerDb
          .removeDoc(doc)
          .then(() => notifier.success("Kunde gelöscht!"))
          .then(close)
          .catch((error) => {
            console.error(error);
            notifier.danger("Kunde konnte nicht gelöscht werden!", 6000);
          });
      }
    })
    .setOnSaveButtonClicked((doc, createNew, close) => {
      const savePromise = createNew
        ? $customerDb.createDoc(doc)
        : $customerDb.updateDoc(doc);

      savePromise
        .then((result) => notifier.success("Kunde gespeichert!"))
        .then(close)
        .catch((error) => {
          notifier.danger("Kunde konnte nicht gespeichert werden!", 6000);
          console.error(error);
          close();
        });
    })
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
        bindToDocAttribute: "firstname",
      },
      {
        id: "lastname",
        label: "Nachname",
        group: "Name",
        type: InputTypes.TEXT,
        bindToDocAttribute: "lastname",
      },
      {
        id: "street",
        label: "Strasse",
        group: "Adresse",
        type: InputTypes.TEXT,
        bindToDocAttribute: "street",
      },
      {
        id: "house_number",
        label: "Hausnummer",
        group: "Adresse",
        type: InputTypes.TEXT,
        bindToDocAttribute: "house_number",
      },
      {
        id: "postal_code",
        label: "Postleitzahl",
        group: "Adresse",
        type: InputTypes.TEXT,
        bindToDocAttribute: "postal_code",
      },
      {
        id: "city",
        label: "Stadt",
        group: "Adresse",
        type: InputTypes.TEXT,
        bindToDocAttribute: "city",
      },
      {
        id: "email",
        label: "E-Mail",
        group: "Kontakt",
        type: InputTypes.MAIL,
        bindToDocAttribute: "email",
      },
      {
        id: "telephone_number",
        label: "Telefonnummer",
        group: "Kontakt",
        type: InputTypes.TEXT,
        bindToDocAttribute: "telephone_number",
      },
      {
        id: "subscribed_to_newsletter",
        label: "Newsletter",
        group: "Kontakt",
        type: InputTypes.CHECKBOX,
        bindToDocAttribute: "subscribed_to_newsletter",
      },
      {
        id: "registration_date",
        label: "Beitritt",
        group: "Mitgliedschaft",
        type: InputTypes.DATE,
        bindToDocAttribute: "registration_date",
      },
      {
        id: "renewed_on",
        label: "Verlängert am",
        group: "Mitgliedschaft",
        type: InputTypes.DATE,
        bindToDocAttribute: "renewed_on",
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
        bindToDocAttribute: "heard",
        isCreatable: true,
        isMulti: true,
        isClearable: true,
      },
      {
        id: "id",
        label: "Id",
        group: "Sonstiges",
        type: InputTypes.TEXT,
        disabled: true,
        bindToDocAttribute: "_id",
      },
      {
        id: "remark",
        label: "Bemerkung",
        group: "Sonstiges",
        type: InputTypes.TEXT,
        bindToDocAttribute: "remark",
      },
    ]);
</script>

<PopupFormular {popupFormularConfiguration} {createNew} {doc} />
