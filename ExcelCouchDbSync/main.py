import os
import logging
import asyncio

from src.couchdb import CouchDb
from src.image_url_downloader import add_image_urls_to_db_items
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

    add_image_urls_to_db_items()

    logging.info('done')

if __name__ == '__main__':
    asyncio.run(main())