#!/bin/bash
host=${1:-"127.0.0.1"}
database="leihlokal_test"
user="user"
password="password"

i=0
response=""

while ! echo $response | grep "\"doc_count\":300";
do
    response=$(curl -s http://${user}:${password}@${host}:5984/${database})
    echo $response
    if [[ "$i" -gt 29 ]]; then
        echo "timed out while waiting for testdata after 30s!"
        exit 1
    fi
    sleep 1
    echo "waiting for testdata..."
    ((i=i+1))
done

echo "testdata in db!"