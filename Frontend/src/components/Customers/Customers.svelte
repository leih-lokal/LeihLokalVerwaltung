<script>
  import { getContext, onMount } from "svelte";
  import Table from "../Table/Table.svelte";
  import EditCustomerPopup from "./EditCustomerPopup.svelte";
  import Database from "../../utils/database.js";
  import {
    showNotification,
    saveParseStringToBoolean,
    saveParseStringToTimeMillis,
    saveParseStringToInt,
  } from "../../utils/utils.js";

  const { open } = getContext("simple-modal");
  let rows = [];
  let columns = [
    {
      title: "Id",
      key: "_id",
      sort: (value) => saveParseStringToInt(value),
    },
    {
      title: "Nachname",
      key: "lastname",
    },
    {
      title: "Vorname",
      key: "firstname",
    },
    {
      title: "Strasse",
      key: "street",
    },
    {
      title: "Hausnummer",
      key: "house_number",
      sort: (value) => saveParseStringToInt(value),
    },
    {
      title: "Postleitzahl",
      key: "postal_code",
    },
    {
      title: "Stadt",
      key: "city",
    },
    {
      title: "Beitritt",
      key: "registration_date",
      sort: (value) => saveParseStringToTimeMillis(value),
    },
    {
      title: "Verlängert am",
      key: "renewed_on",
      sort: (value) => saveParseStringToTimeMillis(value),
    },
    {
      title: "Bemerkung",
      key: "remark",
    },
    {
      title: "E-Mail",
      key: "email",
    },
    {
      title: "Telefonnummer",
      key: "telephone_number",
    },
    {
      title: "Newsletter",
      key: "subscribed_to_newsletter",
      map: (value) => (saveParseStringToBoolean(value) ? "Ja" : "Nein"),
    },
    {
      title: "Aufmerksam geworden",
      key: "heard",
    },
  ];

  function updateRow(updatedRow) {
    let currentRowIndex = rows.findIndex((row) => row._id === updatedRow._id);
    if (currentRowIndex !== -1) {
      // customer modified
      rows[currentRowIndex] = { ...updatedRow };
    } else {
      // new customer created
      rows.push(updatedRow);
    }
  }

  function removeRow(idToRemove) {
    rows = rows.filter((row) => row._id !== idToRemove);
  }

  Database.fetchAllCustomers()
    .then((customers) => (rows = customers))
    .then(() =>
      Database.onCustomerChange((change) => {
        if (change.deleted) {
          removeRow(change.id);
        } else {
          updateRow(change.doc);
        }
      })
    )
    .catch((error) => {
      console.error(error);
      showNotification("Laden aus der Datenbank fehlgeschlagen!", "danger");
    });

  function onRowClicked(customer) {
    open(EditCustomerPopup, { customer });
  }
</script>

<Table {rows} {columns} {onRowClicked} />
