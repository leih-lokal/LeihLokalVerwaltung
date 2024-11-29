import Database from "../../database/ENV_DATABASE";

export default {
    // this function allows to either block entire data table loading by returning a pending promise
    // or return immediately, but resolve individual values asynchronously instead
    async onDataLoaded(data) {
        const rentalCountResolvers = data.map(() => Promise.withResolvers())

        async function fetchAll() {
          const allRentals = await Database.getRentalsByEntity('item', data.map(i => i.id), ['item_id'])
          const counts = Database.countByKey(allRentals, 'item_id')
          data.forEach((e, i) => rentalCountResolvers[i].resolve(counts[e.id] || 0))
        }

        fetchAll()  // intentionally not awaited!

        data.forEach((e, i) => {
          e.rental_count = rentalCountResolvers[i].promise
        })
        return data
    }
}