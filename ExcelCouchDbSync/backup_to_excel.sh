export COUCHDB_USER=user
export COUCHDB_PASSWORD=password
export COUCHDB_HOST=http://127.0.0.1:5984

mkdir -p /home/pi/backups
python3 /home/pi/LeihLokalVerwaltung/ExcelCouchDbSync/couchdb_to_excel.py /home/pi/backups/backup_$(date +%F_%H:%M:%S) > /home/pi/backups/backup_$(date +%F_%H:%M:%S).log 2>&1

# delete backups older than 30 days
find /home/pi/backups -type f -mtime +30 -exec rm -f {} \;