# LeihLokalVerwaltung

Easy management of products, rentals and customers. Feel free to use it! Let us know what can be improved! Please contact us if you want to set this up for your Leihladen, we'll help you install it, and write an how-to as a by-product (currently we didn't have time to write a user-friendly documentation, as there was no need yet).

The only thing you need to get this running is CouchDB. This can be either installed locally on a main laptop, or on a network server. Additionally, if you want the current status being displayed to the public, you need a website with WordPress and WooCommerce as a frontend.

you can contact us via `leihlokal (ät) buergerstiftung-karlsruhe.de`


# [Demo](https://leih-lokal.github.io/LeihLokalVerwaltung/demo)

Klickt hier um die Software in einer Demo zu sehen: [Demo](https://leih-lokal.github.io/LeihLokalVerwaltung/demo)

[<img src="https://user-images.githubusercontent.com/14980558/128120460-9812a75d-64fb-4f69-b305-d283aa9f5bc3.gif" width="800">](https://leih-lokal.github.io/LeihLokalVerwaltung/demo)

![Tests](https://github.com/leih-lokal/LeihLokalVerwaltung/workflows/Test,%20Build%20and%20Deploy/badge.svg)

## Architecture
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
