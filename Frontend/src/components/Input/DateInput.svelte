<script>
  import Datepicker from "svelte-calendar/src/Components/Datepicker.svelte";
  import { saveParseStringToTimeMillis, saveParseTimestampToString } from "../../utils/utils";

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

  export let timeMillis;

  let isNone = !timeMillis || timeMillis === 0;
  let selected = isNone ? new Date() : new Date(timeMillis);
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
</style>

<Datepicker
  bind:selected
  {daysOfWeek}
  {monthsOfYear}
  format={'#{d}.#{m}.#{Y}'}
  start={new Date(2018, 1, 1)}
  end={inTwoMonths()}>
  <input
    type="text"
    value={isNone ? '-' : saveParseTimestampToString(timeMillis)}
    on:click={() => {
      if (isNone) {
        timeMillis = new Date().getTime();
        isNone = false;
      }
    }} />
</Datepicker>
