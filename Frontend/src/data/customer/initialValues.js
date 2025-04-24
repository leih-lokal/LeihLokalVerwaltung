import { millisAtStartOfToday } from "../../utils/utils";
import Database from "../../database/ENV_DATABASE";

// initial values for new customers

export default {
  id: () => Database.nextUnusedId("customer"),
  registered_on: () => millisAtStartOfToday(),
  lastname: () => "",
  firstname: () => "",
  renewed_on: () => 0,
  remark: () => "",
  newsletter: () => false,
  email: () => "",
  street: () => "",
  postal_code: () => "",
  city: () => "",
  phone: () => "",
  heard: () => "",
  highlight_color: () => "",
};
