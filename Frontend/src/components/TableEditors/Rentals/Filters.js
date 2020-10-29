export default {
  filters: {
    "nicht abgeschlossen": (rental) => !rental.returned_on || rental.returned_on === 0,
    abgeschlossen: (rental) => rental.returned_on && rental.returned_on !== 0,
    "Rückgabe heute": (rental) => {
      const CURRENT_TIME_MILLIS = CURRENT_DATE.getTime();
      const isSameDay = (m1, m2) => {
        const d1 = new Date(m1);
        const d2 = new Date(m2);
        return (
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate()
        );
      };
      const isToday = (millis) => isSameDay(millis, CURRENT_TIME_MILLIS);

      return rental.to_return_on && isToday(rental.to_return_on);
    },
    verspätet: (rental) => {
      const CURRENT_DATE = new Date();
      const CURRENT_TIME_MILLIS = CURRENT_DATE.getTime();

      const isSameDay = (m1, m2) => {
        const d1 = new Date(m1);
        const d2 = new Date(m2);
        return (
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate()
        );
      };

      const isBeforeDay = (millis, dayMillis) =>
        !isSameDay(millis, dayMillis) && millis < dayMillis;
      const isBeforeToday = (millis) => isBeforeDay(millis, CURRENT_TIME_MILLIS);

      return (
        rental.to_return_on &&
        ((!rental.returned_on && isBeforeToday(rental.to_return_on)) ||
          (rental.returned_on && isBeforeDay(rental.to_return_on, rental.returned_on)))
      );
    },
  },
  activeByDefault: ["nicht abgeschlossen"],
};
