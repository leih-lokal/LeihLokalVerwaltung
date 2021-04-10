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

- Run `docker-compose up`. This will start a local instance of [CouchDb](https://couchdb.apache.org/) with some test data. Not required for demo mode.
- Run `cd Frontend && npm install`

### Run

    cd Frontend && npm run build && npm run start

dev mode

    cd Frontend && npm run dev

- auto rebuilds on file changes
- does not connect to WooCommerce

demo mode

    cd Frontend && npm run demo

- does not connect to WooCommerce or CouchDB
