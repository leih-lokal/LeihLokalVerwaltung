import customerColumns from "./customer/columns";
import rentalColumns from "./rental/columns";
import itemColumns from "./item/columns";
import Database from "../database/ENV_DATABASE";

var indexCreated = false;

const createIndex = async () => {
  if (!indexCreated) {
    let createDesignDocPromises = [];
    const allColumns = [...customerColumns, ...itemColumns, ...rentalColumns];

    // create index for each column for sorting
    allColumns
      .filter((column) => !column.disableSort)
      .forEach((column) => {
        createDesignDocPromises.push(
          Database.createIndex({
            index: {
              fields: [column.key],
            },
          })
        );
      });

    createDesignDocPromises.push(
      Database.createIndex({
        index: {
          fields: ["returned_on", "to_return_on", "customer_name"],
        },
      })
    );

    await Promise.all(createDesignDocPromises);
    indexCreated = true;
  }
};

export default createIndex;
