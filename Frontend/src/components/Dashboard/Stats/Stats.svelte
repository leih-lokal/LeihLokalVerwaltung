<script>
  import Line from "svelte-chartjs/src/Line.svelte";
  import LoadingAnimation from "../../LoadingAnimation.svelte";
  import { getApiClient } from "../../../utils/api";

  const apiClient = getApiClient();

  function monthDiff(d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
  }

  function cache(stats) {
    localStorage.setItem(
      "stats",
      JSON.stringify({ timestamp: new Date().getTime(), stats }),
    );
  }

  function loadFromCache() {
    const statsFromCache = JSON.parse(localStorage.getItem("stats"));
    if (
      statsFromCache !== null &&
      monthDiff(new Date(statsFromCache.timestamp), new Date()) === 0
    )
      return statsFromCache.stats;
    return false;
  }

  async function calcStats() {
    const cachedStats = loadFromCache();
    if (cachedStats) {
      return cachedStats;
    }

    const statsData = await apiClient.getStats();
    const newCustomersCountData = statsData["new_customers_count"];
    const activeCustomersCountData = statsData["active_customers_count"];
    const rentalsCountData = statsData["rentals_count"];
    const totalItemsData = statsData["total_items"];

    const labels = Object.keys(newCustomersCountData); // all series have the same set of labels

    let newCustomersCount = Object.values(newCustomersCountData);
    let activeCustomersCount = Object.values(activeCustomersCountData);
    let rentalsCount = Object.values(rentalsCountData);
    let totalItems = Object.values(totalItemsData);

    // replace zeros by interpolating with latest previous value for cumulative sum
    // fill forward
    for (let i = 1; i < totalItems.length; i++) {
      if (totalItems[i] === 0) totalItems[i] = totalItems[i - 1];
    }
    // fill backward
    for (let i = totalItems.length - 1; i >= 0; i--) {
      if (totalItems[i] === 0) totalItems[i] = totalItems[i + 1];
    }

    const stats = {
      labels,
      datasets: [
        {
          label: "Aktive Nutzer:innen (innerhalb der letzten 3 Monate)",
          fill: true,
          lineTension: 0.3,
          backgroundColor: "rgba(184, 185, 210, .3)",
          borderColor: "rgb(35, 26, 136)",
          borderCapStyle: "butt",
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: "miter",
          pointBorderColor: "rgb(35, 26, 136)",
          pointBackgroundColor: "rgb(255, 255, 255)",
          pointBorderWidth: 10,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgb(0, 0, 0)",
          pointHoverBorderColor: "rgba(220, 220, 220, 1)",
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: activeCustomersCount,
        },
        {
          label: "Anzahl Ausleihen",
          fill: true,
          lineTension: 0.3,
          backgroundColor: "rgba(225, 204,230, .3)",
          borderColor: "rgb(205, 130, 158)",
          borderCapStyle: "butt",
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: "miter",
          pointBorderColor: "rgb(205, 130, 158)",
          pointBackgroundColor: "rgb(255, 255, 255)",
          pointBorderWidth: 10,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgb(0, 0, 0)",
          pointHoverBorderColor: "rgba(220, 220, 220,1)",
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: rentalsCount,
        },
        {
          label: "Neue Nutzer:innen",
          fill: true,
          lineTension: 0.3,
          backgroundColor: "rgba(71, 225, 167, 0.3)",
          borderColor: "rgb(71, 225, 167)",
          borderCapStyle: "butt",
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: "miter",
          pointBorderColor: "rgb(71, 225, 167)",
          pointBackgroundColor: "rgb(255, 255, 255)",
          pointBorderWidth: 10,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgb(0, 0, 0)",
          pointHoverBorderColor: "rgba(220, 220, 220,1)",
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: newCustomersCount,
        },
        {
          label: "Anzahl Gegenstände",
          fill: true,
          spanGaps: true,
          lineTension: 0.3,
          backgroundColor: "rgba(189, 224, 254, 0.3)",
          borderColor: "rgb(189, 224, 254)",
          borderCapStyle: "butt",
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: "miter",
          pointBorderColor: "rgb(189, 224, 254)",
          pointBackgroundColor: "rgb(255, 255, 255)",
          pointBorderWidth: 10,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgb(0, 0, 0)",
          pointHoverBorderColor: "rgba(220, 220, 220,1)",
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: totalItems,
        },
      ],
    };

    cache(stats);
    return stats;
  }
</script>

<div class="statscontainer">
  <div class="statscontainerheader">Statistiken</div>
  {#await calcStats()}
    <LoadingAnimation positionFixed={false} />
  {:then stats}
    <Line
      data={stats}
      options={{
        scales: {
          x: {
            ticks: {
              font: {
                size: 18,
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 18,
              },
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: {
                size: 14,
              },
            },
          },
        },
      }}
    />
  {:catch error}
    <p class="error">Statistiken konnten nicht geladen werden :(</p>
  {/await}
</div>

<style>
  .statscontainer {
    background-color: white;
    padding: 1rem 1rem 1rem 1rem;
  }
  .statscontainerheader {
    font-size: 1.7rem;
    font-weight: bold;
    padding-bottom: 1rem;
  }
</style>
