<script>
  import { getContext, onDestroy } from "svelte";
  import { saveParseTimestampToString, saveParseStringToTimeMillis } from "../../utils/utils.js";
  import { notifier } from "@beyonk/svelte-notifications";
  import Checkbox from "svelte-checkbox";
  import Select from "svelte-select";

  const { close } = getContext("simple-modal");

  const heard_options = ["Internet", "Freunde & Bekannte", "Zeitungen / Medien"];

  function convertInputsForDb() {
    row.registration_date = saveParseStringToTimeMillis(registration_date_string);
    row.renewed_on = saveParseStringToTimeMillis(renewed_on_string);
    row.heard = heard ? heard.map((item) => item.value).join(", ") : "";
  }

  function saveInDatabase() {
    convertInputsForDb();
    database
      .updateDoc(row)
      .then((result) => notifier.success("Kunde gespeichert!"))
      .then(close)
      .catch((error) => {
        notifier.danger("Kunde konnte nicht gespeichert werden!", 6000);
        console.error(error);
        close();
      });
  }

  onDestroy(convertInputsForDb);

  export let row;
  export let database;

  let registration_date_string = saveParseTimestampToString(row.registration_date);
  let renewed_on_string = saveParseTimestampToString(row.renewed_on);
  let heard = !row.heard || row.heard === "" ? [] : row.heard.split(",");
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
  <h1>Kunde bearbeiten</h1>
  <div class="content">
    <div class="row">
      <div class="col-label"><label for="id">Id</label></div>
      <div class="col-input"><input type="text" id="id" name="id" value={row._id} disabled /></div>
    </div>
    <div class="row">
      <div class="col-label"><label for="firstname">Vorname</label></div>
      <div class="col-input">
        <input type="text" id="firstname" name="firstname" bind:value={row.firstname} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="lastname">Nachname</label></div>
      <div class="col-input">
        <input type="text" id="lastname" name="lastname" bind:value={row.lastname} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="street">Strasse</label></div>
      <div class="col-input">
        <input type="text" id="street" name="street" bind:value={row.street} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="house_number">Hausnummer</label></div>
      <div class="col-input">
        <input type="text" id="house_number" name="house_number" bind:value={row.house_number} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="postal_code">Postleitzahl</label></div>
      <div class="col-input">
        <input type="text" id="postal_code" name="postal_code" bind:value={row.postal_code} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="city">Stadt</label></div>
      <div class="col-input"><input type="text" id="city" name="city" bind:value={row.city} /></div>
    </div>
    <div class="row">
      <div class="col-label"><label for="registration_date">Beitritt</label></div>
      <div class="col-input">
        <input
          type="text"
          id="registration_date"
          name="registration_date"
          bind:value={registration_date_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="renewed_on">Verlängert am</label></div>
      <div class="col-input">
        <input type="text" id="renewed_on" name="renewed_on" bind:value={renewed_on_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="remark">Bemerkung</label></div>
      <div class="col-input">
        <input type="text" id="remark" name="remark" bind:value={row.remark} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="email">E-Mail</label></div>
      <div class="col-input">
        <input type="text" id="email" name="email" bind:value={row.email} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="telephone_number">Telefonnummer</label></div>
      <div class="col-input">
        <input
          type="text"
          id="telephone_number"
          name="telephone_number"
          bind:value={row.telephone_number} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="subscribed_to_newsletter">Newsletter</label></div>
      <div class="col-input">
        <Checkbox
          id="subscribed_to_newsletter"
          name="subscribed_to_newsletter"
          size="2rem"
          bind:checked={row.subscribed_to_newsletter} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="heard">Aufmerksam geworden</label></div>
      <div class="col-input">
        <Select
          items={heard_options}
          bind:selectedValue={heard}
          isMulti={true}
          isCreatable={true}
          placeholder={'Auswählen...'} />
      </div>
    </div>
  </div>
  <div class="footer">
    <button class="button-save" on:click={saveInDatabase}> Speichern </button>
    <button class="button-cancel" on:click={close}>Abbrechen</button>
  </div>
</div>
