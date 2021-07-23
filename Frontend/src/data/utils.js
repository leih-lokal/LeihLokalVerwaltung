const setNumericValuesDefault0 = (doc, columns) => {
  Object.keys(doc).forEach((key) => {
    const colForKey = columns.find((col) => col.key === key);
    if (colForKey && colForKey.numeric && doc[key] === "") {
      doc[key] = 0; // default value for numbers
    }
  });
};

export { setNumericValuesDefault0 };
