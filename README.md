# [Demo](https://leih-lokal.github.io/LeihLokalVerwaltung/demo)

![Tests](https://github.com/leih-lokal/LeihLokalVerwaltung/workflows/Test,%20Build%20and%20Deploy/badge.svg)

# LeihLokalVerwaltung

Easy management of products, rentals and customers

![Architecture](architecture.png)

## Local Setup

### Requirements

- [npm](https://github.com/npm/cli)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Setup

1. In `docker-compose.yml`, add the path to your local excel file and insert your WooCommerce key and secret
2. Run `docker-compose up` and wait for the excel_to_couchdb container to terminate
3. Run `cd Frontend && npm install`

### Run

    cd Frontend && npm run build && npm run start

or

    cd Frontend && npm run demo

or

    cd Frontend && npm run dev
