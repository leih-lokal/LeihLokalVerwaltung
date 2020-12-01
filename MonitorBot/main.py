import os
import requests
import re
import pickle
import telegram

telegram_bot = telegram.Bot(os.environ['TELEGRAM_BOT_TOKEN'])
COUCHDB_URLS=os.environ['COUCHDB_URLS'].split(",")
IGNORE_CONNECT_EXCEPTION_URLS=os.environ['IGNORE_CONNECT_EXCEPTION_URLS'].split(",")
session = requests.Session()
session.auth = (os.environ['COUCHDB_USER'], os.environ['COUCHDB_PASSWORD'])
errors_to_report = []

def get_error_count_for_url(url, default):
    try:
        response = session.get(url=f'{url}/_node/_local/_stats/', timeout=5)
        response.raise_for_status()
        response = response.json()
        return response["couch_log"]["level"]["error"]["value"]
    except Exception as e:
        if url in IGNORE_CONNECT_EXCEPTION_URLS:
            return default
        else:
            e_string = re.sub(r"<.* object at 0x.*>", "", str(e))
            errors_to_report.append(f"<b>Failed to get stats for CouchDB {url}</b>{os.linesep}{e_string}")
            return default

def load_prev():
    counts = {}
    if os.path.isfile("state.p"):
        counts = pickle.load( open( "state.p", "rb" ) )
    for url in COUCHDB_URLS:
        if url not in counts:
            counts[url] = 0
    return counts

def compare(prev, current):
    for url in COUCHDB_URLS:
        error_count_diff = current[url] - prev[url]
        if error_count_diff > 0:
            errors_to_report.append(f"<b>CouchDB {url} logged {error_count_diff} new errors!</b>")

def filter_already_reported_errors(errors_to_report):
    prev_reported_errors = []
    if os.path.isfile("reported_errors.p"):
        prev_reported_errors = pickle.load( open( "reported_errors.p", "rb" ) )
    prev_reported_errors = list(filter(lambda error: error in errors_to_report, prev_reported_errors))
    errors_to_report = list(filter(lambda error: error not in prev_reported_errors, errors_to_report))
    prev_reported_errors += errors_to_report
    pickle.dump(prev_reported_errors, open("reported_errors.p", "wb"))
    return errors_to_report


if __name__ == '__main__':
    counts_prev = load_prev()
    counts = {}
    for url in COUCHDB_URLS:
        counts[url] = get_error_count_for_url(url, counts_prev[url])

    compare(counts_prev, counts)
    pickle.dump(counts, open("state.p", "wb"))
    errors_to_report = filter_already_reported_errors(errors_to_report)
    for error_to_report in errors_to_report:
        telegram_bot.send_message(os.environ['TELEGRAM_CHAT_ID'], error_to_report, "HTML")

