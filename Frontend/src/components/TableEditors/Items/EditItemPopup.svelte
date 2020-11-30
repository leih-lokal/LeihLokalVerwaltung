<script>
  import { getContext } from "svelte";
  import { notifier } from "@beyonk/svelte-notifications";
  import Select from "svelte-select";
  import DateInput from "../../Input/DateInput.svelte";
  import { itemDb } from "../../../utils/stores";
  import InputGroup from "../../Input/InputGroup.svelte";
  import WoocommerceClient from "ENV_WC_CLIENT";

  const woocommerceClient = new WoocommerceClient();

  const { close } = getContext("simple-modal");

  const status_on_website_options = [
    { value: "deleted", label: "gelöscht" },
    { value: "instock", label: "verfügbar" },
    { value: "outofstock", label: "verliehen" }
  ];
  const status_on_website_option_labels = status_on_website_options.map(
    option => option.label
  );

  let status_on_website;
  export let doc = {};
  export let createNew = false;

  const setStatusOnWebsiteByValue = value => {
    status_on_website = status_on_website_options.find(
      option => option.value === value
    );
  };
  const setStatusOnWebsiteByLabel = label => {
    const status_on_website_option = status_on_website_options.find(
      option => option.label === label
    );
    if (status_on_website_option) {
      doc.status_on_website = status_on_website_option.value;
    } else {
      doc.status_on_website = "";
    }
  };

  async function saveInDatabase() {
    const savePromise = createNew
      ? $itemDb.createDoc(doc)
      : $itemDb.updateDoc(doc);
    await savePromise
      .then(result => notifier.success("Gegenstand gespeichert!"))
      .then(close)
      .catch(error => {
        notifier.danger("Gegenstand konnte nicht gespeichert werden!", 6000);
        console.error(error);
      });

    if (createNew) {
      woocommerceClient
        .createItem(doc)
        .then(wcDoc => {
          doc.wc_url = wcDoc.permalink;
          doc.wc_id = wcDoc.id;
          console.log(doc);
          $itemDb.updateDoc(doc);
          notifier.success("Gegenstand auf der Webseite erstellt!", 3000);
        })
        .catch(error => {
          notifier.warning(
            "Gegenstand konnte auf der Webseite nicht erstellt werden!",
            6000
          );
          console.error(error);
        });
    } else {
      woocommerceClient
        .updateItem(doc)
        .then(() =>
          notifier.success("Status auf der Webseite aktualisiert!", 3000)
        )
        .catch(error => {
          notifier.warning(
            "Status auf der Webseite konnte nicht aktualisiert werden!",
            6000
          );
          console.error(error);
        });
    }
  }

  if (createNew) {
    $itemDb.nextUnusedId().then(id => (doc._id = String(id)));
    doc.added = new Date().getTime();
  }

  setStatusOnWebsiteByValue(doc.status_on_website);
  $: status_on_website_label = status_on_website ? status_on_website.label : "";
  $: setStatusOnWebsiteByLabel(status_on_website_label);
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
  <h1>{createNew ? 'Gegenstand anlegen' : 'Gegenstand bearbeiten'}</h1>
  <div class="content">
    <InputGroup>
      <row>
        <h3>Bezeichnung</h3>
      </row>
      <row>
        <div class="col-label">
          <label for="item_id">Gegenstand Nr</label>
        </div>
        <div class="col-input">
          <input
            type="text"
            id="item_id"
            name="item_id"
            value={doc._id}
            disabled />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="item_name">Gegenstand Name</label>
        </div>
        <div class="col-input">
          <input
            type="text"
            id="item_name"
            name="item_name"
            bind:value={doc.item_name} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="brand">Marke</label>
        </div>
        <div class="col-input">
          <input type="text" id="brand" name="brand" bind:value={doc.brand} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="itype">Typbezeichnung</label>
        </div>
        <div class="col-input">
          <input type="text" id="itype" name="itype" bind:value={doc.itype} />
        </div>
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Eigenschaften</h3>
      </row>
      <row>
        <div class="col-label">
          <label for="category">Kategorie</label>
        </div>
        <div class="col-input">
          <input
            type="text"
            id="category"
            name="category"
            bind:value={doc.category} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="deposit">Pfand</label>
        </div>
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
          <label for="added">Erfasst am</label>
        </div>
        <div class="col-input">
          <DateInput bind:timeMillis={doc.added} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="properties">Eigenschaften</label>
        </div>
        <div class="col-input">
          <input
            type="text"
            id="properties"
            name="properties"
            bind:value={doc.properties} />
        </div>
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Zubehör</h3>
      </row>
      <row>
        <div class="col-label">
          <label for="parts">Anzahl Teile</label>
        </div>
        <div class="col-input">
          <input type="text" id="parts" name="parts" bind:value={doc.parts} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="manual">Anleitung</label>
        </div>
        <div class="col-input">
          <input
            type="text"
            id="manual"
            name="manual"
            bind:value={doc.manual} />
        </div>
      </row>
      <row>
        <div class="col-label">
          <label for="package">Verpackung</label>
        </div>
        <div class="col-input">
          <input
            type="text"
            id="package"
            name="package"
            bind:value={doc.package} />
        </div>
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Bild</h3>
      </row>
      <row>
        <div class="col-label">
          <label for="image">Bild</label>
        </div>
        <div class="col-input">
          <input type="text" id="image" name="image" bind:value={doc.image} />
        </div>
      </row>
    </InputGroup>

    <InputGroup>
      <row>
        <h3>Status</h3>
      </row>
      <row>
        <div class="col-label">
          <label for="status_on_website">Status auf Webseite</label>
        </div>
        <div class="col-input">
          <Select
            items={status_on_website_option_labels}
            bind:selectedValue={status_on_website}
            placeholder={'Auswählen...'} />
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
          if (confirm('Soll dieser Gegenstand wirklich gelöscht werden?')) {
            $itemDb
              .removeDoc(doc)
              .then(() => notifier.success('Gegenstand gelöscht!'))
              .then(close)
              .catch(error => {
                console.error(error);
                notifier.danger('Gegenstand konnte nicht gelöscht werden!', 6000);
              });
          }
        }}>
        Gegenstand Löschen
      </button>
    {/if}
    <button class="button-save" on:click={saveInDatabase}>Speichern</button>
  </div>
</div>
