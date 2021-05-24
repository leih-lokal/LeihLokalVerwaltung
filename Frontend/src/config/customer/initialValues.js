import { millisAtStartOfToday } from "../../utils/utils";
import Database from "../../components/Database/ENV_DATABASE";

// initial values for new customers
// async functions for lazy loading

export default {
  id: () => Database.nextUnusedId("customer"),
  registration_date: async () => millisAtStartOfToday(),
  type: async () => "customer",
  lastname: async () => "",
  firstname: async () => "",
  renewed_on: async () => 0,
  remark: async () => "",
  subscribed_to_newsletter: async () => false,
  email: async () => "",
  street: async () => "",
  house_number: async () => "",
  postal_code: async () => "",
  city: async () => "",
  telephone_number: async () => "",
  heard: async () => "",
  highlight: async () => "",
};
