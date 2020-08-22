import datetime
import hashlib
from dataclasses import dataclass, field
from typing import Optional
from .customer import Customer

@dataclass
class Rental:

    item_id: str
    item_name: str
    rented_on: datetime.date
    extended_on: datetime.date
    to_return_on: datetime.date
    passing_out_employee: str
    customer_id: int
    name: str
    deposit: str
    deposit_returned: str
    returned_on: datetime.date
    receiving_employee: str
    deposit_retained: str
    deposit_retainment_reason: str
    remark: str
    customer: Optional[Customer] = field(repr=False)
    rev: str = None

    def __repr__(self):
        return f'customer {self.customer_id} -> item {self.item_id}: {self.rented_on} -> {self.to_return_on}'

    def get_id(self):
        def date_to_string(date):
            if isinstance(date, datetime.date):
                return date.strftime("%d.%m.%Y")
            return str(date)

        m = hashlib.md5()
        m.update(str(self.item_id).encode('utf-8'))
        m.update(date_to_string(self.rented_on).encode('utf-8'))
        m.update(str(self.customer_id).encode('utf-8'))
        return m.hexdigest()

    def set_rev(self, rev):
        self.rev = rev

    def items(self):
        def date_to_timestamp(date):
            if isinstance(date, datetime.date):
                return datetime.datetime(date.year, date.month, date.day).timestamp()
            return 0

        document = {
            '_id': self.get_id(),
            'item_id': str(self.item_id),
            'item_name': str(self.item_name),
            'rented_on': date_to_timestamp(self.rented_on),
            'extended_on': date_to_timestamp(self.extended_on),
            'to_return_on': date_to_timestamp(self.to_return_on),
            'passing_out_employee': str(self.passing_out_employee),
            'customer_id': str(self.customer_id),
            'name': str(self.name),
            'deposit': str(self.deposit),
            'deposit_returned': str(self.deposit_returned),
            'returned_on': date_to_timestamp(self.returned_on),
            'receiving_employee': str(self.receiving_employee),
            'deposit_retained': str(self.deposit_retained),
            'deposit_retainment_reason': str(self.deposit_retainment_reason),
            'remark': str(self.remark)
        }

        if self.rev is not None:
            document['_rev'] = self.rev

        return document