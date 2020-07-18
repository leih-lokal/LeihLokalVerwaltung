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
    receiving_employee: datetime.date
    deposit_retained: int
    deposit_retainment_reason: str
    remark: str
    customer: Optional[Customer] = field(repr=False)

    def __repr__(self):
        return f'customer {self.customer_id} -> item {self.item_id}: {self.rented_on} -> {self.to_return_on}'