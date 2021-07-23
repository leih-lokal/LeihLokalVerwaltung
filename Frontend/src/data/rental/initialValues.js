import { millisAtStartOfToday, millisAtStartOfDay } from "../../utils/utils";

// initial values for new customers

export default {
  rented_on: () => millisAtStartOfToday(),
  to_return_on: () =>
    millisAtStartOfDay(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
  returned_on: () => 0,
  extended_on: () => 0,
  type: () => "rental",
  image: () => "",
  item_id: () => "",
  item_name: () => "",
  customer_id: () => "",
  customer_name: () => "",
  passing_out_employee: () => "",
  receiving_employee: () => "",
  deposit: () => "",
  deposit_returned: () => "",
  remark: () => "",
};
