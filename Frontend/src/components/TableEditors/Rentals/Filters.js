export default {
  filters: {
    "nicht abgeschlossen": function (rental) {
      function millisAtStartOfDay(millis) {
        var msPerDay = 86400 * 1000;
        return millis - (millis % msPerDay);
      }

      function isToday(millis) {
        return millisAtStartOfDay(millis) === millisAtStartOfDay(new Date().getTime());
      }

      return !rental.returned_on || rental.returned_on === 0 || isToday(rental.returned_on);
    },
    abgeschlossen: function (rental) {
      return rental.returned_on && rental.returned_on !== 0;
    },
    "Rückgabe heute": function (rental) {
      function millisAtStartOfDay(millis) {
        var msPerDay = 86400 * 1000;
        return millis - (millis % msPerDay);
      }

      function isToday(millis) {
        return millisAtStartOfDay(millis) === millisAtStartOfDay(new Date().getTime());
      }

      return rental.to_return_on && isToday(rental.to_return_on);
    },
    verspätet: function (rental) {
      function millisAtStartOfDay(millis) {
        var msPerDay = 86400 * 1000;
        return millis - (millis % msPerDay);
      }

      function isBeforeDay(m1, m2) {
        return millisAtStartOfDay(m1) < millisAtStartOfDay(m2);
      }

      function isBeforeToday(millis) {
        return isBeforeDay(millis, new Date().getTime());
      }

      return (
        rental.to_return_on &&
        ((!rental.returned_on && isBeforeToday(rental.to_return_on)) ||
          (rental.returned_on && isBeforeDay(rental.to_return_on, rental.returned_on)))
      );
    },
  },
  activeByDefault: ["nicht abgeschlossen"],
};
