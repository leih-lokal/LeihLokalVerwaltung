<script>
  export let backgroundColor = "white";
  export let isImage = false;
  export let safeHtml = false;
  export let valueFunction = async () => "";
  export let rowHeight = 40;

  let fontColor = "black";

  function brightnessByColor(color) {
    var color = "" + color,
      isHEX = color.indexOf("#") == 0,
      isRGB = color.indexOf("rgb") == 0;
    if (isHEX) {
      var m = color
        .substr(1)
        .match(color.length == 7 ? /(\S{2})/g : /(\S{1})/g);
      if (m)
        var r = parseInt(m[0], 16),
          g = parseInt(m[1], 16),
          b = parseInt(m[2], 16);
    }
    if (isRGB) {
      var m = color.match(/rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/);
      if (m)
        var r = m[1],
          g = m[2],
          b = m[3];
    }
    if (typeof r != "undefined") return (r * 299 + g * 587 + b * 114) / 1000;
  }

  $: if (brightnessByColor(backgroundColor) < 125) {
    fontColor = "white"; // adaptive font color for darker highlight
  }
</script>

<td
  style={`background-color: ${backgroundColor}; color: ${fontColor}; height: ${rowHeight}px;`}
>
  {#await valueFunction() then value}
    {#if isImage}
      {#if value && value !== ""}
        <img src={value} alt="item" class="cell-image" />
      {/if}
    {:else}
      <div class="cell" style={`max-height: ${rowHeight}px;`}>
        {#if safeHtml}
          {@html value}
        {:else}
          {value}
        {/if}
      </div>
    {/if}
  {/await}
</td>

<style>
  .cell {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  img {
    height: 100%;
    display: block;
  }

  td:hover > img {
    height: 50vh;
    position: fixed;
    left: 25vw;
    top: 25vh;
    z-index: 1;
    aspect-ratio: auto;
  }

  td {
    cursor: pointer;
    padding: 0px;
    padding-left: 2px;
    padding-right: 2px;
  }

  .cell-image {
    aspect-ratio: 1 / 1;
  }
</style>
