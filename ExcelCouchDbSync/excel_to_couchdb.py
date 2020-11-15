import os
import logging
import hashlib
from couchdb import CouchDb
import pyexcel as pe
from rental_columns import RENTAL_COLUMNS
from item_columns import ITEM_COLUMNS
from customer_columns import CUSTOMER_COLUMNS
from wc_attribute_downloader import add_wc_attributes_to_db_items

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(message)s",
)

def parseExcelSheet(sheet, columns):
    parsed_rows = []
    for row in sheet.array[1:]:
        if len(str(row[0]).strip()) == 0 or len(str(row[1]).strip()) + len(str(row[2]).strip()) == 0:
            continue
        parsed_row = {}
        for column_key in columns.keys():
            column = columns[column_key]
            excel_cell_value = row[column["excel_column_index"]]
            parsed_cell_value = column["excel_to_db_transform"](excel_cell_value)
            parsed_row[column_key] = parsed_cell_value
        parsed_rows.append(parsed_row)
    return parsed_rows

logging.info("Connecting to CouchDb")
database = CouchDb()

logging.info('Loading Excel...')
book = pe.get_book(file_name=os.environ['EXCEL_FILE'])

logging.info("Uploading items...")
database.excel_to_db("items", parseExcelSheet(book.Gegenstände, ITEM_COLUMNS))

logging.info("Uploading rentals...")
rentals = parseExcelSheet(book.Leihvorgang, RENTAL_COLUMNS)
m = hashlib.md5()
for rental in rentals:
    if "item_id" in rental: m.update(str(rental["item_id"]).encode('utf-8'))
    if "rented_on" in rental: m.update(str(rental["rented_on"]).encode('utf-8'))
    if "customer_id" in rental: m.update(str(rental["customer_id"]).encode('utf-8'))
    rental["_id"] = m.hexdigest()
database.excel_to_db("rentals", rentals)

logging.info("Uploading customers...")
database.excel_to_db("customers", parseExcelSheet(book.Kunden, CUSTOMER_COLUMNS))

add_wc_attributes_to_db_items(database)