<script>
  import { getContext, onDestroy } from "svelte";
  import { saveParseTimestampToString, saveParseStringToTimeMillis } from "../../../utils/utils.js";
  import { notifier } from "@beyonk/svelte-notifications";
  import AutoComplete from "simple-svelte-autocomplete";
  import DateInput from "../../Input/DateInput.svelte";
  import { rentalDb, itemDb, customerDb } from "../../../utils/stores";

  const { close } = getContext("simple-modal");

  function convertInputsForDb() {
    doc.rented_on = saveParseStringToTimeMillis(rented_on_string);
    doc.extended_on = saveParseStringToTimeMillis(extended_on_string);
    doc.to_return_on = saveParseStringToTimeMillis(to_return_on_string);
    doc.returned_on = saveParseStringToTimeMillis(returned_on_string);
  }

  function saveInDatabase() {
    convertInputsForDb();

    const savePromise = createNew ? $rentalDb.createDocWithoutId(doc) : $rentalDb.updateDoc(doc);

    savePromise
      .then((result) => notifier.success("Leihvorgang gespeichert!"))
      .then(close)
      .catch((error) => {
        notifier.danger("Leihvorgang konnte nicht gespeichert werden!", 6000);
        console.error(error);
        close();
      });
  }

  const findById = (docsPromise, id) =>
    docsPromise.then((docs) => docs.find((doc) => doc._id === id));

  const findByAttribute = (docsPromise, attrKey, attrVal) =>
    docsPromise.then((docs) =>
      docs.find((doc) => String(doc[attrKey]).toLowerCase() === String(attrVal).toLowerCase())
    );

  onDestroy(convertInputsForDb);

  export let doc = {};
  export let createNew = false;

  if (createNew) {
    doc.rented_on = new Date().getTime();
    let inOneWeek = new Date();
    inOneWeek.setDate(inOneWeek.getDate() + 7);
    doc.to_return_on = inOneWeek.getTime();
  }

  let rented_on_string = saveParseTimestampToString(doc.rented_on);
  let extended_on_string = saveParseTimestampToString(doc.extended_on);
  let to_return_on_string = saveParseTimestampToString(doc.to_return_on);
  let returned_on_string = saveParseTimestampToString(doc.returned_on);
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
  <h1>{createNew ? 'Leihvorgang erstellen' : 'Leihvorgang bearbeiten'}</h1>
  <div class="content">
    <div class="row">
      <div class="col-label"><label for="item_id">Gegenstand Nr</label></div>
      <div class="col-input">
        <input
          type="text"
          id="item_id"
          name="item_id"
          bind:value={doc.item_id}
          on:input={(event) => $itemDb
              .fetchDocsByIdStartingWith(parseInt(event.target.value) + '')
              .then((item) => {
                if (item) {
                  console.log(item);
                  doc.item_id = item._id;
                  doc.item_name = item.item_name;
                  doc.deposit = item.deposit;
                }
              })
              .catch((error) => console.debug(error))} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="item_name">Gegenstand Name</label></div>
      <div class="col-input">
        <input
          type="text"
          id="item_name"
          name="item_name"
          bind:value={doc.item_name}
          on:input={(event) => $itemDb
              .fetchDocByAttribute('item_name', event.target.value)
              .then((item) => {
                if (item) {
                  doc.item_id = item._id;
                  doc.item_name = item.item_name;
                  doc.deposit = item.deposit;
                }
              })
              .catch((error) => console.debug(error))} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="customer_id">Kunde Nr</label></div>
      <div class="col-input">
        <AutoComplete
          searchFunction={(searchTerm) => $customerDb.fetchDocsByIdStartingWith(searchTerm, [
              '_id',
              'lastname',
            ])}
          labelFunction={(customer) => customer._id + ' - ' + customer.lastname}
          keywordsFieldName="_id"
          valueFieldName="_id"
          noResultsText="nichts gefunden"
          hideArrow={true}
          bind:value={doc.customer_id} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="name">Kunde Name</label></div>
      <div class="col-input">
        <input
          type="text"
          id="name"
          name="name"
          bind:value={doc.name}
          on:input={(event) => $customerDb
              .fetchDocByAttribute('lastname', event.target.value)
              .then((customer) => {
                doc.customer_id = customer._id;
                doc.name = customer.lastname;
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
      <div class="col-label"><label for="to_return_on">Zurückerwartet am</label></div>
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
        <input type="text" id="deposit" name="deposit" bind:value={doc.deposit} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit_returned">Pfand zurück</label></div>
      <div class="col-input">
        <input
          type="text"
          id="deposit_returned"
          name="deposit_returned"
          bind:value={doc.deposit_returned} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit_retained">Pfand einbehalten</label></div>
      <div class="col-input">
        <input
          type="text"
          id="deposit_retained"
          name="deposit_retained"
          bind:value={doc.deposit_retained} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="deposit_retainment_reason">Grund</label></div>
      <div class="col-input">
        <input
          type="text"
          id="deposit_retainment_reason"
          name="deposit_retainment_reason"
          bind:value={doc.deposit_retainment_reason} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="passing_out_employee">Mitarbeiter Ausgabe</label></div>
      <div class="col-input">
        <input
          type="text"
          id="passing_out_employee"
          name="passing_out_employee"
          bind:value={doc.passing_out_employee} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="receiving_employee">Mitarbeiter Rücknahme</label></div>
      <div class="col-input">
        <input
          type="text"
          id="receiving_employee"
          name="receiving_employee"
          bind:value={doc.receiving_employee} />
      </div>
    </div>
    <div class="row">
      <div class="col-label"><label for="remark">Bemerkung</label></div>
      <div class="col-input">
        <input type="text" id="remark" name="remark" bind:value={doc.remark} />
      </div>
    </div>
  </div>

  <div class="footer">
    <button class="button-cancel" on:click={close}>Abbrechen</button>
    {#if !createNew}
      <button
        class="button-delete"
        on:click={() => {
          if (confirm('Soll dieser Leihvorgang wirklich gelöscht werden?')) {
            $rentalDb
              .removeDoc(doc)
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
