import {
  saveParseStringToBoolean,
  saveParseTimestampToString,
} from "../../utils/utils.js";

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
    display: (value) => {
      if (!value) return value;
      let formattedValue = value.replace(/ /g, "");
      if (formattedValue.startsWith("+")) {
        formattedValue = formattedValue.replace(
          /(\d{5})(\d{4})(\d{1,})/,
          "$1 $2 $3"
        );
      } else {
        formattedValue = formattedValue.replace(
          /(\d{4})(\d{4})(\d{1,})/,
          "$1 $2 $3"
        );
      }
      return formattedValue;
    },
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
    key: "active_rental_count",
    search: "exclude",
    disableSort: true,
    displayExport: (allDocs, customer_id) =>
      allDocs.filter(
        (doc) =>
          doc.type === "rental" &&
          doc.customer_id === customer_id &&
          doc.returned_on === 0
      ).length,
    backgroundColor,
  },
  {
    title: "Ausleihen Insgesamt",
    key: "rental_count",
    search: "exclude",
    disableSort: true,
    displayExport: (allDocs, customer_id) =>
      allDocs.filter(
        (doc) => doc.type === "rental" && doc.customer_id === customer_id
      ).length,
    backgroundColor,
  },
];
