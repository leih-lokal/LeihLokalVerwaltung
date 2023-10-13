<script>
  import Button from "../../Input/Button.svelte";
  import LoadingAnimation from "../../LoadingAnimation.svelte";

  export let buttons = [];

  let loadingText;
</script>

{#if loadingText}
  <LoadingAnimation text={loadingText} color={"white"} fullScreenOverlay />
{/if}
<div class="footer">
  {#each buttons.filter((button) => !button.hidden) as button}
    <Button
      type="button"
      disabled={button.disabled ?? false}
      on:click={async (event) => {
        button.disabled = true;
        loadingText = button.loadingText;
        await button.onClick();
        loadingText = false;
        button.disabled = false;
      }}
      text={button.text}
      color={button.color ?? "blue"}
    />
  {/each}
</div>

<style>
  .footer {
    height: 2rem;
    padding: 0.5rem;
    margin: 0;
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
  }
</style>
