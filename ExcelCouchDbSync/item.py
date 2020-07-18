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


    def items(self):
        def _format_date(date):
            if type(date) is datetime.date:
                return date.strftime("%d.%m.%Y")
            return ""

        def _format_bool(x):
            if type(x) is bool:
                return x
            return False

        def _format_int(x):
            try:
                return int(x)
            except:
                return 0

        return {
            '_id': str(self.item_id),
            'item_name': str(self.item_name),
            'brand': str(self.brand),
            'itype': str(self.itype),
            'category': str(self.category),
            'deposit': _format_int(self.deposit),
            'parts': _format_int(self.parts),
            'manual': _format_bool(self.manual),
            'package': str(self.package),
            'added': _format_date(self.added),
            'properties': str(self.properties),
            'n_rented': _format_int(self.n_rented)
        }