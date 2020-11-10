import { saveParseStringToBoolean, saveParseTimestampToString } from "../../../utils/utils.js";

export default [
  {
    title: "Id",
    key: "_id",
    numeric: true,
    sort: function (doc) {
      return parseInt(doc._id, 10);
    },
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
    search: "exclude",
  },
  {
    title: "Hausnummer",
    key: "house_number",
    sort: function (doc) {
      return parseInt(doc.house_number, 10);
    },
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
    search: "exclude",
  },
  {
    title: "Beitritt",
    key: "registration_date",
    display: (value) => saveParseTimestampToString(value),
    search: "exclude",
  },
  {
    title: "Verlängert am",
    key: "renewed_on",
    display: (value) => saveParseTimestampToString(value),
    search: "exclude",
  },
  {
    title: "Bemerkung",
    key: "remark",
    search: "exclude",
  },
  {
    title: "E-Mail",
    key: "email",
    search: "exclude",
  },
  {
    title: "Telefonnummer",
    key: "telephone_number",
    search: "exclude",
  },
  {
    title: "Newsletter",
    key: "subscribed_to_newsletter",
    display: (value) => (saveParseStringToBoolean(value) ? "Ja" : "Nein"),
    search: "exclude",
  },
  {
    title: "Aufmerksam geworden",
    key: "heard",
    search: "exclude",
  },
];
