#!/bin/bash

i=0

while ! curl http://user:password@127.0.0.1:5984/leihlokal | grep "\"doc_count\":300" > /dev/null;
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