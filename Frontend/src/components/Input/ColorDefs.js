const ColorDefs = Object.freeze({
  HIGHLIGHT_RED: "rgb(250, 45, 30)",
  HIGHLIGHT_GREEN: "rgb(131, 235, 52)",
  HIGHLIGHT_BLUE: "rgb(45, 144, 224)",
  HIGHLIGHT_YELLOW: "rgb(247, 239, 10)",

  RENTAL_RETURNED_TODAY_GREEN: "rgb(214, 252, 208)",
  RENTAL_LATE_RED: "rgb(240, 200, 200)",
  RENTAL_TO_RETURN_TODAY_BLUE: "rgb(160, 200, 250)",

  DEFAULT_ROW_BACKGROUND_ODD: "rgb(255, 255, 255)",
  DEFAULT_ROW_BACKGROUND_EVEN: "rgb(242, 242, 242)",
});

export default ColorDefs;

export const customerColorToDescription = (color) => {
  switch (color) {
    case ColorDefs.HIGHLIGHT_GREEN:
      return "ist Teil des Teams";
    case ColorDefs.HIGHLIGHT_YELLOW:
      return "gelb markiert";
    case ColorDefs.HIGHLIGHT_RED:
      return "rot markiert";
    case ColorDefs.HIGHLIGHT_BLUE:
      return "blau markiert";
  }
  return "unbekannte Farbe, bitte nachsehen";
};

export const itemColorToDescription = (color) => {
  switch (color) {
    case ColorDefs.HIGHLIGHT_GREEN:
      return "hängt eventuell vorne im Schaufenster";
    case ColorDefs.HIGHLIGHT_YELLOW:
      return "hängt eventuell vorne im Schaufenster";
    case ColorDefs.HIGHLIGHT_RED:
      return "ACHTUNG: Etwas könnte mit dem Gegenstand nicht in Ordnung sein (rot markiert).";
    case ColorDefs.HIGHLIGHT_BLUE:
      return "blau markiert";
  }
  return "unbekannte Farbe, bitte nachsehen";
};
