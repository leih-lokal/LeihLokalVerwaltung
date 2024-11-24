import Database from "../../database/ENV_DATABASE";

export default {
    // this function allows to either block entire data table loading by returning a pending promise
    // or return immediately, but resolve individual values asynchronously instead
    async onDataLoaded(data) {
        const rentalCountResolvers = data.map(() => Promise.withResolvers())

        async function fetchAll() {
          const rentalCountSelectors = data.map(c => ({$and: [{ item_id: c.id, type: "rental" }]}))
          const counts = await Database.countDocsBatch(rentalCountSelectors, 'item_id')
          data.forEach((e, i) => rentalCountResolvers[i].resolve(counts[e.id] || 0))
        }

        fetchAll()  // intentionally not awaited!

        data.forEach((e, i) => {
          e.rental_count = rentalCountResolvers[i].promise
        })
        return data
    }
}