import SelectorBuilder from "./SelectorBuilder";

class LocalSelectorBuilder extends SelectorBuilder {
  regexIgnoreCase(content) {
    return new RegExp(content, "i");
  }
}

export default LocalSelectorBuilder;
