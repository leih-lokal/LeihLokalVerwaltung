<script>
  import DatePicker from "@beyonk/svelte-datepicker/src/components/DatePicker.svelte";
  import ClearInputButton from "./ClearInputButton.svelte";
  import {
    saveParseTimestampToString,
    millisAtStartOfDay,
  } from "../../utils/utils";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  const getTimeZoneOffsetMs = (millis = new Date().getTime()) => {
    return new Date(millis).getTimezoneOffset() * 60000;
  };

  function inTwoMonths() {
    const date = new Date();
    date.setMonth(date.getMonth() + 2);
    return date;
  }
  export let quickset = {};
  export let value = 0;
  export let disabled = false;

  function addDays(days) {
    let date = new Date();
    date.setDate(date.getDate() + days);
    value = millisAtStartOfDay(date.getTime());
  }
</script>

{#if disabled}
  <input
    type="text"
    value={value === 0 ? "-" : saveParseTimestampToString(value)}
    disabled={true}
  />
{:else}
  <DatePicker
    selected={value === 0 ? new Date() : new Date(value)}
    on:date-selected={(event) => {
      const date = event.detail.date;
      const newTimeMillis =
        date.getTime() - getTimeZoneOffsetMs(date.getTime());
      if (millisAtStartOfDay(value) !== millisAtStartOfDay(newTimeMillis)) {
        value = millisAtStartOfDay(newTimeMillis);
        dispatch("change", date);
      }
    }}
    weekStart={1}
    format={"#{d}.#{m}.#{Y}"}
    start={new Date(2018, 1, 1)}
    end={inTwoMonths()}
    continueText={"Speichern"}
  >
    <input
      type="text"
      value={value === 0 ? "-" : saveParseTimestampToString(value)}
    />
    <ClearInputButton
      on:click={() => {
        value = 0;
        dispatch("change", undefined);
      }}
      visible={value !== 0}
    />
  </DatePicker>
{/if}

{#each Object.entries(quickset) as [days, label]}
  <button class="button-tight" on:click={() => addDays(parseInt(days))}
    >{label}</button
  >
{/each}

<style>
  input {
    width: 100%;
    padding: 0.2rem 0.7rem 0.2rem 0.7rem;
    height: 2rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
    cursor: pointer;
    background-color: white;
    color: black;
  }
  input[disabled] {
    color: #dcdad1;
    background-color: rgba(239, 239, 239, 0.3);
  }
  .button-tight {
    height: 1.5rem;
    font-size: smaller;
    line-height: 0.75rem;
    margin-top: 0.25rem;
    margin-left: 0.1rem;
  }
</style>
