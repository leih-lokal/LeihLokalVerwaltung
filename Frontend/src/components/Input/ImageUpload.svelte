<script>
  // very hacky and unfinished implementation of an image upload
  // currently only support to choose a single image
  // also, only supports to replace the image with a new one, but not to remove it

  export let id = "";
  export let value = []; // input is an array of urls, output is a FileList, hacky hack hack...
  export let disabled = false;
  export let required = false;
  export let height = "80px";

  let allowedTypes = ["image/png", "image/jpeg", "image/webp"];

  $: isDirty = value instanceof FileList;
</script>

<div>
  <input
    type="file"
    bind:files={value}
    name={id}
    {disabled}
    {required}
    accept={allowedTypes}
    on:input={(event) => {}}
  />

  {#if value && !isDirty}
    <div id="image-container">
      {#each value as url}
        <img src={url} {height} />
      {/each}
    </div>
  {/if}
</div>

<style>
  #image-container {
    margin-top: 20px;
  }
</style>
