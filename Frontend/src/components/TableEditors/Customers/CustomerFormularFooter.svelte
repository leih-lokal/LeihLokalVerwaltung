<script>
  import Footer from "../../Input/PopupFormular/Footer.svelte";
  import Database from "../../Database/ENV_DATABASE";
  import { notifier } from "@beyonk/svelte-notifications";

  export let customerDoc = {};
  export let createNew = false;
  export let closePopup = () => {};
</script>

<Footer
  displayDeleteButton={!createNew}
  on:delete={(event) => {
    if (confirm("Soll dieser Kunde wirklich gelöscht werden?")) {
      Database.removeDoc(customerDoc)
        .then(() => notifier.success("Kunde gelöscht!"))
        .then(closePopup)
        .catch((error) => {
          console.error(error);
          notifier.danger("Kunde konnte nicht gelöscht werden!", 6000);
        });
    }
  }}
  on:save={(event) => {
    closePopup();
    const savePromise = createNew
      ? Database.createDoc(customerDoc)
      : Database.updateDoc(customerDoc);

    savePromise
      .then((result) => notifier.success("Kunde gespeichert!"))
      .catch((error) => {
        notifier.danger("Kunde konnte nicht gespeichert werden!", 6000);
        console.error(error);
      });
  }}
  on:cancel={closePopup}
/>
