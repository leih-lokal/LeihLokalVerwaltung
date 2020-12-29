FROM python:3.8-slim

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src /src

ENV COUCHDB_USER user
ENV COUCHDB_PASSWORD password


CMD [ "python", "src/excel_to_couchdb.py" ]