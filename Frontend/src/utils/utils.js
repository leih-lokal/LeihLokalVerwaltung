function saveParseDateToString(maybeDateString) {
  const date = new Date(maybeDateString);
  if (isNaN(date)) return "unbekannt";
  else return `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(2, 0)}.${date.getFullYear()}`;
}

export { saveParseDateToString };