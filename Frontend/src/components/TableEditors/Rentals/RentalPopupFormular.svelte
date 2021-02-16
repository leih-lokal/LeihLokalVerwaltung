<script>
  import PopupFormularConfiguration from "../../Input/PopupFormularConfiguration";
  import InputTypes from "../../Input/InputTypes";
  import PopupFormular from "../../Input/PopupFormular.svelte";
  import { keyValueStore } from "../../../utils/stores";
  import { millisAtStartOfToday, millisAtStartOfDay } from "../../../utils/utils";
  import Database from "../../Database/ENV_DATABASE";
  import { notifier } from "@beyonk/svelte-notifications";
  import { getContext } from "svelte";
  import WoocommerceClient from "ENV_WC_CLIENT";

  const { close } = getContext("simple-modal");
  const woocommerceClient = new WoocommerceClient();

  export let createNew;
  export let onSave;

  if (createNew) {
    keyValueStore.setValue("currentDoc", {
      rented_on: millisAtStartOfToday(),
      to_return_on: millisAtStartOfDay(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      returned_on: 0,
      extended_on: 0,
      type: "rental",
      image: "",
      item_id: "",
      item_name: "",
      customer_id: "",
      customer_name: "",
      passing_out_employee: "",
      receiving_employee: "",
      deposit: 0,
      deposit_returned: 0,
      remark: "",
    });
  }
  keyValueStore.setValue("options", {
    updateStatusOnWebsite: true,
  });

  const customerIdStartsWithSelector = (searchValue) =>
    Database.selectorBuilder()
      .withField("id")
      .numericFieldStartsWith(searchValue)
      .withDocType("customer")
      .build();

  const itemIdStartsWithAndNotDeletedSelector = (searchValue) =>
    Database.selectorBuilder()
      .withField("id")
      .numericFieldStartsWith(searchValue)
      .withDocType("item")
      .withField("status")
      .isNotEqualTo("deleted")
      .build();

  const customerAttributeStartsWithIgnoreCaseSelector = (field, searchValue) =>
    Database.selectorBuilder()
      .withField(field)
      .startsWithIgnoreCase(searchValue)
      .withDocType("customer")
      .build();

  const itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector = (field, searchValue) =>
    Database.selectorBuilder()
      .withField(field)
      .startsWithIgnoreCase(searchValue)
      .withField("status")
      .isNotEqualTo("deleted")
      .withDocType("item")
      .build();

  const popupFormularConfiguration = new PopupFormularConfiguration()
    .setTitle(`Leihvorgang ${createNew ? "anlegen" : "bearbeiten"}`)
    .setDisplayDeleteButton(!createNew)
    .setInputGroups(["Gegenstand", "Zeitraum", "Kunde", "Pfand", "Mitarbeiter"])
    .setInputs([
      {
        id: "item_id",
        label: "Nr",
        group: "Gegenstand",
        type: InputTypes.AUTOCOMPLETE,
        inputType: "number",
        bindTo: { keyValueStoreKey: "currentDoc", attr: "item_id" },
        onChange: (selectedItem) => {
          keyValueStore.setValue("currentDoc", {
            ...$keyValueStore["currentDoc"],
            item_id: selectedItem.id,
            item_name: selectedItem.name,
            deposit: selectedItem.deposit,
          });
        },
        searchFunction: (searchTerm) =>
          Database.fetchDocsBySelector(itemIdStartsWithAndNotDeletedSelector(searchTerm), [
            "id",
            "name",
            "deposit",
          ]),
        suggestionFormat: (id, item_name) => `${String(id).padStart(4, "0")}: ${item_name}`,
        noResultsText: "Kein Gegenstand mit dieser Id",
      },
      {
        id: "item_name",
        label: "Name",
        group: "Gegenstand",
        type: InputTypes.AUTOCOMPLETE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "item_name" },
        onChange: (selectedItem) => {
          keyValueStore.setValue("currentDoc", {
            ...$keyValueStore["currentDoc"],
            item_id: selectedItem.id,
            item_name: selectedItem.name,
            deposit: selectedItem.deposit,
          });
        },
        searchFunction: (searchTerm) =>
          Database.fetchDocsBySelector(
            itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector("name", searchTerm),
            ["id", "name", "deposit"]
          ),
        suggestionFormat: (id, item_name) => `${String(id).padStart(4, "0")}: ${item_name}`,
        noResultsText: "Kein Gegenstand mit diesem Name",
      },
      {
        id: "update_status",
        label: "Status auf Webseite aktualisieren",
        group: "Gegenstand",
        bindTo: {
          keyValueStoreKey: "options",
          attr: "updateStatusOnWebsite",
        },
        type: InputTypes.CHECKBOX,
      },

      {
        id: "rented_on",
        label: "Erfasst am",
        group: "Zeitraum",
        type: InputTypes.DATE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "rented_on" },
      },
      {
        id: "extended_on",
        label: "Verlängert",
        group: "Zeitraum",
        hidden: createNew,
        quickset: { 0: "Heute" },
        type: InputTypes.DATE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "extended_on" },
      },
      {
        id: "to_return_on",
        label: "Zurückerwartet",
        group: "Zeitraum",
        quickset: { 7: "1 Woche", 14: "2 Wochen", 21: "3 Wochen" },
        type: InputTypes.DATE,
        bindTo: {
          keyValueStoreKey: "currentDoc",
          attr: "to_return_on",
        },
      },
      {
        id: "returned_on",
        label: "Zurückgegeben",
        group: "Zeitraum",
        hidden: createNew,
        quickset: { 0: "Heute" },
        type: InputTypes.DATE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "returned_on" },
      },

      {
        id: "customer_id",
        label: "Nr",
        group: "Kunde",
        inputType: "number",
        type: InputTypes.AUTOCOMPLETE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "customer_id" },
        onChange: (selectedCustomer) => {
          keyValueStore.setValue("currentDoc", {
            ...$keyValueStore["currentDoc"],
            name: selectedCustomer.lastname,
            customer_id: selectedCustomer.id,
          });
        },
        searchFunction: (searchTerm) =>
          Database.fetchDocsBySelector(customerIdStartsWithSelector(searchTerm), [
            "id",
            "firstname",
            "lastname",
          ]),
        suggestionFormat: (id, firstname, lastname) => `${id}: ${firstname} ${lastname}`,
        noResultsText: "Kein Kunde mit dieser Id",
      },
      {
        id: "customer_name",
        label: "Nachname",
        group: "Kunde",
        type: InputTypes.AUTOCOMPLETE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "name" },
        onChange: (selectedCustomer) => {
          keyValueStore.setValue("currentDoc", {
            ...$keyValueStore["currentDoc"],
            name: selectedCustomer.lastname,
            customer_id: selectedCustomer.id,
          });
        },
        searchFunction: (searchTerm) =>
          Database.fetchDocsBySelector(
            customerAttributeStartsWithIgnoreCaseSelector("lastname", searchTerm),
            ["id", "firstname", "lastname"]
          ),
        suggestionFormat: (id, firstname, lastname) => `${id}: ${firstname} ${lastname}`,
        noResultsText: "Kein Kunde mit diesem Name",
      },

      {
        id: "deposit",
        label: "Pfand",
        group: "Pfand",
        inputType: "number",
        type: InputTypes.TEXT,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "deposit" },
      },
      {
        id: "deposit_returned",
        label: "Pfand zurück",
        group: "Pfand",
        hidden: createNew,
        inputType: "number",
        type: InputTypes.TEXT,
        bindTo: {
          keyValueStoreKey: "currentDoc",
          attr: "deposit_returned",
        },
      },

      {
        id: "passing_out_employee",
        label: "Ausgabe",
        group: "Mitarbeiter",
        type: InputTypes.TEXT,
        bindTo: {
          keyValueStoreKey: "currentDoc",
          attr: "passing_out_employee",
        },
      },
      {
        id: "receiving_employee",
        label: "Rücknahme",
        group: "Mitarbeiter",
        hidden: createNew,
        type: InputTypes.TEXT,
        bindTo: {
          keyValueStoreKey: "currentDoc",
          attr: "receiving_employee",
        },
      },
      {
        id: "remark",
        label: "Bemerkung",
        group: "Mitarbeiter",
        hidden: createNew,
        type: InputTypes.TEXT,
        bindTo: {
          keyValueStoreKey: "currentDoc",
          attr: "remark",
        },
      },
    ]);
</script>

<PopupFormular
  {popupFormularConfiguration}
  on:save={async (event) => {
    const doc = $keyValueStore["currentDoc"];
    if (doc.item_id) {
      const item = await Database.fetchItemById(doc.item_id);
      doc.image = item.image;

      if ($keyValueStore["options"]["updateStatusOnWebsite"]) {
        if (doc.returned_on && doc.returned_on !== 0 && doc.returned_on <= new Date().getTime()) {
          item.status = "instock";
          Database.updateDoc(item);
          woocommerceClient
            .updateItem(item)
            .then(() => {
              notifier.success(`'${item.name}' wurde auf der Webseite als verfügbar markiert.`);
            })
            .catch((error) => {
              notifier.warning(
                `Status von '${item.name}' konnte auf der der Webseite nicht aktualisiert werden!`,
                6000
              );
              console.error(error);
            });
        } else if (createNew) {
          item.status = "outofstock";
          Database.updateDoc(item);
          woocommerceClient
            .updateItem(item)
            .then(() => {
              notifier.success(`'${item.name}' wurde auf der Webseite als verliehen markiert.`);
            })
            .catch((error) => {
              notifier.warning(
                `Status von '${item.name}' konnte auf der der Webseite nicht aktualisiert werden!`,
                6000
              );
              console.error(error);
            });
        }
      }
    }

    (createNew ? Database.createDoc(doc) : Database.updateDoc(doc))
      .then((result) => notifier.success("Leihvorgang gespeichert!"))
      .then(close)
      .then(onSave)
      .catch((error) => {
        notifier.danger("Leihvorgang konnte nicht gespeichert werden!", 6000);
        console.error(error);
      });
  }}
  on:delete={(event) => {
    if (confirm("Soll dieser Leihvorgang wirklich gelöscht werden?")) {
      Database.removeDoc($keyValueStore["currentDoc"])
        .then(() => notifier.success("Leihvorgang gelöscht!"))
        .then(close)
        .then(onSave)
        .catch((error) => {
          console.error(error);
          notifier.danger("Leihvorgang konnte nicht gelöscht werden!", 6000);
        });
    }
  }}
  on:cancel={close}
/>
