<script>
  export let text;
  export let color = "blue";
</script>

<button on:click style="--color: var(--{color})">{text}</button>

<style>
  button {
    background-color: var(--color);
    border: none;
    border-radius: 4px;
    color: white;
    padding: 0.2rem 0.4rem;
    text-align: center;
    text-decoration: none;
    font-size: 1.2rem;
    cursor: pointer;
  }

  button:hover {
    transition: 0.25s all;
    transform: scale(1.02);
  }
</style>
