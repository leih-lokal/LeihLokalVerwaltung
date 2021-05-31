import {
  saveParseStringToBoolean,
  saveParseTimestampToString,
} from "../../utils/utils.js";
import Database from "../../components/Database/ENV_DATABASE";
import { activeRentalsForCustomerSelector } from "../rental/selectors";

const backgroundColor = async (customer) => customer.highlight;

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
  },
  {
    title: "Postleitzahl",
    key: "postal_code",
    search: "exclude",
    backgroundColor,
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
    display: async (value) => saveParseTimestampToString(value),
    search: "exclude",
    backgroundColor,
  },
  {
    title: "Verlängert am",
    key: "renewed_on",
    display: async (value) => saveParseTimestampToString(value),
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
    display: async (value) => (saveParseStringToBoolean(value) ? "Ja" : "Nein"),
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
    display: async (customer_id) => {
      let activeRentalIds = await Database.fetchAllDocsBySelector(
        activeRentalsForCustomerSelector(customer_id),
        ["_id"]
      );
      return activeRentalIds.length;
    },
    backgroundColor,
  },
];
