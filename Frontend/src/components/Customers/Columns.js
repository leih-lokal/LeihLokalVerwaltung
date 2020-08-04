import {
  saveParseStringToBoolean,
  saveParseStringToTimeMillis,
  saveParseStringToInt,
} from "../../utils/utils.js";

export default [
  {
    title: "Id",
    key: "_id",
    sort: (value) => saveParseStringToInt(value),
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
  },
  {
    title: "Postleitzahl",
    key: "postal_code",
  },
  {
    title: "Stadt",
    key: "city",
  },
  {
    title: "Beitritt",
    key: "registration_date",
    sort: (value) => saveParseStringToTimeMillis(value),
  },
  {
    title: "Verlängert am",
    key: "renewed_on",
    sort: (value) => saveParseStringToTimeMillis(value),
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
    map: (value) => (saveParseStringToBoolean(value) ? "Ja" : "Nein"),
  },
  {
    title: "Aufmerksam geworden",
    key: "heard",
  },
];
