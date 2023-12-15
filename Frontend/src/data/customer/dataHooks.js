import Database from "../../database/ENV_DATABASE";
import { activeRentalsForCustomerSelector } from "../selectors";

export default {
    async onDataLoaded(data) {
        const rentalCountSelectors = {$or: data.map(c => ({$and: [{ customer_id: c.id, type: "rental" }]}))}

        const allRentals = await Database.fetchAllDocsBySelector(rentalCountSelectors, ['customer_id', 'returned_on'])
        const activeRentals = allRentals.filter(r => r.returned_on === 0)

        const allRentalsCount = Database.countByKey(allRentals, 'customer_id')
        const activeRentalsCount = Database.countByKey(activeRentals, 'customer_id')

        data.forEach(c => {
          c.rental_count = allRentalsCount[c.id] || 0
          c.active_rental_count = activeRentalsCount[c.id] || 0
        })
        return data
  }
}