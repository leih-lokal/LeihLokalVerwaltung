import { millisAtStartOfToday } from "../../utils/utils";

// initial values for new customers

export default {
  added: () => millisAtStartOfToday(),
  status: () => "instock",
  type: () => "item",
  name: () => "",
  brand: () => "",
  itype: () => "",
  category: () => "",
  deposit: () => "",
  parts: () => "",
  exists_more_than_once: () => false,
  manual: () => "",
  package: () => "",
  wc_url: () => "",
  wc_id: () => "",
  image: () => "",
  highlight: () => "",
  synonyms: () => "",
  description: () => "",
};
