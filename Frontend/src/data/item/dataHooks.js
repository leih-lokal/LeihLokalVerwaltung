import { getApiClient } from '../../utils/api'
import { mapByKey } from "../../utils/utils";

const apiClient = getApiClient()

export default {
  // this function allows to either block entire data table loading by returning a pending promise
  // or return immediately, but resolve individual values asynchronously instead
  async onDataLoaded(data) {
    const rentalCountResolvers = data.map(() => Promise.withResolvers())

    async function fetchAll() {
      const counts = mapByKey(await apiClient.countItemRentals(data.map(i => i.id)))

      data.forEach((e, i) => rentalCountResolvers[i].resolve(counts[e.id]?.num_rentals || 0))
    }

    fetchAll()  // intentionally not awaited!

    data.forEach((e, i) => {
      e.rental_count = rentalCountResolvers[i].promise
    })
    return data
  }
}