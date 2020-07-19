from dataclasses import dataclass, field
import datetime
from typing import Optional
from customer import Customer

@dataclass
class Rental:

    item_id: int
    item_name: str
    rented_on: datetime.date
    extended_on: datetime.date
    to_return_on: datetime.date
    passing_out_employee: str
    customer_id: int
    name: str
    deposit: int
    deposit_returned: int
    returned_on: datetime.date
    receiving_employee: str
    deposit_retained: int
    deposit_retainment_reason: str
    remark: str
    customer: Optional[Customer] = field(repr=False)
    rev: str = None

    def __repr__(self):
        return f'customer {self.customer_id} -> item {self.item_id}: {self.rented_on} -> {self.to_return_on}'

    def get_id(self):
        return str(hash(str(self.item_id) + str(self.rented_on) + str(self.customer_id)))

    def set_rev(self, rev):
        self.rev = rev

    def items(self):
        def _format_date(date):
            if type(date) is datetime.date:
                return str(date)
            return ""

        def _format_int(x):
            try:
                return int(x)
            except:
                return 0

        document = {
            '_id': self.get_id(),
            'item_id': str(self.item_id),
            'item_name': str(self.item_name),
            'rented_on': _format_date(self.rented_on),
            'extended_on': _format_date(self.extended_on),
            'to_return_on': _format_date(self.to_return_on),
            'passing_out_employee': str(self.passing_out_employee),
            'customer_id': str(self.customer_id),
            'name': str(self.name),
            'deposit': _format_int(self.deposit),
            'deposit_returned': _format_int(self.deposit_returned),
            'returned_on': _format_date(self.returned_on),
            'receiving_employee': str(self.receiving_employee),
            'deposit_retained': _format_int(self.deposit_retained),
            'deposit_retainment_reason': str(self.deposit_retainment_reason),
            'remark': str(self.remark)
        }

        if self.rev is not None:
            document['_rev'] = self.rev

        return document