const ColorDefs = Object.freeze({
  HIGHLIGHT_RED: "rgb(250, 45, 30)",
  HIGHLIGHT_GREEN: "rgb(131, 235, 52)",
  HIGHLIGHT_BLUE: "rgb(45, 144, 224)",
  HIGHLIGHT_YELLOW: "rgb(247, 239, 10)",

  ITEM_RESERVED: "rgb(255, 155, 25)",

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
      return "Grün, ist Teil des Teams";
    case ColorDefs.HIGHLIGHT_YELLOW:
      return "Gelb";
    case ColorDefs.HIGHLIGHT_RED:
      return "Rot, ACHTUNG, bitte nachsehen";
    case ColorDefs.HIGHLIGHT_BLUE:
      return "Blau";
  }
  return "unbekannte Markierung, bitte nachsehen";
};

export const itemColorToDescription = (color) => {
  switch (color) {
    case ColorDefs.HIGHLIGHT_GREEN:
      return "Grün, hängt eventuell vorne im Schaufenster";
    case ColorDefs.HIGHLIGHT_YELLOW:
      return "Gelb, hängt eventuell vorne im Schaufenster";
    case ColorDefs.HIGHLIGHT_RED:
      return "Rot, ACHTUNG, etwas könnte mit dem Gegenstand nicht in Ordnung sein oder muss beachtet werden";
    case ColorDefs.HIGHLIGHT_BLUE:
      return "Blau";
  }
  return "Unbekannte farbliche Markierung, bitte nachsehen";
};
