<script>
  import Button from "../Button.svelte";

  export let buttons = [];
</script>

<div class="footer">
  {#each buttons.filter((button) => !button.hidden) as button}
    <Button on:click|once={button.onClick} text={button.text} color={button.color ?? "blue"} />
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
