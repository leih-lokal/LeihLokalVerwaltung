<script>
  import { getContext, setContext } from "svelte";

  const { open } = getContext("simple-modal");

  setContext("openStyledModal", (component, props, onClose) => {
    open(
      component,
      props,
      {
        closeButton: false,
        closeOnEsc: true,
        closeOnOuterClick: false,
        styleWindow: {
          width: "60rem",
          "max-width": "90%",
          height: "90%",
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
