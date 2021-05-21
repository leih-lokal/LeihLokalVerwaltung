<script>
  import Modal, { bind } from "svelte-simple-modal";
  import { writable } from "svelte/store";
  import Formular from "./Formular.svelte";

  const modal = writable();

  export function show(props) {
    props["closePopup"] = () => modal.set(null);
    modal.set(bind(Formular, props));
  }
</script>

<Modal
  show={$modal}
  closeButton={false}
  closeOnEsc={true}
  closeOnOuterClick={false}
  styleWindow={{ width: "60rem", "max-width": "90%", height: "90%", overflow: "hidden" }}
  styleContent={{
    height: "100%",
  }}
/>
