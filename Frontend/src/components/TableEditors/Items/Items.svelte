<script>
  import DatabaseTableEditor from "../DatabaseTableEditor.svelte";
  import EditItemPopup from "./EditItemPopup.svelte";
  import columns from "./Columns.js";
  import filters from "./Filters.js";
  import { itemDb } from "../../../utils/stores";
  import { notifier } from "@beyonk/svelte-notifications";
  import WoocommerceClient from "../../Database/WoocommerceClient";

  const woocommerceClient = new WoocommerceClient();

  const processRowAfterLoad = (item) =>
    woocommerceClient
      .fetchItem(item.wc_id)
      .then((result) => {
        item.status_on_website = result["stock_status"];
        item.deposit = parseInt(String(result["attributes"][0]["options"][0]).replace("€", ""));
        if (result["images"].length > 0) item.image = result["images"][0]["src"];
        item.wc_url = result["permalink"];
        item.category = result["categories"][0]["name"];
        return item;
      })
      .catch((error) => {
        notifier.warning(
          `Der Status von ${item.item_name} konnte nicht von der Webseite abgefragt werden!`,
          6000
        );
        console.log(error);
      });
</script>

<DatabaseTableEditor
  {columns}
  {filters}
  {processRowAfterLoad}
  database={$itemDb}
  popupComponent={EditItemPopup}
  addNewItemButton={false} />
