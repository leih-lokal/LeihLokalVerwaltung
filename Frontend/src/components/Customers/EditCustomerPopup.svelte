<script>
  import DateInput from "../DateInput.svelte";
  import { getContext } from "svelte";
  import { CustomerDatabase } from "../../database/Database.js";
  import { showNotification } from "../../utils/utils.js";

  const { close } = getContext("simple-modal");

  export let customer;
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
    flex-wrap: nowrap;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 2em;
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  h1,
  .footer {
    height: 30px;
    padding: 15px 5px;
    margin: 0;
  }

  .row {
    width: 400px;
    margin: 0 1rem;
  }

  .button-save {
    float: right;
  }

  .button-cancel {
    float: left;
  }
</style>

<div class="container">
  <h1>Kunde bearbeiten</h1>
  <div class="content">
    <div class="row">
      <div class="col-label">
        <label for="id">Id</label>
      </div>
      <div class="col-input">
        <input type="text" id="id" name="id" bind:value={customer._id} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="firstname">Vorname</label>
      </div>
      <div class="col-input">
        <input type="text" id="firstname" name="firstname" bind:value={customer.firstname} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="lastname">Nachname</label>
      </div>
      <div class="col-input">
        <input type="text" id="lastname" name="lastname" bind:value={customer.lastname} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="street">Strasse</label>
      </div>
      <div class="col-input">
        <input type="text" id="street" name="street" bind:value={customer.street} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="house_number">Hausnummer</label>
      </div>
      <div class="col-input">
        <input
          type="text"
          id="house_number"
          name="house_number"
          bind:value={customer.house_number} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="postal_code">Postleitzahl</label>
      </div>
      <div class="col-input">
        <input type="text" id="postal_code" name="postal_code" bind:value={customer.postal_code} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="city">Stadt</label>
      </div>
      <div class="col-input">
        <input type="text" id="city" name="city" bind:value={customer.city} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="registration_date">Beitritt</label>
      </div>
      <div class="col-input">
        <DateInput bind:selected={customer.registration_date} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="renewed_on">Verlängert am</label>
      </div>
      <div class="col-input">
        <DateInput bind:selected={customer.renewed_on} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="remark">Bemerkung</label>
      </div>
      <div class="col-input">
        <input type="text" id="remark" name="remark" bind:value={customer.remark} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="email">E-Mail</label>
      </div>
      <div class="col-input">
        <input type="text" id="email" name="email" bind:value={customer.email} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="telephone_number">Telefonnummer</label>
      </div>
      <div class="col-input">
        <input
          type="text"
          id="telephone_number"
          name="telephone_number"
          bind:value={customer.telephone_number} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="subscribed_to_newsletter">Newsletter</label>
      </div>
      <div class="col-input">
        <input
          type="checkbox"
          id="subscribed_to_newsletter"
          name="subscribed_to_newsletter"
          bind:checked={customer.subscribed_to_newsletter} />
      </div>
    </div>
    <div class="row">
      <div class="col-label">
        <label for="heard">Aufmerksam geworden</label>
      </div>
      <div class="col-input">
        <input type="text" id="heard" name="heard" bind:value={customer.heard} />
      </div>
    </div>
  </div>
  <div class="footer">
    <button
      class="button-save"
      on:click={CustomerDatabase.updateDoc(customer)
        .then((result) => showNotification('Kunde gespeichert!'))
        .then(close)
        .catch((error) => {
          close();
          showNotification('Kunde konnte nicht gespeichert werden!', 'danger');
          console.error(error);
        })}>
      Speichern
    </button>
    <button class="button-cancel" on:click={close}>Abbrechen</button>
  </div>
</div>
