from typing import List
import datetime
from dataclasses import dataclass, field


@dataclass
class Customer:
    id: str
    lastname: str
    firstname: str
    registration_date: datetime.date
    renewed_on: datetime.date
    remark: str
    subscribed_to_newsletter: str
    email: str
    street: str
    house_number: str
    postal_code: str
    city: str
    telephone_number: str
    heard: str
    rentals: List['Rental'] = field(default_factory=list, repr=False)
    rev: str = None

    def short(self) -> str:
        return f'{self.firstname} {self.lastname} ({self.id})'

    def __repr__(self):
        return f'{self.id}: {self.firstname} {self.lastname} ({self.email}, {self.telephone_number})'

    def __str__(self):
        return f'{self.id}: {self.firstname} {self.lastname} ({self.email}, {self.telephone_number})'

    def get_id(self):
        return str(self.id)

    def set_rev(self, rev):
        self.rev = rev

    def items(self):
        def date_to_timestamp(date):
            if isinstance(date, datetime.date):
                return datetime.datetime(date.year, date.month, date.day).timestamp()
            return 0

        document = {
            '_id': self.get_id(),
            'lastname': str(self.lastname),
            'firstname': str(self.firstname),
            'registration_date': date_to_timestamp(self.registration_date),
            'renewed_on': date_to_timestamp(self.renewed_on),
            'remark': str(self.remark),
            'subscribed_to_newsletter': str(self.subscribed_to_newsletter),
            'email': str(self.email),
            'street': str(self.street),
            'house_number': str(self.house_number),
            'postal_code': str(self.postal_code),
            'city': str(self.city),
            'telephone_number': str(self.telephone_number),
            'heard': str(self.heard)
        }

        if self.rev is not None:
            document['_rev'] = self.rev

        return document