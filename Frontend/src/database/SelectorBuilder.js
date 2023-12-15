class SelectorBuilder {
  constructor() {
    this.selectors = [];
    this.currentFieldName = "";
  }

  regexIgnoreCaseAndDiactricis(content) {
    // returns a regex with content that has diacricits ignored
    let accentGroups = [
      "aâãäåæ",
      "eéèêë",
      "iíìîï",
      "oóòôõöø",
      "uúùûü",
      "cç",
      "nñ",
      "yýÿ",
    ];

    let regex = content;
    let accentGroup;
    let accent;
    for (accentGroup of accentGroups) {
      for (accent of accentGroup) {
        if (content.includes(accent)) {
          regex = regex.replace(accent, `(?:${accentGroup.split('').join('|')})`);
        }
      }
    }
    return "(?i)" + regex;
  }

  regexIgnoreCase(content) {
    return "(?i)" + content;
  }

  withField(fieldName) {
    this.currentFieldName = fieldName;
    return this;
  }

  withDocType(docType) {
    this.selectors.push({
      type: {
        $eq: docType,
      },
    });
    return this;
  }

  containsIgnoreCase(value) {
    this.selectors.push({
      [this.currentFieldName]: {
        $regex: this.regexIgnoreCase(value),
      },
    });
    return this;
  }

  startsWithIgnoreCaseAndDiacritics(value) {
    this.selectors.push({
      [this.currentFieldName]: {
        $regex: this.regexIgnoreCaseAndDiactricis("^" + value),
      },
    });
    return this;
  }

  startsWithIgnoreCase(value) {
    this.selectors.push({
      [this.currentFieldName]: {
        $regex: this.regexIgnoreCase("^" + value),
      },
    });
    return this;
  }

  startsWithIgnoreCaseAndLeadingZeros(value) {
    this.selectors.push({
      [this.currentFieldName]: {
        $regex: this.regexIgnoreCase("^(0+)?" + value),
      },
    });
    return this;
  }

  numericFieldStartsWith(value) {
    value = parseInt(value);
    if (value === 0) return this;

    // e.g. 12 => 120 - 129, 1200 - 1299
    const selectorsForNumbersStartingWith = (factor = 10, selectors = []) => {
      selectors.push({
        $and: [
          {
            [this.currentFieldName]: {
              $gte: value * factor,
            },
          },
          {
            [this.currentFieldName]: {
              $lt: value * factor + factor,
            },
          },
        ],
      });
      if (value * factor * 10 > 10000) {
        return selectors;
      } else {
        return selectorsForNumbersStartingWith(factor * 10, selectors);
      }
    };
    this.selectors.push({
      $or: [
        {
          [this.currentFieldName]: {
            $eq: value,
          },
        },
        ...selectorsForNumbersStartingWith(),
      ],
    });
    return this;
  }

  equals(value) {
    this.selectors.push({
      [this.currentFieldName]: {
        $eq: value,
      },
    });
    return this;
  }

  isNotEqualTo(value) {
    this.selectors.push({
      [this.currentFieldName]: {
        $ne: value,
      },
    });
    return this;
  }

  greaterThan(value) {
    this.selectors.push({
      [this.currentFieldName]: {
        $gt: value,
      },
    });
    return this;
  }

  withAny(anySelectors) {
    this.selectors.push({
      $or: anySelectors,
    });
    return this;
  }

  searchTerm(searchTerm, columns) {
    const formattedSearchTerm = searchTerm.toLowerCase();
    const searchTermWords = formattedSearchTerm
      .split(" ")
      .map((searchTerm) => searchTerm.trim())
      .filter((searchTerm) => searchTerm !== "");

    // e.g. 12 => 120 - 129, 1200 - 1299
    const selectorsForNumbersStartingWith = (
      searchWord,
      column,
      factor = 10,
      selectors = []
    ) => {
      const number = Math.abs(parseInt(searchWord, 10));
      if (number === 0) {
        // 000 -> 0001 - 0009
        // 00 -> 0010 - 0099
        // 0 -> 0001 - 0009
        return [
          {
            $and: [
              {
                [column.key]: {
                  $gte: 1000 / Math.pow(10, searchWord.length),
                },
              },
              {
                [column.key]: {
                  $lt: 1000 / Math.pow(10, searchWord.length - 1),
                },
              },
            ],
          },
        ];
      } else {
        selectors.push({
          $and: [
            {
              [column.key]: {
                $gte: number * factor,
              },
            },
            {
              [column.key]: {
                $lt: number * factor + factor,
              },
            },
          ],
        });
      }
      if (number * factor * 10 > 10000) {
        return selectors;
      } else {
        return selectorsForNumbersStartingWith(
          searchWord,
          column,
          factor * 10,
          selectors
        );
      }
    };

    const selectorsForSearchWord = (searchWord) => {
      if (!isNaN(searchWord)) {
        // is number
        let selectors = [];
        columnsToSearch(true).forEach((column) => {
          selectors.push({
            [column.key]: {
              $eq: parseInt(searchWord, 10),
            },
          });
          selectors = [
            ...selectors,
            ...selectorsForNumbersStartingWith(searchWord, column),
          ];
        });
        return selectors;
      } else {
        // is not a number
        return columnsToSearch(false).map((column) => ({
          [column.key]: {
            $regex:
              "(?i)" +
              (column?.search === "from_beginning" ? "^(0+?)?" : "") +
              searchWord,
          },
        }));
      }
    };

    const columnsToSearch = (numericSearchTerm = false) =>
      columns
        .filter(
          (column) =>
            (!numericSearchTerm && !column.numeric) ||
            (numericSearchTerm && column.numeric)
        )
        .filter((column) => !column.search || column.search !== "exclude");

    this.selectors = [
      {
        $and: searchTermWords.map((searchTermWord) => ({
          $or: selectorsForSearchWord(searchTermWord),
        })),
      },
    ];
    return this;
  }

  build() {
    if (this.selectors.length == 1) {
      return this.selectors[0];
    } else {
      return {
        $and: this.selectors,
      };
    }
  }

  buildSelectors() {
    return this.selectors;
  }
}

export default SelectorBuilder;
