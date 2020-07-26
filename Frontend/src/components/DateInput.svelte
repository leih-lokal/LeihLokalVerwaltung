<script>
  import Datepicker from "svelte-calendar";
  import { saveParseDateToString } from "../utils/utils.js";
  import { onMount } from "svelte";

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

  function inOneMonth() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
  }

  export let selected = saveParseDateToString(new Date());
  let userHasChosenDate;

  // TODO: update selected date when text input changes
  let dateInputFromDatePicker;

  // TODO: auto complete text input, for example 7.8. -> 07.08.2020

  $: if (userHasChosenDate) {
    userHasChosenDate = false;
    selected = saveParseDateToString(dateInputFromDatePicker);
  }
</script>

<style>
  .button {
    background-color: #0066ff77;
    color: black;
    border: 1px solid #ccc;
    cursor: pointer;
    padding: 10px;
  }

  input {
    width: 50%;
    float: right;
    padding: 12px;
  }
  .datepicker {
    width: 25%;
    float: left;
    text-align: center;
  }
</style>

<div class="container">
  <div class="datepicker">
    <Datepicker
      bind:selected={dateInputFromDatePicker}
      bind:dateChosen={userHasChosenDate}
      {daysOfWeek}
      {monthsOfYear}
      start={new Date(2018, 1, 1)}
      end={inOneMonth()}>
      <div class="button">Kalender</div>
    </Datepicker>
  </div>
  <input type="text" bind:value={selected} />

</div>
