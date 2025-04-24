// initial values for new customers

import { millisAtStartOfToday, millisAtStartOfDay } from "../../utils/utils";
import { getApiClient } from "../../utils/api";

const apiClient = getApiClient()

export default {
  iid: () => apiClient.getNextItemId(),
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
