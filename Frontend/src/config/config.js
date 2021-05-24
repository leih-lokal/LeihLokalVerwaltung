import customerColumns from "./customer/columns";
import customerInputs from "./customer/inputs";
import customerFilters from "./customer/filters";

export default [
  {
    route: "/customers",
    inputs: customerInputs,
    columns: customerColumns,
    filters: customerFilters,
    docType: "customer",
    title: "Kunden",
  },
];
