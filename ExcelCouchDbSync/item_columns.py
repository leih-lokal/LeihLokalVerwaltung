from utils import *

ITEM_COLUMNS = {
    "_id": {
        "excel_to_db_transform": str,
        "excel_title": "Nr",
        "excel_column_index": 0
    },
    "item_name": {
        "excel_to_db_transform": str,
        "excel_title": "Gegenstand",
        "excel_column_index": 1
    },
    "brand": {
        "excel_to_db_transform": str,
        "excel_title": "Marke",
        "excel_column_index": 2
    },
    "itype": {
        "excel_to_db_transform": str,
        "excel_title": "Typbezeichnung",
        "excel_column_index": 3
    },
    "category": {
        "excel_to_db_transform": str,
        "excel_title": "Bereich",
        "excel_column_index": 4
    },
    "deposit": {
        "excel_to_db_transform": parse_int,
        "db_to_excel_transform": append_euro,
        "excel_title": "Pfandklasse",
        "excel_column_index": 5
    },
    "parts": {
        "excel_to_db_transform": str,
        "excel_title": "Anzahl Teile",
        "excel_column_index": 6
    },
    "manual": {
        "excel_to_db_transform": str,
        "excel_title": "Bedienungsanleitung",
        "excel_column_index": 7
    },
    "package": {
        "excel_to_db_transform": str,
        "excel_title": "Verpackung",
        "excel_column_index": 8
    },
    "added": {
        "excel_to_db_transform": parse_date,
        "db_to_excel_transform": millis_to_date_string,
        "excel_title": "erfasst am",
        "excel_column_index": 9
    },
    "properties": {
        "excel_to_db_transform": str,
        "excel_title": "Eigenschaften",
        "excel_column_index": 10
    },
}