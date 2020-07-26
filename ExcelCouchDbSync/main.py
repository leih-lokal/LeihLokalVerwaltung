import os
import logging
import asyncio

from src.couchdb import CouchDb
from src.file_observer import FileObserver
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

def on_excel_modified():
    logger.info("excel modified!")

def on_db_modified():
    logger.info("db modified!")

async def main():
    logging.info("Connecting to CouchDb")
    database = CouchDb()

    logging.info('Loading Excel...')
    store = Store.parse_file(os.environ['EXCEL_FILE'])

    logger.info("Uploading customers...")
    database.excel_to_db("customers", store.customers.values())
    logger.info("Uploading items...")
    database.excel_to_db("items", store.items.values())
    logger.info("Uploading rentals...")
    database.excel_to_db("rentals", store.rentals)

    logger.info("monitoring changes...")
    fileObserver = FileObserver()
    file_observe_task = asyncio.create_task(fileObserver.observe(on_excel_modified))
    monitor_db_task = asyncio.create_task(database.monitor_changes("customers", on_db_modified))

    await monitor_db_task
    await file_observe_task

    logging.info('done')

if __name__ == '__main__':
    asyncio.run(main())