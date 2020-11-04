export default {
  filters: {
    "nicht abgeschlossen": function (rental) {
      return !rental.returned_on || rental.returned_on === 0;
    },
    abgeschlossen: function (rental) {
      return rental.returned_on && rental.returned_on !== 0;
    },
    "Rückgabe heute": function (rental) {
      var CURRENT_DATE = new Date();
      var CURRENT_TIME_MILLIS = CURRENT_DATE.getTime();
      function isSameDay(m1, m2) {
        var d1 = new Date(m1);
        var d2 = new Date(m2);
        return (
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate()
        );
      }
      function isToday(millis) {
        return isSameDay(millis, CURRENT_TIME_MILLIS);
      }

      return rental.to_return_on && isToday(rental.to_return_on);
    },
    verspätet: function (rental) {
      var CURRENT_DATE = new Date();
      var CURRENT_TIME_MILLIS = CURRENT_DATE.getTime();

      function isSameDay(m1, m2) {
        var d1 = new Date(m1);
        var d2 = new Date(m2);
        return (
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate()
        );
      }

      function isBeforeDay(millis, dayMillis) {
        return !isSameDay(millis, dayMillis) && millis < dayMillis;
      }
      function isBeforeToday(millis) {
        return isBeforeDay(millis, CURRENT_TIME_MILLIS);
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
