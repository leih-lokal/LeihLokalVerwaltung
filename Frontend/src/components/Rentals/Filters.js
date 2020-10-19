const CURRENT_DATE = new Date();
const CURRENT_TIME_MILLIS = CURRENT_DATE.getTime();

const millisSince = (date) => {
  return CURRENT_DATE - new Date(date);
};

const isSameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export default {
  filters: {
    "nicht abgeschlossen": (rental) => !rental.returned_on || rental.returned_on === 0,
    abgeschlossen: (rental) => rental.returned_on && millisSince(rental.returned_on) > 0,
    "Rückgabe heute": (rental) =>
      rental.to_return_on && isSameDay(new Date(rental.to_return_on), CURRENT_DATE),
    verspätet: (rental) =>
      rental.to_return_on &&
      ((!rental.returned_on && rental.to_return_on < CURRENT_TIME_MILLIS) ||
        (rental.returned_on &&
          new Date(rental.to_return_on).getTime() < new Date(rental.returned_on).getTime())),
  },
  activeByDefault: ["nicht abgeschlossen"],
};
