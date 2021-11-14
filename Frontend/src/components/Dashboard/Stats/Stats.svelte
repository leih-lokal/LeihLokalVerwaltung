<script>
  import Line from "svelte-chartjs/src/Line.svelte";
  import Database from "../../../database/ENV_DATABASE";
  import LoadingAnimation from "../../LoadingAnimation.svelte";

  function startOfMonthMs(timestamp) {
    const date = new Date(timestamp);
    return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  }

  function addMonths(timestamp, monthsCount) {
    const date = new Date(timestamp);
    date.setMonth(date.getMonth() + monthsCount);
    return date.getTime();
  }

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
      JSON.stringify({ timestamp: new Date().getTime(), stats })
    );
  }

  function loadFromCache() {
    const statsFromCache = JSON.parse(localStorage.getItem("stats"));
    if (
      statsFromCache !== null &&
      monthDiff(new Date(statsFromCache.timestamp), new Date()) === 0
    ) {
      return statsFromCache.stats;
    }
    return false;
  }

  const calcStats = async () => {
    let cachedStats = loadFromCache();
    if (cachedStats) {
      return cachedStats;
    }

    let rentals = await Database.findCached({
      fields: ["customer_id", "rented_on", "returned_on"],
      limit: 1_000_000,
      selector: Database.selectorBuilder()
        .withDocType("rental")
        .withAny(
          Database.selectorBuilder()
            .withField("returned_on")
            .greaterThan(0)
            .withField("rented_on")
            .greaterThan(0)
            .buildSelectors()
        )
        .build(),
    }).then((result) =>
      result.docs.map((doc) => ({
        customer_id: doc["customer_id"],
        timestamp: doc["returned_on"] ? doc["returned_on"] : doc["rented_on"],
      }))
    );

    let customers = await Database.findCached({
      fields: ["registration_date"],
      limit: 1_000_000,
      selector: Database.selectorBuilder().withDocType("customer").build(),
    }).then((result) => result.docs);

    const timestampLiesInMonthsBefore = (timestamp, before, monthCount) =>
      timestamp < before && timestamp >= addMonths(before, monthCount * -1);

    const monthYearString = (timestamp) => {
      return new Date(timestamp).toLocaleString("de-DE", {
        month: "short",
        year: "2-digit",
      });
    };

    const CURRENT_MS = new Date().getTime();
    const ACTIVE_CUSTOMER_TIMEOUT_MONTHS = 3;
    const activeCustomerCountsPerMonth = [];
    const numberOfRentalsCountsPerMonth = [];
    const newCustomerCountsPerMonth = [];
    const labels = [];

    for (
      let monthsAgo = monthDiff(new Date(2018, 11), new Date()) + 1;
      monthsAgo >= 0;
      monthsAgo--
    ) {
      // timestamp n months ago
      const timestampNMonthsAgo = startOfMonthMs(
        addMonths(CURRENT_MS, monthsAgo * -1)
      );

      const activeCustomerCount = rentals
        // at least one rental during ACTIVE_CUSTOMER_TIMEOUT at time timestampNMonthsAgo
        .filter((rental) =>
          timestampLiesInMonthsBefore(
            rental.timestamp,
            timestampNMonthsAgo,
            ACTIVE_CUSTOMER_TIMEOUT_MONTHS
          )
        )
        .map((rental) => rental.customer_id)
        // unique customer ids
        .filter((v, i, a) => a.indexOf(v) === i).length;

      // number of rentals in month of timestampNMonthsAgo
      const rentalCount = rentals.filter((rental) =>
        timestampLiesInMonthsBefore(rental.timestamp, timestampNMonthsAgo, 1)
      ).length;

      const newCustomerCount = customers.filter((customer) =>
        timestampLiesInMonthsBefore(
          customer.registration_date,
          timestampNMonthsAgo,
          1
        )
      ).length;

      labels.push(monthYearString(addMonths(timestampNMonthsAgo, -1)));
      activeCustomerCountsPerMonth.push(activeCustomerCount);
      numberOfRentalsCountsPerMonth.push(rentalCount);
      newCustomerCountsPerMonth.push(newCustomerCount);
    }

    let stats = {
      labels,
      datasets: [
        {
          label: "Aktive Nutzer (innerhalb der letzten 3 Monate)",
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
          data: activeCustomerCountsPerMonth,
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
          data: numberOfRentalsCountsPerMonth,
        },
        {
          label: "Neue Nutzer",
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
          data: newCustomerCountsPerMonth,
        },
      ],
    };
    cache(stats);
    return stats;
  };

  calcStats();
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
