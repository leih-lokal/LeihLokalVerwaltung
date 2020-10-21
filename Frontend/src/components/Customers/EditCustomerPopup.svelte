<script>
  import { getContext, onDestroy } from "svelte";
  import { saveParseTimestampToString, saveParseStringToTimeMillis } from "../../utils/utils.js";
  import { notifier } from "@beyonk/svelte-notifications";
  import Checkbox from "svelte-checkbox";
  import Select from "svelte-select";
  import DateInput from "../DateInput.svelte";
  import { customerDb } from "../../database/stores";

  const { close } = getContext("simple-modal");

  const heard_options = ["Internet", "Freunde & Bekannte", "Zeitung / Medien"];

  function convertInputsForDb() {
    doc.registration_date = saveParseStringToTimeMillis(registration_date_string);
    doc.renewed_on = saveParseStringToTimeMillis(renewed_on_string);
    doc.heard = heard ? heard.map((item) => item.value).join(", ") : "";
  }

  function saveInDatabase() {
    convertInputsForDb();

    const savePromise = createNew ? $customerDb.createDoc(doc) : $customerDb.updateDoc(doc);

    savePromise
      .then((result) => notifier.success("Kunde gespeichert!"))
      .then(close)
      .catch((error) => {
        notifier.danger("Kunde konnte nicht gespeichert werden!", 6000);
        console.error(error);
        close();
      });
  }

  onDestroy(convertInputsForDb);

  export let doc = {};
  export let createNew = false;

  if (createNew) {
    $customerDb.newId().then((id) => (doc._id = id));
    doc.registration_date = new Date().getTime();
  }

  let registration_date_string = saveParseTimestampToString(doc.registration_date);
  let renewed_on_string = saveParseTimestampToString(doc.renewed_on);
  let heard = !doc.heard || doc.heard === "" ? [] : doc.heard.split(",");
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
    height: 40px;
    padding: 20px;
    margin: 0;
  }

  .footer {
    display: flex;
    justify-content: space-between;
  }

  .row {
    width: 400px;
    margin: 0 1rem;
  }

  .button-delete {
    color: darkred;
  }
</style>

<div class="container">
  <h1>{createNew ? 'Kunde anlegen' : 'Kunde bearbeiten'}</h1>
  <div class="content">
    <div class="row">
      <div class="col-label"><label for="id">Id</label></div>
      <div class="col-input">
        {#if createNew}
          <input type="text" id="id" name="id" bind:value={doc._id} />
        {:else}<input type="text" id="id" name="id" value={doc._id} disabled />{/if}
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="firstname">Vorname</label></div>
      <div class="col-input">
        <input type="text" id="firstname" name="firstname" bind:value={doc.firstname} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="lastname">Nachname</label></div>
      <div class="col-input">
        <input type="text" id="lastname" name="lastname" bind:value={doc.lastname} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="street">Strasse</label></div>
      <div class="col-input">
        <input type="text" id="street" name="street" bind:value={doc.street} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="house_number">Hausnummer</label></div>
      <div class="col-input">
        <input type="text" id="house_number" name="house_number" bind:value={doc.house_number} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="postal_code">Postleitzahl</label></div>
      <div class="col-input">
        <input type="text" id="postal_code" name="postal_code" bind:value={doc.postal_code} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="city">Stadt</label></div>
      <div class="col-input"><input type="text" id="city" name="city" bind:value={doc.city} /></div>
    </div>
    <div class="row">
      <div class="col-label"><label for="registration_date">Beitritt</label></div>
      <div class="col-input">
        <DateInput bind:selectedDateString={registration_date_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="renewed_on">Verlängert am</label></div>
      <div class="col-input">
        <DateInput bind:selectedDateString={renewed_on_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="remark">Bemerkung</label></div>
      <div class="col-input">
        <input type="text" id="remark" name="remark" bind:value={doc.remark} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="email">E-Mail</label></div>
      <div class="col-input">
        <input type="text" id="email" name="email" bind:value={doc.email} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="telephone_number">Telefonnummer</label></div>
      <div class="col-input">
        <input
          type="text"
          id="telephone_number"
          name="telephone_number"
          bind:value={doc.telephone_number} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="subscribed_to_newsletter">Newsletter</label></div>
      <div class="col-input">
        <Checkbox
          id="subscribed_to_newsletter"
          name="subscribed_to_newsletter"
          size="2rem"
          bind:checked={doc.subscribed_to_newsletter} />
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
    <button class="button-cancel" on:click={close}>Abbrechen</button>
    {#if !createNew}
      <button
        class="button-delete"
        on:click={() => {
          if (confirm('Soll dieser Kunde wirklich gelöscht werden?')) {
            $customerDb
              .removeDoc(doc)
              .then(() => notifier.success('Kunde gelöscht!'))
              .then(close)
              .catch((error) => {
                console.error(error);
                notifier.danger('Kunde konnte nicht gelöscht werden!', 6000);
              });
          }
        }}>Kunde Löschen</button>
    {/if}
    <button class="button-save" on:click={saveInDatabase}>Speichern</button>
  </div>
</div>
