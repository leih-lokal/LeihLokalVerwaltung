import Database from "../../database/ENV_DATABASE";

export default {
    async onDataLoaded(data) {
        const rentalCountSelectors = data.map(c => ({$and: [{ item_id: c.id, type: "rental" }]}))
      
        const counts = await Database.countDocsBatch(rentalCountSelectors, 'item_id')
        data.forEach(c => {
          c.rental_count = counts[c.id] || 0
        })
        return data
    }
}