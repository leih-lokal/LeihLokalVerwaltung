host="couchdb"

# delete database
curl -X DELETE http://user:password@${host}:5984/leihlokal_test

# create database
curl -X PUT http://user:password@${host}:5984/leihlokal_test

# insert testdata
curl -X POST -H "Content-type:application/json" http://user:password@${host}:5984/leihlokal_test/_bulk_docs -d @testdata.json