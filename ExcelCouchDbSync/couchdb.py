from couchdb2 import Server, NotFoundError
import os


class CouchDb:

    def __init__(self):
        self.server = Server(href=os.environ['COUCHDB_URL'], username=os.environ['COUCHDB_USER'], password=os.environ['COUCHDB_PASSWORD'],
                             use_session=True, ca_file=None)
        if not self.server.up():
            raise Exception("Failed to connect to CouchDB Server!")

    def _get_or_create_db(self, name):
        try:
            return self.server.get(name, check=True)
        except NotFoundError:
            return self.server.create(name)

    def _get_by_id(self, documents, id):
        return next(filter(lambda x: x is not None and x['_id'] == id, documents), None)

    def update(self, db_name, documents):
        db = self._get_or_create_db(db_name)

        # fetch currently stored revisions from db
        ids = list(map(lambda x: x.get_id(), documents))
        last_revisions = db.get_bulk(ids)

        # set current revisions for all documents
        if last_revisions is not None:
            for document in documents:
                last_revision = self._get_by_id(last_revisions, document.get_id())
                if last_revision is not None:
                    document.set_rev(last_revision['_rev'])

        return db.update(documents)

