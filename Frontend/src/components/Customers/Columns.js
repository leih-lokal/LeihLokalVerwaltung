import {
  saveParseStringToBoolean,
  saveParseTimestampToString,
  saveParseStringToInt,
} from "../../utils/utils.js";

export default [
  {
    title: "Id",
    key: "_id",
    sort: (value) => saveParseStringToInt(value),
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
    title: "Strasse",
    key: "street",
  },
  {
    title: "Hausnummer",
    key: "house_number",
    sort: (value) => saveParseStringToInt(value),
    search: "exclude",
  },
  {
    title: "Postleitzahl",
    key: "postal_code",
    search: "exclude",
  },
  {
    title: "Stadt",
    key: "city",
  },
  {
    title: "Beitritt",
    key: "registration_date",
    display: (value) => saveParseTimestampToString(value),
  },
  {
    title: "Verlängert am",
    key: "renewed_on",
    display: (value) => saveParseTimestampToString(value),
  },
  {
    title: "Bemerkung",
    key: "remark",
  },
  {
    title: "E-Mail",
    key: "email",
  },
  {
    title: "Telefonnummer",
    key: "telephone_number",
  },
  {
    title: "Newsletter",
    key: "subscribed_to_newsletter",
    display: (value) => (saveParseStringToBoolean(value) ? "Ja" : "Nein"),
  },
  {
    title: "Aufmerksam geworden",
    key: "heard",
  },
];
