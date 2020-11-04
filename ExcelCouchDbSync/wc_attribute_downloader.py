import os
import requests

def all_items_from_woocommerce(items=[], page=1):
    r = requests.get('https://www.buergerstiftung-karlsruhe.de/wp-json/wc/v3/products?consumer_key={}&consumer_secret={}&per_page=100&page={}'
                     .format(os.environ['WC_CONSUMER_KEY'], os.environ['WC_CONSUMER_SECRET'], str(page)))
    r = r.json()
    if len(r) != 0:
        return all_items_from_woocommerce(items + r, page + 1)
    else:
        return items + r

def parse_4_digit_id(value):
    value = str(value)
    while len(value) < 4: value = "0" + value
    return value

def extract_additional_attributes(items):
    wc_additional_attributes = {}
    images = {}
    for item in items:
        if not "sku" in item: continue
        item_id = parse_4_digit_id(item["sku"])
        wc_additional_attributes[item_id] = {
            "status": item["stock_status"]
        }
        if(len(item["images"]) != 0):
            images[item_id] = item["images"][0]["src"]
            wc_additional_attributes[item_id]["image"] = item["images"][0]["src"]
        if(len(item["categories"]) != 0):
            wc_additional_attributes[item_id]["category"] = item["categories"][0]["name"]
        if (len(item["attributes"]) != 0 and len(item["attributes"][0]["options"]) != 0):
            wc_additional_attributes[item_id]["deposit"] = int(str(item["attributes"][0]["options"][0]).replace("€", ""))
    return wc_additional_attributes, images

def add_wc_attributes_to_db_items(couchdb):
    print("loading attributes from woocommerce...")
    additional_attributes, images = extract_additional_attributes(all_items_from_woocommerce())

    print("adding image urls to items...")
    count_updated = 0
    for item in couchdb.db("items"):
        if item["_id"] in additional_attributes:
            item["image"] = additional_attributes[item["_id"]]["image"]
            item["status_on_website"] = additional_attributes[item["_id"]]["status"]
            item["category"] = additional_attributes[item["_id"]]["category"]
            item["deposit"] = additional_attributes[item["_id"]]["deposit"]
        else:
            item["status_on_website"] = "deleted"

        item.save()
        count_updated += 1

    print("added wc attributes to " + str(count_updated) + " items")

    print("adding image urls to rentals...")
    count_updated = 0
    for rental in couchdb.db("rentals"):
        if "item_id" in rental:
            item_id = parse_4_digit_id(rental["item_id"])
            if item_id in images:
                rental["item_id"] = item_id
                rental["image"] = images[item_id]
                rental.save()
                count_updated += 1

    print("added wc attributes to " + str(count_updated) + " rentals")