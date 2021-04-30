host="couchdb"

# delete database
curl -X DELETE http://user:password@${host}:5984/leihlokal

# create database
curl -X PUT http://user:password@${host}:5984/leihlokal

# insert testdata
curl -X POST -H "Content-type:application/json" http://user:password@${host}:5984/leihlokal/_bulk_docs -d @testdata.json