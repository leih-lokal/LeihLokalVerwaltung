import { millisAtStartOfToday } from "../../utils/utils";

// initial values for new customers
// async functions for lazy loading

export default {
  added: async () => millisAtStartOfToday(),
  status: async () => "instock",
  type: async () => "item",
  name: async () => "",
  brand: async () => "",
  itype: async () => "",
  category: async () => "",
  deposit: async () => "",
  parts: async () => "",
  exists_more_than_once: async () => false,
  manual: async () => "",
  package: async () => "",
  wc_url: async () => "",
  wc_id: async () => "",
  image: async () => "",
  highlight: async () => "",
  synonyms: async () => "",
  description: async () => "",
};
