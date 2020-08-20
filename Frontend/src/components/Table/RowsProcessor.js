class RowsProcessor {

    columnDisplayFunctions = {};
    columnSortFunctions = {};

    constructor(columns) {
        columns.forEach((column) => {
            if (column.display) {
                this.columnDisplayFunctions[column.key] = column.display;
            }
            if (column.sort) {
                this.columnSortFunctions[column.key] = column.sort;
            }
        });
    }

    sortByColumnKey(rows, columnKey, reverse = false) {
        const mapForSort = this.columnSortFunctions[columnKey]
            ? this.columnSortFunctions[columnKey]
            : (value) => value;
        return rows.sort((a, b) => {
            a = mapForSort(a[columnKey]);
            b = mapForSort(b[columnKey]);
            if (a < b) return -1 * (reverse ? -1 : 1);
            if (a > b) return 1 * (reverse ? -1 : 1);
            return 0;
        });
    }

    generateDisplayRows(rows) {
        return rows.map((row) => {
            let displayRow = { ...row };
            Object.keys(displayRow)
                .filter((key) => this.columnDisplayFunctions[key])
                .forEach((key) => (displayRow[key] = this.columnDisplayFunctions[key](displayRow[key])));
            return displayRow;
        });
    }

    getRowById(rows, id) {
        return rows.find((row) => row._id == id);
    }

    filterRows(rows, searchTerm) {
        let filteredRows = rows.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        for (let i = 0; i < filteredRows.length; i++) {
            filteredRows[i]["index"] = i;
        }
        return filteredRows;
    }
}

export default RowsProcessor;