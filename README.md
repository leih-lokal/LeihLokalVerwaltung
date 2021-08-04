# [Demo](https://leih-lokal.github.io/LeihLokalVerwaltung/demo)

Klickt hier um die Software in einer Demo zu sehen: [Demo](https://leih-lokal.github.io/LeihLokalVerwaltung/demo)

[<img src="https://user-images.githubusercontent.com/14980558/128120460-9812a75d-64fb-4f69-b305-d283aa9f5bc3.gif" width="700">](https://leih-lokal.github.io/LeihLokalVerwaltung/demo)

![Tests](https://github.com/leih-lokal/LeihLokalVerwaltung/workflows/Test,%20Build%20and%20Deploy/badge.svg)

# LeihLokalVerwaltung

Easy management of products, rentals and customers

![Architecture](architecture.png)

## Local Setup

### Requirements

- [npm](https://github.com/npm/cli)
- [Docker](https://www.docker.com/) (required only when testing with real database)
- [Docker Compose](https://docs.docker.com/compose/install/) (required only when testing with real database)

### Setup

- Run `cd Frontend && npm install`
- Optional: Run `docker-compose up`. This will start a local instance of [CouchDb](https://couchdb.apache.org/) and insert some test data. Not required for demo mode.

### Running the demo

This will build and start the application in demo mode. This does not require a database and displays test data.

    cd Frontend && npm run build && npm run demo

### Running in dev mode

In dev mode, the application rebuilds automatically on file changes.

    npm run dev

To run without a database connection use:

    npm run dev:mock_db

To run without a WooCommerce connection use:

    npm run dev:mock_wc

To run without a WooCommerce and Database connection use:

    npm run dev:mock_all
