const displayedTableDataShould = (assertion) =>
  cy.get("tbody", { timeout: 10000 }).should((tbody) => {
    let tableData = [...tbody.get(0).querySelectorAll("tr")].map((row) => {
      return [...row.querySelectorAll("td")].map((e) => ({
        text: e.textContent,
        backgroundColor: e.style.backgroundColor,
      }));
    });
    assertion(tableData);
  });

const expectDisplaysTableData = (expectedTableData) => {
  displayedTableDataShould((tableData) =>
    expect(tableData).to.deep.equal(expectedTableData)
  );
};

const expectDisplaysRow = (expectedTableRow) => {
  displayedTableDataShould((tableData) =>
    expect(tableData).to.deep.include.members([expectedTableRow])
  );
};

const expectNotDisplaysRow = (expectedTableRow) => {
  displayedTableDataShould((tableData) =>
    expect(tableData).not.to.deep.include.members([expectedTableRow])
  );
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
