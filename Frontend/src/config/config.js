import customerColumns from "./customer/columns";
import customerInputs from "./customer/inputs";
import customerFilters from "./customer/filters";

import itemColumns from "./item/columns";
import itemInputs from "./item/inputs";
import itemFilters from "./item/filters";

export default [
  {
    route: "/customers",
    inputs: customerInputs,
    columns: customerColumns,
    filters: customerFilters,
    docType: "customer",
    title: "Kunden",
  },
  {
    route: "/items",
    inputs: itemInputs,
    columns: itemColumns,
    filters: itemFilters,
    docType: "item",
    title: "Gegenstände",
  },
];
