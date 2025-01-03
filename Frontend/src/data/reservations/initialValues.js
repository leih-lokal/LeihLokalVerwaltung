import { millisAtStartOfToday } from "../../utils/utils";

// initial values for new reservations

export default {
  customer_iid: () => "",
  customer_name: () => "",
  customer_email: () => "",
  customer_phone: () => "",
  is_new_customer: () => false,
  pickup: () => new Date(),
  item_ids: () => '',
  done: () => false,
  comments: () => '',
};
