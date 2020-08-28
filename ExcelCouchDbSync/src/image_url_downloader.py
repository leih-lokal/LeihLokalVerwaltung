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

def extract_image_urls(items):
    image_urls = {}
    for item in items:
        if not "sku" in item or not "images" in item or len(item["images"]) == 0: continue
        image_urls[str(item["sku"])] = item["images"][0]["src"]
    return image_urls

def add_image_urls_to_db_items():
    print("loading image urls from woocommerce...")
    image_urls = extract_image_urls(all_items_from_woocommerce())

    print("loading items from db...")
    db = CouchDb().db("items")
    docs = db.all_docs()

    print("adding image urls to items...")
    count_updated = 0
    for doc in docs["rows"]:
        if doc["id"] in image_urls and ("image" not in doc or doc["image"] != image_urls[doc["id"]]):
            db[doc["id"]]["image"] = image_urls[doc["id"]]
            db[doc["id"]].save()
            count_updated += 1

    print("added image url to " + str(count_updated) + " items")