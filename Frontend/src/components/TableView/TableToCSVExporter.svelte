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
    customer: "Nutzer_innen",
  };

  // rental, item or customer
  $: itemType = $location.split("/")[1].slice(0, -1);
  const delimiter = ";";

  function convertToCSV(items) {
    const exportableColumns = columns[itemType].filter(
      (col) => !col.hasOwnProperty("noExport") || !col.noExport,
    );

    let csvString =
      exportableColumns.map((col) => col.title).join(delimiter) + "\r\n";
    items
      .filter((item) => item.type === itemType)
      .forEach((item) => {
        let csvValues = [];
        for (const column of exportableColumns) {
          let key = column.key;
          let value = item.hasOwnProperty(key) ? item[key] : "";

          // calculate and format value for display
          if (column.displayExport) {
            value = column.displayExport(items, item.id);
          } else if (column.display) {
            value = column.display(value); // TODO: display might be an async function -> await
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
    const allItems = await Database.fetchAll();

    var csv = convertToCSV(allItems);

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
