FROM curlimages/curl:7.76.0

COPY insert_testdata.sh .
COPY wait_for_testdata.sh .
COPY testdata.json .

CMD [ "sh", "./insert_testdata.sh" ]