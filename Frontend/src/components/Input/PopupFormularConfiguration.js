class PopupFormularConfiguration {
  constructor() {
    this.displaySaveButton = true;
  }

  setDocName(docName) {
    this.docName = docName;
    return this;
  }

  setInputGroups(inputGroups) {
    this.inputGroups = inputGroups;
    return this;
  }

  setInputs(inputs) {
    this.inputs = inputs;
    return this;
  }

  setDisplayDeleteButton(displayDeleteButton) {
    this.displayDeleteButton = displayDeleteButton;
    return this;
  }

  setDisplaySaveButton(displaySaveButton) {
    this.displaySaveButton = displaySaveButton;
    return this;
  }

  setTitle(title) {
    this.title = title;
    return this;
  }
}

export default PopupFormularConfiguration;
