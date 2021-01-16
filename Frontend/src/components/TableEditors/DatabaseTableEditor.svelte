<script>
  import AddNewItemButton from "../Input/AddNewItemButton.svelte";
  import Table from "../Table/Table.svelte";
  import { keyValueStore, customerDb, rentalDb, itemDb } from "../../utils/stores";
  import { isToday, isBeforeToday } from "../../utils/utils";
  import { getContext } from "svelte";

  import CustomerPopupFormular from "./Customers/CustomerPopupFormular.svelte";
  import customerColumns from "./Customers/Columns.js";
  import customerFilters from "./Customers/Filters.js";

  import ItemPopupFormular from "./Items/ItemPopupFormular.svelte";
  import itemColumns from "./Items/Columns.js";
  import itemFilters from "./Items/Filters.js";

  import RentalPopupFormular from "./Rentals/RentalPopupFormular.svelte";
  import rentalColumns from "./Rentals/Columns.js";
  import rentalFilters from "./Rentals/Filters.js";

  export let tableEditorId;

  let table;

  const openStyledModal = getContext("openStyledModal");
  const openPopupFormular = (createNew) => {
    openStyledModal(TABLE_EDITOR_CONFIG[tableEditorId].popupFormularComponent, {
      createNew: createNew,
      onSave: table.refresh,
    });
  };

  const TABLE_EDITOR_CONFIG = [
    {
      columns: customerColumns,
      filters: customerFilters,
      database: $customerDb,
      popupFormularComponent: CustomerPopupFormular,
    },
    {
      columns: itemColumns,
      filters: itemFilters,
      database: $itemDb,
      popupFormularComponent: ItemPopupFormular,
    },
    {
      columns: rentalColumns,
      filters: rentalFilters,
      database: $rentalDb,
      popupFormularComponent: RentalPopupFormular,
    },
  ];

  const rowBackgroundColorFunction = (item) => {
    // Heute zurückgegeben
    if (item.returned_on && isToday(item.returned_on)) {
      return "rgb(214,252,208)";
    }
    // Heute zurückerwartet
    else if (item.to_return_on && isToday(item.to_return_on) && !item.returned_on) {
      return "rgb(160,200,250)";
    }
    // verspätet
    else if (
      item.to_return_on &&
      ((!item.returned_on && isBeforeToday(item.to_return_on)) ||
        (item.returned_on && isBeforeDay(item.to_return_on, item.returned_on)))
    ) {
      return "rgb(240,200,200)";
    }
  };
</script>

<Table
  bind:this={table}
  database={TABLE_EDITOR_CONFIG[tableEditorId].database}
  columns={TABLE_EDITOR_CONFIG[tableEditorId].columns}
  filters={TABLE_EDITOR_CONFIG[tableEditorId].filters}
  {rowBackgroundColorFunction}
  onRowClicked={(doc) => {
    keyValueStore.setValue("currentDoc", doc);
    openPopupFormular(false);
  }}
/>

<AddNewItemButton
  on:click={() => {
    keyValueStore.removeValue("currentDoc");
    openPopupFormular(true);
  }}
/>
