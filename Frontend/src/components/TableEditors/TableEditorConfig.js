import { isToday, isBeforeToday, isBeforeDay } from "../../utils/utils";
import COLORS from "../Input/ColorDefs";
import Database from "../Database/ENV_DATABASE";

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

export default {
  customers: {
    docType: "customer",
    columns: customerColumns,
    filters: customerFilters,
    popupFormularComponent: CustomerPopupFormular,
    cellBackgroundColorsFunction: async (customer, isEven) => {
      if (customer.highlight) {
        return new Array(customerColumns.length).fill(customer.highlight);
      } else {
        return isEven
          ? new Array(customerColumns.length).fill(COLORS.DEFAULT_ROW_BACKGROUND_EVEN)
          : new Array(customerColumns.length).fill(COLORS.DEFAULT_ROW_BACKGROUND_ODD);
      }
    },
  },
  items: {
    docType: "item",
    columns: itemColumns,
    filters: itemFilters,
    popupFormularComponent: ItemPopupFormular,
    cellBackgroundColorsFunction: async (item, isEven) => {
      if (item.highlight) {
        return new Array(itemColumns.length).fill(item.highlight);
      } else {
        return isEven
          ? new Array(itemColumns.length).fill(COLORS.DEFAULT_ROW_BACKGROUND_EVEN)
          : new Array(itemColumns.length).fill(COLORS.DEFAULT_ROW_BACKGROUND_ODD);
      }
    },
  },
  rentals: {
    docType: "rental",
    columns: rentalColumns,
    filters: rentalFilters,
    popupFormularComponent: RentalPopupFormular,
    cellBackgroundColorsFunction: async (rental, isEven) => {
      let item = {};
      let customer = {};
      try {
        item = await Database.fetchItemById(rental.item_id);
      } catch (e) {
        console.warn(e);
      }
      try {
        customer = await Database.fetchCustomerById(rental.customer_id);
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
          return isEven ? COLORS.DEFAULT_ROW_BACKGROUND_EVEN : COLORS.DEFAULT_ROW_BACKGROUND_ODD;
        }
      });
    },
  },
};
