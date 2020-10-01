<script>
  import { getContext, onDestroy } from "svelte";
  import { RentalDatabase } from "../../database/Database.js";
  import { saveParseTimestampToString, saveParseStringToTimeMillis } from "../../utils/utils.js";
  import { notifier } from "@beyonk/svelte-notifications";

  const { close } = getContext("simple-modal");

  function convertInputsForDb() {
    row.rented_on = saveParseStringToTimeMillis(rented_on_string);
    row.extended_on = saveParseStringToTimeMillis(extended_on_string);
    row.to_return_on = saveParseStringToTimeMillis(to_return_on_string);
    row.returned_on = saveParseStringToTimeMillis(returned_on_string);
  }

  function saveInDatabase() {
    convertInputsForDb();
    RentalDatabase.updateDoc(row)
      .then((result) => notifier.success("Leihvorgang gespeichert!"))
      .then(close)
      .catch((error) => {
        notifier.danger("Leihvorgang konnte nicht gespeichert werden!", 6000);
        console.error(error);
        close();
      });
  }

  onDestroy(convertInputsForDb);

  export let row;

  let rented_on_string = saveParseTimestampToString(row.rented_on);
  let extended_on_string = saveParseTimestampToString(row.extended_on);
  let to_return_on_string = saveParseTimestampToString(row.to_return_on);
  let returned_on_string = saveParseTimestampToString(row.returned_on);
</script>

<style>
  input[type="text"] {
    width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
  }

  label {
    padding: 12px 12px 12px 0;
    display: inline-block;
  }

  .col-label {
    float: left;
    width: 35%;
  }

  .col-input {
    float: left;
    width: 65%;
  }

  .content {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    align-items: center;
    flex: 1;
    min-height: 2em;
    padding-top: 20px;
    padding-bottom: 20px;
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  h1,
  .footer {
    height: 30px;
    padding: 20px;
    margin: 0;
  }

  .row {
    width: 400px;
    margin: 0 1rem;
  }

  .button-save {
    float: right;
    padding: 10px;
  }

  .button-cancel {
    float: left;
  }
</style>

<div class="container">
  <h1>Leihvorgang bearbeiten</h1>
  <div class="content">
    <div class="row">
      <div class="col-label"><label for="item_id">Gegenstand Nr</label></div>
      <div class="col-input">
        <input type="text" id="item_id" name="item_id" bind:value={row.item_id} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="item_name">Gegenstand Name</label></div>
      <div class="col-input">
        <input type="text" id="item_name" name="item_name" bind:value={row.item_name} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="customer_id">Kunde Nr</label></div>
      <div class="col-input">
        <input type="text" id="customer_id" name="customer_id" bind:value={row.customer_id} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="customer_name">Kunde Name</label></div>
      <div class="col-input">
        <input type="text" id="customer_name" name="customer_name" bind:value={row.customer_name} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="rented_on">Ausgeliehen am</label></div>
      <div class="col-input">
        <input type="text" id="rented_on" name="rented_on" bind:value={rented_on_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="extended_on">Verlängert am</label></div>
      <div class="col-input">
        <input type="text" id="extended_on" name="extended_on" bind:value={extended_on_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="to_return_on">Zurückzugeben am</label></div>
      <div class="col-input">
        <input type="text" id="to_return_on" name="to_return_on" bind:value={to_return_on_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="returned_on">Zurückgegeben am</label></div>
      <div class="col-input">
        <input type="text" id="returned_on" name="returned_on" bind:value={returned_on_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit">Pfand</label></div>
      <div class="col-input">
        <input type="text" id="deposit" name="deposit" bind:value={row.deposit} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit_returned">Pfand zurück</label></div>
      <div class="col-input">
        <input
          type="text"
          id="deposit_returned"
          name="deposit_returned"
          bind:value={row.deposit_returned} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit_retained">Pfand einbehalten</label></div>
      <div class="col-input">
        <input
          type="text"
          id="deposit_retained"
          name="deposit_retained"
          bind:value={row.deposit_retained} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit_retainment_reason">Grund</label></div>
      <div class="col-input">
        <input
          type="text"
          id="deposit_retainment_reason"
          name="deposit_retainment_reason"
          bind:value={row.deposit_retainment_reason} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="passing_out_employee">Mitarbeiter Ausgabe</label></div>
      <div class="col-input">
        <input
          type="text"
          id="passing_out_employee"
          name="passing_out_employee"
          bind:value={row.passing_out_employee} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="receiving_employee">Mitarbeiter Rücknahme</label></div>
      <div class="col-input">
        <input
          type="text"
          id="receiving_employee"
          name="receiving_employee"
          bind:value={row.receiving_employee} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="remark">Bemerkung</label></div>
      <div class="col-input">
        <input type="text" id="remark" name="remark" bind:value={row.remark} />
      </div>
    </div>
  </div>
  <div class="footer">
    <button class="button-save" on:click={saveInDatabase}> Speichern </button>
    <button class="button-cancel" on:click={close}>Abbrechen</button>
  </div>
</div>
