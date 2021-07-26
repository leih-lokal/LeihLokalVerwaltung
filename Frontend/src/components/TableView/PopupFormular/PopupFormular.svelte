<script>
  import Modal, { bind } from "svelte-simple-modal";
  import { writable } from "svelte/store";
  import Formular from "./Formular.svelte";

  const modal = writable();
  let onClose;

  export function show(props, onCloseCallback = () => {}) {
    props["closePopup"] = () => modal.set(null);
    onClose = onCloseCallback;
    modal.set(bind(Formular, props));
  }
</script>

<Modal
  on:close={onClose}
  show={$modal}
  closeButton={false}
  closeOnEsc={true}
  closeOnOuterClick={false}
  styleWindow={{
    width: "60rem",
    "max-width": "90%",
    height: "90%",
    overflow: "hidden",
  }}
  styleContent={{
    height: "100%",
    padding: 0,
    overflow: "hidden",
    margin: 0,
  }}
/>
