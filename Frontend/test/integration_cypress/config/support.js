const expectDisplaysTableData = (expectedTableData, additionalWaitFunction) => {
  additionalWaitFunction && additionalWaitFunction();
  cy.get("tbody", { timeout: 10000 }).then((tbody) => {
    let tableData = [...tbody.get(0).querySelectorAll("tr")].map((row) => {
      return [...row.querySelectorAll("td")].map((e) => ({
        text: e.textContent,
        backgroundColor: e.style.backgroundColor,
      }));
    });
    expect(tableData).to.deep.equal(expectedTableData);
  });
};

Cypress.Commands.add(
  "expectDisplaysTableData",
  { prevSubject: false },
  expectDisplaysTableData
);
