<script>
  import { onMount, onDestroy } from "svelte";
  import Database from "../Database/ENV_DATABASE";

  let defaultSettings = {
    wcUrl: "https://www.buergerstiftung-karlsruhe.de/wp-json/wc/v3",
    couchdbHost: "127.0.0.1",
    couchdbPort: "6984",
    couchdbUser: "user",
    couchdbPassword: "password",
  };

  let settings = {
    couchdbHost: "",
    couchdbPort: "",
    couchdbUser: "",
    couchdbPassword: "",
    wcUrl: "",
    wcKey: "",
    wcSecret: "",
  };

  const loadSettingsFromLocalStorage = () => {
    Object.keys(settings).map((key, i) => {
      if (
        (!localStorage.hasOwnProperty(key) || localStorage.getItem(key).trim().length === 0) &&
        defaultSettings.hasOwnProperty(key)
      ) {
        settings[key] = defaultSettings[key];
      } else {
        settings[key] = localStorage.hasOwnProperty(key) ? localStorage.getItem(key) : "";
      }
    });
  };

  const writeSettingsToLocalStorage = () => {
    const dbSettingsChanged =
      localStorage.getItem("couchdbHost") !== settings.couchdbHost ||
      localStorage.getItem("couchdbPort") !== settings.couchdbPort ||
      localStorage.getItem("couchdbUser") !== settings.couchdbUser ||
      localStorage.getItem("couchdbPassword") !== settings.couchdbPassword;
    Object.keys(settings).map((key) => {
      localStorage.setItem(key, settings[key]);
    });
    if (dbSettingsChanged) {
      Database.connect();
    }
  };

  onMount(loadSettingsFromLocalStorage);
  onDestroy(writeSettingsToLocalStorage);
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
          bind:value={settings.couchdbHost}
          id="couchdbhost"
          type="text"
          placeholder="127.0.0.1"
        />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="couchdbport">Port</label>
      </div>
      <div class="col-75">
        <input bind:value={settings.couchdbPort} id="couchdbport" type="text" placeholder="6984" />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="couchdbuser">Nutzer</label>
      </div>
      <div class="col-75">
        <input
          bind:value={settings.couchdbUser}
          id="couchdbuser"
          type="text"
          placeholder="Nutzer"
        />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="couchdbpassword">Passwort</label>
      </div>
      <div class="col-75">
        <input
          bind:value={settings.couchdbPassword}
          id="couchdbpassword"
          type="password"
          placeholder="Passwort"
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
        <input bind:value={settings.wcUrl} id="wcurl" type="text" placeholder="https://" />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="wckey">API Key</label>
      </div>
      <div class="col-75">
        <input bind:value={settings.wcKey} id="wckey" type="text" placeholder="API Key" />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="wcsecret">Secret</label>
      </div>
      <div class="col-75">
        <input bind:value={settings.wcSecret} id="wcsecret" type="password" placeholder="Secret" />
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
