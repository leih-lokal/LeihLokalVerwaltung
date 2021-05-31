<script>
  import PopupFormularConfiguration from "../../Input/PopupFormularConfiguration";
  import InputTypes from "../../Input/InputTypes";
  import PopupFormular from "../../Input/PopupFormular/PopupFormular.svelte";
  import { keyValueStore } from "../../../utils/stores";
  import {
    millisAtStartOfToday,
    millisAtStartOfDay,
  } from "../../../utils/utils";
  import Database from "../../Database/ENV_DATABASE";
  import { notifier } from "@beyonk/svelte-notifications";
  import { getContext, onMount } from "svelte";
  import columns from "../../../config/rental/columns";
  import WoocommerceClient from "ENV_WC_CLIENT";
  import {
    customerIdStartsWithSelector,
    itemIdStartsWithAndNotDeletedSelector,
    customerAttributeStartsWithIgnoreCaseSelector,
    itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector,
    activeRentalsForCustomerSelector,
  } from "../../../config/rental/selectors";

  const { close } = getContext("simple-modal");
  const woocommerceClient = new WoocommerceClient();

  export let createNew;
  export let onSave;

  if (createNew) {
    keyValueStore.setValue("currentDoc", {
      rented_on: millisAtStartOfToday(),
      to_return_on: millisAtStartOfDay(
        new Date().getTime() + 7 * 24 * 60 * 60 * 1000
      ),
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
      deposit: "",
      deposit_returned: "",
      remark: "",
    });
  }

  onMount(() => {
    if ($keyValueStore["currentDoc"].item_id) {
      Database.fetchItemById($keyValueStore["currentDoc"].item_id).then(
        hideToggleStatusOnWebsiteIfExistsMoreThanOnce
      );
    }
  });

  keyValueStore.setValue("options", {
    updateStatusOnWebsite: true,
    disableToggleStatusOnWebsite: false,
  });

  const hideToggleStatusOnWebsiteIfExistsMoreThanOnce = (selectedItem) => {
    if (selectedItem.exists_more_than_once) {
      keyValueStore.setValue("options", {
        ...$keyValueStore["options"],
        disableToggleStatusOnWebsite: true,
      });
    } else {
      keyValueStore.setValue("options", {
        ...$keyValueStore["options"],
        disableToggleStatusOnWebsite: false,
      });
    }
  };

  const setItem = (selectedItem) => {
    hideToggleStatusOnWebsiteIfExistsMoreThanOnce(selectedItem);
    keyValueStore.setValue("currentDoc", {
      ...$keyValueStore["currentDoc"],
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      deposit: selectedItem.deposit,
    });
  };

  const setCustomer = async (customer) => {
    keyValueStore.setValue("currentDoc", {
      ...$keyValueStore["currentDoc"],
      customer_name: customer.lastname,
      customer_id: customer.id,
    });

    const activeRentals = await Database.fetchAllDocsBySelector(
      activeRentalsForCustomerSelector(customer.id),
      ["item_name"]
    ).then((results) => results.map((doc) => doc["item_name"]));

    if (activeRentals.length > 0 && activeRentals.length < 3) {
      notifier.warning(
        `Kunde hat schon diese Gegenstände ausgeliehen: ${activeRentals.join(
          ", "
        )}`,
        6000
      );
    } else if (activeRentals.length >= 3) {
      notifier.danger(
        `Kunde hat schon mehr als 2 Gegenstände ausgeliehen: ${activeRentals.join(
          ", "
        )}`,
        6000
      );
    }
  };

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
        onChange: setItem,
        searchFunction: (searchTerm) =>
          Database.fetchDocsBySelector(
            itemIdStartsWithAndNotDeletedSelector(searchTerm),
            ["id", "name", "deposit", "exists_more_than_once"]
          ),
        suggestionFormat: (id, item_name) =>
          `${String(id).padStart(4, "0")}: ${item_name}`,
        noResultsText: "Kein Gegenstand mit dieser Id",
      },
      {
        id: "item_name",
        label: "Name",
        group: "Gegenstand",
        type: InputTypes.AUTOCOMPLETE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "item_name" },
        onChange: setItem,
        searchFunction: (searchTerm) =>
          Database.fetchDocsBySelector(
            itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector(
              "name",
              searchTerm
            ),
            ["id", "name", "deposit", "exists_more_than_once"]
          ),
        suggestionFormat: (id, item_name) =>
          `${String(id).padStart(4, "0")}: ${item_name}`,
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
        hidden: () => $keyValueStore["options"]["disableToggleStatusOnWebsite"],
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
        hidden: () => createNew,
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
        hidden: () => createNew,
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
        onChange: setCustomer,
        searchFunction: (searchTerm) =>
          Database.fetchDocsBySelector(
            customerIdStartsWithSelector(searchTerm),
            ["id", "firstname", "lastname"]
          ),
        suggestionFormat: (id, firstname, lastname) =>
          `${id}: ${firstname} ${lastname}`,
        noResultsText: "Kein Kunde mit dieser Id",
      },
      {
        id: "customer_name",
        label: "Nachname",
        group: "Kunde",
        type: InputTypes.AUTOCOMPLETE,
        bindTo: { keyValueStoreKey: "currentDoc", attr: "customer_name" },
        onChange: setCustomer,
        searchFunction: (searchTerm) =>
          Database.fetchDocsBySelector(
            customerAttributeStartsWithIgnoreCaseSelector(
              "lastname",
              searchTerm
            ),
            ["id", "firstname", "lastname"]
          ),
        suggestionFormat: (id, firstname, lastname) =>
          `${id}: ${firstname} ${lastname}`,
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
        hidden: () => createNew,
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
        hidden: () => createNew,
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
    close();
    const doc = $keyValueStore["currentDoc"];
    Object.keys(doc).forEach((key) => {
      const colForKey = columns.find((col) => col.key === key);
      if (colForKey && colForKey.numeric && doc[key] === "") {
        doc[key] = 0; // default value for numbers
      }
    });

    if (doc.item_id) {
      let itemIsUpdatable = true;
      const item = await Database.fetchItemById(doc.item_id).catch((error) => {
        notifier.warning(
          `Gegenstand '${doc.item_id}' konnte nicht geladen werden!`,
          6000
        );
        console.error(error);
        itemIsUpdatable = false;
      });
      doc.image = item.image;

      if (itemIsUpdatable && !item.exists_more_than_once) {
        if ($keyValueStore["options"]["updateStatusOnWebsite"]) {
          if (
            doc.returned_on &&
            doc.returned_on !== 0 &&
            doc.returned_on <= new Date().getTime()
          ) {
            item.status = "instock";
            await Database.updateDoc(item)
              .then(() => woocommerceClient.updateItem(item))
              .then(() => {
                notifier.success(
                  `'${item.name}' wurde auf als verfügbar markiert.`
                );
              })
              .catch((error) => {
                notifier.warning(
                  `Status von '${item.name}' konnte nicht aktualisiert werden!`,
                  6000
                );
                console.error(error);
              });
          } else if (createNew) {
            item.status = "outofstock";
            await Database.updateDoc(item)
              .then(() => woocommerceClient.updateItem(item))
              .then(() => {
                notifier.success(
                  `'${item.name}' wurde als verliehen markiert.`
                );
              })
              .catch((error) => {
                notifier.warning(
                  `Status von '${item.name}' konnte nicht aktualisiert werden!`,
                  6000
                );
                console.error(error);
              });
          }
        }
      }
    }

    await (createNew ? Database.createDoc(doc) : Database.updateDoc(doc))
      .then((result) => notifier.success("Leihvorgang gespeichert!"))
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
