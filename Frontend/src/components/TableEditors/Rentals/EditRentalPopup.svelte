<script>
  import { getContext } from "svelte";
  import { notifier } from "@beyonk/svelte-notifications";
  import AutoComplete from "simple-svelte-autocomplete";
  import DateInput from "../../Input/DateInput.svelte";
  import InputGroup from "../../Input/InputGroup.svelte";
  import { rentalDb, itemDb, customerDb } from "../../../utils/stores";
  import SelectorBuilder from "../../Database/SelectorBuilder";
  import WoocommerceClient from "../../Database/WoocommerceClient";

  const woocommerceClient = new WoocommerceClient();

  const { close } = getContext("simple-modal");

  async function saveInDatabase() {
    if (doc.item_id) {
      const item = await $itemDb.fetchById(doc.item_id);
      doc.image = item.image;

      if (createNew) {
        woocommerceClient
          .updateItemStatus(item.wc_id, "outofstock")
          .then(() => {
            notifier.success(`'${item.item_name}' wurde auf der Webseite als verliehen markiert.`);
          })
          .catch((error) => {
            notifier.warning(
              `Status von '${item.item_name}' konnte auf der der Webseite nicht aktualisiert werden!`,
              6000
            );
            console.error(error);
          });
      }
    }

    (createNew ? $rentalDb.createDocWithoutId(doc) : $rentalDb.updateDoc(doc))
      .then((result) => notifier.success("Leihvorgang gespeichert!"))
      .then(close)
      .catch((error) => {
        notifier.danger("Leihvorgang konnte nicht gespeichert werden!", 6000);
        console.error(error);
      });
  }

  export let doc = {};
  export let createNew = false;

  if (createNew) {
    doc.rented_on = new Date().getTime();
    let inOneWeek = new Date();
    inOneWeek.setDate(inOneWeek.getDate() + 7);
    doc.to_return_on = inOneWeek.getTime();
  }

  const idStartsWithSelector = (searchValue) =>
    new SelectorBuilder().withField("_id").startsWithIgnoreCase(searchValue).build();

  const idStartsWithAndNotDeletedSelector = (searchValue) =>
    new SelectorBuilder()
      .withField("_id")
      .startsWithIgnoreCaseAndLeadingZeros(searchValue)
      .withField("status_on_website")
      .isNotEqualTo("deleted")
      .build();

  const attributeStartsWithIgnoreCaseSelector = (field, searchValue) =>
    new SelectorBuilder().withField(field).startsWithIgnoreCase(searchValue).build();

  const attributeStartsWithIgnoreCaseAndNotDeletedSelector = (field, searchValue) =>
    new SelectorBuilder()
      .withField(field)
      .startsWithIgnoreCase(searchValue)
      .withField("status_on_website")
      .isNotEqualTo("deleted")
      .build();
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
    flex-direction: column;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    min-height: 2em;
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .footer {
    height: 2rem;
    padding: 0.5rem;
    margin: 0;
  }

  .footer {
    display: flex;
    justify-content: space-between;
  }

  .button-delete {
    color: darkred;
  }
</style>

<div class="container">
  <h1>{createNew ? 'Leihvorgang erstellen' : 'Leihvorgang bearbeiten'}</h1>
  <div class="content">
    <InputGroup>
      <row>
        <h3>Gegenstand</h3>
      </row>
      <row>
        <div class="col-label"><label for="item_id">Nr</label></div>
        <div class="col-input">
          <AutoComplete
            searchFunction={(searchTerm) => $itemDb.fetchDocsBySelector(
                idStartsWithAndNotDeletedSelector(searchTerm),
                ['_id', 'item_name', 'deposit']
              )}
            beforeChange={(prevSelectedValue, newSelectedValue) => {
              doc.item_id = newSelectedValue._id;
              doc.item_name = newSelectedValue.item_name;
              doc.deposit = newSelectedValue.deposit;
              return true;
            }}
            labelFunction={(item) => {
              if (item && item.name && item.name !== '') {
                return item._id + ' - ' + item.name;
              } else if (item) {
                return item._id;
              } else {
                return '';
              }
            }}
            keywordsFieldName="_id"
            noResultsText="Kein Gegenstand mit dieser Id"
            hideArrow={true}
            selectedItem={{ _id: doc.item_id ?? '' }} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="item_name">Name</label></div>
        <div class="col-input">
          <AutoComplete
            searchFunction={(searchTerm) => $itemDb.fetchDocsBySelector(
                attributeStartsWithIgnoreCaseAndNotDeletedSelector('item_name', searchTerm),
                ['_id', 'item_name', 'deposit']
              )}
            beforeChange={(prevSelectedValue, newSelectedValue) => {
              doc.item_name = newSelectedValue.item_name;
              doc.item_id = newSelectedValue._id;
              doc.deposit = newSelectedValue.deposit;
              return true;
            }}
            inputId="input_item_name"
            keywordsFieldName="item_name"
            labelFieldName="item_name"
            noResultsText="Kein Gegenstand mit diesem Name"
            hideArrow={true}
            selectedItem={{ _id: doc.item_id ?? '', item_name: doc.item_name ?? '' }} />
        </div>
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Zeitraum</h3>
      </row>
      <row>
        <div class="col-label"><label for="rented_on">Ausgeliehen</label></div>
        <div class="col-input">
          <DateInput bind:timeMillis={doc.rented_on} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="extended_on">Verlängert</label></div>
        <div class="col-input">
          <DateInput bind:timeMillis={doc.extended_on} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="to_return_on">Zurückerwartet</label></div>
        <div class="col-input">
          <DateInput bind:timeMillis={doc.to_return_on} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="returned_on">Zurückgegeben</label></div>
        <div class="col-input">
          <DateInput bind:timeMillis={doc.returned_on} />
        </div>
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Kunde</h3>
      </row>
      <row>
        <div class="col-label"><label for="customer_id">Nr</label></div>
        <div class="col-input">
          <AutoComplete
            searchFunction={(searchTerm) => $customerDb.fetchDocsBySelector(
                idStartsWithSelector(searchTerm),
                ['_id', 'lastname']
              )}
            autocomplete="autocomplete-input"
            beforeChange={(prevSelectedValue, newSelectedValue) => {
              doc.name = newSelectedValue.lastname;
              doc.customer_id = newSelectedValue._id;
              return true;
            }}
            inputId="input_customer_id"
            labelFunction={(customer) => {
              if (customer && customer.lastname && customer.lastname !== '') {
                return customer._id + ' - ' + customer.lastname;
              } else if (customer) {
                return customer._id;
              } else {
                return '';
              }
            }}
            keywordsFieldName="_id"
            noResultsText="Kein Kunde mit dieser Id"
            hideArrow={true}
            selectedItem={{ _id: doc.customer_id ?? '' }} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="name">Name</label></div>
        <div class="col-input">
          <AutoComplete
            searchFunction={(searchTerm) => $customerDb.fetchDocsBySelector(
                attributeStartsWithIgnoreCaseSelector('lastname', searchTerm),
                ['_id', 'lastname']
              )}
            beforeChange={(prevSelectedValue, newSelectedValue) => {
              doc.name = newSelectedValue.lastname;
              doc.customer_id = newSelectedValue._id;
              return true;
            }}
            inputId="input_lastname"
            keywordsFieldName="lastname"
            labelFieldName="lastname"
            noResultsText="Kein Kunde mit diesem Name"
            hideArrow={true}
            selectedItem={{ _id: doc.customer_id ?? '', lastname: doc.name ?? '' }} />
        </div>
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Pfand</h3>
      </row>
      <row>
        <div class="col-label"><label for="deposit">Pfand</label></div>
        <div class="col-input">
          <input type="text" id="deposit" name="deposit" bind:value={doc.deposit} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="deposit_returned">Pfand zurück</label></div>
        <div class="col-input">
          <input
            type="text"
            id="deposit_returned"
            name="deposit_returned"
            bind:value={doc.deposit_returned} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="deposit_retained">einbehalten</label></div>
        <div class="col-input">
          <input
            type="text"
            id="deposit_retained"
            name="deposit_retained"
            bind:value={doc.deposit_retained} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="deposit_retainment_reason">Grund</label></div>
        <div class="col-input">
          <input
            type="text"
            id="deposit_retainment_reason"
            name="deposit_retainment_reason"
            bind:value={doc.deposit_retainment_reason} />
        </div>
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Mitarbeiter</h3>
      </row>
      <row>
        <div class="col-label"><label for="passing_out_employee">Ausgabe</label></div>
        <div class="col-input">
          <input
            type="text"
            id="passing_out_employee"
            name="passing_out_employee"
            bind:value={doc.passing_out_employee} />
        </div>
      </row>
      <row>
        <div class="col-label"><label for="receiving_employee">Rücknahme</label></div>
        <div class="col-input">
          <input
            type="text"
            id="receiving_employee"
            name="receiving_employee"
            bind:value={doc.receiving_employee} />
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
