import {
  saveParseStringToBoolean,
  saveParseTimestampToString,
} from "../../utils/utils.js";
import Database from "../../database/ENV_DATABASE";
import { activeRentalsForCustomerSelector } from "../selectors";

const backgroundColor = async (customer) => customer.highlight;

async function countRentals(customer_id) {
  const selectors = [
    {
      customer_id: customer_id,
    },
  ];
  return await Database.countDocs(selectors);
}

export default [
  {
    title: "Id",
    key: "id",
    numeric: true,
    search: "from_beginning",
    backgroundColor,
  },
  {
    title: "Nachname",
    key: "lastname",
    backgroundColor,
  },
  {
    title: "Vorname",
    key: "firstname",
    backgroundColor,
  },
  {
    title: "Straße",
    key: "street",
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Hausnummer",
    key: "house_number",
    search: "exclude",
    disableSort: true,
    backgroundColor,
    hideInTable: true,
  },
  {
    title: "Postleitzahl",
    key: "postal_code",
    search: "exclude",
    backgroundColor,
    hideInTable: true,
  },
  {
    title: "Stadt",
    key: "city",
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Beitritt",
    key: "registration_date",
    display: (value) => saveParseTimestampToString(value),
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Verlängert am",
    key: "renewed_on",
    display: (value) => saveParseTimestampToString(value),
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Bemerkung",
    key: "remark",
    search: "exclude",
    disableSort: true,
    backgroundColor,
  },
  {
    title: "E-Mail",
    key: "email",
    search: "exclude",
    disableSort: true,
    backgroundColor,
  },
  {
    title: "Telefonnummer",
    key: "telephone_number",
    search: "exclude",
    disableSort: true,
    backgroundColor,
  },
  {
    title: "Newsletter",
    key: "subscribed_to_newsletter",
    display: (value) => (saveParseStringToBoolean(value) ? "Ja" : "Nein"),
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Aufmerksam geworden",
    key: "heard",
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Aktive Ausleihen",
    key: "id",
    search: "exclude",
    disableSort: true,
    export: "exclude",
    display: async (customer_id) =>
      Database.countDocs([activeRentalsForCustomerSelector(customer_id)]),
    backgroundColor,
  },
  {
    title: "Ausleihen Insgesamt",
    key: "id",
    search: "exclude",
    disableSort: true,
    display: countRentals,
    backgroundColor,
  },
];
