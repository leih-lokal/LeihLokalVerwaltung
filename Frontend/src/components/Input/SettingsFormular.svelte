<script>
  import { settingsStore } from "../../utils/settingsStore";
  import { notifier } from "@beyonk/svelte-notifications";
  import { onDestroy } from "svelte";
  import { getApiClient } from "../../utils/api";

  let prevValue;
  let timer;

  const debounce = (functionAfterDebounce) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      functionAfterDebounce();
    }, 750);
  };

  const onSettingsChanged = async () => {
    localStorage.removeItem("stats");
    await getApiClient(true).init();
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
        <h2>Backend API</h2>
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="apiUrl">Host</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.apiUrl}
          id="apiUrl"
          type="text"
          placeholder="/"
        />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="apiUser">Benutzername</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.apiUser}
          id="apiUser"
          type="text"
          placeholder="user@example.rg"
        />
      </div>
    </div>
    <div class="row">
      <div class="col-25">
        <label for="apiPassword">Passwort</label>
      </div>
      <div class="col-75">
        <input
          bind:value={$settingsStore.apiPassword}
          id="apiPassword"
          type="password"
          placeholder="Passwort"
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
