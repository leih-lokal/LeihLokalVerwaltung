<script>
  import Database from "../Database/ENV_DATABASE";
  import { location } from "svelte-spa-router";
  import itemColumns from "./Items/Columns";
  import customerColumns from "./Customers/Columns";
  import rentalColumns from "./Rentals/Columns";

  const columns = {
    rental: rentalColumns,
    item: itemColumns,
    customer: customerColumns,
  };

  const filenames = {
    rental: "Leihvorgaenge",
    item: "Gegenstaende",
    customer: "Kunden",
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
    let csvString = columns[itemType].map((col) => col.title).join(delimiter) + "\r\n";
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

  async function exportCSVFile() {
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
  }
</script>

<div on:click={exportCSVFile}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    x="0px"
    y="0px"
    viewBox="0 0 512 512"
    style="enable-background:new 0 0 512 512;"
    xml:space="preserve"
  >
    <g>
      <g>
        <path
          fill="currentColor"
          d="M400,304.005c-8.832,0-16,7.168-16,16v144H32v-352h144c8.832,0,16-7.168,16-16c0-8.832-7.168-16-16-16H16
        c-8.832,0-16,7.168-16,16v384c0,8.832,7.168,16,16,16h384c8.832,0,16-7.168,16-16v-160C416,311.173,408.832,304.005,400,304.005z"
        />
      </g>
    </g>
    <g>
      <g>
        <path
          fill="currentColor"
          d="M506.528,131.973l-128-112c-4.704-4.16-11.424-5.152-17.152-2.528C355.68,20.037,352,25.733,352,32.005v48h-9.472
        c-102.848,0-191.36,76.768-205.92,178.592l-8.448,59.168c-1.056,7.456,3.232,14.688,10.368,17.28
        c1.792,0.64,3.648,0.96,5.472,0.96c5.376,0,10.592-2.72,13.568-7.52l23.584-37.76c32.384-51.776,88.192-82.72,149.28-82.72H352v48
        c0,6.272,3.68,11.968,9.376,14.56c5.664,2.592,12.416,1.632,17.152-2.528l128-112c3.488-3.04,5.472-7.392,5.472-12.032
        S510.016,135.013,506.528,131.973z M384,220.741v-28.736c0-8.832-7.168-16-16-16h-37.568c-62.72,0-120.736,27.584-159.968,74.976
        c17.28-80.032,89.184-138.976,172.064-138.976H368c8.832,0,16-7.168,16-16V67.269l87.712,76.736L384,220.741z"
        />
      </g>
    </g>
  </svg>
</div>

<style>
  div {
    width: 35px;
    color: #ffffff;
    cursor: pointer;
    margin: auto;

    -moz-transition: all 1s ease;
    -webkit-transition: all 1s ease;
    -o-transition: all 1s ease;
    transition: all 1s ease;
  }
  div:hover {
    transition: 0.25s all;
    transform: scale(1.05);
  }
</style>
