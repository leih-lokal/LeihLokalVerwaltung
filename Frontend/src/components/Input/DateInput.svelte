<script>
  import Datepicker from "svelte-calendar";
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
  }

  export let selectedDateString;

  let isNone =
    !selectedDateString || selectedDateString == "" || selectedDateString === "01.01.1970";
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
  selected={new Date(saveParseStringToTimeMillis(selectedDateString))}
  bind:formattedSelected={selectedDateString}
  {daysOfWeek}
  {monthsOfYear}
  format={'#{d}.#{m}.#{Y}'}
  start={new Date(2018, 1, 1)}
  end={inTwoMonths()}>
  <input
    type="text"
    value={isNone ? '-' : selectedDateString}
    on:click|once={() => {
      if (isNone) {
        selectedDateString = saveParseTimestampToString(new Date().getTime());
        isNone = false;
      }
    }} />
</Datepicker>
