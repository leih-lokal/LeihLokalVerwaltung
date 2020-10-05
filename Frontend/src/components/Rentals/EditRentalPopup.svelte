<script>
  import { getContext, onDestroy } from "svelte";
  import { ItemDatabase, CustomerDatabase } from "../../database/Database.js";
  import { saveParseTimestampToString, saveParseStringToTimeMillis } from "../../utils/utils.js";
  import { notifier } from "@beyonk/svelte-notifications";
  import DateInput from "../DateInput.svelte";

  const { close } = getContext("simple-modal");

  function convertInputsForDb() {
    rental.rented_on = saveParseStringToTimeMillis(rented_on_string);
    rental.extended_on = saveParseStringToTimeMillis(extended_on_string);
    rental.to_return_on = saveParseStringToTimeMillis(to_return_on_string);
    rental.returned_on = saveParseStringToTimeMillis(returned_on_string);
  }

  function saveInDatabase() {
    convertInputsForDb();

    const savePromise = createNewRental
      ? database.createDocWithoutId(rental)
      : database.updateDoc(rental);

    savePromise
      .then((result) => notifier.success("Leihvorgang gespeichert!"))
      .then(close)
      .catch((error) => {
        notifier.danger("Leihvorgang konnte nicht gespeichert werden!", 6000);
        console.error(error);
        close();
      });
  }

  onDestroy(convertInputsForDb);

  export let rental = {};
  export let database;
  export let createNewRental = false;

  if (createNewRental) {
    rental.rented_on = new Date().getTime();
    let inOneWeek = new Date();
    inOneWeek.setDate(inOneWeek.getDate() + 7);
    rental.to_return_on = inOneWeek.getTime();
  }

  let rented_on_string = saveParseTimestampToString(rental.rented_on);
  let extended_on_string = saveParseTimestampToString(rental.extended_on);
  let to_return_on_string = saveParseTimestampToString(rental.to_return_on);
  let returned_on_string = saveParseTimestampToString(rental.returned_on);
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
  <h1>{createNewRental ? 'Leihvorgang erstellen' : 'Leihvorgang bearbeiten'}</h1>
  <div class="content">
    <div class="row">
      <div class="col-label"><label for="item_id">Gegenstand Nr</label></div>
      <div class="col-input">
        <input
          type="text"
          id="item_id"
          name="item_id"
          on:input={(event) => ItemDatabase.fetchById(event.target.value)
              .then((item) => {
                rental.item_name = item.item_name;
                rental.deposit = item.deposit;
              })
              .catch((error) => console.debug(error))}
          bind:value={rental.item_id} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="item_name">Gegenstand Name</label></div>
      <div class="col-input">
        <input
          type="text"
          id="item_name"
          name="item_name"
          bind:value={rental.item_name}
          on:input={(event) => ItemDatabase.fetchByAttribute('item_name', event.target.value)
              .then((item) => {
                rental.item_id = item._id;
                rental.item_name = item.item_name;
                rental.deposit = item.deposit;
              })
              .catch((error) => console.debug(error))} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="customer_id">Kunde Nr</label></div>
      <div class="col-input">
        <input
          type="text"
          id="customer_id"
          name="customer_id"
          bind:value={rental.customer_id}
          on:input={(event) => CustomerDatabase.fetchById(event.target.value)
              .then((item) => (rental.name = item.lastname))
              .catch((error) => console.debug(error))} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="name">Kunde Name</label></div>
      <div class="col-input">
        <input
          type="text"
          id="name"
          name="name"
          bind:value={rental.name}
          on:input={(event) => CustomerDatabase.fetchByAttribute('lastname', event.target.value)
              .then((item) => {
                rental.customer_id = item._id;
                rental.name = item.lastname;
              })
              .catch((error) => console.debug(error))} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="rented_on">Ausgeliehen am</label></div>
      <div class="col-input">
        <DateInput bind:selectedDateString={rented_on_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="extended_on">Verlängert am</label></div>
      <div class="col-input">
        <DateInput bind:selectedDateString={extended_on_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="to_return_on">Zurückzugeben am</label></div>
      <div class="col-input">
        <DateInput bind:selectedDateString={to_return_on_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="returned_on">Zurückgegeben am</label></div>
      <div class="col-input">
        <DateInput bind:selectedDateString={returned_on_string} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit">Pfand</label></div>
      <div class="col-input">
        <input type="text" id="deposit" name="deposit" bind:value={rental.deposit} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit_returned">Pfand zurück</label></div>
      <div class="col-input">
        <input
          type="text"
          id="deposit_returned"
          name="deposit_returned"
          bind:value={rental.deposit_returned} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit_retained">Pfand einbehalten</label></div>
      <div class="col-input">
        <input
          type="text"
          id="deposit_retained"
          name="deposit_retained"
          bind:value={rental.deposit_retained} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit_retainment_reason">Grund</label></div>
      <div class="col-input">
        <input
          type="text"
          id="deposit_retainment_reason"
          name="deposit_retainment_reason"
          bind:value={rental.deposit_retainment_reason} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="passing_out_employee">Mitarbeiter Ausgabe</label></div>
      <div class="col-input">
        <input
          type="text"
          id="passing_out_employee"
          name="passing_out_employee"
          bind:value={rental.passing_out_employee} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="receiving_employee">Mitarbeiter Rücknahme</label></div>
      <div class="col-input">
        <input
          type="text"
          id="receiving_employee"
          name="receiving_employee"
          bind:value={rental.receiving_employee} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="remark">Bemerkung</label></div>
      <div class="col-input">
        <input type="text" id="remark" name="remark" bind:value={rental.remark} />
      </div>
    </div>
  </div>

  <div class="footer">
    <button class="button-cancel" on:click={close}>Abbrechen</button>
    {#if !createNewRental}
      <button
        class="button-delete"
        on:click={() => {
          if (confirm('Soll dieser Leihvorgang wirklich gelöscht werden?')) {
            database
              .removeDoc(rental)
              .then(() => notifier.success('Leihvorgang gelöscht!'))
              .then(close)
              .catch((error) => {
                console.error(error);
                notifier.danger('Leihvorgang konnte nicht gelöscht werden!', 6000);
              });
          }
        }}>Leihvorgang Löschen</button>
    {/if}
    <button class="button-save" on:click={saveInDatabase}>Speichern</button>
  </div>
</div>
