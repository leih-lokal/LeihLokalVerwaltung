import {
  parseTimestampToHumanReadableString,
  millisAtStartOfToday,
} from "../../utils/utils.js";
import COLORS from "../../components/Input/ColorDefs";

const hasReturnDate = (rental) => rental.returned_on && rental.returned_on > 0;
const hasBeenReturnedToday = (rental) => hasReturnDate(rental) && rental.returned_on === new Date(millisAtStartOfToday());
const shouldBeReturnedToday = (rental) => rental.expected_on && rental.expected_on === new Date(millisAtStartOfToday()) && !hasReturnDate(rental);
const shouldHaveBeenReturnedBeforeTodayAndIsNotReturned = (rental) => rental.expected_on && (!hasReturnDate(rental) && rental.expected_on < new Date(millisAtStartOfToday()));

const rentalHighlight = async (rental) => {
  if (hasBeenReturnedToday(rental)) {
    return COLORS.RENTAL_RETURNED_TODAY_GREEN;
  } else if (shouldBeReturnedToday(rental)) {
    return COLORS.RENTAL_TO_RETURN_TODAY_BLUE;
  } else if (shouldHaveBeenReturnedBeforeTodayAndIsNotReturned(rental)) {
    return COLORS.RENTAL_LATE_RED;
  }
};

const customerHighlight = (rental) => {
  return Promise.resolve(rental.expand.customer.highlight_color)
}
const itemHighlight = (rental) => {
  return Promise.resolve(rental.expand.items[0].highlight_color)  // TODO: support multi-item rentals
}

const highlightByPriority = (highlightFunctions) => (rental) =>
  Promise.all(
    highlightFunctions.map((highlightFunction) => highlightFunction(rental))
  ).then((highlightColors) => {
    return highlightColors.find((color) => color)
  });

export default [
  {
    title: "Bild",
    key: "expand",
    search: "exclude",
    isImageUrl: true,
    disableSort: true,
    display: (value) => value.items[0].images.length ? value.items[0].images[0] : null,  // TODO: support multi-item rentals
    backgroundColor: highlightByPriority([itemHighlight, rentalHighlight]),
  },
  {
    title: "Gegenstand Nr",
    key: "expand",
    sortKey: "items.iid",
    numeric: true,
    search: "from_beginning",
    display: (value) => value.items.map(i => String(i.iid).padStart(4, '0')).join(', '),  // TODO: support multi-item rentals
    backgroundColor: highlightByPriority([itemHighlight, rentalHighlight]),
  },
  {
    title: "Gegenstand Name",
    key: "expand",
    sortKey: "items.name",
    display: (value) => value.items.map(i => i.name).join(', '),  // TODO: support multi-item rentals
    backgroundColor: highlightByPriority([itemHighlight, rentalHighlight]),
  },
  {
    title: "Ausgegeben",
    key: "rented_on",
    search: "exclude",
    sort: ["rented_on"],
    display: (value) => parseTimestampToHumanReadableString(value),
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Verlängert",
    key: "extended_on",
    search: "exclude",
    display: (value) => parseTimestampToHumanReadableString(value),
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Zurückerwartet",
    key: "expected_on",
    search: "exclude",
    display: (value) => parseTimestampToHumanReadableString(value),
    sort: ["returned_on", "expected_on"],
    backgroundColor: highlightByPriority([rentalHighlight]),
    initialSort: "asc",
  },
  {
    title: "Mitarbeiter",
    search: "exclude",
    key: "employee",
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Nutzer-Nr.",
    key: "expand",
    sortKey: "customer.iid",
    numeric: true,
    search: "from_beginning",
    display: (value) => value.customer.iid,
    backgroundColor: highlightByPriority([customerHighlight, rentalHighlight]),
  },
  {
    title: "Nutzername",
    key: "expand",
    sortKey: "customer.lastname",
    display: (value) => value.customer.lastname,
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
    key: "deposit_back",
    search: "exclude",
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Zurückgegeben",
    key: "returned_on",
    search: "exclude",
    display: (value) => parseTimestampToHumanReadableString(value),
    backgroundColor: highlightByPriority([rentalHighlight]),
  },
  {
    title: "Mitarbeiter",
    key: "employee_back",
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
