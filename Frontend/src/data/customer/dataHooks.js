import Database from "../../database/ENV_DATABASE";
import { activeRentalsForCustomerSelector } from "../selectors";

export default {
    // this function allows to either block entire data table loading by returning a pending promise
    // or return immediately, but resolve individual values asynchronously instead
    async onDataLoaded(data) {
        const rentalCountResolvers = data.map(() => Promise.withResolvers())
        const activeRentalCountResolvers = data.map(() => Promise.withResolvers())

        async function fetchAll() {
          const rentalCountSelectors = {$or: data.map(c => ({$and: [{ customer_id: c.id, type: "rental" }]}))}

          const allRentals = await Database.fetchAllDocsBySelector(rentalCountSelectors, ['customer_id', 'returned_on'])
          const activeRentals = allRentals.filter(r => r.returned_on === 0)
  
          const allRentalsCount = Database.countByKey(allRentals, 'customer_id')
          const activeRentalsCount = Database.countByKey(activeRentals, 'customer_id')

          data.forEach((e, i) => {
            rentalCountResolvers[i].resolve(allRentalsCount[e.id] || 0)
            activeRentalCountResolvers[i].resolve(activeRentalsCount[e.id] || 0)
          })
        }

        fetchAll()  // intentionally not awaited!

        data.forEach((e, i) => {
          e.rental_count = rentalCountResolvers[i].promise
          e.active_rental_count = activeRentalCountResolvers[i].promise
        })
        return data
  }
}