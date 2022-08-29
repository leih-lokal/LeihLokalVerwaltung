<script>
  import { settingsStore } from "../../utils/settingsStore";
  import Checkbox from "svelte-checkbox";
  import Database from "../../database/ENV_DATABASE";
  import { notifier } from "@beyonk/svelte-notifications";
  import { onDestroy } from "svelte";

  let prevValue;
  let timer;

  const debounce = (functionAfterDebounce) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      functionAfterDebounce();
    }, 750);
  };

  const onSettingsChanged = () => {
    localStorage.removeItem("stats");
    Database.connect();
    notifier.success("Einstellungen gespeichert!", 1500);
  };

  const unsubscribe = settingsStore.subscribe((value) => {
    if (prevValue && JSON.stringify(value) !== JSON.stringify(prevValue)) {
      debounce(onSettingsChanged);
    }
    prevValue = JSON.parse(JSON.stringify(value));
  });

  onDestroy(unsubscribe);
</script>

<div class="container">
  <div class="content">
    <div class="row">
      <div class="col-25">
        <h2>Datenbank</h2>
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="couchdbhost">Host</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.couchdbHost}
          id="couchdbhost"
          type="text"
          placeholder="127.0.0.1"
        />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="couchdbhost">HTTPS</label>
      </div>
      <div class="col-75">
        <Checkbox size="2rem" bind:checked={$settingsStore.couchdbHTTPS} />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="couchdbport">Port</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.couchdbPort}
          id="couchdbport"
          type="text"
          placeholder="6984"
        />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="couchdbuser">Benutzername</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.couchdbUser}
          id="couchdbuser"
          type="text"
          placeholder="Benutzername"
        />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="couchdbpassword">Passwort</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.couchdbPassword}
          id="couchdbpassword"
          type="password"
          placeholder="Passwort"
        />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="couchdbhost">Datenbank</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.couchdbName}
          id="couchdbname"
          type="text"
          placeholder="Datenbank Name"
        />
      </div>
    </div>

    <div class="row">
      <div class="col-25">
        <h2>WooCommerce</h2>
      </div>
    </div>

    <div class="row">
      <div class="col-25">
        <label for="wcurl">URL</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.wcUrl}
          id="wcurl"
          type="text"
          placeholder="https://"
        />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="wckey">API Key</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.wcKey}
          id="wckey"
          type="text"
          placeholder="API Key"
        />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="wcsecret">Secret</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.wcSecret}
          id="wcsecret"
          type="password"
          placeholder="Secret"
        />
      </div>
    </div>
  </div>
</div>

<style>
  .container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
  }

  * {
    box-sizing: border-box;
  }

  input[type="text"],
  input[type="password"] {
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

  .content {
    border-radius: 5px;
    padding: 20px;
    min-width: 80%;
  }

  .col-25 {
    float: left;
    width: 25%;
    margin-top: 6px;
  }

  .col-75 {
    float: left;
    width: 75%;
    margin-top: 6px;
  }

  /* Clear floats after the columns */
  .row:after {
    content: "";
    display: table;
    clear: both;
  }

  /* Responsive layout - when the screen is less than 600px wide, make the two columns stack on top of each other instead of next to each other */
  @media screen and (max-width: 600px) {
    .col-25,
    .col-75 {
      width: 100%;
    }
  }
</style>
