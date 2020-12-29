<script>
    import { createEventDispatcher } from "svelte";

    export let id = "";
    export let readonly = false;
    export let bindToObject;
    export let bindValueToObjectAttr;

    const dispatch = createEventDispatcher();
</script>

<style>
    input[type="text"] {
        width: 100% !important;
        padding: 0.5rem !important;
        border: 1px solid #ccc !important;
        border-radius: 4px !important;
        resize: vertical !important;
        height: 2.5rem !important;
    }
</style>

<form autocomplete="off">
    <input
        type="text"
        bind:value={bindToObject[bindValueToObjectAttr]}
        {id}
        name={id}
        {readonly}
        on:input={(event) => dispatch('change', event.target.value)} />
</form>
