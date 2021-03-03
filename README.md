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

- Run `cd Frontend && npm install`
- For running the application other than in the demo mode, proceed additionally with 
	1. In `docker-compose.yml`, add the path to your local excel file (replace `<LOCAL_EXCEL_FILE>` with the absolute path) and insert your WooCommerce key and secret
	2. Run `docker-compose up` and wait for the excel_to_couchdb container to terminate

### Run

Just the demo

    cd Frontend && npm run demo

or the real build

    cd Frontend && npm run build && npm run start

or the dev build

    cd Frontend && npm run dev
