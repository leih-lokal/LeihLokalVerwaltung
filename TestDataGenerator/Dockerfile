FROM curlimages/curl:7.76.0

COPY insert_testdata.sh .
COPY testdata.json .
COPY wait_for_testdata.sh .

CMD [ "sh", "./insert_testdata.sh" ]