<script>
  import { getContext } from "svelte";
  import { notifier } from "@beyonk/svelte-notifications";
  import Checkbox from "svelte-checkbox";
  import Select from "svelte-select";
  import DateInput from "../../Input/DateInput.svelte";
  import { customerDb } from "../../../utils/stores";
  import InputGroup from "../../Input/InputGroup.svelte";

  const { close } = getContext("simple-modal");

  const heard_options = ["Internet", "Freunde & Bekannte", "Zeitung / Medien", "Nachbarschaft"];

  function saveInDatabase() {
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

  export let doc = {};
  export let createNew = false;

  if (createNew) {
    $customerDb.nextUnusedId().then((id) => (doc._id = String(id)));
    doc.registration_date = new Date().getTime();
  }

  let heard = !doc.heard || doc.heard === "" ? [] : doc.heard.split(",");
  $: doc.heard = heard ? heard.map((item) => item.value).join(",") : "";
</script>

<style>
  input[type="text"] {
    width: 100% !important;
    padding: 0.5rem !important;
    border: 1px solid #ccc !important;
    border-radius: 4px !important;
    resize: vertical !important;
    height: 2.5rem !important;
  }

  row {
    padding: 0.6rem;
    display: inline-block;
  }

  h1 {
    height: 2rem;
    padding: 0.7rem 0.7rem 0.9rem 0.7rem;
    margin: 0;
    flex-shrink: 0;
  }

  h3 {
    margin: 0;
    padding: 0;
  }

  label {
    padding: 0.5rem 0.5rem 0.5rem 0;
    display: inline-block;
  }

  .col-label {
    float: left;
    width: 40%;
  }

  .col-input {
    float: left;
    width: 60%;
  }

  .content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    flex-grow: 1;
    overflow: auto;
    min-height: 2em;
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
  }

  .footer {
    height: 2rem;
    padding: 0.5rem;
    margin: 0;
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
  }

  .button-delete {
    color: darkred;
  }
</style>

<div class="container">
  <h1>{createNew ? 'Kunde anlegen' : 'Kunde bearbeiten'}</h1>
  <div class="content">
    <InputGroup>
      <row>
        <h3>Name</h3>
      </row>
      <row>
        <div class="col-label"><label for="firstname">Vorname</label></div>
        <div class="col-input">
          <input type="text" id="firstname" name="firstname" bind:value={doc.firstname} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="lastname">Nachname</label></div>
        <div class="col-input">
          <input type="text" id="lastname" name="lastname" bind:value={doc.lastname} />
        </div>
        <row />
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Adresse</h3>
      </row>
      <row>
        <div class="col-label"><label for="street">Strasse</label></div>
        <div class="col-input">
          <input type="text" id="street" name="street" bind:value={doc.street} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="house_number">Hausnummer</label></div>
        <div class="col-input">
          <input type="text" id="house_number" name="house_number" bind:value={doc.house_number} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="postal_code">Postleitzahl</label></div>
        <div class="col-input">
          <input type="text" id="postal_code" name="postal_code" bind:value={doc.postal_code} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="city">Stadt</label></div>
        <div class="col-input">
          <input type="text" id="city" name="city" bind:value={doc.city} />
        </div>
        <row />
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Kontakt</h3>
      </row>
      <row>
        <div class="col-label"><label for="email">E-Mail</label></div>
        <div class="col-input">
          <input type="text" id="email" name="email" bind:value={doc.email} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="telephone_number">Telefonnummer</label></div>
        <div class="col-input">
          <input
            type="text"
            id="telephone_number"
            name="telephone_number"
            bind:value={doc.telephone_number} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="subscribed_to_newsletter">Newsletter</label></div>
        <div class="col-input">
          <Checkbox
            id="subscribed_to_newsletter"
            name="subscribed_to_newsletter"
            size="2rem"
            bind:checked={doc.subscribed_to_newsletter} />
        </div>
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Mitgliedschaft</h3>
      </row>
      <row>
        <div class="col-label"><label for="registration_date">Beitritt</label></div>
        <div class="col-input">
          <DateInput bind:timeMillis={doc.registration_date} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="renewed_on">Verlängert am</label></div>
        <div class="col-input">
          <DateInput bind:timeMillis={doc.renewed_on} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="heard">Aufmerksam geworden</label></div>
        <div class="col-input">
          <Select
            items={heard_options}
            bind:selectedValue={heard}
            isMulti={true}
            isCreatable={true}
            placeholder={'Auswählen...'} />
        </div>
      </row>
    </InputGroup>
    <InputGroup>
      <row>
        <h3>Sonstiges</h3>
      </row>
      <row>
        <div class="col-label"><label for="id">Id</label></div>
        <div class="col-input">
          {#if createNew}
            <input type="text" id="id" name="id" bind:value={doc._id} />
          {:else}<input type="text" id="id" name="id" value={doc._id} disabled />{/if}
        </div>
      </row>
      <row>
        <div class="col-label"><label for="remark">Bemerkung</label></div>
        <div class="col-input">
          <input type="text" id="remark" name="remark" bind:value={doc.remark} />
        </div>
      </row>
    </InputGroup>
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
