import os
from store import Store

if __name__ == '__main__':
    print('Lade Datenbank...')
    store = Store.parse_file(os.environ['EXCEL_FILE'])
    print('fertig')