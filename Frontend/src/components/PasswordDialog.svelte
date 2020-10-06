<script>
  import { passwordStore } from "../database/passwordStore";

  let value = localStorage.getItem("password");

  if (process.env.DEV) value = process.env.COUCHDB_PASSWORD;

  function login() {
    localStorage.setItem("password", value);
    passwordStore.set(value);
  }

  if (value && value !== "") login();
</script>

<input type="password" bind:value />
<button on:click={login}>Login</button>
