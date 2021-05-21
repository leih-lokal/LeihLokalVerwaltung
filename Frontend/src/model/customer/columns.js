import { saveParseStringToBoolean, saveParseTimestampToString } from "../../../utils/utils.js";
import Database from "../../components/Database/ENV_DATABASE";
import { activeRentalsForCustomerSelector } from "../Rentals/Selectors";

export default [
  {
    title: "Id",
    key: "id",
    numeric: true,
    search: "from_beginning",
  },
  {
    title: "Nachname",
    key: "lastname",
  },
  {
    title: "Vorname",
    key: "firstname",
  },
  {
    title: "Straße",
    key: "street",
    search: "exclude",
  },
  {
    title: "Hausnummer",
    key: "house_number",
    search: "exclude",
    disableSort: true,
  },
  {
    title: "Postleitzahl",
    key: "postal_code",
    search: "exclude",
  },
  {
    title: "Stadt",
    key: "city",
    search: "exclude",
  },
  {
    title: "Beitritt",
    key: "registration_date",
    display: async (value) => saveParseTimestampToString(value),
    search: "exclude",
  },
  {
    title: "Verlängert am",
    key: "renewed_on",
    display: async (value) => saveParseTimestampToString(value),
    search: "exclude",
  },
  {
    title: "Bemerkung",
    key: "remark",
    search: "exclude",
    disableSort: true,
  },
  {
    title: "E-Mail",
    key: "email",
    search: "exclude",
    disableSort: true,
  },
  {
    title: "Telefonnummer",
    key: "telephone_number",
    search: "exclude",
    disableSort: true,
  },
  {
    title: "Newsletter",
    key: "subscribed_to_newsletter",
    display: async (value) => (saveParseStringToBoolean(value) ? "Ja" : "Nein"),
    search: "exclude",
  },
  {
    title: "Aufmerksam geworden",
    key: "heard",
    search: "exclude",
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
  },
];
