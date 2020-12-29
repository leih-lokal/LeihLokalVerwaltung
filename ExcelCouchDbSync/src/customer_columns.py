from utils import *

CUSTOMER_COLUMNS = {
    "_id": {
        "excel_to_db_transform": str,
        "excel_title": "Nr.",
        "excel_column_index": 0
    },
    "lastname": {
        "excel_to_db_transform": str,
        "excel_title": "Nachname",
        "excel_column_index": 1
    },
    "firstname": {
        "excel_to_db_transform": str,
        "excel_title": "Vorname",
        "excel_column_index": 2
    },
    "registration_date": {
        "excel_to_db_transform": parse_date,
        "db_to_excel_transform": millis_to_date_string,
        "excel_title": "Perso kopiert am",
        "excel_column_index": 3
    },
    "renewed_on": {
        "excel_to_db_transform": parse_date,
        "db_to_excel_transform": millis_to_date_string,
        "excel_title": "Verlängert am",
        "excel_column_index": 4
    },
    "remark": {
        "excel_to_db_transform": str,
        "excel_title": "Bemerkung",
        "excel_column_index": 5
    },
    "subscribed_to_newsletter": {
        "excel_to_db_transform": parse_bool,
        "db_to_excel_transform": bool_to_string,
        "excel_title": "Newsletter",
        "excel_column_index": 6
    },
    "email": {
        "excel_to_db_transform": str,
        "excel_title": "Mailadresse",
        "excel_column_index": 7
    },
    "street": {
        "excel_to_db_transform": str,
        "excel_title": "Straße",
        "excel_column_index": 8
    },
    "house_number": {
        "excel_to_db_transform": parse_int,
        "excel_title": "H.-Nr.",
        "excel_column_index": 9
    },
    "postal_code": {
        "excel_to_db_transform": str,
        "excel_title": "PLZ",
        "excel_column_index": 10
    },
    "city": {
        "excel_to_db_transform": str,
        "excel_title": "Stadt",
        "excel_column_index": 11
    },
    "telephone_number": {
        "excel_to_db_transform": str,
        "excel_title": "Telefon",
        "excel_column_index": 12
    },
    "heard": {
        "excel_to_db_transform": str,
        "excel_title": "aufmerksam durch",
        "excel_column_index": 15
    },
}