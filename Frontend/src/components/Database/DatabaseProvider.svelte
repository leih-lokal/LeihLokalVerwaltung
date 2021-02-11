<script>
  import { onMount, setContext } from "svelte";
  import Database from "ENV_DATABASE";

  const database = new Database();
  database.connect();
  setContext("getDatabase", () => database);
</script>

<slot />
