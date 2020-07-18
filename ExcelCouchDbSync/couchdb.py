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

    def update(self, db_name, documents):
        db = self._get_or_create_db(db_name)
        db.update(documents)

