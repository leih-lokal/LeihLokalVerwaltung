from dataclasses import dataclass
import datetime

@dataclass
class Item:
    item_id: int
    item_name: str
    brand: str
    itype: str
    category: str
    deposit: int
    parts: int
    manual: bool
    package: str
    added: datetime.date
    properties: str
    n_rented:int = 0
    rev: str = None

    def __repr__(self):
        return f'{self.item_id}: {self.item_name} ({self.deposit}€)'

    def get_id(self):
        return str(self.item_id)

    def set_rev(self, rev):
        self.rev = rev

    def items(self):
        document = {
            '_id': self.get_id(),
            'item_name': str(self.item_name),
            'brand': str(self.brand),
            'itype': str(self.itype),
            'category': str(self.category),
            'deposit': str(self.deposit),
            'parts': str(self.parts),
            'manual': str(self.manual),
            'package': str(self.package),
            'added': str(self.added),
            'properties': str(self.properties),
            'n_rented': str(self.n_rented)
        }

        if self.rev is not None:
            document['_rev'] = self.rev

        return document