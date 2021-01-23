import { get } from "svelte/store";
import { customerDb, rentalDb, itemDb } from "../../utils/stores";
import { isToday, isBeforeToday, isBeforeDay } from "../../utils/utils";

import CustomerPopupFormular from "./Customers/CustomerPopupFormular.svelte";
import customerColumns from "./Customers/Columns.js";
import customerFilters from "./Customers/Filters.js";

import ItemPopupFormular from "./Items/ItemPopupFormular.svelte";
import itemColumns from "./Items/Columns.js";
import itemFilters from "./Items/Filters.js";

import RentalPopupFormular from "./Rentals/RentalPopupFormular.svelte";
import rentalColumns from "./Rentals/Columns.js";
import rentalFilters from "./Rentals/Filters.js";

const hasBeenReturnedToday = (rental) => rental.returned_on && isToday(rental.returned_on);
const shouldBeReturnedToday = (rental) =>
  rental.to_return_on && isToday(rental.to_return_on) && !rental.returned_on;
const shouldHaveBeenReturnedBeforeToday = (rental) =>
  rental.to_return_on &&
  ((!rental.returned_on && isBeforeToday(rental.to_return_on)) ||
    (rental.returned_on && isBeforeDay(rental.to_return_on, rental.returned_on)));

export default [
  {
    columns: customerColumns,
    filters: customerFilters,
    getDatabase: () => get(customerDb),
    popupFormularComponent: CustomerPopupFormular,
    cellBackgroundColorsFunction: async (customer) =>
      new Array(customerColumns.length).fill(customer.highlight ?? "white"),
  },
  {
    columns: itemColumns,
    filters: itemFilters,
    getDatabase: () => get(itemDb),
    popupFormularComponent: ItemPopupFormular,
    cellBackgroundColorsFunction: async (item) =>
      new Array(itemColumns.length).fill(item.highlight ?? "white"),
  },
  {
    columns: rentalColumns,
    filters: rentalFilters,
    getDatabase: () => get(rentalDb),
    popupFormularComponent: RentalPopupFormular,
    cellBackgroundColorsFunction: async (rental) => {
      const item = await get(itemDb).fetchById(rental.item_id);
      const customer = await get(customerDb).fetchById(rental.customer_id);
      return rentalColumns.map((col) => {
        if (item.highlight && ["item_id", "item_name"].includes(col.key)) {
          return item.highlight;
        } else if (customer.highlight && ["customer_id", "name"].includes(col.key)) {
          return customer.highlight;
        } else if (hasBeenReturnedToday(rental)) {
          return "rgb(214,252,208)";
        } else if (shouldBeReturnedToday(rental)) {
          return "rgb(160,200,250)";
        } else if (shouldHaveBeenReturnedBeforeToday(rental)) {
          return "rgb(240,200,200)";
        } else {
          return "white";
        }
      });
    },
  },
];
