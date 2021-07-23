import { millisAtStartOfToday } from "../../utils/utils";
import Database from "../../database/ENV_DATABASE";

// initial values for new customers

export default {
  id: () => Database.nextUnusedId("customer"),
  registration_date: () => millisAtStartOfToday(),
  type: () => "customer",
  lastname: () => "",
  firstname: () => "",
  renewed_on: () => 0,
  remark: () => "",
  subscribed_to_newsletter: () => false,
  email: () => "",
  street: () => "",
  house_number: () => "",
  postal_code: () => "",
  city: () => "",
  telephone_number: () => "",
  heard: () => "",
  highlight: () => "",
};
