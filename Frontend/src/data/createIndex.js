import customerColumns from "./customer/columns";
import rentalColumns from "./rental/columns";
import itemColumns from "./item/columns";
import Database from "../database/ENV_DATABASE";

var indexCreated = false;

const createIndex = async () => {
  if (!indexCreated) {
    // create index for each column for sorting
    await Promise.all(
      [...customerColumns, ...itemColumns, ...rentalColumns]
        .filter((column) => !column.disableSort)
        .map((column) =>
          Database.createIndex({
            index: {
              fields: column.sort || [column.key],
            },
          })
        )
    );

    await Database.createIndex({ index: { fields: ["type"] } });

    indexCreated = true;
  }
};

export default createIndex;
