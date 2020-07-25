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
    date.setDate(date.getMonth() + 1);
  }

  function onTextInput(event) {
    const date = new Date(event.target.value);
    console.log(date);
    if (!isNaN(date)) selected = date;
  }

  export let selected = new Date();
  export let userHasChosenDate;

  let formattedSelected;

  /**
  $: if (userHasChosenDate) {
    selectedString = saveParseDateToString(selected);
    userHasChosenDate = false;
  }**/
  onMount(() => (formattedSelected = saveParseDateToString(selected)));
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
      bind:selected
      bind:formattedSelected
      bind:dateChosen={userHasChosenDate}
      {daysOfWeek}
      {monthsOfYear}
      start={new Date(2018, 1, 1)}
      end={inOneMonth()}
      format={'#{d}.#{m}.#{Y}'}>
      <div class="button">Kalender</div>
    </Datepicker>
  </div>
  <input type="text" on:blur={onTextInput} value={formattedSelected} />

</div>
