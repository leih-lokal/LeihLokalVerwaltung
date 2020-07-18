import traceback
from typing import List
import datetime
from dataclasses import dataclass, field


@dataclass
class Customer:
    id: int
    lastname: str
    firstname: str
    registration_date: datetime.date
    renewed_on: datetime.date
    remark: str
    subscribed_to_newsletter: bool
    email: str
    street: str
    house_number: int
    postal_code: int
    city: str
    telephone_number: str
    rentals: List['Rental'] = field(default_factory=list, repr=False)

    def last_contractual_interaction(self) -> datetime.date:
        try:
            registration = self.registration_date if self.registration_date else datetime.date.fromtimestamp(0)
            renewed = self.renewed_on if self.renewed_on else registration
            rented = [rental.rented_on for rental in self.rentals]
            returned = [rental.returned_on for rental in self.rentals]
            all_dates = rented + returned + [registration, renewed]
            all_dates = [d if type(d) is datetime.date else d.date() for d in all_dates if not isinstance(d, str)]
            date = max(all_dates)
        except Exception as e:
            traceback.print_exc()
            print(self, e)
            return registration
        return date

    def short(self) -> str:
        return f'{self.firstname} {self.lastname} ({self.id})'

    def __repr__(self):
        return f'{self.id}: {self.firstname} {self.lastname} ({self.email}, {self.telephone_number})'

    def __str__(self):
        return f'{self.id}: {self.firstname} {self.lastname} ({self.email}, {self.telephone_number})'

    def items(self):
        def _format_date(date):
            if type(date) is datetime.date:
                return date.strftime("%d.%m.%Y")
            return ""

        def _format_bool(x):
            if type(x) is bool:
                return x
            return False

        return {
            '_id': str(self.id),
            'lastname': str(self.lastname),
            'firstname': str(self.firstname),
            'registration_date': _format_date(self.registration_date),
            'renewed_on': _format_date(self.renewed_on),
            'remark': str(self.remark),
            'subscribed_to_newsletter': _format_bool(self.subscribed_to_newsletter),
            'email': str(self.email),
            'street': str(self.street),
            'house_number': str(self.house_number),
            'postal_code': str(self.postal_code),
            'city': str(self.city),
            'telephone_number': str(self.telephone_number)
        }