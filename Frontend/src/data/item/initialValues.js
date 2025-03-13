// initial values for new customers

import { getApiClient } from "../../utils/api";

const apiClient = getApiClient()

export default {
  iid: () => apiClient.getNextItemId(),
  status: () => "instock",
  name: () => "",
  brand: () => "",
  model: () => "",
  category: () => "",
  deposit: () => "",
  parts: () => "",
  copies: () => 1,
  manual: () => "",
  packaging: () => "",
  images: () => [],
  highlight_color: () => "",
  synonyms: () => "",
  description: () => "",
};
