import os

from src.couchdb import CouchDb
from src.store import Store

if __name__ == '__main__':
    print('Loading Excel...')
    store = Store.parse_file(os.environ['EXCEL_FILE'])

    print("Connecting to CouchDb")
    database = CouchDb()

    print("Uploading Data")
    database.update("customers", store.customers.values())
    database.update("items", store.items.values())
    database.update("rentals", store.rentals)

    print('fertig')