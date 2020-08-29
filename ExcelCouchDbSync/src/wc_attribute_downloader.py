import os

import requests

from src.couchdb import CouchDb

def all_items_from_woocommerce(items=[], page=1):
    r = requests.get('https://www.buergerstiftung-karlsruhe.de/wp-json/wc/v3/products?consumer_key={}&consumer_secret={}&per_page=100&page={}'
                     .format(os.environ['WC_CONSUMER_KEY'], os.environ['WC_CONSUMER_SECRET'], str(page)))
    r = r.json()
    if len(r) != 0:
        return all_items_from_woocommerce(items + r, page + 1)
    else:
        return items + r

def extract_additional_attributes(items):
    wc_additional_attributes = {}
    for item in items:
        if not "sku" in item or not "images" in item or len(item["images"]) == 0: continue
        wc_additional_attributes[str(item["sku"])] = {
            "image": item["images"][0]["src"],
            "status": item["stock_status"]
        }
    return wc_additional_attributes

def add_wc_attributes_to_db_items():
    print("loading attributes from woocommerce...")
    additional_attributes = extract_additional_attributes(all_items_from_woocommerce())

    print("loading items from db...")
    db = CouchDb().db("items")
    docs = db.all_docs()

    print("adding image urls to items...")
    count_updated = 0
    for doc in docs["rows"]:
        if doc["id"] in additional_attributes:
            db[doc["id"]]["image"] = additional_attributes[doc["id"]]["image"]
            db[doc["id"]]["status_on_website"] = additional_attributes[doc["id"]]["status"]
        else:
            db[doc["id"]]["status_on_website"] = "deleted"

        db[doc["id"]].save()
        count_updated += 1

    print("added wc attributes to " + str(count_updated) + " items")