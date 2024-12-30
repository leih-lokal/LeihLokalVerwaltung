import customerColumns from "./customer/columns";
import customerInputs from "./customer/inputs";
import customerFilters from "./customer/filters";
import customerDataHooks from "./customer/dataHooks"

import itemColumns from "./item/columns";
import itemInputs from "./item/inputs";
import itemFilters from "./item/filters";
import itemDataHooks from "./item/dataHooks";

import rentalColumns from "./rental/columns";
import rentalInputs from "./rental/inputs";
import rentalFilters from "./rental/filters";
import rentalDataHooks from "./rental/dataHooks";

import reservationColumns from "./reservations/columns";
import reservationFilters from "./reservations/filters";
import * as reservationAdapter from "./reservations/adapter";

export default [
  {
    route: "/customers",
    inputs: customerInputs,
    columns: customerColumns,
    filters: customerFilters,
    docType: "customer",
    title: "Nutzer:innen",
    onData: customerDataHooks.onDataLoaded,
  },
  {
    route: "/items",
    inputs: itemInputs,
    columns: itemColumns,
    filters: itemFilters,
    docType: "item",
    title: "Gegenstände",
    onData: itemDataHooks.onDataLoaded,
  },
  {
    route: "/rentals",
    inputs: rentalInputs,
    columns: rentalColumns,
    filters: rentalFilters,
    docType: "rental",
    title: "Leihvorgänge",
    onData: rentalDataHooks.onDataLoaded,
  },
  {
    route: "/reservations",
    columns: reservationColumns,
    filters: reservationFilters,
    title: "Reservierungen",
    adapter: reservationAdapter,
  }
];
