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

# wait for testdata
i=0
while ! curl http://${user}:${password}@${host}:5984/${database} | grep "\"doc_count\":300" > /dev/null;
do
    if [[ "$i" -gt 29 ]]; then
        echo "timed out while waiting for testdata after 30s!"
        exit 1
    fi
    sleep 1
    echo "waiting for testdata..."
    ((i=i+1))
done

echo "testdata in db!"