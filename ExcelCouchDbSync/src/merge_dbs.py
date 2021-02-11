import os
from cloudant.client import CouchDB

from utils import is_design_doc

client = CouchDB(os.environ['COUCHDB_USER'], os.environ['COUCHDB_PASSWORD'], url=os.environ['COUCHDB_HOST'],
                 connect=True, auto_renew=True)

client.create_database("leihlokal")
leihlokal_db = client["leihlokal"]

def get_or_empty_string(obj, key):
    if key in obj:
        return obj[key]
    else:
        return ""

def get_or_zero(obj, key):
    if key in obj:
        return obj[key]
    else:
        return 0

def get_or_false(obj, key):
    if key in obj:
        return obj[key]
    else:
        return 0

def parse_int_or_zero(obj, key):
    value = get_or_zero(obj, key)
    try:
        return int(value)
    except ValueError:
        return 0

for customer in client["customers"]:
    if is_design_doc(customer): continue
    leihlokal_db.create_document({
        "id": parse_int_or_zero(customer, "_id"),
        "lastname": get_or_empty_string(customer, "lastname"),
        "firstname": get_or_empty_string(customer, "firstname"),
        "registration_date": parse_int_or_zero(customer, "registration_date"),
        "renewed_on": parse_int_or_zero(customer, "renewed_on"),
        "remark": get_or_empty_string(customer, "remark"),
        "subscribed_to_newsletter": get_or_false(customer, "subscribed_to_newsletter"),
        "email": get_or_empty_string(customer, "email"),
        "street": get_or_empty_string(customer, "street"),
        "house_number": get_or_empty_string(customer, "house_number"),
        "postal_code": get_or_empty_string(customer, "postal_code"),
        "city": get_or_empty_string(customer, "city"),
        "telephone_number": get_or_empty_string(customer, "telephone_number"),
        "heard": get_or_empty_string(customer, "heard"),
        "highlight": get_or_empty_string(customer, "highlight"),
        "type": "customer"
    })

for item in client["items"]:
    if is_design_doc(item): continue
    leihlokal_db.create_document({
        "id": parse_int_or_zero(item, "_id"),
        "item_name": get_or_empty_string(item, "item_name"),
        "brand": get_or_empty_string(item, "brand"),
        "itype": get_or_empty_string(item, "itype"),
        "category": get_or_empty_string(item, "category"),
        "deposit": get_or_zero(item, "deposit"),
        "parts": get_or_empty_string(item, "parts"),
        "manual": get_or_empty_string(item, "manual"),
        "package": get_or_empty_string(item, "package"),
        "added": parse_int_or_zero(item, "added"),
        "status": get_or_empty_string(item, "status_on_website"),
        "wc_url": get_or_empty_string(item, "wc_url"),
        "wc_id": get_or_empty_string(item, "wc_id"),
        "image": get_or_empty_string(item, "image"),
        "highlight": get_or_empty_string(item, "highlight"),
        "synonyms": get_or_empty_string(item, "synonyms"),
        "description": get_or_empty_string(item, "description"),
        "type": "item",
    })


for rental in client["rentals"]:
    if is_design_doc(rental): continue
    leihlokal_db.create_document({
        "image": get_or_empty_string(rental, "image"),
        "item_id": parse_int_or_zero(rental, "item_id"),
        "item_name": get_or_empty_string(rental, "item_name"),
        "customer_id": parse_int_or_zero(rental, "customer_id"),
        "customer_name": get_or_empty_string(rental, "name"),
        "rented_on": parse_int_or_zero(rental, "rented_on"),
        "extended_on": parse_int_or_zero(rental, "extended_on"),
        "to_return_on": parse_int_or_zero(rental, "to_return_on"),
        "returned_on": parse_int_or_zero(rental, "returned_on"),
        "passing_out_employee": get_or_empty_string(rental, "passing_out_employee"),
        "receiving_employee": get_or_empty_string(rental, "receiving_employee"),
        "deposit": parse_int_or_zero(rental, "deposit"),
        "deposit_returned": parse_int_or_zero(rental, "deposit_returned"),
        "remark": get_or_empty_string(rental, "remark"),
        "type": "rental"
    })
