<script>
  import { getContext, setContext } from "svelte";

  const { open } = getContext("simple-modal");

  setContext("openStyledModal", (component, props, onClose) => {
    open(
      component,
      props,
      {
        closeButton: false,
        closeOnEsc: false,
        closeOnOuterClick: false,
        styleWindow: {
          width: "90%",
          "max-width": "950px",
          height: "80%",
          overflow: "hidden",
        },
        styleContent: {
          height: "100%",
        },
      },
      {
        onClose: onClose,
      }
    );
  });
</script>

<slot />
