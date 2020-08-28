import asyncio

from cloudant.client import CouchDB
import os
import logging

logger = logging.getLogger(__name__)

class CouchDb:

    def __init__(self):
        self.client = CouchDB(os.environ['COUCHDB_USER'], os.environ['COUCHDB_PASSWORD'], url="http://" + os.environ['COUCHDB_HOST'], connect=True, auto_renew=True)

    def _changes_since(self, db, since=0):
        changes = db.changes(since=since)
        changes_count = 0
        for change in changes:
            changes_count += 1
        return changes.last_seq

    async def monitor_changes(self, db_name, callback):
        self.client.create_database(db_name)
        db = self.client[db_name]
        last_seq = 0

        while True:
            await asyncio.sleep(0)
            seq = self._changes_since(db, last_seq)
            if seq != last_seq:
                last_seq = seq
                callback()

    def db(self, db_name):
        return self.client[db_name]

    def excel_to_db(self, db_name, excel_rows):
        """
        Writes all excel_rows to the database. All documents in excel_rows that previously existed in the database are updated.
        All documents that previously existed in the database but not in excel_rows are deleted.
        :param db_name:
        :param excel_rows:
        :return:
        """

        def excel_row_by_id(documents, id):
            return next(filter(lambda x: x is not None and x.get_id() == id, documents), None)

        # ensure db exists
        self.client.create_database(db_name)
        db = self.client[db_name]

        # fetch already existing row ids from db
        db_ids = db.keys(remote=True)

        # fetch ids from excel
        excel_ids = list(map(lambda x: x.get_id(), excel_rows))

        ids_to_eventually_update = list(set(db_ids) & set(excel_ids))
        ids_to_delete = list(set(db_ids) - set(excel_ids))
        ids_to_create = list(set(excel_ids) - set(db_ids))

        logger.debug("Ids to eventually be updated: " + str(ids_to_eventually_update))
        logger.debug("Ids to be deleted: " + str(ids_to_delete))
        logger.debug("Ids to be created: " + str(ids_to_create))

        count_updated = 0

        for id in ids_to_eventually_update:
            excel_row = excel_row_by_id(excel_rows, id).items()
            db_doc = db[id]
            equal = True
            for key in excel_row.keys():
                if key not in db_doc or db_doc[key] != excel_row[key]:
                    db_doc[key] = excel_row[key]
                    equal = False

            if not equal:
                db_doc.save()
                count_updated += 1
                logger.debug("updated document with id %s in db" % id)

        for id in ids_to_delete:
            db[id].delete()
            logger.debug("deleted document with id %s in db" % id)

        for id in ids_to_create:
            db.create_document(excel_row_by_id(excel_rows, id).items())
            logger.debug("created document with id %s in db" % id)

        logger.info("Updated %s documents" % count_updated)
        logger.info("Deleted %s documents" % len(ids_to_delete))
        logger.info("Created %s documents" % len(ids_to_create))
