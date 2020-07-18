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
    def __repr__(self):
        return f'{self.item_id}: {self.item_name} ({self.deposit}€)'