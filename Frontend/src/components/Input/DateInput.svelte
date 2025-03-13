<script>
  import DatePicker from "@beyonk/svelte-datepicker/src/components/DatePicker.svelte";
  import ClearInputButton from "./ClearInputButton.svelte";
  import {
    parseTimestampToString,
    millisAtStartOfDay,
    millisAtStartOfToday,
  } from "../../utils/utils";
  import { createEventDispatcher } from "svelte";
  import ButtonTight from "./ButtonTight.svelte";

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
  export let time = false;
  export let showAlertOnPastDateSelection = false;

  function addDays(days) {
    let date = new Date();
    date.setDate(date.getDate() + days);
    value = millisAtStartOfDay(date.getTime());
  }
</script>

{#if disabled}
  <input
    type="text"
    value={value === 0 ? "-" : parseTimestampToString(value, time)}
    disabled={true}
  />
{:else}
  <div>
    <DatePicker
      selected={value === 0 ? new Date() : new Date(value)}
      on:date-selected={(event) => {
        const date = event.detail.date;

        if (time) {
          value = date;
          dispatch("change", date);
          if (showAlertOnPastDateSelection && date < new Date()) {
            alert(
              "Achtung: Dieses Datum liegt in der Vergangenheit, bitte prüfe ob es korrekt ist.",
            );
          }
        } else {
          const newTimeMillis =
            date.getTime() - getTimeZoneOffsetMs(date.getTime());
          if (millisAtStartOfDay(value) !== millisAtStartOfDay(newTimeMillis)) {
            value = millisAtStartOfDay(newTimeMillis);
            dispatch("change", date);
          }
          if (
            showAlertOnPastDateSelection &&
            millisAtStartOfDay(newTimeMillis) < millisAtStartOfToday()
          ) {
            alert(
              "Achtung: Dieses Datum liegt in der Vergangenheit, bitte prüfe ob es korrekt ist.",
            );
          }
        }
      }}
      {time}
      format={"DD.MM.YYYY HH:mm"}
      start={new Date(2018, 1, 1)}
      end={inTwoMonths()}
      minuteStep={10}
      continueText={"Auswählen"}
      class="datetime-picker"
    >
      <input
        type="text"
        value={value === 0 ? "-" : parseTimestampToString(value, time)}
      />
      <ClearInputButton
        on:click={() => {
          value = 0;
          dispatch("change", undefined);
        }}
        visible={value !== 0}
      />
    </DatePicker>
  </div>
{/if}

{#each Object.entries(quickset) as [days, text]}
  <ButtonTight {text} on:click={() => addDays(parseInt(days))} />
{/each}

<style>
  :global(.calendar input) {
    letter-spacing: 8px !important;
  }

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
</style>
