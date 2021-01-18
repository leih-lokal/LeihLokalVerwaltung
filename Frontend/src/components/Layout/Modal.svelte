<script>
  import Modal from "svelte-simple-modal";
  import StyledModal from "./StyledModal.svelte";
</script>

<Modal>
  <StyledModal>
    <slot />
  </StyledModal>
</Modal>
