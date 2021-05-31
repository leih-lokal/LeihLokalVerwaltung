import { millisAtStartOfToday, millisAtStartOfDay } from "../../utils/utils";

// initial values for new customers
// async functions for lazy loading

export default {
  rented_on: async () => millisAtStartOfToday(),
  to_return_on: async () =>
    millisAtStartOfDay(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
  returned_on: async () => 0,
  extended_on: async () => 0,
  type: async () => "rental",
  image: async () => "",
  item_id: async () => "",
  item_name: async () => "",
  customer_id: async () => "",
  customer_name: async () => "",
  passing_out_employee: async () => "",
  receiving_employee: async () => "",
  deposit: async () => "",
  deposit_returned: async () => "",
  remark: async () => "",
};
