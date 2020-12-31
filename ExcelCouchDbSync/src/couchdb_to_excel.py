import sys

import pyexcel as pe
from couchdb import CouchDb
from rental_columns import RENTAL_COLUMNS
from item_columns import ITEM_COLUMNS
from customer_columns import CUSTOMER_COLUMNS
import os
import logging
from utils import is_design_doc

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(message)s",
)

def db_to_sheet(columns, db, sheet, sort=None):
    excel_columns = sorted(columns.keys(), key=lambda col: columns[col]["excel_column_index"])
    sheet.row += list(map(lambda x: columns[x]["excel_title"], excel_columns))
    if sort is not None:
        db.create_query_index(fields=[list(sort.keys())[0]]).create()
        docs = db.get_query_result({'_id': {'$ne': ''}}, sort=[sort])
    else:
        docs = db
    for doc in docs:
        if is_design_doc(doc):
            continue
        row = []
        for col in columns:
            if col in doc:
                if "db_to_excel_transform" in columns[col]:
                    doc[col] = columns[col]["db_to_excel_transform"](doc[col])
                row.insert(columns[col]["excel_column_index"], doc[col])
            else:
                row.insert(columns[col]["excel_column_index"], "")

        sheet.row += row


if __name__ == "__main__":
    output_file_name = "output.ods"
    if len(sys.argv) > 1:
        output_file_name = sys.argv[1] + ".ods"

    book = pe.Book()
    book += pe.Sheet(name='Kunden')
    book += pe.Sheet(name='Gegenstände')
    book += pe.Sheet(name='Leihvorgang')

    logging.info("Connecting to CouchDb")
    database = CouchDb()

    logging.info("Writing rentals to excel...")
    db_to_sheet(RENTAL_COLUMNS, database.db("rentals"), book["Leihvorgang"], sort={'rented_on': 'asc'})
    logging.info("Writing customers to excel...")
    db_to_sheet(CUSTOMER_COLUMNS, database.db("customers"), book["Kunden"], sort={'registration_date': 'asc'})
    logging.info("Writing items to excel...")
    db_to_sheet(ITEM_COLUMNS, database.db("items"), book["Gegenstände"], sort={'_id': 'asc'})

    book.save_as(output_file_name)
