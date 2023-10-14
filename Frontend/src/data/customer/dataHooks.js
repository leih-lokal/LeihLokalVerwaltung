import Database from "../../database/ENV_DATABASE";
import { activeRentalsForCustomerSelector } from "../selectors";

export default {
    async onDataLoaded(data) {
        const rentalCountSelectors = data.map(c => ({$and: [{ customer_id: c.id, type: "rental" }]}))
        const activeRentalCountSelectors = data.map(c => activeRentalsForCustomerSelector(c.id))
    
        const results = await Promise.all([
          Database.countDocsBatch(rentalCountSelectors, 'customer_id'),
          Database.countDocsBatch(activeRentalCountSelectors, 'customer_id'),
        ])
        data.forEach(c => {
          c.rental_count = results[0][c.id] || 0
          c.active_rental_count = results[1][c.id] || 0
        })
        return data
  }
}