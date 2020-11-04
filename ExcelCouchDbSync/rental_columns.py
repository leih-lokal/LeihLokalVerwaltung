from utils import *

RENTAL_COLUMNS = {
    "item_id": {
        "excel_to_db_transform": parse_4_digit_id,
        "excel_title": "Nr.",
        "excel_column_index": 0
    },
    "item_name": {
        "excel_to_db_transform": str,
        "excel_title": "Gegenstand-Name",
        "excel_column_index": 1
    },
    "rented_on": {
        "excel_to_db_transform": parse_date,
        "db_to_excel_transform": millis_to_date_string,
        "excel_title": "ausgegeben am",
        "excel_column_index": 2
    },
    "extended_on": {
        "excel_to_db_transform": parse_date,
        "db_to_excel_transform": millis_to_date_string,
        "excel_title": "verlängert am",
        "excel_column_index": 3
    },
    "to_return_on": {
        "excel_to_db_transform": parse_date,
        "db_to_excel_transform": millis_to_date_string,
        "excel_title": "Rückgabe am",
        "excel_column_index": 4
    },
    "passing_out_employee": {
        "excel_to_db_transform": str,
        "excel_title": "Mitarbeiter",
        "excel_column_index": 5
    },
    "customer_id": {
        "excel_to_db_transform": str,
        "excel_title": "Kunde-Nr",
        "excel_column_index": 6
    },
    "name": {
        "excel_to_db_transform": str,
        "excel_title": "Name",
        "excel_column_index": 7
    },
    "deposit": {
        "excel_to_db_transform": parse_int,
        "db_to_excel_transform": append_euro,
        "excel_title": "Pfand",
        "excel_column_index": 8
    },
    "deposit_returned": {
        "excel_to_db_transform": parse_int,
        "db_to_excel_transform": append_euro,
        "excel_title": "Pfand zurück",
        "excel_column_index": 9
    },
    "returned_on": {
        "excel_to_db_transform": parse_date,
        "db_to_excel_transform": millis_to_date_string,
        "excel_title": "zurückgegeben am",
        "excel_column_index": 10
    },
    "receiving_employee": {
        "excel_to_db_transform": str,
        "excel_title": "Mitarbeiter",
        "excel_column_index": 11
    },
    "deposit_retained": {
        "excel_to_db_transform": parse_int,
        "db_to_excel_transform": append_euro,
        "excel_title": "Pfand einbehalten",
        "excel_column_index": 12
    },
    "deposit_retainment_reason": {
        "excel_to_db_transform": str,
        "excel_title": "Grund",
        "excel_column_index": 13
    },
    "remark": {
        "excel_to_db_transform": str,
        "excel_title": "Bemerkung",
        "excel_column_index": 14
    },
}