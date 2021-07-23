host="couchdb"
database="leihlokal_test"
user="user"
password="password"

# delete database
curl -X DELETE http://${user}:${password}@${host}:5984/${database}

# create database
curl -X PUT http://${user}:${password}@${host}:5984/${database}

# insert testdata
curl -X POST -H "Content-type:application/json" http://${user}:${password}@${host}:5984/${database}/_bulk_docs -d @testdata.json

sh ./wait_for_testdata.sh $host