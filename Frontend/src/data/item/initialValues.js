import { millisAtStartOfToday } from "../../utils/utils";
import Database from "../../database/ENV_DATABASE";

// initial values for new customers

export default {
  id: () => Database.nextUnusedId("item"),
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
