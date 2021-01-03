<script>
  import Datepicker from "svelte-calendar/src/Components/Datepicker.svelte";
  import {
    saveParseStringToTimeMillis,
    saveParseTimestampToString,
  } from "../../utils/utils";

  const daysOfWeek = [
    ["Sonntag", "So"],
    ["Montag", "Mo"],
    ["Dienstag", "Di"],
    ["Mittwoch", "Mi"],
    ["Donnerstag", "Do"],
    ["Freitag", "Fr"],
    ["Samstag", "Sa"],
  ];
  const monthsOfYear = [
    ["Januar", "Jan"],
    ["Februar", "Feb"],
    ["März", "Mär"],
    ["April", "Apr"],
    ["Mai", "Mai"],
    ["Juni", "Jun"],
    ["Juli", "Jul"],
    ["August", "Aug"],
    ["September", "Sep"],
    ["Oktober", "Okt"],
    ["November", "Nov"],
    ["Dezember", "Dez"],
  ];

  function inTwoMonths() {
    const date = new Date();
    date.setMonth(date.getMonth() + 2);
    return date;
  }

  function clear() {
    isNone = true;
    dateChosen = false;
    selected = new Date();
  }

  export let calculate_from;
  export let quick_days = [];
  export let quick_weeks = [];
  export let quick_months = [];
  export let today = false;

  export let timeMillis;
  const TIMEZONE_OFFSET_MS = new Date().getTimezoneOffset() * 60000;

  let dateChosen = false;
  let isNone = !timeMillis || timeMillis === 0;
  let selected = isNone ? new Date() : new Date(timeMillis);

  function setToday() {
    let date = new Date();
    timeMillis = date.getTime();
  }

  function addDays(days) {
    if (calculate_from) {
      timeMillis = calculate_from + days * 60 * 60 * 24 * 1000;
    } else {
      let date = new Date();
      date.setDate(date.getDate() + days);
      timeMillis = date.getTime();
    }
  }

  $: dateChosen, (isNone = !dateChosen && isNone);
  $: timeMillis = isNone ? 0 : selected.getTime() - TIMEZONE_OFFSET_MS;
</script>

<style>
  input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
    cursor: pointer;
    background-color: white;
    color: black;
  }
  .clear {
    position: absolute;
    right: 10px;
    top: 11px;
    bottom: 11px;
    width: 20px;
    color: #c5cacf;
    cursor: pointer;
  }
  .clear:hover {
    color: #2c3e50;
  }
  .clear {
    color: #3f4f5f;
  }
  .button-tight {
    height: 1.5rem;
    font-size: smaller;
    line-height: 0.75rem;
    margin-top: 0.25rem;
  }
</style>

<Datepicker
  bind:selected
  bind:dateChosen
  weekStart={1}
  {daysOfWeek}
  {monthsOfYear}
  format={'#{d}.#{m}.#{Y}'}
  start={new Date(2018, 1, 1)}
  end={inTwoMonths()}>
  <input
    type="text"
    value={isNone ? '-' : saveParseTimestampToString(timeMillis)} />
  {#if !isNone}
    <div class="clear" on:click|stopPropagation={clear}>
      <svg
        width="100%"
        height="100%"
        viewBox="-2 -2 50 50"
        focusable="false"
        role="presentation">
        <path
          fill="currentColor"
          d="M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124
        l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z" />
      </svg>
    </div>
  {/if}
</Datepicker>

{#if today}
  <button class="button-tight" on:click={() => setToday()}>{today}</button>
{/if}

{#each quick_days as day}
  <button class="button-tight" on:click={() => addDays(day)}>+{day}D</button>
{/each}

{#each quick_weeks as week}
  <button
    class="button-tight"
    on:click={() => addDays(week * 7)}>+{week}W</button>
{/each}

{#each quick_months as month}
  <button
    class="button-tight"
    on:click={() => addDays(month * 7 * 4)}>+{month}M</button>
{/each}
