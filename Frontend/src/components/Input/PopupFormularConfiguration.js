class PopupFormularConfiguration {
  constructor() {}

  setDocName(docName) {
    this.docName = docName;
    return this;
  }

  setCreateInitialDoc(createInitialDoc) {
    this.createInitialDoc = createInitialDoc;
    return this;
  }

  setDeleteButtonText(deleteButtonText) {
    this.deleteButtonText = deleteButtonText;
    return this;
  }

  setOnDeleteButtonClicked(onDeleteButtonClicked) {
    this.onDeleteButtonClicked = onDeleteButtonClicked;
    return this;
  }

  setOnSaveButtonClicked(onSaveButtonClicked) {
    this.onSaveButtonClicked = onSaveButtonClicked;
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
}

export default PopupFormularConfiguration;
