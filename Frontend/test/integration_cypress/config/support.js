const getDisplayedTableData = () =>
  cy.get("tbody", { timeout: 10000 }).then((tbody) => {
    let tableData = [...tbody.get(0).querySelectorAll("tr")].map((row) => {
      return [...row.querySelectorAll("td")].map((e) => ({
        text: e.textContent,
        backgroundColor: e.style.backgroundColor,
      }));
    });
    return tableData;
  });

const expectDisplaysTableData = (expectedTableData, additionalWaitFunction) => {
  additionalWaitFunction && additionalWaitFunction();
  getDisplayedTableData().then((tableData) => {
    expect(tableData).to.deep.equal(expectedTableData);
  });
};

const expectDisplaysRow = (expectedTableRow, additionalWaitFunction) => {
  additionalWaitFunction && additionalWaitFunction();
  getDisplayedTableData().then((tableData) => {
    expect(tableData).to.deep.include.members([expectedTableRow]);
  });
};

const expectNotDisplaysRow = (expectedTableRow, additionalWaitFunction) => {
  additionalWaitFunction && additionalWaitFunction();
  getDisplayedTableData().then((tableData) => {
    expect(tableData).not.to.deep.include.members([expectedTableRow]);
  });
};

Cypress.Commands.add(
  "expectDisplaysTableData",
  { prevSubject: false },
  expectDisplaysTableData
);

Cypress.Commands.add(
  "expectDisplaysRow",
  { prevSubject: false },
  expectDisplaysRow
);

Cypress.Commands.add(
  "expectNotDisplaysRow",
  { prevSubject: false },
  expectNotDisplaysRow
);
