<script>
  import { getContext, onDestroy } from "svelte";
  import { saveParseTimestampToString, saveParseStringToTimeMillis } from "../../utils/utils.js";
  import { notifier } from "@beyonk/svelte-notifications";
  import Select from "svelte-select";

  const { close } = getContext("simple-modal");

  const status_on_website_options = [
    { value: "deleted", label: "gelöscht" },
    { value: "instock", label: "verfügbar" },
    { value: "outofstock", label: "nicht verfügbar" },
  ];
  const status_on_website_option_labels = status_on_website_options.map((option) => option.label);

  function convertInputsForDb() {
    row.added = saveParseStringToTimeMillis(added_string);
    const selectedOption = status_on_website_options.find(
      (option) => option.label === status_on_website_label.label
    );
    row.status_on_website = selectedOption ? selectedOption.value : "";
  }

  function saveInDatabase() {
    convertInputsForDb();
    database
      .updateDoc(row)
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
  export let database;

  let added_string = saveParseTimestampToString(row.added);
  let status_on_website = status_on_website_options.find(
    (option) => option.value === row.status_on_website
  );
  let status_on_website_label = status_on_website ? status_on_website.label : "";
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
  <h1>Gegenstand bearbeiten</h1>
  <div class="content">
    <div class="row">
      <div class="col-label"><label for="item_id">Gegenstand Nr</label></div>
      <div class="col-input">
        <input type="text" id="item_id" name="item_id" value={row._id} disabled />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="item_name">Gegenstand Name</label></div>
      <div class="col-input">
        <input type="text" id="item_name" name="item_name" bind:value={row.item_name} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="brand">Marke</label></div>
      <div class="col-input">
        <input type="text" id="brand" name="brand" bind:value={row.brand} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="itype">Typbezeichnung</label></div>
      <div class="col-input">
        <input type="text" id="itype" name="itype" bind:value={row.itype} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="category">Kategorie</label></div>
      <div class="col-input">
        <input type="text" id="category" name="category" bind:value={row.category} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit">Pfand</label></div>
      <div class="col-input">
        <input type="text" id="deposit" name="deposit" bind:value={row.deposit} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="parts">Anzahl Teile</label></div>
      <div class="col-input">
        <input type="text" id="parts" name="parts" bind:value={row.parts} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="manual">Anleitung</label></div>
      <div class="col-input">
        <input type="text" id="manual" name="manual" bind:value={row.manual} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="package">Verpackung</label></div>
      <div class="col-input">
        <input type="text" id="package" name="package" bind:value={row.package} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="added">Erfasst am</label></div>
      <div class="col-input">
        <input type="text" id="added" name="added" bind:value={added_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="properties">Eigenschaften</label></div>
      <div class="col-input">
        <input type="text" id="properties" name="properties" bind:value={row.properties} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="status_on_website">Status auf Webseite</label></div>
      <div class="col-input">
        <Select
          items={status_on_website_option_labels}
          bind:selectedValue={status_on_website_label}
          placeholder={'Auswählen...'} />
      </div>
    </div>
  </div>
  <div class="footer">
    <button class="button-save" on:click={saveInDatabase}>Speichern</button>
    <button class="button-cancel" on:click={close}>Abbrechen</button>
  </div>
</div>
