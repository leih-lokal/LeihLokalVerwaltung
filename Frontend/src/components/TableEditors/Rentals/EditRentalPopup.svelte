<script>
  import { getContext } from "svelte";
  import { notifier } from "@beyonk/svelte-notifications";
  import AutoComplete from "simple-svelte-autocomplete";
  import DateInput from "../../Input/DateInput.svelte";
  import Checkbox from "svelte-checkbox";
  import InputGroup from "../../Input/InputGroup.svelte";
  import { rentalDb, itemDb, customerDb } from "../../../utils/stores";
  import WoocommerceClient from "ENV_WC_CLIENT";

  const woocommerceClient = new WoocommerceClient();

  const { close } = getContext("simple-modal");

  async function saveInDatabase() {
    if (doc.item_id) {
      const item = await $itemDb.fetchById(doc.item_id);
      doc.image = item.image;

      if (updateStatusOnWebsite) {
        if (
          doc.returned_on &&
          doc.returned_on !== 0 &&
          doc.returned_on <= new Date().getTime()
        ) {
          item.status_on_website = "instock";
          $itemDb.updateDoc(item);
          woocommerceClient
            .updateItem(item)
            .then(() => {
              notifier.success(
                `'${item.item_name}' wurde auf der Webseite als verfügbar markiert.`
              );
            })
            .catch((error) => {
              notifier.warning(
                `Status von '${item.item_name}' konnte auf der der Webseite nicht aktualisiert werden!`,
                6000
              );
              console.error(error);
            });
        } else if (createNew) {
          item.status_on_website = "outofstock";
          $itemDb.updateDoc(item);
          woocommerceClient
            .updateItem(item)
            .then(() => {
              notifier.success(
                `'${item.item_name}' wurde auf der Webseite als verliehen markiert.`
              );
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
  let updateStatusOnWebsite = true;

  function returnToday() {
    let today = new Date().valueOf();
    doc.returned_on = today;
    console.log(doc.returned_on);
  }

  function returnInNDays(days) {
    let inOneWeek = new Date();
    let today = new Date();

    inOneWeek.setDate(inOneWeek.getDate() + days);
    doc.to_return_on = inOneWeek.getTime();
  }

  if (createNew) {
    doc.rented_on = new Date().getTime();
    returnInNDays(7);
  }

  const idStartsWithSelector = (searchValue) =>
    $rentalDb
      .selectorBuilder()
      .withField("_id")
      .startsWithIgnoreCase(searchValue)
      .build();

  const idStartsWithAndNotDeletedSelector = (searchValue) =>
    $rentalDb
      .selectorBuilder()
      .withField("_id")
      .startsWithIgnoreCaseAndLeadingZeros(searchValue)
      .withField("status_on_website")
      .isNotEqualTo("deleted")
      .build();

  const attributeStartsWithIgnoreCaseSelector = (field, searchValue) =>
    $rentalDb
      .selectorBuilder()
      .withField(field)
      .startsWithIgnoreCase(searchValue)
      .build();

  const attributeStartsWithIgnoreCaseAndNotDeletedSelector = (
    field,
    searchValue
  ) =>
    $rentalDb
      .selectorBuilder()
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

  .button-tight {
    height: 1.5rem;
    font-size: smaller;
    line-height: 0.75rem;
    margin-top: 0.25rem;
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
            textCleanFunction={(text) => {
              doc.item_id = text;
              return text;
            }}
            searchFunction={(searchTerm) => {
              return $itemDb.fetchDocsBySelector(
                idStartsWithAndNotDeletedSelector(searchTerm),
                ['_id', 'item_name', 'deposit']
              );
            }}
            beforeChange={(prevSelectedValue, newSelectedValue) => {
              if (doc.item_id !== newSelectedValue._id) doc.item_id = newSelectedValue._id;
              if (doc.item_name !== newSelectedValue.item_name) doc.item_name = newSelectedValue.item_name;
              if (doc.deposit !== newSelectedValue.deposit) doc.deposit = newSelectedValue.deposit;
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
            textCleanFunction={(text) => {
              doc.item_name = text;
              return text;
            }}
            searchFunction={(searchTerm) => {
              return $itemDb.fetchDocsBySelector(
                attributeStartsWithIgnoreCaseAndNotDeletedSelector(
                  'item_name',
                  searchTerm
                ),
                ['_id', 'item_name', 'deposit']
              );
            }}
            beforeChange={(prevSelectedValue, newSelectedValue) => {
              if (doc.item_name !== newSelectedValue.item_name) doc.item_name = newSelectedValue.item_name;
              if (doc.item_id !== newSelectedValue._id) doc.item_id = newSelectedValue._id;
              if (doc.deposit !== newSelectedValue.deposit) doc.deposit = newSelectedValue.deposit;
            }}
            inputId="input_item_name"
            keywordsFieldName="item_name"
            labelFieldName="item_name"
            noResultsText="Kein Gegenstand mit diesem Name"
            hideArrow={true}
            selectedItem={{ _id: doc.item_id ?? '', item_name: doc.item_name ?? '' }} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="update_status_on_website">Status auf Webseite
            aktualisieren</label>
        </div>
        <div class="col-input">
          <Checkbox
            id="update_status_on_website"
            name="update_status_on_website"
            size="2rem"
            bind:checked={updateStatusOnWebsite} />
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
        <div class="col-label">
          <label for="to_return_on">Zurückerwartet</label>
        </div>
        <div class="col-input">
          <DateInput bind:timeMillis={doc.to_return_on} />
          <button
            class="button-tight"
            on:click={() => returnInNDays(7)}>+1W</button>
          <button
            class="button-tight"
            on:click={() => returnInNDays(14)}>+2W</button>
          <button
            class="button-tight"
            on:click={() => returnInNDays(21)}>+3W</button>
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="returned_on">Zurückgegeben</label>
        </div>
        <div class="col-input">
          <DateInput bind:timeMillis={doc.returned_on} />
          <button class="button-tight" on:click={returnToday}>Heute</button>
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
            textCleanFunction={(text) => {
              doc.customer_id = text;
              return text;
            }}
            searchFunction={(searchTerm) => {
              return $customerDb.fetchDocsBySelector(
                idStartsWithSelector(searchTerm),
                ['_id', 'firstname', 'lastname']
              );
            }}
            autocomplete="autocomplete-input"
            beforeChange={(prevSelectedValue, newSelectedValue) => {
              if (doc.name !== newSelectedValue.lastname) doc.name = newSelectedValue.lastname;
              if (doc.customer_id !== newSelectedValue._id) doc.customer_id = newSelectedValue._id;
            }}
            inputId="input_customer_id"
            labelFunction={(customer) => {
              if (customer && customer.lastname && customer.lastname !== '') {
                return customer._id + ': ' + customer.firstname + ' ' + customer.lastname;
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
            textCleanFunction={(text) => {
              doc.name = text;
              return text;
            }}
            searchFunction={(searchTerm) => {
              return $customerDb.fetchDocsBySelector(
                attributeStartsWithIgnoreCaseSelector('lastname', searchTerm),
                ['_id', 'firstname', 'lastname']
              );
            }}
            beforeChange={(prevSelectedValue, newSelectedValue) => {
              if (doc.name !== newSelectedValue.lastname) doc.name = newSelectedValue.lastname;
              if (doc.customer_id !== newSelectedValue._id) doc.customer_id = newSelectedValue._id;
            }}
            inputId="input_lastname"
            labelFunction={(customer) => {
              if (customer && customer.lastname && customer.firstname && customer.lastname !== '' && customer.firstname !== '') {
                return customer._id + ': ' + customer.firstname + ' ' + customer.lastname;
              } else if (customer) {
                return customer.lastname;
              } else {
                return '';
              }
            }}
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
          <input
            type="text"
            id="deposit"
            name="deposit"
            bind:value={doc.deposit} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="deposit_returned">Pfand zurück</label>
        </div>
        <div class="col-input">
          <input
            type="text"
            id="deposit_returned"
            name="deposit_returned"
            bind:value={doc.deposit_returned} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="deposit_retained">einbehalten</label>
        </div>
        <div class="col-input">
          <input
            type="text"
            id="deposit_retained"
            name="deposit_retained"
            bind:value={doc.deposit_retained} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="deposit_retainment_reason">Grund</label>
        </div>
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
        <div class="col-label">
          <label for="passing_out_employee">Ausgabe</label>
        </div>
        <div class="col-input">
          <input
            type="text"
            id="passing_out_employee"
            name="passing_out_employee"
            bind:value={doc.passing_out_employee} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="receiving_employee">Rücknahme</label>
        </div>
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
          <input
            type="text"
            id="remark"
            name="remark"
            bind:value={doc.remark} />
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
