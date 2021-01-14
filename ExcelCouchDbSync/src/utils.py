import datetime
import pytz as pytz
from dateutil import parser

def parse_int(value):
    try:
        value = str(value).lower().replace(" eur", "")
        return int(value)
    except (ValueError, TypeError):
        return 0

def parse_date(value):
    try:
        if isinstance(value, datetime.datetime):
            return value.replace(tzinfo=pytz.timezone("UTC")).timestamp() * 1000
        else:
            return parser.parse(str(value)).replace(tzinfo=pytz.timezone("UTC")).timestamp() * 1000
    except ValueError:
        return 0

def parse_bool(value):
    return "ja" in str(value).lower() or "true" in str(value).lower()

def parse_4_digit_id(value):
    value = str(value)
    while len(value) < 4: value = "0" + value
    return value

def millis_to_date_string(millis):
    try:
        int(millis)
    except:
        return ""
    if millis is None or int(millis) <= 0:
        return ""
    else:
        time = datetime.datetime.fromtimestamp(millis / 1000.0)
        return time.strftime('%d.%m.%Y')

def append_euro(value):
    if value is None or len(str(value).strip()) == 0 or value == 0:
        return ""
    else:
        return str(value) + " €"

def euro_to_int(value):
    return parse_int(str(value).replace("€", ""))

def bool_to_string(value):
    if value:
        return "Ja"
    else:
        return "Nein"

def is_design_doc(doc):
    return "_design" in doc["_id"]

