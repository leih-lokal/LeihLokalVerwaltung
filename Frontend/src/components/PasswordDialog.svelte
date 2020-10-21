<script>
  import { passwordStore } from "../database/stores";

  let value = localStorage.getItem("password");

  if (process.env.DEV) value = process.env.COUCHDB_PASSWORD;

  function login() {
    localStorage.setItem("password", value);
    passwordStore.set(value);
  }

  if (value && value !== "") login();
</script>

<style>
  .login-form {
    min-width: 250px;
    text-align: center;
    padding: 25px;
    box-shadow: 0px 1px 10px lightgray;
    border-radius: 5px;
  }

  .login-form .form-group {
    margin: 25px auto 40px;
    display: block;
  }

  .login-form .form-group {
    text-align: left;
    display: block;
    font-size: 2em;
  }

  .login-form .form-group input {
    width: 100%;
    text-align: left;
    display: block;
    border: none;
    border-bottom: 1px solid black;
    margin: 10px 0;
    font-size: 1em;
    outline: none;
  }

  .login-form button {
    padding: 10px 25px;
    background-color: white;
    border: 2px solid black;
    border-radius: 10px;
    font-size: 2em;
    transition: 0.25s all;
    cursor: pointer;
  }

  .login-form button:hover {
    transform: scale(1.05);
    transition: 0.25s all;
  }

  input {
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    align-content: center;
    text-align: center;
  }

  .contentPanel {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
</style>

<div class="contentPanel">
  <div class="login-form">
    <form name="form">
      <div class="form-group"><input type="password" placeholder="Passwort" bind:value /></div>
      <button on:click={login}>Login</button>
    </form>
  </div>
</div>
