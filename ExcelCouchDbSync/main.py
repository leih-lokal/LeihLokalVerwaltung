import os
import logging
import asyncio

from src.couchdb import CouchDb
from src.store import Store

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("excelcouchdbsync.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


if __name__ == '__main__':
    logging.info('Loading Excel...')
    store = Store.parse_file(os.environ['EXCEL_FILE'])

    logging.info("Connecting to CouchDb")
    database = CouchDb()

    logging.info("Uploading customers...")
    database.excel_to_db("customers", store.customers.values())
    logging.info("Uploading items...")
    database.excel_to_db("items", store.items.values())
    logging.info("Uploading rentals...")
    database.excel_to_db("rentals", store.rentals)

    logging.info('done')

    asyncio.run(database.monitor_changes("customers"))