import os
from cloudant.client import CouchDB

client = CouchDB(os.environ['COUCHDB_USER'], os.environ['COUCHDB_PASSWORD'], url=os.environ['COUCHDB_HOST'], connect=True, auto_renew=True)

rental_db = client["rentals"]
customer_db = client["customers"]
rental_ids = rental_db.keys(remote=True)

active_rental_customer_ids = []
active_rental_customer_mails = []

for rental_id in rental_ids:
    if "returned_on" in rental_db[rental_id] and rental_db[rental_id]["returned_on"] == 0:
        active_rental_customer_ids.append(rental_db[rental_id]["customer_id"])

for customer_id in active_rental_customer_ids:
    active_rental_customer_mails.append(customer_db[customer_id]["email"])


print(active_rental_customer_mails)