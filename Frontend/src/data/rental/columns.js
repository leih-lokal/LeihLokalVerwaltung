import {
  saveParseTimestampToHumanReadableString,
  millisAtStartOfToday,
} from "../../utils/utils.js";
import { customerById, itemById } from "../selectors";
import COLORS from "../../components/Input/ColorDefs";
import Database from "../../database/ENV_DATABASE";

const hasReturnDate = (rental) => rental.returned_on && rental.returned_on > 0;
const hasBeenReturnedToday = (rental) =>
  hasReturnDate(rental) && rental.returned_on === millisAtStartOfToday();
const shouldBeReturnedToday = (rental) =>
  rental.to_return_on &&
  rental.to_return_on === millisAtStartOfToday() &&
  !hasReturnDate(rental);
const shouldHaveBeenReturnedBeforeToday = (rental) =>
  rental.to_return_on &&
  ((!hasReturnDate(rental) && rental.to_return_on < millisAtStartOfToday()) ||
    (hasReturnDate(rental) && rental.to_return_on < rental.returned_on));

const rentalHighlight = async (rental) => {
  if (hasBeenReturnedToday(rental)) {
    return COLORS.RENTAL_RETURNED_TODAY_GREEN;
  } else if (shouldBeReturnedToday(rental)) {
    return COLORS.RENTAL_TO_RETURN_TODAY_BLUE;
  } else if (shouldHaveBeenReturnedBeforeToday(rental)) {
    return COLORS.RENTAL_LATE_RED;
  }
};

const customerHighlight = (rental) =>
  Database.fetchDocsBySelector(customerById(rental.customer_id)).then(
    (customers) => customers[0] && customers[0].highlight
  );
const itemHighlight = (rental) =>
  Database.fetchDocsBySelector(itemById(rental.item_id)).then(
    (items) => items[0] && items[0].highlight
  );

const highlightByPriority = (highlightFunctions) => (rental) =>
  Promise.all(
    highlightFunctions.map((highlightFunction) => highlightFunction(rental))
  ).then((highlightColors) => highlightColors.find((color) => color));

export default [
  {
    title: "Bild",
    key: "image",
    search: "exclude",
    isImageUrl: true,
    disableSort: true,
    backgroundColor: highlightByPriority([itemHighlight, rentalHighlight]),
  },
  {
    title: "Gegenstand Nr",
    key: "item_id",
    numeric: true,
    search: "from_beginning",
    display: (value) => String(value).padStart(4, "0"),
    backgroundColor: highlightByPriority([itemHighlight, rentalHighlight]),
  },
  {
    title: "Gegenstand Name",
    key: "item_name",
    backgroundColor: highlightByPriority([itemHighlight, rentalHighlight]),
  },
  {
    title: "Ausgegeben",
    key: "rented_on",
    search: "exclude",
    display: (value) => saveParseTimestampToHumanReadableString(value),
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Verlängert",
    key: "extended_on",
    search: "exclude",
    display: (value) => saveParseTimestampToHumanReadableString(value),
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Zurückerwartet",
    key: "to_return_on",
    search: "exclude",
    display: (value) => saveParseTimestampToHumanReadableString(value),
    sort: ["returned_on", "to_return_on", "customer_name"],
    backgroundColor: highlightByPriority([rentalHighlight]),
    initialSort: "asc",
  },
  {
    title: "Mitarbeiter",
    search: "exclude",
    key: "passing_out_employee",
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Kunde Nr",
    key: "customer_id",
    numeric: true,
    search: "from_beginning",
    backgroundColor: highlightByPriority([customerHighlight, rentalHighlight]),
  },
  {
    title: "Kunde Name",
    key: "customer_name",
    backgroundColor: highlightByPriority([customerHighlight, rentalHighlight]),
  },
  {
    title: "Pfand",
    key: "deposit",
    search: "exclude",
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Pfand zurück",
    key: "deposit_returned",
    search: "exclude",
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Zurückgegeben",
    key: "returned_on",
    search: "exclude",
    display: (value) => saveParseTimestampToHumanReadableString(value),
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Mitarbeiter",
    key: "receiving_employee",
    search: "exclude",
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Bemerkung",
    key: "remark",
    search: "exclude",
    disableSort: true,
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
];
