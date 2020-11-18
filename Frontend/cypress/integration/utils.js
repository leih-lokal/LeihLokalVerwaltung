const dateToString = (date) =>
  `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(
    2,
    0
  )}.${date.getFullYear()}`;

const statusOnWebsiteDisplayValue = (status) =>
  status
    .replace("deleted", "gelöscht")
    .replace("instock", "verfügbar")
    .replace("outofstock", "verliehen")
    .replace("onbackorder", "nicht verleihbar");

export default { dateToString, statusOnWebsiteDisplayValue };
