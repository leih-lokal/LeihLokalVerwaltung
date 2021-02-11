class SelectorBuilder {
  constructor() {
    this.selector = {};
    this.currentFieldName = "";
  }

  regexIgnoreCase(content) {
    return "(?i)" + content;
  }

  withField(fieldName) {
    this.currentFieldName = fieldName;
    return this;
  }

  withDocType(docType) {
    this.selector["type"] = {
      $eq: docType,
    };
    return this;
  }

  containsIgnoreCase(value) {
    this.selector[this.currentFieldName] = {
      $regex: this.regexIgnoreCase(value),
    };
    return this;
  }

  startsWithIgnoreCase(value) {
    this.selector[this.currentFieldName] = {
      $regex: this.regexIgnoreCase("^" + value),
    };
    return this;
  }

  startsWithIgnoreCaseAndLeadingZeros(value) {
    this.selector[this.currentFieldName] = {
      $regex: this.regexIgnoreCase("^(0+)?" + value),
    };
    return this;
  }

  equals(value) {
    this.selector[this.currentFieldName] = {
      $eq: value,
    };
    return this;
  }

  isNotEqualTo(value) {
    this.selector[this.currentFieldName] = {
      $ne: value,
    };
    return this;
  }

  build() {
    return this.selector;
  }
}

export default SelectorBuilder;
