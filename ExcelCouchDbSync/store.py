import traceback
from datetime import datetime
from typing import List, Dict, Callable

from customer import Customer
from item import Item
from rental import Rental
import pyexcel as pe


class Store:

    def __init__(self, customers: Dict[int, Customer], rentals: List[Rental],
                 items: List[Item]):
        self.customers = customers
        self.rentals = rentals
        self.items = items

    @classmethod
    def parse_file(cls, file: str) -> 'Store':
        return cls.parse(pe.get_book(file_name=file))

    @classmethod
    def parse(cls, sheet: pe.Book) -> 'Store':
        store = Store({}, [], {})
        store.customers = {row[0]: Customer(*row[:13]) for row in sheet.Kunden.array if str(row[0]).isdigit()
                           and len(row[2].strip()) > 0}
        store.items = {row[0]: Item(*row[:11]) for row in sheet.Gegenstände.array if str(row[0]).isdigit()
                       and len(row[1].strip()) > 0}

        for row in sheet.Leihvorgang.array:
            if str(row[6]).isdigit():
                customer = store.customers.get(int(row[6]), None)
                rental = Rental(*row[:15], customer=customer)
                if rental.item_id in store.items:
                    store.items[rental.item_id].n_rented += 1
                if customer is not None:
                    customer.rentals.append(rental)
                store.rentals.append(rental)
        return store

    def filter_customers(self, predicate: Callable[[Customer], bool]) -> List[Customer]:
        filtered = []
        for customer in self.customers.values():
            try:
                filter = predicate(customer)
                if filter:
                    filtered.append(customer)
            except Exception as e:
                traceback.print_exc()
                print(f'Error filtering customer {customer}: {e}')
        return filtered

    def filter_rentals(self, predicate: Callable[[Customer], bool]) -> List[Rental]:
        filtered = []
        for rental in self.rentals:
            try:
                filter = predicate(rental)
                if filter:
                    filtered.append(rental)
            except Exception as e:
                traceback.print_exc()
                print(f'Error filtering rental {rental}: {e}')
        return filtered

    def get_customers_for_deletion(self,
                                   min_full_started_days_since_last_contractual_interaction: int = 365) -> 'Store':
        filter = lambda c: (datetime.datetime.now().date() - c.last_contractual_interaction()).days \
                           >= min_full_started_days_since_last_contractual_interaction
        return self.filter_customers(filter)

    def get_overdue_reminders(self) -> List[Rental]:
        filter = lambda r: ((not 'datetime.datetime' in str(type(r.to_return_on))) and \
                            r.to_return_on < datetime.datetime.now().date() and \
                            not isinstance(r.returned_on, datetime.date))
        return self.filter_rentals(filter)

    def __repr__(self) -> str:
        return f"{len(self.items)}, items {len(self.customers)}, customers {len(self.rentals)} rentals"

    def empty(self) -> bool:
        return len(self.customers) == 0