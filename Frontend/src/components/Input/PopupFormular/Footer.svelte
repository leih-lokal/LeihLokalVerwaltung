<script>
  import Button from "../Button.svelte";

  export let buttons = [];
</script>

<div class="footer">
  {#each buttons.filter((button) => !button.hidden) as button}
    <Button
      disabled={button.disabled ?? false}
      on:click={async (event) => {
        button.disabled = true;
        await button.onClick();
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
