import { get } from "svelte/store";
import { customerDb, rentalDb, itemDb } from "../../utils/stores";
import { isToday, isBeforeToday, isBeforeDay } from "../../utils/utils";
import COLORS from "../Input/ColorDefs";

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
    cellBackgroundColorsFunction: async (customer, isEven) => {
      if (customer.highlight) {
        return new Array(customerColumns.length).fill(customer.highlight);
      } else {
        return isEven ? COLORS.EVEN_ROW_BACKGROUND_GREY : "white";
      }
    },
  },
  {
    columns: itemColumns,
    filters: itemFilters,
    getDatabase: () => get(itemDb),
    popupFormularComponent: ItemPopupFormular,
    cellBackgroundColorsFunction: async (item, isEven) => {
      if (item.highlight) {
        return new Array(itemColumns.length).fill(item.highlight);
      } else {
        return isEven ? COLORS.EVEN_ROW_BACKGROUND_GREY : "white";
      }
    },
  },
  {
    columns: rentalColumns,
    filters: rentalFilters,
    getDatabase: () => get(rentalDb),
    popupFormularComponent: RentalPopupFormular,
    cellBackgroundColorsFunction: async (rental, isEven) => {
      let item = {};
      let customer = {};
      try {
        item = await get(itemDb).fetchById(rental.item_id);
      } catch (e) {
        console.warn(e);
      }
      try {
        customer = await get(customerDb).fetchById(rental.customer_id);
      } catch (e) {
        console.warn(e);
      }
      return rentalColumns.map((col) => {
        if (item.highlight && ["item_id", "item_name"].includes(col.key)) {
          return item.highlight;
        } else if (customer.highlight && ["customer_id", "name"].includes(col.key)) {
          return customer.highlight;
        } else if (hasBeenReturnedToday(rental)) {
          return COLORS.RENTAL_RETURNED_TODAY_GREEN;
        } else if (shouldBeReturnedToday(rental)) {
          return COLORS.RENTAL_TO_RETURN_TODAY_BLUE;
        } else if (shouldHaveBeenReturnedBeforeToday(rental)) {
          return COLORS.RENTAL_LATE_RED;
        } else {
          return isEven ? COLORS.EVEN_ROW_BACKGROUND_GREY : "white";
        }
      });
    },
  },
];
