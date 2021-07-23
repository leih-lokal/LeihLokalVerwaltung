<script>
  import Database from "../../database/ENV_DATABASE";
  import { location } from "svelte-spa-router";
  import itemColumns from "../../data/item/columns";
  import customerColumns from "../../data/customer/columns";
  import rentalColumns from "../../data/rental/columns";

  const columnShouldBeExported = (column) =>
    !("export" in column && column.export === "exclude");

  const columns = {
    rental: rentalColumns.filter(columnShouldBeExported),
    item: itemColumns.filter(columnShouldBeExported),
    customer: customerColumns.filter(columnShouldBeExported),
  };

  const filenames = {
    rental: "Leihvorgaenge",
    item: "Gegenstaende",
    customer: "Nutzer",
  };

  // rental, item or customer
  $: itemType = $location.split("/")[1].slice(0, -1);
  const delimiter = ";";

  function fetchItems() {
    return Database.fetchAllDocsBySelector(
      Database.selectorBuilder().withDocType(itemType).build()
    );
  }

  function convertToCSV(items) {
    const validKeys = columns[itemType].map((col) => col.key);
    const colByKey = (key) => columns[itemType].find((col) => col.key === key);
    let csvString =
      columns[itemType].map((col) => col.title).join(delimiter) + "\r\n";
    items.forEach((item) => {
      let csvValues = [];
      for (const validKey of validKeys) {
        let value = item.hasOwnProperty(validKey) ? item[validKey] : "";

        // format value for display
        if (colByKey(validKey).display) {
          value = colByKey(validKey).display(value);
        }

        // remove csv delimiters and line breaks from data
        value = String(value).replaceAll(delimiter, "");
        value = String(value).replaceAll("\r", " ");
        value = String(value).replaceAll("\n", " ");
        value = String(value).replaceAll("  ", " ");

        csvValues.push(value);
      }
      csvString += csvValues.join(delimiter) + "\r\n";
    });

    return csvString;
  }

  export const exportCSVFile = async () => {
    const items = await fetchItems();

    var csv = convertToCSV(items);

    var exportedFilenmae = `${filenames[itemType]}.csv`;

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var link = document.createElement("a");
    if (link.download !== undefined) {
      // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", exportedFilenmae);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Die Export-Funktion wird von diesem Browser nicht untersützt :(");
    }
  };
</script>
