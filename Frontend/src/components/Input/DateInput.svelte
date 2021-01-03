<script>
  import Datepicker from "svelte-calendar/src/Components/Datepicker.svelte";
  import ClearInputButton from "./ClearInputButton.svelte";
  import { saveParseTimestampToString } from "../../utils/utils";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

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
  const TIMEZONE_OFFSET_MS = new Date().getTimezoneOffset() * 60000;

  function inTwoMonths() {
    const date = new Date();
    date.setMonth(date.getMonth() + 2);
    return date;
  }

  export let timeMillis = 0;
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
  }</script>

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
  .button-tight {
    height: 1.5rem;
    font-size: smaller;
    line-height: 0.75rem;
    margin-top: 0.25rem;
  }
</style>

<Datepicker
  selected={timeMillis === 0 ? new Date() : new Date(timeMillis)}
  on:dateSelected={(event) => {
    const date = event.detail.date;
    const newTimeMillis = date.getTime() - TIMEZONE_OFFSET_MS;
    if (timeMillis !== newTimeMillis) {
      timeMillis = newTimeMillis;
      dispatch('change', date);
    }
  }}
  weekStart={1}
  {daysOfWeek}
  {monthsOfYear}
  format={'#{d}.#{m}.#{Y}'}
  start={new Date(2018, 1, 1)}
  end={inTwoMonths()}>
  <input
    type="text"
    value={timeMillis === 0 ? '-' : saveParseTimestampToString(timeMillis)} />
  <ClearInputButton
    on:click={() => {
      timeMillis = 0;
      dispatch('change', undefined);
    }}
    visible={timeMillis !== 0} />
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
